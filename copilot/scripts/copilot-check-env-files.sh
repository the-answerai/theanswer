#!/usr/bin/env bash
set -euo pipefail

# Enhanced Copilot Environment File Manager
# Checks for existence of environment files and provides intelligent creation options
# Usage: ./check-env-files.sh [application_name]

# ==================================================
# COLOR DEFINITIONS
# ==================================================
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
BOLD='\033[1m'
RESET='\033[0m'

# ==================================================
# HELPER FUNCTIONS
# ==================================================

# Function to generate secure secrets
generate_secure_secret() {
    local type="$1"
    case "$type" in
        "session")
            # Generate 64-byte base64 secret for SESSION_SECRET
            openssl rand -base64 64 | tr -d '\n'
            ;;
        "auth0")
            # Generate 32-byte hex secret for AUTH0_SECRET
            openssl rand -hex 32
            ;;
        *)
            echo "Unknown secret type: $type" >&2
            return 1
            ;;
    esac
}

# Function to validate required tools
validate_tools() {
    local missing_tools=()
    
    if ! command -v openssl >/dev/null 2>&1; then
        missing_tools+=("openssl")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        echo "❌ Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
}

# Function to prompt user for proceed/wait decision
prompt_proceed_or_wait() {
    local files=("$@")
    
    echo ""
    echo -e "${YELLOW}📝 Do you need to review/modify the environment files before deployment?${RESET}"
    echo ""
    echo "1) Wait - I'll review/edit the files now"
    echo "2) Proceed - Continue with deployment"
    echo ""
    
    local choice=""
    if read -t 15 -r -p "Enter choice (1-2) [auto-proceed in 15s]: " choice; then
        :
    else
        printf '\n⏭️  No input after 15s — proceeding with deployment.\n'
        choice="2"
    fi
    
    # Treat blank as default 2 (proceed)
    if [[ -z "${choice// }" ]]; then
        choice="2"
    fi
    
    case "${choice}" in
        1)
            echo ""
            echo -e "${BLUE}⏸️  Pausing for file review/editing...${RESET}"
            echo ""
            echo "📁 Environment files are located at:"
            for file in "${files[@]}"; do
                echo -e "   ${CYAN}•${RESET} $file"
            done
            echo ""
            echo -e "${YELLOW}💡 Press Enter to continue, or Ctrl+C to cancel deployment${RESET}"
            echo ""
            
            read -r -p "Ready to continue? [Enter to proceed]: "
            echo ""
            echo -e "${GREEN}▶️  Resuming deployment process...${RESET}"
            ;;
        2)
            echo -e "${GREEN}▶️  Proceeding with deployment...${RESET}"
            ;;
        *)
            echo "Invalid choice '$choice', proceeding with deployment..."
            ;;
    esac
    
    exit 0
}

# Function to offer creation options when files are missing
offer_creation_options() {
    if [[ "$AUTO_TEMPLATES" == "true" ]]; then
        echo "📋 Auto-selecting template creation for new deployment..."
        echo ""
        create_new_env_files
        return
    fi
    
    echo "📋 Environment File Creation Options:"
    echo ""
    echo "1) Download existing environment files from S3 (for existing deployment)"
    echo "2) Create new environment files from templates (for new deployment)"
    echo "3) Exit without making changes"
    echo ""
    
    while true; do
        read -p "Please select an option (1-3): " choice
        case $choice in
            1)
                download_from_s3
                break
                ;;
            2)
                create_new_env_files
                break
                ;;
            3)
                echo "Exiting without changes."
                exit 1
                ;;
            *)
                echo "Invalid option. Please enter 1, 2, or 3."
                ;;
        esac
    done
}

