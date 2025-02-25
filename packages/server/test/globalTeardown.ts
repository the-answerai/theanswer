module.exports = async () => {
    // Stop the server
    console.log('Stopping server after tests...')
    try {
        // Get the running server instance
        // const { getRunningExpressApp } = require('../src/utils/getRunningExpressApp')
        // const app = getRunningExpressApp()
        // if (app && app.server) {
        //     await new Promise<void>((resolve) => {
        //         app.server.close(() => {
        //             console.log('Server stopped successfully')
        //             resolve()
        //         })
        //     })
        // }
    } catch (error) {
        console.error('Failed to stop server:', error)
        throw error
    }
}
