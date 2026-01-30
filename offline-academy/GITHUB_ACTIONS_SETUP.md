# GitHub Actions & CI/CD Setup Guide

## Prerequisites

- GitHub account with repository access
- AWS account with IAM permissions
- Azure account (optional, for Azure deployment)
- AWS CLI or Azure CLI configured locally

## GitHub Secrets Setup

### AWS Deployment Secrets

Add these secrets to your GitHub repository:

1. **AWS_ROLE_TO_ASSUME** (for OIDC authentication)
   ```
   ARN format: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
   ```

2. **AWS_ACCOUNT_ID**
   ```
   Your AWS account ID: 123456789012
   ```

### Getting AWS Credentials

#### Option 1: OIDC Provider (Recommended - More Secure)

```bash
# 1. Create GitHub OIDC provider in AWS
# Go to AWS IAM → Identity Providers → Add Provider
# Select: OpenID Connect
# Provider URL: https://token.actions.githubusercontent.com
# Audience: sts.amazonaws.com

# 2. Create IAM role for GitHub Actions
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/YOUR_REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
EOF

# 3. Create role
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://trust-policy.json

# 4. Attach policies
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add custom policy for ECS
cat > ecs-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTaskSets",
        "ecs:ListTasks",
        "ecs:ListTaskDefinitions",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:ACCOUNT_ID:secret:nebula/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name GitHubActionsRole \
  --policy-name ECSManagementPolicy \
  --policy-document file://ecs-policy.json

# 5. Add GitHub secret
gh secret set AWS_ROLE_TO_ASSUME --body "arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole"
gh secret set AWS_ACCOUNT_ID --body "ACCOUNT_ID"
```

#### Option 2: Access Keys (Simpler but Less Secure)

```bash
# 1. Create IAM user for GitHub Actions
aws iam create-user --user-name github-actions

# 2. Attach policies
aws iam attach-user-policy \
  --user-name github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser

aws iam attach-user-policy \
  --user-name github-actions \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# 3. Create access keys
aws iam create-access-key --user-name github-actions

# 4. Add GitHub secrets
gh secret set AWS_ACCESS_KEY_ID --body "AKIAIOSFODNN7EXAMPLE"
gh secret set AWS_SECRET_ACCESS_KEY --body "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
gh secret set AWS_DEFAULT_REGION --body "ap-south-1"
```

### Azure Deployment Secrets

If deploying to Azure, add these secrets:

1. **AZURE_SUBSCRIPTION** - Your subscription ID
2. **AZURE_RESOURCE_GROUP** - Your resource group name
3. **AZURE_REGISTRY_NAME** - Your ACR name
4. **AZURE_REGISTRY_SERVICE_CONNECTION** - Service connection name

```bash
# Get Azure subscription ID
az account show --query id -o tsv

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID

# Add secrets
gh secret set AZURE_CREDENTIALS --body '{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}'
```

## Setting Up Secrets via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Login to GitHub
gh auth login

# List current secrets
gh secret list

# Add a new secret (interactive)
gh secret set SECRET_NAME

# Add a secret with value
gh secret set SECRET_NAME --body "SECRET_VALUE"

# Delete a secret
gh secret delete SECRET_NAME
```

## Setting Up Secrets via GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter secret name and value
5. Click **Add secret**

## Environment Files Setup

### Create .env.example

```bash
# .env.example
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

### Create .github/workflows/deploy-ecs.yml

The workflow file is already created. Review and customize:

```bash
# View the workflow
cat .github/workflows/deploy-ecs.yml

# Key sections:
# - Build and push to ECR
# - Security scanning with Trivy
# - Run tests
# - Deploy to ECS
# - Wait for service stabilization
```

## Workflow Triggers

The deploy workflow triggers on:

1. **Push to main** → Full deployment (build + test + deploy)
2. **Push to develop** → Test and build only
3. **Pull requests** → Test only
4. **Manual trigger** → Via GitHub UI or CLI

### Manual Workflow Trigger

```bash
# Trigger deployment manually
gh workflow run deploy-ecs.yml -r main

# View workflow runs
gh run list --workflow=deploy-ecs.yml

# View specific run details
gh run view RUN_ID --log

# Cancel a running workflow
gh run cancel RUN_ID

# Download artifacts
gh run download RUN_ID --dir ./artifacts
```

## Monitoring Workflow Execution

### View Logs

```bash
# Watch in real-time
gh run watch RUN_ID --exit-status

# View logs after completion
gh run view RUN_ID --log

# Export logs
gh run download RUN_ID
```

### Common Workflow Issues

#### 1. Authentication Failed

**Error:** `Unable to assume role`

**Solution:**
```bash
# Verify role ARN
aws iam get-role --role-name GitHubActionsRole

# Check role trust relationship
aws iam get-role --role-name GitHubActionsRole --query 'Role.AssumeRolePolicyDocument'

# Verify GitHub OIDC provider exists
aws iam list-open-id-connect-providers
```

