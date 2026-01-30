# 🔐 Secure Secret Management

This implementation provides a **cloud-free secret management system** using encrypted PostgreSQL storage, simulating AWS Secrets Manager / Azure Key Vault behavior.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Application (Next.js)                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Server Components / API Routes                  │   │
│  │  ↓                                                │   │
│  │  secretManager.getSecret('DATABASE_URL')         │   │
│  │  ↓                                                │   │
│  │  Decrypt with MASTER_KEY                         │   │
│  │  ↓                                                │   │
│  │  Return plaintext secret (in-memory only)        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Secret Table                                    │   │
│  │  key: "DATABASE_URL"                             │   │
│  │  value: "a1b2c3...:e5f6g7..." (AES-256 encrypted)│   │
│  │  environment: "production"                       │   │
│  │  rotatedAt: 2026-01-30T12:00:00Z                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Generate Master Encryption Key

```bash
# Generate a 32-byte (256-bit) master key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```env
MASTER_KEY=your_64_character_hex_key_here
```

⚠️ **CRITICAL**: 
- Never commit MASTER_KEY to version control
- Store in secure environment variables only
- Rotate periodically (90 days recommended)

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_secret_model
npx prisma generate
```

This creates the `Secret` table with:
- `key`: Unique identifier (e.g., "DATABASE_URL")
- `value`: AES-256-CBC encrypted secret
- `environment`: "development" | "production"
- `rotatedAt`: Last rotation timestamp

### 3. Seed Initial Secrets

```bash
# Edit scripts/seed-secrets.ts with your secrets
npx tsx scripts/seed-secrets.ts
```

⚠️ **DELETE `seed-secrets.ts` after running** (contains raw secrets)

### 4. Verify Secrets

```bash
npx tsx scripts/verify-secrets.ts
```

### 5. Test API

```bash
# Start dev server
npm run dev

# Test secret retrieval
curl http://localhost:3000/api/secrets-test
```

## Usage Examples

### Retrieve a Secret (Server-Side Only)

```typescript
import { getSecret } from '@/lib/secretManager';

// In API route
export async function GET() {
  const dbUrl = await getSecret('DATABASE_URL');
  // Use dbUrl for database connection
  // Never log or expose to client
}

// In Server Action
export async function connectToDatabase() {
  const connectionString = await getSecret('DATABASE_URL');
  return await db.connect(connectionString);
}
```

### Store/Update a Secret

```typescript
import { setSecret } from '@/lib/secretManager';

// Only in admin scripts or secure admin APIs
await setSecret('NEW_API_KEY', 'secret-value-123', 'production');
```

### List Secrets (Metadata Only)

```typescript
import { listSecrets } from '@/lib/secretManager';

const secrets = await listSecrets('production');
// Returns: [{ key: 'DATABASE_URL', environment: 'production', rotatedAt: ... }]
// ⚠️ Does NOT return decrypted values
```

## Security Features

### ✅ Encryption at Rest
- All secrets stored with AES-256-CBC encryption
- Initialization Vector (IV) randomized per secret
- Master key never stored in database

### ✅ Least Privilege
- Secrets only accessible server-side
- No client-side exposure
- Environment-specific isolation (dev/prod)

### ✅ Rotation Support
- `rotatedAt` timestamp tracks last rotation
- Easy rotation with `setSecret()` upsert
- Audit trail in database

### ✅ Fail-Secure
- Missing secrets throw errors (no silent failures)
- Decryption errors prevent application startup
- No fallback to hardcoded values

### ✅ Audit & Compliance
- All secret access logged (key names only)
- Metadata available for compliance reports
- No plaintext secrets in logs

## Security Best Practices

### DO ✅
- Store MASTER_KEY in environment variables only
- Rotate MASTER_KEY every 90 days
- Rotate secrets (API keys, passwords) regularly
- Use different keys per environment (dev/prod)
- Delete seed scripts after running
- Monitor secret access logs
- Backup encrypted secrets (database backups)

### DON'T ❌
- Never log decrypted secret values
- Never expose secrets to client-side code
- Never commit MASTER_KEY to version control
- Never hardcode secrets in application code
- Never store secrets in plain text
- Never reuse MASTER_KEY across environments
- Never return secrets in API responses

## File Structure

```
src/
├── utils/
│   └── crypto.ts              # AES-256-CBC encryption/decryption
├── lib/
│   └── secretManager.ts       # Secret retrieval service
└── app/
    └── api/
        └── secrets-test/
            └── route.ts       # Example API usage

scripts/
├── seed-secrets.ts            # One-time seeding (DELETE after use!)
└── verify-secrets.ts          # Verification script (safe to keep)

prisma/
└── schema.prisma              # Secret model definition
```

## Comparison with Cloud Services

| Feature | This Implementation | AWS Secrets Manager | Azure Key Vault |
|---------|---------------------|---------------------|-----------------|
| Cost | Free (self-hosted) | $0.40/secret/month | $0.03/10k operations |
| Encryption | AES-256-CBC | AES-256-GCM | AES-256 |
| Rotation | Manual (via script) | Automatic | Automatic |
| Access Control | Code-level | IAM policies | RBAC |
| Audit Logs | Database logs | CloudTrail | Monitor Logs |
| High Availability | Database HA | AWS managed | Azure managed |

## Troubleshooting

### Error: "MASTER_KEY environment variable is not set"
- Add MASTER_KEY to `.env` file
- Ensure 64 hex characters (32 bytes)

### Error: "MASTER_KEY must be 64 hex characters"
- Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Error: "Secret not found"
- Run verification script: `npx tsx scripts/verify-secrets.ts`
- Seed secrets: `npx tsx scripts/seed-secrets.ts`

### Error: "Decryption failed"
- MASTER_KEY may have changed
- Re-encrypt secrets with current MASTER_KEY
- Check database integrity

## Advanced: Secret Rotation

Create a rotation script:

```typescript
// scripts/rotate-secret.ts
import { setSecret, getSecret } from '../src/lib/secretManager';

async function rotateSecret(key: string, newValue: string) {
  // Store new secret with updated rotatedAt
  await setSecret(key, newValue, 'production');
  
  console.log(`✓ Rotated secret: ${key}`);
}

// Usage
rotateSecret('JWT_SECRET', 'new-jwt-secret-value');
```

## Production Deployment

1. **Generate production MASTER_KEY**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Set in production environment**
   ```bash
   # Vercel / Netlify / Railway
   MASTER_KEY=your_production_key
   ```

3. **Seed production secrets**
   ```bash
   NODE_ENV=production npx tsx scripts/seed-secrets.ts
   ```

4. **Verify**
   ```bash
   NODE_ENV=production npx tsx scripts/verify-secrets.ts
   ```

## License

This implementation is production-ready and can be used in commercial projects.
