# Copilot Deployment Configuration

This directory contains the AWS Copilot configuration for deploying TheAnswerAI services across multiple environments using a **standalone deployment strategy** with separate Copilot applications within the same AWS account for easier domain and context management.

## 🏗️ Architecture Overview

TheAnswerAI uses AWS Copilot to deploy two main services:

-   **`flowise`** - Backend API service (Node.js/Express)
-   **`web`** - Frontend web application (Next.js)

### Deployment Strategy: Standalone (Separate Applications)

-   **Environments**: `staging`, `prod`
-   **Account Structure**: Same AWS account, separate Copilot applications
-   **Domain Pattern**: `{service}.{client-domain}` (clean domains)
-   **Use Case**: Multi-tenant deployments, easier domain management, and simplified context switching

## 🔄 Domain & Context Switching

TheAnswerAI uses a sophisticated domain switching mechanism that automatically configures the correct Copilot application context within the same AWS account based on your `CLIENT_DOMAIN` environment variable.

### Automatic Context Switching

The `precopilot` script runs automatically as a prehook whenever you execute `pnpm copilot` commands. This ensures the correct Copilot application context is always configured before any deployment operations.

### Pnpm Scripts for Easy Deployment

```bash
# Set your target domain
export CLIENT_DOMAIN=client.theanswer.ai

# Deploy with automatic context switching
pnpm copilot deploy

# Or use the full command
pnpm run copilot deploy
```

### How Domain Switching Works

1. **`precopilot` prehook**: Automatically runs `copilot/scripts/copilot-switch-app.sh` to configure the correct Copilot application context
2. **`copilot` script**: Executes the actual copilot commands with the configured context
3. **Automatic naming**: The script automatically generates the correct application name based on your domain

### Domain Examples

| CLIENT_DOMAIN                 | Generated App Name   | Use Case                   |
| ----------------------------- | -------------------- | -------------------------- |
| `client.theanswer.ai`         | `client-aai`         | Production deployment      |
| `staging.client.theanswer.ai` | `staging-client-aai` | Staging deployment         |
| `abc.theanswer.ai`            | `abc-aai`            | Client-specific deployment |
| `staging.abc.theanswer.ai`    | `staging-abc-aai`    | Client staging deployment  |

## 📁 Directory Structure

```
copilot/
├── README.md                           # This file
├── .workspace                          # Copilot workspace configuration (auto-generated)
├── scripts/                           # Copilot scripts
│   ├── copilot-switch-app.sh               # Domain switching script
│   └── copilot-auto-deploy.sh              # Auto deployment script
├── environments/                      # Environment configurations
│   ├── staging/                            # Staging environment
│   ├── prod/                               # Production environment
│   └── addons/                        # Shared infrastructure addons
│       ├── redis-elasticache.yml           # Redis caching layer
│       ├── flowise-cluster.yml             # Aurora PostgreSQL database
│       ├── theanswerai-server-storage.yml  # S3 storage bucket
│       └── addons.parameters.yml           # Addon parameters
├── flowise/                           # Backend service configuration
│   ├── manifest.yml                        # Service manifest
│   └── addons/                             # Service-specific addons
│       └── theanswerai-server-storage-access-policy.yml
└── web/                               # Frontend service configuration
    ├── manifest.yml                        # Service manifest
    └── addons/                             # Service-specific addons
        └── frontend-access-policy.yml      # Frontend
```

## 🌐 Domain Configuration

### Environment Variables

All environments use a single `CLIENT_DOMAIN` variable for domain configuration:

```bash
# For staging deployments
export CLIENT_DOMAIN=staging.client.theanswer.ai

# For production deployments
export CLIENT_DOMAIN=client.theanswer.ai
```

### Resulting Domains

| Service          | Staging                               | Production                    |
| ---------------- | ------------------------------------- | ----------------------------- |
| **Flowise API**  | `flowise.staging.client.theanswer.ai` | `flowise.client.theanswer.ai` |
| **API Endpoint** | `api.staging.client.theanswer.ai`     | `api.client.theanswer.ai`     |
| **Web Frontend** | `web.staging.client.theanswer.ai`     | `web.client.theanswer.ai`     |
| **Main Domain**  | `staging.client.theanswer.ai`         | `client.theanswer.ai`         |

## 🚀 Deployment Commands

### Prerequisites

