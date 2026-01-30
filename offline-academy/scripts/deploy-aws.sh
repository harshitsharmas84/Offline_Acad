#!/bin/bash

# AWS ECR and ECS Deployment Script
# Usage: ./scripts/deploy-aws.sh [image-tag] [environment]

set -e

# Configuration
AWS_REGION="${AWS_REGION:-ap-south-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REPOSITORY="nebula-nextjs-app"
ECS_CLUSTER="nebula-cluster"
ECS_SERVICE="nebula-app-service"
ECS_TASK_DEFINITION="nebula-app-task-definition"
IMAGE_TAG="${1:-latest}"
ENVIRONMENT="${2:-staging}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if [ -z "$AWS_ACCOUNT_ID" ]; then
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        log_info "AWS Account ID: $AWS_ACCOUNT_ID"
    fi
    
    # Check Docker daemon is running
    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    log_info "All prerequisites validated!"
}

# Login to ECR
login_to_ecr() {
    log_info "Logging in to Amazon ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    log_info "Successfully logged in to ECR!"
}

# Create ECR repository if it doesn't exist
create_ecr_repository() {
    log_info "Checking if ECR repository exists..."
    
    if ! aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" &> /dev/null; then
        log_info "Creating ECR repository: $ECR_REPOSITORY"
        aws ecr create-repository \
            --repository-name "$ECR_REPOSITORY" \
            --region "$AWS_REGION" \
            --encryption-configuration encryptionType=AES \
            --tags Key=Environment,Value="$ENVIRONMENT" Key=Project,Value=Nebula
        
        # Set lifecycle policy to keep only last 10 images
        aws ecr put-lifecycle-policy \
            --repository-name "$ECR_REPOSITORY" \
            --lifecycle-policy-text '{"rules":[{"rulePriority":1,"description":"Keep last 10 images","selection":{"tagStatus":"any","countType":"imageCountMoreThan","countNumber":10},"action":{"type":"expire"}}]}' \
            --region "$AWS_REGION"
        
        log_info "ECR repository created successfully!"
    else
        log_info "ECR repository already exists."
    fi
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image with tag: $IMAGE_TAG"
    
    DOCKER_BUILDKIT=1 docker build \
        -t "$ECR_REPOSITORY:$IMAGE_TAG" \
        -t "$ECR_REPOSITORY:latest" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse HEAD)" \
        --build-arg VERSION="$IMAGE_TAG" \
        --cache-from type=registry,ref="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest" \
        .
    
    log_info "Docker image built successfully!"
}

# Tag and push to ECR
push_to_ecr() {
    log_info "Tagging and pushing image to ECR..."
    
    docker tag "$ECR_REPOSITORY:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
    docker tag "$ECR_REPOSITORY:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
    docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    
    log_info "Image pushed to ECR successfully!"
}

# Scan image for vulnerabilities
scan_image() {
    log_info "Scanning image for vulnerabilities..."
    
    aws ecr start-image-scan \
        --repository-name "$ECR_REPOSITORY" \
        --image-id imageTag="$IMAGE_TAG" \
        --region "$AWS_REGION"
    
    log_info "Image scan initiated. Check ECR console for detailed results."
}

# Update ECS task definition
update_task_definition() {
    log_info "Updating ECS task definition..."
    
    # Download current task definition
    aws ecs describe-task-definition \
        --task-definition "$ECS_TASK_DEFINITION" \
        --region "$AWS_REGION" > /tmp/task-definition.json
    
    # Create new revision with updated image
    NEW_TASK_DEF=$(cat /tmp/task-definition.json | jq \
        --arg IMAGE "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG" \
        '.taskDefinition | .containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')
    
    # Register new task definition
    NEW_REVISION=$(echo "$NEW_TASK_DEF" | aws ecs register-task-definition \
        --cli-input-json file:///dev/stdin \
        --region "$AWS_REGION" \
        --query 'taskDefinition.revision' \
        --output text)
    
    log_info "Task definition updated to revision: $NEW_REVISION"
}

# Deploy to ECS
deploy_to_ecs() {
    log_info "Deploying to ECS service..."
    
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --task-definition "$ECS_TASK_DEFINITION:$NEW_REVISION" \
        --region "$AWS_REGION" \
        --force-new-deployment
    
    log_info "Deployment initiated!"
}

# Wait for service to stabilize
wait_for_deployment() {
    log_info "Waiting for service to stabilize (this may take a few minutes)..."
    
    aws ecs wait services-stable \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --region "$AWS_REGION"
    
    log_info "Service is stable!"
}

# Get service information
get_service_info() {
    log_info "Retrieving service information..."
    
    SERVICE_INFO=$(aws ecs describe-services \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --region "$AWS_REGION" \
        --query 'services[0]')
    
    # Extract information
    LOAD_BALANCER=$(echo "$SERVICE_INFO" | jq -r '.loadBalancers[0].containerPort // "Not configured"')
    RUNNING_COUNT=$(echo "$SERVICE_INFO" | jq -r '.runningCount // 0')
    DESIRED_COUNT=$(echo "$SERVICE_INFO" | jq -r '.desiredCount // 0')
    
    log_info "Service Status:"
    echo "  - Running Tasks: $RUNNING_COUNT"
    echo "  - Desired Tasks: $DESIRED_COUNT"
    echo "  - Load Balancer Port: $LOAD_BALANCER"
    
    # Get load balancer DNS
    if [ "$LOAD_BALANCER" != "Not configured" ]; then
        LB_ARN=$(echo "$SERVICE_INFO" | jq -r '.loadBalancers[0].targetGroupArn')
        LB_DETAILS=$(aws elbv2 describe-target-groups \
            --target-group-arns "$LB_ARN" \
            --region "$AWS_REGION" \
            --query 'TargetGroups[0]')
        
        LB_DNS=$(echo "$LB_DETAILS" | jq -r '.TargetGroupAttributes[] | select(.Key == "deregistration_delay.timeout_seconds") | .Value // "pending"')
        log_info "Application URL: http://$LB_DNS"
    fi
}

# Main execution
main() {
    log_info "======================================"
    log_info "AWS ECS Deployment Script"
    log_info "======================================"
    log_info "Configuration:"
    echo "  - AWS Region: $AWS_REGION"
    echo "  - AWS Account ID: $AWS_ACCOUNT_ID"
    echo "  - ECR Repository: $ECR_REPOSITORY"
    echo "  - Image Tag: $IMAGE_TAG"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - ECS Cluster: $ECS_CLUSTER"
    echo "  - ECS Service: $ECS_SERVICE"
    echo ""
    
    validate_prerequisites
    login_to_ecr
    create_ecr_repository
    build_docker_image
    push_to_ecr
    scan_image
    update_task_definition
    deploy_to_ecs
    wait_for_deployment
    get_service_info
    
    log_info "======================================"
    log_info "Deployment completed successfully!"
    log_info "======================================"
}

main "$@"
