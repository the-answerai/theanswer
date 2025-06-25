// scripts/testing-chatflows/chatflows.js

// Example format for a chatflow:
// {
//     id: '...',
//     enabled: true,
//     internalName: '...',
//     conversation: [
//       {
//         input: 'First message',
//         files: [
//           { path: './scripts/testing-chatflows/assets/image.png', type: 'image/png' }
//         ]
//       },
//       {
//         input: 'Follow-up message',
//         files: []
//       }
//     ]
//   }

module.exports = [
    {
        id: '8ef0e7d2-7c31-496d-8666-60133a246e15',
        enabled: false,
        internalName: 'AAI Chat Memory - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?',
                files: []
            },
            {
                input: 'What is my name?',
                files: []
            }
        ]
    },
    {
        id: '74e347c6-eb06-4c9e-9a6e-4f18577fce31',
        enabled: false,
        internalName: 'AAI Vector Store - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'What all can you do and tell me?'
            }
        ]
    },
    {
        id: '432b894c-67bd-4f22-b065-ebae71a91f8a',
        enabled: false,
        internalName: 'AAI Record Manager - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'What all can you do and tell me?'
            }
        ]
    },
    {
        id: 'e442fafb-eea9-4434-8bb2-1d29bbccaafb',
        enabled: false,
        internalName: 'Anthropic - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?'
            }
        ]
    },
    {
        id: '5407cf97-d3e3-4a84-99c3-f360b43fd408',
        enabled: false,
        internalName: 'AWS Bedrock - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?'
            }
        ]
    },
    {
        id: 'd377e905-7ab1-4ebf-899d-605ee7ba345b',
        enabled: true,
        internalName: 'ChatGPT - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?'
            }
        ]
    },
    {
        id: '2a03daa1-164c-467e-a7e3-43251468eb51',
        enabled: true,
        internalName: 'DALL-E ( Image Gen ) - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'Create a new random image, do not ask me for confirmation, just creat a random image for me.'
            },
            {
                input: 'What is my name? Describe the image you just created.'
            }
        ]
    },
    {
        id: '05f81e6d-21b4-40d2-b0f8-bd1d62abd6f4',
        enabled: false,
        internalName: 'Deepseek - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?'
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?',
                files: []
            }
        ]
    },
    {
        id: 'c4f35602-1f59-4185-98c1-e07d590ccbc4',
        enabled: false,
        internalName: 'ExaSearch - Dynamic Web Search - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?',
                files: []
            },
            {
                input: 'What is my name? What is todays date and whats in the news today?',
                files: []
            }
        ]
    },
    {
        id: 'fdee98e5-168c-44d7-b5cb-73b590566524',
        enabled: false,
        internalName: 'Google - Dynamic Web Search - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?',
                files: []
            },
            {
                input: 'What is my name? What is todays date and whats in the news today?',
                files: []
            }
        ]
    },
    {
        id: '80592745-6789-456d-8f26-ebca25354e12',
        enabled: false,
        internalName: 'Google Generative AI - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?',
                files: []
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?',
                files: []
            }
        ]
    },
    {
        id: 'be877fe8-9df9-477e-bb96-ed31b91eee3b',
        enabled: false,
        internalName: 'Groq - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?',
                files: []
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?',
                files: []
            }
        ]
    },
    {
        id: '66f87de0-9273-46bc-8b9d-4a3f98e27ab4',
        enabled: false,
        internalName: 'Pinecone Vector Store - Official',
        conversation: [
            {
                input: 'Hello, my name is John Doe, what can you do?',
                files: []
            },
            {
                input: 'Describe this image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What is my name? What is the image?',
                files: []
            }
        ]
    },
    {
        id: '1ffd22be-5d19-4127-8de5-5ec756462009',
        enabled: true,
        internalName: 'Full Test - Chief Sidekick - Official',
        conversation: [
            {
                input: 'A golden retriever gently holding a small baby elephant in its mouth, both animals looking playful and happy. The scene is outdoors on a sunny day, in a colorful and natural setting. Art style is realistic with soft lighting and a warm, uplifting mood. Creaet it immediately without asking for addiitonal confirmation.'
            },
            {
                input: 'What is todays date? Whats in the news today?'
            },
            {
                input: 'Here is an image.',
                files: [
                    {
                        path: 'scripts/testing-chatflows/assets/image.png',
                        type: 'image/png'
                    }
                ]
            },
            {
                input: 'What was in the image I just sent you?'
            },
            {
                input: 'Create a random story about something.'
            },
            {
                input: 'What was the story about?'
            }
        ]
    }
]
