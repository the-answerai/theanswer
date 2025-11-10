import { INodeParams, INodeCredential } from '../src/Interface'

class LinearApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Linear API'
        this.name = 'linearApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://linear.app/settings/api">official guide</a> on how to create an API key in Linear'
        this.inputs = [
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password',
                placeholder: 'lin_api_...'
            }
        ]
    }
}

module.exports = { credClass: LinearApi }
