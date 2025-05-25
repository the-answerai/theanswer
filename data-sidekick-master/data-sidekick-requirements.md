Product Requirements Document: AI-Powered Research Web Application

1. Overview & Objectives

Purpose: Build an AI-driven research web application that helps users ingest, organize, and analyze data from multiple sources (starting with website content first, then expanding to other sources). The platform will streamline gathering information, extracting insights with AI, and compiling findings into reports.

Key Features:
• Integration with websites as data sources (initial focus), allowing users to pull content from specific sites or pages.
• Automatic metadata extraction for all ingested documents (e.g. titles, dates, word counts, etc.).
• AI-powered analysis tools: semantic search, summarization, classification, and report generation.
• Support for large documents and multimedia (text, audio, video) by using transcription and chunking techniques.
• Two-tier categorization system (AI-driven suggestions + manual taxonomy tagging).
• Iterative research “views” that can be saved and refined over time.
• Built-in cost estimation for AI usage (token-based billing insights).

Objectives:

1.  Efficient Data Ingestion – Enable users to quickly import content (starting with websites) and update that content on demand.
2.  Rich Metadata & Organization – Store detailed metadata and allow custom metadata extraction to organize documents effectively.
3.  Powerful Search & Analysis – Provide semantic search across large documents via a vector database and integrate AI for deeper analysis (including external web info).
4.  User Control & Flexibility – Allow manual overrides (like categorization and refresh) so users remain in control of their data and can guide AI outputs.
5.  Scalable Architecture – Design a backend that can handle intensive AI tasks asynchronously, ensuring a responsive UI.
6.  Clear Reporting & Iteration – Produce structured research reports and allow users to iteratively refine them, saving different versions.
7.  Cost Transparency – Incorporate a token usage tracker to estimate costs, promoting efficient use of AI resources.

Workflow Summary: Users will create a Research View (a project space for a specific research topic). They will add data sources (initially by specifying websites or web pages to include), then the system will fetch and store the content and metadata in a database. Users can then explore the data via a table UI, apply filters, and initiate AI analyses like summarizing documents or querying for insights. The application uses AI models (through AnswerAI API) for tasks such as metadata extraction, document search, and generating findings. Users can manually refresh data sources to fetch new content (e.g. if a website has new articles) and can categorize information either manually or with AI assistance. Finally, they compile and refine results into reports, which can be saved as new views or exported. The design emphasizes an intuitive flow from data ingestion to insight generation, with the AI doing heavy lifting but the user steering the process.

2. User Flow & Experience

Research Views & Data Source Selection: Users begin by creating a Research View (a focused project or topic). Within a view, they can add one or multiple data sources. For the initial version, data sources are websites:
• The user provides a website URL or domain. They can specify filters like a date range (e.g. only pages or posts from 2020-2021) and specific paths/folders on the site (e.g. only content under example.com/blog/finance/).
• The system will crawl or fetch pages from the specified site according to these parameters, retrieving all relevant pages for analysis. (Future iterations will add other source types like PDF documents, cloud drives, etc., but website integration is prioritized first.)

Subsections and Filtering: When adding a website source, users can refine what to include:
• Time Range – e.g. only include articles published between certain dates. The UI will allow input of start and end dates to filter content.
• Folders/Subfolders – e.g. include only specific sections of the site. Users might enter sub-paths or select from discovered site map sections to focus on relevant content (for instance, only a specific blog category or forum section).
• These filters help users narrow the scope of data ingested so it’s relevant to their research question.

Manual Refresh & Reload: After initial ingestion, the content from a website might become outdated as new pages are added or existing ones change. The application provides:
• A Refresh Data Source button for each source, allowing users to manually trigger the system to fetch any new or updated content from that source. This checks the website for new pages in the specified folders or new posts in the date range since last fetch.
• A Reload/Rescan option for cases where the user modifies the filters (e.g. changes the date range or adds a new subsection) or if a previous fetch failed. This ensures the user can always pull in the latest information on-demand.
• Note: In future versions, we might support scheduled auto-refresh (e.g. daily crawl), but initially user-initiated refresh is the safest approach to give users control and avoid excessive crawling.

User Experience Considerations:
• Adding a data source is done through a guided modal or form, prompting for URL and optional filters, to simplify the process.
• While a source is being fetched (which might take time if it’s a large site), the UI should indicate progress (e.g. a spinner or “Fetching content…” status). The user can continue using other parts of the app while this background job runs.
• Once data is fetched, the content appears in a Documents Table within that Research View, showing each fetched page/document as a row (with columns for metadata like title, date, etc. as described below).
• The overall flow: Create view -> Add source -> Fetch -> View data in table -> Analyze/search -> Iterate.

3. Metadata Extraction & Storage

Default Metadata Collection: For each document fetched (e.g. each web page), the system automatically extracts and stores key metadata attributes in a Supabase database. Default metadata includes:
• Document ID – a unique identifier for internal reference.
• Source – the origin of the document (e.g. the website URL or domain).
• URL or Filename – the link to the web page (for websites) or file name (for other data sources in the future).
• Title – the title of the page or document (e.g. the <title> of an HTML page, or document title if available).
• Author (if applicable) – for websites, if the page has an author or byline, capture it.
• Publication/Modified Date – the date the content was published or last updated (for web pages, from metadata or page content if available).
• Content Summary (Brief) – possibly a first few lines or autogenerated short summary of the content for quick reference.
• Token Count / Word Count – size of the content in terms of tokens (for AI processing) or words, useful to estimate processing cost and search performance.
• File Type – type of content (HTML page, PDF, audio file, etc. – though initial phase is mostly HTML/text from websites).
• Status – ingestion status (e.g. successfully fetched, pending, error).

All this metadata is stored in a Supabase Postgres database in a Documents table (or similar), with columns corresponding to the above. Supabase is chosen as it provides easy integration, real-time capabilities, and can later incorporate vector search via extensions if needed. Storing metadata in a structured way allows users to filter and sort documents easily in the UI (e.g. sort by date, filter by author, etc.).

