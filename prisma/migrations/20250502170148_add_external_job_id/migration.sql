/*
  Warnings:

  - You are about to drop the `CaptionEdit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CaptionEdit" DROP CONSTRAINT "CaptionEdit_clipId_fkey";

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "externalJobId" TEXT,
ADD COLUMN     "lastStatusCheck" TIMESTAMP(3);

-- DropTable
DROP TABLE "CaptionEdit";
