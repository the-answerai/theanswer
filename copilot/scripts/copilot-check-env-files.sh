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

# Function to offer creation options when files are missing
offer_creation_options() {
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

# Function to find Copilot pipeline artifact bucket
get_pipeline_artifact_bucket() {
    local app_name="$1"
    local env_name="$2"
    
    # Extract client identifier from app name (e.g., staging-abc123-aai -> abc123)
    local client_id
    if [[ "$app_name" =~ ^${env_name}-(.+)-aai$ ]]; then
        client_id="${BASH_REMATCH[1]}"
    elif [[ "$app_name" =~ ^(.+)-aai$ ]]; then
        client_id="${BASH_REMATCH[1]}"
    else
        echo "⚠️  Could not extract client ID from app name: $app_name" >&2
        return 1
    fi
    
    # Search pattern: stackset-{env}-{client}-{suffix}-pipelinebuiltartifactbuc-{hash}
    local search_pattern="stackset-${env_name}-${client_id}"
    
    # List all buckets and find the matching pipeline artifact bucket
    local bucket_name
    bucket_name=$(aws s3 ls | grep -E "${search_pattern}.*pipelinebuiltartifactbuc" | awk '{print $3}' | head -1)
    
    if [[ -n "$bucket_name" ]]; then
        echo "$bucket_name"  # Only the bucket name goes to stdout
        return 0
    else
        echo "⚠️  Pipeline artifact bucket not found for pattern: $search_pattern" >&2
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
    
    # Detect environment from app name
    local detected_env
    if ! detected_env=$(detect_environment_from_app "$APP_NAME"); then
        echo "❌ Failed to detect environment from app name: $APP_NAME"
        echo "💡 Expected pattern: staging-abc123-aai or abc123-aai (for prod)"
        exit 1
    fi
    
    echo -e "${CYAN}🎯 Environment: ${BOLD}$detected_env${RESET}"
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
        exit 0
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
    
    # Collect variables for both files
    declare -A FLOWISE_VARS
    declare -A WEB_VARS
    
    # Generate required secrets first
    echo "🔐 Generating secure secrets..."
    SESSION_SECRET=$(generate_secure_secret "session")
    AUTH0_SECRET=$(generate_secure_secret "auth0")
    echo "✅ Generated SESSION_SECRET and AUTH0_SECRET"
    echo ""
    
    # Collect Flowise variables
    collect_flowise_variables FLOWISE_VARS
    
    # Collect Web variables  
    collect_web_variables WEB_VARS
    
    # Create the files
    create_flowise_file FLOWISE_VARS
    create_web_file WEB_VARS
    
    echo ""
    echo "🎯 Environment files created successfully!"
    echo "📝 Files created:"
    echo "   - $FLOWISE_ENV_FILE"
    echo "   - $WEB_ENV_FILE"
    echo ""
    echo "⚠️  Please review the files and update any additional variables as needed."
    exit 0
}

# Function to collect Flowise-specific variables
collect_flowise_variables() {
    local -n vars=$1
    
    echo "📋 Configuring Flowise Environment Variables"
    echo "=============================================="
    echo ""
    
    # Set generated secrets
    vars["SESSION_SECRET"]="$SESSION_SECRET"
    vars["AUTH0_SECRET"]="$AUTH0_SECRET"
    
    # Handle variables with defaults
    echo "🔧 Configuration variables with defaults:"
    echo "These have sensible defaults but can be customized if needed."
    echo ""
    
    while true; do
        read -p "Would you like to customize default configuration values? (y/n): " customize_defaults
        case $customize_defaults in
            [Yy]*)
                collect_default_variables vars
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
    
    # Required AUTH0 variables
    prompt_variable vars "AUTH0_ISSUER_BASE_URL" "Auth0 Issuer Base URL (e.g., https://your-domain.us.auth0.com)" true
    prompt_variable vars "AUTH0_BASE_URL" "Auth0 Base URL (should match your deployment domain)" true  
    prompt_variable vars "AUTH0_DOMAIN" "Auth0 Domain (e.g., your-domain.us.auth0.com)" true
    prompt_variable vars "AUTH0_ORGANIZATION_ID" "Auth0 Organization ID" false
    prompt_variable vars "AUTH0_CLIENT_ID" "Auth0 Client ID (optional, only needed for OAuth endpoints)" false
    prompt_variable vars "AUTH0_CLIENT_SECRET" "Auth0 Client Secret (optional, only needed for OAuth endpoints)" false
    
    # Required API Keys
    prompt_variable vars "AAI_DEFAULT_OPENAI_API_KEY" "OpenAI API Key (required for AI functionality)" true
    
    # Optional services
    echo ""
    echo "🧪 Optional Service Integrations:"
    echo "================================"
    echo ""
    
    prompt_optional_service vars "Flagsmith" "FLAGSMITH_ENVIRONMENT_ID" "Flagsmith Environment ID for feature flags"
    prompt_optional_service vars "Langfuse" "LANGFUSE_SECRET_KEY,LANGFUSE_PUBLIC_KEY" "Langfuse monitoring (Secret Key, Public Key)"
}

