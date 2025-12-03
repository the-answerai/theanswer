/**
 * Test Data Utilities for Parallel E2E Execution
 *
 * This module provides deterministic ID generation and data isolation helpers
 * to enable parallel test execution without data collisions.
 *
 * Usage:
 * - Set TEST_RECORD_PREFIX env var to namespace test data (e.g., "e2e_${GITHUB_RUN_ID}")
 * - Use deterministicId() to generate stable UUIDs for test fixtures
 * - Use prefixedName() to create namespaced entity names
 * - Clean up using the generated IDs or name prefixes
 *
 * Note: Currently tests run sequentially (workers=1 in CI) to avoid concurrency issues.
 * This helper enables future parallel execution when needed.
 */

import { v5 as uuidv5 } from 'uuid'

/**
 * Stable namespace UUID for test data generation
 * Generated once and frozen in the repository for consistency
 */
const TEST_NAMESPACE_UUID = '6a2b495b-01e1-4c5e-8a4e-12f9e1c9c7b5'

/**
 * Get the current test record prefix from environment
 * Falls back to 'e2e' if not specified
 * In CI, can be set to 'e2e_${GITHUB_RUN_ID}' for run isolation
 */
export const getTestPrefix = (): string => {
    return process.env.TEST_RECORD_PREFIX || 'e2e'
}

/**
 * Generate a deterministic UUID v5 based on a name and the current test prefix
 *
 * This ensures:
 * 1. Same name always generates same ID (within a test run)
 * 2. Different test runs (different prefixes) generate different IDs
 * 3. Parallel tests can use different prefixes to avoid collisions
 *
 * @param name - Semantic name for the entity (e.g., "chatflow:missing-credentials")
 * @returns UUID v5 string
 *
 * @example
 * const chatflowId = deterministicId('chatflow:baseline')
 * // Always returns same ID for this prefix + name combination
 */
export const deterministicId = (name: string): string => {
    const prefix = getTestPrefix()
    const namespacedName = `${prefix}:${name}`
    return uuidv5(namespacedName, TEST_NAMESPACE_UUID)
}

/**
 * Generate a prefixed name for test entities
 * Useful for creating named resources that can be cleaned up by prefix
 *
 * @param baseName - Base name for the entity
 * @returns Prefixed name string
 *
 * @example
 * const chatflowName = prefixedName('baseline-chatflow')
 * // Returns 'e2e_baseline-chatflow' (or with custom prefix)
 */
export const prefixedName = (baseName: string): string => {
    const prefix = getTestPrefix()
    return `${prefix}_${baseName}`
}

/**
 * Check if an entity name belongs to the current test run
 *
 * @param name - Entity name to check
 * @returns true if name starts with current test prefix
 *
 * @example
 * if (isTestEntity('e2e_my-chatflow')) {
 *   // Safe to delete - it's a test entity
 * }
 */
export const isTestEntity = (name: string): boolean => {
    const prefix = getTestPrefix()
    return name.startsWith(`${prefix}_`)
}

/**
 * Example usage patterns for future parallel test implementation:
 *
 * // In test file:
 * test.beforeEach(async () => {
 *   const chatflowId = deterministicId('chatflow:baseline')
 *   const credentialId = deterministicId('credential:openai')
 *
 *   await seedTestData({
 *     chatflow: {
 *       id: chatflowId,
 *       name: prefixedName('baseline')
 *     },
 *     credentials: {
 *       openai: {
 *         id: credentialId,
 *         name: prefixedName('OpenAI'),
 *         assigned: true
 *       }
 *     }
 *   })
 * })
 *
 * test.afterEach(async () => {
 *   // Cleanup only this test's data by ID
 *   const chatflowId = deterministicId('chatflow:baseline')
 *   await cleanupChatflow(chatflowId)
 * })
 *
 * // In CI workflow:
 * env:
 *   TEST_RECORD_PREFIX: e2e_${{ github.run_id }}
 *
 * // In playwright.config.ts (when ready for parallel):
 * workers: process.env.CI ? 3 : undefined  // Enable parallel workers
 */
