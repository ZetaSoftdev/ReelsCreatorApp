/**
 * Script to check latest subscription in the database
 * Verifies if endDate is set correctly
 */

// Load environment variables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Create a Prisma client
const prisma = new PrismaClient();

async function checkSubscriptions() {
  try {
    console.log('===== CHECKING SUBSCRIPTIONS =====');
    
    // Find the latest subscription
    const latestSub = await prisma.subscription.findFirst({
      orderBy: { id: 'desc' }
    });
    
    if (!latestSub) {
      console.log('No subscriptions found in the database');
      return;
    }
    
    console.log('Latest subscription:');
    console.log('ID:', latestSub.id);
    console.log('User ID:', latestSub.userId);
    console.log('Status:', latestSub.status);
    console.log('Stripe ID:', latestSub.stripeSubscriptionId);
    console.log('endDate:', latestSub.endDate);
    console.log('stripeCurrentPeriodEnd:', latestSub.stripeCurrentPeriodEnd);
    
    // Check if endDate is set
    if (!latestSub.endDate) {
      console.log('WARNING: endDate is not set on this subscription!');
    } else {
      console.log('endDate is correctly set');
      
      // Check if endDate matches stripeCurrentPeriodEnd
      if (latestSub.stripeCurrentPeriodEnd) {
        const endDateStr = latestSub.endDate.toISOString();
        const periodEndStr = latestSub.stripeCurrentPeriodEnd.toISOString();
        
        console.log('Date values match:', endDateStr === periodEndStr);
      }
    }
    
    // Count all subscriptions
    const totalCount = await prisma.subscription.count();
    console.log(`\nTotal subscriptions in database: ${totalCount}`);
    
    // Count subscriptions with missing endDate
    const missingEndDateCount = await prisma.subscription.count({
      where: { endDate: null }
    });
    
    if (missingEndDateCount > 0) {
      console.log(`WARNING: ${missingEndDateCount} subscriptions have missing endDate values`);
    } else {
      console.log('All subscriptions have endDate values set');
    }
    
    console.log('===== CHECK COMPLETED =====');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSubscriptions()
  .then(() => console.log('Check completed'))
  .catch((error) => console.error('Unhandled error:', error)); 