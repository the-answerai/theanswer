-- AlterTable
ALTER TABLE "public"."_ChatToUser" ADD CONSTRAINT "_ChatToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_ChatToUser_AB_unique";

-- AlterTable
ALTER TABLE "public"."_DocumentToMessage" ADD CONSTRAINT "_DocumentToMessage_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_DocumentToMessage_AB_unique";

-- AlterTable
ALTER TABLE "public"."_JourneyToUser" ADD CONSTRAINT "_JourneyToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_JourneyToUser_AB_unique";

-- AlterTable
ALTER TABLE "public"."_PromptToUser" ADD CONSTRAINT "_PromptToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_PromptToUser_AB_unique";

-- AlterTable
ALTER TABLE "public"."_SidekickFavoritedBy" ADD CONSTRAINT "_SidekickFavoritedBy_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_SidekickFavoritedBy_AB_unique";

-- AlterTable
ALTER TABLE "public"."_SidekickToTasks" ADD CONSTRAINT "_SidekickToTasks_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_SidekickToTasks_AB_unique";

-- AlterTable
ALTER TABLE "public"."_UserOrganzations" ADD CONSTRAINT "_UserOrganzations_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "public"."_UserOrganzations_AB_unique";
