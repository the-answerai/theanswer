export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err)

    // Handle specific error types
    if (err.name === 'PostgrestError') {
        return res.status(400).json({
            error: 'Database error',
            details: err.message,
            code: err.code
        })
    }

    if (err.name === 'AbortError') {
        return res.status(408).json({
            error: 'Request timeout',
            details: 'The request took too long to complete'
        })
    }

    // Default error response
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
}
