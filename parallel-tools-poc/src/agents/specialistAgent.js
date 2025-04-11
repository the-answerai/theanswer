/**
 * Specialist Agent
 * An agent that specializes in a specific domain and can be called by the Generalist agent
 */
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'

class SpecialistAgent {
    constructor(apiKey, domain, systemPrompt) {
        this.apiKey = apiKey
        this.domain = domain
        this.systemPrompt = systemPrompt || this.getDefaultSystemPrompt()

        this.model = new ChatOpenAI({
            apiKey: this.apiKey,
            modelName: 'gpt-4o',
            temperature: 0.2
        })
    }

    /**
     * Get the default system prompt based on the agent's domain
     */
    getDefaultSystemPrompt() {
        const domainPrompts = {
            weather: `You are a Weather Specialist AI. You analyze weather data and provide accurate interpretations.
When given weather information, provide insights like:
- What the weather means for daily activities
- Whether specific clothing or precautions are advised
- How the weather compares to typical conditions for that location

Keep your responses concise and practical.`,

            math: `You are a Mathematics Specialist AI. You interpret mathematical results and provide clear explanations.
When given mathematical calculations, provide insights like:
- A step-by-step explanation of how the result was obtained
- What the result means in practical terms
- Alternative approaches to the calculation if relevant

Be precise and educational in your responses.`,

            database: `You are a Database Specialist AI. You interpret database query results and provide meaningful insights.
When given database information, provide insights like:
- What the retrieved data indicates
- Potential relationships to other data
- Business or practical implications of the data

Be analytical and insightful in your responses.`
        }

        return domainPrompts[this.domain] || `You are a ${this.domain} Specialist AI. Provide expert analysis in your domain.`
    }

    /**
     * Create the prompt template
     */
    createPrompt() {
        return ChatPromptTemplate.fromMessages([
            ['system', this.systemPrompt],
            ['human', '{input}']
        ])
    }

    /**
     * Create the specialist chain
     */
    createChain() {
        const prompt = this.createPrompt()

        return RunnableSequence.from([
            {
                input: (input) => input
            },
            prompt,
            this.model
        ])
    }

    /**
     * Run the specialist agent with a specific query
     * @param {string} input - The input query from the Generalist agent
     * @returns {Object} - The specialist's response
     */
    async run(input) {
        console.log(`Running ${this.domain} Specialist agent with input: ${input}`)

        // Initialize chain
        const chain = this.createChain()

        // Get response
        const response = await chain.invoke({
            input
        })

        return {
            domain: this.domain,
            response,
            timestamp: new Date().toISOString()
        }
    }
}

export default SpecialistAgent
