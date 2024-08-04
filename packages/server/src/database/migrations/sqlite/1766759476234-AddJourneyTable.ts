import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddJourneyTable1766759476234 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "journey" (
                "id" varchar PRIMARY KEY,
                "title" varchar NOT NULL,
                "goal" text NOT NULL,
                "documents" text NOT NULL,
                "tools" text NOT NULL,
                "chatflows" text NOT NULL,
                "userId" varchar,
                "organizationId" varchar,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "completedAt" datetime
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
