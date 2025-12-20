# Flowise Docker Hub Image

Starts Flowise from [DockerHub Image](https://hub.docker.com/r/flowiseai/flowise)

## ⚠️ CRITICAL: Encryption Key for Production Deployments

**Docker and container deployments MUST set `FLOWISE_SECRETKEY_OVERWRITE` to ensure credential encryption persistence.**

### Why This Matters

Flowise encrypts all stored credentials (API keys, secrets, etc.) using an encryption key. By default, this key is:
1. Read from a file at `SECRETKEY_PATH/encryption.key`
2. If the file doesn't exist, a **new random key is generated**

In ephemeral container environments (Docker, Render, Kubernetes, ECS, etc.), the filesystem resets on each rebuild. Without `FLOWISE_SECRETKEY_OVERWRITE`:
- Each deployment generates a **new encryption key**
- All previously encrypted credentials become **permanently unreadable**
- **Data loss occurs with no recovery option**

### Required Configuration

```bash
# Generate a secure key (run once, save securely)
openssl rand -base64 32

# Add to your .env file or environment
FLOWISE_SECRETKEY_OVERWRITE=your-generated-key-here
```

### Alternative: AWS Secrets Manager

For AWS deployments, you can use AWS Secrets Manager instead:

```bash
SECRETKEY_STORAGE_TYPE=aws
SECRETKEY_AWS_REGION=us-east-1
SECRETKEY_AWS_NAME=FlowiseEncryptionKey
```

---

## Usage

1. Create `.env` file and specify the `PORT` (refer to `.env.example`)
2. `docker compose up -d`
3. Open [http://localhost:3000](http://localhost:3000)
4. You can bring the containers down by `docker compose stop`

## 🌱 Env Variables

If you like to persist your data (flows, logs, credentials, storage), set these variables in the `.env` file inside `docker` folder:

-   DATABASE_PATH=/root/.flowise
-   LOG_PATH=/root/.flowise/logs
-   SECRETKEY_PATH=/root/.flowise
-   BLOB_STORAGE_PATH=/root/.flowise/storage

Flowise also support different environment variables to configure your instance. Read [more](https://docs.flowiseai.com/configuration/environment-variables)

## Queue Mode:

### Building from source:

You can build the images for worker and main from scratch with:

```
docker compose -f docker-compose-queue-source.yml up -d
```

Monitor Health:

```
docker compose -f docker-compose-queue-source.yml ps
```

### From pre-built images:

You can also use the pre-built images:

```
docker compose -f docker-compose-queue-prebuilt.yml up -d
```

Monitor Health:

```
docker compose -f docker-compose-queue-prebuilt.yml ps
```
