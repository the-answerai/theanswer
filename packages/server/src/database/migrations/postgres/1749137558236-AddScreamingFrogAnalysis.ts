import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddScreamingFrogAnalysis1749137558236 implements MigrationInterface {
    name = 'AddScreamingFrogAnalysis1749137558236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "screaming_frog_analysis_file" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "projectId" uuid NOT NULL, "filename" character varying NOT NULL, "s3RawUrl" character varying NOT NULL, "promptUrl" text, "reportSectionUrl" text, "s3PromptHistory" text, "s3ReportHistory" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c48a3a6162c1fb6623392e0191" PRIMARY KEY ("id"))`
        )
        await queryRunner.query(`CREATE INDEX "IDX_4a229d651a840a4062d3583d25" ON "screaming_frog_analysis_file" ("projectId") `)
        await queryRunner.query(
            `CREATE TABLE "screaming_frog_analysis_project" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "userId" uuid NOT NULL, "organizationId" uuid NOT NULL, "isSharedWithOrg" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedBy" uuid, "description" character varying(256), CONSTRAINT "PK_52693bd76fa3c341f82c8fb6a2a" PRIMARY KEY ("id"))`
        )
        await queryRunner.query(`CREATE INDEX "IDX_18962e1b7dba7b1802c657ed52" ON "screaming_frog_analysis_project" ("userId") `)
        await queryRunner.query(`CREATE INDEX "IDX_3a24f8b800ae01ecb33a811c8d" ON "screaming_frog_analysis_project" ("organizationId") `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "screaming_frog_analysis_project"`)
        await queryRunner.query(`DROP TABLE "screaming_frog_analysis_file"`)
    }
}
