# Quick Reference: Docker & Cloud Deployment

## Local Development

```bash
# Full setup (build, start, init DB, health check)
./scripts/deploy-local.sh full-deploy

# Individual commands
./scripts/deploy-local.sh build          # Build containers
./scripts/deploy-local.sh start          # Start services
./scripts/deploy-local.sh logs app       # View app logs
./scripts/deploy-local.sh shell app      # Access app shell
./scripts/deploy-local.sh status         # Service status
./scripts/deploy-local.sh health         # Health checks
./scripts/deploy-local.sh init-db        # Setup database
./scripts/deploy-local.sh test           # Run tests
./scripts/deploy-local.sh benchmark      # Performance test
./scripts/deploy-local.sh stop           # Stop services
./scripts/deploy-local.sh clean          # Remove everything

# Manual Docker Compose
docker-compose up -d              # Start all services
docker-compose down              # Stop all services
docker-compose logs -f           # View logs
docker-compose exec app sh       # Shell access
```

## AWS ECS Deployment

### Initial Setup (One-time)

```bash
# 1. Create ECR repository
aws ecr create-repository \
  --repository-name nebula-nextjs-app \
  --region ap-south-1

# 2. Create ECS cluster
aws ecs create-cluster --cluster-name nebula-cluster --region ap-south-1

# 3. Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/nebula-app --region ap-south-1

# 4. Set up secrets
aws secretsmanager create-secret --name nebula/database-url --secret-string "YOUR_DB_URL" --region ap-south-1
aws secretsmanager create-secret --name nebula/redis-url --secret-string "YOUR_REDIS_URL" --region ap-south-1
aws secretsmanager create-secret --name nebula/nextauth-secret --secret-string "YOUR_SECRET" --region ap-south-1

# 5. Create IAM roles (see DEPLOYMENT.md for detailed setup)

# 6. Create task definition
aws ecs register-task-definition --cli-input-json file://aws-ecs-task-definition.json --region ap-south-1

# 7. Create service
aws ecs create-service \
  --cluster nebula-cluster \
  --service-name nebula-app-service \
  --task-definition nebula-app-task-definition:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --region ap-south-1
```

### Deploy Updates (Recurring)

```bash
# Using deployment script
./scripts/deploy-aws.sh v1.0.0 production

# Manual steps:
# 1. Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build & push
docker build -t nebula-nextjs-app:v1.0.0 .
docker tag nebula-nextjs-app:v1.0.0 ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:v1.0.0
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:v1.0.0

# 3. Update service
aws ecs update-service \
  --cluster nebula-cluster \
  --service nebula-app-service \
  --force-new-deployment \
  --region ap-south-1

# 4. Wait for deployment
aws ecs wait services-stable \
  --cluster nebula-cluster \
  --services nebula-app-service \
  --region ap-south-1
```

### Monitor Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster nebula-cluster \
  --services nebula-app-service \
  --region ap-south-1 \
  --query 'services[0].[runningCount,desiredCount,status]'

# View logs
aws logs tail /ecs/nebula-app --follow --region ap-south-1

# List tasks
aws ecs list-tasks --cluster nebula-cluster --region ap-south-1

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=nebula-app-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-south-1
```

## Azure App Service Deployment

### Initial Setup (One-time)

```bash
# 1. Create resource group
az group create --name nebula-resource-group --location eastus

# 2. Create ACR
az acr create --resource-group nebula-resource-group \
  --name kalviumRegistry --sku Basic --admin-enabled true

# 3. Create App Service Plan
az appservice plan create --name nebula-app-service-plan \
  --resource-group nebula-resource-group --is-linux --sku B2 --number-of-workers 2

# 4. Create Web App
az webapp create --resource-group nebula-resource-group \
  --plan nebula-app-service-plan --name nebula-offline-academy

# 5. Configure container
ACR_PASSWORD=$(az acr credential show --name kalviumRegistry --query passwords[0].value -o tsv)
az webapp config container set --resource-group nebula-resource-group \
  --name nebula-offline-academy \
  --docker-custom-image-name kalviumRegistry.azurecr.io/nebula-nextjs-app:latest \
  --docker-registry-server-url https://kalviumRegistry.azurecr.io \
  --docker-registry-server-user kalviumRegistry \
  --docker-registry-server-password $ACR_PASSWORD
