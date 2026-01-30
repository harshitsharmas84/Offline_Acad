#!/bin/bash

# Azure App Service and ACR Deployment Script
# Usage: ./scripts/deploy-azure.sh [image-tag] [environment]

set -e

# Configuration
AZURE_SUBSCRIPTION="${AZURE_SUBSCRIPTION:-}"
AZURE_RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-nebula-resource-group}"
AZURE_REGISTRY_NAME="${AZURE_REGISTRY_NAME:-kalviumregistry}"
AZURE_APP_NAME="${AZURE_APP_NAME:-nebula-offline-academy}"
IMAGE_TAG="${1:-latest}"
ENVIRONMENT="${2:-staging}"
LOCATION="eastus"

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
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check Docker daemon is running
    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    # Set subscription if provided
    if [ -n "$AZURE_SUBSCRIPTION" ]; then
        az account set --subscription "$AZURE_SUBSCRIPTION"
    fi
    
    # Check if logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Run 'az login' first."
        exit 1
    fi
    
    log_info "All prerequisites validated!"
}

# Create resource group if it doesn't exist
create_resource_group() {
    log_info "Checking if resource group exists: $AZURE_RESOURCE_GROUP"
    
    if ! az group exists --name "$AZURE_RESOURCE_GROUP" | grep -q true; then
        log_info "Creating resource group: $AZURE_RESOURCE_GROUP"
        az group create \
            --name "$AZURE_RESOURCE_GROUP" \
            --location "$LOCATION" \
            --tags Environment="$ENVIRONMENT" Project="Nebula"
        log_info "Resource group created successfully!"
    else
        log_info "Resource group already exists."
    fi
}

# Create ACR if it doesn't exist
create_azure_container_registry() {
    log_info "Checking if Azure Container Registry exists: $AZURE_REGISTRY_NAME"
    
    if ! az acr show --name "$AZURE_REGISTRY_NAME" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
        log_info "Creating Azure Container Registry: $AZURE_REGISTRY_NAME"
        az acr create \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --name "$AZURE_REGISTRY_NAME" \
            --sku Basic \
            --admin-enabled true
        log_info "ACR created successfully!"
    else
        log_info "ACR already exists."
    fi
}

# Login to ACR
login_to_acr() {
    log_info "Logging in to Azure Container Registry..."
    az acr login --name "$AZURE_REGISTRY_NAME"
    log_info "Successfully logged in to ACR!"
}

# Build Docker image
build_docker_image() {
    log_info "Building Docker image with tag: $IMAGE_TAG"
    
    DOCKER_BUILDKIT=1 docker build \
        -t "$AZURE_REGISTRY_NAME.azurecr.io/nebula-nextjs-app:$IMAGE_TAG" \
        -t "$AZURE_REGISTRY_NAME.azurecr.io/nebula-nextjs-app:latest" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse HEAD)" \
        --build-arg VERSION="$IMAGE_TAG" \
        .
    
    log_info "Docker image built successfully!"
}

# Push to ACR
push_to_acr() {
    log_info "Pushing image to Azure Container Registry..."
    
    docker push "$AZURE_REGISTRY_NAME.azurecr.io/nebula-nextjs-app:$IMAGE_TAG"
    docker push "$AZURE_REGISTRY_NAME.azurecr.io/nebula-nextjs-app:latest"
    
    log_info "Image pushed to ACR successfully!"
}

# Get ACR credentials
get_acr_credentials() {
    log_info "Retrieving ACR credentials..."
    
    ACR_CREDENTIALS=$(az acr credential show \
        --name "$AZURE_REGISTRY_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP")
    
    REGISTRY_USERNAME=$(echo "$ACR_CREDENTIALS" | jq -r '.username')
    REGISTRY_PASSWORD=$(echo "$ACR_CREDENTIALS" | jq -r '.passwords[0].value')
    
    log_info "ACR credentials retrieved!"
}

