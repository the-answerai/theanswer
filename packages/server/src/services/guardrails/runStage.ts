/**
 * Shared guardrail stage runner.
 *
 * Centralizes the decision logic for a single input- or output-validation
 * stage so all call sites (chain input/output, agent input/output, agentflow
 * v2 input/output) behave identically:
 *
 *   1. Resolve the service + config (env -> org -> chatflow).
 *   2. If disabled or no credentials, emit a health entry describing why and
 *      either (open) allow the request to continue or (closed) signal the
 *      caller to block with a 503.
 *   3. If the service is healthy, call validateInput/validateOutput and
 *      classify the returned status. Real `blocked=true` violations remain 400.
 *      Degraded calls produce either a warning (open) or a block (closed).
 *
 * The helper returns a typed `RunStageResult` rather than throwing so the
 * caller can merge into its existing `guardrailsMetadata` object and decide
 * how to propagate the 503 (streaming vs non-streaming paths need different
 * handling).
 */

import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import logger from '../../utils/logger'
import { FiddlerGuardrailsService } from './FiddlerGuardrailsService'
import {
    GuardrailFailureMode,
    GuardrailsConfig,
    GuardrailStageStatus,
    InputValidationResult,
    OutputValidationResult
} from '../../types/guardrails'
import type { GuardrailsHealthEntry } from '../../Interface'

export interface RunStageContext {
    chatflowId: string
    workspaceId?: string
    organizationId?: string
    chatId?: string
}

export type RunStageResult =
    | {
          kind: 'ok'
          failureMode: GuardrailFailureMode
          health: GuardrailsHealthEntry
          // Present only if guardrails ran (not when disabled/no-creds)
          inputResult?: InputValidationResult
          outputResult?: OutputValidationResult
      }
    | {
          kind: 'blocked_violation' // real 400 (content actually unsafe)
          failureMode: GuardrailFailureMode
          health: GuardrailsHealthEntry
          inputResult: InputValidationResult
          message: string
      }
    | {
          kind: 'blocked_degraded' // 503 fail-closed on degraded
          failureMode: 'closed'
          health: GuardrailsHealthEntry
          reason: string
      }

const toHealthEntry = (status: GuardrailStageStatus): GuardrailsHealthEntry => ({
    ok: status.ok,
    degraded: status.degraded,
    reason: status.reason,
    httpStatus: status.httpStatus,
    message: status.message,
    latencyMs: status.latencyMs
})

const healthOk = (reason: GuardrailStageStatus['reason'] = 'ok'): GuardrailsHealthEntry => ({
    ok: true,
    degraded: false,
    reason
})

const degradedFrom = (reason: GuardrailStageStatus['reason'], message?: string, httpStatus?: number): GuardrailsHealthEntry => ({
    ok: false,
    degraded: true,
    reason,
    message,
    httpStatus
})

/**
 * Runs the input stage. `text` is the user question.
 *
 * - Returns `kind: 'ok'` if the request may proceed. `inputResult` carries
 *   violations/redactions for the caller to act on (e.g. swap in redacted text).
 * - Returns `kind: 'blocked_violation'` when Fiddler reports a real block.
 *   Caller should throw 400.
 * - Returns `kind: 'blocked_degraded'` only in fail-closed mode when the stage
 *   could not be evaluated. Caller should throw 503.
 */
export async function runInputStage(text: string, ctx: RunStageContext): Promise<RunStageResult> {
    const { chatflowId, workspaceId, organizationId, chatId } = ctx

    if (!workspaceId) {
        // No workspace context means we literally cannot resolve credentials.
        // Treat as disabled-for-this-request; never fail-closed on a missing
        // workspace id because that's a platform-level bug, not a guardrail
        // outage — we don't want to mask plumbing failures as safety blocks.
        return {
            kind: 'ok',
            failureMode: 'open',
            health: healthOk('disabled')
        }
    }

    const resolution = await FiddlerGuardrailsService.resolveFromContext(chatflowId, workspaceId, organizationId)
    const { service, config } = resolution
    const failureMode: GuardrailFailureMode = config.failureMode || 'open'

    // Not enabled: legitimate skip, no banner.
    if (resolution.reason === 'disabled') {
        return { kind: 'ok', failureMode, health: healthOk('disabled') }
    }

    // Enabled but could not resolve a credential OR unexpected error loading config.
    if (!service) {
        const reason: GuardrailsHealthEntry['reason'] = resolution.reason === 'no_credentials' ? 'no_credentials' : 'unexpected'
        const health = degradedFrom(reason, resolution.error?.message)

        logger.error('[Guardrails] Stage unavailable (input)', {
            chatflowId,
            chatId,
            workspaceId,
            organizationId,
            reason,
            failureMode,
            error: resolution.error?.message
        })

        if (failureMode === 'closed') {
            return { kind: 'blocked_degraded', failureMode: 'closed', health, reason }
        }
        return { kind: 'ok', failureMode, health }
    }

    try {
        const result = await service.validateInput(text)
        const health = toHealthEntry(result.status)

        if (result.status.degraded) {
            logger.error('[Guardrails] Stage degraded (input)', {
                chatflowId,
                chatId,
                workspaceId,
                organizationId,
                reason: result.status.reason,
                httpStatus: result.status.httpStatus,
                latencyMs: result.status.latencyMs,
                failureMode
            })

            if (failureMode === 'closed') {
                return {
                    kind: 'blocked_degraded',
                    failureMode: 'closed',
                    health,
                    reason: result.status.reason
                }
            }
            // Fail-open: allow request to proceed but surface the degraded state
            return { kind: 'ok', failureMode, health, inputResult: result }
        }

        if (result.blocked) {
            logger.info('[Guardrails] Blocking content violation (input)', {
                chatflowId,
                chatId,
                workspaceId,
                safetyViolations: result.violations.safety?.map((v) => `${v.dimension}(${v.score.toFixed(2)})`),
                piiDetections: result.violations.pii?.map((p) => `${p.label}(${p.score.toFixed(2)})`)
            })
            return {
                kind: 'blocked_violation',
                failureMode,
                health,
                inputResult: result,
                message: result.message || 'Content blocked by guardrails'
            }
        }

        logger.info('[Guardrails] Input validation passed', {
            chatflowId,
            chatId,
            workspaceId,
            redacted: result.redacted,
            safetyViolations: result.violations.safety?.map((v) => `${v.dimension}(${v.score.toFixed(2)})`),
            piiDetections: result.violations.pii?.map((p) => `${p.label}(${p.score.toFixed(2)})`)
        })

        return { kind: 'ok', failureMode, health, inputResult: result }
    } catch (error) {
        // Defensive: validateInput is designed not to throw, but if any future
        // refactor regresses that contract, fall back to the failureMode path.
        const msg = (error as Error).message
        logger.error('[Guardrails] Unexpected throw in validateInput (fail-mode engaged)', {
            chatflowId,
            chatId,
            error: msg,
            failureMode
        })
        const health = degradedFrom('unexpected', msg)
        if (failureMode === 'closed') {
            return { kind: 'blocked_degraded', failureMode: 'closed', health, reason: 'unexpected' }
        }
        return { kind: 'ok', failureMode, health }
    }
}