# Function to find Copilot pipeline artifact bucket by querying CloudFormation directly
get_pipeline_artifact_bucket() {
    local app_name="$1"
    local env_name="$2"  # env_name provided for context but not used in search
    
    # Query CloudFormation StackSet infrastructure stacks for the PipelineBucket output
    # Pattern: StackSet-{app_name}-infrastructure-{uuid}
    local stack_pattern="StackSet-${app_name}-infrastructure"
    
    # Find the infrastructure stack for this app
    local stack_name
    stack_name=$(aws cloudformation list-stacks \
        --query "StackSummaries[?contains(StackName, '${stack_pattern}') && StackStatus == 'UPDATE_COMPLETE'].StackName" \
        --output text | head -1)
    
    if [[ -z "$stack_name" || "$stack_name" == "None" ]]; then
        echo "⚠️  No infrastructure stack found for app: $app_name (pattern: $stack_pattern)" >&2
        return 1
    fi
    
    # Get the PipelineBucket output from the infrastructure stack
    local bucket_name
    bucket_name=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --query 'Stacks[0].Outputs[?OutputKey==`PipelineBucket`].OutputValue' \
        --output text 2>/dev/null)
    
    if [[ -n "$bucket_name" && "$bucket_name" != "None" ]]; then
        echo "$bucket_name"  # Only the bucket name goes to stdout
        return 0
    else
        echo "⚠️  PipelineBucket output not found in stack: $stack_name" >&2
        return 1
    fi
}

# Function to find latest environment file in Copilot pipeline bucket
find_latest_copilot_env_file() {
    local bucket_name="$1"
    local env_name="$2"
    local file_type="$3"  # "env" or "web.env"
    
    # Copilot stores files as: manual/env-files/copilot.{env}.{type}/{hash}.env
    local prefix="manual/env-files/copilot.${env_name}.${file_type}/"
    
    # Search for latest file (silent)
    
    # List objects and find the latest based on last modified date
    local latest_file
    latest_file=$(aws s3api list-objects-v2 \
        --bucket "$bucket_name" \
        --prefix "$prefix" \
        --query 'sort_by(Contents, &LastModified)[-1].Key' \
        --output text 2>/dev/null)
    
    if [[ -n "$latest_file" && "$latest_file" != "None" ]]; then
        echo "$latest_file"  # Only the filename goes to stdout
        return 0
    else
        return 1
    fi
}

