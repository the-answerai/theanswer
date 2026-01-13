import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDefaultChatflowIdToUser1746508019301 implements MigrationInterface {
    name = 'AddDefaultChatflowIdToUser1746508019301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'user' AND column_name = 'defaultChatflowId'
            )
        `)

        if (!columnExists[0]?.exists) {
            await queryRunner.query(`ALTER TABLE "user" ADD "defaultChatflowId" character varying DEFAULT NULL`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'user' AND column_name = 'defaultChatflowId'
            )
        `)

        if (columnExists[0]?.exists) {
            await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "defaultChatflowId"`)
        }
    }
}