# Create or update App Service Plan
create_app_service_plan() {
    log_info "Checking if App Service Plan exists..."
    
    APP_SERVICE_PLAN="nebula-app-service-plan"
    
    if ! az appservice plan show --name "$APP_SERVICE_PLAN" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
        log_info "Creating App Service Plan: $APP_SERVICE_PLAN"
        az appservice plan create \
            --name "$APP_SERVICE_PLAN" \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --is-linux \
            --sku B2 \
            --number-of-workers 2
        log_info "App Service Plan created successfully!"
    else
        log_info "App Service Plan already exists."
    fi
}

# Deploy or update Web App
deploy_web_app() {
    log_info "Deploying to Azure App Service: $AZURE_APP_NAME"
    
    REGISTRY_URL="https://$AZURE_REGISTRY_NAME.azurecr.io"
    IMAGE_URL="$AZURE_REGISTRY_NAME.azurecr.io/nebula-nextjs-app:$IMAGE_TAG"
    
    if ! az webapp show --name "$AZURE_APP_NAME" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
        log_info "Creating Web App: $AZURE_APP_NAME"
        az webapp create \
            --resource-group "$AZURE_RESOURCE_GROUP" \
            --plan "nebula-app-service-plan" \
            --name "$AZURE_APP_NAME" \
            --deployment-container-image-name "$IMAGE_URL"
    else
        log_info "Web App exists, updating configuration..."
    fi
    
    # Configure container settings
    az webapp config container set \
        --name "$AZURE_APP_NAME" \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --docker-custom-image-name "$IMAGE_URL" \
        --docker-registry-server-url "$REGISTRY_URL" \
        --docker-registry-server-user "$REGISTRY_USERNAME" \
        --docker-registry-server-password "$REGISTRY_PASSWORD"
    
    # Configure app settings
    az webapp config appsettings set \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "$AZURE_APP_NAME" \
        --settings \
            NODE_ENV=production \
            WEBSITES_PORT=3000 \
            DOCKER_ENABLE_CI=true \
            WEBSITES_ENABLE_APP_SERVICE_STORAGE=false
    
    # Enable continuous deployment
    az webapp config appsettings set \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "$AZURE_APP_NAME" \
        --settings DOCKER_ENABLE_CI=true
    
    log_info "Web App deployed successfully!"
}

# Configure autoscaling
configure_autoscaling() {
    log_info "Configuring autoscaling for App Service Plan..."
    
    AUTOSCALE_SETTING_NAME="nebula-app-autoscale"
    APP_SERVICE_PLAN="nebula-app-service-plan"
    
    # This is handled by Azure deployment template, but you can configure here if needed
    log_info "Autoscaling will be configured via ARM template deployment."
}

# Get deployment information
get_deployment_info() {
    log_info "Retrieving deployment information..."
    
    APP_INFO=$(az webapp show \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "$AZURE_APP_NAME")
    
    APP_URL=$(echo "$APP_INFO" | jq -r '.defaultHostName')
    STATE=$(echo "$APP_INFO" | jq -r '.state')
    
    log_info "Web App Status:"
    echo "  - State: $STATE"
    echo "  - URL: https://$APP_URL"
    echo "  - Resource Group: $AZURE_RESOURCE_GROUP"
    
    # Get latest deployment logs
    log_info "Deployment logs:"
    az webapp log tail \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "$AZURE_APP_NAME" \
        --provider docker \
        --max-lines 20 || true
}

# Main execution
main() {
    log_info "======================================"
    log_info "Azure App Service Deployment Script"
    log_info "======================================"
    log_info "Configuration:"
    echo "  - Azure Resource Group: $AZURE_RESOURCE_GROUP"
    echo "  - Azure Registry: $AZURE_REGISTRY_NAME"
    echo "  - App Name: $AZURE_APP_NAME"
    echo "  - Image Tag: $IMAGE_TAG"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Location: $LOCATION"
    echo ""
    
    validate_prerequisites
    create_resource_group
    create_azure_container_registry
    login_to_acr
    build_docker_image
    push_to_acr
    get_acr_credentials
    create_app_service_plan
    deploy_web_app
    configure_autoscaling
    sleep 30  # Wait for app to start
    get_deployment_info
    
    log_info "======================================"
    log_info "Deployment completed successfully!"
    log_info "======================================"
}

main "$@"
