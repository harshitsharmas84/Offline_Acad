# Structured Logging Implementation Guide

## Overview

This document provides a comprehensive guide to the structured logging and monitoring implementation for the Nebula Offline Academy Next.js application. The logging system is designed to integrate seamlessly with AWS CloudWatch and Azure Monitor.

## Table of Contents

1. [Logger Architecture](#logger-architecture)
2. [Log Format and Structure](#log-format-and-structure)
3. [Correlation IDs and Request Tracing](#correlation-ids-and-request-tracing)
4. [Using the Logger](#using-the-logger)
5. [API Endpoint Examples](#api-endpoint-examples)
6. [CloudWatch Integration](#cloudwatch-integration)
7. [Alert Configuration](#alert-configuration)
8. [Querying and Analyzing Logs](#querying-and-analyzing-logs)
9. [Log Retention and Archive](#log-retention-and-archive)
10. [Troubleshooting](#troubleshooting)

## Logger Architecture

### Structured Logger Class

The logger is implemented as a TypeScript class located in [lib/logger.ts](src/lib/logger.ts):

```typescript
class StructuredLogger {
  // Methods
  debug(message: string, meta?: Record<string, any>): void
  info(message: string, meta?: Record<string, any>): void
  warn(message: string, meta?: Record<string, any>): void
  error(message: string, meta?: Record<string, any>): void
  logPerformance(message: string, duration: number, meta?: Record<string, any>): void
  setRequestId(requestId: string): void
  getRequestId(): string | undefined
  child(meta?: Record<string, any>): StructuredLogger
}
```

### Key Features

- **Log Levels**: debug, info, warn, error
- **Correlation IDs**: Built-in request tracing across services
- **Metadata**: Flexible, structured metadata support
- **Performance Tracking**: Automatic duration measurement
- **Singleton Pattern**: Global logger instance + factory function for request-specific instances

## Log Format and Structure

### JSON Format

All logs are output as JSON for optimal searchability in CloudWatch and Azure Monitor:

```json
{
  "level": "info",
  "timestamp": "2026-02-02T10:30:45.123Z",
  "message": "User login successful",
  "requestId": "req-xxxxxxxx-xxxxxx",
  "service": "nextjs-offline-academy",
  "environment": "production",
  "userId": "user-12345",
  "role": "STUDENT",
  "duration_ms": 245,
  "endpoint": "/api/auth/login",
  "method": "POST",
  "status": 200
}
```

### Standard Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `level` | string | Log severity level | `error`, `warn`, `info`, `debug` |
| `timestamp` | ISO 8601 | UTC timestamp of log | `2026-02-02T10:30:45.123Z` |
| `message` | string | Human-readable message | `User login successful` |
| `requestId` | string | Correlation ID for tracing | `req-xxxxx-xxxxx` |
| `service` | string | Application name | `nextjs-offline-academy` |
| `environment` | string | Deployment environment | `production`, `staging`, `development` |

### Custom Metadata

Any additional metadata can be added as custom fields:

```json
{
  "level": "info",
  "message": "Database query executed",
  "duration_ms": 45,
  "query": "SELECT * FROM users WHERE id = ?",
  "rowsAffected": 1,
  "cacheHit": false
}
```

## Correlation IDs and Request Tracing

### What are Correlation IDs?

Correlation IDs (Request IDs) are unique identifiers that allow you to trace a single user request across multiple services, logs, and transactions. This is critical for:

- **Debugging**: Finding all logs related to a specific request
- **Performance Analysis**: Understanding latency across service calls
- **Error Investigation**: Correlating error logs with specific user actions
- **Distributed Tracing**: Following requests across microservices

### Format

```
req-{timestamp-in-base36}-{random-6-chars}
Example: req-t05ck1a-x2y4z9
```

### Flow

1. **Client Request** → Middleware generates or extracts `x-request-id` header
2. **Logger Setup** → Request logger initialized with correlation ID
3. **Request Processing** → All logs include the correlation ID
4. **Response** → Response headers include `x-request-id` for client reference
5. **Audit Trail** → All logs for the request are linked via correlation ID

### Example Flow

```
User makes request to /api/auth/login
    ↓
Middleware generates requestId: "req-t05ck1a-x2y4z9"
    ↓
Login route receives request
    ↓
All logs include requestId: "req-t05ck1a-x2y4z9"
    ↓
Response returned with x-request-id header
    ↓
User or client can use requestId to investigate logs
```

## Using the Logger

### Basic Usage

#### Creating a Logger Instance

```typescript
import { logger, createRequestLogger } from '@/lib/logger';

// Global logger (for application-level logs)
logger.info('Application started', { version: '1.0.0' });

// Request-specific logger (for API routes)
const requestId = request.headers.get('x-request-id') || generateRequestId();
const requestLogger = createRequestLogger(requestId);
requestLogger.info('Processing user request');
```

#### Log Levels

```typescript
// Debug - Verbose, for development
requestLogger.debug('Database query executed', {
  query: 'SELECT * FROM users',
  duration_ms: 45,
});

// Info - General information
requestLogger.info('User login successful', {
  userId: 'user-123',
  role: 'STUDENT',
});

// Warn - Warning conditions that may need attention
requestLogger.warn('Database connection slow', {
  duration_ms: 5000,
  threshold_ms: 3000,
});

// Error - Error conditions that need immediate attention
requestLogger.error('Database connection failed', {
  error: 'Connection timeout',
  duration_ms: 30000,
});
```

#### Performance Logging

```typescript
const startTime = Date.now();

// ... do work ...

const duration = Date.now() - startTime;
requestLogger.logPerformance('API request completed', duration, {
  endpoint: '/api/auth/login',
  status: 200,
});
```

### Advanced Usage

#### Child Loggers

Create child loggers that inherit the parent's correlation ID:

```typescript
const parentLogger = createRequestLogger(requestId);
const childLogger = parentLogger.child();

parentLogger.info('Parent message', { context: 'service-a' });
childLogger.info('Child message'); // Same requestId
```

#### Setting/Getting Request ID

```typescript
const logger = createRequestLogger('initial-request-id');
logger.info('First message'); // Uses initial-request-id

logger.setRequestId('new-request-id');
logger.info('Second message'); // Uses new-request-id

const currentId = logger.getRequestId(); // Returns 'new-request-id'
```

## API Endpoint Examples

### Example 1: Authentication Route (Login)

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRequestLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') || `login-${Date.now()}`;
  const requestLogger = createRequestLogger(requestId);

  try {
    // Log incoming request
    requestLogger.info('Login attempt', {
      endpoint: '/api/auth/login',
      method: 'POST',
      ip: req.headers.get('x-forwarded-for'),
    });

    const { email, password } = await req.json();

    // Authenticate user
    const user = await findUserByEmail(email);
    if (!user) {
      const duration = Date.now() - startTime;
      requestLogger.warn('Login failed - user not found', {
        duration_ms: duration,
        reason: 'user_not_found',
      });
      return NextResponse.json(
        { success: false, message: "User not found", requestId },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const duration = Date.now() - startTime;
      requestLogger.warn('Login failed - invalid credentials', {
        userId: user.id,
        duration_ms: duration,
        reason: 'invalid_credentials',
      });
      return NextResponse.json(
        { success: false, message: "Invalid credentials", requestId },
        { status: 401, headers: { 'x-request-id': requestId } }
      );
    }

    // Generate tokens and respond
    const accessToken = await createAccessToken({ userId: user.id });
    const duration = Date.now() - startTime;

    requestLogger.info('Login successful', {
      userId: user.id,
      duration_ms: duration,
    });

    return NextResponse.json(
      { success: true, accessToken, requestId },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    requestLogger.error('Login error', {
      duration_ms: duration,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, message: "Internal server error", requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
```

### Example 2: Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || `health-${Date.now()}`;
  const requestLogger = createRequestLogger(requestId);

  try {
    requestLogger.info('Health check request received', {
      endpoint: '/api/health',
      method: 'GET',
    });

    // Check database
    const dbCheckStart = Date.now();
    const dbResult = await prisma.$queryRaw`SELECT 1`;
    const dbDuration = Date.now() - dbCheckStart;

    const duration = Date.now() - startTime;

    requestLogger.info('Health check completed successfully', {
      status: 200,
      duration_ms: duration,
      db_check_ms: dbDuration,
    });

    return NextResponse.json(
      { status: "ok", requestId, timestamp: new Date().toISOString() },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    requestLogger.error('Health check failed', {
      duration_ms: duration,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { status: "error", requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
```

## CloudWatch Integration

### Log Group Configuration

All logs are sent to CloudWatch Log Group: `/ecs/nebula-app`

**ECS Task Definition Configuration:**

```json
{
  "containerDefinitions": [
    {
      "name": "nextjs-app",
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nebula-app",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

See [CLOUDWATCH_SETUP.md](CLOUDWATCH_SETUP.md) for detailed CloudWatch configuration.

## Alert Configuration

### Creating Alarms

Use the provided script to create CloudWatch alarms:

```bash
bash scripts/create-cloudwatch-alarms.sh
```

### Alarm Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Count | >10 errors/5min | Immediate alert |
| API Latency | >2000ms avg | Page on-call engineer |
| Failed Logins | >20/5min | Investigate security |
| CPU Utilization | >80% | Scale up or investigate |
| Memory Utilization | >85% | Scale up or investigate |

### SNS Integration

All alarms send notifications to SNS topic: `nebula-app-alerts`

Configure SNS subscriptions:
- Email notifications
- Slack integration
- PagerDuty integration
- Lambda functions for automated response

## Querying and Analyzing Logs

### CloudWatch Logs Insights Queries

#### Query 1: All Errors in Last Hour

```
fields @timestamp, message, error, errorStack, requestId
| filter level = "error"
| stats count() as ErrorCount by bin(5m)
```

#### Query 2: Slow API Requests (>500ms)

```
fields @timestamp, endpoint, method, duration_ms, requestId
| filter duration_ms > 500
| stats avg(duration_ms) as AvgLatency, max(duration_ms) as MaxLatency by endpoint
| sort MaxLatency desc
```

#### Query 3: Login Activity Analysis

```
fields @timestamp, message, userId, reason
| filter message like /Login/
| stats count() as TotalAttempts,
        count(userId) as UniqueUsers
  by message
| sort TotalAttempts desc
```

#### Query 4: Request Rate by Endpoint

```
fields endpoint, method
| stats count() as RequestCount by endpoint, method
| sort RequestCount desc
```

#### Query 5: Error Distribution

```
fields @timestamp, endpoint, level
| filter level = "error"
| stats count() as ErrorCount by endpoint
| sort ErrorCount desc
```

#### Query 6: Performance Analysis

```
fields @timestamp, endpoint, duration_ms
| filter endpoint like /^\/api\/.*/
| stats avg(duration_ms) as AvgDuration,
        pct(duration_ms, 50) as p50,
        pct(duration_ms, 95) as p95,
        pct(duration_ms, 99) as p99
  by endpoint
```

## Log Retention and Archive

### Retention Policy

- **Operational Logs**: 14 days (in CloudWatch)
- **Audit Logs**: 90 days (in CloudWatch)
- **Long-term Archive**: S3 Glacier (7+ years for compliance)

### Setting Retention

```bash
# Set retention to 14 days
aws logs put-retention-policy \
  --log-group-name /ecs/nebula-app \
  --retention-in-days 14 \
  --region ap-south-1
```

### Archiving to S3

```bash
# Export logs older than 30 days
aws logs create-export-task \
  --log-group-name /ecs/nebula-app \
  --from $(date -d '30 days ago' +%s)000 \
  --to $(date +%s)000 \
  --destination nebula-app-logs-archive \
  --destination-prefix "logs/$(date +%Y-%m-%d)"
```

## Troubleshooting

### Logs Not Appearing in CloudWatch

1. **Check ECS Task Definition**
   ```bash
   aws ecs describe-task-definition \
     --task-definition nebula-app-task-definition \
     --query 'taskDefinition.containerDefinitions[0].logConfiguration'
   ```

2. **Verify IAM Permissions**
   - ECS Task Execution Role must have:
     - `logs:CreateLogGroup`
     - `logs:CreateLogStream`
     - `logs:PutLogEvents`

3. **Check Network Connectivity**
   - Verify security groups allow HTTPS (port 443) to CloudWatch

4. **Monitor Application Logs**
   ```bash
   docker logs <container-id>
   ```

### Missing Correlation IDs

1. **Check Middleware**
   - Verify [src/middleware.ts](src/middleware.ts) is generating `x-request-id`

2. **Verify Logger Initialization**
   - Ensure `createRequestLogger(requestId)` is called with valid ID

3. **Check Log Output**
   - Confirm logs include `requestId` field in JSON

### High CloudWatch Costs

1. **Review Log Volume**
   ```bash
   # Get log group size
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Logs \
     --metric-name IncomingLogEvents \
     --dimensions Name=LogGroupName,Value=/ecs/nebula-app \
     --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 86400 \
     --statistics Sum
   ```

2. **Optimize Log Retention**
   - Reduce from 30 to 14 days
   - Archive old logs to S3 Glacier

3. **Filter Debug Logs in Production**
   - Only log debug level in development

## Best Practices

✅ **DO:**
- Always include `requestId` in all logs
- Use consistent log levels (error, warn, info, debug)
- Log security-related events (auth, permissions, sensitive data changes)
- Include relevant context (userId, endpoint, duration_ms)
- Use structured metadata instead of string concatenation
- Monitor and alert on error rates and latency

❌ **DON'T:**
- Log passwords, API keys, or sensitive credentials
- Log entire request/response bodies (security and performance risk)
- Use `console.log()` directly without structured logging
- Create too many custom log fields (increases data volume)
- Ignore CloudWatch alarms (set up proper notification channels)
- Keep debug logs in production (impacts performance and costs)

## Summary

This structured logging implementation provides:

1. **Comprehensive Application Observability** - Monitor all requests and errors
2. **Request Tracing** - Correlation IDs enable end-to-end tracing
3. **Performance Metrics** - Track latency and resource utilization
4. **Alert and Response** - Automated alerting for critical events
5. **Compliance** - Audit trails and log retention policies
6. **Cost Optimization** - Efficient log archival and retention

For additional support, see:
- [CLOUDWATCH_SETUP.md](CLOUDWATCH_SETUP.md) - Detailed CloudWatch configuration
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [CloudWatch Logs Insights Queries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
