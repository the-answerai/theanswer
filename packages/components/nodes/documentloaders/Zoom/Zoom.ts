import type { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import type { TextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'
import { ZoomService } from './ZoomService'
import { omit } from 'lodash'

interface ZoomMeeting {
    id: string
    topic: string
    start_time: string
    duration: number
    host_email: string
}

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
                label: 'Selected Meetings',
                name: 'selectedMeetings',
                type: 'string',
                description: 'Selected Zoom meetings to process transcripts from'
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

    async init(nodeData: INodeData, _: string, _options: ICommonObject): Promise<Document[]> {
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const selectedMeetings = nodeData.inputs?.selectedMeetings as string
        const metadata = nodeData.inputs?.metadata
        const omitMetadataKeys = nodeData.inputs?.omitMetadataKeys as string
        const _omitMetadataKeys = omitMetadataKeys === '*' ? '*' : omitMetadataKeys?.split(',')

        const credentialData = nodeData.credential ? JSON.parse(nodeData.credential).plainDataObj : {}

        if (!credentialData || Object.keys(credentialData).length === 0) {
            throw new Error('Credentials not found')
        }

        // Parse selected meetings
        let meetings: ZoomMeeting[] = []
        if (selectedMeetings) {
            try {
                meetings = JSON.parse(selectedMeetings)
            } catch (error) {
                throw new Error('Invalid selected meetings format')
            }
        }

        if (!meetings || meetings.length === 0) {
            throw new Error('No meetings selected')
        }

        const credentials = {
            clientId: process.env.ZOOM_CLIENT_ID,
            clientSecret: process.env.ZOOM_CLIENT_SECRET,
            redirectUrl: process.env.ZOOM_CALLBACK_URL,
            accessToken: credentialData.zoomAccessToken,
            refreshToken: credentialData.zoomRefreshToken
        }

        const zoomService = new ZoomService(credentials)
        const documents: Document[] = []

        // Process each selected meeting
        for (const meeting of meetings) {
            try {
                const meetingRecordings = await zoomService.getMeetingRecordings(meeting.id)
                const files = meetingRecordings.recording_files || []

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
                                                  source: `zoom://${meeting.id}`,
                                                  meetingId: meeting.id,
                                                  meetingTopic: meeting.topic,
                                                  meetingStartTime: meeting.start_time,
                                                  meetingDuration: meeting.duration,
                                                  meetingHost: meeting.host_email,
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
            } catch (error) {
                // Log error but continue processing other meetings
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                throw new Error(`Failed to process meeting ${meeting.id}: ${errorMessage}`)
            }
        }

        if (documents.length === 0) {
            throw new Error('No transcripts found for the selected meetings')
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
