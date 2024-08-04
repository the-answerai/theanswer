import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddJourneyTable1766759476234 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`journey\` (
                \`id\` varchar(36) PRIMARY KEY,
                \`title\` varchar(255) NOT NULL,
                \`goal\` text NOT NULL,
                \`documents\` json NOT NULL,
                \`tools\` json NOT NULL,
                \`chatflows\` json NOT NULL,
                \`userId\` varchar(36),
                \`organizationId\` varchar(36),
                \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`completedAt\` TIMESTAMP NULL
            ) ENGINE=InnoDB
        `)

        await queryRunner.query(`
            CREATE INDEX \`IDX_journey_userId\` ON \`journey\` (\`userId\`)
        `)

        await queryRunner.query(`
            CREATE INDEX \`IDX_journey_organizationId\` ON \`journey\` (\`organizationId\`)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_journey_organizationId\` ON \`journey\``)
        await queryRunner.query(`DROP INDEX \`IDX_journey_userId\` ON \`journey\``)
        await queryRunner.query(`DROP TABLE \`journey\``)
    }
}
