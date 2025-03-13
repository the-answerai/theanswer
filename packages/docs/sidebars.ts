import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
    docs: [
        'intro',
        {
            type: 'category',
            label: 'Using AnswerAI',
            link: {
                type: 'generated-index',
                title: 'Using AnswerAI',
                description: 'Learn how to use AnswerAI effectively'
            },
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'using-answerai'
                }
            ]
        },
        {
            type: 'category',
            label: 'Developers',
            link: {
                type: 'generated-index',
                title: 'Developer Resources',
                description: 'Technical documentation for developers'
            },
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'developers'
                },
                {
                    type: 'category',
                    label: 'API Reference',
                    link: {
                        type: 'doc',
                        id: 'api/index'
                    },
                    items: [
                        {
                            type: 'doc',
                            id: 'api/full-api-spec',
                            label: 'Full API Specification'
                        },
                        {
                            type: 'category',
                            label: 'Assistants API',
                            link: {
                                type: 'doc',
                                id: 'api/assistants/assistants-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/assistants'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Attachments API',
                            link: {
                                type: 'doc',
                                id: 'api/attachments/attachments-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/attachments'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Chat Message API',
                            link: {
                                type: 'doc',
                                id: 'api/chat-message/chat-message-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/chat-message'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Leads API',
                            link: {
                                type: 'doc',
                                id: 'api/leads/leads-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/leads'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Prediction API',
                            link: {
                                type: 'doc',
                                id: 'api/prediction/prediction-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/prediction'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Chatflows API',
                            link: {
                                type: 'doc',
                                id: 'api/chatflows/chatflows-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/chatflows'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Document Store API',
                            link: {
                                type: 'doc',
                                id: 'api/document-store/document-store-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/document-store'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Feedback API',
                            link: {
                                type: 'doc',
                                id: 'api/feedback/feedback-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/feedback'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Tools API',
                            link: {
                                type: 'doc',
                                id: 'api/tools/tools-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/tools'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Ping API',
                            link: {
                                type: 'doc',
                                id: 'api/ping/ping-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/ping'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Upsert History API',
                            link: {
                                type: 'doc',
                                id: 'api/upsert-history/upsert-history-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/upsert-history'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Variables API',
                            link: {
                                type: 'doc',
                                id: 'api/variables/variables-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/variables'
                                }
                            ]
                        },
                        {
                            type: 'category',
                            label: 'Vector Upsert API',
                            link: {
                                type: 'doc',
                                id: 'api/vector-upsert/vector-upsert-api'
                            },
                            items: [
                                {
                                    type: 'autogenerated',
                                    dirName: 'api/vector-upsert'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            type: 'category',
            label: 'Use Cases',
            link: {
                type: 'generated-index',
                title: 'AnswerAI Use Cases',
                description: 'Explore various applications of AnswerAI'
            },
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'use-cases'
                }
            ]
        },
        {
            type: 'category',
            label: 'Community',
            link: {
                type: 'generated-index',
                title: 'Community Resources',
                description: 'Join the AnswerAI community'
            },
            items: [
                {
                    type: 'autogenerated',
                    dirName: 'community'
                }
            ]
        }
    ]
}

export default sidebars
