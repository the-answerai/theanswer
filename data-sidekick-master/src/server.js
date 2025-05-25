import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import pkg from 'express-openid-connect'
const { auth } = pkg
import { PORT } from './config/server.js'
import { setupWebSocket } from './utils/websocketHandler.js'
import { errorHandler } from './middleware/errorHandler.js'
import createAuth0Config from './config/auth0.js'
import { handleUserAuth } from './utils/authHandler.js'
import callRoutes from './routes/callRoutes.js'
import tagRoutes from './routes/tagRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import scheduledReportRoutes from './routes/scheduledReportRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import ticketRoutes from './routes/ticketRoutes.js'
import jiraTicketRoutes from './routes/jiraTicketRoutes.js'
import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js'
import dataAnalyzerRoutes from './routes/dataAnalyzerRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import answerAIRoutes from './routes/answerAIRoutes.js'

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Enable CORS and JSON parsing
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Auth0 configuration
const auth0Config = createAuth0Config(process.env)

// Custom callback function to handle user creation in Supabase
const afterCallback = async (req, res, session) => {
    console.log('\n=== Auth0 afterCallback triggered ===')

    try {
        if (!session || !session.id_token) {
            console.log('No session or ID token provided')
            return session
        }

        // Decode the ID token to get user information
        const idToken = session.id_token

        // The ID token is a JWT, split it and decode the payload
        const [, payloadBase64] = idToken.split('.')
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString())
        console.log('Decoded user information:', payload)

        // Extract user information from the decoded payload
        const user = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        }
        console.log('Extracted user data:', user)

        // Attach the user information to the session
        session.user = user

        // Create or update user in Supabase
        if (user) {
            const supabaseUser = await handleUserAuth(user)
            console.log('User created/updated in Supabase:', supabaseUser)
        }
    } catch (error) {
        console.error('Error in afterCallback:', error)
    }
    return session
}

// Extended Auth0 configuration with afterCallback
const auth0ConfigWithCallback = {
    ...auth0Config,
    afterCallback
}

// Configure Auth0 middleware
app.use(auth(auth0ConfigWithCallback))

// Add user info route
app.get('/api/me', (req, res) => {
    res.json({
        isAuthenticated: req.oidc.isAuthenticated(),
        user: req.oidc.user
    })
})

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')))

// Set up WebSocket server
const wss = new WebSocketServer({ noServer: true })
wss.on('connection', setupWebSocket)

// API Routes
app.use('/api/calls', callRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/scheduled-reports', scheduledReportRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/jira', jiraTicketRoutes)
app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/analyzer', dataAnalyzerRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/answerai', answerAIRoutes)

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

// Error handling middleware
app.use(errorHandler)

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// Attach WebSocket server to HTTP server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
    })
})
