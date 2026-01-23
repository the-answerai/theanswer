import { google } from 'googleapis'

interface IGoogleOauth2 {
    googleAccessToken: string
    googleRefreshToken: string
}

export class GoogleOauth2Client {
    private oauth2Client: any
    constructor(credentials: IGoogleOauth2) {
        if (!credentials.googleRefreshToken) {
            throw new Error('Refresh token is required')
        }

        if (!process.env.API_HOST) {
            throw new Error(
                'API_HOST environment variable is not set. ' + 'Please set API_HOST in your .env file (e.g., http://localhost:3000)'
            )
        }

        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.API_HOST}/api/v1/google-auth/callback`
        )

        this.oauth2Client.setCredentials({
            access_token: credentials.googleAccessToken,
            refresh_token: credentials.googleRefreshToken
        })
    }

    async refreshToken() {
        try {
            const { tokens } = await this.oauth2Client.refreshToken(this.oauth2Client.credentials.refresh_token)
            return tokens
        } catch (error: any) {
            const errorMessage = error.message || ''
            const errorResponse = error.response?.data?.error || ''

            // Handle invalid_grant error with user-friendly message
            if (errorMessage.includes('invalid_grant') || errorResponse === 'invalid_grant') {
                const customError = new Error(
                    'Google authorization has expired or been revoked. ' +
                        'Please re-authenticate your Google account in Credentials settings.'
                )
                ;(customError as any).code = 'REAUTH_REQUIRED'
                ;(customError as any).requiresReauth = true
                throw customError
            }
            throw error
        }
    }
}
