# copilot.appName.env File Creation for Copilot Deployments

## New Deployment Options:

### Option 1: Manual

-   Script creates empty files from templates
-   You edit them yourself

### Option 2: Guided

-   Script asks you questions about each variable individually
-   Puts the values in the appropriate files automatically
-   Pre-fills common required values

## Which to Choose?

**Manual** = Start clean, full control
**Guided** = Answer questions, automatic file population

# Existing Deployments

### Option 3: Auto-Download from AWS

**Prerequisite**: Must be logged into the appropriate AWS account

-   **Note**: Again, this option is only available if you are logged in to the appropriate AWS account!
-   Script automatically attempts to download existing environment variables from AWS
-   Retrieves values from deployed services of the latest copilot.appName.env files from the S3 Infra Buckets
-   Populates environment files with current production/staging values
