/**
 * Authentication middleware for API routes
 * This is a simplified version for development purposes
 * In a real implementation, this would verify JWT tokens
 */
export const validateJwt = (req, res, next) => {
    // For now, we'll just pass through all requests for development purposes
    // This should be replaced with proper JWT validation in production

    // Check if user is in session (for local development)
    if (req.oidc?.user) {
        // User is already authenticated via auth0
        next()
    } else {
        // For development purposes, add a mock user
        req.oidc = {
            user: {
                sub: 'dev-user',
                email: 'dev@example.com',
                name: 'Development User'
            },
            isAuthenticated: () => true
        }
        next()
    }
}
