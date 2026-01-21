import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddOrganizationConfig1753200000001 implements MigrationInterface {
    name = 'AddOrganizationConfig1753200000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "organizationConfig" jsonb`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN IF EXISTS "organizationConfig"`)
    }
}