/**
 * Runs the output stage. `text` is the LLM response, `context` is optional RAG
 * source material for faithfulness checking.
 *
 * Output validation does not block real violations (warn-only posture for
 * content already generated), but fail-closed on a degraded upstream still
 * returns `blocked_degraded` so callers can emit a trailing 503/error event.
 */
export async function runOutputStage(text: string, context: string | undefined, ctx: RunStageContext): Promise<RunStageResult> {
    const { chatflowId, workspaceId, organizationId, chatId } = ctx

    if (!workspaceId) {
        return { kind: 'ok', failureMode: 'open', health: healthOk('disabled') }
    }

    const resolution = await FiddlerGuardrailsService.resolveFromContext(chatflowId, workspaceId, organizationId)
    const { service, config } = resolution
    const failureMode: GuardrailFailureMode = config.failureMode || 'open'

    if (resolution.reason === 'disabled') {
        return { kind: 'ok', failureMode, health: healthOk('disabled') }
    }

    if (!service) {
        const reason: GuardrailsHealthEntry['reason'] = resolution.reason === 'no_credentials' ? 'no_credentials' : 'unexpected'
        const health = degradedFrom(reason, resolution.error?.message)

        logger.error('[Guardrails] Stage unavailable (output)', {
            chatflowId,
            chatId,
            workspaceId,
            organizationId,
            reason,
            failureMode
        })

        if (failureMode === 'closed') {
            return { kind: 'blocked_degraded', failureMode: 'closed', health, reason }
        }
        return { kind: 'ok', failureMode, health }
    }

    try {
        const result = await service.validateOutput(text, context)
        const health = toHealthEntry(result.status)

        if (result.status.degraded) {
            logger.error('[Guardrails] Stage degraded (output)', {
                chatflowId,
                chatId,
                workspaceId,
                organizationId,
                reason: result.status.reason,
                httpStatus: result.status.httpStatus,
                latencyMs: result.status.latencyMs,
                failureMode
            })

            if (failureMode === 'closed') {
                return {
                    kind: 'blocked_degraded',
                    failureMode: 'closed',
                    health,
                    reason: result.status.reason
                }
            }
        } else {
            logger.info('[Guardrails] Output validation completed', {
                chatflowId,
                chatId,
                workspaceId,
                redacted: result.redacted,
                faithfulnessScore: result.violations.faithfulness?.score,
                safetyViolations: result.violations.safety?.map((v) => `${v.dimension}(${v.score.toFixed(2)})`),
                piiDetections: result.violations.pii?.map((p) => `${p.label}(${p.score.toFixed(2)})`)
            })
        }

        return { kind: 'ok', failureMode, health, outputResult: result }
    } catch (error) {
        const msg = (error as Error).message
        logger.error('[Guardrails] Unexpected throw in validateOutput', {
            chatflowId,
            chatId,
            error: msg,
            failureMode
        })
        const health = degradedFrom('unexpected', msg)
        if (failureMode === 'closed') {
            return { kind: 'blocked_degraded', failureMode: 'closed', health, reason: 'unexpected' }
        }
        return { kind: 'ok', failureMode, health }
    }
}

/**
 * Stable, copy-paste-friendly 503 error for fail-closed outcomes. Use as the
 * thrown error in any caller that wants uniform wire-format.
 */
export const buildFailClosedError = (reason: string): InternalFlowiseError =>
    new InternalFlowiseError(
        StatusCodes.SERVICE_UNAVAILABLE,
        `Safety checks are temporarily unavailable (reason: ${reason}). Please try again in a moment.`
    )

/**
 * Legacy type re-export to avoid `unused` lint on the import above.
 */
export type { GuardrailsConfig }
