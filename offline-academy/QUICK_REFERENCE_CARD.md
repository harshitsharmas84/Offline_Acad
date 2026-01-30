# Quick Reference Card - Docker & Cloud Deployment

## Essential Commands

### Local Development
```bash
# Full setup (recommended first step)
./scripts/deploy-local.sh full-deploy

# Individual commands
./scripts/deploy-local.sh build          # Build containers
./scripts/deploy-local.sh start          # Start services
./scripts/deploy-local.sh stop           # Stop services
./scripts/deploy-local.sh status         # Service status
./scripts/deploy-local.sh logs app       # View logs
./scripts/deploy-local.sh health         # Health check
./scripts/deploy-local.sh shell app      # Shell access
./scripts/deploy-local.sh clean          # Clean up

# Test locally
curl http://localhost:3000/api/health
```

### AWS ECS Deployment
```bash
# Deploy with script (recommended)
./scripts/deploy-aws.sh v1.0.0 production

# Manual deployment steps
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
docker build -t nebula-nextjs-app:v1.0.0 .
docker tag nebula-nextjs-app:v1.0.0 ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:v1.0.0
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:v1.0.0

# Monitor
aws logs tail /ecs/nebula-app --follow
aws ecs describe-services --cluster nebula-cluster --services nebula-app-service
```

### Azure App Service Deployment
```bash
# Deploy with script (recommended)
./scripts/deploy-azure.sh v1.0.0 production

# Manual deployment steps
az acr login --name kalviumRegistry
docker build -t kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0 .
docker push kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0

# Monitor
az webapp log tail --resource-group nebula-resource-group --name nebula-offline-academy --provider docker
az webapp show --resource-group nebula-resource-group --name nebula-offline-academy
```

### CI/CD
```bash
# GitHub Actions
gh workflow list
gh run list --workflow=deploy-ecs.yml
gh run view RUN_ID --log

# Azure Pipelines
az pipelines list --org YOUR_ORG --project YOUR_PROJECT
az pipelines build queue --definition-id PIPELINE_ID
```

## Configuration Files

| File | Purpose | Size |
|------|---------|------|
| `Dockerfile` | Container image | 60 lines |
| `docker-compose.yml` | Dev environment | 75 lines |
| `.dockerignore` | Build exclusions | 40 lines |
| `aws-ecs-task-definition.json` | ECS config | ~50 lines |
| `aws-ecs-service-definition.json` | ECS service | ~50 lines |
| `aws-autoscaling.yaml` | CloudFormation | ~150 lines |
| `azure-app-service.json` | ARM template | ~200 lines |
| `azure-pipelines.yml` | Azure CI/CD | ~150 lines |
| `.github/workflows/deploy-ecs.yml` | GitHub Actions | ~200 lines |

## Environment Variables

### Local (.env.local)
```env
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
REDIS_URL=redis://redis:6379
NODE_ENV=development
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### AWS (Secrets Manager)
```
nebula/database-url
nebula/redis-url
nebula/nextauth-secret
```

### Azure (Key Vault)
```
database-url
redis-url
nextauth-secret
```

## Key Port Numbers

| Service | Port | Protocol |
|---------|------|----------|
| Next.js App | 3000 | HTTP |
| PostgreSQL | 5432 | TCP |
| Redis | 6379 | TCP |
| Health Check | 3000/api/health | HTTP |

## Docker Basics

```bash
# Build image
docker build -t nebula-nextjs-app:latest .

# Run container
docker run -p 3000:3000 nebula-nextjs-app:latest

# View images
docker images

# View containers
docker ps -a

# Stop container
docker stop CONTAINER_ID

# Remove container
docker rm CONTAINER_ID

# View logs
docker logs CONTAINER_ID

