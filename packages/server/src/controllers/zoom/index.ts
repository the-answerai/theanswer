import { Request, Response, NextFunction } from 'express'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'

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
}

/**
 * Get Zoom meetings with recordings for the authenticated user
 */
const getMeetings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get access token from request (either query params or body)
        const accessToken = req.method === 'GET' ? req.query.accessToken : req.body.accessToken

        if (!accessToken) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Access token is required')
        }

        // Fetch recordings from Zoom API
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const fromDate = thirtyDaysAgo.toISOString().split('T')[0]
        const toDate = new Date().toISOString().split('T')[0]

        const response = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            params: {
                from: fromDate,
                to: toDate,
                page_size: 30
            }
        })

        const data = response.data as ZoomRecordingsResponse

        // Transform the meetings data to include recording count
        const meetingsWithRecordings =
            data.meetings?.map((meeting) => ({
                id: meeting.id,
                topic: meeting.topic,
                start_time: meeting.start_time,
                duration: meeting.duration,
                host_email: meeting.host_email,
                recording_count: meeting.recording_count || 1, // Default to 1 since we're getting from recordings endpoint
                timezone: meeting.timezone
            })) || []

        return res.status(StatusCodes.OK).json({
            meetings: meetingsWithRecordings,
            total_records: data.meetings?.length || 0
        })
    } catch (error: unknown) {
        console.error('Error getting Zoom meetings:', error)

        // Type check error before accessing properties
        if (
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'data' in error.response
        ) {
            const typedError = error as any
            return res.status(typedError.response.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: typedError.response.data.message || 'Error fetching Zoom meetings',
                details: typedError.response.data
            })
        }

        next(error)
    }
}

export default {
    getMeetings
}
