// Tag configuration for RDS POS AI Assistant
// Streamlined for high-impact tagging and reporting based on feedback from RDS team

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
                description: 'User can’t log in, forgot password, or system is locking out users.'
            },
            {
                label: 'POS Hardware Malfunction',
                slug: 'issue-pos-hardware',
                color: '#FFBFBF',
                description: 'Terminal won’t boot, touchscreen unresponsive, or physical issues with POS.'
            },
            {
                label: 'Payment Device Error',
                slug: 'issue-payment-device',
                color: '#FFDBDB',
                description: 'Card reader or pinpad fails, freezes, or won’t read cards.'
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
        label: 'Call Outcome',
        slug: 'call-outcome',
        color: '#4ECDC4',
        description: 'Tracks how the call was resolved or escalated.',
        children: [
            {
                label: 'Resolved On Call',
                slug: 'outcome-resolved',
                color: '#6ED7D0',
                description: 'Issue was resolved during the initial call with no follow-up required.'
            },
            {
                label: 'Dispatch Without Troubleshooting',
                slug: 'outcome-dispatch-no-troubleshoot',
                color: '#8EE1DC',
                description: 'Tech dispatched immediately without diagnostic steps taken.'
            },
            {
                label: 'Reboot as Resolution',
                slug: 'outcome-reboot-fix',
                color: '#AEEBE8',
                description: 'Issue was resolved solely by rebooting hardware or system.'
            },
            {
                label: 'Escalated to Tier 2',
                slug: 'outcome-escalated-tier2',
                color: '#CEF5F2',
                description: 'Call was escalated beyond Level 1 to Tier 2 or higher.'
            },
            {
                label: 'Repeat Issue',
                slug: 'outcome-repeat-call',
                color: '#DFF8F5',
                description: 'Same issue previously reported; caller references earlier interaction.'
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
                description: 'Agent frequently says “I think”, “maybe”, or other filler language.'
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
                label: 'Documentation Needed',
                slug: 'gap-doc-needed',
                color: '#A7F3D0',
                description: 'Call addresses an issue not documented or confusing to the user.'
            },
            {
                label: 'After Hours Call',
                slug: 'gap-after-hours',
                color: '#D1FAE5',
                description: 'Support call occurs after business hours and could have been self-serviced.'
            }
        ]
    }
]

export default tagStructure
