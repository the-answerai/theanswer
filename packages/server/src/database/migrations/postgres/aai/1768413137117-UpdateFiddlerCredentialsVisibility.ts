import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateFiddlerCredentialsVisibility1768413137117 implements MigrationInterface {
    name = 'UpdateFiddlerCredentialsVisibility1768413137117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update all fiddlerApi credentials to Organization visibility
        // This ensures guardrails credentials are visible to all org members
        // The UI still allows selection when multiple credentials exist per org
        await queryRunner.query(`
            UPDATE "credential"
            SET "visibility" = 'Organization'
            WHERE "credentialName" = 'fiddlerApi'
            AND "visibility" = 'Private'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to Private visibility (original default)
        await queryRunner.query(`
            UPDATE "credential"
            SET "visibility" = 'Private'
            WHERE "credentialName" = 'fiddlerApi'
            AND "visibility" = 'Organization'
        `)
    }
}