# Function to collect Web-specific variables  
collect_web_variables() {
    local -n vars=$1
    
    echo ""
    echo "📋 Configuring Web Application Environment Variables"
    echo "================================================="
    echo ""
    
    # Set generated secret (same as flowise)
    vars["AUTH0_SECRET"]="$AUTH0_SECRET"
    
    echo "🔑 Required Web Authentication Variables:"
    echo "========================================"
    echo ""
    
    # Use same AUTH0 values from flowise vars if available
    if [[ -n "${FLOWISE_VARS[AUTH0_ISSUER_BASE_URL]:-}" ]]; then
        echo "ℹ️  Using AUTH0 values from Flowise configuration..."
        vars["AUTH0_ISSUER_BASE_URL"]="${FLOWISE_VARS[AUTH0_ISSUER_BASE_URL]}"
        vars["AUTH0_BASE_URL"]="${FLOWISE_VARS[AUTH0_BASE_URL]}"
        vars["AUTH0_DOMAIN"]="${FLOWISE_VARS[AUTH0_DOMAIN]}"
        vars["AUTH0_ORGANIZATION_ID"]="${FLOWISE_VARS[AUTH0_ORGANIZATION_ID]}"
    else
        prompt_variable vars "AUTH0_ISSUER_BASE_URL" "Auth0 Issuer Base URL" true
        prompt_variable vars "AUTH0_BASE_URL" "Auth0 Base URL" true
        prompt_variable vars "AUTH0_DOMAIN" "Auth0 Domain" true  
        prompt_variable vars "AUTH0_ORGANIZATION_ID" "Auth0 Organization ID" false
    fi
    
    # Web-specific required variables
    prompt_variable vars "AUTH0_CLIENT_ID" "Auth0 Client ID (required for web OAuth flow)" true
    prompt_variable vars "AUTH0_CLIENT_SECRET" "Auth0 Client Secret (required for web OAuth flow)" true
    
    # Optional web variables
    echo ""
    prompt_optional_service vars "Flagsmith" "FLAGSMITH_ENVIRONMENT_ID" "Flagsmith Environment ID (same as server if using)"
}

# Helper function to prompt for a variable
prompt_variable() {
    local -n vars_ref=$1
    local var_name="$2"
    local description="$3"  
    local required="$4"
    
    while true; do
        if [[ "$required" == "true" ]]; then
            read -p "📝 $description: " value
            if [[ -n "$value" ]]; then
                vars_ref["$var_name"]="$value"
                break
            else
                echo "⚠️  This field is required. Please enter a value."
            fi
        else
            read -p "📝 $description (optional): " value
            vars_ref["$var_name"]="$value"
            break
        fi
    done
}

# Helper function to prompt for optional services
prompt_optional_service() {
    local -n vars_ref=$1
    local service_name="$2"
    local var_names="$3"
    local description="$4"
    
    while true; do
        read -p "🔧 Configure $service_name? ($description) (y/n): " configure_service
        case $configure_service in
            [Yy]*)
                IFS=',' read -ra VAR_ARRAY <<< "$var_names"
                for var_name in "${VAR_ARRAY[@]}"; do
                    prompt_variable vars_ref "$var_name" "$service_name ${var_name##*_}" false
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

# Function to handle default variables
collect_default_variables() {
    local -n vars=$1
    
    echo ""
    echo "🔧 Customizing Default Configuration Values:"
    echo "==========================================="
    echo ""
    
    # Debug and logging settings
    prompt_variable vars "DEBUG" "Enable debug mode (current: false)" false
    prompt_variable vars "VERBOSE" "Enable verbose logging (current: false)" false  
    prompt_variable vars "AUTH_DEBUG" "Enable auth debugging (current: false)" false
    prompt_variable vars "LOG_LEVEL" "Log level (current: warn, options: error/warn/info/debug)" false
    
    echo ""
}

# Function to create Flowise env file from collected variables
create_flowise_file() {
    local -n vars=$1
    
    echo "📝 Creating $FLOWISE_ENV_FILE..."
    
    # Start with template
    cp "$FLOWISE_TEMPLATE" "$FLOWISE_ENV_FILE"
    
    # Replace variables
    for var_name in "${!vars[@]}"; do
        local value="${vars[$var_name]}"
        if [[ -n "$value" ]]; then
            # Use sed to replace the variable in the file
            sed -i.bak "s|^${var_name}=.*|${var_name}=${value}|g" "$FLOWISE_ENV_FILE"
        fi
    done
    
    # Clean up backup file
    rm -f "${FLOWISE_ENV_FILE}.bak"
    
    echo "✅ Created $FLOWISE_ENV_FILE"
}

# Function to create Web env file from collected variables
create_web_file() {
    local -n vars=$1
    
    echo "📝 Creating $WEB_ENV_FILE..."
    
    # Start with template  
    cp "$WEB_TEMPLATE" "$WEB_ENV_FILE"
    
    # Replace variables
    for var_name in "${!vars[@]}"; do
        local value="${vars[$var_name]}"
        if [[ -n "$value" ]]; then
            # Use sed to replace the variable in the file
            sed -i.bak "s|^${var_name}=.*|${var_name}=${value}|g" "$WEB_ENV_FILE"
        fi
    done
    
    # Clean up backup file
    rm -f "${WEB_ENV_FILE}.bak"
    
    echo "✅ Created $WEB_ENV_FILE"
}

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
    exit 0
}

# ==================================================
# MAIN SCRIPT LOGIC
# ==================================================

# Get application name from argument or try to detect from .workspace
if [[ -n "${1:-}" ]]; then
    APP_NAME="$1"
elif [[ -f "copilot/.workspace" ]]; then
    APP_NAME="$(cat copilot/.workspace | grep 'application:' | cut -d':' -f2 | xargs)"
else
    echo "❌ No application name provided and no copilot/.workspace file found"
    echo "Usage: $0 [application_name]"
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
