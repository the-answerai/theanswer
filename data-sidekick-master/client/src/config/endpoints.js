import { getApiUrl } from './api'

export const endpoints = {
    // Call endpoints
    calls: {
        list: () => getApiUrl('api/calls'),
        untagged: () => getApiUrl('api/calls/untagged'),
        analyze: () => getApiUrl('api/calls/analyze'),
        byId: (id) => getApiUrl(`api/calls/${id}`),
        byUrl: (url) => getApiUrl(`api/calls/url/${url}`),
        byPhone: (phoneNumber) => getApiUrl(`api/calls/phone/${phoneNumber}`),
        outbound: () => getApiUrl('api/calls/outbound')
    },

    // Tag endpoints
    tags: {
        list: () => getApiUrl('api/tags'),
        create: () => getApiUrl('api/tags'),
        update: (id) => getApiUrl(`api/tags/${id}`),
        delete: (id) => getApiUrl(`api/tags/${id}`),
        callTags: () => getApiUrl('api/tags/call-tags'),
        stats: () => getApiUrl('api/tags/stats'),
        process: () => getApiUrl('api/tags/process')
    },

    // Report endpoints
    reports: {
        list: () => getApiUrl('api/reports'),
        generate: () => getApiUrl('api/reports/generate'),
        byId: (id) => getApiUrl(`api/reports/${id}`),
        update: (id) => getApiUrl(`api/reports/${id}`),
        delete: (id) => getApiUrl(`api/reports/${id}`)
    }
}

export default endpoints
