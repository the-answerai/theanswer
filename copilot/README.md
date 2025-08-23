# Copilot Deployment Configuration

This directory contains the AWS Copilot configuration for deploying TheAnswerAI services across multiple environments and deployment strategies.

## 🏗️ Architecture Overview

TheAnswerAI uses AWS Copilot to deploy two main services:

-   **`flowise`** - Backend API service (Node.js/Express)
-   **`web`** - Frontend web application (Next.js)

### Deployment Strategies

We support two deployment strategies to accommodate different organizational needs:

#### 1. **Default Strategy (Same Account)**

-   **Environments**: `staging`, `prod`
-   **Account Structure**: Both environments share the same AWS account
-   **Domain Pattern**: `{service}.{environment}.{client-domain}`
-   **Use Case**: Cost-effective deployment for single-tenant or development scenarios

#### 2. **Standalone Strategy (Separate Accounts)**

-   **Environments**: `staging-standalone`, `prod-standalone`
-   **Account Structure**: Each environment gets its own AWS account
-   **Domain Pattern**: `{service}.{client-domain}` (clean domains)
-   **Use Case**: Multi-tenant, compliance, or production isolation scenarios

## 📁 Directory Structure

```
copilot/
├── README.md                           # This file
├── .workspace                          # Copilot workspace configuration
├── environments/                       # Environment configurations
│   ├── staging/                        # Default staging environment
│   ├── prod/                          # Default production environment
│   ├── staging-standalone/             # Standalone staging environment
│   ├── prod-standalone/                # Standalone production environment
│   └── addons/                        # Shared infrastructure addons
│       ├── redis-elasticache.yml      # Redis caching layer
│       ├── flowise-cluster.yml        # Aurora PostgreSQL database
│       ├── theanswerai-server-storage.yml # S3 storage bucket
│       └── addons.parameters.yml      # Addon parameters
├── flowise/                           # Backend service configuration
│   ├── manifest.yml                   # Service manifest
│   └── addons/                        # Service-specific addons
│       └── theanswerai-server-storage-access-policy.yml
└── web/                               # Frontend service configuration
    ├── manifest.yml                   # Service manifest
    └── addons/                        # Service-specific addons
        └── frontend-access-policy.yml
```

## 🌐 Domain Configuration

### Environment Variables

All environments use a single `CLIENT_DOMAIN` variable for domain configuration:

#### Default Strategy

```bash
# copilot.staging.env & copilot.prod.env
CLIENT_DOMAIN=client.theanswer.ai
```

#### Standalone Strategy

```bash
# copilot.staging-standalone.env
CLIENT_DOMAIN=staging.client.theanswer.ai

# copilot.prod-standalone.env
CLIENT_DOMAIN=client.theanswer.ai
```

### Resulting Domains

#### Default Strategy (Same Account)

| Service          | Staging                               | Production                         |
| ---------------- | ------------------------------------- | ---------------------------------- |
| **Flowise API**  | `flowise.staging.client.theanswer.ai` | `flowise.prod.client.theanswer.ai` |
| **API Endpoint** | `api.staging.client.theanswer.ai`     | `api.prod.client.theanswer.ai`     |
| **Web Frontend** | `web.staging.client.theanswer.ai`     | `web.prod.client.theanswer.ai`     |
| **Main Domain**  | `staging.client.theanswer.ai`         | `prod.client.theanswer.ai`         |

#### Standalone Strategy (Separate Accounts)

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

### Step-by-Step Deployment Guide

#### Initial Setup (First Time Only)

**1. Initialize Copilot Application:**

```bash
# Set your client domain
export CLIENT_DOMAIN=client.theanswer.ai

# Initialize the application
copilot app init aai --domain client.theanswer.ai
```

#### Default Strategy (Same Account)

**1. Set Environment Variables:**

```bash
export CLIENT_DOMAIN=client.theanswer.ai
```

**2. Initialize Environment:**

```bash
copilot env init --name staging
copilot env init --name prod
```

**3. Deploy Environment Infrastructure:**

```bash
copilot env deploy --name staging
copilot env deploy --name prod
```

