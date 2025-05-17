-- CreateTable
CREATE TABLE "EditedVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captionStyle" JSONB,

    CONSTRAINT "EditedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditedVideo_userId_idx" ON "EditedVideo"("userId");

-- AddForeignKey
ALTER TABLE "EditedVideo" ADD CONSTRAINT "EditedVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
