/**
 * Weather Tool - Simulates getting weather information for a location
 */
import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

class WeatherTool extends StructuredTool {
    constructor() {
        super()
        this.name = 'weather'
        this.description = 'Get the current weather for a location. Input should be a city name.'
        this.schema = z.object({
            location: z.string().describe('The city and state, e.g. San Francisco, CA')
        })
    }

    async _call(input) {
        const { location } = input

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock weather data - in a real app, you would call a weather API
        const weatherOptions = ['sunny', 'partly cloudy', 'cloudy', 'rainy', 'stormy', 'snowy', 'windy']
        const tempOptions = Array.from({ length: 35 }, (_, i) => i + 40) // Temperatures 40-75°F

        const weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)]
        const temperature = tempOptions[Math.floor(Math.random() * tempOptions.length)]

        console.log(`Weather tool called for location: ${location}`)

        return {
            location,
            weather,
            temperature: `${temperature}°F`,
            humidity: `${Math.floor(Math.random() * 60) + 30}%`,
            timestamp: new Date().toISOString()
        }
    }
}

export default WeatherTool
