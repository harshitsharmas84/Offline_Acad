# Docker & Deployment Testing Guide

## Container Build Testing

### Verify Docker Build

```bash
# Build image
docker build -t nebula-nextjs-app:test .

# Check image size
docker images nebula-nextjs-app:test

# Expected size: ~300-400MB
```

### Local Container Testing

```bash
# Run container locally
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  nebula-nextjs-app:test

# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# { "status": "healthy", "timestamp": "2024-01-30T..." }
```

### Security Scanning

```bash
# Scan with Trivy (if installed)
trivy image nebula-nextjs-app:test

# Scan with Docker Scout
docker scout cves nebula-nextjs-app:test

# Expected: No critical or high vulnerabilities
```

## Local Environment Testing

### Full Stack Test

```bash
# Deploy everything locally
./scripts/deploy-local.sh full-deploy

# Verify all services running
./scripts/deploy-local.sh status

# Expected output:
# NAME          STATUS
# nextjs_app    Up X minutes (healthy)
# postgres_db   Up X minutes (healthy)
# redis_cache   Up X minutes (healthy)
```

### Service Connectivity Tests

```bash
# Test database connection
docker-compose exec app psql -h db -U postgres -d mydb -c "SELECT version();"

# Test Redis connection
docker-compose exec app redis-cli -h redis PING

# Test application startup
docker-compose logs app | grep "ready - started server on"

# Expected: Server started successfully
```

### Health Endpoint Tests

```bash
# Test API health
curl -v http://localhost:3000/api/health

# Expected:
# HTTP/1.1 200 OK
# { "status": "healthy" }

# Test with specific endpoint
curl -v http://localhost:3000/api/health?detailed=true
```

### Load Testing Locally

```bash
# Using Apache Bench (if installed)
ab -n 1000 -c 10 http://localhost:3000/

# Using hey (golang tool)
go install github.com/rakyll/hey@latest
hey -n 1000 -c 10 http://localhost:3000/

# Using wrk (Lua-based tool)
brew install wrk
wrk -t12 -c400 -d30s http://localhost:3000/

# Monitor during load test
docker stats

# Expected:
# - Response time: <500ms (p95)
# - Throughput: >100 RPS
# - Error rate: <0.1%
```

### Database Tests

```bash
# Check migrations applied
docker-compose exec app npx prisma migrate status

# Verify schema
docker-compose exec db psql -U postgres -d mydb -c "\d"

# Test data operations
docker-compose exec app npx prisma db push

# Run Prisma studio
docker-compose exec app npx prisma studio
```

## AWS ECS Testing

### Pre-Deployment Validation

```bash
# Validate task definition JSON
aws ecs describe-task-definition \
  --task-definition nebula-app-task-definition:1 \
  --region ap-south-1 | jq '.taskDefinition'

# Check if cluster exists
aws ecs describe-clusters \
  --clusters nebula-cluster \
  --region ap-south-1

# Verify IAM roles
aws iam get-role --role-name ecsTaskExecutionRole
aws iam get-role-policy --role-name ecsTaskExecutionRole \
  --policy-name secreyManagerPolicy
```

### ECS Service Testing

```bash
# Create test service (can be deleted later)
aws ecs create-service \
  --cluster nebula-cluster \
  --service-name nebula-app-service-test \
  --task-definition nebula-app-task-definition:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --region ap-south-1

# Monitor deployment
watch -n 5 "aws ecs describe-services \
  --cluster nebula-cluster \
  --services nebula-app-service-test \
  --region ap-south-1 \
  --query 'services[0].[runningCount,desiredCount,status]' \
  --output table"

# Check task logs
aws logs tail /ecs/nebula-app --follow --region ap-south-1

# Verify task is running
aws ecs list-tasks --cluster nebula-cluster --region ap-south-1

# Get task details
TASK_ARN=$(aws ecs list-tasks --cluster nebula-cluster \
  --service-name nebula-app-service-test \
  --region ap-south-1 \
  --query 'taskArns[0]' --output text)

aws ecs describe-tasks --cluster nebula-cluster --tasks $TASK_ARN \
  --region ap-south-1

# Test health check
aws ecs describe-tasks --cluster nebula-cluster --tasks $TASK_ARN \
  --region ap-south-1 --query 'tasks[0].healthStatus'

# Delete test service
aws ecs delete-service \
  --cluster nebula-cluster \
  --service nebula-app-service-test \
  --region ap-south-1 \
  --force
```

