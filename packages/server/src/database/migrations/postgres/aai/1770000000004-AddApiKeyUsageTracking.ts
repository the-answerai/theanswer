import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddApiKeyUsageTracking1770000000004 implements MigrationInterface {
    name = 'AddApiKeyUsageTracking1770000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "apikey" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP`)
        await queryRunner.query(`ALTER TABLE "apikey" ADD COLUMN IF NOT EXISTS "usageCount" integer NOT NULL DEFAULT 0`)

        // Backfill createdAt for existing rows using updatedDate as the best available approximation
        await queryRunner.query(`UPDATE "apikey" SET "createdAt" = "updatedDate" WHERE "createdAt" IS NULL`)

        // Enforce default + not null now that existing rows are backfilled
        await queryRunner.query(`ALTER TABLE "apikey" ALTER COLUMN "createdAt" SET DEFAULT now()`)
        await queryRunner.query(`ALTER TABLE "apikey" ALTER COLUMN "createdAt" SET NOT NULL`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN IF EXISTS "usageCount"`)
        await queryRunner.query(`ALTER TABLE "apikey" DROP COLUMN IF EXISTS "createdAt"`)
    }
}
