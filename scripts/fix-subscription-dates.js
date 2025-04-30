/**
 * Database fix script to set endDate field on all subscriptions
 * This fixes subscriptions that might be missing the endDate field
 */

// Load environment variables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Create a Prisma client
const prisma = new PrismaClient();

async function fixSubscriptionDates() {
  try {
    console.log('===== SUBSCRIPTION DATE FIX SCRIPT =====');
    
    // Find all subscriptions with missing or null endDate
    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { endDate: null },
          { endDate: undefined }
        ],
        stripeCurrentPeriodEnd: { not: null } // Must have a period end to copy from
      },
      select: {
        id: true,
        userId: true,
        stripeCurrentPeriodEnd: true,
        endDate: true
      }
    });
    
    console.log(`Found ${subscriptions.length} subscriptions with missing endDate`);
    
    // Fix each subscription
    let fixedCount = 0;
    
    for (const sub of subscriptions) {
      try {
        console.log(`Fixing subscription ${sub.id} for user ${sub.userId}`);
        
        // Update the subscription with endDate set to stripeCurrentPeriodEnd
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            endDate: sub.stripeCurrentPeriodEnd
          }
        });
        
        fixedCount++;
        console.log(`Fixed subscription ${sub.id}`);
      } catch (error) {
        console.error(`Failed to fix subscription ${sub.id}:`, error);
      }
    }
    
    console.log(`Successfully fixed ${fixedCount} of ${subscriptions.length} subscriptions`);
    
    // Now verify all subscriptions have proper endDate
    const remainingMissing = await prisma.subscription.count({
      where: {
        OR: [
          { endDate: null },
          { endDate: undefined }
        ],
        stripeCurrentPeriodEnd: { not: null }
      }
    });
    
    if (remainingMissing > 0) {
      console.log(`WARNING: ${remainingMissing} subscriptions still have missing endDate`);
    } else {
      console.log('All subscriptions now have proper endDate values');
    }
    
    console.log('===== FIX SCRIPT COMPLETED =====');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix script
fixSubscriptionDates()
  .then(() => console.log('Fix script completed'))
  .catch((error) => console.error('Unhandled error:', error)); 