**4. Deploy Services:**

```bash
# Deploy to staging
copilot deploy --name flowise --env staging

# Deploy web service (requires AUTH0_BASE_URL for build)
export AUTH0_BASE_URL=https://staging.client.theanswer.ai
copilot deploy --name web --env staging

# Deploy to production
copilot deploy --name flowise --env prod

# Deploy web service (requires AUTH0_BASE_URL for build)
export AUTH0_BASE_URL=https://client.theanswer.ai
copilot deploy --name web --env prod
```

#### Standalone Strategy (Separate Accounts)

**1. Set Environment Variables:**

```bash
# For staging account
export CLIENT_DOMAIN=staging.client.theanswer.ai

# For production account
export CLIENT_DOMAIN=client.theanswer.ai
```

**2. Initialize Environment:**

```bash
# In staging account
copilot env init --name staging-standalone

# In production account
copilot env init --name prod-standalone
```

**3. Deploy Environment Infrastructure:**

```bash
# In staging account
copilot env deploy --name staging-standalone

# In production account
copilot env deploy --name prod-standalone
```

**4. Deploy Services:**

```bash
# In staging account
copilot deploy --name flowise --env staging-standalone

# Deploy web service (requires AUTH0_BASE_URL for build)
export AUTH0_BASE_URL=https://staging.client.theanswer.ai
copilot deploy --name web --env staging-standalone

# In production account
copilot deploy --name flowise --env prod-standalone

# Deploy web service (requires AUTH0_BASE_URL for build)
export AUTH0_BASE_URL=https://client.theanswer.ai
copilot deploy --name web --env prod-standalone
```

#### DNS Setup for Standalone Strategy

**1. Create Hosted Zone in Staging Account:**

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

````bash
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

### 🚀 Streamlined Deployment (After Initial Setup)

Once your environments and services are deployed successfully, you can use the interactive `copilot deploy` command for faster deployments:

#### Quick Deployment Process
```bash
# 1. Set the correct CLIENT_DOMAIN for your target environment
export CLIENT_DOMAIN=staging.client.theanswer.ai  # For staging-standalone
# OR
export CLIENT_DOMAIN=client.theanswer.ai          # For prod-standalone

# 2. Run interactive deployment
copilot deploy
````

#### Interactive Deployment Steps

1. **Select Services**: Use spacebar to select both `flowise` and `web` services, then press Enter
2. **First Deployment Group**: Select `flowise` for the 1st deployment group, press Enter
3. **Second Deployment Group**: Select `web` for the 2nd deployment group, press Enter
4. **Select Environment**: Choose your target environment (e.g., `staging-standalone`, `prod`, etc.), press Enter
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
source copilot.staging-standalone.env
source copilot.staging-standalone.web.env

# OR load production environment variables
source copilot.prod-standalone.env
source copilot.prod-standalone.web.env
```

#### Deployment Tips

-   **Always verify CLIENT_DOMAIN** matches your target environment
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
# In copilot.staging.web.env or copilot.staging-standalone.web.env
AUTH0_BASE_URL=https://staging.client.theanswer.ai

# In copilot.prod.web.env or copilot.prod-standalone.web.env
AUTH0_BASE_URL=https://client.theanswer.ai
```

**Failure to set this variable will cause the web service build to fail with:**

```
Error: No valid baseURL found. Set either VERCEL_PREVIEW_URL, VERCEL_URL, or AUTH0_BASE_URL environment variable.
```

### Service Management

```bash
# View service status
copilot svc status --name flowise --env staging

# View service logs
copilot svc logs --name flowise --env staging

# Scale service
copilot svc scale --name flowise --env staging --count 2

# Delete service
copilot svc delete --name flowise --env staging
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

-   `copilot.staging.env` - Default staging environment variables
-   `copilot.prod.env` - Default production environment variables
-   `copilot.staging-standalone.env` - Standalone staging environment variables
-   `copilot.prod-standalone.env` - Standalone production environment variables
-   `copilot.staging.web.env` - Web service staging variables
-   `copilot.prod.web.env` - Web service production variables
-   `copilot.staging-standalone.web.env` - Web service standalone staging variables
-   `copilot.prod-standalone.web.env` - Web service standalone production variables

