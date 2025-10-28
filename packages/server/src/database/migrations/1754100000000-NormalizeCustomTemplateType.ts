import { MigrationInterface, QueryRunner } from 'typeorm'

const UP_QUERIES: Record<string, string> = {
    postgres: `
        UPDATE "custom_template"
        SET "type" = CASE
            WHEN "type" = 'AGENTFLOW' THEN 'AgentflowV2'
            WHEN "type" = 'MULTIAGENT' THEN 'Agentflow'
            WHEN "type" = 'CHATFLOW' THEN 'Chatflow'
            ELSE "type"
        END
        WHERE "type" IN ('AGENTFLOW', 'MULTIAGENT', 'CHATFLOW')
    `,
    cockroachdb: `
        UPDATE "custom_template"
        SET "type" = CASE
            WHEN "type" = 'AGENTFLOW' THEN 'AgentflowV2'
            WHEN "type" = 'MULTIAGENT' THEN 'Agentflow'
            WHEN "type" = 'CHATFLOW' THEN 'Chatflow'
            ELSE "type"
        END
        WHERE "type" IN ('AGENTFLOW', 'MULTIAGENT', 'CHATFLOW')
    `,
    sqlite: `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AGENTFLOW' THEN 'AgentflowV2'
            WHEN type = 'MULTIAGENT' THEN 'Agentflow'
            WHEN type = 'CHATFLOW' THEN 'Chatflow'
            ELSE type
        END
        WHERE type IN ('AGENTFLOW', 'MULTIAGENT', 'CHATFLOW')
    `,
    'better-sqlite3': `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AGENTFLOW' THEN 'AgentflowV2'
            WHEN type = 'MULTIAGENT' THEN 'Agentflow'
            WHEN type = 'CHATFLOW' THEN 'Chatflow'
            ELSE type
        END
        WHERE type IN ('AGENTFLOW', 'MULTIAGENT', 'CHATFLOW')
    `,
    mysql: `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AGENTFLOW' THEN 'AgentflowV2'
            WHEN type = 'MULTIAGENT' THEN 'Agentflow'
            WHEN type = 'CHATFLOW' THEN 'Chatflow'
            ELSE type
        END
        WHERE type IN ('AGENTFLOW', 'MULTIAGENT', 'CHATFLOW')
    `,
    mariadb: `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AGENTFLOW' THEN 'AgentflowV2'
            WHEN type = 'MULTIAGENT' THEN 'Agentflow'
            WHEN type = 'CHATFLOW' THEN 'Chatflow'
            ELSE type
        END
        WHERE type IN ('AGENTFLOW', 'MULTIAGENT', 'CHATFLOW')
    `
}

const DOWN_QUERIES: Record<string, string> = {
    postgres: `
        UPDATE "custom_template"
        SET "type" = CASE
            WHEN "type" = 'AgentflowV2' THEN 'AGENTFLOW'
            WHEN "type" = 'Agentflow' THEN 'MULTIAGENT'
            WHEN "type" = 'Chatflow' THEN 'CHATFLOW'
            ELSE "type"
        END
        WHERE "type" IN ('AgentflowV2', 'Agentflow', 'Chatflow')
    `,
    cockroachdb: `
        UPDATE "custom_template"
        SET "type" = CASE
            WHEN "type" = 'AgentflowV2' THEN 'AGENTFLOW'
            WHEN "type" = 'Agentflow' THEN 'MULTIAGENT'
            WHEN "type" = 'Chatflow' THEN 'CHATFLOW'
            ELSE "type"
        END
        WHERE "type" IN ('AgentflowV2', 'Agentflow', 'Chatflow')
    `,
    sqlite: `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AgentflowV2' THEN 'AGENTFLOW'
            WHEN type = 'Agentflow' THEN 'MULTIAGENT'
            WHEN type = 'Chatflow' THEN 'CHATFLOW'
            ELSE type
        END
        WHERE type IN ('AgentflowV2', 'Agentflow', 'Chatflow')
    `,
    'better-sqlite3': `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AgentflowV2' THEN 'AGENTFLOW'
            WHEN type = 'Agentflow' THEN 'MULTIAGENT'
            WHEN type = 'Chatflow' THEN 'CHATFLOW'
            ELSE type
        END
        WHERE type IN ('AgentflowV2', 'Agentflow', 'Chatflow')
    `,
    mysql: `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AgentflowV2' THEN 'AGENTFLOW'
            WHEN type = 'Agentflow' THEN 'MULTIAGENT'
            WHEN type = 'Chatflow' THEN 'CHATFLOW'
            ELSE type
        END
        WHERE type IN ('AgentflowV2', 'Agentflow', 'Chatflow')
    `,
    mariadb: `
        UPDATE custom_template
        SET type = CASE
            WHEN type = 'AgentflowV2' THEN 'AGENTFLOW'
            WHEN type = 'Agentflow' THEN 'MULTIAGENT'
            WHEN type = 'Chatflow' THEN 'CHATFLOW'
            ELSE type
        END
        WHERE type IN ('AgentflowV2', 'Agentflow', 'Chatflow')
    `
}

const getQueryForDriver = (queries: Record<string, string>, driver: string) => {
    return queries[driver] ?? queries.postgres
}

export class NormalizeCustomTemplateType1754100000000 implements MigrationInterface {
    name = 'NormalizeCustomTemplateType1754100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const driver = queryRunner.connection.options.type
        const query = getQueryForDriver(UP_QUERIES, driver)
        await queryRunner.query(query)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const driver = queryRunner.connection.options.type
        const query = getQueryForDriver(DOWN_QUERIES, driver)
        await queryRunner.query(query)
    }
}
