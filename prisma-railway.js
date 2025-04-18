// prisma-railway.js - Special script for Railway deployment
console.log('⚡ Initializing Prisma for Railway deployment');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure we're in the right directory
const clientDir = path.join(__dirname, 'prisma', 'generated', 'client');
const prismaDir = path.join(__dirname, 'node_modules', '.prisma', 'client');

// Ensure directories exist
try {
  if (!fs.existsSync(path.join(__dirname, 'node_modules', '.prisma'))) {
    fs.mkdirSync(path.join(__dirname, 'node_modules', '.prisma'), { recursive: true });
  }
  
  // Generate Prisma client if it doesn't exist
  if (!fs.existsSync(clientDir)) {
    console.log('✨ Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
  }
  
  // Copy the generated client to node_modules/.prisma/client
  if (fs.existsSync(clientDir) && !fs.existsSync(prismaDir)) {
    console.log('📋 Copying Prisma Client to node_modules/.prisma/client...');
    execSync(`mkdir -p "${path.join(__dirname, 'node_modules', '.prisma')}" && cp -R "${clientDir}" "${path.dirname(prismaDir)}"`, { stdio: 'inherit' });
  }
  
  console.log('✅ Prisma initialization for Railway completed successfully!');
} catch (error) {
  console.error('❌ Error initializing Prisma for Railway:', error);
  process.exit(1);
} 