1. Install AWS Copilot CLI: `brew install copilot`
2. Configure AWS credentials: `aws configure`
3. Ensure you have appropriate AWS permissions
4. Set your target `CLIENT_DOMAIN`

### Step-by-Step Deployment Guide

#### Initial Setup (First Time Only)

**1. Set Environment Variables:**

```bash
# For staging deployment
export CLIENT_DOMAIN=staging.client.theanswer.ai

# For production deployment
export CLIENT_DOMAIN=client.theanswer.ai
```

**2. Initialize Copilot Application:**

```bash
# This will automatically configure the correct app name
pnpm copilot app init --domain $CLIENT_DOMAIN
```

**3. Initialize Environment:**

```bash
# For staging environment
pnpm copilot env init --name staging

# For production environment
pnpm copilot env init --name prod
```

**4. Deploy Environment Infrastructure:**

```bash
# For staging environment
pnpm copilot env deploy --name staging

# For production environment
pnpm copilot env deploy --name prod
```

**5. Deploy Services:**

```bash
# Deploy to staging
pnpm copilot deploy --name flowise --env staging

# Deploy web service (requires AUTH0_BASE_URL for build)
export AUTH0_BASE_URL=https://staging.client.theanswer.ai
pnpm copilot deploy --name web --env staging

# Deploy to production
pnpm copilot deploy --name flowise --env prod

# Deploy web service (requires AUTH0_BASE_URL for build)
export AUTH0_BASE_URL=https://client.theanswer.ai
pnpm copilot deploy --name web --env prod
```

#### DNS Setup

**1. Create Hosted Zone:**

```bash
aws route53 create-hosted-zone \
  --name staging.client.theanswer.ai \
  --caller-reference $(date +%s)
```

**2. Get NS Records:**

```bash
aws route53 get-hosted-zone --id <hosted-zone-id>
```

**3. Update Parent Zone with NS Delegation:**

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <parent-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "staging.client.theanswer.ai",
        "Type": "NS",
        "TTL": 300,
        "ResourceRecords": [
          {"Value": "ns-xxxx.awsdns-xx.com"},
          {"Value": "ns-xxxx.awsdns-xx.net"},
          {"Value": "ns-xxxx.awsdns-xx.org"},
          {"Value": "ns-xxxx.awsdns-xx.co.uk"}
        ]
      }
    }]
  }'
```

### 🚀 Streamlined Deployment (After Initial Setup)

Once your environments and services are deployed successfully, you can use the interactive deployment process:

#### Quick Deployment Process

```bash
# 1. Set the correct CLIENT_DOMAIN for your target environment
export CLIENT_DOMAIN=staging.client.theanswer.ai  # For staging
# OR
export CLIENT_DOMAIN=client.theanswer.ai          # For production

# 2. Run interactive deployment (precopilot runs automatically)
pnpm copilot deploy
```

#### Interactive Deployment Steps

1. **Select Services**: Use spacebar to select both `flowise` and `web` services, then press Enter
2. **First Deployment Group**: Select `flowise` for the 1st deployment group, press Enter
3. **Second Deployment Group**: Select `web` for the 2nd deployment group, press Enter
4. **Select Environment**: Choose your target environment (e.g., `staging`, `prod`), press Enter
5. **Confirm Deployment**: Review the deployment plan and confirm

**Note**: This approach creates separate deployment groups for each service, allowing them to deploy simultaneously while maintaining proper separation and control over the deployment process.

#### Environment Variable Requirements

Before deploying, ensure you have the correct environment variables set:

**For Staging Deployments:**

```bash
export CLIENT_DOMAIN=staging.client.theanswer.ai
export AUTH0_BASE_URL=https://staging.client.theanswer.ai
```

**For Production Deployments:**

```bash
export CLIENT_DOMAIN=client.theanswer.ai
export AUTH0_BASE_URL=https://client.theanswer.ai
```

#### Alternative: Use Environment Files

You can also load environment variables from files:

```bash
# Load staging environment variables
source copilot.staging.env
source copilot.staging.web.env

