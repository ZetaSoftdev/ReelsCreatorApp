import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting to seed database...');

  // Clean up existing data
  await prisma.clip.deleteMany({});
  await prisma.video.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.brandingSettings.deleteMany({});

  console.log('Database cleaned');

  // Create branding settings
  const brandingSettings = await prisma.brandingSettings.create({
    data: {
      siteName: 'Editur',
      logoUrl: '/trod.png',
      faviconUrl: '/favicon.ico',
      primaryColor: '#8B5CF6',
      accentColor: '#F59E0B',
      defaultFont: 'Poppins'
    }
  });

  console.log('Created branding settings:', brandingSettings.siteName);

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
      subscription: {
        create: {
          plan: 'Pro',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
          minutesAllowed: 1000,
          minutesUsed: 120,
          stripeCustomerId: 'cus_admin123',
          stripeSubscriptionId: 'sub_admin123'
        }
      }
    }
  });

  console.log('Created admin user:', admin.email);

  // Create regular users with different subscription statuses
  const plans = ['Basic', 'Standard', 'Pro'];
  const statuses = ['active', 'canceled', 'past_due', 'trialing'];

  // Create 10 regular users
  for (let i = 1; i <= 10; i++) {
    const password = await bcrypt.hash(`User123!${i}`, 10);
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        name: `Test User ${i}`,
        password: password,
        role: Role.USER,
        profileImage: `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 1}.jpg`,
        subscription: {
          create: {
            plan,
            status,
            startDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000), // Random start date up to 90 days ago
            endDate: new Date(Date.now() + Math.floor(Math.random() * 120) * 24 * 60 * 60 * 1000), // Random end date up to 120 days from now
            minutesAllowed: Math.floor(Math.random() * 1000) + 100,
            minutesUsed: Math.floor(Math.random() * 500),
            stripeCustomerId: `cus_user${i}`,
            stripeSubscriptionId: `sub_user${i}`
          }
        }
      }
    });

    console.log(`Created user ${i}:`, user.email);
    
    // Add some videos for each user
    const videoCount = Math.floor(Math.random() * 5) + 1;
    for (let j = 1; j <= videoCount; j++) {
      const video = await prisma.video.create({
        data: {
          userId: user.id,
          title: `Video ${j} by User ${i}`,
          description: `This is a test video ${j} created by user ${i}`,
          originalUrl: `https://example.com/videos/user${i}_video${j}.mp4`,
          duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
          fileSize: Math.floor(Math.random() * 1000000000) + 1000000, // 1MB - 1GB
          status: ['pending', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)],
          uploadPath: `/uploads/user${i}/video${j}.mp4`,
          processedAt: Math.random() > 0.3 ? new Date() : null
        }
      });
      
      console.log(`Added video ${j} for user ${i}`);
      
      // Add some clips for each video
      if (Math.random() > 0.3) {
        const clipCount = Math.floor(Math.random() * 3) + 1;
        for (let k = 1; k <= clipCount; k++) {
          const startTime = Math.floor(Math.random() * (video.duration - 60));
          const endTime = startTime + Math.floor(Math.random() * 60) + 30; // 30-90 seconds clip
          
          await prisma.clip.create({
            data: {
              videoId: video.id,
              title: `Clip ${k} from Video ${j}`,
              url: `https://example.com/clips/user${i}_video${j}_clip${k}.mp4`,
              startTime,
              endTime,
              filePath: `/uploads/user${i}/clips/video${j}_clip${k}.mp4`,
              resizedUrl: Math.random() > 0.5 ? `https://example.com/clips/user${i}_video${j}_clip${k}_resized.mp4` : null,
              resizedPath: Math.random() > 0.5 ? `/uploads/user${i}/clips/video${j}_clip${k}_resized.mp4` : null,
              subtitlesUrl: Math.random() > 0.5 ? `https://example.com/clips/user${i}_video${j}_clip${k}.vtt` : null,
              subtitlesPath: Math.random() > 0.5 ? `/uploads/user${i}/clips/video${j}_clip${k}.vtt` : null
            }
          });
          
          console.log(`Added clip ${k} for video ${j} of user ${i}`);
        }
      }
    }
  }

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 