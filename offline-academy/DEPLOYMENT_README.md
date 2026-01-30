# Nebula Offline Academy - Docker & Cloud Deployment

> A complete Next.js full-stack application with containerized deployment to AWS ECS (Fargate) or Azure App Service, including automated CI/CD pipelines, autoscaling, and production-ready monitoring.

## 📚 Documentation

This project includes comprehensive deployment documentation:

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with step-by-step instructions
- **[DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)** - Quick commands reference
- **[DEPLOYMENT_TESTING.md](./DEPLOYMENT_TESTING.md)** - Testing and validation procedures
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - CI/CD pipeline configuration

## 🚀 Quick Start

### Local Development

```bash
# Full local deployment (build, start, init DB, health check)
./scripts/deploy-local.sh full-deploy

# Access application
# Web: http://localhost:3000
# Database: localhost:5432 (postgres/password)
# Redis: localhost:6379
```

### AWS ECS Deployment

```bash
# Configure AWS credentials
aws configure

# Deploy to production
./scripts/deploy-aws.sh v1.0.0 production

# Monitor deployment
aws logs tail /ecs/nebula-app --follow
```

### Azure App Service Deployment

```bash
# Login to Azure
az login

# Deploy to production
./scripts/deploy-azure.sh v1.0.0 production

# View logs
az webapp log tail --resource-group nebula-resource-group \
  --name nebula-offline-academy --provider docker
```

## 📁 Project Structure

```
offline-academy/
├── Dockerfile                          # Multi-stage Docker build
├── docker-compose.yml                  # Local development environment
├── .dockerignore                       # Docker build exclusions
├── DEPLOYMENT.md                       # Full deployment guide
├── DEPLOYMENT_QUICK_REFERENCE.md       # Quick reference
├── DEPLOYMENT_TESTING.md               # Testing procedures
├── GITHUB_ACTIONS_SETUP.md             # CI/CD setup
├── aws-ecs-task-definition.json        # ECS task config
├── aws-ecs-service-definition.json     # ECS service config
├── aws-autoscaling.yaml                # AWS autoscaling rules
├── azure-app-service.json              # Azure ARM template
├── azure-pipelines.yml                 # Azure CI/CD pipeline
├── .github/workflows/
│   └── deploy-ecs.yml                  # GitHub Actions for AWS
├── scripts/
│   ├── deploy-local.sh                 # Local deployment script
│   ├── deploy-aws.sh                   # AWS deployment script
│   └── deploy-azure.sh                 # Azure deployment script
└── src/
    └── app/
        └── api/
            └── health/
                └── route.ts            # Health check endpoint
```

## 🐳 Docker Overview

### What's Included

- **Multi-stage Dockerfile**: Optimized build (300-400MB image)
- **Non-root user**: Security hardened (nextjs:nextjs)
- **Health checks**: Automatic container restart on failure
- **Signal handling**: Graceful shutdown with dumb-init
- **Production optimized**: Alpine base, minimal dependencies

### Build & Run

```bash
# Build image
docker build -t nebula-nextjs-app:latest .

# Run locally
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  nebula-nextjs-app:latest

# Test health
curl http://localhost:3000/api/health
```

## ☁️ Cloud Platforms

### AWS ECS (Fargate)

**Architecture:**
```
Load Balancer (ALB)
    ↓
ECS Cluster (nebula-cluster)
├── Task 1 (0.5 vCPU, 1GB RAM)
├── Task 2 (0.5 vCPU, 1GB RAM)
└── Task N (auto-scales 2-6)
    ↓
Shared Services
├── RDS (PostgreSQL)
├── ElastiCache (Redis)
└── Secrets Manager
```

**Key Features:**
- Fargate launch type (no server management)
- Auto-scaling: CPU/memory/request-based
- CloudWatch logging and monitoring
- Secrets Manager for sensitive data
- Application Load Balancer

**Deployment:**
```bash
./scripts/deploy-aws.sh [version] [environment]
```

### Azure App Service

**Architecture:**
```
Load Balancer
    ↓
App Service Plan (nebula-app-service-plan)
├── Instance 1
├── Instance 2
└── Instance N (auto-scales 1-5)
    ↓
Shared Services
├── Azure Database (PostgreSQL)
├── Azure Cache (Redis)
└── Key Vault
```

**Key Features:**
- Container support (ACR integration)
- Automatic scaling based on metrics
- Azure Monitor logging
- Key Vault for secrets
- Built-in deployment slots

**Deployment:**
```bash
./scripts/deploy-azure.sh [version] [environment]
```

## 🔄 CI/CD Pipelines

### GitHub Actions (AWS ECS)

**Trigger:** Push to main/develop branches

**Pipeline Stages:**
1. **Build & Push** - Build image, push to ECR
2. **Security Scan** - Trivy vulnerability scanning
3. **Test** - Lint, build, and run tests
4. **Deploy** - Update ECS service (main only)
5. **Verify** - Health checks after deployment

**File:** `.github/workflows/deploy-ecs.yml`

### Azure Pipelines

**Trigger:** Push to main/develop branches

**Pipeline Stages:**
1. **Build** - Build image, push to ACR
2. **Security** - Container vulnerability scanning
3. **Test** - Lint, build, and run tests
4. **Deploy** - Deploy to App Service (main only)
5. **Verify** - Smoke tests

