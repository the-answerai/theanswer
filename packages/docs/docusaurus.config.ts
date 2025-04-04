import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import type * as Preset from '@docusaurus/preset-classic'
import type * as OpenApiPlugin from 'docusaurus-plugin-openapi-docs'

const config: Config = {
    title: 'AnswerAI',
    tagline: 'Intelligent Answers, Instantly',
    favicon: 'img/favicon.png',

    // Set the production url of your site here
    url: 'https://docs.theanswer.ai',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'AnswerAI', // Usually your GitHub org/user name.
    projectName: 'answerai', // Usually your repo name.

    onBrokenLinks: 'log',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en']
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: require.resolve('./sidebars.ts'),
                    // Set this to true to use autogenerated sidebars
                    routeBasePath: 'docs',
                    sidebarItemsGenerator: async ({ defaultSidebarItemsGenerator, ...args }) => {
                        const sidebarItems = await defaultSidebarItemsGenerator(args)
                        return sidebarItems
                    },
                    docItemComponent: '@theme/ApiItem'
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ['rss', 'atom'],
                        xslt: true
                    },
                    // Please change this to your repo.
                    onInlineTags: 'warn',
                    onInlineAuthors: 'warn',
                    onUntruncatedBlogPosts: 'warn'
                },
                theme: {
                    customCss: './src/css/custom.css'
                }
            } satisfies Preset.Options
        ]
    ],
    plugins: [
        [
            'docusaurus-plugin-openapi-docs',
            {
                id: 'api', // plugin id
                docsPluginId: 'classic', // configured for preset-classic
                config: {
                    assistants: {
                        specPath: 'openapi/assistants.yaml',
                        outputDir: 'docs/api/assistants',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    attachments: {
                        specPath: 'openapi/attachments.yaml',
                        outputDir: 'docs/api/attachments',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    chatMessage: {
                        specPath: 'openapi/chat-message.yaml',
                        outputDir: 'docs/api/chat-message',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    chatflows: {
                        specPath: 'openapi/chatflows.yaml',
                        outputDir: 'docs/api/chatflows',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    documentStore: {
                        specPath: 'openapi/document-store.yaml',
                        outputDir: 'docs/api/document-store',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    feedback: {
                        specPath: 'openapi/feedback.yaml',
                        outputDir: 'docs/api/feedback',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    leads: {
                        specPath: 'openapi/leads.yaml',
                        outputDir: 'docs/api/leads',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    prediction: {
                        specPath: 'openapi/prediction.yaml',
                        outputDir: 'docs/api/prediction',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    tools: {
                        specPath: 'openapi/tools.yaml',
                        outputDir: 'docs/api/tools',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    ping: {
                        specPath: 'openapi/ping.yaml',
                        outputDir: 'docs/api/ping',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    upsertHistory: {
                        specPath: 'openapi/upsert-history.yaml',
                        outputDir: 'docs/api/upsert-history',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    variables: {
                        specPath: 'openapi/variables.yaml',
                        outputDir: 'docs/api/variables',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options,
                    vectorUpsert: {
                        specPath: 'openapi/vector-upsert.yaml',
                        outputDir: 'docs/api/vector-upsert',
                        sidebarOptions: {
                            groupPathsBy: 'tag'
                        },
                        markdownGenerators: {
                            createInfoPageMD: (pageData) => {
                                // Extract API name from the ID
                                const apiName = pageData.id.split('/').pop()?.replace('-api', '') || ''
                                const title = apiName.charAt(0).toUpperCase() + apiName.slice(1)

                                // Generate a simple introduction
                                let markdown = `# ${title} API\n\n`
                                markdown += `This section contains the API endpoints for the ${apiName} service.\n\n`

                                markdown += `## Overview\n\n`
                                markdown += `The ${title} API provides endpoints for managing ${apiName} resources.\n\n`

                                markdown += `## Authentication\n\n`
                                markdown += `All API requests require authentication using an API key or OAuth token.\n\n`

                                markdown += `## Rate Limiting\n\n`
                                markdown += `API calls are subject to rate limiting to ensure fair usage and system stability.\n\n`

                                markdown += `## Endpoints\n\n`
                                markdown += `Explore the available endpoints in the sidebar to learn more about specific operations.\n\n`

                                return markdown
                            },
                            createTagPageMD: () => ''
                        }
                    } satisfies OpenApiPlugin.Options
                }
            }
        ]
    ],
    themes: ['docusaurus-theme-openapi-docs'], // export theme components

    themeConfig: {
        // Replace with your project's social card
        image: 'img/answerai-social-card.png',
        navbar: {
            logo: {
                alt: 'AnswerAI Logo',
                src: 'img/answerai-wide-black.png',
                srcDark: 'img/answerai-logo-600-wide-white.png' // Add this line for dark mode logo
            },
            items: [
                {
                    to: '/docs/intro',
                    label: 'Getting Started',
                    position: 'left'
                },
                {
                    to: '/docs/using-answerai/',
                    label: 'Chat',
                    position: 'left'
                },
                {
                    to: '/docs/developers',
                    label: 'Developers',
                    position: 'left'
                },
                {
                    to: '/docs/api',
                    label: 'API Reference',
                    position: 'left'
                },
                {
                    to: '/docs/community',
                    label: 'Community',
                    position: 'left'
                },
                {
                    href: 'https://studio.theanswer.ai',
                    label: 'Sign In',
                    position: 'right',
                    className: 'button button--primary button--sm'
                },
                {
                    href: 'https://github.com/the-answerai',
                    label: 'GitHub',
                    position: 'right'
                }
            ]
        },
        footer: {
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            to: '/docs/intro',
                            label: 'Getting Started'
                        },
                        {
                            to: '/docs/using-answerai/',
                            label: 'Chat'
                        },
                        {
                            to: '/docs/developers',
                            label: 'Developers'
                        },
                        {
                            to: '/docs/community',
                            label: 'Community'
                        }
                    ]
                },
                {
                    title: 'Community',
                    items: [
                        {
                            label: 'Discord',
                            href: 'https://discord.gg/X54ywt8pzj'
                        },
                        {
                            label: 'GitHub',
                            href: 'https://github.com/the-answerai'
                        }
                    ]
                },
                {
                    title: 'Social',
                    items: [
                        {
                            label: 'YouTube',
                            href: 'https://youtube.com/@digitalatscale'
                        },
                        {
                            label: 'X',
                            href: 'https://x.com/digitalatscale_'
                        },
                        {
                            label: 'Instagram',
                            href: 'https://instagram.com/digitalatscale'
                        }
                    ]
                },
                {
                    title: 'Company',
                    items: [
                        {
                            label: 'Website',
                            href: 'https://theanswer.ai'
                        },
                        {
                            label: 'Privacy Policy',
                            href: '/privacy-policy'
                        },
                        {
                            label: 'Terms of Service',
                            href: '/terms-of-service'
                        }
                    ]
                }
            ],
            copyright: `Copyright © ${new Date().getFullYear()}`
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula
        }
    } satisfies Preset.ThemeConfig
}

export default config
