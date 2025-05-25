// Updated tag configuration for RDS POS AI Assistant
// Removed Call Outcome category as it's now handled by resolution_status field

export const tagStructure = [
    {
        label: 'Issue Type',
        slug: 'issue-type',
        color: '#FF6B6B',
        description: 'Categorizes the core technical problem experienced during the call.',
        children: [
            {
                label: 'Printer Problem',
                slug: 'issue-printer',
                color: '#FF8787',
                description: 'Receipt, label, or kitchen printer not working, jamming, or misprinting.'
            },
            {
                label: 'Login/Authentication Issue',
                slug: 'issue-login-auth',
                color: '#FFA3A3',
                description: 'User cannot log in, forgot password, or system is locking out users.'
            },
            {
                label: 'POS Hardware Malfunction',
                slug: 'issue-pos-hardware',
                color: '#FFBFBF',
                description: 'Terminal will not boot, touchscreen unresponsive, or physical issues with POS.'
            },
            {
                label: 'Payment Device Error',
                slug: 'issue-payment-device',
                color: '#FFDBDB',
                description: 'Card reader or pinpad fails, freezes, or will not read cards.'
            },
            {
                label: 'System Freeze/Crash',
                slug: 'issue-system-crash',
                color: '#FFE5E5',
                description: 'POS software freezes or crashes during normal operation.'
            }
        ]
    },
    {
        label: 'Agent Coaching Indicators',
        slug: 'agent-coaching',
        color: '#FBBF24',
        description: 'Flags for agent behavior and quality monitoring.',
        children: [
            {
                label: 'Filler Language',
                slug: 'coaching-filler-language',
                color: '#FCD34D',
                description: 'Agent frequently says "I think", "maybe", or other filler language.'
            },
            {
                label: 'Uncertainty/Confusion',
                slug: 'coaching-uncertain',
                color: '#FDE68A',
                description: 'Agent sounds unsure or confused about issue or solution path.'
            },
            {
                label: 'Ticket-Call Mismatch',
                slug: 'coaching-ticket-mismatch',
                color: '#FEF3C7',
                description: 'Transcript resolution does not match ticket resolution notes.'
            },
            {
                label: 'Minimal Engagement',
                slug: 'coaching-minimal-engagement',
                color: '#FFF7E1',
                description: 'Agent avoids deep troubleshooting; brief or unengaged interaction.'
            },
            {
                label: 'Successful Troubleshooting',
                slug: 'coaching-successful-troubleshoot',
                color: '#FFF7D6',
                description: 'Agent successfully diagnosed and resolved the issue through effective troubleshooting.'
            }
        ]
    },
    {
        label: 'Customer Experience',
        slug: 'customer-experience',
        color: '#A78BFA',
        description: 'Tracks how the customer felt and responded during the interaction.',
        children: [
            {
                label: 'Customer Dissatisfied',
                slug: 'cx-dissatisfied',
                color: '#C4B5FD',
                description: 'Customer expressed frustration or discontent, either verbally or tonally.'
            },
            {
                label: 'Customer Profanity',
                slug: 'cx-profanity',
                color: '#DDD6FE',
                description: 'Call includes profanity, regardless of context (anger or rapport).'
            },
            {
                label: 'Requested Manager',
                slug: 'cx-requested-manager',
                color: '#EDE9FE',
                description: 'Caller asked to speak to a supervisor or higher authority.'
            },
            {
                label: 'Positive Outcome',
                slug: 'cx-positive',
                color: '#F5F3FF',
                description: 'Customer expressed satisfaction, thanks, or closure at end of call.'
            },
            {
                label: 'Recurring Problem',
                slug: 'cx-recurring-problem',
                color: '#E9E3FF',
                description: 'Customer indicates this is a repeated or ongoing issue they have experienced before.'
            }
        ]
    },
    {
        label: 'Training & Documentation Gaps',
        slug: 'training-docs-gap',
        color: '#10B981',
        description: 'Identifies issues that could be solved with better training or documentation.',
        children: [
            {
                label: 'Password Reset',
                slug: 'gap-password-reset',
                color: '#34D399',
                description: 'Call was solely for a password reset or login assistance.'
            },
            {
                label: 'Basic How-To Request',
                slug: 'gap-basic-howto',
                color: '#6EE7B7',
                description: 'Caller needs guidance on using a feature or performing a routine task.'
            },
            {
                label: 'Internal Documentation Needed',
                slug: 'gap-internal-docs',
                color: '#A7F3D0',
                description: 'Support team lacks proper documentation for troubleshooting or requires escalation procedures.'
            }
        ]
    }
]

export default tagStructure
