# Data Sidekick

Data Sidekick is a powerful tool for analyzing and managing customer support calls using AI. It provides automated transcription, intelligent tagging, and analytics capabilities to help improve customer support operations and gain insights from call data.

## Core Features

-   🎙️ **Audio Processing**

    -   Automated call recording downloads from Twilio
    -   Audio format conversion and optimization
    -   High-accuracy transcription using OpenAI Whisper API

-   🏷️ **Intelligent Tagging**

    -   Automated call categorization and tagging
    -   AI-powered tag suggestions
    -   Custom tagging rules and patterns
    -   Batch reprocessing capabilities

-   📊 **Analytics & Reporting**

    -   Comprehensive call analytics dashboard
    -   Tag frequency and trend analysis
    -   Custom report generation
    -   Data export capabilities

-   📄 **Document Processing**

    -   File extraction and analysis using Unstructured
    -   Support for PDFs, Word documents, HTML, and more
    -   Structured data extraction from unstructured content
    -   Document text extraction and processing

-   🔄 **Integration & Automation**
    -   Twilio integration for call handling
    -   Real-time processing pipeline
    -   Supabase database integration
    -   Automated workflow triggers

## Project Structure

```
├── client/                 # React frontend application
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       └── utils/         # Frontend utilities
│
├── src/                    # Backend server
│   ├── config/            # Server configuration
│   ├── controllers/       # Request handlers
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── services/         # Service modules
│   │   └── unstructured/ # Unstructured integration
│   └── utils/            # Backend utilities
│
├── scripts/               # Utility scripts
│   ├── aaiTagging.js     # AI tagging processor
│   ├── convert_audio.js  # Audio conversion utility
│   ├── download_recordings.js # Twilio download utility
│   ├── transcribe_recordings.js # Transcription processor
│   ├── deploy-unstructured.sh # Unstructured deployment script
│   └── db/               # Database management scripts
│
├── uploads/              # Uploaded files for processing
├── supabase/             # Supabase configuration
├── docker-compose.unstructured.yml # Unstructured Docker configuration
└── csv/                  # Data export directory
```

## Development Setup

### Prerequisites

-   Node.js (v18+)
-   pnpm (recommended) or npm
-   Docker Desktop
-   Supabase CLI
-   FFmpeg (for audio processing)

### Environment Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd data-sidekick
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables:

```bash
cp .env.example .env.local    # For local development
cp .env.example .env         # For production
```

Required environment variables:

```
# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_DB_PASSWORD=your_db_password

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WORKSPACE_SID=your_workspace_sid

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key

# Application Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Local Development

The application supports three different environments: Local, Prime, and WOW. Each environment connects to a different Supabase instance.

#### Starting the Application

1. Start the local Supabase instance (for local development only):

```bash
pnpm supabase:start
```

2. Choose your environment and start the development servers:

```bash
# Local Development (uses local Supabase)
pnpm dev

# Prime Environment
pnpm dev:prime

# WOW Environment
pnpm dev:wow
```

The application will be available at:

-   Frontend: <http://localhost:5173>
-   Backend: <http://localhost:3001>
-   Supabase Studio:
    -   Local: <http://localhost:54333>
    -   Prime: <https://app.supabase.com/project/hdldniumfmkpemwyojzl>
    -   WOW: <https://app.supabase.com/project/phzxpcpytanudjiwxkrv>

#### Database Management

Several utility scripts are available for database management:

```bash
# Start local Supabase
pnpm supabase:start

# Stop local Supabase
pnpm supabase:stop

# Reset local database
pnpm supabase:reset

# Setup local database
pnpm db:local:setup

# Sync data from Prime environment
pnpm sync:prime

# Sync data from WOW environment
pnpm sync:wow
```

Note: When syncing data, make sure to use the correct environment command (`sync:prime` or `sync:wow`) depending on which environment you want to sync from.

### Processing Scripts

The project includes several utility scripts for processing:

```bash
# Download call recordings
node scripts/download_recordings.js