```

### Deploy Updates (Recurring)

```bash
# Using deployment script
./scripts/deploy-azure.sh v1.0.0 production

# Manual steps:
# 1. Login to ACR
az acr login --name kalviumRegistry

# 2. Build & push
docker build -t kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0 .
docker push kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0

# 3. Restart app service
az webapp restart --resource-group nebula-resource-group \
  --name nebula-offline-academy
```

### Monitor Deployment

```bash
# Check status
az webapp show --resource-group nebula-resource-group --name nebula-offline-academy \
  --query '[state,defaultHostName]'

# View logs
az webapp log tail --resource-group nebula-resource-group \
  --name nebula-offline-academy --provider docker

# Get URL
az webapp show --resource-group nebula-resource-group \
  --name nebula-offline-academy --query defaultHostName -o tsv
```

## CI/CD Triggers

### GitHub Actions (AWS ECS)

```bash
# Push to trigger deployment
git push origin main        # Triggers full deploy to prod
git push origin develop     # Triggers build & test

# Manual trigger via CLI
gh workflow run deploy-ecs.yml -r main

# View workflow runs
gh run list --workflow=deploy-ecs.yml
gh run view RUN_ID --log
```

### Azure Pipelines

```bash
# Push to trigger deployment
git push origin main        # Triggers full deploy to prod
git push origin develop     # Triggers build & test

# Manual trigger via CLI
az pipelines run --org YOUR_ORG --project YOUR_PROJECT --pipeline-id PIPELINE_ID

# View builds
az pipelines build list --definition-ids PIPELINE_ID
```

## Environment Variables

### Local Development (.env.local)

```env
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
REDIS_URL=redis://redis:6379
NODE_ENV=development
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### AWS ECS (via Secrets Manager)

```
nebula/database-url
nebula/redis-url
nebula/nextauth-secret
```

Set in ECS Task Definition

### Azure App Service

```
WEBSITES_PORT=3000
NODE_ENV=production
DOCKER_ENABLE_CI=true
DATABASE_URL (from Key Vault)
REDIS_URL (from Key Vault)
```

## Troubleshooting

### Local Issues

```bash
# Container won't start
./scripts/deploy-local.sh logs app

# Database connection failed
./scripts/deploy-local.sh logs db

# Health check failing
curl http://localhost:3000/api/health

# Reset everything
./scripts/deploy-local.sh clean
./scripts/deploy-local.sh full-deploy
```

### AWS Issues

```bash
# Check task logs
aws logs tail /ecs/nebula-app --follow

# View task status
aws ecs describe-tasks --cluster nebula-cluster --tasks TASK_ARN

# Check service events
aws ecs describe-services --cluster nebula-cluster \
  --services nebula-app-service --query 'services[0].events[:5]'

# View service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=nebula-app-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 --statistics Average,Maximum
```

### Azure Issues

```bash
# Check logs
az webapp log tail --resource-group nebula-resource-group \
  --name nebula-offline-academy --provider docker

# Check app status
az webapp show --resource-group nebula-resource-group \
  --name nebula-offline-academy

# Restart app
az webapp restart --resource-group nebula-resource-group \
  --name nebula-offline-academy
```

## Important Links

- **DEPLOYMENT.md** - Full deployment guide with detailed instructions
- **Dockerfile** - Container configuration
- **docker-compose.yml** - Local development environment
- **aws-ecs-task-definition.json** - ECS task configuration
- **azure-app-service.json** - Azure ARM template
- **azure-pipelines.yml** - Azure CI/CD pipeline
- **.github/workflows/deploy-ecs.yml** - GitHub Actions workflow

## Deployment Checklist

### Before First Deployment

- [ ] Docker locally tested with `./scripts/deploy-local.sh full-deploy`
- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Security secrets stored in manager
- [ ] IAM roles created (AWS) or Key Vault set up (Azure)
- [ ] Load balancer configured with health checks
- [ ] SSL/TLS certificates installed
- [ ] Logging and monitoring enabled

### After Deployment

- [ ] Application accessible at public URL
- [ ] Health endpoint responding
- [ ] Database operations working
- [ ] Logs visible in CloudWatch/Azure Monitor
- [ ] Autoscaling metrics being collected
- [ ] No errors in application logs
- [ ] Performance within expected ranges