### Container Image Tests in ECR

```bash
# List images in repository
aws ecr describe-images \
  --repository-name nebula-nextjs-app \
  --region ap-south-1

# Run image scan
aws ecr start-image-scan \
  --repository-name nebula-nextjs-app \
  --image-id imageTag=latest \
  --region ap-south-1

# Wait for scan results (takes a few minutes)
aws ecr describe-image-scan-findings \
  --repository-name nebula-nextjs-app \
  --image-id imageTag=latest \
  --region ap-south-1

# Expected: Security status should be PASSED
```

### Auto-Scaling Tests

```bash
# Check current scaling configuration
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --region ap-south-1

# Trigger load test to verify scaling
# 1. Deploy test service with autoscaling
# 2. Run load test
ab -n 10000 -c 100 http://load-balancer-url/

# 3. Monitor scaling
watch -n 5 "aws ecs describe-services \
  --cluster nebula-cluster \
  --services nebula-app-service-test \
  --region ap-south-1 \
  --query 'services[0].[runningCount,desiredCount]'"

# Expected:
# - Tasks increase as load increases
# - Tasks decrease as load decreases
# - Scale operations complete within 2-3 minutes
```

## Azure App Service Testing

### Pre-Deployment Validation

```bash
# Check ACR credentials
az acr credential show --name kalviumRegistry \
  --resource-group nebula-resource-group

# Verify resource group
az group show --name nebula-resource-group

# Check App Service Plan
az appservice plan show --name nebula-app-service-plan \
  --resource-group nebula-resource-group

# Verify web app exists (if already created)
az webapp show --name nebula-offline-academy \
  --resource-group nebula-resource-group
```

### Container Registry Tests

```bash
# List images
az acr repository list --name kalviumRegistry

# Get image tags
az acr repository show-tags --name kalviumRegistry \
  --repository nebula-nextjs-app

# Get image details
az acr repository show --name kalviumRegistry \
  --image nebula-nextjs-app:latest

# Run image scan (if ACR Basic plan)
az acr scan --image nebula-nextjs-app:latest \
  --name kalviumRegistry || echo "Scanning not available on Basic plan"
```

### App Service Tests

```bash
# Check app status
az webapp show --name nebula-offline-academy \
  --resource-group nebula-resource-group \
  --query '[state,defaultHostName]'

# View deployment logs
az webapp deployment list \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy

# Check app configuration
az webapp config show \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy

# View app settings
az webapp config appsettings list \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy

# Test health endpoint
HOSTNAME=$(az webapp show \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy \
  --query defaultHostName -o tsv)

curl https://$HOSTNAME/api/health

# Check container logs
az webapp log tail --resource-group nebula-resource-group \
  --name nebula-offline-academy --provider docker
```

### Auto-Scaling Tests

```bash
# Get autoscale settings
az monitor autoscale show \
  --resource-group nebula-resource-group \
  --name nebula-app-autoscale

# Check scaling history
az monitor metrics list \
  --resource /subscriptions/SUB_ID/resourceGroups/nebula-resource-group/providers/Microsoft.Web/serverfarms/nebula-app-service-plan \
  --metric "CpuPercentage" \
  --interval PT1M \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S)

# Monitor autoscale activity
az monitor autoscale-settings update \
  --resource-group nebula-resource-group \
  --name nebula-app-autoscale \
  --enabled true
```

## CI/CD Pipeline Testing

### GitHub Actions Testing

