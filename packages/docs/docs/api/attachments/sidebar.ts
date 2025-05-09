import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebar: SidebarsConfig = {
    apisidebar: [
        {
            type: 'doc',
            id: 'api/attachments/attachments-api'
        },
        {
            type: 'category',
            label: 'attachments',
            items: [
                {
                    type: 'doc',
                    id: 'api/attachments/create-attachment',
                    label: 'Create a new attachment',
                    className: 'api-method post'
                },
                {
                    type: 'doc',
                    id: 'api/attachments/get-attachment',
                    label: 'Retrieve an attachment',
                    className: 'api-method get'
                },
                {
                    type: 'doc',
                    id: 'api/attachments/delete-attachment',
                    label: 'Delete an attachment',
                    className: 'api-method delete'
                },
                {
                    type: 'doc',
                    id: 'api/attachments/download-attachment-content',
                    label: 'Download attachment content',
                    className: 'api-method get'
                },
                {
                    type: 'doc',
                    id: 'api/attachments/create-attachment',
                    label: 'Create attachments array',
                    className: 'api-method post'
                }
            ]
        }
    ]
}

export default sidebar.apisidebar
