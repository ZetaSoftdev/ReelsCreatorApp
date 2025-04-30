const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client instance
const prisma = new PrismaClient();

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    // Try connecting to the database
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    console.log('Testing basic query...');
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful! Found ${userCount} users in the database.`);

    // Test subscription-related queries
    console.log('Testing subscription queries...');
    const subscriptionCount = await prisma.subscription.count();
    console.log(`✅ Found ${subscriptionCount} subscriptions in the database.`);

    if (subscriptionCount > 0) {
      console.log('Fetching first subscription details...');
      const firstSubscription = await prisma.subscription.findFirst({
        include: {
          user: true,
        },
      });
      
      if (firstSubscription) {
        console.log('✅ Sample subscription data:');
        console.log({
          id: firstSubscription.id,
          userId: firstSubscription.userId,
          plan: firstSubscription.plan,
          status: firstSubscription.status,
          stripeSubscriptionId: firstSubscription.stripeSubscriptionId,
          minutesAllowed: firstSubscription.minutesAllowed,
          userName: firstSubscription.user?.name || 'N/A',
        });
      }
    }

    console.log('\n✅ All database tests completed successfully!');
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

// Run the test
testConnection(); 