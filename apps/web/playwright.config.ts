import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { TIMEOUTS } from './e2e/helpers/selectors'

// Load environment variables from .env.test without overriding pre-set values (e.g. Bitwarden)
const envPath = path.resolve(__dirname, '.env.test')
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false })
}

const isCI = Boolean(process.env.CI)

// Validate BASE_URL to ensure it's a valid HTTP(S) URL
const baseURL = process.env.BASE_URL || 'http://localhost:3000'
if (!baseURL.match(/^https?:\/\/.+/)) {
    throw new Error(`Invalid BASE_URL: "${baseURL}". Must start with http:// or https://`)
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    /* Output directories - keep everything organized in e2e folder */
    outputDir: './e2e/test-results',

    /**
     * Global test timeout - Maximum time for a single test to complete
     * Set to 60 seconds to accommodate slow CI environments and complex test scenarios
     */
    timeout: 60_000,

    /**
     * Assertion timeout - Maximum time for expect() calls to pass
     * Uses TIMEOUTS.MEDIUM (10 seconds) for consistency with test helpers
     * This gives assertions enough time to wait for async operations
     */
    expect: {
        timeout: TIMEOUTS.MEDIUM
    },

    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: isCI,
    /* Retry on CI only */
    retries: isCI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: isCI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['html', { outputFolder: './e2e/playwright-report' }]],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Take screenshot only when test fails */
        screenshot: 'only-on-failure'
    },

    /**
     * Browser configuration strategy:
     * - CI: Only Chromium to reduce test time and ensure consistency
     * - Local: All browsers (Chromium, Firefox, WebKit) for comprehensive testing
     *
     * This approach balances speed in CI with thorough cross-browser testing locally
     */
    projects: [
        // Setup project runs first to authenticate and prepare test environment
        {
            name: 'setup',
            testMatch: /.*\.setup\.ts/
        },
        // Conditional browser configuration based on environment
        ...(isCI
            ? [
                  // CI: Chromium only for faster, consistent builds
                  {
                      name: 'chromium',
                      use: {
                          ...devices['Desktop Chrome'],
                          storageState: './e2e/.auth/user.json'
                      },
                      dependencies: ['setup']
                  }
              ]
            : [
                  // Local: All browsers for comprehensive cross-browser testing
                  {
                      name: 'chromium',
                      use: {
                          ...devices['Desktop Chrome'],
                          storageState: './e2e/.auth/user.json'
                      },
                      dependencies: ['setup']
                  },
                  {
                      name: 'firefox',
                      use: {
                          ...devices['Desktop Firefox'],
                          storageState: './e2e/.auth/user.json'
                      },
                      dependencies: ['setup']
                  },
                  {
                      name: 'webkit',
                      use: {
                          ...devices['Desktop Safari'],
                          storageState: './e2e/.auth/user.json'
                      },
                      dependencies: ['setup']
                  }
              ])
    ],

    /* Run your local dev server before starting the tests */
    // Auto-start dev stack locally; CI already runs `pnpm start`
    webServer: isCI
        ? undefined
        : {
              command: 'pnpm dev',
              url: 'http://localhost:3000',
              reuseExistingServer: true,
              timeout: 120 * 1000 // 2 minutes for startup
          }
})
