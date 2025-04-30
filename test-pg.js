require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testPgConnection() {
  try {
    console.log('Testing PostgreSQL connection...');
    const result = await pool.query('SELECT 1 as test');
    console.log('Connection successful:', result.rows);
    
    const usersResult = await pool.query('SELECT * FROM "User" LIMIT 1');
    if (usersResult.rows.length > 0) {
      console.log('Found a user:', {
        id: usersResult.rows[0].id,
        email: usersResult.rows[0].email,
        isSubscribed: usersResult.rows[0].isSubscribed
      });
    } else {
      console.log('No users found');
    }
    
    const testTimestamp = Math.floor(Date.now() / 1000);
    console.log('Testing timestamp:', new Date(testTimestamp * 1000));
    
    // Try to update user with test data
    const userId = usersResult.rows[0]?.id;
    if (userId) {
      const updateResult = await pool.query(
        `UPDATE "User" SET 
         "stripeSubscriptionId" = $1, 
         "stripeCustomerId" = $2, 
         "stripePriceId" = $3, 
         "stripeCurrentPeriodEnd" = $4, 
         "isSubscribed" = $5
         WHERE id = $6 RETURNING id, "isSubscribed"`,
        [
          'test_sub_' + Date.now(),
          'test_cus_' + Date.now(),
          'test_price_' + Date.now(),
          new Date(testTimestamp * 1000),
          true,
          userId
        ]
      );
      
      console.log('User update result:', updateResult.rows[0]);
      
      // Check for existing subscription
      const subscriptionResult = await pool.query(
        `SELECT * FROM "Subscription" WHERE "userId" = $1`,
        [userId]
      );
      
      if (subscriptionResult.rows.length > 0) {
        console.log('Found existing subscription:', {
          id: subscriptionResult.rows[0].id,
          status: subscriptionResult.rows[0].status
        });
        
        // Update subscription
        const updateSubResult = await pool.query(
          `UPDATE "Subscription" SET 
           "status" = $1,
           "stripeSubscriptionId" = $2,
           "stripeCustomerId" = $3, 
           "stripePriceId" = $4,
           "stripeCurrentPeriodEnd" = $5
           WHERE id = $6 RETURNING id, status`,
          [
            'active',
            'test_sub_' + Date.now(),
            'test_cus_' + Date.now(),
            'test_price_' + Date.now(),
            new Date(testTimestamp * 1000),
            subscriptionResult.rows[0].id
          ]
        );
        
        console.log('Subscription update result:', updateSubResult.rows[0]);
      } else {
        console.log('No existing subscription found');
        
        // Get subscription plan
        const planResult = await pool.query(
          `SELECT * FROM "SubscriptionPlan" LIMIT 1`
        );
        
        if (planResult.rows.length > 0) {
          const plan = planResult.rows[0];
          
          // Create new subscription
          const newSubResult = await pool.query(
            `INSERT INTO "Subscription" (
              "id", "userId", "plan", "status", "startDate", "minutesAllowed", "minutesUsed",
              "stripeCustomerId", "stripeSubscriptionId", "stripePriceId", "stripeCurrentPeriodEnd", "planId"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            ) RETURNING id, status`,
            [
              'test_' + Date.now(),
              userId,
              plan.name,
              'active',
              new Date(),
              plan.minutesAllowed,
              0,
              'test_cus_' + Date.now(),
              'test_sub_' + Date.now(),
              'test_price_' + Date.now(),
              new Date(testTimestamp * 1000),
              plan.id
            ]
          );
          
          console.log('New subscription created:', newSubResult.rows[0]);
        }
      }
    }
    
    
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
  } finally {
    await pool.end();
    console.log('Connection closed');
  }
}

testPgConnection(); 