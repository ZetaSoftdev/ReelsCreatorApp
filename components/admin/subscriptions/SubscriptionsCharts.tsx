"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

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

interface SubscriptionsChartsProps {
  data: MetadataType;
}

export function SubscriptionsCharts({ data }: SubscriptionsChartsProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const planData = data.subscriptionsByPlan.map(item => ({
    name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
    value: item._count.plan
  }));

  const statusData = data.subscriptionsByStatus.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item._count.status
  }));

  // Safely handle byPlan data, ensuring numbers are converted from any potential Decimal objects
  const revenueData = data.revenue.byPlan.map(item => ({
    name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
    value: Number(item.revenue)
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 