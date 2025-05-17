-- CreateTable
CREATE TABLE "CaptionEdit" (
    "id" TEXT NOT NULL,
    "clipId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "editedContent" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptionEdit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CaptionEdit" ADD CONSTRAINT "CaptionEdit_clipId_fkey" FOREIGN KEY ("clipId") REFERENCES "Clip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
