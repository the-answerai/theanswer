#!/usr/bin/env node

/**
 * Stream Testing Script for TheAnswer API
 *
 * Usage:
 *   node scripts/test-streaming.mjs <chatflow-id> [question] [domain]
 *
 * Examples:
 *   node scripts/test-streaming.mjs ff999dd8-5a00-4b24-9c7e-65c1f2b43bdc
 *   node scripts/test-streaming.mjs ff999dd8-5a00-4b24-9c7e-65c1f2b43bdc "What is AI?"
 *   node scripts/test-streaming.mjs ff999dd8-5a00-4b24-9c7e-65c1f2b43bdc "Hello" api.kumello.theanswer.ai
 */

import { randomUUID } from 'crypto'

// ANSI color codes for better visibility
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m'
}

// Parse command line arguments
const args = process.argv.slice(2)
let verbose = false

// Check for verbose flag
const verboseIndex = args.findIndex((arg) => arg === '--verbose' || arg === '-v')
if (verboseIndex !== -1) {
    verbose = true
    args.splice(verboseIndex, 1)
}

const chatflowId = args[0]
const question = args[1] || 'Medical devices for cardiac monitoring'
const domain = args[2] || 'localhost:4000'

if (!chatflowId) {
    console.error(`${colors.red}Error: Chatflow ID is required${colors.reset}`)
    console.log(`\nUsage: node scripts/test-streaming.mjs [--verbose|-v] <chatflow-id> <domain-to-research> [server-domain]`)
    console.log(
        `\nExample: node scripts/test-streaming.mjs 8e56531d-f396-4afa-a864-fcea5dd97ab6 "Medical devices for cardiac monitoring" localhost:4000`
    )
    console.log(`         node scripts/test-streaming.mjs --verbose 8e56531d-f396-4afa-a864-fcea5dd97ab6 "Wearable glucose monitors"`)
    process.exit(1)
}

const chatId = randomUUID()
const protocol = domain.includes('localhost') ? 'http' : 'https'
const url = `${protocol}://${domain}/api/v1/prediction/${chatflowId}`

console.log(`\n${colors.bright}=== TheAnswer Research Agent ===${colors.reset}`)
if (verbose) {
    console.log(`${colors.cyan}URL:${colors.reset}                ${url}`)
    console.log(`${colors.cyan}Chat ID:${colors.reset}            ${chatId}`)
}
console.log(`${colors.cyan}Research Domain:${colors.reset}    ${question}`)
console.log(`${colors.cyan}Mode:${colors.reset}               ${verbose ? 'Verbose' : 'User-friendly'}`)
console.log(`${colors.bright}=====================================${colors.reset}\n`)

const payload = {
    question: question,
    streaming: true,
    chatId: chatId
}

// Track streaming state
let fullResponse = ''
let eventCounts = {}
let startTime = Date.now()
let currentNode = null
let researchQuestions = null

