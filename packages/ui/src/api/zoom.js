import axios from 'axios'
import { baseURL } from '@/store/constant'

const getMeetings = (payload) => {
    return axios.post(`${baseURL}/api/v1/zoom/meetings`, payload)
}

export default {
    getMeetings
}
