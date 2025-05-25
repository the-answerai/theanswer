# WOW Calls Data Import Guide

This guide explains how to import WOW calls data from CSV files into the documents table of the data-sidekick application.

## Overview

The import process involves:

1. Creating a research view for storing the data (using admin access)
2. Creating a data source linked to the research view
3. Importing the CSV data into the documents table
4. Adding all additional fields as document metadata

## Prerequisites

-   Node.js installed
-   Access to a Supabase instance with the data-sidekick schema
-   A CSV file with WOW calls data located at `csv/wow-calls.csv`
-   Proper environment variables in `.env.local`

## Setup

1. Make sure the following environment variables are set in `.env.local`:

    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for admin access
    ```

2. Install required dependencies:
    ```
    pnpm install uuid csv-parser dotenv @supabase/supabase-js
    ```

## Step 1: Create a Research View Directly

Since your database has Row Level Security (RLS) policies that may restrict normal operations, we use the service role key to bypass these restrictions:

```
node scripts/create_research_view_direct.js
```

This script will:

-   Use the service role key for admin access
-   Create a research view without requiring a user association
-   Output a research view ID to use with the import script

## Step 2: Import WOW Calls Data

Use the import script to load the data:

```
node scripts/import_wow_calls.js <research_view_id>
```

Replace `<research_view_id>` with the ID from Step 1.

For testing with a smaller dataset first:

```
node scripts/import_wow_calls_test.js <research_view_id>
```

These scripts will:

-   Create a data source for the CSV file if it doesn't exist
-   Import all records from the CSV file into the `documents` table
-   Store all additional fields as metadata in the `document_metadata` table
-   Process records in batches to prevent timeouts

## Step 3: Verify the Import

To verify that the data was imported correctly:

```
node scripts/check_data.js
```

This will show:

-   The data sources associated with WOW calls
-   Documents that were created with their transcripts
-   Basic information about each document

## CSV Format

The import script expects a CSV file with the following fields:

-   `CallId`: Unique identifier for the call
-   `Date`: Date of the call
-   `CallTranscript` or `CallTranscript2`: Text transcript of the call
-   `Duration`: Duration of the call
-   Additional fields: All other fields will be stored as metadata

## Troubleshooting

### Row Level Security Issues

If you encounter permission errors with the regular scripts, make sure you're using the service role key scripts:

-   `create_research_view_direct.js` - Creates a research view with admin privileges
-   Updated `import_wow_calls_test.js` with service role key

### Environment Variables

The scripts now use `.env.local` by default for local development. Make sure your environment variables are set correctly in this file.

### CSV Parsing Issues

If you encounter issues with the CSV file:

1. Try testing with a sample file first (`wow-calls-sample.csv`)
2. Check for special characters or line breaks in fields
3. Ensure the CSV has proper headers matching the expected field names

### Debug Scripts

The repository includes several debugging scripts:

-   `check_data.js` - Shows documents and data sources
-   `check_users.js` - Lists available users in the database
-   `create_test_user.js` - Attempts to create a test user (may fail due to RLS)

## Integration with Analysis Panel

Once imported, these documents can be accessed through the Analysis Panel in the application. The imported calls will appear as documents that can be analyzed, searched, and visualized.
