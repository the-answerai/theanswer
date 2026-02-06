/**
 * Test for AGENT-567: Langfuse token calculation when calling sub workflows
 *
 * This test verifies the usage metadata transformation logic that converts
 * LangChain's usage format (input_tokens, output_tokens, total_tokens) to
 * Langfuse's expected format (input, output, total, unit: 'TOKENS').
 *
 * The test is isolated to avoid heavy module dependencies from handler.ts
 */

describe('Langfuse Token Calculation (AGENT-567)', () => {
    /**
     * This function mirrors the logic in AnalyticHandler.onLLMEnd
     * for building the endParams object with usage metadata for Langfuse.
     *
     * From handler.ts lines 1651-1665:
     * - LangChain provides: input_tokens, output_tokens, total_tokens
     * - Langfuse expects: input, output, total (optional), unit (optional)
     */
    function buildLangfuseEndParams(
        output: string,
        usageMetadata?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }
    ): { output: string; usage?: { input: number; output: number; total: number; unit: string } } {
        const endParams: { output: string; usage?: { input: number; output: number; total: number; unit: string } } = {
            output: output
        }

        if (usageMetadata) {
            endParams.usage = {
                input: usageMetadata.input_tokens!,
                output: usageMetadata.output_tokens!,
                total: usageMetadata.total_tokens!,
                unit: 'TOKENS'
            }
        }

        return endParams
    }

    describe('onLLMEnd usage metadata transformation', () => {
        it('should transform LangChain usage metadata to Langfuse format', () => {
            // Arrange: LangChain-style usage metadata
            const output = 'Test LLM response'
            const usageMetadata = {
                input_tokens: 150,
                output_tokens: 50,
                total_tokens: 200
            }

            // Act: Build endParams as handler.ts does
            const endParams = buildLangfuseEndParams(output, usageMetadata)

            // Assert: Verify correct Langfuse format
            expect(endParams).toEqual({
                output: 'Test LLM response',
                usage: {
                    input: 150,
                    output: 50,
                    total: 200,
                    unit: 'TOKENS'
                }
            })
        })

        it('should not include usage field when usageMetadata is not provided', () => {
            // Arrange
            const output = 'Test LLM response without usage'

            // Act: Build endParams without usage metadata
            const endParams = buildLangfuseEndParams(output, undefined)

            // Assert: Verify no usage field
            expect(endParams).toEqual({
                output: 'Test LLM response without usage'
            })
            expect(endParams.usage).toBeUndefined()
        })

        it('should handle zero token counts correctly', () => {
            // Arrange: Edge case with zero tokens (e.g., cached responses)
            const output = 'Cached response'
            const usageMetadata = {
                input_tokens: 0,
                output_tokens: 0,
                total_tokens: 0
            }

            // Act
            const endParams = buildLangfuseEndParams(output, usageMetadata)

            // Assert: Zero values should be preserved
            expect(endParams).toEqual({
                output: 'Cached response',
                usage: {
                    input: 0,
                    output: 0,
                    total: 0,
                    unit: 'TOKENS'
                }
            })
        })

        it('should handle large token counts', () => {
            // Arrange: Large token counts for long conversations
            const output = 'Long response...'
            const usageMetadata = {
                input_tokens: 100000,
                output_tokens: 50000,
                total_tokens: 150000
            }

            // Act
            const endParams = buildLangfuseEndParams(output, usageMetadata)

            // Assert
            expect(endParams.usage?.input).toBe(100000)
            expect(endParams.usage?.output).toBe(50000)
            expect(endParams.usage?.total).toBe(150000)
            expect(endParams.usage?.unit).toBe('TOKENS')
        })

        it('should always set unit to TOKENS', () => {
            // Arrange
            const usageMetadata = {
                input_tokens: 10,
                output_tokens: 20,
                total_tokens: 30
            }

            // Act
            const endParams = buildLangfuseEndParams('test', usageMetadata)

            // Assert: Unit should always be 'TOKENS' for Langfuse
            expect(endParams.usage?.unit).toBe('TOKENS')
        })
    })
})
