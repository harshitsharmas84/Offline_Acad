# Docker Containerization & Cloud Deployment Guide

> Comprehensive guide for containerizing the Nebula Offline Academy Next.js application and deploying it to AWS ECS (Fargate) or Azure App Service.

## Table of Contents

1. [Overview](#overview)
2. [Docker Containerization](#docker-containerization)
3. [Local Development & Testing](#local-development--testing)
4. [AWS ECS Deployment](#aws-ecs-deployment)
5. [Azure App Service Deployment](#azure-app-service-deployment)
6. [CI/CD Pipelines](#cicd-pipelines)
7. [Monitoring & Autoscaling](#monitoring--autoscaling)
8. [Deployment Considerations](#deployment-considerations)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Docker?

Docker is a containerization platform that packages your application with all its dependencies into a lightweight, portable container. This ensures your app runs identically across development, staging, and production environments.

### Why Containers?

- **Consistency**: Same image runs everywhere (dev → staging → prod)
- **Isolation**: Container-level resource management and security boundaries
- **Scalability**: Easily spin up multiple instances behind a load balancer
- **Rapid Deployment**: Images can be deployed in seconds
- **Resource Efficiency**: Containers use fewer resources than VMs

### Architecture

```
┌─────────────────────────────────────────────────┐
│        Load Balancer (ALB / Azure LB)           │
└──────────────┬──────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼──┐   ┌──▼───┐   ┌──▼───┐
│ Task │   │ Task │   │ Task │  (ECS/App Service)
│  #1  │   │  #2  │   │  #3  │
└───┬──┘   └──┬───┘   └──┬───┘
    │         │         │
    └─────────┼─────────┘
              │
    ┌─────────▼──────────┐
    │ Shared Services    │
    │ - Database         │
    │ - Redis Cache      │
    │ - Secrets Manager  │
    └────────────────────┘
```

---

## Docker Containerization

### Understanding the Dockerfile

The project uses a **two-stage build** approach for optimal image size and performance:

#### Stage 1: Builder
- Installs all dependencies (including dev)
- Builds the Next.js application
- Generates Prisma client
- Final image includes build artifacts

#### Stage 2: Runtime
- Minimal base image with only production dependencies
- Copies optimized build from builder
- Runs as non-root user for security
- Includes health checks
- ~300MB final image size

### Dockerfile Features

```dockerfile
# Multi-stage build for smaller image
FROM node:20-alpine AS builder
...
FROM node:20-alpine
...

# Non-root user for security
RUN adduser -S nextjs -u 1001
USER nextjs

# Health check configuration
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:3000/api/health

# Proper signal handling
ENTRYPOINT ["dumb-init", "--"]
```

### Build Arguments

The Docker build supports build arguments for metadata:

```bash
docker build \
  --build-arg BUILD_DATE="2024-01-30" \
  --build-arg VCS_REF="abc123def" \
  --build-arg VERSION="1.0.0" \
  -t nextjs-app .
```

---

## Local Development & Testing

### Quick Start with Docker Compose

**1. Start all services:**

```bash
./scripts/deploy-local.sh full-deploy
```

This will:
- Build containers
- Start all services (App, PostgreSQL, Redis)
- Initialize and seed the database
- Run health checks

**2. Access the application:**

```
Web App:  http://localhost:3000
Database: localhost:5432 (postgres/password)
Redis:    localhost:6379
```

### Available Commands

```bash
# View all available commands
./scripts/deploy-local.sh help

# Build containers
./scripts/deploy-local.sh build

# Start services
./scripts/deploy-local.sh start

# View logs
./scripts/deploy-local.sh logs app        # App logs
./scripts/deploy-local.sh logs db         # Database logs
./scripts/deploy-local.sh logs redis      # Redis logs
./scripts/deploy-local.sh logs            # All logs

# Access container shell
./scripts/deploy-local.sh shell app       # App shell
./scripts/deploy-local.sh shell db        # Database shell

# Check service status
./scripts/deploy-local.sh status

# Health check
./scripts/deploy-local.sh health

# Run tests
./scripts/deploy-local.sh test

# Performance benchmark
./scripts/deploy-local.sh benchmark

# Database operations
./scripts/deploy-local.sh init-db

# Stop services
./scripts/deploy-local.sh stop

# Clean everything
./scripts/deploy-local.sh clean
```

### Environment Variables

Create `.env.local` for local development:

```env
# Database
DATABASE_URL=postgresql://postgres:password@db:5432/mydb

# Redis
REDIS_URL=redis://redis:6379

# Next.js
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Health Checks

The application includes a health check endpoint:

```
GET /api/health
Response: { "status": "healthy", "timestamp": "2024-01-30T..." }
```

Docker will automatically restart unhealthy containers.

---

## AWS ECS Deployment

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed locally
4. **GitHub Repository** connected (for CI/CD)

### Step 1: Set Up AWS Resources

#### Create ECR Repository

```bash
# Create a private ECR repository
aws ecr create-repository \
  --repository-name nebula-nextjs-app \
  --region ap-south-1 \
  --encryption-configuration encryptionType=AES \
  --tags Key=Environment,Value=production Key=Project,Value=Nebula

# Set up lifecycle policy (keep last 10 images)
aws ecr put-lifecycle-policy \
  --repository-name nebula-nextjs-app \
  --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Keep last 10","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":10},"action":{"type":"expire"}}]}' \
  --region ap-south-1
```

#### Create ECS Cluster

```bash
# Create Fargate cluster
aws ecs create-cluster \
  --cluster-name nebula-cluster \
  --region ap-south-1 \
  --tags key=Environment,value=production key=Project,value=Nebula

# Enable container insights
aws ecs put-cluster-monitoring-settings \
  --cluster nebula-cluster \
  --region ap-south-1 \
  --update-status enabled
```

#### Create CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/nebula-app \
  --region ap-south-1

# Set retention to 30 days
aws logs put-retention-policy \
  --log-group-name /ecs/nebula-app \
  --retention-in-days 30 \
  --region ap-south-1
```

#### Set Up Secrets Manager

```bash
# Store database URL
aws secretsmanager create-secret \
  --name nebula/database-url \
  --secret-string "postgresql://user:pass@host:5432/db" \
  --region ap-south-1

# Store Redis URL
aws secretsmanager create-secret \
  --name nebula/redis-url \
  --secret-string "redis://host:6379" \
  --region ap-south-1

# Store NextAuth secret
aws secretsmanager create-secret \
  --name nebula/nextauth-secret \
  --secret-string "your-random-secret-key" \
  --region ap-south-1
```

### Step 2: Create IAM Roles

#### ECS Task Execution Role

```bash
# Create trust relationship
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

# Allow Secrets Manager access
cat > secrets-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:nebula/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name secreyManagerPolicy \
  --policy-document file://secrets-policy.json
```

#### ECS Task Role

```bash
# Create role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://trust-policy.json

# Add permissions for your application
cat > task-permissions.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-south-1:ACCOUNT_ID:log-group:/ecs/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name ecsTaskRole \
  --policy-name taskPolicy \
  --policy-document file://task-permissions.json
```

### Step 3: Build and Push Docker Image

```bash
# Use the deployment script
./scripts/deploy-aws.sh v1.0.0 production

# Or manually:
# 1. Login to ECR
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build image
docker build -t nebula-nextjs-app:v1.0.0 .

# 3. Tag image
docker tag nebula-nextjs-app:v1.0.0 \
  ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:v1.0.0

# 4. Push to ECR
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:v1.0.0
```

### Step 4: Register Task Definition

Update `aws-ecs-task-definition.json` with your account ID:

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://aws-ecs-task-definition.json \
  --region ap-south-1
```

### Step 5: Create Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name nebula-app-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxxx \
  --health-check-enabled \
  --health-check-path /api/health \
  --health-check-interval 30 \
  --health-check-timeout 5 \
  --health-check-healthy-threshold-count 2 \
  --health-check-unhealthy-threshold-count 3

# Create load balancer (if not exists)
aws elbv2 create-load-balancer \
  --name nebula-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application
```

### Step 6: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster nebula-cluster \
  --service-name nebula-app-service \
  --task-definition nebula-app-task-definition:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:ap-south-1:ACCOUNT_ID:targetgroup/nebula-app-tg/1234567890abcdef,containerName=nextjs-app,containerPort=3000 \
  --region ap-south-1
```

### Step 7: Deploy Autoscaling

```bash
# Deploy CloudFormation stack
aws cloudformation create-stack \
  --stack-name nebula-autoscaling \
  --template-body file://aws-autoscaling.yaml \
  --parameters \
    ParameterKey=ClusterName,ParameterValue=nebula-cluster \
    ParameterKey=ServiceName,ParameterValue=nebula-app-service \
    ParameterKey=MinCapacity,ParameterValue=2 \
    ParameterKey=MaxCapacity,ParameterValue=6 \
    ParameterKey=TargetCPUUtilization,ParameterValue=70 \
    ParameterKey=TargetMemoryUtilization,ParameterValue=80 \
  --region ap-south-1
```

### Monitoring ECS Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster nebula-cluster \
  --services nebula-app-service \
  --region ap-south-1

# View tasks
aws ecs list-tasks \
  --cluster nebula-cluster \
  --region ap-south-1

# Get task details
aws ecs describe-tasks \
  --cluster nebula-cluster \
  --tasks task-arn \
  --region ap-south-1

# View logs
aws logs tail /ecs/nebula-app --follow --region ap-south-1
```

---

## Azure App Service Deployment

### Prerequisites

1. **Azure Account** with subscription
2. **Azure CLI** installed and configured
3. **Docker** installed locally
4. **GitHub Repository** connected (for CI/CD)

### Step 1: Set Up Azure Resources

#### Create Resource Group

```bash
az group create \
  --name nebula-resource-group \
  --location eastus \
  --tags Environment=production Project=Nebula
```

#### Create Azure Container Registry (ACR)

```bash
# Create ACR
az acr create \
  --resource-group nebula-resource-group \
  --name kalviumRegistry \
  --sku Basic \
  --admin-enabled true

# Get login credentials
az acr credential show \
  --name kalviumRegistry \
  --resource-group nebula-resource-group
```

#### Create Storage Account (for persistent data)

```bash
az storage account create \
  --name nebulaappstg \
  --resource-group nebula-resource-group \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Create file share
az storage share create \
  --name app-data \
  --account-name nebulaappstg \
  --account-key $(az storage account keys list --resource-group nebula-resource-group --account-name nebulaappstg --query '[0].value' -o tsv)
```

### Step 2: Create App Service Plan

```bash
# Create App Service Plan
az appservice plan create \
  --name nebula-app-service-plan \
  --resource-group nebula-resource-group \
  --is-linux \
  --sku B2 \
  --number-of-workers 2
```

### Step 3: Build and Push Docker Image

```bash
# Use the deployment script
./scripts/deploy-azure.sh v1.0.0 production

# Or manually:
# 1. Login to ACR
az acr login --name kalviumRegistry

# 2. Build image
docker build -t kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0 .

# 3. Push to ACR
docker push kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0
```

### Step 4: Create Web App

```bash
# Create web app
az webapp create \
  --resource-group nebula-resource-group \
  --plan nebula-app-service-plan \
  --name nebula-offline-academy \
  --deployment-container-image-name kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0

# Configure container settings
az webapp config container set \
  --name nebula-offline-academy \
  --resource-group nebula-resource-group \
  --docker-custom-image-name kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0 \
  --docker-registry-server-url https://kalviumRegistry.azurecr.io \
  --docker-registry-server-user kalviumRegistry \
  --docker-registry-server-password $(az acr credential show --name kalviumRegistry --query passwords[0].value -o tsv)

# Enable continuous deployment
az webapp deployment container config \
  --name nebula-offline-academy \
  --resource-group nebula-resource-group \
  --enable-cd true

# Get webhook URL for CI/CD
az webapp deployment container show-cd-url \
  --name nebula-offline-academy \
  --resource-group nebula-resource-group
```

### Step 5: Configure Application Settings

```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy \
  --settings \
    NODE_ENV=production \
    WEBSITES_PORT=3000 \
    DOCKER_ENABLE_CI=true \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
    NEXTAUTH_URL=https://nebula-offline-academy.azurewebsites.net

# Set secrets from Azure Key Vault
az webapp config appsettings set \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy \
  --settings \
    DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://nebula-keyvault.vault.azure.net/secrets/database-url/) \
    REDIS_URL=@Microsoft.KeyVault(SecretUri=https://nebula-keyvault.vault.azure.net/secrets/redis-url/)
```

### Step 6: Deploy with ARM Template

```bash
# Deploy using ARM template
az deployment group create \
  --resource-group nebula-resource-group \
  --template-file azure-app-service.json \
  --parameters \
    appServicePlanName=nebula-app-service-plan \
    webAppName=nebula-offline-academy \
    dockerRegistryUrl=https://kalviumRegistry.azurecr.io \
    dockerImageName=kalviumRegistry.azurecr.io/nebula-nextjs-app:v1.0.0 \
    registryUsername=kalviumRegistry \
    registryPassword=$(az acr credential show --name kalviumRegistry --query passwords[0].value -o tsv)
```

### Monitoring Azure Deployment

```bash
# Check app status
az webapp show \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy

# View logs
az webapp log tail \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy \
  --provider docker

# Check deployment slots
az webapp deployment slot list \
  --resource-group nebula-resource-group \
  --name nebula-offline-academy
```

---

## CI/CD Pipelines

### GitHub Actions (AWS ECS)

The `.github/workflows/deploy-ecs.yml` pipeline:

1. **Build & Push** - Builds image and pushes to ECR
2. **Security Scan** - Scans image with Trivy
3. **Test** - Runs linter and tests
4. **Deploy** - Updates ECS service (main branch only)
5. **Verify** - Health checks after deployment

**Setup:**

```bash
# Add GitHub secrets
gh secret set AWS_ROLE_TO_ASSUME --body "arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole"
gh secret set AWS_ACCOUNT_ID --body "ACCOUNT_ID"
```

**Workflow Trigger:**

```bash
# Automatically triggered on push to main or develop
# Can be manually triggered via GitHub UI
```

### Azure Pipelines

The `azure-pipelines.yml` pipeline:

1. **Build** - Builds image and pushes to ACR
2. **Security** - Container vulnerability scanning
3. **Test** - Runs linter and tests
4. **Deploy** - Deploys to App Service (main branch only)
5. **Verify** - Health checks and smoke tests

**Setup:**

```bash
# Create Azure DevOps pipeline
# Connect to GitHub repository
# Set pipeline variables in Azure DevOps UI:
#   - AZURE_SUBSCRIPTION
#   - AZURE_RESOURCE_GROUP
#   - AZURE_REGISTRY_NAME
#   - AZURE_REGISTRY_SERVICE_CONNECTION
```

---

## Monitoring & Autoscaling

### AWS Autoscaling

**Autoscaling Policies:**

- **CPU-based**: Scale up at 70%, scale down at 25%
- **Memory-based**: Scale up at 80%, scale down at 40%
- **Request-based**: Scale based on requests per target

**Scaling Limits:**

- Minimum: 2 tasks
- Maximum: 6 tasks
- Cool down: 5-10 minutes between scaling actions

**CloudWatch Alarms:**

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name nebula-high-cpu \
  --alarm-description "Alert when CPU > 90%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 90 \
  --comparison-operator GreaterThanThreshold
```

### Azure Autoscaling

**App Service Autoscale Rules:**

```
Rule 1: CPU > 70% → Add 1 instance
Rule 2: CPU < 25% → Remove 1 instance
Rule 3: Memory > 80% → Add 1 instance
```

**Scale Limits:**

- Minimum: 1 instance
- Maximum: 5 instances

### Health Checks

**Container Health Check:**

```
Interval: 30 seconds
Timeout: 3 seconds
Unhealthy threshold: 3 failed checks
```

**Application Health Endpoint:**

```
GET /api/health
Response: { "status": "healthy" }
```

---

## Deployment Considerations

### Cold Starts

**What are cold starts?**

Cold starts occur when:
- First request to a new container
- Container scales up from zero
- Container is restarted

**Optimization strategies:**

1. **Pre-warm containers**: Keep minimum tasks running (2+)
2. **Optimize build**: Reduce dependencies, use alpine base
3. **Connection pooling**: Use PgBouncer for database
4. **Cache warming**: Pre-load hot data on startup

**Metrics:**

- Cold start time: ~5-10 seconds
- Warm start time: <1 second
- Build size: ~300MB → ~100MB with optimization

### Resource Sizing

**Recommended Configuration:**

```
Development:
- CPU: 256 (0.25 vCPU)
- Memory: 512 MB
- Tasks: 1

Staging:
- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB
- Tasks: 2

Production:
- CPU: 1024 (1 vCPU)
- Memory: 2048 MB (2 GB)
- Tasks: 2-6 (with autoscaling)
```

**Cost Optimization:**

- Use Fargate Spot instances (30% cheaper, no uptime guarantee)
- Schedule scaling: Reduce tasks during off-hours
- Right-size tasks: Monitor actual usage, adjust as needed

### Security Best Practices

1. **Run as non-root user**: ✓ (Configured in Dockerfile)
2. **Scan images for vulnerabilities**: ✓ (Trivy in CI/CD)
3. **Use secrets manager**: ✓ (AWS Secrets Manager)
4. **Enable HTTPS**: Use ALB with SSL/TLS
5. **Network security**: Use VPC, security groups, NACLs
6. **Logging & Monitoring**: CloudWatch, Container Insights

### Database Connection Management

```javascript
// Use connection pooling with Prisma
// Recommended: 5-20 connections per replica
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})
```

---

## Troubleshooting

### Common Issues

#### 1. Container fails to start

```bash
# Check logs
aws logs tail /ecs/nebula-app --follow

# Check task status
aws ecs describe-tasks --cluster nebula-cluster --tasks TASK_ARN

# Common causes:
# - Missing environment variables
# - Database connection string wrong
# - Insufficient memory allocated
```

#### 2. Application is slow

```bash
# Check resource utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --start-time 2024-01-30T00:00:00Z \
  --end-time 2024-01-30T23:59:59Z \
  --period 300 \
  --statistics Average,Maximum

# Check if scaling is happening
aws ecs describe-services \
  --cluster nebula-cluster \
  --services nebula-app-service

# Solutions:
# - Increase task CPU/memory
# - Scale up minimum task count
# - Optimize database queries
# - Enable caching
```

#### 3. Health check failing

```bash
# Test health endpoint locally
curl http://localhost:3000/api/health

# Check if API is running
docker logs container-name | grep "health"

# Common causes:
# - Application startup takes too long
# - Database not connected
# - Missing /api/health endpoint
```

#### 4. Out of memory errors

```bash
# Check memory usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --period 300 \
  --statistics Maximum

# Solutions:
# - Increase memory allocation
# - Reduce caching aggressiveness
# - Optimize application code
# - Split into multiple services
```

### Debug Commands

```bash
# SSH into running container (AWS)
aws ecs execute-command \
  --cluster nebula-cluster \
  --task TASK_ID \
  --container nextjs-app \
  --interactive \
  --command "/bin/sh"

# SSH into Azure container
az webapp ssh --resource-group nebula-resource-group --name nebula-offline-academy

# Check image layers
docker history ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/nebula-nextjs-app:latest

# Inspect container configuration
docker inspect IMAGE_ID

# Test image locally
docker run -p 3000:3000 IMAGE_ID
```

---

## Conclusion

This setup provides:

✓ Containerized Next.js application with multi-stage builds  
✓ Local development environment matching production  
✓ Automated CI/CD pipelines for AWS and Azure  
✓ Auto-scaling based on CPU and memory metrics  
✓ Health checks and monitoring  
✓ Security best practices (non-root user, secrets management)  
✓ Easy rollback capabilities  
✓ Cost optimization options  

### Next Steps

1. **Set up monitoring**: CloudWatch dashboards, Azure Monitor
2. **Configure alerting**: Slack, PagerDuty integrations
3. **Plan disaster recovery**: Multi-region deployment
4. **Document runbooks**: Standard operating procedures
5. **Performance testing**: Load testing before production
6. **Security scanning**: Regular vulnerability assessments

### Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Container Security](https://www.cisecurity.org/cis-docker-benchmark)

