describe('E2E suite for authentication with Auth0', () => {
    beforeEach(() => {
        // Mocking Auth0 authentication since we can't perform actual Auth0 login in E2E tests
        // Using cy.intercept to mock Auth0 responses for testing
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                email: 'test@theanswer.ai',
                name: 'Test User',
                org_id: 'test-org-id',
                org_name: 'Test Organization',
                'https://theanswer.ai/roles': ['user']
            }
        }).as('getUserProfile')

        cy.intercept('GET', '**/api/v1/user', {
            statusCode: 200,
            body: {
                id: 'test-user-id',
                email: 'test@theanswer.ai',
                name: 'Test User',
                organizationId: 'test-org-id',
                roles: ['user']
            }
        }).as('getUser')

        // Mock session token
        window.sessionStorage.setItem('access_token', 'mock-jwt-token')

        // Visit the home page
        cy.visit('http://localhost:3000')
    })

    it('should verify user is authenticated', () => {
        // Check if the access token is set in session storage
        cy.window().its('sessionStorage').invoke('getItem', 'access_token').should('eq', 'mock-jwt-token')
    })

    it('should show authenticated user profile', () => {
        // Navigate to profile page
        cy.visit('http://localhost:3000/sidekick-studio/profile')

        // Wait for user data to load
        cy.wait('@getUser')

        // Assert profile information is displayed
        cy.contains('test@theanswer.ai').should('be.visible')
        cy.contains('Test User').should('be.visible')
    })

    it('should redirect unauthenticated users to login page', () => {
        // Clear the session token
        cy.window().its('sessionStorage').invoke('removeItem', 'access_token')

        // Mock Auth0 unauthenticated response
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 401,
            body: { error: 'Unauthorized' }
        }).as('getUnauthorizedUserProfile')

        // Visit protected page
        cy.visit('http://localhost:3000/sidekick-studio/apikey')

        // Should redirect to login page
        cy.url().should('include', '/login')
    })

    it('should authenticate API requests with session token', () => {
        // Mock prediction API endpoint
        cy.intercept('POST', '**/api/v1/prediction/*', (req) => {
            // Verify request includes Authorization header with token
            expect(req.headers.authorization).to.include('Bearer mock-jwt-token')

            req.reply({
                statusCode: 200,
                body: {
                    text: 'Test prediction response',
                    chatId: 'test-chat-id'
                }
            })
        }).as('makePrediction')

        // Trigger an API request to prediction endpoint
        cy.visit('http://localhost:3000/sidekick-studio/chat')

        // Type a message and send
        cy.get('input[type="text"]').type('Hello AI{enter}')

        // Wait for prediction API call
        cy.wait('@makePrediction')

        // Check response is displayed
        cy.contains('Test prediction response').should('be.visible')
    })

    it('should maintain session across multiple prediction API calls', () => {
        // Set up mocks for two consecutive prediction API calls with the same session
        const sessionId = 'test-session-id'

        // First call receives and establishes a session
        cy.intercept('POST', '**/api/v1/prediction/*', (req) => {
            expect(req.headers.authorization).to.include('Bearer mock-jwt-token')

            req.reply({
                statusCode: 200,
                body: {
                    text: 'First response',
                    chatId: 'test-chat-id',
                    sessionId: sessionId
                }
            })
        }).as('firstPrediction')

        // Second call should include the session ID from the first response
        cy.intercept('POST', '**/api/v1/prediction/*', (req) => {
            // Verify the request body contains the session ID from previous response
            expect(req.body).to.have.property('overrideConfig')
            expect(req.body.overrideConfig).to.have.property('sessionId', sessionId)

            req.reply({
                statusCode: 200,
                body: {
                    text: 'Follow-up response',
                    chatId: 'test-chat-id',
                    sessionId: sessionId
                }
            })
        }).as('secondPrediction')

        // Navigate to chat page
        cy.visit('http://localhost:3000/sidekick-studio/chat')

        // First interaction
        cy.get('input[type="text"]').type('First message{enter}')
        cy.wait('@firstPrediction')
        cy.contains('First response').should('be.visible')

        // Second interaction should use the same session
        cy.get('input[type="text"]').type('Follow-up message{enter}')
        cy.wait('@secondPrediction')
        cy.contains('Follow-up response').should('be.visible')
    })

    it('should enforce role-based access control', () => {
        // First test with regular user role
        cy.visit('http://localhost:3000/sidekick-studio/admin')

        // Mock 403 access denied for admin page with regular user role
        cy.intercept('GET', '**/api/v1/admin/**', {
            statusCode: 403,
            body: {
                error: 'Access Denied',
                message: 'User does not have required role'
            }
        }).as('adminPageAccessDenied')

        // Should show access denied message
        cy.contains('Access Denied').should('be.visible')

        // Now test with admin role
        // Update the user role to admin
        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: {
                email: 'test@theanswer.ai',
                name: 'Test User',
                org_id: 'test-org-id',
                org_name: 'Test Organization',
                'https://theanswer.ai/roles': ['admin', 'user']
            }
        }).as('getAdminUserProfile')

        cy.intercept('GET', '**/api/v1/user', {
            statusCode: 200,
            body: {
                id: 'test-user-id',
                email: 'test@theanswer.ai',
                name: 'Test User',
                organizationId: 'test-org-id',
                roles: ['admin', 'user']
            }
        }).as('getAdminUser')

        // Mock successful admin API response
        cy.intercept('GET', '**/api/v1/admin/**', {
            statusCode: 200,
            body: { success: true }
        }).as('adminPageAccessGranted')

        // Reload the page to apply new role
        cy.reload()

        // Should now have access to admin features
        cy.contains('Admin Dashboard').should('be.visible')
    })
})
