describe('DataSource Test Mode Security', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env }

        // Clear module cache to force fresh import of DataSource
        jest.resetModules()
    })

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv

        // Clear module cache after each test
        jest.resetModules()
    })

    describe('ensureTestPrefix behavior via init()', () => {
        it('should add test_ prefix when missing', async () => {
            // Setup environment
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = 'flowise'
            process.env.DATABASE_USER = 'user'
            process.env.DATABASE_TYPE = 'postgres'

            // Dynamic import to get fresh module with reset appDataSource
            const { init } = await import('../DataSource')
            await init()

            // Verify prefix was added
            expect(process.env.DATABASE_NAME).toBe('test_flowise')
            expect(process.env.DATABASE_USER).toBe('test_user')
        })

        it('should preserve existing test_ prefix', async () => {
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = 'test_already_prefixed'
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('test_already_prefixed')
        })

        it('should preserve existing _test suffix', async () => {
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = 'flowise_test'
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('flowise_test')
        })

        it('should handle empty DATABASE_NAME with default', async () => {
            process.env.NODE_ENV = 'test'
            process.env.DATABASE_NAME = ''
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('test_theanswer')
        })

        it('should handle undefined DATABASE_NAME with default', async () => {
            process.env.NODE_ENV = 'test'
            delete process.env.DATABASE_NAME
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('test_theanswer')
        })

        it('should NOT modify values when NODE_ENV != test', async () => {
            process.env.NODE_ENV = 'production'
            process.env.DATABASE_NAME = 'flowise_production'
            process.env.DATABASE_TYPE = 'postgres'

            const { init } = await import('../DataSource')
            await init()

            expect(process.env.DATABASE_NAME).toBe('flowise_production')
        })
    })
})
