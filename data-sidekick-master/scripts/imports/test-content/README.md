# Test Content Generation Scripts

This directory contains scripts for generating test content for the application. The scripts can generate various types of test data including call logs, tickets, documents, chats, and users.

## Scripts Overview

-   `generate_all_test_content.js` - Generates all types of test content with default test tags
-   `fetch_and_use_real_tags.js` - Generates all types of test content using real tags from the database
-   `generate_test_call_logs.js` - Generates test call logs
-   `generate_test_tickets.js` - Generates test tickets
-   `generate_test_documents.js` - Generates test documents
-   `generate_test_chats.js` - Generates test chats
-   `generate_test_users.js` - Generates test users

## Using the Scripts

### Generating Test Content with Default Tags

```bash
node scripts/imports/test-content/generate_all_test_content.js [environment]
```

Where `[environment]` is one of: `local`, `prime`, or `wow` (defaults to `local` if not specified).

### Generating Test Content with Real Tags

There are two ways to generate test content with real tags:

#### 1. Using the Shell Script (Recommended)

```bash
./scripts/generate_test_content_with_real_tags.sh [options]
```

Options:

-   `--env` or `-e` - Specify the environment (`local`, `prime`, or `wow`)
-   `--clear` or `-c` - Clear existing data before generating new content

Examples:

```bash
# Generate test content for local environment
./scripts/generate_test_content_with_real_tags.sh

# Generate test content for prime environment with data clearing
./scripts/generate_test_content_with_real_tags.sh prime --clear

# Alternative way to specify environment and clearing
./scripts/generate_test_content_with_real_tags.sh --env wow -c
```

#### 2. Directly Using the JavaScript Script

```bash
node scripts/imports/test-content/fetch_and_use_real_tags.js [environment] [--clear]
```

Examples:

```bash
# Generate test content for local environment
node scripts/imports/test-content/fetch_and_use_real_tags.js

# Generate test content for prime environment with data clearing
node scripts/imports/test-content/fetch_and_use_real_tags.js prime --clear
```

## How It Works

### Default Tag Generation

The `generate_all_test_content.js` script uses hardcoded test tag combinations defined in each individual script:

1. It runs `generate_test_tags.js` to create predefined test tags
2. Then it generates test content with those predefined tags

### Real Tag Generation

The `fetch_and_use_real_tags.js` script:

1. First checks if tags exist in the database (or creates them if they don't)
2. Fetches all tags from the database
3. Organizes the tags into logical combinations (parent-child relationships)
4. Creates a temporary file with the tag data
5. Passes this tag data to each individual generator script
6. Cleans up the temporary file after generation is complete

This ensures that all generated test content uses the actual tags from your database, making the test data more realistic and consistent with your production data.

## Important Notes

-   Make sure your `.env.[environment]` file exists and contains the correct Supabase credentials
-   The tag structure is defined in `scripts/create_tags.js` and should be maintained there
-   You can run individual generation scripts directly, but using the orchestrator scripts is recommended
-   When clearing data, you'll be prompted to confirm before proceeding
