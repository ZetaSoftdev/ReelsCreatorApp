import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSubscription(id: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true
        }
      }
    }
  });

  return subscription;
}

const PLAN_COLORS = {
  free: "#9CA3AF",
  basic: "#60A5FA",
  pro: "#8B5CF6",
  enterprise: "#F59E0B",
};

const formatDate = (date: Date | null): string => {
  if (!date) return "N/A";
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getInitials = (name: string | null): string => {
  if (!name) return "U";
  
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export default async function SubscriptionPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  if (session.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  const subscription = await getSubscription(params.id);

  if (!subscription) {
    redirect('/admin/subscriptions');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href="/admin/subscriptions">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subscriptions
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Subscription Details
          </h1>
        </div>
        <Button asChild>
          <Link href={`/admin/subscriptions/edit/${params.id}`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Subscription
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={subscription.user.profileImage || undefined} />
                <AvatarFallback className="bg-purple-100 text-purple-700 text-lg">
                  {getInitials(subscription.user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{subscription.user.name || "Unnamed User"}</h3>
                <p className="text-gray-500">{subscription.user.email}</p>
                <Link 
                  href={`/admin/users/${subscription.userId}`} 
                  className="text-sm text-purple-600 hover:underline mt-2 inline-block"
                >
                  View User Profile
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">Plan</span>
              <Badge
                className="capitalize"
                style={{
                  backgroundColor: `${PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS]}30`,
                  color: PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS],
                  borderColor: PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS]
                }}
              >
                {subscription.plan}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <Badge 
                variant={subscription.status === "active" ? "default" : "outline"}
                className={subscription.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
              >
                {subscription.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Start Date</span>
              <span>{formatDate(subscription.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">End Date</span>
              <span>{formatDate(subscription.endDate)}</span>
            </div>
            {subscription.stripeSubscriptionId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Stripe Subscription ID</span>
                <span className="text-xs font-mono">{subscription.stripeSubscriptionId}</span>
              </div>
            )}
            {subscription.stripeCurrentPeriodEnd && (
              <div className="flex justify-between">
                <span className="text-gray-500">Current Period End</span>
                <span>{formatDate(subscription.stripeCurrentPeriodEnd)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>
                  <span className="font-medium">{subscription.minutesUsed}</span> of{" "}
                  <span className="font-medium">{subscription.minutesAllowed}</span> minutes used
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((subscription.minutesUsed / subscription.minutesAllowed) * 100)}% used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, (subscription.minutesUsed / subscription.minutesAllowed) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 