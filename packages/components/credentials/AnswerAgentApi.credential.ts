import { INodeParams, INodeCredential } from '../src/Interface'

class AnswerAgentApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'AnswerAgent API'
        this.name = 'answerAgentApi'
        this.version = 1.0
        this.description = 'You can find your API key in <a target="_blank" href="/sidekick-studio/apikey">API Keys</a> settings'
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                placeholder: 'your-api-key'
            },
            {
                label: 'Instance Domain',
                name: 'instanceDomain',
                type: 'string',
                optional: true,
                default: process.env.API_HOST || process.env.FLOWISE_DOMAIN || '',
                placeholder: 'https://your-instance.answerai.com',
                description:
                    'The domain of the AnswerAgent instance to connect to. Change this to connect to a different AnswerAgent instance.'
            }
        ]
    }
}

module.exports = { credClass: AnswerAgentApi }
