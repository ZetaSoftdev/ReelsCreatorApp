// This is a local development utility to completely reset migrations and start fresh
// NOT intended for production use
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting migration reset process...');

try {
  // Step 1: Check if the migrations directory exists
  const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    console.log('📁 Removing existing migrations directory...');
    fs.rmSync(migrationsDir, { recursive: true, force: true });
    console.log('✅ Migrations directory removed');
  }

  // Step 2: Reset the database (drop all tables and data)
  console.log('🗄️ Resetting the database...');
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  console.log('✅ Database reset successfully');

  // Step 3: Create new initial migration
  console.log('🔄 Creating new initial migration...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  console.log('✅ Initial migration created successfully');

  // Step 4: Apply the migration
  console.log('📊 Applying migration...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migration applied successfully');

  // Step 5: Regenerate Prisma client
  console.log('🔧 Regenerating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client regenerated');

  console.log('🎉 Migration reset and recreation completed successfully!');
} catch (error) {
  console.error('❌ Error during migration reset process:', error);
  process.exit(1);
} 