# Function to detect environment from app name
detect_environment_from_app() {
    local app_name="$1"
    
    # Extract environment from app name pattern (e.g., "staging-abc123-aai" -> "staging")
    if [[ "$app_name" =~ ^(staging|prod)-.*-aai$ ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    elif [[ "$app_name" =~ ^.*-aai$ ]]; then
        # If no staging/prod prefix, assume prod
        echo "prod"
        return 0
    else
        echo "⚠️  Could not detect environment from app name: $app_name"
        return 1
    fi
}

# Function to download existing environment files from S3 (intelligent version)
download_from_s3() {
    echo -e "${BOLD}${BLUE}🔄 Downloading environment files from S3...${RESET}"
    echo ""
    
    # Check if AWS CLI is available
    if ! command -v aws >/dev/null 2>&1; then
        echo "❌ AWS CLI not found. Please install AWS CLI and configure your credentials."
        echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        echo "❌ AWS credentials not configured or expired."
        echo "Please run: aws configure"
        exit 1
    fi
    
    # Use explicit environment if provided, otherwise detect from app name
    local detected_env
    if [[ -n "$EXPLICIT_ENV" ]]; then
        detected_env="$EXPLICIT_ENV"
        echo -e "${CYAN}🎯 Using explicit environment: ${BOLD}$detected_env${RESET}"
    elif ! detected_env=$(detect_environment_from_app "$APP_NAME"); then
        echo "❌ Failed to detect environment from app name: $APP_NAME"
        echo "💡 Expected pattern: staging-abc123-aai or abc123-aai (for prod)"
        exit 1
    else
        echo -e "${CYAN}🎯 Detected environment from app name: ${BOLD}$detected_env${RESET}"
    fi
    echo ""
    
    # Get Copilot pipeline artifact bucket
    local bucket_name
    if ! bucket_name=$(get_pipeline_artifact_bucket "$APP_NAME" "$detected_env"); then
        echo "❌ Failed to find Copilot pipeline artifact bucket"
        echo "💡 Make sure the Copilot application has been deployed and pipeline is configured"
        exit 1
    fi
    
    echo -e "${BLUE}📥 Using bucket: ${bucket_name}${RESET}"
    echo ""
    
    # Track download results
    local download_success=0
    local files_downloaded=()
    local files_failed=()
    
    # Try to download flowise env file
    echo -e "${BLUE}🔍 Flowise environment file...${RESET}"
    local latest_flowise_file
    
    if latest_flowise_file=$(find_latest_copilot_env_file "$bucket_name" "$detected_env" "env"); then
        if aws s3 cp "s3://$bucket_name/$latest_flowise_file" "$FLOWISE_ENV_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ Downloaded $FLOWISE_ENV_FILE${RESET}"
            files_downloaded+=("$FLOWISE_ENV_FILE")
            ((download_success++))
        else
            echo -e "${RED}❌ Failed to download $FLOWISE_ENV_FILE${RESET}"
            files_failed+=("$FLOWISE_ENV_FILE")
        fi
    else
        echo -e "${YELLOW}⚠️  No Flowise files found${RESET}"
        files_failed+=("$FLOWISE_ENV_FILE (not found)")
    fi
    
    echo ""
    
    # Try to download web env file
    echo -e "${BLUE}🔍 Web environment file...${RESET}"
    local latest_web_file
    
    if latest_web_file=$(find_latest_copilot_env_file "$bucket_name" "$detected_env" "web.env"); then
        if aws s3 cp "s3://$bucket_name/$latest_web_file" "$WEB_ENV_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ Downloaded $WEB_ENV_FILE${RESET}"
            files_downloaded+=("$WEB_ENV_FILE")
            ((download_success++))
        else
            echo -e "${RED}❌ Failed to download $WEB_ENV_FILE${RESET}"
            files_failed+=("$WEB_ENV_FILE")
        fi
    else
        echo -e "${YELLOW}⚠️  No Web files found${RESET}"
        files_failed+=("$WEB_ENV_FILE (not found)")
    fi
    
    echo ""
    echo -e "${BOLD}📊 Summary:${RESET}"
    
    if [[ $download_success -gt 0 ]]; then
        echo -e "${GREEN}✅ Downloaded ${download_success} file(s) successfully${RESET}"
        for file in "${files_downloaded[@]}"; do
            echo -e "   ${GREEN}•${RESET} $file"
        done
        
        if [[ ${#files_failed[@]} -gt 0 ]]; then
            echo -e "${RED}❌ ${#files_failed[@]} file(s) failed${RESET}"
            for file in "${files_failed[@]}"; do
                echo -e "   ${RED}•${RESET} $file"
            done
        fi
        
        echo ""
        echo -e "${BOLD}${GREEN}🎯 Download completed!${RESET}"
        echo ""
        
        # Prompt for proceed/wait decision
        prompt_proceed_or_wait "${files_downloaded[@]}"
    else
        echo -e "${RED}❌ No files were downloaded${RESET}"
        echo -e "${YELLOW}💡 Consider creating new environment files instead${RESET}"
        exit 1
    fi
}

# Function to create new environment files from templates
create_new_env_files() {
    echo "🆕 Creating new environment files from templates..."
    echo ""
    
    # Validate required tools
    validate_tools
    
    # Check for template files
    FLOWISE_TEMPLATE="copilot/copilot.applicationName.env.template"
    WEB_TEMPLATE="copilot/copilot.applicationName.web.env.template"
    
    if [[ ! -f "$FLOWISE_TEMPLATE" ]]; then
        echo "❌ Flowise template not found: $FLOWISE_TEMPLATE"
        exit 1
    fi
    
    if [[ ! -f "$WEB_TEMPLATE" ]]; then
        echo "❌ Web template not found: $WEB_TEMPLATE"
        exit 1
    fi
    
    echo "📋 File Creation Options:"
    echo ""
    echo "1) Guided setup (recommended) - Answer prompts for required variables"
    echo "2) Create empty files from templates - Manually edit afterward"
    echo ""
    
    while true; do
        read -p "Select creation method (1-2): " method_choice
        case $method_choice in
            1)
                guided_setup
                break
                ;;
            2)
                create_empty_files
                break
                ;;
            *)
                echo "Invalid option. Please enter 1 or 2."
                ;;
        esac
    done
}

# Function for guided setup with prompts
guided_setup() {
    echo ""
    echo "🎯 Starting guided environment file setup..."
    echo ""
    
    # Generate required secrets first
    echo "🔐 Generating secure secrets..."
    SESSION_SECRET=$(generate_secure_secret "session")
    AUTH0_SECRET=$(generate_secure_secret "auth0")
    echo "✅ Generated SESSION_SECRET and AUTH0_SECRET"
    echo ""
    
    # Collect and create Flowise variables
    collect_and_create_flowise_file
    
    # Collect and create Web variables using Flowise values
    collect_and_create_web_file
    
    echo ""
    echo "🎯 Environment files created successfully!"
    echo "📝 Files created:"
    echo "   - $FLOWISE_ENV_FILE"
    echo "   - $WEB_ENV_FILE"
    echo ""
    echo "⚠️  Please review the files and update any additional variables as needed."
    
    # Prompt for proceed/wait decision
    prompt_proceed_or_wait "$FLOWISE_ENV_FILE" "$WEB_ENV_FILE"
}

# Helper function to replace variables in file (Bash 3.x compatible)
replace_in_file() {
    local file="$1"
    local var_name="$2"
    local value="$3"
    
    if [[ -n "$value" ]]; then
        # Escape forward slashes for sed
        local escaped_value="${value//\//\\/}"
        sed -i.bak "s|^${var_name}=.*|${var_name}=${escaped_value}|g" "$file"
        rm -f "${file}.bak"
    fi
}

# Helper function to prompt and set variable globally + in file
prompt_and_set() {
    local var_name="$1"
    local description="$2"
    local required="$3"
    
    while true; do
        if [[ "$required" == "true" ]]; then
            read -p "📝 $description: " value
            if [[ -n "$value" ]]; then
                # Set globally and in file
                eval "GLOBAL_$var_name=\"\$value\""
                replace_in_file "$FLOWISE_ENV_FILE" "$var_name" "$value"
                break
            else
                echo "⚠️  This field is required. Please enter a value."
            fi
        else
            read -p "📝 $description (optional): " value
            # Set globally and in file  
            eval "GLOBAL_$var_name=\"\$value\""
            replace_in_file "$FLOWISE_ENV_FILE" "$var_name" "$value"
            break
        fi
    done
}

# Function to collect and create Flowise file (Bash 3.x compatible)
collect_and_create_flowise_file() {
    echo "📋 Configuring Flowise Environment Variables"
    echo "=============================================="
    echo ""
    
    # Start with template
    cp "$FLOWISE_TEMPLATE" "$FLOWISE_ENV_FILE"
    
    # Set generated secrets
    replace_in_file "$FLOWISE_ENV_FILE" "SESSION_SECRET" "$SESSION_SECRET"
    replace_in_file "$FLOWISE_ENV_FILE" "AUTH0_SECRET" "$AUTH0_SECRET"
    
    # Handle variables with defaults
    echo "🔧 Configuration variables with defaults:"
    echo "These have sensible defaults but can be customized if needed."
    echo ""
    
    while true; do
        read -p "Would you like to customize default configuration values? (y/n): " customize_defaults
        case $customize_defaults in
            [Yy]*)
                collect_default_variables_flowise
                break
                ;;
            [Nn]*)
                echo "✅ Using default configuration values"
                break
                ;;
            *)
                echo "Please answer y or n"
                ;;
        esac
    done
    
    echo ""
    echo "🔑 Required Authentication & API Variables:"
    echo "=========================================="
    echo ""
    
    # Required AUTH0 variables - store globally for web file
    prompt_and_set "AUTH0_ISSUER_BASE_URL" "Auth0 Issuer Base URL (e.g., https://your-domain.us.auth0.com)" true
    prompt_and_set "AUTH0_BASE_URL" "Auth0 Base URL (should match your deployment domain)" true  
    prompt_and_set "AUTH0_DOMAIN" "Auth0 Domain (e.g., your-domain.us.auth0.com)" true
    prompt_and_set "AUTH0_AUDIENCE" "Auth0 API Audience (e.g., https://theanswer.ai)" true
    prompt_and_set "AUTH0_ORGANIZATION_ID" "Auth0 Organization ID" true
    prompt_and_set "AUTH0_CLIENT_ID" "Auth0 Client ID" true
    prompt_and_set "AUTH0_CLIENT_SECRET" "Auth0 Client Secret" true
    
    # Required API Keys
    prompt_and_set "AAI_DEFAULT_OPENAI_API_KEY" "OpenAI API Key (required for AI functionality)" true
    
    # Optional services
    echo ""
    echo "🧪 Optional Service Integrations:"
    echo "================================"
    echo ""
    
    prompt_optional_service_flowise "Flagsmith" "FLAGSMITH_ENVIRONMENT_ID" "Flagsmith Environment ID"
    
    # Handle Langfuse configuration with defaults
    configure_langfuse_flowise
    
    echo "✅ Created $FLOWISE_ENV_FILE"
}

