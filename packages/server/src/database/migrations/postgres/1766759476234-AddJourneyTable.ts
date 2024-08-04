import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddJourneyTable1766759476234 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "journey" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "title" varchar NOT NULL,
                "goal" text NOT NULL,
                "documents" jsonb NOT NULL,
                "tools" jsonb NOT NULL,
                "chatflows" jsonb NOT NULL,
                "userId" uuid,
                "organizationId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP
            )
        `)

        await queryRunner.query(`
            CREATE INDEX "IDX_journey_userId" ON "journey" ("userId")
        `)

        await queryRunner.query(`
            CREATE INDEX "IDX_journey_organizationId" ON "journey" ("organizationId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_journey_organizationId"`)
        await queryRunner.query(`DROP INDEX "IDX_journey_userId"`)
        await queryRunner.query(`DROP TABLE "journey"`)
    }
}
