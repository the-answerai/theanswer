module.exports = {
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json'
            }
        ]
    },
    testRegex: '(/test/.*\\.test)\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    testTimeout: 30000,
    // Handle circular references in test output
    testRunner: 'jest-circus/runner',
    reporters: ['default'],
    // Start server before tests
    globalSetup: '<rootDir>/test/globalSetup.ts',
    // Stop server after tests
    globalTeardown: '<rootDir>/test/globalTeardown.ts'
}
