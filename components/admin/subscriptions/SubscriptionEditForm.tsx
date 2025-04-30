"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Subscription } from "@prisma/client";

interface User {
  id: string;
  name: string | null;
  email: string;
  profileImage: string | null;
}

interface SubscriptionWithUser extends Omit<Subscription, 'user'> {
  user: User;
}

interface SubscriptionEditFormProps {
  subscription: SubscriptionWithUser;
}

const formSchema = z.object({
  plan: z.enum(["free", "basic", "pro", "enterprise"], {
    required_error: "Please select a plan",
  }),
  status: z.enum(["active", "canceled", "expired"], {
    required_error: "Please select a status",
  }),
  minutesAllowed: z.coerce.number().min(0, {
    message: "Minutes allowed must be at least 0",
  }),
  minutesUsed: z.coerce.number().min(0, {
    message: "Minutes used must be at least 0",
  }),
});

export function SubscriptionEditForm({ subscription }: SubscriptionEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan: subscription.plan as "free" | "basic" | "pro" | "enterprise",
      status: subscription.status as "active" | "canceled" | "expired",
      minutesAllowed: subscription.minutesAllowed,
      minutesUsed: subscription.minutesUsed,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscription");
      }

      toast({
        title: "Subscription updated",
        description: "The subscription has been updated successfully.",
      });

      router.refresh();
      router.push(`/admin/subscriptions/${subscription.id}`);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "There was a problem updating the subscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Plan</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The subscription plan determines the features and limits.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscription Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The current status of the subscription.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minutesAllowed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutes Allowed</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter minutes allowed"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  The total minutes allowed for this subscription.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minutesUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minutes Used</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter minutes used"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  The minutes used so far by this subscription.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/subscriptions/${subscription.id}`)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
} 