// Parse SSE events
function parseSSE(chunk) {
    const lines = chunk.split('\n')
    const events = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.startsWith('data:')) {
            const data = line.substring(5).trim()
            if (data && data !== '[DONE]') {
                try {
                    const parsed = JSON.parse(data)
                    events.push(parsed)
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    return events
}

// Display event in a user-friendly way
function displayEvent(event) {
    const { event: eventType, data } = event

    // Count events
    eventCounts[eventType] = (eventCounts[eventType] || 0) + 1

    // User-friendly mode - simplified output
    if (!verbose) {
        switch (eventType) {
            case 'nextAgentFlow':
                if (data.status === 'INPROGRESS') {
                    currentNode = data.nodeLabel
                    process.stdout.write(`\n${colors.cyan}▶${colors.reset} ${data.nodeLabel}...`)
                } else if (data.status === 'FINISHED') {
                    process.stdout.write(` ${colors.green}✓${colors.reset}`)
                } else if (data.status === 'ERROR') {
                    process.stdout.write(` ${colors.red}✗${colors.reset}`)
                    if (data.error) {
                        console.log(`\n  ${colors.red}Error: ${data.error}${colors.reset}`)
                    }
                } else if (data.status === 'STOPPED') {
                    process.stdout.write(` ${colors.yellow}⏸${colors.reset}`)
                }
                break

            case 'agentFlowExecutedData':
                // Extract research questions from the executed data
                if (Array.isArray(data)) {
                    const researchPrepNode = data.find((node) => node.nodeLabel === 'Research Prep')
                    if (researchPrepNode?.output?.content) {
                        try {
                            const parsed = JSON.parse(researchPrepNode.output.content)
                            if (parsed.questions && !researchQuestions) {
                                researchQuestions = parsed.questions
                                console.log(
                                    `\n\n${colors.bright}📋 Generated ${researchQuestions.length} Research Questions${colors.reset}`
                                )
                            }
                        } catch (e) {}
                    }
                }
                break

            case 'action':
                console.log(`\n\n${colors.yellow}⏸ Waiting for approval...${colors.reset}`)
                if (data.data?.input?.messages) {
                    const systemMsg = data.data.input.messages.find((m) => m.role === 'system')
                    if (systemMsg) {
                        console.log(`${colors.gray}${systemMsg.content}${colors.reset}`)
                    }
                }
                break

            case 'error':
                console.log(`\n\n${colors.red}❌ Error: ${data}${colors.reset}`)
                break

            case 'metadata':
                // Show metadata at the end
                break

            case 'end':
                const duration = ((Date.now() - startTime) / 1000).toFixed(2)
                console.log(`\n\n${colors.bright}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
                if (researchQuestions && researchQuestions.length > 0) {
                    console.log(`\n${colors.bright}📋 Research Questions Generated:${colors.reset}`)
                    researchQuestions.forEach((q, i) => {
                        console.log(`\n${colors.cyan}${i + 1}.${colors.reset} ${q}`)
                    })
                }
                console.log(`\n${colors.bright}⏱  Duration:${colors.reset} ${duration}s`)
                console.log(`${colors.gray}💡 Tip: Use --verbose flag to see detailed event logs${colors.reset}`)
                break
        }
        return
    }

    // Verbose mode - show everything
    switch (eventType) {
        case 'start':
            console.log(`${colors.green}▶ START${colors.reset} ${colors.gray}${data}${colors.reset}`)
            break

        case 'token':
            // Accumulate tokens and display inline
            fullResponse += data
            process.stdout.write(`${colors.bright}${data}${colors.reset}`)
            break

        case 'metadata':
            console.log(`\n\n${colors.cyan}ℹ METADATA${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'sourceDocuments':
            console.log(`\n\n${colors.blue}📄 SOURCE DOCUMENTS (${data.length})${colors.reset}`)
            data.forEach((doc, i) => {
                console.log(`  ${i + 1}. ${doc.metadata?.source || 'Unknown source'}`)
            })
            break

        case 'usedTools':
            console.log(`\n\n${colors.magenta}🔧 TOOLS USED (${data.length})${colors.reset}`)
            data.forEach((tool) => {
                console.log(`  • ${tool.tool || tool}`)
            })
            break

        case 'calledTools':
            console.log(`\n\n${colors.magenta}🔧 TOOLS CALLED${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'agentReasoning':
            console.log(`\n\n${colors.yellow}💭 AGENT REASONING${colors.reset}`)
            console.log(`  ${data}`)
            break

        case 'nextAgent':
            console.log(`\n\n${colors.yellow}➡ NEXT AGENT: ${data}${colors.reset}`)
            break

        case 'agentFlowEvent':
            console.log(`\n\n${colors.yellow}🔄 AGENT FLOW EVENT${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'agentFlowExecutedData':
            console.log(`\n\n${colors.yellow}✓ AGENT FLOW EXECUTED${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'nextAgentFlow':
            console.log(`\n\n${colors.yellow}➡ NEXT AGENT FLOW${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'action':
            console.log(`\n\n${colors.blue}⚡ ACTION${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'artifacts':
            console.log(`\n\n${colors.blue}📦 ARTIFACTS${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'fileAnnotations':
            console.log(`\n\n${colors.blue}📎 FILE ANNOTATIONS${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'usageMetadata':
            console.log(`\n\n${colors.gray}📊 USAGE METADATA${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
            break

        case 'error':
            console.log(`\n\n${colors.red}❌ ERROR: ${data}${colors.reset}`)
            break

        case 'end':
            const duration = ((Date.now() - startTime) / 1000).toFixed(2)
            console.log(`\n\n${colors.green}■ END${colors.reset} ${colors.gray}${data}${colors.reset}`)
            console.log(`\n${colors.bright}=== Summary ===${colors.reset}`)
            console.log(`${colors.cyan}Duration:${colors.reset} ${duration}s`)
            console.log(`${colors.cyan}Response Length:${colors.reset} ${fullResponse.length} characters`)
            console.log(`${colors.cyan}Event Counts:${colors.reset}`)
            Object.entries(eventCounts).forEach(([type, count]) => {
                console.log(`  • ${type}: ${count}`)
            })
            break

        case 'abort':
            console.log(`\n\n${colors.yellow}⏸ ABORTED${colors.reset}`)
            break

        default:
            console.log(`\n\n${colors.gray}● ${eventType.toUpperCase()}${colors.reset}`)
            console.log(JSON.stringify(data, null, 2))
    }
}

// Main streaming function
async function streamPrediction() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        if (!response.body) {
            throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        if (verbose) {
            console.log(`${colors.bright}📡 Streaming Response:${colors.reset}\n`)
        }

        while (true) {
            const { done, value } = await reader.read()

            if (done) {
                break
            }

            buffer += decoder.decode(value, { stream: true })

            // Process complete SSE messages
            const events = parseSSE(buffer)
            events.forEach(displayEvent)

            // Keep incomplete message in buffer
            const lastNewline = buffer.lastIndexOf('\n\n')
            if (lastNewline !== -1) {
                buffer = buffer.substring(lastNewline + 2)
            }
        }

        if (verbose) {
            console.log(`\n${colors.bright}==================================${colors.reset}\n`)
        }
    } catch (error) {
        console.error(`\n${colors.red}Error:${colors.reset}`, error.message)
        process.exit(1)
    }
}

// Run the stream
streamPrediction()