# OR load production environment variables
source copilot.prod.env
source copilot.prod.web.env
```

#### Deployment Tips

-   **Always verify CLIENT_DOMAIN** matches your target environment
-   **Context switching is automatic** - precopilot runs as a prehook when using pnpm copilot
-   **Check AUTH0_BASE_URL** is set correctly for web service builds
-   **Use interactive deployment** for faster service updates
-   **Deploy to staging first** before production
-   **Monitor deployment logs** for any issues

### ⚠️ Critical: Web Service Build Requirements

**The web service build process requires the `AUTH0_BASE_URL` environment variable to be set during deployment.** This is required for Next.js to properly build the authentication routes.

#### Required Environment Variables for Web Service:

```bash
# For staging deployments
export AUTH0_BASE_URL=https://staging.client.theanswer.ai

# For production deployments
export AUTH0_BASE_URL=https://client.theanswer.ai
```

#### Alternative: Use Environment File

You can also set this in your environment files:

```bash
# In copilot.staging.web.env
AUTH0_BASE_URL=https://staging.client.theanswer.ai

# In copilot.prod.web.env
AUTH0_BASE_URL=https://client.theanswer.ai
```

**Failure to set this variable will cause the web service build to fail with:**

```
Error: No valid baseURL found. Set either VERCEL_PREVIEW_URL, VERCEL_URL, or AUTH0_BASE_URL environment variable.
```

### Service Management

```bash
# View service status
pnpm copilot svc status --name flowise --env staging

# View service logs
pnpm copilot svc logs --name flowise --env staging

# Scale service
pnpm copilot svc scale --name flowise --env staging --count 2

# Delete service
pnpm copilot svc delete --name flowise --env staging
```

## 💾 Infrastructure Components

### Database (Aurora Serverless v2)

-   **Engine**: PostgreSQL 16.9
-   **Scaling**: Automatic between min/max capacity
-   **Staging**: 0.5-8 ACU (cost-effective)
-   **Production**: 1-16 ACU (performance-focused)

### Caching (Redis ElastiCache)

-   **Engine**: Redis 7.0
-   **Staging**: `cache.t3.micro` (1 node)
-   **Production**: `cache.r6g.large` (1 node)

### Storage (S3)

-   **Bucket**: Environment-specific storage
-   **Encryption**: AES256 server-side encryption
-   **Access**: Private with HTTPS enforcement
-   **Lifecycle**: 30-day non-current version expiration

### Security

-   **VPC**: Isolated network per environment
-   **Security Groups**: Service-specific access controls
-   **IAM**: Least-privilege access policies
-   **Secrets**: AWS Secrets Manager for credentials

## 🔧 Configuration Files

### Environment Files

-   `copilot.staging.env` - Staging environment variables
-   `copilot.prod.env` - Production environment variables
-   `copilot.staging.web.env` - Web service staging variables
-   `copilot.prod.web.env` - Web service production variables

### Service Manifests

-   `flowise/manifest.yml` - Backend service configuration
-   `web/manifest.yml` - Frontend service configuration

### Addon Configurations

-   `environments/addons/redis-elasticache.yml` - Redis caching configuration
-   `environments/addons/flowise-cluster.yml` - Database configuration
-   `environments/addons/theanswerai-server-storage.yml` - S3 storage configuration

## 📊 Resource Allocation

### Flowise Service (Backend)

| Environment | CPU  | Memory  | Count | Purpose               |
| ----------- | ---- | ------- | ----- | --------------------- |
| **staging** | 2048 | 4096 MB | 1     | Development & Testing |
| **prod**    | 4096 | 8192 MB | 1     | Production Workloads  |

### Web Service (Frontend)

| Environment | CPU  | Memory  | Count | Purpose               |
| ----------- | ---- | ------- | ----- | --------------------- |
| **staging** | 1024 | 2048 MB | 1     | Development & Testing |
| **prod**    | 2048 | 4096 MB | 1     | Production Workloads  |

## 🔍 Monitoring & Observability

### CloudWatch Integration

-   **Container Insights**: Disabled by default (can be enabled per environment)
-   **Log Groups**: Automatic creation for each service
-   **Metrics**: ECS service metrics, custom application metrics

### Health Checks

-   **Flowise**: `/api/v1/ping` endpoint
-   **Web**: `/healthcheck` endpoint
-   **Load Balancer**: Automatic health monitoring

## 🛠️ Development Workflow

### Local Development

1. Use environment files for local configuration
2. Test with staging environment first
3. Validate changes in staging before production

### Deployment Pipeline

1. **Staging**: Deploy and test changes
2. **Production**: Deploy validated changes
3. **Monitoring**: Monitor health and performance
4. **Rollback**: Use Copilot's rollback capabilities if needed

### Environment Promotion

```bash
# Promote from staging to production
pnpm copilot svc deploy --name flowise --env prod --source staging
pnpm copilot svc deploy --name web --env prod --source staging
```

## 🔒 Security Considerations

### Network Security

-   All services run in private subnets
-   Public access only through Application Load Balancer
-   Security groups restrict traffic between services

### Data Security

-   Database credentials stored in AWS Secrets Manager
-   S3 buckets enforce encryption and HTTPS
-   Redis cluster runs in private subnets

### Access Control

-   IAM roles with least-privilege access
-   Service-specific security policies
-   Environment isolation through separate Copilot applications

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check service logs
pnpm copilot svc logs --name flowise --env staging

# Check service status
pnpm copilot svc status --name flowise --env staging

# Check environment variables
pnpm copilot svc show --name flowise --env staging
```

