import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses, getCredentialData, getCredentialParam } from '../../../src/utils'

class GammaTool extends Tool {
    name: string
    description: string
    baseUrl: string
    apiKey: string
    pollUntilComplete: boolean
    pollingIntervalMs: number
    maxWaitMs: number
    logRequests: boolean
    // Configurable Gamma options
    configTextMode?: string
    configFormat?: string
    configThemeName?: string
    configThemeNameAskUser?: boolean
    configNumCards?: number
    configNumCardsAskUser?: boolean
    configCardSplit?: string
    configAdditionalInstructions?: string
    configAdditionalInstructionsAskUser?: boolean
    configExportAs?: string
    configTextAmount?: string
    configTextTone?: string
    configTextToneAskUser?: boolean
    configTextAudience?: string
    configTextAudienceAskUser?: boolean
    configTextLanguage?: string
    configTextLanguageAskUser?: boolean
    configImageSource?: string
    configImageModel?: string
    configImageModelAskUser?: boolean
    configImageStyle?: string
    configImageStyleAskUser?: boolean
    configCardDimensions?: string
    configSharingWorkspaceAccess?: string
    configSharingExternalAccess?: string

    constructor(args: {
        name: string
        description: string
        baseUrl: string
        apiKey: string
        pollUntilComplete?: boolean
        pollingIntervalSec?: number
        maxWaitSec?: number
        logRequests?: boolean
        // Configurable Gamma options
        configTextMode?: string
        configFormat?: string
        configThemeName?: string
        configThemeNameAskUser?: boolean
        configNumCards?: number
        configNumCardsAskUser?: boolean
        configCardSplit?: string
        configAdditionalInstructions?: string
        configAdditionalInstructionsAskUser?: boolean
        configExportAs?: string
        configTextAmount?: string
        configTextTone?: string
        configTextToneAskUser?: boolean
        configTextAudience?: string
        configTextAudienceAskUser?: boolean
        configTextLanguage?: string
        configTextLanguageAskUser?: boolean
        configImageSource?: string
        configImageModel?: string
        configImageModelAskUser?: boolean
        configImageStyle?: string
        configImageStyleAskUser?: boolean
        configCardDimensions?: string
        configSharingWorkspaceAccess?: string
        configSharingExternalAccess?: string
    }) {
        super()
        this.name = args.name
        this.description = args.description
        this.baseUrl = (args.baseUrl || 'https://public-api.gamma.app').replace(/\/$/, '')
        this.apiKey = args.apiKey
        this.pollUntilComplete = args.pollUntilComplete ?? true
        this.pollingIntervalMs = Math.max(1, Math.floor((args.pollingIntervalSec ?? 5) * 1000))
        this.maxWaitMs = Math.max(1, Math.floor((args.maxWaitSec ?? 300) * 1000))
        this.logRequests = args.logRequests ?? false
        // Assign config options
        this.configTextMode = args.configTextMode
        this.configFormat = args.configFormat
        this.configThemeName = args.configThemeName
        this.configThemeNameAskUser = args.configThemeNameAskUser
        this.configNumCards = args.configNumCards
        this.configNumCardsAskUser = args.configNumCardsAskUser
        this.configCardSplit = args.configCardSplit
        this.configAdditionalInstructions = args.configAdditionalInstructions
        this.configAdditionalInstructionsAskUser = args.configAdditionalInstructionsAskUser
        this.configExportAs = args.configExportAs
        this.configTextAmount = args.configTextAmount
        this.configTextTone = args.configTextTone
        this.configTextToneAskUser = args.configTextToneAskUser
        this.configTextAudience = args.configTextAudience
        this.configTextAudienceAskUser = args.configTextAudienceAskUser
        this.configTextLanguage = args.configTextLanguage
        this.configTextLanguageAskUser = args.configTextLanguageAskUser
        this.configImageSource = args.configImageSource
        this.configImageModel = args.configImageModel
        this.configImageModelAskUser = args.configImageModelAskUser
        this.configImageStyle = args.configImageStyle
        this.configImageStyleAskUser = args.configImageStyleAskUser
        this.configCardDimensions = args.configCardDimensions
        this.configSharingWorkspaceAccess = args.configSharingWorkspaceAccess
        this.configSharingExternalAccess = args.configSharingExternalAccess
    }

