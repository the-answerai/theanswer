const legaDocumentTagging = {
    name: 'legaDocumentTagging',
    description: 'Categorize and label documents based on the content of the document, such as legal filings, correspondence, reports, evidence, supporting documents, or unknown.',
    // chatflowId: '6b5da243-c3b8-4ddf-9076-22178f0d5c65', // Production
    chatflowId: 'a8d28e49-3b6b-49cc-9e56-c3632e0b5e8c', // Localhost
    sourceContentTypeId: 'originalDocuments',
    humanMessagePromptField: 'textContent',
    instructions: `
    User will provide a document and agent will categorize the document based on teh following criteria:
    Type of Document (Single Select):
    key: typeOfArticle
    Used to encompass all types of documents you're dealing with but distinct enough to separate them based on their general nature or source
    Only choose from these options: ['Legal Filings', 'Correspondence', 'Reports', 'Evidence', 'Supporting Documents', 'Unknown']
    - Legal Filings: Includes all formal filings within the court system such as motions, declarations, and orders.
    - Correspondence: Covers all forms of communication including emails, letters, and notes from meetings or calls.
    - Reports: Encompasses structured documents like psychological evaluations, visitation reports, and therapy updates.
    - Evidence: All evidentiary materials that could be used in court or negotiations, such as photographs, audio/video recordings, and logs.
    - Supporting Documents: Includes certificates, educational records, medical documents, and other paperwork that supports or validates claims or statements.
    - Unknown: For any documents that you are unsure of its purpose or type, tag it as unknown for human review. 


    Intent (Multi-select):
    key: intent
    This tag should reflect the purpose or intended use of the document in the legal context, helping to identify how each document serves your case strategy.
    Select multiple options from only these options: ['Support Parental Competency', 'Demonstrate Compliance', 'Legal Strategy', 'Evidence of Cooperation or Conflict', 'Child-Focused Documentation']
    - Support Parental Competency: For documents that showcase parenting skills or dedication.
    - Demonstrate Compliance: Useful for proving adherence to court orders or requirements.
    - Legal Strategy: Documents that are relevant to developing or defending against legal actions.
    - Evidence of Cooperation or Conflict: Tags for showing either cooperative efforts or conflicts, especially in communications or during supervised visits.
    - Child-Focused Documentation: Specifically highlights the child’s welfare, interests, or needs, reflecting direct impacts or relevant concerns.


    Specificity (Single Select):
    key: specificity
    Used for distinguishing documents based on their level of detail or specificity
    Only choose from these options: ['General Information', 'Detailed Analysis', 'Actionable Items']
    - General Information: Broader documents that provide context or background.
    - Detailed Analysis: Documents containing in-depth analysis or detailed reports.
    - Actionable Items: Documents that require or suggest immediate action.


    Confidentiality Level (Single Select)
    key: confidentialityLevel
    Given the sensitive nature of family court proceedings, tagging documents based on their confidentiality could help manage who has access to what information.
    - Public: Documents that can be shared or disclosed without significant concerns (e.g., court orders).
    - Restricted: Documents that should only be shared with specific parties like legal counsel or experts.
    - Private: Default label and used for highly sensitive documents that should be tightly controlled (e.g., psychological evaluations). Also used for any documents that you are unsure of its privacy settings, tag it as Private 


    Return your response in JSON format
    
    `,
    responseOutput: `z.object({
        typeOfDocument: z.enum([
            "Legal Filings", "Correspondence", "Reports", "Evidence", 
            "Supporting Documents", "Unknown"
        ]), // Single select enum for document types
        intent: z.enum([
            "Support Parental Competency", "Demonstrate Compliance", 
            "Legal Strategy", "Evidence of Cooperation or Conflict", 
            "Child-Focused Documentation"
        ]).array(), // Multi-select, array of intent from the defined enum
        specificity: z.enum([
            "General Information", "Detailed Analysis", "Actionable Items"
        ]), // Single select enum for specificity of the document
        confidentialityLevel: z.enum([
            "Public", "Restricted", "Private"
        ]) // Single select enum for confidentiality level
    })`
}

module.exports = legaDocumentTagging
