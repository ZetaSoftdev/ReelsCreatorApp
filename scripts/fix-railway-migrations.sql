-- PostgreSQL script to fix failed migrations on Railway
-- Execute this in Railway's PostgreSQL Query editor

-- 1. First try to update any failed migrations to mark them as successful
UPDATE _prisma_migrations 
SET 
  finished_at = NOW(), 
  applied_steps_count = 1,
  logs = 'Fixed manually via SQL script',
  rolled_back = false
WHERE finished_at IS NULL;

-- 2. If the migration for 20250517115132_init specifically exists and failed, fix it
UPDATE _prisma_migrations 
SET 
  finished_at = NOW(), 
  applied_steps_count = 1,
  logs = 'Fixed manually via SQL script',
  rolled_back = false
WHERE migration_name = '20250517115132_init' AND finished_at IS NULL;

-- 3. Make sure our new clean migration is recorded whether or not it was applied
INSERT INTO _prisma_migrations 
  (id, checksum, finished_at, migration_name, logs, rolled_back, started_at, applied_steps_count)
VALUES
  (gen_random_uuid(), 'deadbeef', NOW(), '20250517131500_add_draft_status_clean', 'Applied manually', false, NOW(), 1)
ON CONFLICT (migration_name) 
DO UPDATE SET 
  finished_at = NOW(),
  applied_steps_count = 1,
  logs = 'Migration record fixed manually';

-- 4. Make sure the PostStatus enum has the DRAFT value
DO $$
DECLARE
  enum_exists boolean;
  draft_exists boolean;
BEGIN
  -- Check if the enum type exists
  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'poststatus'
  ) INTO enum_exists;
  
  IF enum_exists THEN
    -- Check if DRAFT value already exists in the enum
    SELECT EXISTS (
      SELECT 1 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'poststatus' 
      AND e.enumlabel = 'DRAFT'
    ) INTO draft_exists;
    
    -- Only add DRAFT if it doesn't exist
    IF NOT draft_exists THEN
      EXECUTE 'ALTER TYPE "PostStatus" ADD VALUE ''DRAFT''';
      RAISE NOTICE 'Added DRAFT to PostStatus enum';
    ELSE
      RAISE NOTICE 'DRAFT already exists in PostStatus enum';
    END IF;
  ELSE
    RAISE NOTICE 'PostStatus enum does not exist';
  END IF;
END
$$;

-- 5. Make sure externalPostId column exists in ScheduledPost table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ScheduledPost'
    AND column_name = 'externalPostId'
  ) THEN
    ALTER TABLE "ScheduledPost" ADD COLUMN "externalPostId" TEXT;
    RAISE NOTICE 'Added externalPostId column to ScheduledPost table';
  ELSE
    RAISE NOTICE 'externalPostId column already exists in ScheduledPost table';
  END IF;
END
$$; 