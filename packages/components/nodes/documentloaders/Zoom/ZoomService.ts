import axios from 'axios'

export class ZoomService {
    private clientId: string
    private clientSecret: string
    private accessToken: string
    private refreshToken: string

    constructor(credentials: any) {
        this.clientId = credentials.clientId
        this.clientSecret = credentials.clientSecret
        this.accessToken = credentials.accessToken
        this.refreshToken = credentials.refreshToken
    }

    async getMeetingRecordings(meetingId: string): Promise<any> {
        try {
            const response = await axios.get(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            })
            return response.data
        } catch (error: any) {
            if (error.response?.status === 401) {
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
        } catch (error: any) {
            if (error.response?.status === 401) {
                await this.refreshAccessToken()
                return this.downloadTranscript(url)
            }
            throw error
        }
    }

    private async refreshAccessToken() {
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
}
