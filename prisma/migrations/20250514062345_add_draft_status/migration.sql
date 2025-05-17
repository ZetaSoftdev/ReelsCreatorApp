-- Check if the DRAFT value doesn't already exist in the enum
DO $$
BEGIN
    -- Check if DRAFT doesn't already exist in the enum
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
        WHERE pg_type.typname = 'poststatus'
        AND pg_enum.enumlabel = 'DRAFT'
    ) THEN
        -- Add the value if it doesn't exist
        ALTER TYPE "PostStatus" ADD VALUE 'DRAFT';
    END IF;
END
$$;

-- AlterTable
-- Make externalPostId column addition idempotent
DO $$
BEGIN
    -- Check if the column doesn't already exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ScheduledPost'
        AND column_name = 'externalPostId'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE "ScheduledPost" ADD COLUMN "externalPostId" TEXT;
    END IF;
END
$$;
