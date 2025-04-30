import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seeding process...')

  // Clean up existing data if needed
  await prisma.subscriptionPlan.deleteMany({})
  
  console.log('Creating subscription plans...')
  
  // Create subscription plans
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        id: "01",
        name: "Basic",
        description: "Add professional quality subtitles to your shorts, very quickly",
        monthlyPrice: 15,
        yearlyPrice: 19,
        features: [
          '100 subtitled shorts / month',
          'Cropping from long videos',
          '1 min 30 max per video',
          '300 MB/video',
          'Import music and sound effects',
          'Import your own video',
          'Captions with styling',
        ],
        minutesAllowed: 100,
        maxFileSize: 300,
        maxConcurrentRequests: 2,
        storageDuration: 7,
        isActive: true
      },
      {
        id: "02",
        name: "Advanced",
        description: "Turn your long-form videos into multiple shorts with a few clicks",
        monthlyPrice: 23,
        yearlyPrice: 29,
        features: [
          'Everything included in Subtitles Pro, plus...',
          '2 min max',
          '30 shorts from long videos per month',
          'Auto-Crop to vertical format (9:16)',
          '1GB and 2 hours / long video',
          'Import long video by local file or YouTube link',
          'Faceless video: 10 per week',
        ],
        minutesAllowed: 200,
        maxFileSize: 1000,
        maxConcurrentRequests: 5,
        storageDuration: 14,
        isActive: true
      },
      {
        id: "03",
        name: "Expert",
        description: "Create, plan, publish and save incredible amounts of time",
        monthlyPrice: 47,
        yearlyPrice: 59,
        features: [
          'Everything included in Advanced, plus...',
          '3 min max',
          '100 shorts from long videos / month',
          'Program & Publish to all platforms (YouTube, TikTok, Instagram, etc)',
          'Analyze content performance',
          'Faceless video: 30 per week',
        ],
        minutesAllowed: 500,
        maxFileSize: 2000,
        maxConcurrentRequests: 10,
        storageDuration: 30,
        isActive: true
      }
    ]
  })

  console.log('Seeding completed successfully')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 