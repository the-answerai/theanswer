import { MigrationInterface, QueryRunner } from 'typeorm'

export class BackfillDocumentStoreFileChunkUserScoping1731429600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Backfill userId and organizationId for chunks with NULL values
        // by looking up the parent document_store table using storeId
        await queryRunner.query(`
            UPDATE document_store_file_chunk dfc
            SET "userId" = ds."userId",
                "organizationId" = ds."organizationId"
            FROM document_store ds
            WHERE dfc."storeId" = ds.id
              AND dfc."userId" IS NULL;
        `)

        // Also handle chunks where organizationId is NULL but userId is not
        await queryRunner.query(`
            UPDATE document_store_file_chunk dfc
            SET "userId" = ds."userId",
                "organizationId" = ds."organizationId"
            FROM document_store ds
            WHERE dfc."storeId" = ds.id
              AND dfc."organizationId" IS NULL;
        `)
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No rollback - we don't want to set these back to NULL
        // as they should have been set correctly from the start
    }
}
