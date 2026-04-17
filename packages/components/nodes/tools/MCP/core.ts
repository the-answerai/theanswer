import { CallToolRequest, CallToolResultSchema, ListToolsResult, ListToolsResultSchema } from '@modelcontextprotocol/sdk/types.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport, StdioServerParameters } from '@modelcontextprotocol/sdk/client/stdio.js'
import { BaseToolkit, tool, Tool } from '@langchain/core/tools'
import { z } from 'zod'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'

export class MCPToolkit extends BaseToolkit {
    tools: Tool[] = []
    _tools: ListToolsResult | null = null
    model_config: any
    transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null = null
    client: Client | null = null
    serverParams: StdioServerParameters | any
    transportType: 'stdio' | 'sse'
    constructor(serverParams: StdioServerParameters | any, transportType: 'stdio' | 'sse', accessToken: string | null = null) {
        super()
        this.serverParams = serverParams
        this.transportType = transportType
        this.serverParams.headers = {
            ...this.serverParams.headers,
            Authorization: `Bearer ${accessToken}`
        }
    }

    // Method to create a new client with transport
    async createClient(): Promise<Client> {
        const client = new Client(
            {
                name: 'flowise-client',
                version: '1.0.0'
            },
            {
                capabilities: {}
            }
        )

        let transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport

        if (this.transportType === 'stdio') {
            // Compatible with overridden PATH configuration
            const params = {
                ...this.serverParams,
                env: {
                    ...(this.serverParams.env || {}),
                    PATH: process.env.PATH
                }
            }

            transport = new StdioClientTransport(params as StdioServerParameters)
            await client.connect(transport)
        } else {
            if (this.serverParams.url === undefined) {
                throw new Error('URL is required for SSE transport')
            }

            const baseUrl = new URL(this.serverParams.url)
            try {
                if (this.serverParams.headers) {
                    transport = new StreamableHTTPClientTransport(baseUrl, {
                        requestInit: {
                            headers: this.serverParams.headers
                        }
                    })
                } else {
                    transport = new StreamableHTTPClientTransport(baseUrl)
                }
                await client.connect(transport)
            } catch (error) {
                if (this.serverParams.headers) {
                    transport = new SSEClientTransport(baseUrl, {
                        requestInit: {
                            headers: this.serverParams.headers
                        },
                        eventSourceInit: {
                            fetch: (url, init) => fetch(url, { ...init, headers: this.serverParams.headers })
                        }
                    })
                } else {
                    transport = new SSEClientTransport(baseUrl)
                }
                await client.connect(transport)
            }
        }

        return client
    }

    async initialize() {
        if (this._tools === null) {
            try {
                this.client = await this.createClient()
                this._tools = await this.client.request({ method: 'tools/list' }, ListToolsResultSchema)
                this.tools = await this.get_tools()

                // Close the initial client after initialization
                await this.client.close()
            } catch (error) {
                console.error('MCP Toolkit: Failed to initialize, setting empty tools:', error)
                this._tools = { tools: [] }
                this.tools = []
                if (this.client) {
                    try {
                        await this.client.close()
                    } catch (closeError) {
                        console.error('MCP Toolkit: Error closing client:', closeError)
                    }
                }
            }
        }
    }

    async get_tools(): Promise<Tool[]> {
        if (this._tools === null) {
            console.error('MCP Toolkit: get_tools called before initialization, returning empty array')
            return []
        }
        const toolsPromises = this._tools.tools.map(async (tool: any) => {
            if (this.client === null) {
                throw new Error('Client is not initialized')
            }
            return await MCPTool({
                toolkit: this,
                name: tool.name,
                description: tool.description || '',
                argsSchema: createSchemaModel(tool.inputSchema)
            })
        })
        const res = await Promise.allSettled(toolsPromises)
        const errors = res.filter((r: any) => r.status === 'rejected')
        if (errors.length !== 0) {
            console.error('MCP Tools failed to be resolved', errors)
        }
        const successes = res.filter((r: any) => r.status === 'fulfilled').map((r: any) => r.value)
        return successes
    }
}

