module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/scripts/**', '!src/examples.ts'],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            branches: 35,
            functions: 45,
            lines: 50,
            statements: 50
        }
    }
}
