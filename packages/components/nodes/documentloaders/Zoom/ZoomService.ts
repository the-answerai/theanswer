import axios from 'axios'

interface ZoomCredentials {
    clientId: string
    clientSecret: string
    accessToken: string
    refreshToken: string
    accountId?: string
}

interface ZoomMeetingRecording {
    recording_files?: Array<{
        id: string
        file_type: string
        download_url?: string
    }>
}

interface ZoomMeeting {
    id: string | number
    topic: string
    start_time: string
    duration: number
    host_email: string
    recording_count: number
    timezone?: string
}

interface ZoomRecordingsResponse {
    meetings: ZoomMeeting[]
    page_count?: number
    page_number?: number
    page_size?: number
    total_records?: number
}

interface MeetingsRequestOptions {
    fromDate?: string
    toDate?: string
    pageSize?: number
    userId?: string
}

export class ZoomService {
    private clientId: string
    private clientSecret: string
    private accessToken: string
    private refreshToken: string
    private accountId?: string

    constructor(credentials: ZoomCredentials) {
        this.clientId = credentials.clientId
        this.clientSecret = credentials.clientSecret
        this.accessToken = credentials.accessToken
        this.refreshToken = credentials.refreshToken
        this.accountId = credentials.accountId
    }

    /**
     * Get meetings for the current user (original method)
     */
    async getUserMeetings(options: MeetingsRequestOptions = {}): Promise<ZoomRecordingsResponse> {
        try {
            const params = {
                from: options.fromDate || this.getDefaultFromDate(),
                to: options.toDate || this.getDefaultToDate(),
                page_size: options.pageSize || 30
            }

            const response = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params
            })
            return response.data
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await this.refreshAccessToken()
                return this.getUserMeetings(options)
            }
            throw error
        }
    }

    /**
     * Get organization meetings using account-level access
     */
    async getOrganizationMeetings(options: MeetingsRequestOptions = {}): Promise<ZoomRecordingsResponse> {
        if (!this.accountId) {
            throw new Error('Account ID is required for organization meetings')
        }

        try {
            const userId = options.userId || 'me'
            const params = {
                from: options.fromDate || this.getDefaultFromDate(),
                to: options.toDate || this.getDefaultToDate(),
                page_size: options.pageSize || 30
            }

            const endpoint = `https://api.zoom.us/v2/accounts/${this.accountId}/users/${userId}/recordings`
            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params
            })
            return response.data
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await this.refreshAccessToken()
                return this.getOrganizationMeetings(options)
            }
            throw error
        }
    }

    /**
     * Get shared meetings (currently uses same endpoint as user meetings)
     * This could be enhanced to query specific shared user IDs
     */
    async getSharedMeetings(options: MeetingsRequestOptions = {}): Promise<ZoomRecordingsResponse> {
        // For now, this uses the same endpoint as getUserMeetings
        // In a real implementation, you might query specific shared user IDs
        // or use different logic based on your organization's sharing patterns
        return this.getUserMeetings(options)
    }

    /**
     * Get meetings for a specific user (requires account-level permissions)
     */
    async getUserMeetingsById(userId: string, options: MeetingsRequestOptions = {}): Promise<ZoomRecordingsResponse> {
        if (!this.accountId) {
            throw new Error('Account ID is required to get meetings for specific users')
        }

        try {
            const params = {
                from: options.fromDate || this.getDefaultFromDate(),
                to: options.toDate || this.getDefaultToDate(),
                page_size: options.pageSize || 30
            }

            const endpoint = `https://api.zoom.us/v2/accounts/${this.accountId}/users/${userId}/recordings`
            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                params
            })
            return response.data
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await this.refreshAccessToken()
                return this.getUserMeetingsById(userId, options)
            }
            throw error
        }
    }

    async getMeetingRecordings(meetingId: string): Promise<ZoomMeetingRecording> {
        try {
            const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            })
            return response.data
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await this.refreshAccessToken()
                return this.getMeetingRecordings(meetingId)
            }
            throw error
        }
    }

    async downloadTranscript(url: string): Promise<string> {
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                },
                responseType: 'text'
            })
            return response.data as string
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                await this.refreshAccessToken()
                return this.downloadTranscript(url)
            }
            throw error
        }
    }

    private async refreshAccessToken(): Promise<string> {
        const params = new URLSearchParams()
        params.append('grant_type', 'refresh_token')
        params.append('refresh_token', this.refreshToken)

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')

        const response = await axios.post('https://zoom.us/oauth/token', params.toString(), {
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        this.accessToken = response.data.access_token
        this.refreshToken = response.data.refresh_token
        return this.accessToken
    }

    /**
     * Get default "from" date (14 days ago)
     */
    private getDefaultFromDate(): string {
        const date = new Date()
        date.setDate(date.getDate() - 14)
        return date.toISOString().split('T')[0]
    }

    /**
     * Get default "to" date (today)
     */
    private getDefaultToDate(): string {
        return new Date().toISOString().split('T')[0]
    }

    /**
     * Update account ID for organization-level operations
     */
    setAccountId(accountId: string): void {
        this.accountId = accountId
    }

    /**
     * Get current account ID
     */
    getAccountId(): string | undefined {
        return this.accountId
    }
}
