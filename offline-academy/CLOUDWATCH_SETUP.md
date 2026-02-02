# CloudWatch Logging & Monitoring Setup Guide

## Overview
This guide details the CloudWatch logging configuration for the Nebula Offline Academy Next.js application on AWS ECS.

## 1. Log Group Configuration

### Creating the Log Group
The application is configured to send logs to CloudWatch Logs under the log group `/ecs/nebula-app`.

**AWS CLI Command:**
```bash
aws logs create-log-group \
  --log-group-name /ecs/nebula-app \
  --region ap-south-1

# Set retention policy (14 days for operational logs)
aws logs put-retention-policy \
  --log-group-name /ecs/nebula-app \
  --retention-in-days 14 \
  --region ap-south-1
```

### Log Retention Strategy
- **Operational Logs:** 14 days (for debugging and incident response)
- **Audit Logs:** 90+ days (for compliance and security audits)
- **Archive Old Logs:** Export to S3 for long-term storage

## 2. Structured Logging Format

All application logs are emitted in JSON format with the following structure:

```json
{
  "level": "info|warn|error|debug",
  "timestamp": "2026-02-02T10:30:45.123Z",
  "message": "Descriptive message",
  "requestId": "req-xxxxxxxx-xxxxxx",
  "service": "nextjs-offline-academy",
  "environment": "production",
  "duration_ms": 150,
  "userId": "user-id-here",
  "endpoint": "/api/auth/login",
  "method": "POST",
  "status": 200,
  "error": "error message if applicable",
  "errorStack": "full stack trace if applicable"
}
```

### Key Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `level` | Log severity | `error`, `warn`, `info`, `debug` |
| `timestamp` | ISO 8601 timestamp | `2026-02-02T10:30:45.123Z` |
| `message` | Human-readable message | `Login successful` |
| `requestId` | Correlation ID for tracing | `req-xxxxxxxx-xxxxxx` |
| `service` | Application identifier | `nextjs-offline-academy` |
| `environment` | Deployment environment | `production`, `staging` |
| `duration_ms` | Request/operation duration | `150` |

## 3. Log Streams

The application creates log streams automatically under `/ecs/nebula-app`:

```
/ecs/nebula-app/ecs/xxxxx-xxxxx-xxxxx (container instance)
```

Each ECS container instance gets its own stream prefixed with `ecs/`.

## 4. Metric Filters

### Create Error Count Metric Filter

**AWS Console:**
1. Go to CloudWatch → Logs → Log Groups → `/ecs/nebula-app`
2. Click "Create Metric Filter"
3. Pattern: `{ $.level = "error" }`
4. Metric Name: `ErrorCount`
5. Metric Namespace: `NebulaApp`
6. Default Value: `0`

**AWS CLI:**
```bash
aws logs put-metric-filter \
  --log-group-name /ecs/nebula-app \
  --filter-name ErrorCount \
  --filter-pattern '{ $.level = "error" }' \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=NebulaApp,metricValue=1,defaultValue=0 \
  --region ap-south-1
```

### Create API Latency Metric Filter

```bash
aws logs put-metric-filter \
  --log-group-name /ecs/nebula-app \
  --filter-name APILatency \
  --filter-pattern '{ $.endpoint like /^\/api\/.*/ && $.duration_ms > 0 }' \
  --metric-transformations \
    metricName=APILatencyMs,metricNamespace=NebulaApp,metricValue='$.duration_ms',defaultValue=0 \
  --region ap-south-1
```

### Create Failed Login Attempts Filter

```bash
aws logs put-metric-filter \
  --log-group-name /ecs/nebula-app \
  --filter-name FailedLogins \
  --filter-pattern '{ $.message like /Login failed/ }' \
  --metric-transformations \
    metricName=FailedLoginCount,metricNamespace=NebulaApp,metricValue=1,defaultValue=0 \
  --region ap-south-1
```

## 5. CloudWatch Dashboard

### Create Dashboard with Key Metrics

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "NebulaApp", "ErrorCount", { "stat": "Sum" } ],
          [ ".", "APILatencyMs", { "stat": "Average" } ],
          [ ".", "FailedLoginCount", { "stat": "Sum" } ],
          [ "AWS/ECS", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "MemoryUtilization", { "stat": "Average" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-south-1",
        "title": "Application Health Overview"
      }
    }
  ]
}
```

**Create Dashboard via AWS CLI:**
```bash
aws cloudwatch put-dashboard \
  --dashboard-name NebulaAppMonitoring \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region ap-south-1
```

## 6. CloudWatch Alarms

### Error Rate Alarm (Alert on >10 errors in 5 minutes)

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-HighErrorRate \
  --alarm-description "Alert when error count exceeds 10 in 5 minutes" \
  --metric-name ErrorCount \
  --namespace NebulaApp \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:ap-south-1:ACCOUNT_ID:AlertTopic \
  --region ap-south-1
```

