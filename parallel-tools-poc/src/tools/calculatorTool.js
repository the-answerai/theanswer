/**
 * Calculator Tool - Performs mathematical operations
 */
import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

class CalculatorTool extends StructuredTool {
    constructor() {
        super()
        this.name = 'calculator'
        this.description = 'Perform mathematical calculations. Input should be a valid mathematical expression.'
        this.schema = z.object({
            expression: z.string().describe('The mathematical expression to evaluate, e.g. (3 + 4) * 5')
        })
    }

    async _call(input) {
        const { expression } = input

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 700))

        console.log(`Calculator tool called with expression: ${expression}`)

        try {
            // WARNING: Using eval is generally not safe for user input
            // This is just for demonstration purposes
            // In a real app, use a proper math expression parser library
            const result = eval(expression)

            return {
                expression,
                result,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            return {
                expression,
                error: `Error evaluating expression: ${error.message}`,
                timestamp: new Date().toISOString()
            }
        }
    }
}

export default CalculatorTool
