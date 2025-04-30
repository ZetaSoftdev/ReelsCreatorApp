/*
  Warnings:

  - You are about to drop the column `filePath` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `resizedPath` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `resizedUrl` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `subtitlesPath` on the `Clip` table. All the data in the column will be lost.
  - You are about to drop the column `subtitlesUrl` on the `Clip` table. All the data in the column will be lost.
  - Added the required column `duration` to the `Clip` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filename` to the `Clip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clip" DROP COLUMN "filePath",
DROP COLUMN "resizedPath",
DROP COLUMN "resizedUrl",
DROP COLUMN "subtitlesPath",
DROP COLUMN "subtitlesUrl",
ADD COLUMN     "duration" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "externalCreatedAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "hasSrt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasWordTimestamps" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "subtitleFormat" TEXT,
ADD COLUMN     "subtitleId" TEXT,
ADD COLUMN     "subtitleUrl" TEXT,
ADD COLUMN     "withCaptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wordTimestampFormat" TEXT,
ADD COLUMN     "wordTimestampId" TEXT,
ADD COLUMN     "wordTimestampUrl" TEXT,
ALTER COLUMN "startTime" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "endTime" SET DATA TYPE DOUBLE PRECISION;
