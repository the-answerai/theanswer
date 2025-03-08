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
                    helloWorld: {
                        specPath: 'openapi/hello-world/hello-world.yaml',
                        outputDir: 'docs/api/hello-world',
                        sidebarOptions: {
                            groupPathsBy: 'tag',
                            categoryLinkSource: 'tag'
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
