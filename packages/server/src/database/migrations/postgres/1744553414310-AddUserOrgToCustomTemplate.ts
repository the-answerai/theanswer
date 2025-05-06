import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserOrgToCustomTemplate1744553414310 implements MigrationInterface {
    name = 'AddUserOrgToCustomTemplate1744553414310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "userId" character varying`)
        await queryRunner.query(`ALTER TABLE "custom_template" ADD "organizationId" character varying`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverse migration
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "organizationId"`)
        await queryRunner.query(`ALTER TABLE "custom_template" DROP COLUMN "userId"`)
    }
}
