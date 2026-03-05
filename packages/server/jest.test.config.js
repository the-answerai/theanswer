module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testRegex: 'version-rollback\\.test\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    verbose: true,
    moduleNameMapper: {
        '^ioredis$': '<rootDir>/src/services/chatflows/__tests__/__mocks__/ioredis.js'
    },
    globals: {
        'ts-jest': {
            isolatedModules: true,
            tsconfig: {
                skipLibCheck: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                noImplicitAny: false
            }
        }
    }
}
