import { useState } from 'react'

export default (apiFunc) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const request = async (...args) => {
        setLoading(true)
        setError(null)
        setData(null)
        try {
            const response = await apiFunc(...args)
            setData(response.data)
            return response.data
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Unexpected Error!')
            throw err
        } finally {
            setLoading(false)
        }
    }

    return {
        data,
        error,
        loading,
        request
    }
}
