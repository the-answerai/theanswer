export interface WebinarConfig {
    // Basic webinar details
    webinarDate: string
    webinarTime: string
    webinarDateTimeISO: string
    maxSeats: number
    currentRegistrations: number
    registrationLabel?: string
    scarcity?: {
        totalSeats: number
        registrationDeadline: string
        urgencyMessages: string[]
    }
    limitedBonus?: {
        headline: string
        subhead: string
        perks: string[]
    }
    pressFeatures?: Array<{
        name: string
        logo?: string
        url?: string
        label?: string
    }>
    hostHighlights?: Array<{
        speaker: string
        highlight: string
    }>
    testimonialQuotes?: Array<{
        quote: string
        author: string
        role?: string
        company: string
    }>
    roadmap?: Array<{
        phase: string
        duration: string
        outcomes: string[]
    }>
    toolkitPreview?: Array<{
        title: string
        description: string
        asset?: string
    }>
    introVideo?: {
        url: string
        caption?: string
    }

    // Headlines for A/B testing
    headlines: {
        primary: string
        alternate1: string
        alternate2: string
    }

    // Customer success stories
    customerStats: {
        [key: string]: {
            saved?: string
            roi?: string
            deployment?: string
            systems?: string
            reps?: string
            search?: string
            [key: string]: string | undefined
        }
    }

    // Speaker information
    speakers: Array<{
        name: string
        title: string
        bio: string
        image?: string
    }>

    // Form configuration
    formFields: {
        requiredFields: string[]
        optionalFields: string[]
    }

    // Content sections
    problems: Array<{
        icon: string
        title: string
        description: string
    }>

    framework: Array<{
        week: number
        title: string
        description: string
        deliverables: string[]
    }>

    customerStories: Array<{
        company: string
        logo: string
        industry: string
        challenge: string
        solution: string
        results: string[]
        metrics: string
    }>

    agenda: Array<{
        time: string
        topic: string
        description: string
    }>

    faqs: Array<{
        question: string
        answer: string
    }>
}

// Helper function to get the next Thursday at 11am PT
const getNextThursdayAt11PT = (): Date => {
    const now = new Date()
    const result = new Date(now)

    // Get day of week (0 = Sunday, 4 = Thursday)
    const currentDay = result.getDay()
    const daysUntilThursday = (4 - currentDay + 7) % 7 || 7 // If it's Thursday, get next Thursday

    // Set to next Thursday
    result.setDate(result.getDate() + daysUntilThursday)

    // Set time to 11:00 AM PT (18:00 UTC or 19:00 UTC depending on DST)
    // For simplicity, we'll use 18:00 UTC (11:00 AM PST / PDT varies)
    result.setUTCHours(18, 0, 0, 0)

    // If we're past 11am PT on Thursday, move to next week
    if (daysUntilThursday === 0 && now > result) {
        result.setDate(result.getDate() + 7)
    }

    return result
}

// Dynamic date calculation
const nextWebinar = getNextThursdayAt11PT()
const webinarDateFormatted = nextWebinar.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
})