Full Content Storage: The actual content of each document (the text of the web page, transcript of an audio, etc.) will also be stored for analysis. Depending on size, content can be stored in the database (text column) or in an associated storage (like Supabase storage or S3) with a reference in the DB. This ensures AI analysis can retrieve the full text when needed. Large content may be split for vector indexing (see Section 4), but the raw content is preserved in original form as well.

Custom Metadata Columns (AI-augmented): The application allows users to define additional metadata fields to be filled by AI:
• Users can “Add Column” in the documents table for a specific research view. When adding, they choose either a predefined prompt or enter a custom AI prompt that tells the AI what to extract or compute for each document.
• Predefined Metadata Prompts: The app will offer a set of common extractions. For example: “Summary” (a one-paragraph summary of the document), “Key Topics” (a list of main topics or keywords), “Sentiment” (overall sentiment or tone of the document), “Important Names/Entities” (people, organizations mentioned), etc. Selecting one of these will populate a new column (e.g. “Summary”) and the system will use the AnswerAI API to generate that for each document.
• Custom Prompt Column: The user can input any question or instruction, such as “What is the main argument of this article?” or “Extract any statistics or numbers mentioned.” This prompt will be run on each document, and the result will be stored in the new column for that document.
• The AI processing for these columns is done asynchronously (especially if many documents). When initiated, a job is queued to process each document with the given prompt. As results come in, they populate the table. The UI should indicate which ones are complete or if any failed.
• The new metadata is also saved in the database (likely a separate table or JSONB field referencing the document, or adding a dynamic column via Supabase if schema allows). Each research view could have its own context for custom columns.

Data Model Considerations:
• A possible schema: Tables for ResearchViews, Documents, MetadataFields (for custom columns definitions), and MetadataValues (document ID x field ID -> value).
• Supabase’s real-time feature can notify the frontend as metadata extraction jobs fill in values, so the table updates live for the user, enhancing UX.
• Ensure the metadata extraction uses token limits wisely (e.g. if a document is very large, use the vector search or summarization in parts rather than feed the whole doc at once to the model for a summary).
• The system should also track when each metadata field was last updated for a document (so if content changes or prompt changes, user can refresh that field for a doc as needed).

4. Document Processing & Search

Handling Large Documents: Some web pages or documents might be very large (or transcripts of hour-long videos can be tens of thousands of words). To enable efficient search and analysis:
• The system will chunk large documents into smaller pieces. For example, split the text into chunks of up to ~500 tokens (or another optimal size, such as splitting by paragraphs or subheadings while respecting a token limit) with some overlap between chunks to preserve context.
• Each chunk will be embedded as a vector (using an embedding model via the AnswerAI API, likely using OpenAI embeddings or similar) and stored in a Vector Database. We can use Supabase’s PostgreSQL with the PGVector extension (since we are already using Supabase) or an external vector store (like Pinecone or Weaviate) if needed. The vector DB will allow similarity search to quickly find relevant chunks of text in response to queries.
• By storing embeddings, the application can perform semantic search: the user’s query or prompt can be converted to a vector and compared with all document chunk vectors to retrieve the most relevant pieces regardless of exact keyword match.
• The vector index storage will include references back to the source document and chunk position, so we can always retrieve the full context or highlight where in the document a result came from.

Efficient Search Mechanism: When a user searches within their research view (either via a search bar to find documents or as part of an AI prompt):
• If the dataset is small and documents are short, a simple full-text search on the content can be done directly in the database (Supabase full-text search) for keywords.
• If the dataset is large or user asks a semantic question (not just exact keywords), the system will use the vector similarity search. For example, if user asks “What are the key findings about climate change mentioned?” the app will:

1.  Embed the query using the same embedding model.
2.  Query the vector DB for top N most similar chunks across all documents.
3.  Fetch those chunks and possibly the metadata (like document titles).
4.  Feed them into the AnswerAI model to synthesize an answer or highlight those relevant parts to the user.
    • This approach ensures even if wording differs, relevant content can be found. It’s a best practice for Retrieval-Augmented Generation, where the AI uses retrieved data to answer questions.

Audio/Video Processing: The application supports uploading or linking audio and video files for analysis (though these might come in future phases after websites). When such a file is added as a data source:
• The backend uses an AI transcription service (via AnswerAI API, possibly using models like OpenAI Whisper or others) to convert speech to text. For video, it may extract audio first then transcribe.
• The transcription text is stored as the content of a document in the database (with metadata like duration, possibly speaker info if available).
• That text can then be chunked and indexed just like any text document for search and analysis.
• Metadata for media files will include things like duration, file size, etc., and possibly a link to the original file (if stored).
• If the media is very long, the transcription itself may be segmented (some transcription models segment by time). We ensure to handle assembling or chunking the transcript properly for indexing.
• This allows users to include podcasts, interviews, webinars, etc., as part of their research data sources, all converted to text for uniform analysis.

Taxonomy Categorization (Two-Layer Approach): Organizing documents by topics or categories is crucial for research. The app provides a two-layer categorization system combining AI and user input:
• Layer 1: AI-Driven Categorization – The system can automatically classify documents into broad categories or topics using AI. For example, it could label each document with topics like “Finance”, “Health”, “Politics”, etc., based on content. This could be done with a classification model or by using the embedding to cluster documents and label clusters. The categories could be generic or even custom if the user provides a taxonomy. If the user has no custom taxonomy, the AI might still suggest some thematic labels for each doc.
• Layer 2: Manual (User) Categorization – Users can define their own taxonomy: e.g., they may create categories or tags relevant to their project (like “Climate Change”, “Renewable Energy”, “Policy Review”, etc.). They can then manually assign documents to one or multiple of these categories or tags.
• The UI will allow users to tag a document or move it into a category folder within the research view. This manual layer ensures user-defined organization and corrections (for example, if AI categorization is wrong, the user can change it).
• Two-Layer Integration: These layers work in tandem. The AI’s suggestions can be presented to the user (like a recommended tag or category for a document). The user can accept these suggestions or adjust them. In essence, AI does an initial pass to help sort content, and the user refines it. We maintain separate fields for AI category and final category so we know which is which.
• Example: AI might tag an article as “Technology > AI” based on its content (two-level: main category Technology, subcategory AI). The user’s defined taxonomy might have a category “Emerging Tech” which overlaps. The user can then decide to tag it as “Emerging Tech” manually. The system could also learn from this feedback to improve future suggestions (future enhancement).
• All category information is stored (e.g. a Category or Tags table, linking documents to categories). This then allows filtering the documents by category in the UI or including categories in the metadata display.

