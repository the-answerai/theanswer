import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateJourneyTable1766759476235 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "journey" 
            ALTER COLUMN "documents" DROP NOT NULL,
            ALTER COLUMN "tools" DROP NOT NULL,
            ALTER COLUMN "chatflows" DROP NOT NULL,
            ALTER COLUMN "userId" SET NOT NULL,
            ALTER COLUMN "organizationId" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "journey" 
            ALTER COLUMN "documents" SET NOT NULL,
            ALTER COLUMN "tools" SET NOT NULL,
            ALTER COLUMN "chatflows" SET NOT NULL,
            ALTER COLUMN "userId" DROP NOT NULL,
            ALTER COLUMN "organizationId" DROP NOT NULL
        `)
    }
}