```bash
# Run workflow locally with Act
# Install: brew install act

# List workflows
gh workflow list

# Run specific workflow
act push --job build-and-push

# View workflow runs
gh run list --workflow=deploy-ecs.yml

# View specific run
gh run view RUN_ID --log

# Cancel run if needed
gh run cancel RUN_ID

# Check for secrets
gh secret list
```

### Azure Pipelines Testing

```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# List pipelines
az pipelines list --org YOUR_ORG --project YOUR_PROJECT

# Queue build
az pipelines build queue \
  --definition-id PIPELINE_ID \
  --org YOUR_ORG \
  --project YOUR_PROJECT

# View build details
az pipelines build show --id BUILD_ID \
  --org YOUR_ORG --project YOUR_PROJECT

# View build logs
az pipelines build log list --id BUILD_ID \
  --org YOUR_ORG --project YOUR_PROJECT
```

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install: apt-get install apache2-utils (Linux) or brew install httpd (Mac)

# Basic load test
ab -n 1000 -c 10 http://localhost:3000/

# With detailed timing
ab -n 1000 -c 10 -g results.tsv http://localhost:3000/

# Test specific endpoint
ab -n 500 -c 5 http://localhost:3000/api/health
```

### Load Testing with wrk

```bash
# Install: brew install wrk (Mac) or build from source

# Basic load test (30s, 12 threads, 400 concurrent)
wrk -t12 -c400 -d30s http://localhost:3000/

# With custom Lua script
wrk -t12 -c400 -d30s -s script.lua http://localhost:3000/

# Monitor resource usage during test
# In another terminal:
docker stats
```

### Load Testing with Hey

```bash
# Install: go install github.com/rakyll/hey@latest

# Basic load test
hey -n 1000 -c 10 http://localhost:3000/

# With timeout
hey -n 1000 -c 10 -z 30s http://localhost:3000/

# POST request
echo '{"key":"value"}' | hey -n 100 -H "Content-Type: application/json" \
  -m POST http://localhost:3000/api/endpoint
```

## Smoke Testing

### Post-Deployment Verification

```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check_endpoint() {
    local url=$1
    local expected_status=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ $url (Status: $response)${NC}"
        return 0
    else
        echo -e "${RED}✗ $url (Expected: $expected_status, Got: $response)${NC}"
        return 1
    fi
}

# Test endpoints
check_endpoint "https://your-domain.com/api/health" "200"
check_endpoint "https://your-domain.com/" "200"
check_endpoint "https://your-domain.com/api/nonexistent" "404"

# Test database
curl -s https://your-domain.com/api/health | jq '.database'

# Test caching
curl -s https://your-domain.com/api/cache-test | jq '.cached'
```

## Test Results Template

```markdown
## Test Results - [Date]

### Container Build
- [ ] Image builds successfully
- [ ] Image size within limits (<500MB)
- [ ] No security vulnerabilities

### Local Testing
- [ ] Docker Compose starts all services
- [ ] Health endpoints respond
- [ ] Database connects successfully
- [ ] Load test passes (>100 RPS)

### AWS Testing
- [ ] ECR image uploaded successfully
- [ ] Task definition registers without errors
- [ ] Service deploys and reaches stable state
- [ ] Health checks passing
- [ ] Logs visible in CloudWatch
- [ ] Auto-scaling triggers correctly
- [ ] Load test completes without errors

### Azure Testing
- [ ] ACR image uploaded successfully
- [ ] App Service starts container
- [ ] Health endpoints responding
- [ ] Logs visible in Azure Monitor
- [ ] Auto-scaling triggers correctly
- [ ] Load test completes without errors

### Performance
- [ ] Response time (p95): < 500ms
- [ ] Throughput: > 100 RPS
- [ ] Error rate: < 0.1%
- [ ] Memory usage: < 80%
- [ ] CPU usage: < 70%

### Security
- [ ] No critical vulnerabilities
- [ ] All secrets properly stored
- [ ] HTTPS enabled
- [ ] Non-root user confirmed
```