#### Database Connection Issues

```bash
# Verify database secret
aws secretsmanager get-secret-value --secret-id <secret-name>

# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>
```

#### Domain Issues

```bash
# Verify DNS configuration
nslookup flowise.staging.client.theanswer.ai

# Check certificate status
aws acm list-certificates
```

#### Context Switching Issues

```bash
# Check current application context
cat copilot/.workspace

# Manually set application context (if needed)
export CLIENT_DOMAIN=your-domain.theanswer.ai
bash copilot/scripts/copilot-switch-app.sh
```

### Useful Commands

```bash
# List all environments
pnpm copilot env ls

# List all services
pnpm copilot svc ls

# Show environment details
pnpm copilot env show --name staging

# Show service details
pnpm copilot svc show --name flowise --env staging
```

## 🔍 Getting Database and Redis Information

### Quick One-Liner (Copy-Paste)

```bash
echo "🔍 Select Environment:" && echo "1) staging" && echo "2) prod" && echo "" && echo -n "Enter choice (1-2): " && read choice && case $choice in 1) ENV=staging ;; 2) ENV=prod ;; *) echo "Invalid choice" && exit 1 ;; esac && STACK=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'aai-$ENV-AddonsStack')].StackName" --output text) && echo "🔍 Environment: $ENV" && echo "📋 Stack: $STACK" && echo "" && echo "🗄️  Database:" && DB_SECRET=$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`flowiseclusterSecret`].OutputValue' --output text) && DB_CREDS=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET" --query 'SecretString' --output text) && echo "   Host: $(echo "$DB_CREDS" | jq -r '.host')" && echo "   Port: $(echo "$DB_CREDS" | jq -r '.port')" && echo "   Database: $(echo "$DB_CREDS" | jq -r '.dbname')" && echo "   Username: $(echo "$DB_CREDS" | jq -r '.username')" && echo "   Password: $(echo "$DB_CREDS" | jq -r '.password')" && echo "" && echo "🔴 Redis:" && echo "   Endpoint: $(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text)" && echo "   Port: $(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisPort`].OutputValue' --output text)" && echo "   URL: $(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisURL`].OutputValue' --output text)"
```

## 📚 Additional Resources

-   [AWS Copilot Documentation](https://aws.github.io/copilot-cli/)
-   [ECS Service Documentation](https://docs.aws.amazon.com/ecs/)
-   [Aurora Serverless Documentation](https://docs.aws.amazon.com/aurora/)
-   [ElastiCache Documentation](https://docs.aws.amazon.com/elasticache/)

## 🤝 Contributing

When making changes to the Copilot configuration:

1. **Test in staging first** - Always deploy to staging before production
2. **Update documentation** - Keep this README current with changes
3. **Follow naming conventions** - Use consistent naming across environments
4. **Review resource allocation** - Ensure appropriate sizing for each environment
5. **Validate security** - Ensure security groups and policies are correct
6. **Test domain switching** - Verify the automatic prehook works correctly

## 📝 Changelog

### Version 2.0.0

-   Simplified to standalone deployment strategy only
-   Removed "-standalone" suffix from environment names
-   Added comprehensive domain switching documentation
-   Integrated pnpm script workflow
-   Streamlined deployment process
-   Clarified that separate applications run in the same AWS account

### Version 1.0.0

-   Initial Copilot configuration
-   Support for default and standalone deployment strategies
-   Environment-specific resource allocation
-   Comprehensive addon configuration
-   Security and monitoring setup
