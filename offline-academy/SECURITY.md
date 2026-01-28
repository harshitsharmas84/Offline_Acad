# OWASP Security Best Practices - Next.js Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [XSS Prevention](#xss-prevention)
3. [SQL Injection Prevention](#sql-injection-prevention)
4. [Implemented Utilities](#implemented-utilities)
5. [Before/After Examples](#beforeafter-examples)
6. [Usage Guidelines](#usage-guidelines)
7. [Testing Security](#testing-security)

---

## Overview

This document outlines OWASP security best practices implemented in the Next.js offline academy application. The main focus areas are:

- **XSS (Cross-Site Scripting)**: Preventing malicious script injection
- **SQL Injection**: Preventing database manipulation through user input
- **Data Sanitization**: Cleaning user input before storage and display
- **Safe React Rendering**: Secure patterns for displaying user-generated content

### Security Layers

```
User Input
    ↓
[Sanitization Layer] ← Removes malicious content
    ↓
[Validation Layer] ← Zod schemas verify format
    ↓
[Storage Layer] ← Prisma ORM prevents SQL injection
    ↓
[Output Layer] ← React escaping + safe rendering components
    ↓
Browser Display ← XSS attacks prevented
```

---

## XSS Prevention

### What is XSS?

Cross-Site Scripting (XSS) is an attack where malicious JavaScript is injected into a web application and executed in users' browsers.

### Attack Types

| Type | Vector | Impact |
|------|--------|--------|
| **Stored XSS** | Malicious data stored in database | Affects all users viewing the data |
| **Reflected XSS** | Malicious data in URL parameters | Affects users who click the link |
| **DOM XSS** | JavaScript directly manipulates DOM | Real-time client-side attack |

### Vulnerable Code Examples

```typescript
// ❌ VULNERABLE - User input directly in HTML
export function UserProfile({ name }: { name: string }) {
  return <div dangerouslySetInnerHTML={{ __html: name }} />;
  // Attack: name = "<img src=x onerror='fetch(\"/api/admin\")'>"
  // Result: JavaScript executes when page loads
}

// ❌ VULNERABLE - User input in event handler
const script = userInput;
new Function(script)(); // User could provide: "fetch('https://evil.com')"

// ❌ VULNERABLE - User input in href attribute (old frameworks)
<a href={userInput}>Click</a>
// Attack: href="javascript:alert('xss')"
```

### Safe Code Examples

```typescript
// ✅ SAFE - React escapes text by default
export function UserProfile({ name }: { name: string }) {
  return <div>{name}</div>;
  // React escapes: <img src=x onerror='...'> becomes &lt;img src=x onerror='...'&gt;
  // Result: Rendered as plain text, not executed
}

// ✅ SAFE - Sanitized HTML with dangerouslySetInnerHTML
import { sanitizeHtmlContent } from "@/lib/sanitizer";
import { SafeHtml } from "@/lib/safe-render";

export function UserBio({ bio }: { bio: string }) {
  // Sanitize before rendering
  return <SafeHtml html={bio} />;
  // Attack: bio = "<p>Text</p><script>alert('xss')</script>"
  // Result: Renders "<p>Text</p>" (script removed)
}

// ✅ SAFE - Use SafeText component for plain text
import { SafeText } from "@/lib/safe-render";

export function UserName({ name }: { name: string }) {
  return <SafeText text={name} />;
  // Automatically escapes all content
}
```

### Prevention Checklist

- [ ] Never use `eval()` or `new Function()` with user input
- [ ] Don't use `dangerouslySetInnerHTML` without sanitization
- [ ] Sanitize user input before storing in database
- [ ] Use SafeText/SafeHtml components for user-generated content
- [ ] Set HTTP-only cookies to prevent JavaScript access
- [ ] Use Content-Security-Policy headers (app/layout.tsx)
- [ ] Escape user input in error messages
- [ ] Validate file uploads and check MIME types

---

## SQL Injection Prevention

### What is SQL Injection?

SQL Injection attacks manipulate SQL queries by injecting malicious SQL code through user input.

### Vulnerable Patterns

```typescript
// ❌ VULNERABLE - String concatenation (DON'T DO THIS)
const email = userInput;
const user = await prisma.$queryRaw`
  SELECT * FROM User WHERE email = '${email}'
`;
// Attack: email = "' OR '1'='1' --"
// Query becomes: SELECT * FROM User WHERE email = '' OR '1'='1' --'
// Result: Returns ALL users, bypasses authentication

// ❌ VULNERABLE - String template literal
const query = `SELECT * FROM users WHERE email = '${email}'`;
await db.query(query);
// Same vulnerability - user input directly in SQL
```

### Safe Patterns (Using Prisma ORM)

```typescript
// ✅ SAFE - Prisma parameterized queries
import { prisma } from "@/lib/db/prisma";

const email = userInput;
const user = await prisma.user.findUnique({
  where: { email },
});
// Prisma separates DATA from SQL structure
// email is treated as DATA value, not SQL code
// Attack: email = "' OR '1'='1' --"
// Result: Query looks for literal string "' OR '1'='1' --", no matches

// ✅ SAFE - Using where clauses
const users = await prisma.user.findMany({
  where: {
    AND: [
      { email: userInput },
      { role: "user" },
    ],
  },
});

// ✅ SAFE - Using transactions for complex operations
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({
    where: { email: userInput },
  });
  
  if (!user) throw new Error("User not found");
  
  return await tx.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });
});
```

### Prevention Checklist

- [ ] Use Prisma ORM for all database queries
- [ ] Never concatenate user input into SQL strings
- [ ] Use parameterized queries for raw SQL if necessary
- [ ] Validate input format (email, number, etc.)
- [ ] Use prepared statements with placeholders
- [ ] Principle of Least Privilege: database users only need required permissions
- [ ] Enable query logging to detect suspicious patterns
- [ ] Keep Prisma and dependencies updated

---

## Implemented Utilities

### 1. Sanitizer Functions (`src/lib/sanitizer.ts`)

#### `sanitizeText(input: string): string`
Removes ALL HTML tags, safe for plain text fields.

```typescript
import { sanitizeText } from "@/lib/sanitizer";

const name = sanitizeText("<img src=x onerror='alert()'>John");
// Result: "John"

const username = sanitizeText("user@example.com<script>");
// Result: "user@example.com"
```

**Use for**: usernames, names, titles, plain descriptions

#### `sanitizeEmail(input: string): string`
Sanitizes email inputs, removes dangerous characters.

```typescript
import { sanitizeEmail } from "@/lib/sanitizer";

const email = sanitizeEmail("user@example.com<script>");
// Result: "user@example.com"

const email2 = sanitizeEmail("' OR '1'='1'@example.com");
// Result: "or1example.com"
```

**Use for**: Email fields in forms

#### `sanitizeHtmlContent(input: string): string`
Removes dangerous tags while allowing safe HTML formatting.

```typescript
import { sanitizeHtmlContent } from "@/lib/sanitizer";

const bio = sanitizeHtmlContent(
  "<p>Developer</p><script>alert('xss')</script>"
);
// Result: "<p>Developer</p>"

const comment = sanitizeHtmlContent(
  "<a href='javascript:alert()'>click</a>"
);
// Result: "<a>click</a>"
```

**Use for**: Blog posts, comments with formatting, rich content

#### `sanitizeObject(obj, textFields, richFields): object`
Sanitizes entire form objects at once.

```typescript
import { sanitizeObject } from "@/lib/sanitizer";

const rawFormData = {
  name: "<img src=x onerror='alert()'>John",
  email: "user@example.com<script>",
  bio: "<p>Developer</p><script>alert()</script>"
};

const safe = sanitizeObject(
  rawFormData,
  ["name", "email"], // Sanitize as plain text
  ["bio"]              // Sanitize as HTML
);
// Result:
// {
//   name: "John",
//   email: "user@example.com",
//   bio: "<p>Developer</p>"
// }
```

### 2. Safe React Rendering (`src/lib/safe-render.tsx`)

#### `SafeText` Component
Always-safe component for displaying plain text.

```typescript
import { SafeText } from "@/lib/safe-render";

export function UserProfile({ name }: { name: string }) {
  return (
    <div>
      <SafeText text={name} className="font-bold" />
    </div>
  );
}
```

#### `SafeHtml` Component
Safe component for displaying formatted HTML.

```typescript
import { SafeHtml } from "@/lib/safe-render";

export function CommentDisplay({ comment }: { comment: string }) {
  return (
    <SafeHtml 
      html={comment} 
      className="prose prose-sm"
      tag="article"
    />
  );
}
```

#### `renderSafeContent()` Helper
Automatically chooses SafeText or SafeHtml based on content.

```typescript
import { renderSafeContent } from "@/lib/safe-render";

export function DynamicContent({ content }: { content: string }) {
  return (
    <div>
      {renderSafeContent(content, "text-gray-700")}
    </div>
  );
}
```

---

## Before/After Examples

### Example 1: User Signup with Malicious Input

#### ❌ BEFORE (Vulnerable)

```typescript
// API Route: src/app/api/auth/signup/route.ts (vulnerable)
export async function POST(req: Request) {
  const { email, name } = await req.json();
  
  const user = await prisma.user.create({
    data: {
      email,    // Unsanitized - could have script tags
      name,     // Unsanitized - XSS vector
    },
  });
  
  return NextResponse.json({ user });
}

// Database stores:
// {
//   email: "user@example.com<img src=x onerror='fetch(/api/admin?delete=1)'>",
//   name: "<script>alert('stored xss')</script>John"
// }

// When displayed in component:
function UserCard({ user }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: user.name }} />
    // XSS executes here when user.name is rendered
  );
}
```

#### ✅ AFTER (Secure)

```typescript
// API Route: src/app/api/auth/signup/route.ts (secure)
import { sanitizeEmail, sanitizeText } from "@/lib/sanitizer";

export async function POST(req: Request) {
  const { email: rawEmail, name: rawName } = await req.json();
  
  // 🔒 Sanitize input before storage
  const email = sanitizeEmail(rawEmail);
  const name = sanitizeText(rawName);
  
  const user = await prisma.user.create({
    data: {
      email,    // Sanitized - safe from injection
      name,     // Sanitized - HTML removed
    },
  });
  
  return NextResponse.json({ user });
}

// Database stores:
// {
//   email: "user@example.com",
//   name: "John"
// }

// When displayed in component:
import { SafeText } from "@/lib/safe-render";

function UserCard({ user }) {
  return (
    <div>
      <SafeText text={user.name} />
      {/* XSS prevented - content auto-escaped */}
    </div>
  );
}
```

### Example 2: Blog Comment with User HTML

#### ❌ BEFORE (Vulnerable)

```typescript
// API Route
export async function POST(req: Request) {
  const { postId, comment } = await req.json();
  
  // Directly store unsanitized comment
  const stored = await prisma.comment.create({
    data: {
      postId,
      content: comment, // Contains user-provided HTML
    },
  });
  
  return NextResponse.json({ success: true });
}

// User submits:
// comment = "<p>Nice post!</p><img src=x onerror='steal cookies'>"

// Database stores the attack code
// When displayed to other users:
function CommentList({ comments }) {
  return comments.map(c => (
    <div dangerouslySetInnerHTML={{ __html: c.content }} />
    // Everyone who views becomes a victim
  ));
}
```

#### ✅ AFTER (Secure)

```typescript
// API Route
import { sanitizeHtmlContent } from "@/lib/sanitizer";

export async function POST(req: Request) {
  const { postId, comment } = await req.json();
  
  // 🔒 Sanitize HTML while preserving safe formatting
  const safe = sanitizeHtmlContent(comment);
  
  const stored = await prisma.comment.create({
    data: {
      postId,
      content: safe, // Only safe HTML stored
    },
  });
  
  return NextResponse.json({ success: true });
}

// User submits:
// comment = "<p>Nice post!</p><img src=x onerror='steal cookies'>"

// Database stores:
// content = "<p>Nice post!</p>" (img tag removed)

// When displayed:
import { SafeHtml } from "@/lib/safe-render";

function CommentList({ comments }) {
  return comments.map(c => (
    <SafeHtml html={c.content} className="prose" />
    // No XSS - already sanitized, component adds extra protection
  ));
}
```

### Example 3: Admin Login with SQL Injection Attempt

#### ❌ BEFORE (Vulnerable)

```typescript
// Vulnerable code using raw SQL
const email = "' OR '1'='1' --";
const query = `SELECT * FROM users WHERE email = '${email}'`;
const user = await db.query(query);
// Query becomes: SELECT * FROM users WHERE email = '' OR '1'='1' --'
// Returns ALL users, attacker logs in as first user

// API response exposes sensitive info
return NextResponse.json({
  success: true,
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    passwordHash: user.passwordHash, // ❌ EXPOSED
  },
});
```

#### ✅ AFTER (Secure)

```typescript
import { sanitizeEmail } from "@/lib/sanitizer";

export async function POST(req: Request) {
  const { email: rawEmail } = await req.json();
  
  // 🔒 Sanitize email
  const email = sanitizeEmail(rawEmail);
  
  // 🔒 Use Prisma parameterized query (SQL injection impossible)
  const user = await prisma.user.findUnique({
    where: { email },
    // Never select password - use bcrypt.compare instead
    select: {
      id: true,
      email: true,
      role: true,
      // password field NOT selected
    },
  });
  
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Invalid credentials" },
      { status: 401 }
    );
  }
  
  // Verify password separately
  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  
  // API response only returns safe data
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      // password NOT returned
    },
  });
}
```

---

## Usage Guidelines

### In API Routes

```typescript
import { sanitizeText, sanitizeEmail, sanitizeObject } from "@/lib/sanitizer";

export async function POST(req: Request) {
  const rawData = await req.json();
  
  // Option 1: Sanitize individual fields
  const name = sanitizeText(rawData.name);
  const email = sanitizeEmail(rawData.email);
  
  // Option 2: Sanitize entire object
  const safe = sanitizeObject(
    rawData,
    ["name", "email", "title"],  // text fields
    ["description", "bio"]         // rich HTML fields
  );
  
  // Use Prisma for database operations
  const result = await prisma.user.create({
    data: safe,
  });
  
  return NextResponse.json({ success: true, data: result });
}
```

### In React Components

```typescript
import { SafeText, SafeHtml, renderSafeContent } from "@/lib/safe-render";

export function UserProfile({ user }) {
  return (
    <div className="profile">
      {/* Plain text - always safe */}
      <h1>
        <SafeText text={user.name} />
      </h1>
      
      {/* HTML content - pre-sanitized from API */}
      <div className="bio">
        <SafeHtml html={user.bio} />
      </div>
      
      {/* Email - sanitized but displayed as plain text */}
      <p>
        <SafeText text={user.email} />
      </p>
      
      {/* Automatic detection */}
      {renderSafeContent(user.description)}
    </div>
  );
}
```

### Form Data Sanitization

```typescript
import { sanitizeObject } from "@/lib/sanitizer";

export async function handleFormSubmit(formData: FormData) {
  const raw = Object.fromEntries(formData);
  
  // Sanitize all form data at once
  const safe = sanitizeObject(
    raw,
    Object.keys(raw) // All fields as text by default
  );
  
  // Send to API
  const response = await fetch("/api/submit", {
    method: "POST",
    body: JSON.stringify(safe),
  });
  
  return response.json();
}
```

---

## Testing Security

### Unit Tests for Sanitizer

```typescript
import {
  sanitizeText,
  sanitizeEmail,
  sanitizeHtmlContent,
} from "@/lib/sanitizer";

describe("Sanitizer Security", () => {
  describe("XSS Prevention", () => {
    test("removes script tags", () => {
      const input = "<script>alert('xss')</script>Hello";
      expect(sanitizeText(input)).toBe("Hello");
    });

    test("removes event handlers", () => {
      const input = "<img src=x onerror='alert(1)'>";
      expect(sanitizeText(input)).toBe("");
    });

    test("removes javascript: protocol", () => {
      const input = "<a href='javascript:alert()'>click</a>";
      expect(sanitizeHtmlContent(input)).toBe("<a>click</a>");
    });

    test("allows safe HTML", () => {
      const input = "<p><b>Bold</b> <i>italic</i></p>";
      const result = sanitizeHtmlContent(input);
      expect(result).toContain("<p>");
      expect(result).toContain("<b>Bold</b>");
    });
  });

  describe("Email Sanitization", () => {
    test("removes HTML from email", () => {
      const input = "user@example.com<script>";
      expect(sanitizeEmail(input)).toBe("user@example.com");
    });

    test("removes SQL injection attempts", () => {
      const input = "user@example.com' OR '1'='1";
      const result = sanitizeEmail(input);
      expect(result).not.toContain("'");
      expect(result).not.toContain("OR");
    });
  });
});
```

### Manual Testing Checklist

- [ ] Test with `<script>alert('xss')</script>` in all text fields
- [ ] Test with `<img src=x onerror="alert('xss')">` in all fields
- [ ] Test with `' OR '1'='1'` in email/username fields
- [ ] Test with `javascript:alert()` in URL fields
- [ ] Test with `<svg onload="alert('xss')">` in rich text fields
- [ ] Verify database content doesn't contain injected scripts
- [ ] Check browser console for no JavaScript errors
- [ ] Use browser dev tools to inspect HTML source
- [ ] Test with HTML/JavaScript minified or encoded
- [ ] Test with Unicode/emoji in user inputs

### Automated Security Testing

```bash
# Install security scanner
npm install --save-dev snyk eslint-plugin-security

# Run security audit
npm audit

# Scan for vulnerabilities
npx snyk test

# Check dependencies
npm outdated
```

---

## Security Checklist

### Before Deployment

- [ ] All user inputs are sanitized before storage
- [ ] All user inputs are sanitized/escaped before display
- [ ] No direct HTML rendering without sanitization
- [ ] No concatenation of user input into SQL queries
- [ ] Using Prisma ORM for all database operations
- [ ] HTTP-only cookies set for sensitive tokens
- [ ] CSRF protection implemented (sameSite cookies)
- [ ] Error messages don't expose sensitive information
- [ ] File uploads validated and scanned
- [ ] Environment variables never logged or exposed
- [ ] Dependencies kept up-to-date
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)

### Development Best Practices

- [ ] Review user input handling in code reviews
- [ ] Run security linters on every commit
- [ ] Test with OWASP ZAP or Burp Suite
- [ ] Keep security utilities updated
- [ ] Document why sanitization is needed where used
- [ ] Train team on secure coding practices
- [ ] Monitor for security advisories in dependencies

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)
- [sanitize-html Package](https://www.npmjs.com/package/sanitize-html)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Last Updated**: January 28, 2026  
**Security Framework**: OWASP Top 10  
**Technology Stack**: Next.js 16, React 19, Prisma ORM, TypeScript
