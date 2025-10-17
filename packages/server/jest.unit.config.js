/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/test/unitSetup.ts']
    // No globalSetup or globalTeardown for unit tests
}
