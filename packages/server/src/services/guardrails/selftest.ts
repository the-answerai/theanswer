/**
 * Guardrails selftest service.
 *
 * Produces a structured report describing: (a) resolved config for the given
 * chatflow/organization (env -> org -> chatflow merged), (b) provenance of
 * any credentials that could be loaded, (c) a live healthCheck() call with
 * HTTP status + latency, and (d) the current circuit-breaker state.
 *
 * Purpose: let operators curl a single endpoint to answer "is guardrails
 * actually wired up in this environment?" without grepping server logs.
 */

import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { Workspace } from '../../enterprise/database/entities/workspace.entity'
import { FiddlerGuardrailsService } from './FiddlerGuardrailsService'
import { getGuardrailsConfig } from './config'
import type { GuardrailsConfig, GuardrailStageStatus } from '../../types/guardrails'
import type { FiddlerCredentialSource } from './FiddlerGuardrailsService'

export interface GuardrailsSelftestReport {
    resolved: {
        chatflowId?: string
        workspaceId?: string
        organizationId?: string
    }
    config: GuardrailsConfig
    credentialSource: FiddlerCredentialSource
    healthCheck: GuardrailStageStatus | { ok: false; degraded: true; reason: 'disabled' | 'no_credentials' | 'unexpected' }
    circuitState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    notes: string[]
}

export async function runGuardrailsSelftest(options: {
    organizationId: string
    chatflowId?: string
    workspaceIdOverride?: string
}): Promise<GuardrailsSelftestReport> {
    const notes: string[] = []
    const appServer = getRunningExpressApp()

    // Resolve a workspaceId — either explicit, or from the chatflow, or fall back to first workspace in org.
    let workspaceId = options.workspaceIdOverride
    if (!workspaceId && options.chatflowId) {
        const cf = await appServer.AppDataSource.getRepository(ChatFlow).findOne({
            where: { id: options.chatflowId }
        })
        workspaceId = cf?.workspaceId
        if (!workspaceId) notes.push(`Chatflow ${options.chatflowId} has no workspaceId; falling back to organization workspace lookup.`)
    }
    if (!workspaceId) {
        const workspace = await appServer.AppDataSource.getRepository(Workspace).findOne({
            where: { organizationId: options.organizationId }
        })
        workspaceId = workspace?.id
        if (!workspaceId) {
            notes.push(`No workspace found for organization ${options.organizationId}. Cannot resolve workspace-scoped credentials.`)
        }
    }

    const config = await getGuardrailsConfig(options.chatflowId || '', options.organizationId)

    if (!config.enabled) {
        return {
            resolved: { chatflowId: options.chatflowId, workspaceId, organizationId: options.organizationId },
            config,
            credentialSource: 'none',
            healthCheck: { ok: false, degraded: true, reason: 'disabled' },
            notes: ['Guardrails are disabled at the resolved config level.', ...notes]
        }
    }

    if (!workspaceId) {
        return {
            resolved: { chatflowId: options.chatflowId, workspaceId, organizationId: options.organizationId },
            config,
            credentialSource: 'none',
            healthCheck: { ok: false, degraded: true, reason: 'unexpected' },
            notes: ['Could not determine a workspaceId; credential lookup skipped.', ...notes]
        }
    }

    const { credentials, source } = await FiddlerGuardrailsService.loadCredentials(workspaceId, options.organizationId, config)

    if (!credentials) {
        return {
            resolved: { chatflowId: options.chatflowId, workspaceId, organizationId: options.organizationId },
            config,
            credentialSource: 'none',
            healthCheck: { ok: false, degraded: true, reason: 'no_credentials' },
            notes: [
                'Guardrails are enabled but no credentials could be resolved. Set FIDDLER_API_KEY/FIDDLER_API_URL, or create a workspace/organization credential named "fiddlerApi".',
                ...notes
            ]
        }
    }

    // Instantiate a throwaway service + run a live healthCheck. We intentionally
    // reconstruct here rather than using createFromContext so we can capture the
    // credential source for the report.
    const service = new FiddlerGuardrailsService(credentials, config)
    const healthCheck = await service.healthCheck()
    const circuitState = service.getCircuitStatus().state

    return {
        resolved: { chatflowId: options.chatflowId, workspaceId, organizationId: options.organizationId },
        config,
        credentialSource: source,
        healthCheck,
        circuitState,
        notes
    }
}
