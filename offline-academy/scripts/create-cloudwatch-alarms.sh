#!/bin/bash
# CloudWatch Alarms Configuration for Nebula Offline Academy
# Run this script to create all monitoring alarms
# Prerequisites: AWS CLI configured with appropriate credentials

set -e

REGION="ap-south-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SNS_TOPIC="arn:aws:sns:${REGION}:${ACCOUNT_ID}:nebula-app-alerts"

echo "Creating SNS topic for alerts..."
aws sns create-topic \
  --name nebula-app-alerts \
  --region $REGION || true

echo "SNS Topic ARN: $SNS_TOPIC"

# ============================================================
# 1. Error Rate Alarm - Alert on >10 errors in 5 minutes
# ============================================================
echo "Creating Error Rate Alarm..."
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
  --alarm-actions "$SNS_TOPIC" \
  --treat-missing-data notBreaching \
  --region $REGION

# ============================================================
# 2. High API Latency Alarm - Average response time > 2s
# ============================================================
echo "Creating High Latency Alarm..."
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
  --alarm-actions "$SNS_TOPIC" \
  --treat-missing-data notBreaching \
  --region $REGION

# ============================================================
# 3. Failed Login Attempts - Alert on suspicious activity
# ============================================================
echo "Creating Failed Login Alarm..."
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-SuspiciousLoginActivity \
  --alarm-description "Alert on unusual login failure patterns (>20 failures in 5 min)" \
  --metric-name FailedLoginCount \
  --namespace NebulaApp \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 20 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions "$SNS_TOPIC" \
  --treat-missing-data notBreaching \
  --region $REGION

# ============================================================
# 4. ECS CPU Utilization - Alert when CPU > 80%
# ============================================================
echo "Creating ECS CPU Alarm..."
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
  --dimensions \
    Name=ServiceName,Value=nebula-app \
    Name=ClusterName,Value=nebula-cluster \
  --alarm-actions "$SNS_TOPIC" \
  --treat-missing-data notBreaching \
  --region $REGION

# ============================================================
# 5. ECS Memory Utilization - Alert when memory > 85%
# ============================================================
echo "Creating ECS Memory Alarm..."
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-HighMemory \
  --alarm-description "Alert when memory utilization exceeds 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --dimensions \
    Name=ServiceName,Value=nebula-app \
    Name=ClusterName,Value=nebula-cluster \
  --alarm-actions "$SNS_TOPIC" \
  --treat-missing-data notBreaching \
  --region $REGION

# ============================================================
# 6. ECS Task Count - Alert when running tasks < desired
# ============================================================
echo "Creating ECS Task Health Alarm..."
aws cloudwatch put-metric-alarm \
  --alarm-name NebulaApp-TaskHealthIssue \
  --alarm-description "Alert when running tasks < desired count" \
  --metric-name TaskCount \
  --namespace NebulaApp \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --alarm-actions "$SNS_TOPIC" \
  --treat-missing-data notBreaching \
  --region $REGION

echo ""
echo "========================================="
echo "All alarms created successfully!"
echo "SNS Topic: $SNS_TOPIC"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Subscribe to the SNS topic with your email/Slack"
echo "2. Create metric filters in CloudWatch Logs"
echo "3. Test alarms to ensure notifications work"
echo ""