export const webinarConfig: WebinarConfig = {
    // Basic webinar details - DYNAMICALLY CALCULATED
    webinarDate: webinarDateFormatted,
    webinarTime: '11:00 AM PT',
    webinarDateTimeISO: nextWebinar.toISOString(),
    maxSeats: 200,
    currentRegistrations: 147, // Update this number regularly to show social proof
    registrationLabel: '147 IT leaders, CTOs, and operations executives already registered',
    scarcity: {
        totalSeats: 200,
        registrationDeadline: new Date(nextWebinar.getTime() - 60000).toISOString(), // 1 minute before start
        urgencyMessages: [
            "Only {remainingSeats} seats left for Thursday's live session",
            'Registration closes Thursday at 11:00 AM PT',
            '⚡ Limited seating — save your spot now'
        ]
    },
    limitedBonus: {
        headline: '⚡ Only 10 CEO Strategy Sessions Available This Month',
        subhead: 'First 50 registrants get priority access:',
        perks: [
            '1:1 Strategy Session with Brad Taylor (CEO) — discuss your specific AI challenges and get personalized guidance (only 10 slots available per month)',
            'Priority Q&A during live session — your questions answered first by our founding team',
            'Early notification for future sessions in our bi-weekly educational series before they fill up'
        ]
    },
    pressFeatures: [
        { name: 'Based on MIT Research', label: '📊 MIT Project NANDA Research' },
        { name: '$30-40B Enterprise AI Investment', label: '💰 $30-40B Industry Analysis' },
        { name: 'Real Implementation Data', label: '📈 Real Success/Failure Data' },
        { name: 'Bi-weekly Educational Series', label: '🎓 Ongoing Education Series' }
    ],
    hostHighlights: [
        {
            speaker: 'Brad Taylor',
            highlight: 'Former Optimizely executive • 340% conversion rate improvement • Founded multiple tech companies'
        },
        {
            speaker: 'Adam Harris',
            highlight: 'Former Google DoubleClick Lead • 20+ years scaling enterprise platforms • Operations expert'
        },
        { speaker: 'Max Techera', highlight: 'Architected AnswerAI platform • Built Last Rev framework • Powers enterprise AI deployments' }
    ],
    testimonialQuotes: [
        {
            quote: '"This framework finally explained why our three AI pilots never made it to production. The learning gap concept was our missing piece — we were deploying static systems expecting adaptive results."',
            author: 'VP of IT Innovation',
            role: 'Enterprise Technology',
            company: 'Fortune 500 AdTech Company'
        },
        {
            quote: '"Understanding the 2x success rate for partnerships vs internal builds completely changed our strategy. We stopped trying to build everything in-house and focused our team on what they do best."',
            author: 'Chief Technology Officer',
            role: 'Financial Services',
            company: 'Leading Private Equity Firm'
        },
        {
            quote: '"The Shadow AI data was eye-opening — 90% using unsanctioned tools meant we had huge demand we weren\'t meeting. Instead of fighting it, we channeled that energy into sanctioned, secure alternatives."',
            author: 'Chief Information Security Officer',
            role: 'Healthcare Technology',
            company: 'Multi-Regional Healthcare Provider'
        }
    ],
    roadmap: [
        {
            phase: 'Barrier 1',
            duration: 'The GenAI Divide',
            outcomes: [
                'Why 95% of AI projects fail to deliver ROI despite $30-40B investment',
                'The gap between pilot activity and production deployment',
                'How to identify if your initiatives are trapped in pilot purgatory'
            ]
        },
        {
            phase: 'Barrier 2',
            duration: 'The Learning Gap',
            outcomes: [
                'Why static AI systems stall: no memory, context, or improvement over time',
                'What learning-capable systems look like and why they succeed',
                'How to evaluate if your AI tools can actually adapt to your business'
            ]
        },
        {
            phase: 'Barrier 3',
            duration: 'Shadow AI Risk',
            outcomes: [
                '90% of employees using unsanctioned AI tools — the security/compliance threat',
                'Why Shadow AI reveals massive unmet demand you can capitalize on',
                'How to provide enterprise-grade alternatives that employees actually want to use'
            ]
        },
        {
            phase: 'Solution',
            duration: 'Crossing the Divide',
            outcomes: [
                'The winning formula: Adaptive AI + Strategic Partnerships (2x success rate)',
                'Why back-office automation delivers higher ROI than front-office pilots',
                'Your next steps: framework to assess and improve your AI initiatives'
            ]
        }
    ],
    toolkitPreview: [],
    introVideo: {
        url: 'https://www.youtube-nocookie.com/embed/TODO_REPLACE_WITH_WEBINAR_INTRO',
        caption: 'Bradley Taylor shares what you’ll accomplish in this 60-minute working session (replace with final video).'
    },

    // Headlines - easily A/B testable
    headlines: {
        primary: 'Bridging the GenAI Divide: How to Join the 5% That Succeed',
        alternate1: "Why 95% of GenAI Projects Fail - And How to Be in the 5% That Don't",
        alternate2: 'From Pilot Purgatory to Production: The GenAI Success Playbook'
    },

    // Customer success metrics - UPDATE THESE EASILY
    customerStats: {
        financial: {
            saved: 'Target: 100+ hours/week',
            roi: 'Projected 6-figure annual savings',
            deployment: '8-12 weeks typical',
            systems: 'Automating repetitive document processing'
        },
        adtech: {
            deployment: '4-6 weeks',
            systems: 'Consolidating multiple data sources',
            roi: 'Targeting 30%+ faster resolution'
        },
        healthcare: {
            reps: 'Multiple teams in pilot',
            search: 'Dramatically improved search times',
            roi: 'Freeing teams for strategic initiatives'
        },
        telecom: {
            conversion: 'Active POC in progress',
            roi: 'Workflow automation underway'
        },
        saas: {
            systems: 'Unifying scattered knowledge bases',
            roi: 'AI-powered instant responses in testing'
        }
    },

    // Speaker info - UPDATE BIOS/IMAGES HERE
    speakers: [
        {
            name: 'Brad Taylor',
            title: 'CEO & Co-Founder',
            bio: 'Founder & CEO of AnswerAI and Co-Founder of Last Rev. Former Head of Web & Experimentation at Optimizely where he led a 340% increase in conversion rates. Built and sold multiple tech companies including 195Places. 15+ years pioneering advanced technology solutions and AI automation for enterprise clients.',
            image: '/img/brad-blackand-white.png'
        },
        {
            name: 'Adam Harris',
            title: 'COO & Co-Founder',
            bio: 'COO & Co-Founder with 20+ years in engineering, sales, and business development. Former Lead Product Evangelist at Google DoubleClick, Senior BD at Leap Motion. Led DoubleClick Rich Media to 200%+ growth. Expert in scaling SaaS platforms and enterprise digital transformation.'
        },
        {
            name: 'Max Techera',
            title: 'CTO & Co-Founder',
            bio: "CTO & Co-Founder, architected the entire AnswerAI platform from the ground up. Director of Engineering at Last Rev where he built the framework powering 10+ enterprise websites. Created the unified GraphQL data layer and AI orchestration system that enables AnswerAI's rapid 4-week deployments. Expert in React, Node.js, and enterprise-scale architectures."
        }
    ],

    // Form fields - ADD/REMOVE FIELDS EASILY
    formFields: {
        requiredFields: ['email'],
        optionalFields: []
    },

    // Problem section content
    problems: [
        {
            icon: '📉',
            title: 'The GenAI Divide: 95% Fail to Deliver ROI',
            description:
                'Despite $30-40 billion spent on enterprise AI, 95% of organizations see zero measurable ROI from GenAI initiatives. Only 5% of AI pilots make it to production and create real business value.'
        },
        {
            icon: '🧠',
            title: "The Learning Gap: Static Systems Don't Scale",
            description:
                "Most GenAI tools don't retain feedback, remember context, or improve over time. This brittleness leads to user frustration, low adoption, and projects stuck in pilot purgatory."
        },
        {
            icon: '👥',
            title: 'Shadow AI: 90% Using Unsanctioned Tools',
            description:
                'While official AI projects stall, 90% of employees use personal AI tools like ChatGPT for work, creating massive security, compliance, and data privacy risks.'
        }
    ],

    // 4-Week framework content
    framework: [
        {
            week: 1,
            title: 'Discovery & Strategy',
            description: 'Live demo of our enterprise AI assessment process',
            deliverables: [
                'AI readiness evaluation',
                'Use case prioritization',
                'Technical requirements analysis',
                'Success metrics definition'
            ]
        },
        {
            week: 2,
            title: 'Document & Tool Setup',
            description: 'Platform configuration and integration planning',
            deliverables: [
                'System integrations configured',
                'Data sources connected',
                'Security protocols established',
                'User access controls set'
            ]
        },
        {
            week: 3,
            title: 'Internal Testing & Iteration',
            description: 'Pilot deployment with real workflows',
            deliverables: ['Pilot user training', 'Workflow optimization', 'Performance monitoring', 'Feedback incorporation']
        },
        {
            week: 4,
            title: 'Launch & Optimization',
            description: 'Full deployment across organization',
            deliverables: ['Company-wide rollout', 'Success metrics tracking', 'Ongoing optimization', 'ROI measurement']
        }
    ],

    // Customer success stories with real metrics
    customerStories: [
        {
            company: 'Palatine Capital Partners',
            logo: '/img/customers/palatine-capital.png',
            industry: 'Private Equity / Real Estate Investment',
            challenge:
                '50-60 broker-blast emails flooding inbox daily. 120 analyst-hours per week on manual data entry, CA signing, and document processing.',
            solution:
                'Smart Intake Agent processes deal emails automatically. Document Extraction Agent reads financial/property data with confidence scoring. ROC Builder Service returns fully-populated models in <60 seconds.',
            results: [
                'Automated 50-60 daily broker emails',
                'Freed 4-5 FTEs for strategic underwriting work',
                '3x faster deal throughput (≤20 min per deal)',
                'GL bucket mis-classification <5%',
                '99.5% system uptime'
            ],
            metrics: '$312K+ annual savings from 120 analyst-hours/week automation'
        },
        {
            company: 'Integral Ad Science (IAS)',
            logo: '/img/customers/ias-logo.png',
            industry: 'Digital Advertising Technology',
            challenge:
                'Complex legal and compliance workflows. Information scattered across 6 different systems. Need for audit trails and governance in public company environment.',
            solution:
                '4-week rapid deployment with enterprise-grade security. Legal department automation for document processing. Multi-system integration with unified AI interface.',
            results: [
                '4-week deployment vs 6+ month industry standard',
                'Single AI interface replacing 6 scattered systems',
                'Legal automation with full compliance maintained',
                'High user adoption across legal and operations teams'
            ],
            metrics: '40% faster ticket resolution with 90% accuracy maintained'
        },
        {
            company: 'Moonstruck Medical',
            logo: '/img/customers/moonstruck-medical.png',
            industry: 'Medical Device / Pharmaceutical',
            challenge:
                '9 sales reps (1099 contractors) across locations with info silos. 5-6 new product lines monthly creating nonstop training demands. Documentation chaos across Google Drive, PDFs, emails.',
            solution:
                'Sales Cheat-Sheet Bot for instant product & pricing lookups. Rep Role-Play Coach for sales call simulation. Knowledge centralization across all documentation sources.',
            results: [
                'Search time: from minutes to seconds',
                'Single source of truth across 9 distributed reps',
                'Operations team freed for strategic work',
                'Consistent messaging eliminated info silos',
                'Automated onboarding for new product lines'
            ],
            metrics: 'Ops team capacity optimized, consistent revenue per rep through standardized messaging'
        },
        {
            company: 'WOW! Internet',
            logo: '/img/customers/wow-internet.png',
            industry: 'Telecommunications / Internet Services',
            challenge:
                'Customer support bottlenecks. Manual ticket routing and response. Need for scalable automation solution without massive upfront investment.',
            solution:
                '3-month $3K POC program with custom support agents. Live voice agents with CRM integration. Chrome extension for agent productivity.',
            results: [
                'Successfully completed POC in 90 days',
                'Moved to annual Enterprise License ($36K/year)',
                'Customer support response times improved',
                'Agent productivity increased through automation',
                'Unified customer data access across systems'
            ],
            metrics: 'POC converted to full implementation with measurable support efficiency gains'
        }
    ],

    // Webinar agenda
    agenda: [
        {
            time: '5 min',
            topic: 'Introduction & The GenAI Divide',
            description: 'Welcome and overview: Why 95% of GenAI projects fail to deliver ROI, and how to join the successful 5%'
        },
        {
            time: '7 min',
            topic: 'The GenAI Divide: Hype vs. Reality',
            description:
                "Data on GenAI failure rates, the gap between AI pilots and production deployments, and what's really holding organizations back"
        },
        {
            time: '7 min',
            topic: 'Why AI Pilots Stall: The Learning Gap',
            description: "Root causes of the 95% failure rate — static systems that don't learn, retain context, or improve over time"
        },
        {
            time: '5 min',
            topic: 'The Rise (and Risk) of Shadow AI',
            description:
                "90% of employees using unsanctioned AI tools: the massive demand signal and the security/compliance risks you can't ignore"
        },
        {
            time: '7 min',
            topic: 'Build vs. Buy: Why Internal AI Efforts Struggle',
            description: 'Why external partnerships succeed at 2x the rate of internal builds, and how to avoid the "build trap"'
        },
        {
            time: '8 min',
            topic: 'Crossing the Divide: Adaptive Tools + Deep Services',
            description:
                'The winning combination: learning-capable AI systems + expert integration services. Live demo of AnswerAgent + Last Rev approach'
        },
        {
            time: '6 min',
            topic: 'Q&A & Next Steps',
            description: 'Your questions answered. How to move from piloting to real results with a follow-up session and assessment'
        }
    ],

    // FAQ content addressing common objections
    faqs: [
        {
            question: "We've already tried AI pilots that went nowhere. How is this different?",
            answer: "That's the GenAI Divide in action — 95% of pilots fail because they use static systems without learning capability or proper integration. We focus on adaptive AI with memory and feedback loops, plus the deep services to embed it into your actual workflows. Our approach addresses the root causes MIT identified: the learning gap and lack of workflow integration."
        },
        {
            question: "Isn't this just more hype? How do we know you can deliver real results?",
            answer: "We start with pragmatic, back-office use cases where AI has proven ROI — finance, procurement, HR automation. MIT research shows these deliver higher returns than flashy front-office pilots. We'll show you exactly how organizations like yours achieved measurable results by focusing on practical automation first."
        },
        {
            question: 'Should we build this internally or work with a partner?',
            answer: 'MIT data shows external partnerships succeed at 2x the rate of internal builds (67% vs 33%). Most internal projects stall due to stretched teams, evolving AI landscape, and complex integrations. Partners bring specialized expertise, faster deployment, and continuous updates so you can focus on your business, not becoming an AI company.'
        },
        {
            question: 'What about Shadow AI? Our employees are already using ChatGPT — should we ban it?',
            answer: 'Shadow AI affects 90% of companies and banning rarely works long-term. The better approach: provide sanctioned, enterprise-grade AI tools that are just as easy to use but secure, compliant, and learning-capable. Give employees what they need within governance boundaries rather than driving them underground.'
        },
        {
            question: 'How do we handle security and compliance with AI?',
            answer: 'This is exactly why Shadow AI is so dangerous — employees using unsanctioned tools bypass all your controls. We help you deploy enterprise-grade AI with proper governance, audit trails, data residency, and compliance frameworks. Your data stays in your environment with full visibility and control.'
        },
        {
            question: 'Will this webinar be another vendor pitch?',
            answer: "No — this is an educational session based on MIT research and real implementation experience. We'll share the framework that separates the successful 5% from the failing 95%, whether you work with us or not. Our goal is to help you avoid pilot purgatory and achieve real AI transformation."
        }
    ]
}

