---
description: Document Loaders are used to load documents into the AnswerAI knowledge base.
---

# Document Loaders

## Overview

Document loaders are essential components in the process of building and maintaining a document store or knowledge base. They serve as the bridge between various data sources and your document store, enabling you to ingest and process different types of documents efficiently.

In the context of a document store, document loaders perform several crucial functions:

1. **Data Ingestion**: Document loaders extract content from various file formats and data sources, such as PDFs, Word documents, web pages, databases, and APIs.

2. **Text Extraction**: For non-text formats, document loaders convert the content into machine-readable text, making it suitable for further processing and analysis.

3. **Metadata Extraction**: Many document loaders can extract metadata (e.g., author, creation date, tags) from documents, enriching the information stored in your knowledge base.

4. **Preprocessing**: Some document loaders include basic preprocessing capabilities, such as removing unnecessary formatting or standardizing text encoding.

5. **Chunking**: Advanced document loaders may split large documents into smaller, more manageable chunks, which is particularly useful for efficient storage and retrieval in vector databases.

6. **Format Standardization**: Document loaders help standardize diverse data sources into a consistent format that can be easily processed and stored in your document store.

By utilizing document loaders, you can efficiently populate your document store with a wide variety of content, ensuring that your knowledge base remains comprehensive and up-to-date. This flexibility allows you to incorporate multiple data sources and formats into your AI-powered applications, enhancing their capability to access and utilize diverse information.

## Types of Document Loaders

AnswerAI offers a variety of document loaders to accommodate different data sources:

### File-based Loaders

-   [PDF Files](../sidekick-studio/nodes/document-loaders/pdf-file.md)
-   [CSV File](../sidekick-studio/nodes/document-loaders/csv-file.md)
-   [Text File](../sidekick-studio/nodes/document-loaders/text-file.md)
-   [Docx File](../sidekick-studio/nodes/document-loaders/docx-file.md)
-   [Json File](../sidekick-studio/nodes/document-loaders/json-file.md)
-   [Json Lines File](../sidekick-studio/nodes/document-loaders/json-lines-file.md)

### Web and API-based Loaders

-   [API Loader](../sidekick-studio/nodes/document-loaders/api-loader.md)
-   [Cheerio Web Scraper](../sidekick-studio/nodes/document-loaders/cheerio-web-scraper.md)
-   [Playwright Web Scraper](../sidekick-studio/nodes/document-loaders/playwright-web-scraper.md)
-   [Puppeteer Web Scraper](../sidekick-studio/nodes/document-loaders/puppeteer-web-scraper.md)
-   [SearchApi For Web Search](../sidekick-studio/nodes/document-loaders/searchapi-for-web-search.md)
-   [SerpApi For Web Search](../sidekick-studio/nodes/document-loaders/serpapi-for-web-search.md)

### Third-party Service Loaders

-   [Airtable](../sidekick-studio/nodes/document-loaders/airtable.md)
-   [Confluence](../sidekick-studio/nodes/document-loaders/confluence.md)
-   [Contentful](../sidekick-studio/nodes/document-loaders/contentful.md)
-   [Figma](../sidekick-studio/nodes/document-loaders/figma.md)
-   [Github](../sidekick-studio/nodes/document-loaders/github.md)
-   [Notion Database](../sidekick-studio/nodes/document-loaders/notion-database.md)
-   [Notion Folder](../sidekick-studio/nodes/document-loaders/notion-folder.md)
-   [Notion Page](../sidekick-studio/nodes/document-loaders/notion-page.md)
-   [S3 File Loader](../sidekick-studio/nodes/document-loaders/s3-file-loader.md)

### Specialized Loaders

-   [Apify Website Content Crawler](../sidekick-studio/nodes/document-loaders/apify-website-content-crawler.md)
-   [Custom Document Loader](../sidekick-studio/nodes/document-loaders/custom-document-loader.md)
-   [Document Store](../sidekick-studio/nodes/document-loaders/document-store.md)
-   [Folder with Files](../sidekick-studio/nodes/document-loaders/folder-with-files.md)
-   [GitBook](../sidekick-studio/nodes/document-loaders/gitbook.md)
-   [Unstructured File Loader](../sidekick-studio/nodes/document-loaders/unstructured-file-loader.md)
-   [Unstructured Folder Loader](../sidekick-studio/nodes/document-loaders/unstructured-folder-loader.md)
-   [VectorStore To Document](../sidekick-studio/nodes/document-loaders/vectorstore-to-document.md)
