# Credential Seeding Script

This script automatically seeds default credentials from environment variables into the Flowise database. It detects all `AAI_DEFAULT_*` environment variables and creates encrypted credentials for various AI and third-party services.

## Overview

The credential seeding script provides:

-   **Automatic Detection**: Scans for all `AAI_DEFAULT_*` environment variables
-   **Multiple Credential Types**: Supports both single API key and multi-field credential configurations
-   **Auto-Discovery**: Attempts to detect unmapped credentials by matching them to credential files
-   **Database Integration**: Directly inserts encrypted credentials into the Flowise database
-   **Secure Encryption**: Uses the same encryption method as the Flowise server

## Usage

```bash
# From the project root
node scripts/seed-credentials/seed-credentials.js

# Or with npm/yarn if you have a script configured
npm run seed-credentials
```

## Database Configuration

### Required Environment Variables

| Variable            | Default     | Description                                   |
| ------------------- | ----------- | --------------------------------------------- |
| `DATABASE_TYPE`     | `postgres`  | Database type (currently supports PostgreSQL) |
| `DATABASE_HOST`     | `localhost` | Database host address                         |
| `DATABASE_PORT`     | `5432`      | Database port number                          |
| `DATABASE_USER`     | `postgres`  | Database username                             |
| `DATABASE_PASSWORD` | `postgres`  | Database password                             |
| `DATABASE_NAME`     | `flowise`   | Database name                                 |

### Optional Configuration

| Variable                      | Default                  | Description                                            |
| ----------------------------- | ------------------------ | ------------------------------------------------------ |
| `FLOWISE_SECRETKEY_OVERWRITE` | `theanswerencryptionkey` | Encryption key for credential data                     |
| `USER_ID`                     | `null`                   | UUID of the user to associate credentials with         |
| `ORG_ID`                      | `null`                   | UUID of the organization to associate credentials with |

**Note**: `USER_ID` and `ORG_ID` must be valid UUIDs or they will be set to null.

## Supported Credential Types

### Direct API Key Mappings

These credentials require a single environment variable:

| Environment Variable         | Credential Name     | Description         |
| ---------------------------- | ------------------- | ------------------- |
| `AAI_DEFAULT_OPENAI_API_KEY` | `openai-default`    | OpenAI API key      |
| `AAI_DEFAULT_ANTHROPHIC`     | `anthropic-default` | Anthropic API key   |
| `AAI_DEFAULT_GROQ`           | `groq-default`      | Groq API key        |
| `AAI_DEFAULT_DEEPSEEK`       | `deepseek-default`  | DeepSeek API key    |
| `AAI_DEFAULT_EXASEARCH`      | `exasearch-default` | ExaSearch API key   |
| `AAI_DEFAULT_REPLICATE`      | `replicate-default` | Replicate API key   |
| `AAI_DEFAULT_SERPAPI`        | `serpapi-default`   | SerpAPI key         |
| `AAI_DEFAULT_PINCONE`        | `pinecone-default`  | Pinecone API key    |
| `AAI_DEFAULT_GITHUB_TOKEN`   | `github-default`    | GitHub access token |

### Multi-Field Credential Mappings

These credentials require multiple environment variables:

#### AWS Bedrock

-   **Base**: `AAI_DEFAULT_AWS_BEDROCK`
-   **Required Variables**:
    -   `AAI_DEFAULT_AWS_BEDROCK_ACCESS_KEY` - AWS Access Key
    -   `AAI_DEFAULT_AWS_BEDROCK_SECRET_KEY` - AWS Secret Key
-   **Optional Variables**:
    -   `AAI_DEFAULT_AWS_BEDROCK_SESSION_TOKEN` - AWS Session Token

#### Supabase

-   **Base**: `AAI_DEFAULT_SUPABASE`
-   **Required Variables**:
    -   `AAI_DEFAULT_SUPABASE_URL` - Supabase project URL
    -   `AAI_DEFAULT_SUPABASE_API` - Supabase API key

#### Google Custom Search

-   **Base**: `AAI_DEFAULT_GOOGLE_SEARCH_API`
-   **Required Variables**:
    -   `AAI_DEFAULT_GOOGLE_SEARCH_API` - Google API key
    -   `AAI_DEFAULT_GOOGLE_SEARCH_API_ENGINE_ID` - Custom Search Engine ID

#### Redis Cache

-   **Base**: `AAI_DEFAULT_REDIS`
-   **Optional Variables** (all have defaults):
    -   `AAI_DEFAULT_REDIS_HOST` (default: `localhost`)
    -   `AAI_DEFAULT_REDIS_PORT` (default: `6379`)
    -   `AAI_DEFAULT_REDIS_USERNAME` (default: `default`)
    -   `AAI_DEFAULT_REDIS_PASSWORD` (default: empty)

