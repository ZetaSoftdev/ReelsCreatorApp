-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "ScheduledPost" ADD COLUMN     "externalPostId" TEXT;