# Function to collect and create Web file (Bash 3.x compatible) 
collect_and_create_web_file() {
    echo ""
    echo "📋 Configuring Web Application Environment Variables"
    echo "================================================="
    echo ""
    
    # Start with template
    cp "$WEB_TEMPLATE" "$WEB_ENV_FILE"
    
    # Set generated secret (same as flowise)
    replace_in_file "$WEB_ENV_FILE" "AUTH0_SECRET" "$AUTH0_SECRET"
    
    echo "🔑 Required Web Authentication Variables:"
    echo "========================================"
    echo ""
    
    # Use same AUTH0 values from flowise if available
    if [[ -n "${GLOBAL_AUTH0_ISSUER_BASE_URL:-}" ]]; then
        echo "ℹ️  Using AUTH0 values from Flowise configuration..."
        replace_in_file "$WEB_ENV_FILE" "AUTH0_ISSUER_BASE_URL" "$GLOBAL_AUTH0_ISSUER_BASE_URL"
        replace_in_file "$WEB_ENV_FILE" "AUTH0_BASE_URL" "$GLOBAL_AUTH0_BASE_URL"
        replace_in_file "$WEB_ENV_FILE" "AUTH0_DOMAIN" "$GLOBAL_AUTH0_DOMAIN"
        replace_in_file "$WEB_ENV_FILE" "AUTH0_AUDIENCE" "$GLOBAL_AUTH0_AUDIENCE"
        replace_in_file "$WEB_ENV_FILE" "AUTH0_ORGANIZATION_ID" "$GLOBAL_AUTH0_ORGANIZATION_ID"
    else
        prompt_and_set_web "AUTH0_ISSUER_BASE_URL" "Auth0 Issuer Base URL" true
        prompt_and_set_web "AUTH0_BASE_URL" "Auth0 Base URL" true
        prompt_and_set_web "AUTH0_DOMAIN" "Auth0 Domain" true  
        prompt_and_set_web "AUTH0_AUDIENCE" "Auth0 API Audience (e.g., https://theanswer.ai)" true
        prompt_and_set_web "AUTH0_ORGANIZATION_ID" "Auth0 Organization ID" true
    fi
    
    # Web-specific required variables - check if already provided in Flowise
    if [[ -n "${GLOBAL_AUTH0_CLIENT_ID:-}" ]]; then
        echo "ℹ️  Using AUTH0_CLIENT_ID from Flowise configuration..."
        replace_in_file "$WEB_ENV_FILE" "AUTH0_CLIENT_ID" "$GLOBAL_AUTH0_CLIENT_ID"
    else
        prompt_and_set_web "AUTH0_CLIENT_ID" "Auth0 Client ID (required for web OAuth flow)" true
    fi
    
    if [[ -n "${GLOBAL_AUTH0_CLIENT_SECRET:-}" ]]; then
        echo "ℹ️  Using AUTH0_CLIENT_SECRET from Flowise configuration..."
        replace_in_file "$WEB_ENV_FILE" "AUTH0_CLIENT_SECRET" "$GLOBAL_AUTH0_CLIENT_SECRET"
    else
        prompt_and_set_web "AUTH0_CLIENT_SECRET" "Auth0 Client Secret (required for web OAuth flow)" true
    fi
    
    # Optional web variables
    echo ""
    # Check if Flagsmith was already configured in Flowise
    if [[ -n "${GLOBAL_FLAGSMITH_ENVIRONMENT_ID:-}" ]]; then
        echo "ℹ️  Using FLAGSMITH_ENVIRONMENT_ID from Flowise configuration..."
        replace_in_file "$WEB_ENV_FILE" "FLAGSMITH_ENVIRONMENT_ID" "$GLOBAL_FLAGSMITH_ENVIRONMENT_ID"
    else
        prompt_optional_service_web "Flagsmith" "FLAGSMITH_ENVIRONMENT_ID" "Flagsmith Environment ID"
    fi
    
    echo "✅ Created $WEB_ENV_FILE"
}