export async function MCPTool({
    toolkit,
    name,
    description,
    argsSchema
}: {
    toolkit: MCPToolkit
    name: string
    description: string
    argsSchema: any
}): Promise<Tool> {
    return tool(
        async (input): Promise<string> => {
            // Create a new client for this request
            const client = await toolkit.createClient()

            try {
                const req: CallToolRequest = { method: 'tools/call', params: { name: name, arguments: input as any } }
                const res = await client.request(req, CallToolResultSchema)
                const content = res.content
                const contentString = JSON.stringify(content)
                return contentString
            } finally {
                // Always close the client after the request completes
                await client.close()
            }
        },
        {
            name: name,
            description: description,
            schema: argsSchema
        }
    )
}

function createSchemaModel(
    inputSchema: {
        type: 'object'
        properties?: import('zod').objectOutputType<{}, import('zod').ZodTypeAny, 'passthrough'> | undefined
    } & { [k: string]: unknown }
): any {
    if (inputSchema.type !== 'object' || !inputSchema.properties) {
        throw new Error('Invalid schema type or missing properties')
    }

    const schemaProperties = Object.entries(inputSchema.properties).reduce((acc, [key, _]) => {
        acc[key] = z.any()
        return acc
    }, {} as Record<string, import('zod').ZodTypeAny>)

    return z.object(schemaProperties)
}

export const validateArgsForLocalFileAccess = (args: string[]): void => {
    const dangerousPatterns = [
        // Absolute paths
        /^\/[^/]/, // Unix absolute paths starting with /
        /^[a-zA-Z]:\\/, // Windows absolute paths like C:\

        // Relative paths that could escape current directory
        /\.\.\//, // Parent directory traversal with ../
        /\.\.\\/, // Parent directory traversal with ..\
        /^\.\./, // Starting with ..

        // Local file access patterns
        /^\.\//, // Current directory with ./
        /^~\//, // Home directory with ~/
        /^file:\/\//, // File protocol

        // Common file extensions that shouldn't be accessed
        /\.(exe|bat|cmd|sh|ps1|vbs|scr|com|pif|dll|sys)$/i,

        // File flags and options that could access local files
        /^--?(?:file|input|output|config|load|save|import|export|read|write)=/i,
        /^--?(?:file|input|output|config|load|save|import|export|read|write)$/i
    ]

    for (const arg of args) {
        if (typeof arg !== 'string') continue

        // Check for dangerous patterns
        for (const pattern of dangerousPatterns) {
            if (pattern.test(arg)) {
                throw new Error(`Argument contains potential local file access: "${arg}"`)
            }
        }

        // Check for null bytes
        if (arg.includes('\0')) {
            throw new Error(`Argument contains null byte: "${arg}"`)
        }

        // Check for very long paths that might be used for buffer overflow attacks
        if (arg.length > 1000) {
            throw new Error(`Argument is suspiciously long (${arg.length} characters): "${arg.substring(0, 100)}..."`)
        }
    }
}

