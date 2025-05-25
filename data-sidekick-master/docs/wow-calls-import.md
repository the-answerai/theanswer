# WOW Calls Import Instructions

This document provides instructions for importing the full WOW calls CSV file into the Supabase database.

## Prerequisites

1. Ensure you have the `wow-calls.csv` file in the `csv` directory of your project
2. Make sure your Supabase credentials are set up in your `.env.local` file:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
3. Ensure you have a valid research view ID to link the imported calls to

## Running the Import

Use the following command to run the import script:

```bash
node scripts/import_wow_calls_test.js <research_view_id>
```

Replace `<research_view_id>` with the ID of the research view you want to link the calls to.

## Import Process Details

The script will:

1. Check if a data source for WOW calls already exists for the specified research view
2. Create a new data source if needed
3. Process the CSV file in batches of 25 records
4. Create document records and metadata entries for each call
5. Log progress and any errors encountered
6. Provide a summary when the import is complete

## Monitoring Progress

The script will output progress information and any errors encountered during the import process. The import may take some time depending on the number of records in the CSV file.

## Troubleshooting

If the script fails:

1. Check the error messages in the console output
2. Verify that your Supabase credentials are correct
3. Make sure the CSV file is in the correct location and format
4. Ensure you have the required permissions to write to the database
5. If the script was interrupted, you can safely run it again - it will skip records that were already imported successfully

## Notes

-   The batch size has been configured to 25 records for optimal performance. Adjust the `BATCH_SIZE` constant in the script if needed.
-   Each call will be imported as a document with its metadata stored in the document_metadata table.
-   The script will automatically create a unique title for each call based on the call ID and date.
