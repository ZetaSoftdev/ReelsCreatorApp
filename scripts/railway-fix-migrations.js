// This script will mark the failed migration as applied in the database
// For use during Railway deployment where other solutions don't work
require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function fixFailedMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // First check if the failed migration exists
    const checkQuery = `
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250514062345_add_draft_status' 
      AND finished_at IS NULL
    `;
    
    const checkRes = await client.query(checkQuery);
    
    if (checkRes.rows.length === 0) {
      console.log('No failed migration found. Nothing to fix.');
      await client.end();
      return;
    }
    
    console.log('Found failed migration. Marking as applied...');
    
    // Mark the failed migration as successfully applied
    const updateQuery = `
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), 
          applied_steps_count = applied_steps_count,
          logs = 'Marked as applied by railway-fix-migrations.js script',
          rolled_back = false
      WHERE migration_name = '20250514062345_add_draft_status'
      AND finished_at IS NULL
    `;
    
    await client.query(updateQuery);
    console.log('Migration has been marked as applied successfully');
    
    // Verify the fix
    const verifyQuery = `
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250514062345_add_draft_status'
    `;
    
    const verifyRes = await client.query(verifyQuery);
    
    if (verifyRes.rows.length > 0 && verifyRes.rows[0].finished_at !== null) {
      console.log('Verification successful. Migration is now marked as applied.');
    } else {
      console.error('Verification failed. Migration may still be marked as failed.');
    }
    
  } catch (err) {
    console.error('Error fixing migration:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixFailedMigration(); 