Search & Filter by Category: With taxonomy in place, the search interface will allow filtering results by these categories (e.g. only search within “Renewable Energy” tagged docs). This further improves the relevance of analysis when users want to focus on a subset of data.

In summary, the document processing component ensures that all forms of content (text or media) are converted into a searchable text format, indexed for quick retrieval, and classified for organization. This lays the groundwork for the AI analysis features that follow.

5. Web Search & AI Analysis

Beyond just searching the user’s ingested data, the application leverages AI to analyze documents and even find external information:

AI-Driven Document Analysis (Prompts): Users can ask questions or request analyses of their data using natural language prompts. There will be two modes for this:
• Predefined Analysis Prompts: Quick actions like “Summarize this document”, “List key takeaways”, “What are the pros and cons discussed?”, “Identify any open questions or missing information.” These could appear as buttons or menu options when viewing a document or selecting multiple documents. Choosing one runs the corresponding prompt on the selected content via the AnswerAI API and returns the result (e.g. a summary).
• Freeform Prompt: A text input (like a chat box or query bar) where the user can type any question or command, such as “Compare the viewpoints of all these articles on climate policy” or “Find any conflicting facts between Document A and Document B.” The user can specify scope if needed (all documents, a subset, or a single doc context).
• The system will interpret the prompt and decide how to answer. For a single-document prompt (like summarizing one article), it’s straightforward: feed that document (or its relevant chunks) to the LLM with the instruction. For a multi-document query (like comparative questions or broad topics), the system may perform a search across the document set (using the vector search described) to find relevant info from each, then combine them in the prompt to the LLM to synthesize an answer.
• Results are displayed either in a modal or in a dedicated “AI Analysis” panel. The answer might include direct answers, aggregated information, or even citations/reference to document titles or sections if possible to increase trust.

Incorporating Whole Web Search: Sometimes the user’s dataset might not have all the information needed. The app provides an option to search the entire web to complement the research:
• Users can toggle or choose to “Include Web Search” for a given prompt. When enabled, the application will use an external search API (e.g. call a search engine API like Bing Web Search or Google API) with the user’s query or a derived query.
• The top results from the web can be fetched (if accessible via scraping or API) and then processed similarly by the AI. For example, if the user asks a question that their documents can’t answer fully, the system might fetch a few relevant web pages or Wikipedia entries, then have the AI integrate that information into the answer.
• The UI should clearly indicate when external information is used (to differentiate between the user’s own sources vs. external knowledge). Perhaps by listing external sources or footnotes in the answer.
• This feature essentially turns the app into a research assistant that not only analyzes the provided documents but also can discover new information live from the internet to ensure comprehensive answers.
• Use Case: The user is researching “electric vehicle adoption in Europe” and has some reports ingested. They ask a question that isn’t fully covered in those reports, like “What were the EV adoption rates in 2022 in Germany?”. The app doesn’t find it in the documents, so it web-searches, finds a statistic on a relevant website, and presents the answer including that stat, possibly citing the source.

Combined Workflow: The user might use a mix of these features in one session. They could filter documents to a category, then ask a freeform question about that subset, then decide to include web search to get more context, and then ask the AI to summarize everything found. The system should handle these smoothly:
• The prompt interface could allow selecting context (all data, current filtered data, a single doc).
• A checkbox or toggle for “search outside my data” which triggers the web search integration.

Performance Considerations:
• Because AI analysis (especially with web search) can be slow, these operations should also be handled asynchronously where possible. The UI might show a “Thinking…” indicator and then display the answer when ready.
• If multiple analyses are running (or user queues up questions), those should also go through the job queue on the backend to avoid blocking the server (see Backend section).
• It’s important to limit how much web content is pulled (maybe fetch top 3 results or so) to avoid excessive calls and cost. The PRD should note rate limiting or user usage limits for web searches if needed.

In summary, the AI Analysis feature is the core intelligence of the app: it leverages both the user’s curated dataset and the vast knowledge on the web to answer complex questions and provide insights, functioning like an AI research assistant. The user is empowered to ask anything and receive synthesized answers with context from both their data and external sources.

6. Billing Mechanism

Since the application uses AI APIs (via AnswerAI) which likely incur costs per token or per request, a transparent billing and usage mechanism is required:

Token Usage Tracking: Every time the system calls an AI service (for embedding, summarization, answering a prompt, etc.), it involves input tokens (tokens in the prompt + context) and output tokens (tokens in the response). The application will:
• Keep track of the number of tokens used for each operation. For example, if summarizing a document used 1500 input tokens and produced a 200-token summary, total 1700 tokens.
• Use known pricing rates (e.g. $0.00X per 1K tokens for the chosen model) to estimate the cost of that operation.
• Maintain a running total per user (or per research view) of tokens used and associated cost. This could be stored in a Usage table in Supabase, logging each action’s token count and timestamp.

Cost Estimation and Display:
• After an AI operation completes, the UI can show a small note like “Tokens used: 1,700 (~$0.0034)” for that action. This immediate feedback educates the user about the cost.
• There could be a Usage Dashboard or section in account settings where users can see their cumulative token usage and estimated charges over the billing period. This might include breakdowns by type of operation (embedding, QA, summarization) and by research view, helping them understand which activities cost the most.
• If the app has a pricing model (e.g. free tier with certain token limit, then pay-as-you-go), this system would enforce those limits. For example, warn or prevent new queries if the user exceeds their quota, or prompt to upgrade.

