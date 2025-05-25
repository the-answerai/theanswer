# Transcription Analysis Scripts

This directory contains scripts for importing and analyzing call transcriptions.

## analyze_transcriptions.js

This script reads transcribed documents from the database, calls AnswerAI to analyze each transcript, and updates both the `call_log` table and `document_metadata` table with the analysis results.

### Prerequisites

-   Node.js 16+
-   Supabase project with appropriate tables
-   AnswerAI endpoint configured

### Environment Variables

Create or update your environment file (`.env.local`, `.env.prime`, or `.env.wow`) with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANSWERAI_ENDPOINT=your_answerai_endpoint
ANSWERAI_ANALYSIS_CHATFLOW=your_analysis_chatflow_id
```

### Usage

#### Using the Node.js Script Directly

```bash
# Using default .env.local
node analyze_transcriptions.js <research_view_id> <data_source_id> [example_json_path]

# Using a specific environment file
ENV_FILE=.env.prime node analyze_transcriptions.js <research_view_id> <data_source_id> [example_json_path]
```

#### Using the Helper Shell Script

For convenience, you can use the provided shell script to run the analysis with different environments:

```bash
./analyze-transcriptions.sh [local|prime|wow] <research_view_id> <data_source_id> [example_json_path]
```

Examples:

```bash
# Analyze documents in the local environment
./analyze-transcriptions.sh local 123e4567-e89b-12d3-a456-426614174000 987e6543-e21b-12d3-a456-426614174000

# Analyze documents in the prime environment with a custom example schema
./analyze-transcriptions.sh prime 123e4567-e89b-12d3-a456-426614174000 987e6543-e21b-12d3-a456-426614174000 ./example-analysis-schema.json
```

### Parameters

-   `research_view_id`: The ID of the research view
-   `data_source_id`: The ID of the data source containing the documents to analyze
-   `example_json_path` (optional): Path to a JSON file containing an example schema for AnswerAI

### Example

```bash
# Analyze documents with default settings
node analyze_transcriptions.js 123e4567-e89b-12d3-a456-426614174000 987e6543-e21b-12d3-a456-426614174000

# Analyze documents with a custom example schema
node analyze_transcriptions.js 123e4567-e89b-12d3-a456-426614174000 987e6543-e21b-12d3-a456-426614174000 ./example-analysis-schema.json

# Using WOW environment
ENV_FILE=.env.wow node analyze_transcriptions.js 123e4567-e89b-12d3-a456-426614174000 987e6543-e21b-12d3-a456-426614174000
```

### How It Works

1. The script fetches documents from the database that match the specified research view ID and data source ID, and have a status of "processed".
2. For each document, it:
    - Retrieves the recording URL from metadata if available
    - Calls AnswerAI to analyze the transcript
    - Updates the call_log table with the analysis results
    - Updates the document_metadata table with the same analysis results
    - Marks the document as "analyzed"
3. Documents are processed in batches to avoid overwhelming the database or AnswerAI.

### Example JSON Schema

You can provide an example JSON schema to guide AnswerAI's analysis. Here's a sample schema:

```json
{
    "summary": "Brief summary of the call content and key points discussed.",
    "coaching": "Feedback and coaching suggestions for the call handler.",
    "tags": ["customer service", "billing", "technical issue", "resolved"],
    "sentiment_score": 0.75,
    "resolution_status": "resolved",
    "escalated": false,
    "call_type": "support",
    "persona": "technical"
}
```

## Other Scripts

-   `import_transcriptions.js`: Imports transcriptions from a CSV file and analyzes them using AnswerAI
-   `import_wow_calls.js`: Imports WOW call data from a CSV file into the documents and document_metadata tables
