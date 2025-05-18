import { INodeParams, INodeCredential } from '../src/Interface'

class HubspotApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Hubspot API'
        this.name = 'hubspotApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://developers.hubspot.com/docs/api/private-apps">official guide</a> on how to get your Hubspot private app token'
        this.inputs = [
            {
                label: 'API Token',
                name: 'apiToken',
                type: 'password',
                placeholder: '<HUBSPOT_API_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: HubspotApi }
