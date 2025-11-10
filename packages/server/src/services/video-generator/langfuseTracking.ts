import { Langfuse, LangfuseTraceClient, LangfuseGenerationClient } from 'langfuse'

// Initialize Langfuse client
const langfuse = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
    secretKey: process.env.LANGFUSE_SECRET_KEY!,
    baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'
})

type Provider = 'openai' | 'google'

interface VideoGenerationMetadata {
    provider: Provider
    model: string
    prompt: string
    size?: string
    seconds?: number
    aspectRatio?: string
    negativePrompt?: string
    hasReferenceImage?: boolean
    remixOf?: string | null
    organizationId: string
    userId: string
    userEmail?: string
    jobId: string
    // Billing metadata fields (required for Stripe integration)
    customerId: string
    subscriptionTier: string
    aiCredentialsOwnership: 'platform' | 'user'
}

/**
 * Determine the resolution tier based on dimensions
 * This helps categorize videos for analytics, but pricing is handled in Langfuse
 */
const getResolutionTier = (size?: string): string => {
    if (!size) return '720p'

    // Sora HD: 1024x1792 or 1792x1024
    if (size.includes('1792') || size.includes('1024x1792') || size.includes('1792x1024')) {
        return '1080p-hd'
    }
    // Standard 1080p for Veo
    if (size.includes('1920') || size.includes('1080')) {
        return '1080p'
    }
    // Default to 720p (720x1280 or 1280x720)
    return '720p'
}

/**
 * Create a Langfuse trace for video generation
 */
export const createVideoGenerationTrace = (metadata: VideoGenerationMetadata): LangfuseTraceClient => {
    const trace = langfuse.trace({
        name: 'VideoGeneration',
        userId: metadata.userId,
        sessionId: metadata.jobId,
        tags: ['Video Generation', metadata.provider, metadata.model],
        metadata: {
            provider: metadata.provider,
            model: metadata.model,
            size: metadata.size,
            seconds: metadata.seconds,
            aspectRatio: metadata.aspectRatio,
            negativePrompt: metadata.negativePrompt,
            hasReferenceImage: metadata.hasReferenceImage,
            remixOf: metadata.remixOf,
            organizationId: metadata.organizationId,
            userId: metadata.userId,
            userEmail: metadata.userEmail,
            jobId: metadata.jobId,
            // Billing metadata (required for Stripe integration)
            customerId: metadata.customerId,
            subscriptionTier: metadata.subscriptionTier,
            aiCredentialsOwnership: metadata.aiCredentialsOwnership,
            // Display name for usage events table
            chatflowName: 'Video Agent'
        },
        input: {
            prompt: metadata.prompt,
            model: metadata.model,
            parameters: {
                size: metadata.size,
                seconds: metadata.seconds,
                aspectRatio: metadata.aspectRatio
            }
        }
    })

    return trace
}

/**
 * Create a generation entry for video creation with token-based tracking
 *
 * We use a 1:1 mapping where 1 token = 1 second of video.
 * The cost per token is configured in Langfuse to match the per-second pricing.
 *
 * For example:
 * - 8 seconds of video = 8 input tokens
 * - If sora-2 costs $0.10/second, set Langfuse model pricing to $0.10/token
 * - Langfuse will calculate: 8 tokens × $0.10/token = $0.80
 */
export const createVideoGenerationGeneration = (
    trace: LangfuseTraceClient,
    metadata: VideoGenerationMetadata
): LangfuseGenerationClient => {
    const seconds = metadata.seconds || 8
    const resolution = getResolutionTier(metadata.size)

    const generation = trace.generation({
        name: `${metadata.provider}_video_generation`,
        model: metadata.model, // e.g., 'sora-2', 'sora-2-pro', 'sora-2-pro-hd'
        input: {
            prompt: metadata.prompt,
            size: metadata.size,
            seconds: seconds,
            aspectRatio: metadata.aspectRatio
        },
        metadata: {
            provider: metadata.provider,
            resolution: resolution,
            durationSeconds: seconds,
            videoSeconds: seconds, // Explicit field for clarity
            hasReferenceImage: metadata.hasReferenceImage,
            remixOf: metadata.remixOf,
            organizationId: metadata.organizationId,
            userId: metadata.userId
        },
        // Use input tokens = number of seconds
        // Langfuse will multiply by the per-token cost you configure for each model
        usage: {
            input: seconds, // Number of seconds
            output: 0, // Videos don't have output tokens
            total: seconds,
            unit: 'SECONDS' // Custom unit for clarity
        }
    })

    return generation
}

/**
 * Create a generation entry for prompt enhancement with actual token usage
 *
 * This uses standard OpenAI token counts and Langfuse will calculate cost
 * based on the model pricing configured in the Langfuse UI.
 */
export const createPromptEnhancementGeneration = (
    trace: LangfuseTraceClient,
    params: {
        model: string
        input: string
        output: string
        usage?: {
            prompt_tokens?: number
            completion_tokens?: number
            total_tokens?: number
        }
    }
): LangfuseGenerationClient => {
    const generation = trace.generation({
        name: 'prompt_enhancement',
        model: params.model, // e.g., 'gpt-4o-mini'
        input: params.input,
        output: params.output,
        usage: {
            input: params.usage?.prompt_tokens || 0,
            output: params.usage?.completion_tokens || 0,
            total: params.usage?.total_tokens || 0,
            unit: 'TOKENS'
        }
    })

    return generation
}

// No longer needed - Langfuse will calculate costs based on model pricing

/**
 * Finalize a trace with the output
 */
export const finalizeTrace = async (
    trace: LangfuseTraceClient,
    output: {
        status: 'completed' | 'failed'
        videoUrl?: string
        error?: string
        metadata?: Record<string, any>
    }
): Promise<void> => {
    await trace.update({
        output:
            output.status === 'completed'
                ? {
                      status: output.status,
                      videoUrl: output.videoUrl,
                      ...output.metadata
                  }
                : {
                      status: output.status,
                      error: output.error
                  }
    })
}

export { langfuse }