# Convert audio files
node scripts/convert_audio.js

# Transcribe recordings
node scripts/transcribe_recordings.js

# Process AI tagging
node scripts/aaiTagging.js

# Reprocess existing tags
node scripts/reprocess_tags.js
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Unstructured Integration

Data Sidekick integrates with [Unstructured](https://github.com/Unstructured-IO/unstructured), an open-source library for extracting structured content from unstructured documents like PDFs, Word documents, HTML, and more.

### What is Unstructured?

Unstructured provides tools for:

-   Extracting structured data from documents (PDFs, DOCx, TXT, HTML, etc.)
-   Partitioning documents into meaningful chunks
-   Processing and cleaning document data for use in ML/AI applications
-   Converting unstructured content into structured formats for analysis

### Setup and Usage

#### Docker Container Configuration

The application uses Docker to run Unstructured as a service:

```bash
# Start the Unstructured container
pnpm unstructured:start

# Stop the Unstructured container
pnpm unstructured:stop

# Check if the container is running
pnpm unstructured:status

# Run tests with specific environment configurations
pnpm test:unstructured         # Default environment
pnpm test:unstructured:local   # Local environment
pnpm test:unstructured:prime   # Prime environment
pnpm test:unstructured:wow     # WOW environment
```

The Docker container configuration is defined in `docker-compose.unstructured.yml`:

```yaml
version: '3.8'

services:
    unstructured:
        image: downloads.unstructured.io/unstructured-io/unstructured:latest
        container_name: unstructured-api
        ports:
            - '8000:8000'
        volumes:
            - ./uploads:/app/uploads
        environment:
            - UNSTRUCTURED_API_KEY=${UNSTRUCTURED_API_KEY:-}
        command: tail -f /dev/null
        restart: unless-stopped
        networks:
            - unstructured-network

networks:
    unstructured-network:
        name: unstructured-network
```

#### Using Unstructured in Your Code

The application provides a service module in `src/services/unstructured/index.js` to interact with Unstructured:

```javascript
import unstructuredService from '../services/unstructured/index.js'

// Process a file and get structured elements
const elements = await unstructuredService.processFile('/path/to/file.pdf')

// Extract text from a file
const text = await unstructuredService.extractText('/path/to/file.pdf')

// Check if the Unstructured container is available
const isAvailable = await unstructuredService.checkApiStatus()
```

#### How It Works

1. The service runs Unstructured in a Docker container
2. Files to be processed are copied into the container
3. A Python script is dynamically generated and executed in the container
4. The results are returned as structured JSON data
5. The service handles parsing and formatting the results

#### Testing

A test script is provided to verify the Unstructured integration:

```bash
node test-unstructured-integration.js
```

This script:

1. Checks if the container is running
2. Creates a sample text file
3. Processes the file using Unstructured
4. Extracts structured elements and text
5. Outputs the results

#### Deployment

For production deployment, a script is provided at `scripts/deploy-unstructured.sh` that:

1. Pulls the latest Unstructured Docker image
2. Starts the container with the proper configuration
3. Verifies the container is running properly

#### Environment Variables

The Unstructured integration uses the following environment variables:

```
# .env.local or appropriate environment file
UNSTRUCTURED_API_URL=http://localhost:8000/general/v0/general
UNSTRUCTURED_API_KEY=your_api_key_if_needed
```

### Troubleshooting

**Container won't start or keeps restarting**

-   Check Docker logs: `docker logs unstructured-api`
-   Ensure ports are not in use
-   Verify Docker has sufficient resources

**Processing errors**

-   Ensure the file format is supported by Unstructured
-   Check file permissions
-   Verify the uploads directory exists and is writable

### Further Resources

-   [Unstructured Documentation](https://docs.unstructured.io/)
-   [Unstructured GitHub Repository](https://github.com/Unstructured-IO/unstructured)
-   [Supported File Types](https://docs.unstructured.io/open-source/supported-file-types)
