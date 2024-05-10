const analyzeComms = {
    name: 'analyzeComms',
    description: 'Analyzes the content of a document and tags it based on the content.',
    // chatflowId: '6b5da243-c3b8-4ddf-9076-22178f0d5c65', // Production
    chatflowId: '8de264c3-4ea3-4351-9100-3b6f10411dfd', // Localhost
    sourceContentTypeId: 'originalDocuments',
    summaryField: 'evidenceAgainst',
    humanMessagePromptField: 'textContent',
    filters: {
        'fields.typeOfDocument': 'Correspondence'
    },
    prompt: `
    Analyze this coorespondence and the current summary. Is there anything additional in this coorespondence that Brad can use as evidence of Bradley compliance with Kenya and Deanna's concenrns and Bradleys commitments to them to address their concerns:
    - Openness to Feedback: I am committed to applying active listening strategies and reflecting on feedback before responding. I want to ensure that I fully understand and address concerns, showing my responsibility towards making necessary improvements.
    - Consistency in Behavior: I am committed to implementing the strategies and feedback received during our sessions. Adjusting them as needed to ensure they are effective and continuously updating you on the progress.
    - Child Attunement: I am actively pursuing additional resources and engaging in activities that help me respond better to my children's cues, emphasizing my commitment to their emotional and developmental needs. I will continue to engage in activities during our visits that foster better understanding and responsiveness to the children's cues.
    - Congruence Between Words and Actions: I understand the importance of aligning my actions with my communicated intentions. It is essential to me that my children and you, as key stakeholders in their welfare, see consistency between what I say and what I do. I am determined to incorporate regular feedback into my actions, ensuring that I not only speak of change but actively demonstrate it through my interactions and decisions. This commitment aims to build trust and confirm my dedication to being a better parent.

    Prompt 2:
    Analyze this coorespondence and the current summary. You are looking for Bradleys blindspots and evidence that could hurt him. Analyze it as a judge and provide any negative feedback given to Bradley, any concerns brought up, and any other cliam of stamtent that could be looked at negativly by a judge. 
    `
}

module.exports = analyzeComms
