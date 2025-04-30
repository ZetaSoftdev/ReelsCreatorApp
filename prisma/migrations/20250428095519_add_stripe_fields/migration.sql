/*
  Warnings:

  - You are about to drop the column `jobId` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripePriceId" TEXT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "stripePriceId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "jobId";
