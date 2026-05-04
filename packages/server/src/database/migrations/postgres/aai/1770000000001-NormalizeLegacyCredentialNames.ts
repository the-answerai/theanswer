/* eslint-disable no-console */
import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Normalize legacy credential names baked into saved chatflow JSON and into
 * `credential.credentialName` rows.
 *
 * Background: a few credentials were renamed at some point (e.g. `JiraApi` ->
 * `jiraApi`). The new code registers them under the lowercase canonical key,
 * but old chatflow JSON and old credential rows still carry the historical
 * casing. When the canvas's `addAsyncOption` handler issues a request like
 * `GET /components-credentials/JiraApi`, the in-memory pool lookup fails and
 * surfaces as a 500 (the catch in the service used to swallow NOT_FOUND).
 *
 * This migration rewrites every known legacy name to its canonical form so
 * existing data lines up with the current credential pool. The case-insensitive
 * lookup added to `componentsCredentialsService.getComponentByName` keeps
 * unknown legacy names working too, but normalizing the data here removes the
 * ambiguity for anyone introspecting the DB later.
 */
export class NormalizeLegacyCredentialNames1770000000001 implements MigrationInterface {
    name = 'NormalizeLegacyCredentialNames1770000000001'

    /**
     * Map of legacy credential names -> canonical names.
     *
     * Add new entries here whenever a credential's `name` property changes.
     * Keys are matched case-sensitively against stored data so we only rewrite
     * the exact historical strings we know about (no surprise normalization of
     * intentionally PascalCase names like `PostgresApi` / `MySQLApi` / `E2BApi`).
     */
    private static readonly LEGACY_NAME_MAP: Record<string, string> = {
        JiraApi: 'jiraApi'
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const legacyMap = NormalizeLegacyCredentialNames1770000000001.LEGACY_NAME_MAP
        const legacyKeys = Object.keys(legacyMap)
        if (!legacyKeys.length) {
            console.log('[NormalizeLegacyCredentialNames] No legacy mappings configured, nothing to do.')
            return
        }

        console.log(`[NormalizeLegacyCredentialNames] Normalizing ${legacyKeys.length} legacy credential name(s):`, legacyKeys)

        await this.normalizeChatFlowFlowData(queryRunner, legacyMap)
        await this.normalizeCredentialRows(queryRunner, legacyMap)

        console.log('[NormalizeLegacyCredentialNames] Completed.')
    }

    public async down(): Promise<void> {
        // Intentional no-op: a legacy name like `JiraApi` is no longer registered by
        // any credential class, so reverting would only re-introduce the broken state.
    }

    /**
     * Walk every `chat_flow.flowData` JSON blob and rewrite any string that
     * appears inside a `credentialNames` array (or any `credentialName` string
     * field) when it matches a known legacy key.
     *
     * Uses a recursive scan rather than targeting specific paths because the
     * Flowise serialization shape varies between node types (inputAnchors vs
     * inputParams vs nested credential blocks).
     */
    private async normalizeChatFlowFlowData(queryRunner: QueryRunner, legacyMap: Record<string, string>): Promise<void> {
        const candidateLikes = Object.keys(legacyMap)
            .map((key) => `"flowData" LIKE '%${key.replace(/'/g, "''")}%'`)
            .join(' OR ')

        const rows: Array<{ id: string; flowData: string | null }> = await queryRunner.query(
            `SELECT id, "flowData" FROM "chat_flow" WHERE ${candidateLikes}`
        )

        if (!rows.length) {
            console.log('[NormalizeLegacyCredentialNames] No chat_flow rows reference legacy credential names.')
            return
        }

        console.log(`[NormalizeLegacyCredentialNames] Inspecting ${rows.length} chat_flow row(s)...`)

        let updatedCount = 0
        for (const row of rows) {
            if (!row.flowData) continue

            let parsed: unknown
            try {
                parsed = JSON.parse(row.flowData)
            } catch (err) {
                console.warn(`[NormalizeLegacyCredentialNames] Skipping chat_flow ${row.id} - flowData is not valid JSON.`)
                continue
            }

            const { value, changed } = rewriteLegacyNamesInPlace(parsed, legacyMap)
            if (!changed) continue

            const serialized = JSON.stringify(value)
            await queryRunner.query(`UPDATE "chat_flow" SET "flowData" = $1 WHERE "id" = $2`, [serialized, row.id])
            updatedCount += 1
        }

        console.log(`[NormalizeLegacyCredentialNames] Rewrote ${updatedCount} chat_flow row(s).`)
    }

    /**
     * Rewrite `credential.credentialName` for any rows whose value matches a
     * known legacy key. This unblocks the Edit-existing-credential flow which
     * also calls `GET /components-credentials/<name>` with the stored value.
     */
    private async normalizeCredentialRows(queryRunner: QueryRunner, legacyMap: Record<string, string>): Promise<void> {
        let totalUpdated = 0
        for (const [legacy, canonical] of Object.entries(legacyMap)) {
            const result = await queryRunner.query(`UPDATE "credential" SET "credentialName" = $1 WHERE "credentialName" = $2`, [
                canonical,
                legacy
            ])
            // node-postgres returns [rows, count] for UPDATE via TypeORM; fall back to 0 if shape differs.
            const affected = Array.isArray(result) && typeof result[1] === 'number' ? result[1] : 0
            if (affected) {
                console.log(`[NormalizeLegacyCredentialNames] credential.credentialName: ${legacy} -> ${canonical} (${affected} row(s))`)
            }
            totalUpdated += affected
        }
        if (!totalUpdated) {
            console.log('[NormalizeLegacyCredentialNames] No credential rows needed renaming.')
        }
    }
}

/**
 * Recursively walk an arbitrary JSON value and replace any leaf string that
 * matches a key in `legacyMap` when the leaf appears in a position that
 * historically held a credential name. We cover three positions:
 *  - inside arrays named `credentialNames`
 *  - as the value of a key called `credentialName`
 *  - as a free-standing string inside any `credentialNames` array
 *
 * Returns the (possibly mutated) value and whether anything changed. The
 * traversal mutates objects/arrays in place to avoid deep-cloning large flow
 * graphs, then returns the same reference.
 */
function rewriteLegacyNamesInPlace(value: unknown, legacyMap: Record<string, string>): { value: unknown; changed: boolean } {
    let changed = false

    const visit = (node: any, parentKey: string | null): void => {
        if (Array.isArray(node)) {
            // Replace strings directly when the array is keyed as credentialNames.
            if (parentKey === 'credentialNames') {
                for (let i = 0; i < node.length; i += 1) {
                    const entry = node[i]
                    if (typeof entry === 'string' && legacyMap[entry]) {
                        node[i] = legacyMap[entry]
                        changed = true
                    } else if (entry && typeof entry === 'object') {
                        visit(entry, null)
                    }
                }
            } else {
                for (const entry of node) {
                    if (entry && typeof entry === 'object') {
                        visit(entry, null)
                    }
                }
            }
            return
        }

        if (node && typeof node === 'object') {
            for (const key of Object.keys(node)) {
                const child = node[key]
                if (key === 'credentialName' && typeof child === 'string' && legacyMap[child]) {
                    node[key] = legacyMap[child]
                    changed = true
                } else if (child && typeof child === 'object') {
                    visit(child, key)
                }
            }
        }
    }

    visit(value, null)
    return { value, changed }
}
