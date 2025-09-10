import { INodeParams, INodeCredential } from '../src/Interface'

class ZoomOAuth implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]

    constructor() {
        this.label = 'Zoom OAuth'
        this.name = 'zoomOAuth'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Full Name',
                name: 'fullName',
                type: 'string',
                optional: false,
                disabled: true
            },
            {
                label: 'Email',
                name: 'email',
                type: 'string',
                optional: false,
                disabled: true
            },
            {
                label: 'Provider',
                name: 'provider',
                type: 'string',
                optional: false,
                hidden: true,
                disabled: true
            },
            {
                label: 'Provider ID',
                name: 'providerId',
                type: 'string',
                optional: false,
                hidden: true,
                disabled: true
            },
            {
                label: 'Zoom Access Token',
                name: 'zoomAccessToken',
                type: 'string',
                optional: false,
                hidden: true,
                disabled: true
            },
            {
                label: 'Zoom Refresh Token',
                name: 'zoomRefreshToken',
                type: 'string',
                optional: false,
                hidden: true,
                disabled: true
            }
        ]
    }
}

module.exports = { credClass: ZoomOAuth }
