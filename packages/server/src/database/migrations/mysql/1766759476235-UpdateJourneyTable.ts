import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateJourneyTable1766759476235 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`journey\` 
            MODIFY COLUMN \`documents\` JSON NULL,
            MODIFY COLUMN \`tools\` JSON NULL,
            MODIFY COLUMN \`chatflows\` JSON NULL,
            MODIFY COLUMN \`userId\` VARCHAR(36) NOT NULL,
            MODIFY COLUMN \`organizationId\` VARCHAR(36) NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`journey\` 
            MODIFY COLUMN \`documents\` JSON NOT NULL,
            MODIFY COLUMN \`tools\` JSON NOT NULL,
            MODIFY COLUMN \`chatflows\` JSON NOT NULL,
            MODIFY COLUMN \`userId\` VARCHAR(36) NULL,
            MODIFY COLUMN \`organizationId\` VARCHAR(36) NULL
        `)
    }
}
