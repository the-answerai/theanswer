import { INodeParams, INodeCredential } from '../src/Interface'

class FiddlerApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Fiddler AI API'
        this.name = 'fiddlerApi'
        this.version = 1.0
        this.description = 'Fiddler AI Guardrails API credentials'
        this.inputs = [
            {
                label: 'Fiddler API Key',
                name: 'fiddlerApiKey',
                type: 'password',
                placeholder: 'fiddler_api_key_...'
            },
            {
                label: 'Fiddler API URL',
                name: 'fiddlerApiUrl',
                type: 'string',
                default: 'https://guardrails.cloud.fiddler.ai',
                placeholder: 'https://guardrails.cloud.fiddler.ai'
            }
        ]
    }
}

module.exports = { credClass: FiddlerApi }