Billing Model Integration:
• In addition to just tracking, the PRD can plan for how actual billing is done. Perhaps integrate with Stripe or other billing provider if charging real money. However, at MVP it might suffice to track and display usage, without actual payments, just to validate the cost structure.
• Eventually, define plans: e.g. X tokens included per month, or charge per token usage. The mechanism here will ensure we can capture usage data needed to bill accurately.

Optimize to Reduce Cost:
• The design should encourage efficient use of tokens. For example, chunking and vector search means we send only relevant chunks to the LLM instead of entire documents, saving tokens.
• Reusing embeddings: store them so we don’t re-embed the same text repeatedly (e.g. if a user runs multiple queries on the same data, the embeddings are done once upfront).
• Perhaps allow users to choose a lower-cost model for certain tasks if appropriate (like use a smaller model for basic metadata extraction vs a larger model for complex Q&A).
• The PRD should note these as best practices to minimize unnecessary token consumption, which benefits both the user and the platform cost.

Accuracy of Estimation:
• Rely on the API’s response which often includes token counts (for OpenAI, the response returns usage info). Use that for precise logging.
• Since AnswerAI might abstract the actual model, ensure AnswerAI API returns or can be queried for token usage per request to log accurately.
• If AnswerAI does not provide exact tokens, we might estimate based on input size and output length, but exact is preferred.

By implementing a billing/usage mechanism from the start, users will trust the platform as they can see how the AI usage translates to cost. It also lays the groundwork for monetization of the app in a fair and transparent way.

7. Report Generation

A core outcome of research is the ability to compile findings into a coherent report. The application will assist in generating and refining reports using AI:

AI-Generated Draft Reports:
• Users can initiate a “Generate Report” action for a research view (or for a selection of documents). This will prompt the AnswerAI to create a structured report of the findings.
• The report might include an Introduction, Summary of Key Points, Detailed Findings per sub-topic, and Conclusion/Recommendations. We can instruct the AI on a template or desired structure so the output is well-organized (e.g. using markdown headings for sections).
• The content of the report is drawn from the analyzed data. For example, it may summarize each category of documents, highlight important insights, and even cite which documents these insights came from (if we program the prompt to do so, e.g., “According to [Document Title]…”).
• The result is a markdown-formatted text. Using markdown allows formatting like headings, bullet points, numbered lists, bold/italics, and even tables or blockquotes for references.

Markdown-to-React Editor (MC React):
• The generated report will be loaded into a markdown editor component on the frontend. This allows the content to be rendered nicely (with formatting) and also be editable by the user.
• MC React (which likely stands for a specific Markdown Editor in React) will let users tweak the AI-generated report. Users can correct inaccuracies, add their own commentary, or restructure as they see fit.
• The editor should support at least basic editing features and possibly have a preview mode. If MC React is not performing well with very large text, we might consider alternative markdown editors (ensuring we can handle potentially long reports).

Iterative Refinement & Multiple Views:
• The first AI-generated report might be a draft. Users can refine their research further: maybe ask additional AI questions or incorporate more sources, then generate a new report or update the existing one.
• To facilitate this, the application can allow saving reports as separate versions or views. For example, after the first report, the user might save it as “Initial Findings”. Then they do more analysis and generate another report, saving it as “Detailed Analysis”. They can either compare or simply keep them as milestones.
• Each saved report is tied to the research view but is a distinct object (e.g. stored in a Reports table with a reference to the research view and maybe a timestamp or version number).
• The UI might list saved reports for a project, and the user can open any of them in the editor. This encourages an iterative approach: research is rarely one-and-done, so users can revisit and refine their outputs.

Report Content and Structure:
• The PRD should ensure the AI report includes clear structure. Possibly default sections:
• Overview: high-level summary of what was analyzed and main conclusion.
• Methodology (optional): how the info was gathered (the sources used, possibly auto-generated list of data sources).
• Findings: could be broken down by themes or questions that were answered.
• Details/Evidence: maybe bullet points or sub-sections containing supporting facts or quotes from documents.
• Conclusion: wrap-up of insights or recommendations.
• We can let the user specify what kind of report they want as well (maybe choose “Summary Report” vs “Detailed Report”, or provide a custom prompt like “Generate a report focusing on comparing X and Y”).
• The AI needs to stay within the data the user has or clearly indicate when an insight is from external web info. If citing, perhaps it can cite by document title or a short identifier rather than external links (since the audience is the user themselves, they can cross-check with their data table).

Exporting:
• Though not explicitly asked, likely users will want to export the report (as PDF, Word, or at least copy the markdown). The PRD can mention that as a desirable capability: e.g. “The user can download the report as a markdown file or PDF for sharing.”
• We should ensure the formatting remains intact on export. Perhaps integrating a library for MD to PDF conversion or instruct user to copy.

All in all, the report generation feature turns the collected data and AI analyses into a tangible deliverable. It saves users time by giving a strong starting draft that they can then polish, rather than writing a report from scratch. The iterative saving of reports ensures their research progress is documented at each stage.

8. Frontend & UI Considerations

The user interface will be web-based (React likely), designed for clarity and performance, especially given the potentially large amount of data (many documents, long transcripts, etc.):

Technology & Framework:
• We will use Material UI (MUI) for the frontend component library to quickly build a consistent, responsive interface. MUI provides a robust grid system, form elements, modals, etc., and a default modern theme that can be customized.
• However, for certain components like tables that handle large data sets, default Material UI components might be slow. We will consider optimized solutions (either using MUI’s own virtualization features or alternative libraries) to maintain performance with potentially thousands of rows.

Documents Table with Infinite Scrolling:
• The central view inside a Research View is a table listing all documents (from all data sources added to that view, or filtered by source). This table will display columns for the metadata (as discussed in Section 3).
• Instead of traditional pagination, we plan to implement infinite scroll or virtualized scrolling for this table. This means as the user scrolls down, more rows load dynamically. This approach makes the UI feel seamless and handles large lists without memory issues by only rendering visible rows.
• If using Material UI, we could use the MUI DataGrid component which has a built-in virtualization for large data sets (especially in the Pro version). Alternatively, use react-window or react-virtualized for a custom table.
• Each row can have an expand/collapse to show the full content snippet or additional details if needed (like a preview of the document’s content, maybe first few lines, when clicked).

