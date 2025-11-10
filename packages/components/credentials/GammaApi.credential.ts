import { INodeCredential, INodeParams } from '../src/Interface'

class GammaApi implements INodeCredential {
    label: string
    name: string
    version: number
    description?: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Gamma API'
        this.name = 'gammaApi'
        this.version = 1.0
        this.description = 'Authentication for Gamma public API. Provide your API key.'
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                placeholder: 'sk-gamma-xxxxxxxx'
            },
            {
                label: 'Base URL',
                name: 'baseUrl',
                type: 'string',
                optional: true,
                default: 'https://public-api.gamma.app'
            }
        ]
    }
}

module.exports = { credClass: GammaApi }
