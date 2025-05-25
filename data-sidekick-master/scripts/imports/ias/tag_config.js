// Tag configuration for Integral Ad Science (IAS)
// This file contains the tag structure used for categorizing IAS-related calls

export const tagStructure = [
    {
        label: 'Advertiser + Agency Solutions',
        slug: 'advertiser-agency-solutions',
        color: '#4A6FFF',
        description: 'Issues and inquiries related to advertiser and agency products and services',
        children: [
            {
                label: 'Onboarding Guides',
                slug: 'onboarding-guides',
                color: '#6B89FF',
                description: 'Assistance with onboarding processes and documentation'
            },
            {
                label: 'Getting Started',
                slug: 'getting-started-advertiser',
                color: '#8CA3FF',
                description: 'Initial setup and configuration for advertisers and agencies'
            },
            {
                label: 'Campaign Setup and Management',
                slug: 'campaign-setup-management',
                color: '#ADBDFF',
                description: 'Setting up and managing advertising campaigns'
            },
            {
                label: 'Evaluating Metrics',
                slug: 'evaluating-metrics',
                color: '#CED7FF',
                description: 'Understanding and analyzing campaign performance metrics'
            },
            {
                label: 'Firewall + OM SDK',
                slug: 'firewall-om-sdk',
                color: '#DEE3FF',
                description: 'Issues related to Firewall and Open Measurement SDK implementation'
            },
            {
                label: 'Tagging',
                slug: 'tagging-advertiser',
                color: '#EEF1FF',
                description: 'Implementation and troubleshooting of advertiser-side tags'
            }
        ]
    },
    {
        label: 'Publisher + Platform Solutions',
        slug: 'publisher-platform-solutions',
        color: '#FF5E62',
        description: 'Issues and inquiries related to publisher and platform products and services',
        children: [
            {
                label: 'IAS Pulse Guides',
                slug: 'ias-pulse-guides',
                color: '#FF7A7D',
                description: 'Assistance with IAS Pulse platform guidance and documentation'
            },
            {
                label: 'Getting Started',
                slug: 'getting-started-publisher',
                color: '#FF9697',
                description: 'Initial setup and configuration for publishers and platforms'
            },
            {
                label: 'Report Builder + Reporting',
                slug: 'report-builder-reporting',
                color: '#FFB2B3',
                description: 'Creating and managing custom reports and analytics'
            },
            {
                label: 'Tagging and Pixels',
                slug: 'tagging-pixels',
                color: '#FFCED0',
                description: 'Implementation and troubleshooting of publisher-side tags and pixels'
            },
            {
                label: 'Using the Dashboards',
                slug: 'using-dashboards',
                color: '#FFE9EA',
                description: 'Navigating and utilizing IAS dashboards and interfaces'
            }
        ]
    },
    {
        label: 'Technical Support',
        slug: 'technical-support',
        color: '#22C55E',
        description: 'Technical issues and troubleshooting assistance',
        children: [
            {
                label: 'Integration Issues',
                slug: 'integration-issues',
                color: '#4ADE80',
                description: 'Problems with platform or tool integrations'
            },
            {
                label: 'Tag Manager/Tagging Integrations',
                slug: 'tag-manager-integrations',
                color: '#86EFAC',
                description: 'Issues with tag management systems and implementation'
            },
            {
                label: 'API Support',
                slug: 'api-support',
                color: '#BBF7D0',
                description: 'Assistance with API usage and troubleshooting'
            },
            {
                label: 'SDK Implementation',
                slug: 'sdk-implementation',
                color: '#DCFCE7',
                description: 'Help with implementing and configuring SDKs'
            }
        ]
    },
    {
        label: 'Educational Resources',
        slug: 'educational-resources',
        color: '#8B5CF6',
        description: 'Learning and training materials',
        children: [
            {
                label: 'Metrics Glossary',
                slug: 'metrics-glossary',
                color: '#A78BFA',
                description: 'Definitions and explanations of metrics and terminology'
            },
            {
                label: 'Video Tutorials',
                slug: 'video-tutorials',
                color: '#C4B5FD',
                description: 'Video-based learning content and walkthroughs'
            },
            {
                label: 'Help Center',
                slug: 'help-center',
                color: '#DDD6FE',
                description: 'General assistance and documentation from the help center'
            },
            {
                label: 'Using IAS UI',
                slug: 'using-ias-ui',
                color: '#EDE9FE',
                description: 'Guidance on navigating and using the IAS user interface'
            }
        ]
    },
    {
        label: 'Account Management',
        slug: 'account-management',
        color: '#EC4899',
        description: 'Account-related inquiries and management',
        children: [
            {
                label: 'Billing Solutions',
                slug: 'billing-solutions',
                color: '#F472B6',
                description: 'Billing-related questions and issue resolution'
            },
            {
                label: 'Classic Excel Reports',
                slug: 'classic-excel-reports',
                color: '#F9A8D4',
                description: 'Assistance with traditional Excel-based reporting'
            },
            {
                label: 'List Manager',
                slug: 'list-manager',
                color: '#FBCFE8',
                description: 'Help with managing lists and list-related features'
            },
            {
                label: 'YouTube Player',
                slug: 'youtube-player',
                color: '#FCE7F3',
                description: 'Issues related to YouTube player integration and functionality'
            }
        ]
    },
    {
        label: 'Platform-Specific Support',
        slug: 'platform-specific-support',
        color: '#F59E0B',
        description: 'Support for specific platforms and integrations',
        children: [
            {
                label: 'Programmatic Solutions',
                slug: 'programmatic-solutions',
                color: '#FBBF24',
                description: 'Issues related to programmatic advertising solutions'
            },
            {
                label: 'DSP Guides',
                slug: 'dsp-guides',
                color: '#FCD34D',
                description: 'Guidance for Demand-Side Platform integration and usage'
            },
            {
                label: 'Total Visibility',
                slug: 'total-visibility',
                color: '#FDE68A',
                description: 'Support for the Total Visibility solution and features'
            },
            {
                label: 'Proprietary Platforms',
                slug: 'proprietary-platforms',
                color: '#FEF3C7',
                description: 'Support for IAS proprietary platforms and tools'
            }
        ]
    },
    {
        label: 'Product Updates',
        slug: 'product-updates',
        color: '#06B6D4',
        description: 'Information about product changes and releases',
        children: [
            {
                label: 'Release Notes',
                slug: 'release-notes',
                color: '#22D3EE',
                description: 'Details about new releases and product updates'
            },
            {
                label: 'Feature Requests',
                slug: 'feature-requests',
                color: '#67E8F9',
                description: 'Handling of customer requests for new features'
            },
            {
                label: 'Beta Programs',
                slug: 'beta-programs',
                color: '#A5F3FC',
                description: 'Information about beta features and programs'
            },
            {
                label: 'Deprecation Notices',
                slug: 'deprecation-notices',
                color: '#CFFAFE',
                description: 'Announcements about deprecated features or services'
            }
        ]
    }
]

export default tagStructure
