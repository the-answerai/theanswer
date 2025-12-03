// Mock langfuse to avoid ESM dynamic import issues in unit tests
jest.mock('langfuse', () => ({
    Langfuse: jest.fn().mockImplementation(() => ({
        shutdown: jest.fn()
    }))
}))

// Set test environment
process.env.NODE_ENV = 'test'
