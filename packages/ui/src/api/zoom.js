import axios from 'axios'
import { baseURL } from '@/store/constant'

const getMeetings = (payload) => {
    return axios.post(`${baseURL}/api/v1/zoom/meetings`, payload)
}

const getSharedMeetings = (payload) => {
    return axios.post(`${baseURL}/api/v1/zoom/meetings/shared`, payload)
}

const getOrganizationMeetings = (payload) => {
    return axios.post(`${baseURL}/api/v1/zoom/meetings/organization`, payload)
}

const getMeetingsByType = (payload) => {
    return axios.post(`${baseURL}/api/v1/zoom/meetings/by-type`, payload)
}

export default {
    getMeetings,
    getSharedMeetings,
    getOrganizationMeetings,
    getMeetingsByType
}
