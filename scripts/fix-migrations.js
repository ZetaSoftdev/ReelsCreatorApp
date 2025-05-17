// Script to repair a failed migration
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration repair script...');
  try {
    // First, check if the _prisma_migrations table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = '_prisma_migrations'
      );
    `;

    if (!tableExists[0].exists) {
      console.error('Error: _prisma_migrations table does not exist');
      return;
    }

    // Check if the migration record exists
    const migrationRecord = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250514062345_add_draft_status'
    `;

    if (migrationRecord.length === 0) {
      // Migration doesn't exist, insert it
      await prisma.$queryRaw`
        INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid(), 
          '9f11f2eef70e9aa5b16f50ac7e67af4e1cb81e1ae9eca9c2e0d1cc6c3a3d4c8a',
          NOW(), 
          '20250514062345_add_draft_status', 
          NULL, 
          NULL, 
          NOW(), 
          1
        )
      `;
      console.log('Added missing migration record');
    } else {
      // Migration exists, mark it as successful
      const migration = migrationRecord[0];
      
      if (!migration.finished_at) {
        // Mark as finished if it's not already
        await prisma.$queryRaw`
          UPDATE _prisma_migrations
          SET finished_at = NOW(),
              applied_steps_count = 1,
              rolled_back_at = NULL
          WHERE migration_name = '20250514062345_add_draft_status'
        `;
        console.log('Fixed the state of the existing migration record');
      } else {
        console.log('Migration record already marked as successful');
      }
    }

    // Verify the status of the column and enum value
    try {
      // Check if column exists
      const columnExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'ScheduledPost'
            AND column_name = 'externalPostId'
        );
      `;
      
      console.log(`Column externalPostId exists: ${columnExists[0].exists}`);

      // Check if enum value exists
      const enumValueExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1
          FROM pg_enum
          JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
          WHERE pg_type.typname = 'poststatus'
          AND pg_enum.enumlabel = 'DRAFT'
        );
      `;
      
      console.log(`Enum value DRAFT exists: ${enumValueExists[0].exists}`);

      // If enum value is missing, add it
      if (!enumValueExists[0].exists) {
        try {
          await prisma.$executeRaw`ALTER TYPE "PostStatus" ADD VALUE 'DRAFT';`;
          console.log('Added missing DRAFT enum value');
        } catch (error) {
          console.warn(`Could not add DRAFT enum value: ${error.message}`);
        }
      }

      // If column is missing, add it
      if (!columnExists[0].exists) {
        try {
          await prisma.$executeRaw`ALTER TABLE "ScheduledPost" ADD COLUMN "externalPostId" TEXT;`;
          console.log('Added missing externalPostId column');
        } catch (error) {
          console.warn(`Could not add externalPostId column: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Error verifying database state:', error);
    }

    console.log('Migration repair completed successfully');
  } catch (error) {
    console.error('Failed to repair migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 