// Simple script to test database operations
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function main() {
  try {
    console.log('=== Testing database operations ===');
    console.log('1. Testing raw SQL connection...');
    
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Raw SQL connection successful:', result);
    } catch (error) {
      console.error('Failed to execute raw SQL query:', error);
    }
    
    console.log('2. Fetching users...');
    let users = [];
    
    try {
      users = await prisma.user.findMany();
      console.log(`Found ${users.length} users`);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    
    if (users.length === 0) {
      console.log('No users found. Exiting test.');
      return;
    }
    
    const user = users[0];
    console.log('First user details:', {
      id: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed
    });
    
    console.log('3. Fetching subscription plans...');
    let plans = [];
    
    try {
      plans = await prisma.subscriptionPlan.findMany();
      console.log(`Found ${plans.length} subscription plans`);
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
    }
    
    if (plans.length === 0) {
      console.log('No subscription plans found. Exiting test.');
      return;
    }
    
    const plan = plans[0];
    console.log('First plan details:', {
      id: plan.id,
      name: plan.name,
      minutesAllowed: plan.minutesAllowed
    });
    
    console.log('4. Updating user subscription info...');
    const stripeIds = {
      customerId: 'cus_test_' + Date.now(),
      subscriptionId: 'sub_test_' + Date.now(),
      priceId: 'price_test_' + Date.now()
    };
    
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: true,
          stripeCustomerId: stripeIds.customerId,
          stripeSubscriptionId: stripeIds.subscriptionId,
          stripePriceId: stripeIds.priceId,
          stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('User updated successfully:', {
        id: updatedUser.id,
        isSubscribed: updatedUser.isSubscribed,
        stripeCustomerId: updatedUser.stripeCustomerId,
        stripeSubscriptionId: updatedUser.stripeSubscriptionId
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      return;
    }
    
    console.log('5. Checking for existing subscription...');
    let existingSubscription;
    
    try {
      existingSubscription = await prisma.subscription.findFirst({
        where: { userId: user.id }
      });
      
      if (existingSubscription) {
        console.log('Found existing subscription:', {
          id: existingSubscription.id,
          status: existingSubscription.status
        });
      } else {
        console.log('No existing subscription found');
      }
    } catch (error) {
      console.error('Failed to check for existing subscription:', error);
    }
    
    console.log('6. Creating or updating subscription...');
    let finalSubscription;
    
    try {
      if (existingSubscription) {
        finalSubscription = await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'active',
            plan: plan.name,
            minutesAllowed: plan.minutesAllowed,
            planId: plan.id,
            stripeCustomerId: stripeIds.customerId,
            stripeSubscriptionId: stripeIds.subscriptionId,
            stripePriceId: stripeIds.priceId,
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        });
        console.log('Updated existing subscription:', finalSubscription.id);
      } else {
        finalSubscription = await prisma.subscription.create({
          data: {
            userId: user.id,
            status: 'active',
            plan: plan.name,
            minutesAllowed: plan.minutesAllowed,
            minutesUsed: 0,
            planId: plan.id,
            stripeCustomerId: stripeIds.customerId,
            stripeSubscriptionId: stripeIds.subscriptionId,
            stripePriceId: stripeIds.priceId,
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            startDate: new Date()
          }
        });
        console.log('Created new subscription:', finalSubscription.id);
      }
    } catch (error) {
      console.error('Failed to create/update subscription:', error);
      console.error('Error details:', error.code, error.meta);
    }
    
    console.log('7. Final verification...');
    
    try {
      const finalUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      console.log('Final user status:', {
        id: finalUser.id,
        isSubscribed: finalUser.isSubscribed,
        stripeSubscriptionId: finalUser.stripeSubscriptionId
      });
      
      const finalSub = await prisma.subscription.findFirst({
        where: { userId: user.id }
      });
      
      if (finalSub) {
        console.log('Final subscription status:', {
          id: finalSub.id,
          status: finalSub.status,
          plan: finalSub.plan,
          stripeSubscriptionId: finalSub.stripeSubscriptionId
        });
      } else {
        console.log('Still no subscription found for user!');
      }
    } catch (error) {
      console.error('Failed during final verification:', error);
    }
  } catch (error) {
    console.error('Top-level error in database operations:', error);
  } finally {
    await prisma.$disconnect();
    console.log('=== Database connection closed ===');
  }
}

main().then(() => console.log('Script completed')); 