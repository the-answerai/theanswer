module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:markdown/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended'
    ],
    settings: {
        react: {
            version: 'detect'
        }
    },
    parser: '@typescript-eslint/parser',
    ignorePatterns: [
        '**/node_modules',
        '**/.next',
        '**/dist',
        '**/build',
        '**/package-lock.json',
        '**/pnpm-lock.yaml',
        '**/.gitbook/assets/*.json',
        '**/generated/**',
        '**/.turbo/**',
        '**/coverage/**',
        '**/scripts/bws-secure/**'
    ],
    plugins: ['@typescript-eslint', 'unused-imports'],
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }
        ],
        'no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'warn',
        'no-undef': 'off',
        'no-console': [process.env.CI ? 'warn' : 'warn', { allow: ['warn', 'error', 'info'] }]
        // 'prettier/prettier': 'error'
    }
}
