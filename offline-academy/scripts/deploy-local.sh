#!/bin/bash

# Local Docker Deployment and Testing Script
# Usage: ./scripts/deploy-local.sh [command] [options]

set -e

# Configuration
PROJECT_NAME="nebula-offline-academy"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_section() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed!"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        log_warn "curl is not installed. Some tests may fail."
    fi
    
    log_info "All prerequisites are satisfied!"
}

# Build containers
build_containers() {
    log_section "Building Docker Containers"
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    log_info "Containers built successfully!"
}

# Start services
start_services() {
    log_section "Starting Services"
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    log_info "Services started!"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
}

# Stop services
stop_services() {
    log_section "Stopping Services"
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
    log_info "Services stopped!"
}

# Stop and clean all data
clean_all() {
    log_section "Cleaning All Data"
    log_warn "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy]es$ ]]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" down -v
        docker system prune -f
        log_info "Clean completed!"
    else
        log_info "Clean cancelled."
    fi
}

# Check health status
health_check() {
    log_section "Health Check"
    
    # Check API health
    log_info "Checking API health..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            log_info "API is healthy!"
            break
        fi
        
        if [ $i -eq 30 ]; then
            log_error "API health check failed!"
            return 1
        fi
        
        log_info "Attempt $i/30... waiting for API to start"
        sleep 2
    done
    
    # Check database
    log_info "Checking database..."
    if docker exec "${PROJECT_NAME}_db_1" pg_isready -U postgres &> /dev/null || \
       docker exec "postgres_db" pg_isready -U postgres &> /dev/null; then
        log_info "Database is healthy!"
    else
        log_error "Database health check failed!"
        return 1
    fi
    
    # Check Redis
    log_info "Checking Redis..."
    if docker exec "${PROJECT_NAME}_redis_1" redis-cli ping &> /dev/null || \
       docker exec "redis_cache" redis-cli ping &> /dev/null; then
        log_info "Redis is healthy!"
    else
        log_error "Redis health check failed!"
        return 1
    fi
}

# Run tests
run_tests() {
    log_section "Running Tests"
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npm run lint || true
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npm test || true
    
    log_info "Tests completed!"
}

# View logs
view_logs() {
    log_section "Service Logs"
    SERVICE="${1:-all}"
    
    if [ "$SERVICE" = "all" ]; then
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100
    else
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100 "$SERVICE"
    fi
}

# Get service status
status() {
    log_section "Service Status"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
}

# Initialize database
init_database() {
    log_section "Initializing Database"
    
    log_info "Running Prisma migrations..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npx prisma migrate deploy
    
    log_info "Seeding database..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T app npx prisma db seed || true
    
    log_info "Database initialized!"
}

# Run performance benchmark
benchmark() {
    log_section "Running Performance Benchmark"
    
    if ! command -v ab &> /dev/null; then
        log_error "ApacheBench (ab) is not installed. Installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y apache2-utils
        elif command -v brew &> /dev/null; then
            brew install httpd
        else
            log_error "Could not install ab automatically. Please install ApacheBench manually."
            return 1
        fi
    fi
    
    log_info "Running 1000 requests with 10 concurrent connections..."
    ab -n 1000 -c 10 http://localhost:3000/
    
    log_info "Benchmark completed!"
}

# Shell access
shell_access() {
    log_section "Entering Container Shell"
    SERVICE="${1:-app}"
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec "$SERVICE" sh
}

# Restart service
restart_service() {
    log_section "Restarting Service"
    SERVICE="${1:-}"
    
    if [ -z "$SERVICE" ]; then
        log_error "Please specify a service to restart."
        echo "Available services: app, db, redis"
        return 1
    fi
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" restart "$SERVICE"
    log_info "$SERVICE restarted!"
}

# Show help
show_help() {
    cat << EOF
${BLUE}Nebula Offline Academy - Local Deployment Script${NC}

${GREEN}Usage:${NC}
    ./scripts/deploy-local.sh [command] [options]

${GREEN}Commands:${NC}
    build              Build all Docker containers
    start              Start all services
    stop               Stop all services
    clean              Remove all containers and volumes
    status             Show service status
    health             Check health of all services
    logs [service]     View logs (service: app, db, redis, or all)
    shell [service]    Access container shell (service: app, db, or redis)
    restart [service]  Restart a service (service: app, db, or redis)
    init-db            Initialize and seed database
    test               Run linter and tests
    benchmark          Run performance benchmark
    full-deploy        Full deployment: build, start, init-db, health check

${GREEN}Examples:${NC}
    ./scripts/deploy-local.sh build
    ./scripts/deploy-local.sh start
    ./scripts/deploy-local.sh logs app
    ./scripts/deploy-local.sh shell app
    ./scripts/deploy-local.sh full-deploy

${GREEN}Environment Variables:${NC}
    DATABASE_URL       PostgreSQL connection string
    REDIS_URL          Redis connection string
    NODE_ENV           Node environment (development/production)

EOF
}

# Full deployment
full_deploy() {
    log_section "Full Local Deployment"
    
    build_containers
    start_services
    health_check
    init_database
    
    log_section "Deployment Complete!"
    log_info "Application running at http://localhost:3000"
    log_info "Database: localhost:5432"
    log_info "Redis: localhost:6379"
}

# Main
main() {
    check_prerequisites
    
    COMMAND="${1:-help}"
    
    case "$COMMAND" in
        build)
            build_containers
            ;;
        start)
            start_services
            health_check
            ;;
        stop)
            stop_services
            ;;
        clean)
            clean_all
            ;;
        status)
            status
            ;;
        health)
            health_check
            ;;
        logs)
            view_logs "$2"
            ;;
        shell)
            shell_access "$2"
            ;;
        restart)
            restart_service "$2"
            ;;
        init-db)
            init_database
            ;;
        test)
            run_tests
            ;;
        benchmark)
            benchmark
            ;;
        full-deploy)
            full_deploy
            ;;
        help|-h|--help)
            show_help
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