### Service Manifests

-   `flowise/manifest.yml` - Backend service configuration
-   `web/manifest.yml` - Frontend service configuration

### Addon Configurations

-   `environments/addons/redis-elasticache.yml` - Redis caching configuration
-   `environments/addons/flowise-cluster.yml` - Database configuration
-   `environments/addons/theanswerai-server-storage.yml` - S3 storage configuration

## 📊 Resource Allocation

### Flowise Service (Backend)

| Environment            | CPU  | Memory  | Count | Purpose               |
| ---------------------- | ---- | ------- | ----- | --------------------- |
| **staging**            | 2048 | 4096 MB | 1     | Development & Testing |
| **prod**               | 4096 | 8192 MB | 1     | Production Workloads  |
| **staging-standalone** | 2048 | 4096 MB | 1     | Isolated Development  |
| **prod-standalone**    | 4096 | 8192 MB | 1     | Isolated Production   |

### Web Service (Frontend)

| Environment            | CPU  | Memory  | Count | Purpose               |
| ---------------------- | ---- | ------- | ----- | --------------------- |
| **staging**            | 1024 | 2048 MB | 1     | Development & Testing |
| **prod**               | 2048 | 4096 MB | 1     | Production Workloads  |
| **staging-standalone** | 1024 | 2048 MB | 1     | Isolated Development  |
| **prod-standalone**    | 2048 | 4096 MB | 1     | Isolated Production   |

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
copilot svc deploy --name flowise --env prod --source staging
copilot svc deploy --name web --env prod --source staging
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
-   Environment isolation through separate accounts (standalone strategy)

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start

```bash
# Check service logs
copilot svc logs --name flowise --env staging

# Check service status
copilot svc status --name flowise --env staging

# Check environment variables
copilot svc show --name flowise --env staging
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

### Useful Commands

```bash
# List all environments
copilot env ls

# List all services
copilot svc ls

# Show environment details
copilot env show --name staging

# Show service details
copilot svc show --name flowise --env staging
```

## 🔍 Getting Database and Redis Information

### Quick One-Liner (Copy-Paste)

```bash
echo "🔍 Select Environment:" && echo "1) staging" && echo "2) prod" && echo "3) staging-standalone" && echo "4) prod-standalone" && echo "" && echo -n "Enter choice (1-4): " && read choice && case $choice in 1) ENV=staging ;; 2) ENV=prod ;; 3) ENV=staging-standalone ;; 4) ENV=prod-standalone ;; *) echo "Invalid choice" && exit 1 ;; esac && STACK=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'aai-$ENV-AddonsStack')].StackName" --output text) && echo "🔍 Environment: $ENV" && echo "📋 Stack: $STACK" && echo "" && echo "🗄️  Database:" && DB_SECRET=$(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`flowiseclusterSecret`].OutputValue' --output text) && DB_CREDS=$(aws secretsmanager get-secret-value --secret-id "$DB_SECRET" --query 'SecretString' --output text) && echo "   Host: $(echo "$DB_CREDS" | jq -r '.host')" && echo "   Port: $(echo "$DB_CREDS" | jq -r '.port')" && echo "   Database: $(echo "$DB_CREDS" | jq -r '.dbname')" && echo "   Username: $(echo "$DB_CREDS" | jq -r '.username')" && echo "   Password: $(echo "$DB_CREDS" | jq -r '.password')" && echo "" && echo "🔴 Redis:" && echo "   Endpoint: $(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' --output text)" && echo "   Port: $(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisPort`].OutputValue' --output text)" && echo "   URL: $(aws cloudformation describe-stacks --stack-name "$STACK" --query 'Stacks[0].Outputs[?OutputKey==`RedisURL`].OutputValue' --output text)"
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

## 📝 Changelog

### Version 1.0.0

-   Initial Copilot configuration
-   Support for default and standalone deployment strategies
-   Environment-specific resource allocation
-   Comprehensive addon configuration
-   Security and monitoring setup