# Helper function to prompt and set web variables
prompt_and_set_web() {
    local var_name="$1"
    local description="$2"
    local required="$3"
    
    while true; do
        if [[ "$required" == "true" ]]; then
            read -p "📝 $description: " value
            if [[ -n "$value" ]]; then
                replace_in_file "$WEB_ENV_FILE" "$var_name" "$value"
                break
            else
                echo "⚠️  This field is required. Please enter a value."
            fi
        else
            read -p "📝 $description (optional): " value
            replace_in_file "$WEB_ENV_FILE" "$var_name" "$value"
            break
        fi
    done
}

# Helper function for optional services (Flowise)
prompt_optional_service_flowise() {
    local service_name="$1"
    local var_names="$2"
    local description="$3"
    
    while true; do
        read -p "🔧 Configure $service_name? ($description) (y/n): " configure_service
        case $configure_service in
            [Yy]*)
                IFS=',' read -ra VAR_ARRAY <<< "$var_names"
                for var_name in "${VAR_ARRAY[@]}"; do
                    prompt_and_set "$var_name" "$service_name ${var_name##*_}" false
                done
                break
                ;;
            [Nn]*)
                echo "⏭️  Skipping $service_name configuration"
                break
                ;;
            *)
                echo "Please answer y or n"
                ;;
        esac
    done
}

