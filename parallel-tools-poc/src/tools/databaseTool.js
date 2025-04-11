/**
 * Database Tool - Simulates database queries
 */
import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

class DatabaseTool extends StructuredTool {
    constructor() {
        super()
        this.name = 'database'
        this.description = 'Query a database for information. Specify the entity type and ID.'
        this.schema = z.object({
            entityType: z.string().describe('The type of entity to look up (user, product, order, etc.)'),
            entityId: z.string().describe('The ID of the entity to look up')
        })

        // Mock database
        this.mockDatabase = {
            users: {
                'user-123': { id: 'user-123', name: 'John Doe', email: 'john@example.com', role: 'admin' },
                'user-456': { id: 'user-456', name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
            },
            products: {
                'prod-789': { id: 'prod-789', name: 'Laptop', price: 999.99, category: 'electronics' },
                'prod-101': { id: 'prod-101', name: 'Headphones', price: 149.99, category: 'accessories' }
            },
            orders: {
                'order-111': { id: 'order-111', userId: 'user-123', productId: 'prod-789', status: 'shipped' },
                'order-222': { id: 'order-222', userId: 'user-456', productId: 'prod-101', status: 'pending' }
            }
        }
    }

    async _call(input) {
        const { entityType, entityId } = input

        // Simulate database lookup delay
        await new Promise((resolve) => setTimeout(resolve, 1200))

        console.log(`Database tool called for ${entityType}:${entityId}`)

        // Check if entity type exists
        if (!this.mockDatabase[entityType]) {
            return {
                error: `Entity type "${entityType}" not found in database`,
                availableTypes: Object.keys(this.mockDatabase),
                timestamp: new Date().toISOString()
            }
        }

        // Check if entity ID exists
        if (!this.mockDatabase[entityType][entityId]) {
            return {
                error: `${entityType} with ID "${entityId}" not found`,
                availableIds: Object.keys(this.mockDatabase[entityType]),
                timestamp: new Date().toISOString()
            }
        }

        return {
            result: this.mockDatabase[entityType][entityId],
            timestamp: new Date().toISOString()
        }
    }
}

export default DatabaseTool
