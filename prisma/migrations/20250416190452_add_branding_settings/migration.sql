/*
  Warnings:

  - You are about to drop the column `description` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `engagement` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `processingJobId` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `quality` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `aiAnalysisId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptionPath` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `transcriptionText` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the `AIAnalysis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClipTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessingJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VideoTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "Clip" DROP CONSTRAINT "Clip_processingJobId_fkey";

-- DropForeignKey
ALTER TABLE "ClipTag" DROP CONSTRAINT "ClipTag_clipId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_aiAnalysisId_fkey";

-- DropForeignKey
ALTER TABLE "VideoTag" DROP CONSTRAINT "VideoTag_videoId_fkey";

-- AlterTable
ALTER TABLE "Clip" DROP COLUMN "description",
DROP COLUMN "engagement",
DROP COLUMN "format",
DROP COLUMN "processingJobId",
DROP COLUMN "quality",
DROP COLUMN "thumbnailUrl";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "aiAnalysisId",
DROP COLUMN "transcriptionPath",
DROP COLUMN "transcriptionText";

-- DropTable
DROP TABLE "AIAnalysis";

-- DropTable
DROP TABLE "ApiKey";

-- DropTable
DROP TABLE "ClipTag";

-- DropTable
DROP TABLE "ProcessingJob";

-- DropTable
DROP TABLE "VideoTag";

-- CreateTable
CREATE TABLE "BrandingSettings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'Reels Creator',
    "logoUrl" TEXT,
    "logoPath" TEXT,
    "faviconUrl" TEXT,
    "faviconPath" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#8B5CF6',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "defaultFont" TEXT NOT NULL DEFAULT 'Poppins',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandingSettings_pkey" PRIMARY KEY ("id")
);
