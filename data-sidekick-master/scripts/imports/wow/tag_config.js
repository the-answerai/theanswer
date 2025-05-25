// Tag configuration for WOW environment
// This file contains the tag structure used for categorizing calls

export const tagStructure = [
    {
        label: 'Payment & Billing',
        slug: 'payment-billing',
        color: '#FF6B6B',
        description: 'Issues and inquiries related to payments and billing',
        children: [
            {
                label: 'Late/Overdue Payments',
                slug: 'payment-billing-late-overdue',
                color: '#FF8787',
                description: 'Handling of late or overdue payment situations'
            },
            {
                label: 'Payment Setup/Arrangement',
                slug: 'payment-billing-setup-arrangement',
                color: '#FFA3A3',
                description: 'Setting up new payment methods or payment arrangements'
            },
            {
                label: 'Billing Confusions/Inquiry',
                slug: 'payment-billing-confusions-inquiry',
                color: '#FFBFBF',
                description: 'General billing questions and clarifications'
            },
            {
                label: 'Refunds & Credits',
                slug: 'payment-billing-refunds-credits',
                color: '#FFDBDB',
                description: 'Processing refunds and applying account credits'
            }
        ]
    },
    {
        label: 'Services & Plans',
        slug: 'services-plans',
        color: '#4ECDC4',
        description: 'Service offerings and plan management',
        children: [
            {
                label: 'New Service Enrollment',
                slug: 'services-new-enrollment',
                color: '#6ED7D0',
                description: 'New customer sign-ups and service initiations'
            },
            {
                label: 'Plan Upgrade/Downgrade',
                slug: 'services-plan-change',
                color: '#8EE1DC',
                description: 'Modifications to existing service plans'
            },
            {
                label: 'Promotions & Discounts',
                slug: 'services-promotions-discounts',
                color: '#AEEBE8',
                description: 'Special offers and promotional inquiries'
            }
        ]
    },
    {
        label: 'Technical Issues',
        slug: 'technical-issues',
        color: '#45B7D1',
        description: 'Technical problems and troubleshooting',
        children: [
            {
                label: 'Internet Connectivity Problems',
                slug: 'technical-internet-connectivity',
                color: '#67C5DA',
                description: 'Internet connection issues and troubleshooting'
            },
            {
                label: 'Equipment/Modem Issues',
                slug: 'technical-equipment-modem',
                color: '#89D3E3',
                description: 'Hardware-related problems and solutions'
            },
            {
                label: 'Service Outages',
                slug: 'technical-service-outage',
                color: '#ABE1EC',
                description: 'Service interruptions and outage reports'
            }
        ]
    },
    {
        label: 'Account Management',
        slug: 'account-management',
        color: '#96CEB4',
        description: 'Account-related tasks and management',
        children: [
            {
                label: 'Profile / Contact Updates',
                slug: 'account-management-profile-contact-updates',
                color: '#ABD7C3',
                description: 'Updates to customer profile and contact information'
            },
            {
                label: 'Contract & Policy',
                slug: 'account-management-contract-policy',
                color: '#C0E0D2',
                description: 'Contract terms and policy discussions'
            },
            {
                label: 'Account Reviews / Summaries',
                slug: 'account-management-reviews-summaries',
                color: '#D5E9E1',
                description: 'Account overview and status reviews'
            }
        ]
    },
    {
        label: 'Customer Service & Sentiment',
        slug: 'customer-service-sentiment',
        color: '#FFD93D',
        description: 'Customer interaction types and call handling',
        children: [
            {
                label: 'Praise',
                slug: 'customer-service-praise',
                color: '#FFE065',
                description: 'Customer explicitly praised service or company'
            },
            {
                label: 'Complaints',
                slug: 'customer-service-complaints',
                color: '#FFE78D',
                description: 'Customer expressed specific complaints or dissatisfaction'
            },
            {
                label: 'Profanity',
                slug: 'customer-service-profanity',
                color: '#FFEEB5',
                description: 'Call contained profanity or inappropriate language'
            },
            {
                label: 'Automated Only',
                slug: 'customer-service-automated',
                color: '#FFF5DD',
                description: 'Call handled entirely by automated system'
            },
            {
                label: 'Human Answered',
                slug: 'customer-service-human',
                color: '#FFF8E7',
                description: 'Call was handled by a human representative'
            }
        ]
    },
    {
        label: 'Additional / Specialized Categories',
        slug: 'additional-specialized',
        color: '#A084DC',
        description: 'Specialized and additional case categories',
        children: [
            {
                label: 'Legal / Regulatory',
                slug: 'additional-legal-regulatory',
                color: '#B39DE3',
                description: 'Legal and regulatory related matters'
            },
            {
                label: 'Technical/System Issues beyond connectivity',
                slug: 'additional-technical-system-issues',
                color: '#C6B6EA',
                description: 'Advanced technical issues beyond basic connectivity'
            },
            {
                label: 'Staffing / HR',
                slug: 'additional-staffing-hr',
                color: '#D9CFF1',
                description: 'Staffing and human resources related matters'
            }
        ]
    },
    {
        label: 'Sales Interactions',
        slug: 'sales-interactions',
        color: '#6366F1',
        description: 'Sales calls and related interactions',
        children: [
            {
                label: 'Completed Sales',
                slug: 'sales-completed',
                color: '#818CF8',
                description: 'Successfully completed sales calls'
            },
            {
                label: 'Product Questions',
                slug: 'sales-product-questions',
                color: '#A5B4FC',
                description: 'Questions about products and services during sales calls'
            },
            {
                label: 'Pricing Questions',
                slug: 'sales-pricing-questions',
                color: '#C7D2FE',
                description: 'Questions about pricing and plans during sales calls'
            },
            {
                label: 'Advertisement Related',
                slug: 'sales-advertisement-related',
                color: '#E0E7FF',
                description: 'Inquiries stemming from specific advertisements or promotions'
            }
        ]
    },
    {
        label: 'Customer Questions',
        slug: 'customer-questions',
        color: '#EC4899',
        description: 'Specific types of customer inquiries',
        children: [
            {
                label: 'Product Features',
                slug: 'questions-product-features',
                color: '#F472B6',
                description: 'Questions about specific product features or capabilities'
            },
            {
                label: 'Comparison Questions',
                slug: 'questions-comparison',
                color: '#F9A8D4',
                description: 'Questions comparing different products or services'
            },
            {
                label: 'Technical Requirements',
                slug: 'questions-technical-requirements',
                color: '#FBCFE8',
                description: 'Questions about technical requirements or compatibility'
            },
            {
                label: 'Landing Page Related',
                slug: 'questions-landing-page',
                color: '#FCE7F3',
                description: 'Questions about information from landing pages'
            }
        ]
    }
]

export default tagStructure
