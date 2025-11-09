-- AlterTable
ALTER TABLE "public"."milestones" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';

-- AlterTable
ALTER TABLE "public"."todos" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium';
