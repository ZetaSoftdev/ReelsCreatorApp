import { Suspense } from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Role } from '@/lib/constants';
import { SubscriptionsTable } from '@/components/admin/subscriptions/SubscriptionsTable';
import { SubscriptionsStats } from '@/components/admin/subscriptions/SubscriptionsStats';
import { SubscriptionsFilters } from '@/components/admin/subscriptions/SubscriptionsFilters';
import { SubscriptionsCharts } from '@/components/admin/subscriptions/SubscriptionsCharts';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { MdSubscriptions } from 'react-icons/md';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSubscriptionsData(searchParams: { [key: string]: string | string[] | undefined }) {
  const page = parseInt(searchParams.page as string || '1');
  const pageSize = parseInt(searchParams.pageSize as string || '10');
  const search = searchParams.search as string || '';
  const plan = searchParams.plan as string || '';
  const status = searchParams.status as string || '';
  const sortBy = searchParams.sortBy as string || 'startDate';
  const sortOrder = searchParams.sortOrder as string || 'desc';

  const skip = (page - 1) * pageSize;

  const filters: any = {};

  if (search) {
    filters.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    };
  }

  if (plan && plan !== 'all-plans') {
    filters.plan = plan;
  }

  if (status && status !== 'all-statuses') {
    filters.status = status;
  }

  const [totalSubscriptions, subscriptions, subscriptionsByPlan, subscriptionsByStatus, revenuePipeline, revenueByPlan] = await Promise.all([
    prisma.subscription.count({ where: filters }),
    prisma.subscription.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: pageSize
    }),
    prisma.subscription.groupBy({
      by: ['plan'],
      _count: {
        plan: true
      }
    }),
    prisma.subscription.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    }),
    prisma.$queryRaw`
      SELECT SUM(CASE 
        WHEN "plan" = 'free' THEN 0
        WHEN "plan" = 'basic' THEN 9.99
        WHEN "plan" = 'pro' THEN 19.99
        WHEN "plan" = 'enterprise' THEN 49.99
        ELSE 0
      END) as total_revenue
      FROM "Subscription"
      WHERE "status" = 'active'
    `,
    prisma.$queryRaw`
      SELECT "plan", COUNT(*) as count,
      SUM(CASE 
        WHEN "plan" = 'free' THEN 0
        WHEN "plan" = 'basic' THEN 9.99
        WHEN "plan" = 'pro' THEN 19.99
        WHEN "plan" = 'enterprise' THEN 49.99
        ELSE 0
      END) as revenue
      FROM "Subscription"
      WHERE "status" = 'active'
      GROUP BY "plan"
    `
  ]);

  const totalPages = Math.ceil(totalSubscriptions / pageSize);

  const serializedSubscriptions = subscriptions.map(sub => ({
    ...sub,
    startDate: sub.startDate,
    endDate: sub.endDate,
  }));

  // Explicitly type the raw query results
  const typedRevenuePipeline = revenuePipeline as { total_revenue: number | null }[];
  const typedRevenueByPlan = revenueByPlan as { plan: string; count: number; revenue: number }[];

  const serializedMetadata = {
    subscriptionsByPlan,
    subscriptionsByStatus,
    revenue: {
      // Convert Decimal to regular number
      total: Number(typedRevenuePipeline[0]?.total_revenue || 0),
      // Convert each revenue.byPlan item Decimal to number
      byPlan: typedRevenueByPlan.map(item => ({
        plan: item.plan,
        count: Number(item.count),
        revenue: Number(item.revenue)
      }))
    }
  };

  return {
    subscriptions: serializedSubscriptions,
    pagination: {
      total: totalSubscriptions,
      pageSize,
      currentPage: page,
      totalPages
    },
    metadata: serializedMetadata
  };
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  const data = await getSubscriptionsData(searchParams);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <Link href="/admin/subscription-plans" className=" flex items-center gap-2 rounded text-white px-2 py-1 bg-purple-600 hover:bg-purple-700"><MdSubscriptions className="mr-2" /> Manage Plans</Link>
      </div>
      
      <Suspense fallback={<div>Loading stats...</div>}>
        <SubscriptionsStats data={data.metadata} />
      </Suspense>

      <Suspense fallback={<div>Loading charts...</div>}>
        <SubscriptionsCharts data={data.metadata} />
      </Suspense>

      <Suspense fallback={<div>Loading filters...</div>}>
        <SubscriptionsFilters searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<div>Loading table...</div>}>
        <SubscriptionsTable
          subscriptions={data.subscriptions}
          pagination={data.pagination}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
} 