"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Users } from "lucide-react";

interface MetadataType {
  subscriptionsByPlan: {
    plan: string;
    _count: {
      plan: number;
    };
  }[];
  subscriptionsByStatus: {
    status: string;
    _count: {
      status: number;
    };
  }[];
  revenue: {
    total: number;
    byPlan: {
      plan: string;
      count: number;
      revenue: number;
    }[];
  };
}

interface SubscriptionsStatsProps {
  data: MetadataType;
}

export function SubscriptionsStats({ data }: SubscriptionsStatsProps) {
  // Count total subscriptions
  const totalSubscriptions = data.subscriptionsByPlan.reduce(
    (sum, item) => sum + item._count.plan,
    0
  );

  // Count active subscriptions
  const activeSubscriptions = data.subscriptionsByStatus.find(
    item => item.status === "active"
  )?._count.status || 0;

  // Format currency values
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // We'll use dummy values for the change percentages
  // In a real app, you would calculate these from historical data
  const activeSubscriptionsChange = 5.2;
  const revenueChange = 12.3;
  
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  // Calculate monthly recurring revenue
  const monthlyRecurringRevenue = Number(data.revenue.total);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSubscriptions}</div>
          <p className="text-xs text-muted-foreground">
            All time subscriptions
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeSubscriptions}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {activeSubscriptionsChange >= 0 ? (
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            {formatPercentage(Math.abs(activeSubscriptionsChange))} from last month
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <span className="text-muted-foreground">$</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthlyRecurringRevenue * 12)}</div>
          <p className="text-xs text-muted-foreground">
            Annual revenue estimate
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
          <span className="text-muted-foreground">$</span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthlyRecurringRevenue)}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {revenueChange >= 0 ? (
              <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            {formatPercentage(Math.abs(revenueChange))} from last month
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 