export const validateCommandInjection = (args: string[]): void => {
    const dangerousPatterns = [
        // Shell metacharacters
        /[;&|`$(){}[\]<>]/,
        // Command chaining
        /&&|\|\||;;/,
        // Redirections
        />>|<<|>/,
        // Backticks and command substitution
        /`|\$\(/,
        // Process substitution
        /<\(|>\(/
    ]

    for (const arg of args) {
        if (typeof arg !== 'string') continue

        for (const pattern of dangerousPatterns) {
            if (pattern.test(arg)) {
                throw new Error(`Argument contains potentially dangerous characters: "${arg}"`)
            }
        }
    }
}

/**
 * Security hardening for CVE-2026-40933 (Flowise MCP stdio RCE).
 *
 * The CVE exploits the fact that several allowlisted interpreters (npx, node,
 * python, python3) support "inline code execution" flags that accept an arbitrary
 * string and execute it as code or as a shell command. The existing
 * shell-metacharacter check in validateCommandInjection does not trigger on a
 * payload like:
 *
 *   { "command": "npx", "args": ["-c", "touch /tmp/pwn"] }
 *
 * because "-c" and "touch /tmp/pwn" each contain no metacharacters on their
 * own. npx then interprets -c/--call as "execute the following string as a
 * shell command", resulting in RCE.
 *
 * This validator rejects any argument list that contains an inline-exec flag
 * in any of the common argv forms (the CLIs we care about accept all three):
 *
 *   -c cmd             // separate-argument form
 *   -ccmd              // adjacent value (short flag only)
 *   --call=cmd         // attached value (long flag)
 *   --call cmd         // separate-argument long form (caught by exact match)
 *
 * The blocklist is keyed by command, because the same short flag has very
 * different semantics in different CLIs. For example, `-e` is a code-eval
 * flag for node but is the standard env-var flag for docker (`docker run -e
 * API_TOKEN`). Blocking -e globally would break legitimate docker-based MCP
 * configs, including the documented CustomMCP example.
 *
 * Per-command inline-exec flags:
 *   node            : -e / --eval, -p / --print
 *   npx             : -c / --call
 *   python, python3 : -c
 *   docker          : (none at the docker CLI level)
 *
 * Legitimate MCP server configs (e.g. `npx -y @modelcontextprotocol/server-filesystem`,
 * `docker run -i --rm -e API_TOKEN image`) do not use any of the blocked flags,
 * so this is non-breaking for normal usage.
 */
export const validateInlineExecFlags = (command: string | undefined, args: string[]): void => {
    const inlineExecFlagsByCommand: Record<string, string[]> = {
        node: ['-e', '--eval', '-p', '--print'],
        npx: ['-c', '--call'],
        python: ['-c'],
        python3: ['-c']
    }

    const forbiddenFlags = inlineExecFlagsByCommand[command ?? '']
    if (!forbiddenFlags || forbiddenFlags.length === 0) return

    const matchesFlag = (arg: string, flag: string): boolean => {
        const lower = arg.toLowerCase()

        // Exact match: "-c" or "--call"
        if (lower === flag) return true

        // Attached value with "=": "--call=evil" or "-c=evil"
        if (lower.startsWith(flag + '=')) return true

        // Adjacent value on a short flag (no space/equals): "-ccmd", "-ecode"
        // Only applies to single-char short flags to avoid false positives on
        // long flags such as "--eval-something" (not a real flag but safer).
        if (flag.length === 2 && flag.startsWith('-') && !flag.startsWith('--')) {
            if (lower.startsWith(flag) && lower.length > flag.length) return true
        }

        return false
    }

    for (const arg of args) {
        if (typeof arg !== 'string') continue

        for (const flag of forbiddenFlags) {
            if (matchesFlag(arg, flag)) {
                throw new Error(
                    `Argument "${arg}" is an inline code-execution flag for "${command}" and is not permitted in MCP server configurations (CVE-2026-40933 mitigation).`
                )
            }
        }
    }
}

export const validateEnvironmentVariables = (env: Record<string, any>): void => {
    const dangerousEnvVars = ['PATH', 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH']

    for (const [key, value] of Object.entries(env)) {
        if (dangerousEnvVars.includes(key)) {
            throw new Error(`Environment variable '${key}' modification is not allowed`)
        }

        if (typeof value === 'string' && value.includes('\0')) {
            throw new Error(`Environment variable '${key}' contains null byte`)
        }
    }
}

export const validateMCPServerConfig = (serverParams: any): void => {
    // Validate the entire server configuration
    if (!serverParams || typeof serverParams !== 'object') {
        throw new Error('Invalid server configuration')
    }

    // Command allowlist - only allow specific safe commands
    const allowedCommands = ['node', 'npx', 'python', 'python3', 'docker']

    if (serverParams.command && !allowedCommands.includes(serverParams.command)) {
        throw new Error(`Command '${serverParams.command}' is not allowed. Allowed commands: ${allowedCommands.join(', ')}`)
    }

    // Validate arguments if present
    if (serverParams.args && Array.isArray(serverParams.args)) {
        validateArgsForLocalFileAccess(serverParams.args)
        validateCommandInjection(serverParams.args)
        // CVE-2026-40933: reject inline code-execution flags (-c / --call / -e / --eval / -p / --print
        // and their --flag=value / -fvalue variants) that bypass the shell-metacharacter check by
        // wrapping arbitrary code in a separate or attached argument. Command-aware so docker's -e
        // (env var) flag and other legitimate uses are not falsely blocked.
        validateInlineExecFlags(serverParams.command, serverParams.args)
    }

    // Validate environment variables
    if (serverParams.env) {
        validateEnvironmentVariables(serverParams.env)
    }
}