// Helper function to get available seats
export const getAvailableSeats = () => {
    return webinarConfig.maxSeats - webinarConfig.currentRegistrations
}

// Helper function to get urgency messaging
export const getUrgencyMessage = () => {
    const available = getAvailableSeats()
    if (!webinarConfig.scarcity) {
        if (available <= 10) return `Only ${available} seats left!`
        if (available <= 50) return `${available} seats remaining`
        return `Limited to ${webinarConfig.maxSeats} seats`
    }

    const messageTemplate = webinarConfig.scarcity.urgencyMessages[0] || '{remainingSeats} seats remaining'
    return messageTemplate.replace('{remainingSeats}', available.toString())
}

// Helper to format webinar date/time
export const getWebinarDateTime = () => {
    return `${webinarConfig.webinarDate} at ${webinarConfig.webinarTime}`
}

export const getRegistrationDeadline = () => webinarConfig.scarcity?.registrationDeadline

export const getLocalWebinarDateTime = () => {
    try {
        const eventDate = new Date(webinarConfig.webinarDateTimeISO)
        if (Number.isNaN(eventDate.getTime())) {
            return getWebinarDateTime()
        }

        const dateFormatter = new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        })

        const timeFormatter = new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        })

        return `${dateFormatter.format(eventDate)} · ${timeFormatter.format(eventDate)}`
    } catch (error) {
        console.warn('Unable to format webinar datetime for locale', error)
        return getWebinarDateTime()
    }
}
