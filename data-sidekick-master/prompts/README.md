# Data Sidekick Prompts

This directory contains the system prompts used throughout the Data Sidekick application. Each prompt serves a specific purpose in the application's AI-powered analysis pipeline.

## Prompt Files

### 1. call_analysis.prompt

Used for analyzing individual call transcripts. This prompt generates a comprehensive analysis including:

-   Call summary
-   Coaching advice
-   Call type classification
-   Sentiment scoring
-   Resolution status
-   Escalation status
-   Relevant tags

### 2. tag_classification.prompt

Specialized prompt for classifying calls into predefined categories and subcategories. This prompt:

-   Uses a hierarchical tagging system
-   Supports multiple tag assignments
-   Includes specific rules for tag application
-   Provides examples for consistent classification

### 3. multi_task_tagging.prompt

A combined analysis prompt that performs multiple tasks in one pass:

-   Tag classification
-   Sentiment analysis
-   Resolution status determination
-   Escalation detection

### 4. report_generation.prompt

Used for generating comprehensive analytical reports from call data. The prompt:

-   Creates executive summaries
-   Identifies trends and patterns
-   Highlights areas of excellence
-   Suggests improvements
-   Provides actionable recommendations
-   References specific call examples

## Usage

These prompts are used by various components of the application and should be modified with care. When making changes:

1. Ensure the expected output format remains consistent
2. Test any changes thoroughly
3. Keep the prompts focused and specific to their intended use case
4. Maintain clear examples where provided
