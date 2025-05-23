import { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'
import { ZoomService } from './ZoomService'
import { omit } from 'lodash'

class ZoomTranscripts implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Zoom Transcripts'
        this.name = 'zoomTranscripts'
        this.version = 1.0
        this.type = 'Zoom'
        this.icon = 'zoom.svg'
        this.category = 'Document Loaders'
        this.description = 'Load meeting transcripts from Zoom'
        this.baseClasses = [this.type, 'DocumentLoader']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['zoomOAuth']
        }
        this.inputs = [
            {
                label: 'Meeting ID',
                name: 'meetingId',
                type: 'string'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Additional Metadata',
                name: 'metadata',
                type: 'json',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Omit Metadata Keys',
                name: 'omitMetadataKeys',
                type: 'string',
                rows: 4,
                description: 'Comma-separated metadata keys to omit. Use * to omit all except Additional Metadata',
                optional: true,
                additionalParams: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, _options: ICommonObject): Promise<any> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const meetingId = nodeData.inputs?.meetingId as string
        const metadata = nodeData.inputs?.metadata
        const omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const _omitMetadataKeys = omitMetadataKeys === '*' ? '*' : omitMetadataKeys?.split(',')

        const credentialData = nodeData.credential ? JSON.parse(nodeData.credential).plainDataObj : {}

        if (!credentialData || Object.keys(credentialData).length === 0) {
            throw new Error('Credentials not found')
        }

        const credentials = {
            clientId: process.env.ZOOM_CLIENT_ID,
            clientSecret: process.env.ZOOM_CLIENT_SECRET,
            redirectUrl: process.env.ZOOM_CALLBACK_URL,
            accessToken: credentialData.zoomAccessToken,
            refreshToken: credentialData.zoomRefreshToken
        }

        const zoomService = new ZoomService(credentials)
        const meeting = await zoomService.getMeetingRecordings(meetingId)
        const documents: Document[] = []
        const files = meeting.recording_files || []

        for (const file of files) {
            if (file.file_type === 'TRANSCRIPT' && file.download_url) {
                const vtt = await zoomService.downloadTranscript(`${file.download_url}?type=transcript`)
                const text = this.parseVtt(vtt)
                let docs: Document[] = [
                    new Document({
                        pageContent: text,
                        metadata:
                            _omitMetadataKeys === '*'
                                ? { ...metadata }
                                : omit(
                                      {
                                          source: `zoom://${meetingId}`,
                                          meetingId,
                                          recordingId: file.id,
                                          ...metadata
                                      },
                                      _omitMetadataKeys
                                  )
                    })
                ]

                if (textSplitter) {
                    docs = await textSplitter.splitDocuments(docs)
                }

                documents.push(...docs)
            }
        }

        return documents
    }

    private parseVtt(vtt: string): string {
        return vtt
            .split(/\r?\n/)
            .filter((line) => line && !line.startsWith('WEBVTT') && !/^\d+$/.test(line) && !/^\d{2}:\d{2}:\d{2}\.\d{3}/.test(line))
            .join(' ')
    }
}

module.exports = { nodeClass: ZoomTranscripts }