#### 2. ECR Push Failed

**Error:** `Failed to push image to registry`

**Solution:**
```bash
# Check ECR repository exists
aws ecr describe-repositories --repository-names nebula-nextjs-app --region ap-south-1

# Verify role has ECR permissions
aws iam get-role-policy --role-name GitHubActionsRole --policy-name ECSManagementPolicy
```

#### 3. ECS Service Update Failed

**Error:** `Failed to update service`

**Solution:**
```bash
# Check service exists
aws ecs describe-services \
  --cluster nebula-cluster \
  --services nebula-app-service \
  --region ap-south-1

# Check task definition
aws ecs describe-task-definition \
  --task-definition nebula-app-task-definition \
  --region ap-south-1
```

## Customizing the Workflow

### Change Deployment Regions

Edit `.github/workflows/deploy-ecs.yml`:

```yaml
env:
  AWS_REGION: ap-south-1  # Change this
```

### Change Cluster/Service Names

Edit `.github/workflows/deploy-ecs.yml`:

```yaml
env:
  ECR_REPOSITORY: nebula-nextjs-app      # Change this
  ECS_SERVICE: nebula-app-service         # Change this
  ECS_CLUSTER: nebula-cluster             # Change this
  ECS_TASK_DEFINITION: nebula-app-task-definition  # Change this
```

### Add Slack Notifications

Add to `.github/workflows/deploy-ecs.yml`:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment to ECS: ${{ job.status }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Build: ${{ job.status }}\nRepository: ${{ github.repository }}\nRef: ${{ github.ref }}"
            }
          }
        ]
      }
```

Then add secret:
```bash
gh secret set SLACK_WEBHOOK --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### Add Email Notifications

```bash
# Use GitHub's default email notifications
# Or integrate with SendGrid:
gh secret set SENDGRID_API_KEY --body "SG.your-api-key"
```

## Troubleshooting Workflows

### Check Workflow File Syntax

```bash
# Validate YAML syntax
pip install yamllint
yamllint .github/workflows/deploy-ecs.yml
```

### Debug Secrets

```bash
# List available secrets (without values)
gh secret list

# Verify secret is accessible in workflow
# Add debug step:
#   - name: Debug
#     run: echo "Secret exists: ${{ secrets.SECRET_NAME != '' }}"
```

### View Full Log Output

```bash
# Enable debug logging in workflow
gh run view RUN_ID --log | grep -A5 "Setup Node"

# Or enable debugging:
gh secret set ACTIONS_STEP_DEBUG --body "true"
```

## Best Practices

1. **Use OIDC for authentication** - More secure than access keys
2. **Rotate secrets regularly** - Every 90 days
3. **Use branch protection** - Require approvals before production
4. **Enable artifact retention** - Keep logs for 30 days
5. **Monitor workflow costs** - GitHub Actions minutes usage
6. **Version your actions** - Don't use `@master`, use `@v3`
7. **Test locally first** - Use `act` to test workflows locally

## Testing Workflow Locally

### Using Act

```bash
# Install act
brew install act

# List available workflows
act --list

# Run specific workflow
act push -j build-and-push

# Run with specific event
act -e push

# Run with secrets
act -s AWS_ACCOUNT_ID=123456789012 \
    -s AWS_ROLE_TO_ASSUME=arn:aws:iam::123456789012:role/GitHubActionsRole
```

## Cleanup and Maintenance

### Delete Old Artifacts

```bash
# Via GitHub CLI (not directly supported, use UI)
# Or via API:
curl -X DELETE \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_ORG/YOUR_REPO/actions/artifacts/ARTIFACT_ID
```

### Clean Up Old Workflow Runs

```bash
# Keep via UI: Settings → Actions → General → Retention policies
# Or via API for automated cleanup

gh run list --limit 100 --json databaseId,conclusion | \
  jq '.[] | select(.conclusion=="failure") | .databaseId' | \
  while read id; do gh api repos/YOUR_ORG/YOUR_REPO/actions/runs/$id -X DELETE; done
```

## Monitoring and Alerting

### Enable Run Notifications

```bash
# GitHub default notifications for workflow status
# Or integrate with third-party services:

# PagerDuty
gh secret set PAGERDUTY_API_KEY --body "YOUR_KEY"

# DataDog
gh secret set DATADOG_API_KEY --body "YOUR_KEY"
```

### Setup Action Metrics

```bash
# View actions usage
# Settings → Billing and plans → Actions

# Export metrics for analysis
gh run list --repo YOUR_ORG/YOUR_REPO --limit 100 --json duration,conclusion,createdAt
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS OIDC Provider Setup](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [act - Run GitHub Actions locally](https://github.com/nektos/act)
- [GitHub CLI Secrets Documentation](https://cli.github.com/manual/gh_secret)