Filtering and Sorting:
• Above the table or as part of it, include filters: e.g. a search bar to filter by keyword in title, date range picker to filter by date, dropdown to filter by category or source.
• Material UI’s components like Autocomplete could be used for filtering tags or categories. Date picker for date filters.
• Sorting by columns (click column header to sort by date, title, etc.) should be enabled. If the data is too large to sort on frontend, sorting can be done via querying the backend (Supabase can handle sort in query).
• These filters should work in conjunction with the infinite scroll (i.e., when a filter is applied, reset the scroll and load filtered results).

Research View and Navigation:
• The app likely has a sidebar or a top menu listing the user’s Research Views (projects). They can switch between views or create a new one.
• Within a view, perhaps use a tab or section for “Documents”, “Analysis”, and “Reports”:
• Documents Tab: shows the data table and options to add sources, refresh, categorize, etc.
• Analysis Tab: could present the AI prompt interface (or this can be integrated in Documents view as well). Possibly where freeform queries and results are shown, maybe as a chat-like history.
• Reports Tab: lists saved reports and allows creating a new report from analysis.
• Alternatively, the analysis interface might be overlaid or in a sidebar, rather than a separate tab, to allow viewing documents and asking questions side by side. The exact UX can be refined in design phase, but we note that context should be easily accessible when analyzing (e.g., user might want to click a document from results to read full content).

Material UI Optimization:
• We will use Material UI for rapid development, but keep an eye on performance. This may involve:
• Using shouldComponentUpdate or memoization for components to avoid re-rendering the entire list when data updates (especially as real-time updates come in for metadata or categories).
• If needed, using the lighter-weight core of Material UI (e.g. just styling and minimal components) and implementing some custom solutions for heavy parts.
• Evaluate moving to a more performance-optimized UI library or grid if MUI proves slow with a lot of DOM nodes.
• Also consider load times: splitting code (lazy loading components for heavy features like the markdown editor or large dataset components so initial load is fast).

Markdown Report Editor UI:
• The report editor should be a large text area occupying most of the screen when in use, so the user can focus on it. It might be full-screen or in a panel.
• Show a preview mode (rendered markdown) and edit mode. Possibly side-by-side or toggle. This helps users see the formatted output as it would appear.
• Support basic controls (bold, italic, bullet list, etc.) via either buttons or keyboard shortcuts, to make editing easier for those not familiar with Markdown syntax.

Responsive Design:
• The application will be primarily desktop-focused (research tasks are easier on a larger screen), but we will ensure the layout is responsive to at least be usable on a tablet. On mobile, due to complexity, it might be read-only or limited functionality (not a priority, but using MUI’s responsive grid and flexbox will help).
• Keep modals and panels within screen bounds, and tables should scroll within their container on smaller screens.

Feedback & Notifications:
• Provide visual feedback for background operations: e.g. when a job is queued (like fetching a website or running an AI analysis), show a small notification or status indicator (maybe an icon or message in a corner, or an entry in a “notifications” list) so the user knows it’s in progress.
• When a job completes, e.g. “New documents fetched from [source]” or “Report generation complete”, show a notification toast. This ties into the backend’s ability to notify (discussed in the Backend section).
• If an error occurs (e.g. failed to fetch a site or AI prompt failed), show an error message with details and guidance (like “Fetching failed: 404 not found” or “AI analysis failed: exceeded token limit; try a shorter prompt or smaller scope”).

By focusing on a clean, data-centric UI with good performance practices, the front end will handle complex data without overwhelming the user. Material UI will speed up development, but we remain open to optimizations or custom components for heavy data views.

9. Backend Architecture

The backend of the application will be the workhorse that handles data ingestion, AI processing via AnswerAI, and orchestrates the various tasks. Key aspects:

Node.js Server:
• The backend will be built with Node.js (using a framework like Express or NestJS for structured development). Node is chosen for its JavaScript consistency with the frontend and robust ecosystem (and possibly because AnswerAI API usage via HTTP fits well).
• It will expose RESTful APIs (or GraphQL) for the frontend to perform actions: create research view, add data source, get documents, initiate analysis, etc. Many of these endpoints will not produce an immediate final result but rather trigger background processing.

Queuing Mechanism:
• A Job Queue system will be implemented to handle long-running or resource-intensive tasks asynchronously. This prevents blocking the main Node event loop and allows scaling workers if needed.
• Likely use a library like BullMQ (Redis-backed) or RabbitMQ/Cloud task queues. For simplicity and reliability, something like Bull (with Redis) can manage job scheduling, retries, and status tracking.
• Types of jobs that will go through the queue:
• Website crawl/fetch job (for each data source added or on refresh).
• Document processing jobs (e.g. chunking and embedding a large document).
• Metadata extraction jobs (for custom AI prompt columns, potentially one job per document or batched per view).
• AI analysis jobs (like generating a report or answering a question, though these might also be handled in real-time if quick, but heavy ones can be queued).
• Transcription jobs (audio/video to text).
• Each job will have associated data (e.g. which research view, source, or document it pertains to) and once finished, will update the database with results.

Notification & Real-time Updates:
• The backend will send updates to the client when jobs complete. There are a couple of approaches:
• Polling: The frontend could periodically poll an API for job status, but this is less efficient.
• WebSocket / Real-time: Use WebSockets or Supabase’s realtime (which is based on Postgres LISTEN/NOTIFY) to push notifications. Supabase can trigger a realtime event when a certain table is updated (for example, when new documents are inserted after a crawl, or when a metadata field is updated). The frontend, subscribed to these, can then show notifications or update the UI.
• We can also integrate a direct WebSocket in Node for custom messages if needed (especially for things like progress percentage updates).
• The user should be informed of completion without manual refresh. E.g., after clicking “Generate Report”, they see a “Generating…” status. When done, the UI automatically shows the report or a notification pops up “Report ready, click here to view.”

