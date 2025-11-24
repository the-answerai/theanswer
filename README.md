<!-- markdownlint-disable MD030 -->
<!-- TODO: Add banner for answerAI  -->
<!-- <img width="100%" src="https://github.com/the-answerai/theanswer/blob/main/images/flowise.png?raw=true"></a> -->

<p align="center">
<img src="https://github.com/FlowiseAI/Flowise/blob/main/images/flowise_white.svg#gh-light-mode-only">
<img src="https://github.com/FlowiseAI/Flowise/blob/main/images/flowise_dark.svg#gh-dark-mode-only">
</p>

<div align="center">

[![Release Notes](https://img.shields.io/github/release/FlowiseAI/Flowise)](https://github.com/FlowiseAI/Flowise/releases)
[![Discord](https://img.shields.io/discord/1087698854775881778?label=Discord&logo=discord)](https://discord.gg/jbaHfsRVBW)
[![Twitter Follow](https://img.shields.io/twitter/follow/TheAnswerAI?style=social)](https://twitter.com/TheAnswerAI)
[![GitHub star chart](https://img.shields.io/github/stars/the-answerai/theanswer?style=social)](https://star-history.com/#the-answerai/theanswer)
[![GitHub fork](https://img.shields.io/github/forks/the-answerai/theanswer?style=social)](https://github.com/the-answerai/theanswer/fork)

English | [繁體中文](./i18n/README-TW.md) | [简体中文](./i18n/README-ZH.md) | [日本語](./i18n/README-JA.md) | [한국어](./i18n/README-KR.md)

</div>

<h3>Build AI Agents, Visually</h3>
<a href="https://github.com/FlowiseAI/Flowise">
<img width="100%" src="https://github.com/FlowiseAI/Flowise/blob/main/images/flowise_agentflow.gif?raw=true"></a>

## 📚 Table of Contents

-   [⚡ Quick Start](#-quick-start)
-   [🐳 Docker](#-docker)
-   [👨‍💻 Developers](#-developers)
-   [🌱 Env Variables](#-env-variables)
-   [📖 Documentation](#-documentation)
-   [🌐 Self Host](#-self-host)
-   [☁️ Flowise Cloud](#️-flowise-cloud)
-   [🙋 Support](#-support)
-   [🙌 Contributing](#-contributing)
-   [📄 License](#-license)

## ⚡Quick Start

There are two main ways to get started with TheAnswer: local development setup and deployment on Render.

### Local Development Setup

1. **Clone the repository:**

    ```bash
    # Recommended: Clone with submodules included
    git clone --recursive https://github.com/the-answerai/theanswer.git
    cd theanswer
    ```

3. Open [http://localhost:3000](http://localhost:3000)

## 🐳 Docker

### Docker Compose

1. Clone the Flowise project
2. Go to `docker` folder at the root of the project
3. Copy `.env.example` file, paste it into the same location, and rename to `.env` file
4. `docker compose up -d`
5. Open [http://localhost:3000](http://localhost:3000)
6. You can bring the containers down by `docker compose stop`

### Docker Image

1. Build the image locally:

    ```bash
    docker build --no-cache -t flowise .
    ```

2. Run image:

    ```bash
    docker run -d --name flowise -p 3000:3000 flowise
    ```

3. Stop image:

    ```bash
    docker stop flowise
    ```

## 👨‍💻 Developers

TheAnswer is built on top of Flowise and extends its functionality. The project structure is as follows:

### Packages (from Flowise)

All packages inside `packages/*` are from the original Flowise project:

-   `server`: Node backend to serve API logics
-   `ui`: React frontend for Flowise
-   `components`: Third-party nodes integrations
-   `embed`: Embedding functionality
-   `embed-react`: React components for embedding
-   `flowise-configs`: Configuration files for Flowise
-   `api-documentation`: Auto-generated swagger-ui API docs from express

### Packages-Answers (TheAnswer-specific)

TheAnswer adds additional functionality through the `packages-answers/*` directory:

-   `db`: Database interactions
-   `eslint-config-custom`: Custom ESLint configuration
-   `experimental-prisma-webpack-plugin`: Experimental Prisma plugin for Webpack
-   `tsconfig`: TypeScript configuration
-   `types`: Shared type definitions
-   `ui`: TheAnswer-specific UI components
-   `utils`: Utility functions

This structure allows TheAnswer to build upon Flowise's core functionality while adding its own features and customizations. The TheAnswer-specific packages extend and enhance the capabilities of the original Flowise project, providing additional tools for AI-powered productivity and workflow management.

### Prerequisite

-   Install [PNPM](https://pnpm.io/installation)
    ```bash
    npm i -g pnpm
    ```

### Setup

1.  Clone the repository:

    ```bash
    git clone https://github.com/the-answerai/theanswer.git
    ```

2.  Go into repository folder:

    ```bash
    cd theanswer
    ```

3.  Install all dependencies of all modules:

    ```bash
    pnpm install
    ```

4.  Build all the code:

    ```bash
    pnpm build
    ```

    <details>
    <summary>Exit code 134 (JavaScript heap out of memory)</summary>  
    If you get this error when running the above `build` script, try increasing the Node.js heap size and run the script again:

    ```bash
    # macOS / Linux / Git Bash
    export NODE_OPTIONS="--max-old-space-size=4096"

    # Windows PowerShell
    $env:NODE_OPTIONS="--max-old-space-size=4096"

    # Windows CMD
    set NODE_OPTIONS=--max-old-space-size=4096
    ```

    Then run:

    ```bash
    pnpm build
    ```

    </details>

5.  Start the app:

    ```bash
    pnpm start
    ```

    You can now access the app on [http://localhost:3000](http://localhost:3000)

6.  For development build:

    -   Create `.env` file and specify the `VITE_PORT` (refer to `.env.example`) in `packages/ui`
    -   Create `.env` file and specify the `PORT` (refer to `.env.example`) in `packages/server`
    -   Run:

        ```bash
        pnpm dev
        ```

    Any code changes will reload the app automatically on [http://localhost:3000](http://localhost:3000)

## 🌱 Env Variables

Flowise supports different environment variables to configure your instance. You can specify the following variables in the `.env` file inside `packages/server` folder. Read [more](https://github.com/FlowiseAI/Flowise/blob/main/CONTRIBUTING.md#-env-variables)

## 📖 Documentation

You can view the Flowise Docs [here](https://docs.flowiseai.com/)

## 🌐 Self Host

Deploy AnswerAgent self-hosted in your existing infrastructure. We support various [deployments](https://answeragent.ai/docs/developers/deployment)

-   [AWS](https://answeragent.ai/docs/developers/deployment/aws)
-   [Azure](https://answeragent.ai/docs/developers/deployment/azure)
-   [GCP](https://answeragent.ai/docs/developers/deployment/gcp)
-   [Render](https://answeragent.ai/docs/developers/deployment/render)

## 🔐 AWS Secrets Manager Integration

For AWS deployments, AnswerAgent supports using AWS Secrets Manager to securely store the Flowise encryption key instead of environment variables.

### Quick Setup

1. **Create the encryption key secret:**

    ```bash
    aws secretsmanager create-secret \
      --name FlowiseEncryptionKey \
      --secret-string 'your-secure-encryption-key-here'
    ```

2. **Update an existing secret:**

    ```bash
    aws secretsmanager put-secret-value \
      --secret-id FlowiseEncryptionKey \
      --secret-string 'your-new-encryption-key-here'
    ```

3. **Add to your environment variables:**
    ```bash
    # Flowise Encryption Key Override - AWS Secrets Manager
    SECRETKEY_STORAGE_TYPE="aws"
    SECRETKEY_AWS_REGION="us-east-1"
    SECRETKEY_AWS_NAME="FlowiseEncryptionKey"
    ```

### Benefits

-   **Enhanced Security**: Keys are encrypted at rest and in transit
-   **Key Rotation**: Easy rotation without application restarts
-   **Audit Trail**: Full access logging and monitoring
-   **IAM Integration**: Fine-grained access control

For detailed AWS deployment instructions, see [AWS Deployment Guide](https://answeragent.ai/docs/developers/deployment/aws).

-   <details>
      <summary>Others</summary>

    -   [Railway](https://answeragent.ai/docs/developers/deployment/railway)

        [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/pn4G8S?referralCode=WVNPD9)
        
    -   [Northflank](https://northflank.com/stacks/deploy-flowiseai)

        [![Deploy to Northflank](https://assets.northflank.com/deploy_to_northflank_smm_36700fb050.svg)](https://northflank.com/stacks/deploy-flowiseai)

    -   [Render](https://answeragent.ai/docs/developers/deployment/render)

        [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://answeragent.ai/docs/developers/deployment/render)

    -   [HuggingFace Spaces](https://answeragent.ai/docs/deployment/hugging-face)

        <a href="https://huggingface.co/spaces/TheAnswer/TheAnswer"><img src="https://huggingface.co/datasets/huggingface/badges/raw/main/open-in-hf-spaces-sm.svg" alt="HuggingFace Spaces"></a>

    -   [Elestio](https://elest.io/open-source/theanswer)

        [![Deploy on Elestio](https://elest.io/images/logos/deploy-to-elestio-btn.png)](https://elest.io/open-source/theanswer)

    -   [Sealos](https://template.sealos.io/deploy?templateName=flowise)

        [![Deploy on Sealos](https://sealos.io/Deploy-on-Sealos.svg)](https://template.sealos.io/deploy?templateName=flowise)

    -   [RepoCloud](https://repocloud.io/details/?app_id=29)

        [![Deploy on RepoCloud](https://d16t0pc4846x52.cloudfront.net/deploy.png)](https://repocloud.io/details/?app_id=29)

      </details>

## ☁️ Flowise Cloud

Get Started with [Flowise Cloud](https://flowiseai.com/).

## 🙋 Support

Feel free to ask any questions, raise problems, and request new features in [Discussion](https://github.com/FlowiseAI/Flowise/discussions).

## 🙌 Contributing

We welcome contributions to TheAnswer! Whether you're fixing bugs, improving documentation, or proposing new features, your efforts are appreciated. Here's how you can contribute:

<a href="https://github.com/FlowiseAI/Flowise/graphs/contributors">
<img src="https://contrib.rocks/image?repo=FlowiseAI/Flowise" />
</a><br><br>

See [Contributing Guide](CONTRIBUTING.md). Reach out to us at [Discord](https://discord.gg/jbaHfsRVBW) if you have any questions or issues.

[![Star History Chart](https://api.star-history.com/svg?repos=FlowiseAI/Flowise&type=Timeline)](https://star-history.com/#FlowiseAI/Flowise&Date)

## 📄 License

Source code in this repository is made available under the [Apache License Version 2.0](LICENSE.md).

## 🔑 Seeding Default Credentials

TheAnswer provides a script to automatically seed default credentials (API keys, service tokens, etc) into the Flowise database from environment variables. This is useful for setting up new environments or automating credential management.

-   **Safe by default:** Running `pnpm seed-credentials` will perform a dry-run (test mode) and show what would be seeded, but will NOT write to the database.
-   **To actually write credentials:** Use `pnpm seed-credentials:write` to perform the operation and insert/update credentials in the database.
-   **Full documentation:** See [`scripts/seed-credentials/README.md`](./scripts/seed-credentials/README.md) for detailed instructions, environment variable requirements, and advanced usage.

**Example:**

```bash
# Test mode (safe, dry-run, default)
pnpm seed-credentials

# Production mode (actually writes credentials)
pnpm seed-credentials:write
```

The script supports a wide range of credential types and includes robust safety checks. For more details, troubleshooting, and environment variable examples, refer to the [seed-credentials README](./scripts/seed-credentials/README.md).

## 🔒 Lacework Security Integration

TheAnswer supports optional Lacework FortiCNAPP Agent integration for runtime security monitoring and anomaly detection in AWS Fargate deployments.

### Quick Setup

**Enable Lacework:**

1. Add `LaceworkAccessToken=your_token_here` to your `copilot.{environment}.env` file
2. Deploy with `copilot deploy --env your-environment`

**Disable Lacework:**

1. Remove or comment out `LaceworkAccessToken` from your environment file
2. Deploy with `copilot deploy --env your-environment`

### Key Features

-   **Optional Integration**: Controlled by presence of `LaceworkAccessToken`
-   **Graceful Fallback**: Application runs normally if Lacework token is not provided
-   **Non-Essential Sidecar**: Sidecar failure doesn't affect main application startup
-   **AWS Fargate Optimized**: Designed for Copilot deployments

### Verification

```bash
# Connect to container
copilot svc exec --env your-environment

# Check Lacework status
ps aux | grep datacollector
tail -f /var/log/lacework/datacollector.log

# Check environment variables (WARNING: Do not screenshare - contains sensitive tokens)
env | grep -i lacework
```

**⚠️ Security Note**: Never screenshare or share output from commands that display Lacework tokens.

For detailed configuration, troubleshooting, and advanced setup, see [Lacework Integration Documentation](./packages/docs/docs/integrations/lacework.md).

<!-- BWS-SECURE-DOCS-START -->
## 🔒 BWS Secure Environmental Variable Integration

This project uses [BWS Secure](https://github.com/last-rev-llc/bws-secure) for managing environment variables across different environments.

### 🔐 Creating an Access Token

📍 **1.** Visit the [Bitwarden Machine Accounts](https://vault.bitwarden.com/#/sm) section within your Vault.
   - If you login directly to https://vault.bitwarden.com, you will need to navigate to the Machine Accounts section, within the Secrets Manager. The Secrets Manager is located in the left sidebar, typically at the bottom of the page.
   - If you don't have access, please refer to the [BWS Secure documentation](https://github.com/last-rev-llc/bws-secure) or contact your team administrator

🖱️ **2.** Navigate to the Machine Accounts section, and follow these steps:
   - Select the appropriate Client/Set of Machine Accounts from the list
   - Click on the "Access Tokens" tab
   - Click "+ New Access Token" button
   - Give the token a meaningful name (e.g., "Your Name - Local Development")
   - Click "Save" to generate the token

📋 **3.** Copy the displayed token (you won't be able to see it again after closing)

💾 **4.** Add it to your .env file in your project root:
   ```
   BWS_ACCESS_TOKEN=your_token_here
   ```

⚠️ **5.** Never commit this token to version control

### 🎯 Token Usage Options:

- **BWS_ACCESS_TOKEN**: Loads ALL projects associated with that token (recommended for multi-project setups)
- **BWS_PROJECT_ID**: Loads only a specific project (use for single-project or testing scenarios)

**Example for single project:**
```
BWS_PROJECT_ID=00000000-0000-0000-0000-000000000001
```

The project ID can be found in the Bitwarden Secrets Manager, within the list of projects.

### 🔧 Common Issues & Troubleshooting:

- **"No projects found"**: Verify your token has project access permissions in Bitwarden
- **"Access denied"**: Check that the Machine Account has read permissions for the target projects  
- **Token not working**: Ensure no extra spaces when copying from Bitwarden
- **Multiple projects loading**: This is normal with BWS_ACCESS_TOKEN - use BWS_PROJECT_ID for single project

### Updating BWS Secure

To update BWS Secure to the latest version, you can use the convenient script that was added to your package.json:

```bash
npm run bws-update  # Or use your project's package manager: yarn bws-update, pnpm bws-update
```

Alternatively, you can run the following command manually from your project root:

```bash
rm -rf scripts/bws-secure && git clone git@github.com:last-rev-llc/bws-secure.git scripts/bws-secure && rm -rf scripts/bws-secure/.git && bash scripts/bws-secure/install.sh
```
<!-- BWS-SECURE-DOCS-END -->
