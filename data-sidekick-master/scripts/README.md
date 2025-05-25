# Data Sidekick Scripts

This directory contains utility scripts for the Data Sidekick application.

## WOW Calls Import Scripts

### Overview

These scripts are used to import WOW customer service call data from CSV files into the documents table in Supabase. This allows the data to be accessed through the Analysis Panel component in the application.

### Scripts

-   `create_research_view_direct.js` - Creates a research view directly using the service role key
-   `import_wow_calls.js` - Imports the full `wow-calls.csv` file into the documents table
-   `import_wow_calls_test.js` - Test version that imports a smaller sample file
-   `check_data.js` - Verifies documents and data sources in the database
-   `wow_import_guide.md` - Detailed user guide for using these scripts

### Environment Setup

The scripts are configured to use `.env.local` for local development. Make sure your local environment has these variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for admin access
```

### Quick Start

1. Make sure your environment variables are set in `.env.local`

2. Create a research view directly (bypasses RLS restrictions):

    ```
    node scripts/create_research_view_direct.js
    ```

3. Import the data (replace `<research_view_id>` with the ID from step 2):

    ```
    node scripts/import_wow_calls.js <research_view_id>
    ```

4. For testing with a smaller dataset:

    ```
    node scripts/import_wow_calls_test.js <research_view_id>
    ```

5. Verify the imported data:
    ```
    node scripts/check_data.js
    ```

### Key Insights

-   **Row Level Security (RLS)**: Supabase's RLS policies can restrict normal access patterns. Using the service role key bypasses these restrictions.
-   **Service Role Key**: For admin operations like creating research views without user associations, use the service role key.
-   **Sample Files**: Always test with a smaller sample file before processing the entire dataset.
-   **Batch Processing**: The import scripts process records in batches to prevent timeouts and provide progress feedback.

### CSV Format

The scripts expect CSV files with the following fields:

-   Call metadata (Date, CallId, Duration, etc.)
-   Call transcripts (in the CallTranscript or CallTranscript2 field)
-   Additional fields that will be stored as metadata

## Other Scripts

-   `import_transcriptions.js` - Legacy script for importing transcribed recordings into the call_log table