# Shell access
docker exec -it CONTAINER_ID sh
```

## Health Checks

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response
{"status": "healthy", "timestamp": "2024-01-30T..."}

# AWS health check status
aws ecs describe-tasks --cluster nebula-cluster --tasks TASK_ARN \
  --query 'tasks[0].healthStatus'

# Azure health check (logs)
az webapp log tail --resource-group nebula-resource-group \
  --name nebula-offline-academy --provider docker
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | Check logs: `./scripts/deploy-local.sh logs app` |
| Database connection fails | Verify DATABASE_URL in environment |
| Health check failing | Check if port 3000 is accessible |
| Deployment hangs | Check CloudWatch/Azure Monitor logs |
| Slow performance | Review CPU/memory utilization, scale up if needed |
| CI/CD not triggering | Check GitHub secrets or Azure service connection |

## Common Errors & Fixes

```
Error: "Unable to connect to database"
→ Check DATABASE_URL is correct
→ Verify database is running: docker-compose logs db

Error: "Health check failed"
→ Verify app started: docker-compose logs app
→ Test endpoint: curl http://localhost:3000/api/health

Error: "ECR login failed"
→ Check AWS credentials: aws configure
→ Verify region: ap-south-1

Error: "ACR push failed"
→ Check ACR name: az acr list
→ Verify login: az acr login --name kalviumRegistry

Error: "Service won't update"
→ Check task definition exists
→ Verify image URI is correct
→ Review IAM permissions
```

## AWS ECS Summary

```
Cluster:        nebula-cluster
Service:        nebula-app-service
Task Def:       nebula-app-task-definition
Container Name: nextjs-app
Port:           3000
Memory:         1024 MB
CPU:            512
Min Tasks:      2
Max Tasks:      6 (auto-scaling)
Log Group:      /ecs/nebula-app
Region:         ap-south-1
```

## Azure App Service Summary

```
Resource Group:     nebula-resource-group
App Service Plan:   nebula-app-service-plan
Web App:            nebula-offline-academy
Container Registry: kalviumRegistry
SKU:                B2 (Basic - 2 cores, 3.5GB)
Min Instances:      1
Max Instances:      5 (auto-scaling)
Region:             eastus
```

## Performance Targets

```
Local Development:
- Build time: <2 minutes
- Startup time: <30 seconds
- Container size: 300-400MB

Production Metrics:
- Response time (p95): <500ms
- Throughput: >100 RPS
- Error rate: <0.1%
- CPU utilization: <70%
- Memory utilization: <80%
- Cold start: ~5-10 seconds
- Warm start: <1 second
```

## Auto-Scaling Thresholds

### AWS ECS
- CPU: Scale up at 70%, down at 25%
- Memory: Scale up at 80%, down at 40%
- Requests: Scale based on ALB target group
- Min: 2 tasks, Max: 6 tasks
- Cool-down: 5-10 minutes

### Azure App Service
- CPU: Scale up at 70%, down at 25%
- Memory: Scale up at 80%, down at 40%
- Min: 1 instance, Max: 5 instances

## Documentation Map

```
START HERE
    ↓
WELCOME.txt (this file)
    ↓
DOCUMENTATION_INDEX.md (full guide)
    ↓
Choose:
├─ Quick start → DEPLOYMENT_README.md
├─ Commands → DEPLOYMENT_QUICK_REFERENCE.md
├─ Detailed → DEPLOYMENT.md
├─ Testing → DEPLOYMENT_TESTING.md
├─ CI/CD → GITHUB_ACTIONS_SETUP.md
└─ Overview → ASSIGNMENT_COMPLETION_SUMMARY.md
```

## Contact & Support

For specific help:
1. Check the relevant documentation file
2. Review DEPLOYMENT_QUICK_REFERENCE.md troubleshooting
3. Run local tests: `./scripts/deploy-local.sh test`
4. Check logs: `./scripts/deploy-local.sh logs app`

## Quick Links

- **Documentation Index**: `DOCUMENTATION_INDEX.md`
- **Full Deployment Guide**: `DEPLOYMENT.md`
- **Quick Commands**: `DEPLOYMENT_QUICK_REFERENCE.md`
- **Testing Guide**: `DEPLOYMENT_TESTING.md`
- **GitHub Actions Setup**: `GITHUB_ACTIONS_SETUP.md`

---

**Last Updated**: January 30, 2024  
**Version**: 1.0.0  
**Status**: Production Ready