### High API Latency Alarm (>2s average response time)

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-HighLatency \
  --alarm-description "Alert when average API latency exceeds 2000ms" \
  --metric-name APILatencyMs \
  --namespace NebulaApp \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 2000 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:ap-south-1:ACCOUNT_ID:AlertTopic \
  --region ap-south-1
```

### Failed Login Attempts Alarm

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-SuspiciousLoginActivity \
  --alarm-description "Alert on unusual login failure patterns" \
  --metric-name FailedLoginCount \
  --namespace NebulaApp \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 20 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions arn:aws:sns:ap-south-1:ACCOUNT_ID:AlertTopic \
  --region ap-south-1
```

### ECS CPU Utilization Alarm (>80%)

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-HighCPU \
  --alarm-description "Alert when CPU utilization exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=nebula-app Name=ClusterName,Value=your-cluster \
  --alarm-actions arn:aws:sns:ap-south-1:ACCOUNT_ID:AlertTopic \
  --region ap-south-1
```

## 7. Log Queries (CloudWatch Insights)

### Query 1: All errors in the last hour
```
fields @timestamp, message, error, errorStack, requestId
| filter level = "error"
| stats count() as ErrorCount by bin(5m)
```

### Query 2: Slow API requests (>500ms)
```
fields @timestamp, endpoint, method, duration_ms, requestId
| filter duration_ms > 500
| stats avg(duration_ms) as AvgLatency, max(duration_ms) as MaxLatency by endpoint
```

### Query 3: Failed login attempts with details
```
fields @timestamp, message, reason, userId, requestId
| filter message like /Login failed/
| stats count() as FailedAttempts by reason
```

### Query 4: Request rate by endpoint
```
fields endpoint, method
| stats count() as RequestCount by endpoint, method
| sort RequestCount desc
```

### Query 5: Error rate by endpoint
```
fields endpoint, level
| filter level = "error"
| stats count() as ErrorCount by endpoint
| sort ErrorCount desc
```

## 8. Archive Strategy

### Export Logs to S3 for Long-term Storage

```bash
# Create S3 bucket for log archives
aws s3 mb s3://nebula-app-logs-archive --region ap-south-1

# Set up CloudWatch Logs destination
aws logs put-destination \
  --destination-name NebulaLogsS3Destination \
  --target-arn arn:aws:firehose:ap-south-1:ACCOUNT_ID:deliverystream/LogsToS3 \
  --role-arn arn:aws:iam::ACCOUNT_ID:role/CloudWatchLogsRole
```

### Export Old Logs Automatically

```bash
# Export logs older than 30 days to S3
aws logs create-export-task \
  --log-group-name /ecs/nebula-app \
  --from 1609459200000 \
  --to 1625097600000 \
  --destination nebula-app-logs-archive \
  --destination-prefix "logs/$(date +%Y-%m-%d)" \
  --region ap-south-1
```

## 9. Accessing Logs

### Via AWS Console
1. Go to CloudWatch → Logs → Log Groups
2. Select `/ecs/nebula-app`
3. Browse log streams by time or filter by pattern

### Via AWS CLI
```bash
# Tail recent logs
aws logs tail /ecs/nebula-app --follow --region ap-south-1

# Filter by pattern
aws logs filter-log-events \
  --log-group-name /ecs/nebula-app \
  --filter-pattern '{ $.level = "error" }' \
  --region ap-south-1

# Get logs for specific time range
aws logs filter-log-events \
  --log-group-name /ecs/nebula-app \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region ap-south-1
```

## 10. Best Practices

1. **Always include requestId** - Enables tracing requests across logs
2. **Use consistent log levels** - error, warn, info, debug
3. **Log sensitive operations** - Auth, data changes, security events
4. **Include context** - Always add relevant metadata (userId, endpoint, etc.)
5. **Monitor log volume** - Watch for log spam or unexpected increases
6. **Set appropriate retention** - Balance cost with compliance requirements
7. **Archive old logs** - Move to S3 for long-term storage and cost savings
8. **Test alerts** - Verify notifications reach the right team members
9. **Document runbooks** - Create incident response guides for each alarm
10. **Review logs regularly** - Use CloudWatch Insights for trend analysis

## Troubleshooting

### Logs not appearing
- Verify task definition `logConfiguration` is correct
- Check ECS task execution role has `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` permissions
- Verify security groups allow communication to CloudWatch (HTTPS port 443)

### High CloudWatch costs
- Review retention policies - reduce from 30 to 14 days
- Archive old logs to S3
- Use metric filters instead of log insights for routine queries
- Filter out debug logs in production

### Missing correlation IDs
- Ensure middleware is setting `x-request-id` header
- Verify `createRequestLogger(requestId)` is called in all routes
- Check that logs include `requestId` field in JSON output

## References
- [AWS CloudWatch Logs Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [CloudWatch Metrics Filters](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html)
- [CloudWatch Insights Queries](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
