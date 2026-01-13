import { MigrationInterface, QueryRunner } from 'typeorm'

export class BilingOrganization1740859194641 implements MigrationInterface {
    name = 'BilingOrganization1740859194641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Use ADD COLUMN IF NOT EXISTS for idempotency (column may exist from restore migration)
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "billingPoolEnabled" boolean NOT NULL DEFAULT false`)
        await queryRunner.query(`ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "stripeCustomerId" character varying DEFAULT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "organizationId" DROP NOT NULL`)
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "stripeCustomerId"`)
        await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "billingPoolEnabled"`)
    }
}