# Helper function for optional services (Web)
prompt_optional_service_web() {
    local service_name="$1"
    local var_names="$2"
    local description="$3"
    
    while true; do
        read -p "🔧 Configure $service_name? ($description) (y/n): " configure_service
        case $configure_service in
            [Yy]*)
                IFS=',' read -ra VAR_ARRAY <<< "$var_names"
                for var_name in "${VAR_ARRAY[@]}"; do
                    prompt_and_set_web "$var_name" "$service_name ${var_name##*_}" false
                done
                break
                ;;
            [Nn]*)
                echo "⏭️  Skipping $service_name configuration"
                break
                ;;
            *)
                echo "Please answer y or n"
                ;;
        esac
    done
}

# Custom Langfuse configuration with defaults
configure_langfuse_flowise() {
    # Always set LANGFUSE_HOST to default
    replace_in_file "$FLOWISE_ENV_FILE" "LANGFUSE_HOST" "https://cloud.langfuse.com"
    eval "GLOBAL_LANGFUSE_HOST=\"https://cloud.langfuse.com\""
    
    while true; do
        read -p "🔧 Configure Langfuse? (Langfuse monitoring - Secret Key, Public Key) (y/n): " configure_langfuse
        case $configure_langfuse in
            [Yy]*)
                prompt_and_set "LANGFUSE_SECRET_KEY" "Langfuse Secret Key" false
                prompt_and_set "LANGFUSE_PUBLIC_KEY" "Langfuse Public Key" false
                break
                ;;
            [Nn]*)
                echo "⏭️  Skipping Langfuse configuration - setting keys to n/a"
                replace_in_file "$FLOWISE_ENV_FILE" "LANGFUSE_SECRET_KEY" "n/a"
                replace_in_file "$FLOWISE_ENV_FILE" "LANGFUSE_PUBLIC_KEY" "n/a"
                eval "GLOBAL_LANGFUSE_SECRET_KEY=\"n/a\""
                eval "GLOBAL_LANGFUSE_PUBLIC_KEY=\"n/a\""
                break
                ;;
            *)
                echo "Please answer y or n"
                ;;
        esac
    done
}

# Helper function for default variables (Flowise)
collect_default_variables_flowise() {
    echo ""
    echo "🔧 Customizing Default Configuration Values:"
    echo "==========================================="
    echo ""
    
    # Debug and logging settings
    prompt_and_set "DEBUG" "Enable debug mode (current: false)" false
    prompt_and_set "VERBOSE" "Enable verbose logging (current: false)" false  
    prompt_and_set "AUTH_DEBUG" "Enable auth debugging (current: false)" false
    prompt_and_set "LOG_LEVEL" "Log level (current: warn, options: error/warn/info/debug)" false
    
    echo ""
}

# Old functions removed - replaced with Bash 3.x compatible versions above

# Function to create empty files from templates
create_empty_files() {
    echo ""
    echo "📄 Creating empty environment files from templates..."
    
    # Copy templates to target files
    cp "$FLOWISE_TEMPLATE" "$FLOWISE_ENV_FILE"
    cp "$WEB_TEMPLATE" "$WEB_ENV_FILE"
    
    echo "✅ Created $FLOWISE_ENV_FILE (from template)"
    echo "✅ Created $WEB_ENV_FILE (from template)"
    echo ""
    echo "📝 Please edit these files manually to configure your environment variables."
    echo "💡 Focus on the variables marked as 'Required' in the comments."
    
    # Prompt for proceed/wait decision
    prompt_proceed_or_wait "$FLOWISE_ENV_FILE" "$WEB_ENV_FILE"
}

