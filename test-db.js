const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful:', result);
    
    const users = await prisma.user.findMany();
    console.log('Users count:', users.length);
    if (users.length > 0) {
      console.log('Sample user:', {
        id: users[0].id,
        email: users[0].email,
        isSubscribed: users[0].isSubscribed,
        stripeCustomerId: users[0].stripeCustomerId,
        stripeSubscriptionId: users[0].stripeSubscriptionId
      });
    }
    
    const subscriptions = await prisma.subscription.findMany();
    console.log('Subscriptions count:', subscriptions.length);
    if (subscriptions.length > 0) {
      console.log('Sample subscription:', subscriptions[0]);
    }
    
    const plans = await prisma.subscriptionPlan.findMany();
    console.log('SubscriptionPlans count:', plans.length);
    if (plans.length > 0) {
      console.log('Sample plan:', {
        id: plans[0].id,
        name: plans[0].name,
        price: plans[0].monthlyPrice
      });
    }
    
    // Test creating a subscription for the user
    try {
      if (users.length > 0 && plans.length > 0) {
        console.log('Attempting to create a test subscription for user...');
        
        // First, update the user with Stripe data
        await prisma.user.update({
          where: { id: users[0].id },
          data: {
            stripeCustomerId: 'test_customer_' + Date.now(),
            stripeSubscriptionId: 'test_subscription_' + Date.now(),
            stripePriceId: 'test_price_' + Date.now(),
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isSubscribed: true
          }
        });
        console.log('User updated with test subscription data');
        
        // Now create a subscription record linked to the user
        const testSubscription = await prisma.subscription.create({
          data: {
            userId: users[0].id,
            plan: plans[0].name,
            status: 'active',
            stripeCustomerId: 'test_customer_' + Date.now(),
            stripeSubscriptionId: 'test_subscription_' + Date.now(),
            stripePriceId: 'test_price_' + Date.now(),
            stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            minutesAllowed: plans[0].minutesAllowed,
            minutesUsed: 0,
            startDate: new Date(),
            planId: plans[0].id
          }
        });
        console.log('Test subscription created successfully:', testSubscription.id);
      }
    } catch (error) {
      console.error('Error creating test subscription:', error);
    }
    
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 