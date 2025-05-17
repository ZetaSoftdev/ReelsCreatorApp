// This script directly removes the problematic migration from the _prisma_migrations table
// Use with caution as it directly manipulates the migration history
require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function directMigrationFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Option 1: Mark failed migration as successful
    const updateQuery = `
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), 
          applied_steps_count = 1,
          logs = 'Marked as applied by direct-migration-fix.js script',
          rolled_back = false
      WHERE migration_name = '20250514062345_add_draft_status'
    `;
    
    console.log('Attempting to mark failed migration as successful...');
    const updateResult = await client.query(updateQuery);
    console.log(`Updated ${updateResult.rowCount} migration record(s)`);
    
    // If update didn't work (no rows affected), try deleting the record
    if (updateResult.rowCount === 0) {
      console.log('No update was made, trying to delete the migration record...');
      
      const deleteQuery = `
        DELETE FROM _prisma_migrations 
        WHERE migration_name = '20250514062345_add_draft_status'
      `;
      
      const deleteResult = await client.query(deleteQuery);
      console.log(`Deleted ${deleteResult.rowCount} migration record(s)`);
    }
    
    console.log('Migration table has been modified. Now try running prisma migrate deploy');
    
  } catch (err) {
    console.error('Error fixing migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

directMigrationFix(); 