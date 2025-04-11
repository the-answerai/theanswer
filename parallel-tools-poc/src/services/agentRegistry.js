/**
 * Agent Registry
 * Manages all available agents and provides access to them
 */
import SpecialistAgent from '../agents/specialistAgent.js'

class AgentRegistry {
    constructor(apiKey) {
        this.apiKey = apiKey
        this.agents = new Map()
        this.initializeSpecialists()
    }

    /**
     * Initialize specialist agents
     */
    initializeSpecialists() {
        // Create weather specialist
        this.registerAgent('weather', new SpecialistAgent(this.apiKey, 'weather'))

        // Create math specialist
        this.registerAgent('math', new SpecialistAgent(this.apiKey, 'math'))

        // Create database specialist
        this.registerAgent('database', new SpecialistAgent(this.apiKey, 'database'))

        console.log(`Initialized ${this.agents.size} specialist agents`)
    }

    /**
     * Register a new agent
     * @param {string} name - The agent's name
     * @param {Object} agent - The agent instance
     */
    registerAgent(name, agent) {
        this.agents.set(name, agent)
        return this
    }

    /**
     * Get an agent by name
     * @param {string} name - The agent's name
     * @returns {Object} - The agent instance
     */
    getAgent(name) {
        const agent = this.agents.get(name)
        if (!agent) {
            throw new Error(`Agent '${name}' not found`)
        }
        return agent
    }

    /**
     * Get all registered agents
     * @returns {Array} - Array of agent names
     */
    getAgentNames() {
        return Array.from(this.agents.keys())
    }

    /**
     * Create a "talk to agent" tool that allows the generalist to call specialists
     * @returns {Object} - A tool object that can be used by the generalist
     */
    createTalkToAgentTool() {
        const agentNames = this.getAgentNames()

        return {
            name: 'talkToAgent',
            description: `Call a specialist agent for domain-specific analysis. Available agents: ${agentNames.join(', ')}`,
            schema: {
                type: 'object',
                properties: {
                    agentName: {
                        type: 'string',
                        enum: agentNames,
                        description: 'The name of the specialist agent to call'
                    },
                    message: {
                        type: 'string',
                        description: 'The message or question to send to the specialist agent'
                    }
                },
                required: ['agentName', 'message']
            },
            _call: async (args) => {
                const { agentName, message } = args
                const agent = this.getAgent(agentName)
                return await agent.run(message)
            }
        }
    }
}

export default AgentRegistry
