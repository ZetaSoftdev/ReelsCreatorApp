"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  minutesAllowed: number;
  minutesUsed: number;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  stripeCurrentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
  planId: string | null;
}

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
  pagination: PaginationData;
  searchParams: { [key: string]: string | string[] | undefined };
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

export function SubscriptionsTable({ subscriptions, pagination, searchParams }: SubscriptionsTableProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const currentPage = parseInt(searchParams.page as string || '1');
  const sortBy = searchParams.sortBy as string || 'startDate';
  const sortOrder = searchParams.sortOrder as string || 'desc';

  const handleSort = (column: string) => {
    const params = new URLSearchParams(currentSearchParams);
    if (sortBy === column) {
      params.set('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sortBy', column);
      params.set('sortOrder', 'asc');
    }
    router.push(`/admin/subscriptions?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(currentSearchParams);
    params.set('page', page.toString());
    router.push(`/admin/subscriptions?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("startDate")}
              >
                Start Date
                {sortBy === "startDate" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map(subscription => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={subscription.user.profileImage || undefined} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getInitials(subscription.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{subscription.user.name || "Unnamed User"}</div>
                      <div className="text-xs text-gray-500">{subscription.user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={subscription.status === "active" ? "default" : "outline"}
                    className={subscription.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                  >
                    {subscription.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(subscription.startDate)}</TableCell>
                <TableCell>{formatDate(subscription.endDate)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (subscription.minutesUsed / subscription.minutesAllowed) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-xs whitespace-nowrap">
                      {subscription.minutesUsed} / {subscription.minutesAllowed} min
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/subscriptions/${subscription.id}`}>
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="ml-2">
                    <Link href={`/admin/subscriptions/edit/${subscription.id}`}>
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {subscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No subscriptions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className="cursor-pointer"
                  aria-disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: pagination.totalPages }).map((_, i) => {
                const page = i + 1;
                const showPage = 
                  page === 1 || 
                  page === pagination.totalPages || 
                  Math.abs(page - currentPage) <= 1;
                  
                if (!showPage) {
                  if (
                    (i === 1 && currentPage > 3) ||
                    (i === pagination.totalPages - 2 && currentPage < pagination.totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }
                  
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => handlePageChange(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
                  className="cursor-pointer"
                  aria-disabled={currentPage === pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 