AnswerAI Integration:
• AnswerAI is the dedicated service for AI tasks. The backend will act as a client to this service. All AI-related functionality is requested via AnswerAI’s API:
• E.g., POST /answerai/v1/embedding with text to get an embedding vector.
• POST /answerai/v1/completion with a prompt to get a completion (for summarization, Q&A, etc.).
• POST /answerai/v1/transcribe with an audio file or link for transcription.
• The PRD should specify that the AnswerAI API endpoints and expected parameters/formats need to be defined (or align with known ones like OpenAI).
• The Node backend will maintain API keys or auth for AnswerAI and handle errors (like rate limits, timeouts).
• Importantly, calls to AnswerAI might themselves be slow (especially large content or complex prompts), so those calls should generally be done within the queued jobs context (so as not to tie up an HTTP request). For instance, when user asks a question via the UI, the front end might call a “ask question” endpoint. The Node backend could either handle it synchronously if it’s small or spawn a job if it expects a delay. A design decision: for interactive queries, maybe do it synchronously up to a certain complexity; for heavy tasks like “analyze hundreds of docs”, definitely queue it.

Database – Supabase:
• Supabase is essentially a managed Postgres with extras. We will use it as the primary data store for:
• User accounts and auth (Supabase Auth can manage user sign-up/login if we choose).
• Research views, documents, metadata, categories, and usage logs (billing).
• Possibly store embeddings either in a separate table or as vector columns in the documents table (with the PGVector extension enabled for similarity search).
• We should plan database schemas for each main entity, as mentioned:
• users (if not already by Supabase Auth).
• research_views (id, user_id, name, description, created_at, etc.).
• sources (id, research_view_id, type [website/file], details like URL, filters JSON, last_fetched_at, etc.).
• documents (id, source_id, title, content, metadata fields like date, author, token_count, category_ai, category_user, etc., and a vector column for embedding if using PGVector).
• metadata_fields and metadata_values for custom fields as described, unless we store custom extractions directly in documents as JSON.
• categories or tags (id, research_view_id, name, maybe hierarchy if nested).
• linking table for document-category assignment if many-to-many.
• jobs (id, type, status, progress, etc., or rely on queue system for that).
• usage_logs (id, user_id, timestamp, action_type, tokens_used, cost_estimate).
• Ensure indices on common query fields (like date, title, category, vector, etc.) for performance.

Scalability & Performance:
• Because heavy tasks are offloaded to the queue, the Node server can remain responsive to user interactions (like listing documents, which is a DB query, or adding a source which just enqueues work).
• If volume grows, we can run multiple worker processes for the queue, possibly across multiple servers, to handle tasks in parallel. The design should allow horizontal scaling: e.g. the queue is backed by Redis which workers share.
• The AnswerAI might be the bottleneck if it has rate limits – we may need to queue requests to it to avoid hitting limits or use multiple API keys or instances if needed.
• For the web crawling (website integration): if a user adds a very large website, crawling could be intensive. We might implement it in stages (like only fetch a certain number of pages per minute) or respect robots.txt. The PRD should note being mindful of not overloading external sites (perhaps integrate a polite crawling library or API).
• Caching: If the same document is fetched again (e.g. user refreshes but content unchanged), we should avoid reprocessing everything from scratch. We can use ETags or last-modified for HTTP requests to see if a page changed, and only update if needed. This reduces redundant work and token usage for re-embedding unchanged text, etc.

Error Handling & Logging:
• The backend should log errors from any job (to a file or monitoring service). If a job fails, mark it failed and notify the user gracefully.
• For example, if crawling a site fails due to network issues, record that and allow the user to retry. If AnswerAI returns an error (e.g. prompt too long or content not allowed), show a user-friendly message.
• In the PRD, emphasize robust error messaging so users know if something went wrong and what to do (like adjust a prompt or try again later).

Security:
• Ensure that users’ data is isolated: a user can only access documents of their own research views (enforce with row-level security if using Supabase Auth, or by always filtering by user_id).
• API keys for AnswerAI and any other third-party should be securely stored (not exposed to frontend).
• When integrating web search or crawling, beware of malicious content. Possibly sanitize or limit what HTML is stored or executed (we likely store as text, which is fine).
• If user uploads files, check file types and size to avoid abuse.

With this backend architecture, the system will be maintainable and scalable: Node for orchestration, a queue for heavy lifting, Supabase for data, and AnswerAI for the complex AI computations. The separation ensures each part can be optimized or scaled independently (for instance, we could scale up the vector DB if needed, or replace AnswerAI with another service without changing the frontend).

10. Development Phases & Milestones

To ensure efficient execution, the development will be broken down into phases and small tasks (micro-steps). Each task is intended to be accomplishable in 30 minutes to 1 hour, with clear acceptance criteria. Below are the planned phases and example tasks:

Phase 1: Project Setup & Foundations
• Task 1.1: Repository Setup – Create the project structure for frontend (React) and backend (Node). Initialize version control.
Acceptance Criteria: Repo is initialized, running a basic “Hello World” front page and server responds on a test endpoint.
• Task 1.2: Supabase Integration – Set up Supabase project, connect the Node backend to the database.
Acceptance Criteria: Backend can successfully read/write to a test table in Supabase (verify by creating a dummy entry and reading it).
• Task 1.3: Basic Auth (Optional initial) – Integrate user authentication using Supabase Auth or a simple email/password for now.
Acceptance Criteria: User can sign up, login, and the JWT or session token is recognized by backend (basic protected route test).

