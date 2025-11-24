import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { getUserHome, getUserSettingsFilePath } from '.'

export class Telemetry {
    constructor() {
        // PostHog removed due to Shai-Hulud-2 security vulnerability
        // Telemetry functionality disabled
    }

    async id(): Promise<string> {
        try {
            const settingsContent = await fs.promises.readFile(getUserSettingsFilePath(), 'utf8')
            const settings = JSON.parse(settingsContent)
            return settings.instanceId
        } catch (error) {
            const instanceId = uuidv4()
            const settings = {
                instanceId
            }
            const defaultLocation = process.env.SECRETKEY_PATH
                ? path.join(process.env.SECRETKEY_PATH, 'settings.json')
                : path.join(getUserHome(), '.flowise', 'settings.json')
            await fs.promises.writeFile(defaultLocation, JSON.stringify(settings, null, 2))
            return instanceId
        }
    }

    async sendTelemetry(event: string, properties = {}): Promise<void> {
        // Telemetry disabled - PostHog removed due to Shai-Hulud-2 security vulnerability
        // No-op implementation to maintain API compatibility
    }

    async flush(): Promise<void> {
        // Telemetry disabled - PostHog removed due to Shai-Hulud-2 security vulnerability
        // No-op implementation to maintain API compatibility
    }
}
