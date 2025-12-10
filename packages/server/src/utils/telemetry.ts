// PostHog removed due to Shai-Hulud-2 security vulnerability
// Telemetry functionality disabled

export enum TelemetryEventType {
    'USER_CREATED' = 'user_created',
    'ORGANIZATION_CREATED' = 'organization_created'
}

export class Telemetry {
    constructor() {
        // PostHog removed due to Shai-Hulud-2 security vulnerability
        // Telemetry functionality disabled
    }

    async sendTelemetry(event: string, properties: Record<string, any> = {}, orgId = ''): Promise<void> {
        // Telemetry disabled - PostHog removed due to Shai-Hulud-2 security vulnerability
        // No-op implementation to maintain API compatibility
    }

    async flush(): Promise<void> {
        // Telemetry disabled - PostHog removed due to Shai-Hulud-2 security vulnerability
        // No-op implementation to maintain API compatibility
    }
}