    /** @ignore */
    async _call(input: string): Promise<string> {
        try {
            const toByteString = (value: string) => (value ?? '').replace(/[\u0100-\uFFFF]/g, '')
            const safeHeaders = (headers: Record<string, string>) => {
                const out: Record<string, string> = {}
                for (const k of Object.keys(headers)) out[k] = toByteString(headers[k])
                return out
            }
            // Sanitize API key: trim whitespace and remove surrounding quotes
            const sanitizedKey = (this.apiKey || '').trim().replace(/^"|"$/g, '')
            const buildHeaders = (useAuthorization: boolean) =>
                safeHeaders(
                    useAuthorization
                        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${sanitizedKey}` }
                        : { 'Content-Type': 'application/json', 'X-API-KEY': sanitizedKey }
                )
            const buildGetHeaders = (useAuthorization: boolean) =>
                safeHeaders(
                    useAuthorization
                        ? { accept: 'application/json', Authorization: `Bearer ${sanitizedKey}` }
                        : { accept: 'application/json', 'X-API-KEY': sanitizedKey }
                )
            // Accept either plain string (treated as inputText) or JSON string body matching Gamma API
            let body: any
            try {
                body = input && input.trim().startsWith('{') ? JSON.parse(input) : { inputText: input }
            } catch (_) {
                body = { inputText: input }
            }

            if (!body || !body.inputText) {
                return 'Error: input must be a JSON string including "inputText" or a plain prompt string.'
            }

            // Apply configured values or ask user for missing ones
            const ASK = 'ASK_USER'
            const missing: string[] = []

            const setFixedOrAsk = (path: string[], fixedValue: any, askUser: boolean) => {
                if (askUser) {
                    // If askUser, ensure body has the value; otherwise collect as missing
                    const provided = path.reduce((acc: any, key: string) => (acc ? acc[key] : undefined), body)
                    if (provided === undefined || provided === null || provided === '' || provided === ASK) missing.push(path.join('.'))
                    return
                }
                if (fixedValue === undefined || fixedValue === null || fixedValue === '' || fixedValue === ASK) return
                let ref = body
                for (let i = 0; i < path.length - 1; i++) {
                    if (!ref[path[i]] || typeof ref[path[i]] !== 'object') ref[path[i]] = {}
                    ref = ref[path[i]]
                }
                ref[path[path.length - 1]] = fixedValue
            }

            setFixedOrAsk(['textMode'], this.configTextMode, this.configTextMode === ASK)
            setFixedOrAsk(['format'], this.configFormat, this.configFormat === ASK)
            setFixedOrAsk(['themeName'], this.configThemeName, this.configThemeNameAskUser === true)
            setFixedOrAsk(['numCards'], this.configNumCards, this.configNumCardsAskUser === true)
            setFixedOrAsk(['cardSplit'], this.configCardSplit, this.configCardSplit === ASK)
            setFixedOrAsk(['additionalInstructions'], this.configAdditionalInstructions, this.configAdditionalInstructionsAskUser === true)
            setFixedOrAsk(['exportAs'], this.configExportAs, this.configExportAs === ASK)
            setFixedOrAsk(['textOptions', 'amount'], this.configTextAmount, this.configTextAmount === ASK)
            setFixedOrAsk(['textOptions', 'tone'], this.configTextTone, this.configTextToneAskUser === true)
            setFixedOrAsk(['textOptions', 'audience'], this.configTextAudience, this.configTextAudienceAskUser === true)
            setFixedOrAsk(['textOptions', 'language'], this.configTextLanguage, this.configTextLanguageAskUser === true)
            setFixedOrAsk(['imageOptions', 'source'], this.configImageSource, this.configImageSource === ASK)
            setFixedOrAsk(
                ['imageOptions', 'model'],
                this.configImageModel,
                this.configImageModel === ASK || this.configImageModelAskUser === true
            )
            setFixedOrAsk(['imageOptions', 'style'], this.configImageStyle, this.configImageStyleAskUser === true)
            setFixedOrAsk(['cardOptions', 'dimensions'], this.configCardDimensions, this.configCardDimensions === ASK)
            setFixedOrAsk(
                ['sharingOptions', 'workspaceAccess'],
                this.configSharingWorkspaceAccess,
                this.configSharingWorkspaceAccess === ASK
            )
            setFixedOrAsk(['sharingOptions', 'externalAccess'], this.configSharingExternalAccess, this.configSharingExternalAccess === ASK)

            if (missing.length) {
                return JSON.stringify({
                    askUser: true,
                    message:
                        'Please provide the following Gamma settings: ' +
                        missing
                            .map((m) => {
                                switch (m) {
                                    case 'textMode':
                                        return 'textMode (generate, condense, preserve)'
                                    case 'format':
                                        return 'format (presentation, document, social)'
                                    case 'cardSplit':
                                        return 'cardSplit (auto, inputTextBreaks)'
                                    case 'exportAs':
                                        return 'exportAs (pdf, pptx)'
                                    case 'textOptions.amount':
                                        return 'textOptions.amount (brief, medium, detailed, extensive)'
                                    case 'imageOptions.source':
                                        return 'imageOptions.source (aiGenerated, pictographic, unsplash, giphy, webAllImages, webFreeToUse, webFreeToUseCommercially, placeholder, noImages)'
                                    case 'cardOptions.dimensions':
                                        return 'cardOptions.dimensions (fluid, 16x9, 4x3, pageless, letter, a4, 1x1, 4x5, 9x16)'
                                    case 'sharingOptions.workspaceAccess':
                                        return 'sharingOptions.workspaceAccess (noAccess, view, comment, edit, fullAccess)'
                                    case 'sharingOptions.externalAccess':
                                        return 'sharingOptions.externalAccess (noAccess, view, comment, edit)'
                                    default:
                                        return m
                                }
                            })
                            .join(', '),
                    missing
                })
            }

            // Coerce numeric fields to numbers
            if (body.numCards !== undefined) {
                const n = Number(body.numCards)
                if (Number.isFinite(n)) body.numCards = Math.max(1, Math.floor(n))
            }

            const createUrl = `${this.baseUrl}/v0.2/generations`
            const postHeaders = buildHeaders(false)
            let usingAuthorizationHeader = false
            let createResp = await fetch(createUrl, {
                method: 'POST',
                headers: postHeaders,
                body: JSON.stringify(body)
            })

            const createText = await createResp.text()
            let createJson: any
            try {
                createJson = JSON.parse(createText)
            } catch (e) {
                // Non-JSON response; keep raw text
            }

            if (!createResp.ok) {
                // Fallback: if unauthorized with X-API-KEY, try Authorization: Bearer
                if (createResp.status === 401) {
                    usingAuthorizationHeader = true
                    const authHeaders = buildHeaders(true)
                    const retryResp = await fetch(createUrl, {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify(body)
                    })
                    const retryText = await retryResp.text()
                    let retryJson: any
                    try {
                        retryJson = JSON.parse(retryText)
                    } catch (e) {
                        // Non-JSON retry response
                    }
                    if (!retryResp.ok) {
                        return JSON.stringify({ error: true, status: retryResp.status, body: retryJson ?? retryText })
                    }
                    // adopt success
                    createResp = retryResp
                    createJson = retryJson
                } else {
                    return JSON.stringify({ error: true, status: createResp.status, body: createJson ?? createText })
                }
            }

            // If not polling, return initial response (may include id and status)
            if (!this.pollUntilComplete) return JSON.stringify(createJson ?? createText)

            const id = (createJson && (createJson.id || createJson.generationId || createJson?.data?.id)) || ''
            if (!id) return JSON.stringify(createJson ?? createText)

            const statusUrl = `${this.baseUrl}/v0.2/generations/${id}`
            const start = Date.now()
            // poll for completion
            // expected statuses: pending, processing, completed; but we handle generically
            while (Date.now() - start < this.maxWaitMs) {
                await new Promise((r) => setTimeout(r, this.pollingIntervalMs))
                const getHeaders = buildGetHeaders(usingAuthorizationHeader)
                const statusResp = await fetch(statusUrl, {
                    method: 'GET',
                    headers: getHeaders
                })
                const statusText = await statusResp.text()
                let statusJson: any
                try {
                    statusJson = JSON.parse(statusText)
                } catch (e) {
                    // Non-JSON response during status poll
                }

                if (!statusResp.ok) return JSON.stringify({ error: true, status: statusResp.status, body: statusJson ?? statusText })

                const status = (statusJson && (statusJson.status || statusJson?.data?.status)) || ''
                if (['completed', 'complete', 'succeeded', 'success'].includes(status)) return JSON.stringify(statusJson)
                if (['failed', 'error', 'canceled', 'cancelled'].includes(status)) return JSON.stringify(statusJson)
            }

            return JSON.stringify({
                error: false,
                message: 'Timed out waiting for Gamma generation to complete',
                initial: createJson ?? createText
            })
        } catch (err: any) {
            const message = err?.message ?? String(err)
            if (message.includes('ByteString') || /greater than 255/.test(message)) {
                return 'Error calling Gamma API: Invalid character in request headers. Please ensure your API key contains only ASCII characters.'
            }
            return `Error calling Gamma API: ${message}`
        }
    }
}

class Gamma_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    tags: string[]
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Gamma'
        this.name = 'gamma'
        this.version = 1.0
        this.type = 'Gamma'
        this.icon = 'gamma.svg'
        this.category = 'Tools'
        this.description = 'Generate Gamma presentations, documents, or social content via Gamma API'
        this.tags = ['AAI']
        this.baseClasses = [this.type, ...getBaseClasses(GammaTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['gammaApi']
        }
        this.inputs = [
            {
                label: 'Tool Name',
                name: 'toolName',
                type: 'string',
                default: 'gamma_generate'
            },
            {
                label: 'Tool Description',
                name: 'toolDesc',
                type: 'string',
                rows: 4,
                default:
                    'Create Gamma content with POST /v0.2/generations. Input can be JSON with fields like inputText, format, textMode, etc., or a plain prompt string.'
            },
            {
                label: 'Text Mode',
                name: 'textMode',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'generate', name: 'generate' },
                    { label: 'condense', name: 'condense' },
                    { label: 'preserve', name: 'preserve' }
                ],
                default: 'ASK_USER'
            },
            {
                label: 'Format',
                name: 'format',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'presentation', name: 'presentation' },
                    { label: 'document', name: 'document' },
                    { label: 'social', name: 'social' }
                ],
                default: 'ASK_USER'
            },
            { label: 'Theme Name', name: 'themeName', type: 'string', optional: true },
            { label: 'Theme Name: Ask User', name: 'themeNameAskUser', type: 'boolean', default: false },
            { label: 'Num Cards', name: 'numCards', type: 'number', optional: true },
            { label: 'Num Cards: Ask User', name: 'numCardsAskUser', type: 'boolean', default: false },
            {
                label: 'Card Split',
                name: 'cardSplit',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'auto', name: 'auto' },
                    { label: 'inputTextBreaks', name: 'inputTextBreaks' }
                ],
                default: 'ASK_USER'
            },
            { label: 'Additional Instructions', name: 'additionalInstructions', type: 'string', optional: true },
            { label: 'Additional Instructions: Ask User', name: 'additionalInstructionsAskUser', type: 'boolean', default: false },
            {
                label: 'Export As',
                name: 'exportAs',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'pdf', name: 'pdf' },
                    { label: 'pptx', name: 'pptx' }
                ],
                default: 'ASK_USER'
            },
            {
                label: 'Text Options: Amount',
                name: 'textAmount',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'brief', name: 'brief' },
                    { label: 'medium', name: 'medium' },
                    { label: 'detailed', name: 'detailed' },
                    { label: 'extensive', name: 'extensive' }
                ],
                default: 'ASK_USER'
            },
            { label: 'Text Options: Tone', name: 'textTone', type: 'string', optional: true },
            { label: 'Text Tone: Ask User', name: 'textToneAskUser', type: 'boolean', default: false },
            { label: 'Text Options: Audience', name: 'textAudience', type: 'string', optional: true },
            { label: 'Text Audience: Ask User', name: 'textAudienceAskUser', type: 'boolean', default: false },
            { label: 'Text Options: Language', name: 'textLanguage', type: 'string', optional: true, default: 'en' },
            { label: 'Text Language: Ask User', name: 'textLanguageAskUser', type: 'boolean', default: false },
            {
                label: 'Image Options: Source',
                name: 'imageSource',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'aiGenerated', name: 'aiGenerated' },
                    { label: 'pictographic', name: 'pictographic' },
                    { label: 'unsplash', name: 'unsplash' },
                    { label: 'giphy', name: 'giphy' },
                    { label: 'webAllImages', name: 'webAllImages' },
                    { label: 'webFreeToUse', name: 'webFreeToUse' },
                    { label: 'webFreeToUseCommercially', name: 'webFreeToUseCommercially' },
                    { label: 'placeholder', name: 'placeholder' },
                    { label: 'noImages', name: 'noImages' }
                ],
                default: 'ASK_USER'
            },
            {
                label: 'Image Options: Model',
                name: 'imageModel',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'Flux Fast 1.1 (2)', name: 'flux-1-quick' },
                    { label: 'Flux Kontext Fast (2)', name: 'flux-kontext-fast' },
                    { label: 'Imagen 3 Fast (2)', name: 'imagen-3-flash' },
                    { label: 'Luma Photon Flash (2)', name: 'luma-photon-flash-1' },
                    { label: 'Flux Pro (8)', name: 'flux-1-pro' },
                    { label: 'Imagen 3 (8)', name: 'imagen-3-pro' },
                    { label: 'Ideogram 3 Turbo (10)', name: 'ideogram-v3-turbo' },
                    { label: 'Luma Photon (10)', name: 'luma-photon-1' },
                    { label: 'Leonardo Phoenix (15)', name: 'leonardo-phoenix' },
                    { label: 'Flux Kontext Pro (20)', name: 'flux-kontext-pro' },
                    { label: 'Ideogram 3 (20)', name: 'ideogram-v3' },
                    { label: 'Imagen 4 (20)', name: 'imagen-4-pro' },
                    { label: 'Recraft (20)', name: 'recraft-v3' },
                    { label: 'GPT Image (30)', name: 'gpt-image-1-medium' },
                    { label: 'Flux Ultra — Ultra plan only (30)', name: 'flux-1-ultra' },
                    { label: 'Imagen 4 Ultra — Ultra plan only (30)', name: 'imagen-4-ultra' },
                    { label: 'Dall E 3 (33)', name: 'dall-e-3' },
                    { label: 'Flux Kontext Max — Ultra plan only (40)', name: 'flux-kontext-max' },
                    { label: 'Recraft Vector Illustration (40)', name: 'recraft-v3-svg' },
                    { label: 'Ideogram 3.0 Quality — Ultra plan only (45)', name: 'ideogram-v3-quality' },
                    { label: 'GPT Image Detailed — Ultra plan only (120)', name: 'gpt-image-1-high' }
                ],
                default: 'ASK_USER'
            },
            { label: 'Image Model: Ask User', name: 'imageModelAskUser', type: 'boolean', default: false },
            { label: 'Image Options: Style', name: 'imageStyle', type: 'string', optional: true },
            { label: 'Image Style: Ask User', name: 'imageStyleAskUser', type: 'boolean', default: false },
            {
                label: 'Card Options: Dimensions',
                name: 'cardDimensions',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'fluid', name: 'fluid' },
                    { label: '16x9', name: '16x9' },
                    { label: '4x3', name: '4x3' },
                    { label: 'pageless', name: 'pageless' },
                    { label: 'letter', name: 'letter' },
                    { label: 'a4', name: 'a4' },
                    { label: '1x1', name: '1x1' },
                    { label: '4x5', name: '4x5' },
                    { label: '9x16', name: '9x16' }
                ],
                default: 'ASK_USER'
            },
            {
                label: 'Sharing: Workspace Access',
                name: 'sharingWorkspaceAccess',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'noAccess', name: 'noAccess' },
                    { label: 'view', name: 'view' },
                    { label: 'comment', name: 'comment' },
                    { label: 'edit', name: 'edit' },
                    { label: 'fullAccess', name: 'fullAccess' }
                ],
                default: 'ASK_USER'
            },
            {
                label: 'Sharing: External Access',
                name: 'sharingExternalAccess',
                type: 'options',
                options: [
                    { label: 'Ask User', name: 'ASK_USER' },
                    { label: 'noAccess', name: 'noAccess' },
                    { label: 'view', name: 'view' },
                    { label: 'comment', name: 'comment' },
                    { label: 'edit', name: 'edit' }
                ],
                default: 'ASK_USER'
            },
            {
                label: 'Poll Until Complete',
                name: 'pollUntilComplete',
                type: 'boolean',
                default: true
            },
            {
                label: 'Polling Interval (seconds)',
                name: 'pollingIntervalSec',
                type: 'number',
                default: 5
            },
            {
                label: 'Max Wait (seconds)',
                name: 'maxWaitSec',
                type: 'number',
                default: 300
            },
            {
                label: 'Log Requests',
                name: 'logRequests',
                type: 'boolean',
                default: false
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const baseUrl = getCredentialParam('baseUrl', credentialData, nodeData, 'https://public-api.gamma.app')

        const toolName = (nodeData.inputs?.toolName as string) || 'gamma_generate'
        const toolDesc =
            (nodeData.inputs?.toolDesc as string) || 'Create Gamma content. Pass JSON body per API or plain prompt (mapped to inputText).'

        const pollUntilComplete = Boolean(nodeData.inputs?.pollUntilComplete ?? true)
        const pollingIntervalSec = Number(nodeData.inputs?.pollingIntervalSec ?? 5)
        const maxWaitSec = Number(nodeData.inputs?.maxWaitSec ?? 300)
        const logRequests = Boolean(nodeData.inputs?.logRequests ?? false)

        const tool = new GammaTool({
            name: toolName,
            description: toolDesc,
            baseUrl,
            apiKey,
            pollUntilComplete,
            pollingIntervalSec,
            maxWaitSec,
            logRequests,
            // Pass through config values
            configTextMode: nodeData.inputs?.textMode as string,
            configFormat: nodeData.inputs?.format as string,
            configThemeName: nodeData.inputs?.themeName as string,
            configThemeNameAskUser: Boolean(nodeData.inputs?.themeNameAskUser),
            configNumCards: nodeData.inputs?.numCards as number,
            configNumCardsAskUser: Boolean(nodeData.inputs?.numCardsAskUser),
            configCardSplit: nodeData.inputs?.cardSplit as string,
            configAdditionalInstructions: nodeData.inputs?.additionalInstructions as string,
            configAdditionalInstructionsAskUser: Boolean(nodeData.inputs?.additionalInstructionsAskUser),
            configExportAs: nodeData.inputs?.exportAs as string,
            configTextAmount: nodeData.inputs?.textAmount as string,
            configTextTone: nodeData.inputs?.textTone as string,
            configTextToneAskUser: Boolean(nodeData.inputs?.textToneAskUser),
            configTextAudience: nodeData.inputs?.textAudience as string,
            configTextAudienceAskUser: Boolean(nodeData.inputs?.textAudienceAskUser),
            configTextLanguage: nodeData.inputs?.textLanguage as string,
            configTextLanguageAskUser: Boolean(nodeData.inputs?.textLanguageAskUser),
            configImageSource: nodeData.inputs?.imageSource as string,
            configImageModel: nodeData.inputs?.imageModel as string,
            configImageModelAskUser: Boolean(nodeData.inputs?.imageModelAskUser),
            configImageStyle: nodeData.inputs?.imageStyle as string,
            configImageStyleAskUser: Boolean(nodeData.inputs?.imageStyleAskUser),
            configCardDimensions: nodeData.inputs?.cardDimensions as string,
            configSharingWorkspaceAccess: nodeData.inputs?.sharingWorkspaceAccess as string,
            configSharingExternalAccess: nodeData.inputs?.sharingExternalAccess as string
        })

        return tool
    }
}

module.exports = { nodeClass: Gamma_Tools }
