import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserId1712195113887 implements MigrationInterface {
    name = 'AddUserId1712195113887'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_chat_flow" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "flowData" text NOT NULL, "deployed" boolean, "isPublic" boolean, "apikeyid" varchar, "chatbotConfig" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), "apiConfig" text, "analytic" text, "category" text, "speechToText" text, "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_chat_flow"("id", "name", "flowData", "deployed", "isPublic", "apikeyid", "chatbotConfig", "createdDate", "updatedDate", "apiConfig", "analytic", "category", "speechToText") SELECT "id", "name", "flowData", "deployed", "isPublic", "apikeyid", "chatbotConfig", "createdDate", "updatedDate", "apiConfig", "analytic", "category", "speechToText" FROM "chat_flow"`);
        await queryRunner.query(`DROP TABLE "chat_flow"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_flow" RENAME TO "chat_flow"`);
        await queryRunner.query(`DROP INDEX "IDX_e574527322272fd838f4f0f3d3"`);
        await queryRunner.query(`CREATE TABLE "temporary_chat_message" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL, "chatflowid" varchar NOT NULL, "content" text NOT NULL, "sourceDocuments" text, "usedTools" text, "fileAnnotations" text, "fileUploads" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "chatType" varchar NOT NULL DEFAULT ('INTERNAL'), "chatId" varchar NOT NULL, "memoryType" varchar, "sessionId" varchar, "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_chat_message"("id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId") SELECT "id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId" FROM "chat_message"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_message" RENAME TO "chat_message"`);
        await queryRunner.query(`CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON "chat_message" ("chatflowid") `);
        await queryRunner.query(`CREATE TABLE "temporary_credential" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "credentialName" varchar NOT NULL, "encryptedData" text NOT NULL, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_credential"("id", "name", "credentialName", "encryptedData", "createdDate", "updatedDate") SELECT "id", "name", "credentialName", "encryptedData", "createdDate", "updatedDate" FROM "credential"`);
        await queryRunner.query(`DROP TABLE "credential"`);
        await queryRunner.query(`ALTER TABLE "temporary_credential" RENAME TO "credential"`);
        await queryRunner.query(`CREATE TABLE "temporary_assistant" ("id" varchar PRIMARY KEY NOT NULL, "details" text NOT NULL, "credential" varchar NOT NULL, "iconSrc" varchar, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_assistant"("id", "details", "credential", "iconSrc", "createdDate", "updatedDate") SELECT "id", "details", "credential", "iconSrc", "createdDate", "updatedDate" FROM "assistant"`);
        await queryRunner.query(`DROP TABLE "assistant"`);
        await queryRunner.query(`ALTER TABLE "temporary_assistant" RENAME TO "assistant"`);
        await queryRunner.query(`CREATE TABLE "temporary_chat_message_feedback" ("id" varchar PRIMARY KEY NOT NULL, "chatflowid" varchar NOT NULL, "chatId" varchar NOT NULL, "messageId" varchar NOT NULL, "rating" varchar NOT NULL, "content" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_chat_message_feedback"("id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate") SELECT "id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate" FROM "chat_message_feedback"`);
        await queryRunner.query(`DROP TABLE "chat_message_feedback"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_message_feedback" RENAME TO "chat_message_feedback"`);
        await queryRunner.query(`DROP INDEX "IDX_e574527322272fd838f4f0f3d3"`);
        await queryRunner.query(`CREATE TABLE "temporary_chat_message" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL, "chatflowid" varchar NOT NULL, "content" text NOT NULL, "sourceDocuments" text, "usedTools" text, "fileAnnotations" text, "fileUploads" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "chatType" varchar NOT NULL, "chatId" varchar NOT NULL, "memoryType" varchar, "sessionId" varchar, "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_chat_message"("id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId", "userId") SELECT "id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId", "userId" FROM "chat_message"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_message" RENAME TO "chat_message"`);
        await queryRunner.query(`CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON "chat_message" ("chatflowid") `);
        await queryRunner.query(`CREATE TABLE "temporary_variable" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "value" text, "type" text NOT NULL DEFAULT ('string'), "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_variable"("id", "name", "value", "type", "createdDate", "updatedDate") SELECT "id", "name", "value", "type", "createdDate", "updatedDate" FROM "variable"`);
        await queryRunner.query(`DROP TABLE "variable"`);
        await queryRunner.query(`ALTER TABLE "temporary_variable" RENAME TO "variable"`);
        await queryRunner.query(`CREATE TABLE "temporary_chat_message_feedback" ("id" varchar PRIMARY KEY NOT NULL, "chatflowid" varchar NOT NULL, "chatId" varchar NOT NULL, "messageId" varchar NOT NULL, "rating" varchar, "content" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar, CONSTRAINT "UQ_d7c4b4242ca813392d32bf1d96a" UNIQUE ("messageId"))`);
        await queryRunner.query(`INSERT INTO "temporary_chat_message_feedback"("id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate", "userId") SELECT "id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate", "userId" FROM "chat_message_feedback"`);
        await queryRunner.query(`DROP TABLE "chat_message_feedback"`);
        await queryRunner.query(`ALTER TABLE "temporary_chat_message_feedback" RENAME TO "chat_message_feedback"`);
        await queryRunner.query(`CREATE INDEX "IDX_f56c36fe42894d57e5c664d229" ON "chat_message_feedback" ("chatflowid") `);
        await queryRunner.query(`CREATE INDEX "IDX_9acddcb7a2b51fe37669049fc6" ON "chat_message_feedback" ("chatId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_9acddcb7a2b51fe37669049fc6"`);
        await queryRunner.query(`DROP INDEX "IDX_f56c36fe42894d57e5c664d229"`);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" RENAME TO "temporary_chat_message_feedback"`);
        await queryRunner.query(`CREATE TABLE "chat_message_feedback" ("id" varchar PRIMARY KEY NOT NULL, "chatflowid" varchar NOT NULL, "chatId" varchar NOT NULL, "messageId" varchar NOT NULL, "rating" varchar NOT NULL, "content" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "chat_message_feedback"("id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate", "userId") SELECT "id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate", "userId" FROM "temporary_chat_message_feedback"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_message_feedback"`);
        await queryRunner.query(`ALTER TABLE "variable" RENAME TO "temporary_variable"`);
        await queryRunner.query(`CREATE TABLE "variable" ("id" varchar PRIMARY KEY NOT NULL, "name" text NOT NULL, "value" text NOT NULL, "type" varchar, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "variable"("id", "name", "value", "type", "createdDate", "updatedDate") SELECT "id", "name", "value", "type", "createdDate", "updatedDate" FROM "temporary_variable"`);
        await queryRunner.query(`DROP TABLE "temporary_variable"`);
        await queryRunner.query(`DROP INDEX "IDX_e574527322272fd838f4f0f3d3"`);
        await queryRunner.query(`ALTER TABLE "chat_message" RENAME TO "temporary_chat_message"`);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL, "chatflowid" varchar NOT NULL, "content" text NOT NULL, "sourceDocuments" text, "usedTools" text, "fileAnnotations" text, "fileUploads" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "chatType" varchar NOT NULL DEFAULT ('INTERNAL'), "chatId" varchar NOT NULL, "memoryType" varchar, "sessionId" varchar, "userId" varchar)`);
        await queryRunner.query(`INSERT INTO "chat_message"("id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId", "userId") SELECT "id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId", "userId" FROM "temporary_chat_message"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_message"`);
        await queryRunner.query(`CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON "chat_message" ("chatflowid") `);
        await queryRunner.query(`ALTER TABLE "chat_message_feedback" RENAME TO "temporary_chat_message_feedback"`);
        await queryRunner.query(`CREATE TABLE "chat_message_feedback" ("id" varchar PRIMARY KEY NOT NULL, "chatflowid" varchar NOT NULL, "chatId" varchar NOT NULL, "messageId" varchar NOT NULL, "rating" varchar NOT NULL, "content" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "chat_message_feedback"("id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate") SELECT "id", "chatflowid", "chatId", "messageId", "rating", "content", "createdDate" FROM "temporary_chat_message_feedback"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_message_feedback"`);
        await queryRunner.query(`ALTER TABLE "assistant" RENAME TO "temporary_assistant"`);
        await queryRunner.query(`CREATE TABLE "assistant" ("id" varchar PRIMARY KEY NOT NULL, "details" text NOT NULL, "credential" varchar NOT NULL, "iconSrc" varchar, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "assistant"("id", "details", "credential", "iconSrc", "createdDate", "updatedDate") SELECT "id", "details", "credential", "iconSrc", "createdDate", "updatedDate" FROM "temporary_assistant"`);
        await queryRunner.query(`DROP TABLE "temporary_assistant"`);
        await queryRunner.query(`ALTER TABLE "credential" RENAME TO "temporary_credential"`);
        await queryRunner.query(`CREATE TABLE "credential" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "credentialName" varchar NOT NULL, "encryptedData" text NOT NULL, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "credential"("id", "name", "credentialName", "encryptedData", "createdDate", "updatedDate") SELECT "id", "name", "credentialName", "encryptedData", "createdDate", "updatedDate" FROM "temporary_credential"`);
        await queryRunner.query(`DROP TABLE "temporary_credential"`);
        await queryRunner.query(`DROP INDEX "IDX_e574527322272fd838f4f0f3d3"`);
        await queryRunner.query(`ALTER TABLE "chat_message" RENAME TO "temporary_chat_message"`);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" varchar PRIMARY KEY NOT NULL, "role" varchar NOT NULL, "chatflowid" varchar NOT NULL, "content" text NOT NULL, "sourceDocuments" text, "usedTools" text, "fileAnnotations" text, "fileUploads" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "chatType" varchar NOT NULL DEFAULT ('INTERNAL'), "chatId" varchar NOT NULL, "memoryType" varchar, "sessionId" varchar)`);
        await queryRunner.query(`INSERT INTO "chat_message"("id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId") SELECT "id", "role", "chatflowid", "content", "sourceDocuments", "usedTools", "fileAnnotations", "fileUploads", "createdDate", "chatType", "chatId", "memoryType", "sessionId" FROM "temporary_chat_message"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_message"`);
        await queryRunner.query(`CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON "chat_message" ("chatflowid") `);
        await queryRunner.query(`ALTER TABLE "chat_flow" RENAME TO "temporary_chat_flow"`);
        await queryRunner.query(`CREATE TABLE "chat_flow" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "flowData" text NOT NULL, "deployed" boolean, "isPublic" boolean, "apikeyid" varchar, "chatbotConfig" text, "createdDate" datetime NOT NULL DEFAULT (datetime('now')), "updatedDate" datetime NOT NULL DEFAULT (datetime('now')), "apiConfig" text, "analytic" text, "category" text, "speechToText" text)`);
        await queryRunner.query(`INSERT INTO "chat_flow"("id", "name", "flowData", "deployed", "isPublic", "apikeyid", "chatbotConfig", "createdDate", "updatedDate", "apiConfig", "analytic", "category", "speechToText") SELECT "id", "name", "flowData", "deployed", "isPublic", "apikeyid", "chatbotConfig", "createdDate", "updatedDate", "apiConfig", "analytic", "category", "speechToText" FROM "temporary_chat_flow"`);
        await queryRunner.query(`DROP TABLE "temporary_chat_flow"`);
    }

}