# ==================================================
# MAIN SCRIPT LOGIC
# ==================================================

# Parse command line arguments
AUTO_TEMPLATES=false
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --auto-templates)
            AUTO_TEMPLATES=true
            shift
            ;;
        *)
            POSITIONAL_ARGS+=("$1")
            shift
            ;;
    esac
done

# Restore positional parameters
set -- "${POSITIONAL_ARGS[@]}"

# Get application name and optional environment from arguments or detect from .workspace
if [[ -n "${1:-}" ]]; then
    # If first argument is an environment name, use it; otherwise treat as app name
    if [[ "$1" =~ ^(staging|prod)$ ]]; then
        EXPLICIT_ENV="$1"
        if [[ -f "copilot/.workspace" ]]; then
            APP_NAME="$(cat copilot/.workspace | grep 'application:' | cut -d':' -f2 | xargs)"
        else
            echo "❌ Environment provided but no copilot/.workspace file found"
            echo "Usage: $0 [environment] [--auto-templates] (requires .workspace file)"
            echo "   or: $0 [application_name] [--auto-templates]"
            exit 1
        fi
    else
        APP_NAME="$1"
        EXPLICIT_ENV=""
    fi
elif [[ -f "copilot/.workspace" ]]; then
    APP_NAME="$(cat copilot/.workspace | grep 'application:' | cut -d':' -f2 | xargs)"
    EXPLICIT_ENV=""
else
    echo "❌ No application name provided and no copilot/.workspace file found"
    echo "Usage: $0 [environment|application_name] [--auto-templates]"
    exit 1
fi

echo -e "${BOLD}🔍 Checking environment files for: ${CYAN}$APP_NAME${RESET}"
echo ""

# Check for main flowise env file
FLOWISE_ENV_FILE="copilot.$APP_NAME.env"
if [[ -f "$FLOWISE_ENV_FILE" ]]; then
    echo -e "${GREEN}✅ $FLOWISE_ENV_FILE - EXISTS${RESET}"
    # Show file size and last modified
    if command -v stat >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS stat
            SIZE=$(stat -f%z "$FLOWISE_ENV_FILE")
            MODIFIED=$(stat -f%Sm "$FLOWISE_ENV_FILE")
        else
            # Linux stat
            SIZE=$(stat -c%s "$FLOWISE_ENV_FILE")
            MODIFIED=$(stat -c%y "$FLOWISE_ENV_FILE")
        fi
        echo "   Size: $SIZE bytes, Modified: $MODIFIED"
    fi
else
    echo -e "${RED}❌ $FLOWISE_ENV_FILE - NOT FOUND${RESET}"
fi

# Check for web env file
WEB_ENV_FILE="copilot.$APP_NAME.web.env"
if [[ -f "$WEB_ENV_FILE" ]]; then
    echo -e "${GREEN}✅ $WEB_ENV_FILE - EXISTS${RESET}"
    # Show file size and last modified
    if command -v stat >/dev/null 2>&1; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS stat
            SIZE=$(stat -f%z "$WEB_ENV_FILE")
            MODIFIED=$(stat -f%Sm "$WEB_ENV_FILE")
        else
            # Linux stat
            SIZE=$(stat -c%s "$WEB_ENV_FILE")
            MODIFIED=$(stat -c%y "$WEB_ENV_FILE")
        fi
        echo "   Size: $SIZE bytes, Modified: $MODIFIED"
    fi
else
    echo -e "${RED}❌ $WEB_ENV_FILE - NOT FOUND${RESET}"
fi

echo ""

# Enhanced logic: If files are missing, offer creation options
MISSING_COUNT=0
MISSING_FILES=()
[[ ! -f "$FLOWISE_ENV_FILE" ]] && ((MISSING_COUNT++)) && MISSING_FILES+=("$FLOWISE_ENV_FILE")
[[ ! -f "$WEB_ENV_FILE" ]] && ((MISSING_COUNT++)) && MISSING_FILES+=("$WEB_ENV_FILE")

if [[ $MISSING_COUNT -eq 0 ]]; then
    echo -e "${BOLD}${GREEN}🎯 All environment files found!${RESET}"
    exit 0
else
    echo -e "${YELLOW}⚠️  $MISSING_COUNT environment file(s) missing${RESET}"
    echo ""
    offer_creation_options
fi
