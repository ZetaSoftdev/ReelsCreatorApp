import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SubscriptionEditForm } from '@/components/admin/subscriptions/SubscriptionEditForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

const getInitials = (name: string | null): string => {
  if (!name) return "U";
  
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

export default async function EditSubscriptionPage({ params }: { params: { id: string } }) {
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
      <div className="flex items-center">
        <Link href={`/admin/subscriptions/${params.id}`} className="mr-4 flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Subscription
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Subscription
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={subscription.user.profileImage || undefined} />
              <AvatarFallback className="bg-purple-100 text-purple-700">
                {getInitials(subscription.user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="block">{subscription.user.name || "Unnamed User"}</span>
              <span className="block text-sm text-gray-500">{subscription.user.email}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionEditForm subscription={subscription} />
        </CardContent>
      </Card>
    </div>
  );
} 