Phase 2: Data Source Ingestion (Websites first)
• Task 2.1: Add Data Source UI – Create frontend form/modal to add a website URL and optional filters (date range, sub-path).
Acceptance Criteria: User can open “Add Source” dialog, input URL and filters, and submit; the data is sent to backend.
• Task 2.2: Data Source API & DB – Implement backend endpoint to receive new source details, save in sources table, and enqueue a crawl job.
Acceptance Criteria: After frontend submission, a new row appears in sources with correct info, and a crawl job is created (log/console indicates job queued).
• Task 2.3: Basic Crawler Job – Implement a simple crawler that fetches a given URL (and maybe a couple of links) just to test pipeline.
Acceptance Criteria: When job runs, it fetches the URL content, creates a documents entry with title and content snippet.
• Task 2.4: Store Metadata – Parse fetched page for title, date (if available), word count, etc., and store in documents table.
Acceptance Criteria: The documents entry for a fetched page has the title, URL, date (if found) and content text stored.
• Task 2.5: Frontend Document List – Display the list of documents in a table for the research view.
Acceptance Criteria: After adding a source and completion of crawl, the user sees a table with at least “Title” and “Source/URL” and “Date” columns populated for each fetched page.

Phase 3: Metadata & Custom Fields
• Task 3.1: Default Metadata Columns – Extend the documents table in the UI to show all default metadata (token count, author, etc.). Style it with Material UI Table.
Acceptance Criteria: Table columns for Title, Date, Source, Word Count, etc., are visible and correctly filled for each document.
• Task 3.2: Add Column UI – Implement UI control to add a new metadata column. This opens a dialog to choose predefined prompts (dropdown) or enter custom prompt text.
Acceptance Criteria: User can open “Add Metadata Column” dialog, see a list of predefined options and an input for custom prompt.
• Task 3.3: Backend for Metadata Column – When a new column is added, create a metadata_fields entry and for each document in the view, enqueue an AI extraction job.
Acceptance Criteria: On adding, database has new field entry (with prompt stored). Jobs are created for each document (verify via logs or a job table).
• Task 3.4: AI Extraction Job – Implement worker job that takes a document and a prompt, calls AnswerAI to get a result, and stores it.
Acceptance Criteria: For a sample document and prompt “Summarize”, the job returns a summary text and saves it to a metadata_values table (or document’s JSON field).
• Task 3.5: Display Custom Metadata – Front end listens for job completions or periodically refreshes to get updated metadata values and shows them in the new column.
Acceptance Criteria: After a short wait, the new column cells populate with AI-generated data for each document. If a value is not ready, show a loading indicator or placeholder.

Phase 4: Document Search & Vector Index
• Task 4.1: Integrate Embedding Model – Set up AnswerAI API call for obtaining text embeddings (for now, possibly use a dummy or a real model if available).
Acceptance Criteria: A function exists to send text and receive an embedding vector (array of numbers). Test with a sample sentence.
• Task 4.2: Create Vector Index – Design a table or use PGVector in Supabase for storing embeddings. Modify the crawler job to also create embeddings for each document or chunk.
Acceptance Criteria: After crawling a page, its embedding (or chunk embeddings) are stored in the DB. Confirm we can query that table and see vectors.
• Task 4.3: Chunking Large Docs – Implement logic to split documents that exceed a certain length into chunks, and embed each chunk separately.
Acceptance Criteria: Given a long text (simulate with lorem ipsum), the code splits into e.g. ~500-token segments, and stores multiple entries for one document. Document table or a separate index table records chunk references.
• Task 4.4: Search API Backend – Create an API endpoint for search queries. If a query string is received, embed the query, perform a vector similarity search in the DB, and return top matching documents/chunks.
Acceptance Criteria: Using an API client or frontend, send a search term. The response returns a list of document IDs and snippets ranked by relevance (which include documents that have similar content to the query).
• Task 4.5: Search UI – Add a search bar in the frontend. On enter, call the search API and display results (maybe highlight documents in the table or show a separate results list). Allow filtering by category if possible.
Acceptance Criteria: User types “climate change” in search bar, hits enter, and sees a list of relevant documents or the table filters to those documents. The search finds matches even if the exact words differ (semantic match test).

Phase 5: Taxonomy & Categorization
• Task 5.1: Category Model & UI – Implement ability to create categories/tags in a research view. Provide a UI (maybe a sidebar) to add a new category name (and optional parent if hierarchy).
Acceptance Criteria: User can create categories “Tech” and “Health”. These appear in a category list UI.
• Task 5.2: Assign Categories (Manual) – Allow user to assign a document to one or multiple categories (maybe via multi-select in each row or drag-drop to category).
Acceptance Criteria: The user selects a document row, chooses category “Tech”. The document’s category_user field updates in DB, and UI indicates the assignment (e.g. a category label on the row).
• Task 5.3: AI Category Suggestion – During document ingestion or via a separate job, run AI classification to suggest a category for each document. Store suggestion in a field (category_ai).
Acceptance Criteria: After ingestion, documents have a category_ai value (like a label). Perhaps log or display this as a faded tag on each row.
• Task 5.4: Category Two-Layer Display – Differentiate between AI-suggested category and user category in the UI. Maybe show AI category in italics until user confirms or overrides.
Acceptance Criteria: If a document has category_ai “Health” and user has not set anything, show “Health (Suggested)”. If user assigns their own, show that instead or alongside.
• Task 5.5: Filter by Category – Implement front end controls to filter the document list by selected category.
Acceptance Criteria: Clicking on “Tech” category filters the table to only documents in Tech (either by user or AI category, possibly allow choosing which).

Phase 6: AI Q&A and Analysis Features
• Task 6.1: Predefined Prompt Actions – Add UI buttons (e.g. in each document row or on document view) for actions like “Summarize”. Hook these to call an API endpoint for that document and get result.
Acceptance Criteria: User clicks “Summarize” on a document, and a pop-up or side panel shows the summary after a moment.
• Task 6.2: Freeform Query API – Backend endpoint to handle an analysis query. It should accept a prompt and an optional scope (all docs or a subset), perform the logic: embed query, vector search, call AnswerAI to compose answer.
Acceptance Criteria: When called with a question like “What’s the main theme across all docs?”, the endpoint returns an answer string (for testing, maybe stub or simplified logic until fully implemented).
• Task 6.3: Freeform Query UI – Design a panel or chat interface where user can type a question. On submit, call the analysis API and then display the answer.
Acceptance Criteria: User enters a question, sees a loading indicator, then an AI-generated answer appears. They can scroll through or copy it.
• Task 6.4: Web Search Integration (API) – Extend the analysis logic to call a web search API if needed. For now, perhaps use a placeholder or a simple fetch from Wikipedia for known terms.
Acceptance Criteria: When a question clearly needs external info, the backend fetches something from the web. (Test case: ask a question unrelated to any document; see that the system attempts an external search.)
• Task 6.5: Web Search UI Option – Add a toggle or checkbox “Include web results” next to the query input.
Acceptance Criteria: If user checks it and asks a question, ensure the backend is receiving a flag to include external info (and for testing, perhaps returns additional data in the answer).

