/**
 * Database verification and cleanup script for subscriptions
 * This script checks all subscriptions and fixes any issues with endDate fields
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function cleanupAndVerify() {
  try {
    console.log('===== SUBSCRIPTION CLEANUP AND VERIFICATION =====');
    
    // Get all subscriptions
    const allSubscriptions = await prisma.subscription.findMany();
    console.log(`Found ${allSubscriptions.length} total subscriptions`);
    
    // Group by issues
    const needsFix = [];
    const alreadyFixed = [];
    
    for (const sub of allSubscriptions) {
      console.log(`\nSubscription ID: ${sub.id}`);
      console.log(`Status: ${sub.status}`);
      console.log(`Stripe ID: ${sub.stripeSubscriptionId}`);
      console.log(`End Date: ${sub.endDate ? sub.endDate.toISOString() : 'NULL'}`);
      console.log(`Period End: ${sub.stripeCurrentPeriodEnd ? sub.stripeCurrentPeriodEnd.toISOString() : 'NULL'}`);
      
      if (!sub.endDate && sub.stripeCurrentPeriodEnd) {
        console.log('❌ Needs fix: missing endDate');
        needsFix.push(sub);
      } else if (sub.endDate) {
        console.log('✅ endDate is set');
        alreadyFixed.push(sub);
      } else {
        console.log('❓ Neither endDate nor stripeCurrentPeriodEnd is set');
      }
    }
    
    console.log(`\n${needsFix.length} subscriptions need fixing`);
    console.log(`${alreadyFixed.length} subscriptions are already fixed`);
    
    // Fix the issues
    if (needsFix.length > 0) {
      console.log('\n===== FIXING SUBSCRIPTIONS =====');
      for (const sub of needsFix) {
        try {
          console.log(`Fixing subscription ${sub.id}...`);
          const updatedSub = await prisma.subscription.update({
            where: { id: sub.id },
            data: { endDate: sub.stripeCurrentPeriodEnd }
          });
          console.log(`✅ Updated subscription ${updatedSub.id}`);
        } catch (updateError) {
          console.error(`❌ Failed to update subscription ${sub.id}:`, updateError);
        }
      }
    }
    
    // Verify that everything is fixed
    const remainingIssues = await prisma.subscription.count({
      where: {
        AND: [
          { stripeCurrentPeriodEnd: { not: null } },
          { endDate: null }
        ]
      }
    });
    
    if (remainingIssues === 0) {
      console.log('\n✅ ALL SUBSCRIPTIONS ARE NOW FIXED!');
    } else {
      console.log(`\n❌ ${remainingIssues} subscriptions still have issues`);
    }
    
    console.log('\n===== CLEANUP COMPLETED =====');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanupAndVerify()
  .then(() => console.log('Script completed successfully'))
  .catch((error) => console.error('Unhandled error:', error)); 