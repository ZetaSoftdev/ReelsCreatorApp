"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function SubscriptionsFilters({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(currentSearchParams);
    
    const search = formData.get("search") as string;
    const plan = formData.get("plan") as string;
    const status = formData.get("status") as string;

    if (search) params.set("search", search);
    else params.delete("search");

    if (plan) params.set("plan", plan);
    else params.delete("plan");

    if (status) params.set("status", status);
    else params.delete("status");

    params.set("page", "1");
    router.push(`/admin/subscriptions?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/admin/subscriptions");
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex-1">
        <Input
          name="search"
          placeholder="Search by name or email..."
          defaultValue={searchParams.search as string}
          className="w-full"
        />
      </div>
      
      <Select 
        name="plan" 
        defaultValue={(searchParams.plan as string) || "all-plans"}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-plans">All Plans</SelectItem>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="basic">Basic</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        name="status" 
        defaultValue={(searchParams.status as string) || "all-statuses"}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all-statuses">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="canceled">Canceled</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </form>
  );
} 