Phase 7: Billing & Token Tracking
• Task 7.1: Token Counting Hook – After each AnswerAI API call, capture the tokens used (input/output). If AnswerAI provides this, parse it; if not, estimate by input length.
Acceptance Criteria: Log output in console or DB for a test call: e.g. “Q&A used 1200 input, 200 output tokens.”
• Task 7.2: Usage Database – Create usage_logs table and a function to insert a record for each AI operation (user_id, type, tokens, cost, timestamp).
Acceptance Criteria: After running a few operations, the table has corresponding entries with correct token counts and calculated cost.
• Task 7.3: Display Usage – On frontend, perhaps in user profile or a footer, show total tokens used and cost for current session or project.
Acceptance Criteria: For example, a user profile page that shows “This month: 50,000 tokens (~$1.00)”.
• Task 7.4: Usage Warnings – If implementing limits, add a check before AI operations to see if user exceeds free quota.
Acceptance Criteria: If a test user has a quota of 1000 tokens and they attempt an action that would exceed it, the API returns an error and UI shows a warning like “Quota exceeded.”

Phase 8: Report Generation & Editing
• Task 8.1: Generate Report API – Backend endpoint that composes a report. For initial version, maybe just call AnswerAI with “Summarize everything” prompt.
Acceptance Criteria: Calling this endpoint returns a markdown text with multiple sections (validate structure exists, e.g. “# Summary” etc.).
• Task 8.2: Report Editor UI – Implement a page or modal to display the markdown output in an editor component (use a library or simple textarea that supports markdown).
Acceptance Criteria: After generation, the report text is visible with formatting. The user can toggle to edit mode and make changes (e.g. type text, add emphasis).
• Task 8.3: Save Report – Provide a “Save Report” button. This will take the current markdown content and save it to a reports table in the DB with a name and timestamp.
Acceptance Criteria: User edits the report and saves as “Initial Report”. It appears in the reports list (and DB entry created).
• Task 8.4: Reports List & Load – Allow multiple reports per view. Implement UI to list saved reports and open a selected one in the editor.
Acceptance Criteria: If two reports are saved, both are listed (by name and date). Clicking one loads its content back into the editor for viewing/editing.
• Task 8.5: Markdown to PDF Export (optional) – Integrate an export function to download the report.
Acceptance Criteria: When clicking export, a PDF or MD file is downloaded with the content (this task might take longer, so could be optional or future).

Phase 9: Frontend Refinements & Performance
• Task 9.1: Infinite Scroll Implementation – Replace simple table rendering with a virtualized list that only renders visible items.
Acceptance Criteria: Test with 1000+ dummy documents: scrolling remains smooth, and memory usage is controlled (verify not all 1000 DOM nodes present at once).
• Task 9.2: Table Filter Implementation – Hook up filters (search box, date filter UI) to actually filter data. Possibly send queries to backend or filter in-memory for small sets.
Acceptance Criteria: Entering a keyword filters the table to items whose title or other fields contain that substring (or semantic match if advanced).
• Task 9.3: UI Polishing – Apply consistent theming, ensure mobile responsiveness, add tooltips/help texts for icons, improve layout spacing.
Acceptance Criteria: Do a UI review and get sign-off that the app looks professional and works on different screen sizes (at least basic on mobile).
• Task 9.4: Testing & Bug Fixing – Write unit tests for critical functions (if time permits) and conduct manual testing for all features. Fix issues found.
Acceptance Criteria: All major use cases (adding source, seeing data, searching, analysis, report generation, etc.) have been tested and work without errors. Any known issues are documented for fix.

Phase 10: Deployment & Monitoring
• Task 10.1: Prepare Deployment – Dockerize the application or prepare it for deployment to a cloud service. Include environment configs for API keys.
Acceptance Criteria: App can be started via a single command or deployed on a staging environment. All services (frontend, backend, DB) connect properly.
• Task 10.2: Monitoring Setup – Integrate basic monitoring/logging (like Sentry for errors, or Supabase logging) to catch runtime errors in production.
Acceptance Criteria: Induce a test error; verify it’s logged to monitoring service.
• Task 10.3: Documentation & PRD Review – Finalize documentation for usage (user guide) and developer docs for the code (README). Ensure the implemented product aligns with this PRD.
Acceptance Criteria: README present with instructions, and a final check confirms each PRD feature is either implemented or planned in future phases.

Milestones & Checkpoints:
• After Phase 2, we should have a basic end-to-end flow: add a website and see a document appear. Milestone: Basic ingestion working.
• After Phase 4, the search functionality should be operational. Milestone: Semantic search working on ingested data.
• After Phase 6, the AI Q&A loop is complete (even if not fully polished). Milestone: User can ask questions and get answers from data.
• After Phase 8, the user can generate and save a report. Milestone: Research output generation ready.
• Phase 9 and 10 are polishing and deploying.

Each micro-task above is meant to be small enough to develop and test quickly, ensuring steady progress. Acceptance criteria ensure we know when a task is truly done. The development team should keep tasks small; if any task is estimated over 1 hour, consider breaking it down further. Regular checkpoints (after each phase or every few days) will be set to review progress against the PRD and adjust if needed.

By following these structured phases and micro-tasks, engineering can execute efficiently with clear goals, while maintaining the flexibility to adjust as we learn from each step. The result will be a robust, AI-powered research application built with best practices in mind for data ingestion and analysis.