**File:** `azure-pipelines.yml`

## 📊 Monitoring & Scaling

### AWS ECS Autoscaling

```
Metrics:
- CPU: Scale up at 70%, down at 25%
- Memory: Scale up at 80%, down at 40%
- Request count: Scale based on ALB requests

Limits:
- Min tasks: 2
- Max tasks: 6
- Cool down: 5-10 minutes
```

### Azure App Service Autoscaling

```
Metrics:
- CPU: Scale up at 70%, down at 25%
- Memory: Scale up at 80%, down at 40%

Limits:
- Min instances: 1
- Max instances: 5
```

### Health Checks

```
Endpoint: GET /api/health
Interval: 30 seconds
Timeout: 3 seconds
Unhealthy threshold: 3 failed checks
```

## 🔐 Security

- ✅ Non-root user execution
- ✅ Secrets Manager integration
- ✅ Container image scanning (Trivy)
- ✅ HTTPS/TLS termination (ALB/LB)
- ✅ VPC/network isolation
- ✅ Security group restrictions
- ✅ CloudWatch encryption
- ✅ Database encryption

## 📈 Performance Optimization

### Cold Start Optimization

```
Strategies:
1. Pre-warm containers (minimum 2 tasks)
2. Optimize dependencies
3. Use Alpine base image
4. Connection pooling
5. Caching strategy

Metrics:
- Cold start: ~5-10 seconds
- Warm start: <1 second
- Image size: 300-400MB
```

### Resource Sizing

```
Development:
- CPU: 256 (0.25 vCPU)
- Memory: 512 MB
- Instances: 1

Production:
- CPU: 1024 (1 vCPU)
- Memory: 2048 MB (2GB)
- Instances: 2-6 (with autoscaling)
```

## 🧪 Testing

### Local Testing

```bash
# Full test suite
./scripts/deploy-local.sh full-deploy

# Individual tests
./scripts/deploy-local.sh health       # Health check
./scripts/deploy-local.sh test         # Linter & tests
./scripts/deploy-local.sh benchmark    # Load test
```

### Cloud Testing

See `DEPLOYMENT_TESTING.md` for:
- Container build validation
- ECS/App Service testing
- Load testing procedures
- Smoke testing scripts
- Performance benchmarks

## 🛠️ Troubleshooting

### Common Issues

**Container won't start:**
```bash
./scripts/deploy-local.sh logs app
```

**Health check failing:**
```bash
curl http://localhost:3000/api/health
```

**Slow deployment:**
- Check task memory/CPU allocation
- Verify database connectivity
- Review CloudWatch logs

**Scaling not working:**
- Verify autoscaling policies
- Check CloudWatch metrics
- Review cool-down periods

See `DEPLOYMENT.md` → Troubleshooting for detailed solutions.

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Docker image builds successfully
- [ ] Local tests pass
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Security scanning passed
- [ ] Secrets stored in manager
- [ ] IAM roles created

### Post-Deployment

- [ ] Application accessible
- [ ] Health endpoint responding
- [ ] Database operations working
- [ ] Logs visible in monitoring
- [ ] Auto-scaling enabled
- [ ] Performance within expected ranges

## 📚 Learning Resources

### Docker & Containers
- [Docker Documentation](https://docs.docker.com/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
- [Container Security Best Practices](https://www.cisecurity.org/cis-docker-benchmark)

### AWS ECS
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Fargate Pricing Calculator](https://aws.amazon.com/ecs/pricing/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-best-practices.html)

### Azure App Service
- [App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Container Support](https://docs.microsoft.com/en-us/azure/app-service/app-service-web-get-started-docker)
- [Autoscaling Guide](https://docs.microsoft.com/en-us/azure/app-service/manage-scale-up)

### CI/CD
- [GitHub Actions](https://docs.github.com/en/actions)
- [Azure Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/)

## 🤝 Contributing

When adding features:

1. Test locally with `./scripts/deploy-local.sh`
2. Push changes (triggers CI/CD)
3. Review test results in GitHub/Azure
4. Deploy to staging first
5. Verify in production

## 📞 Support

For issues or questions:

1. Check `DEPLOYMENT.md` documentation
2. Review `DEPLOYMENT_TESTING.md` for validation
3. Check `GITHUB_ACTIONS_SETUP.md` for CI/CD issues
4. Run local tests with `./scripts/deploy-local.sh`

## 📄 License

[Your License Here]

## 🎯 Next Steps

1. **Set up local development:**
   ```bash
   ./scripts/deploy-local.sh full-deploy
   ```

2. **Configure cloud provider:**
   - AWS: Follow `DEPLOYMENT.md` → AWS ECS Deployment
   - Azure: Follow `DEPLOYMENT.md` → Azure App Service Deployment

3. **Set up CI/CD:**
   - Read `GITHUB_ACTIONS_SETUP.md`
   - Add GitHub secrets

4. **Deploy to production:**
   ```bash
   ./scripts/deploy-aws.sh v1.0.0 production
   # or
   ./scripts/deploy-azure.sh v1.0.0 production
   ```

5. **Monitor deployment:**
   - AWS: CloudWatch Dashboard
   - Azure: Azure Monitor Dashboard

---

**Last Updated:** January 30, 2024  
**Version:** 1.0.0  
**Status:** Production Ready