## Auto-Detection Feature

The script can automatically detect unmapped `AAI_DEFAULT_*` variables by:

1. Scanning the `components/credentials/` directory for credential files
2. Matching environment variable names to credential file names
3. Creating basic API key mappings for detected services

This feature is useful for adding new services without modifying the script configuration.

## Example Environment File

```env
# Database Configuration
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=flowise

# Security
FLOWISE_SECRETKEY_OVERWRITE=your-secret-encryption-key

# Optional User/Org Association
USER_ID=123e4567-e89b-12d3-a456-426614174000
ORG_ID=987fcdeb-51c2-43d1-9f4a-123456789abc

# Direct API Keys
AAI_DEFAULT_OPENAI_API_KEY=sk-your-openai-key
AAI_DEFAULT_ANTHROPHIC=your-anthropic-key
AAI_DEFAULT_GROQ=your-groq-key

# Multi-field Credentials
AAI_DEFAULT_AWS_BEDROCK_ACCESS_KEY=your-aws-access-key
AAI_DEFAULT_AWS_BEDROCK_SECRET_KEY=your-aws-secret-key

AAI_DEFAULT_SUPABASE_URL=https://your-project.supabase.co
AAI_DEFAULT_SUPABASE_API=your-supabase-key

# Optional Redis Configuration
AAI_DEFAULT_REDIS_HOST=redis.example.com
AAI_DEFAULT_REDIS_PORT=6380
AAI_DEFAULT_REDIS_PASSWORD=your-redis-password
```

## Script Behavior

### Execution Flow

1. **Environment Scanning**: Finds all `AAI_DEFAULT_*` variables
2. **Credential Mapping**: Groups related variables and maps them to credential configurations
3. **Auto-Detection**: Attempts to detect unmapped credentials
4. **Database Connection**: Connects to the configured database
5. **Table Verification**: Ensures the credential table exists
6. **Credential Processing**: For each credential:
    - Checks if it already exists (deletes and recreates if found)
    - Encrypts the credential data
    - Inserts into the database
7. **Summary Report**: Displays results of the seeding process

### Output Information

The script provides detailed logging including:

-   Number of environment variables found
-   Database connection status
-   Credential processing results
-   Final summary with created/failed counts
-   UUIDs of created credentials

### Error Handling

-   **Database Connection**: Exits with error code 1 if database connection fails
-   **Invalid UUIDs**: Automatically converts invalid USER_ID/ORG_ID to null
-   **Missing Required Variables**: Skips credentials with missing required fields
-   **Duplicate Credentials**: Deletes existing credentials before recreating them
-   **Auto-Detection Failures**: Logs warnings but continues processing

## Security Considerations

1. **Encryption**: All credential data is encrypted using the same method as the Flowise server
2. **Environment Variables**: Store sensitive data in environment variables, not in code
3. **Database Access**: Ensure database credentials are properly secured
4. **Credential Visibility**: All created credentials default to 'Private' visibility

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

    - Verify database connection parameters
    - Ensure database server is running
    - Check network connectivity

2. **Invalid UUID Errors**

    - Ensure USER_ID and ORG_ID are valid UUIDs or leave them unset

3. **Missing Credentials**

    - Check that environment variables are properly set
    - Verify variable names match expected patterns
    - Review the console output for specific missing variables

4. **Permission Errors**
    - Ensure database user has CREATE/INSERT permissions
    - Verify file system permissions for reading credential files

### Debug Mode

For additional debugging, you can examine the script's console output, which includes:

-   Detailed processing information for each credential
-   Auto-detection attempts and results
-   Database operation status
-   Encryption and insertion details

## Extending the Script

### Adding New Direct Mappings

To add support for a new single API key service:

```javascript
AAI_DEFAULT_YOUR_SERVICE: {
    name: 'your-service-default',
    credentialName: 'yourServiceApi',
    mapFn: (value) => ({ yourServiceApiKey: value })
}
```

### Adding New Multi-Field Mappings

For services requiring multiple configuration values:

```javascript
AAI_DEFAULT_YOUR_SERVICE: {
    name: 'your-service-default',
    credentialName: 'yourServiceApi',
    requiredVars: ['FIELD1', 'FIELD2'],
    optionalVars: ['OPTIONAL_FIELD'],
    mapFn: (vars) => ({
        yourServiceField1: vars['FIELD1'],
        yourServiceField2: vars['FIELD2'],
        yourServiceOptional: vars['OPTIONAL_FIELD']
    })
}
```

## Dependencies

The script requires the following npm packages:

-   `typeorm` - Database ORM
-   `dotenv` - Environment variable loading
-   `crypto-js` - Encryption functionality
-   `node:path`, `node:fs`, `node:crypto` - Node.js built-in modules

Make sure these are installed in your project before running the script.
