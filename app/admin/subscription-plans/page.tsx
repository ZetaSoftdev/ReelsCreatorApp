"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { PlusIcon, Pencil1Icon, TrashIcon, DotFilledIcon } from "@radix-ui/react-icons";
import { CreditCard, Package, Settings, Users } from "lucide-react";

// Types for subscription plan data
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  minutesAllowed: number;
  maxFileSize: number;
  maxConcurrentRequests: number;
  storageDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form for creating/editing subscription plans
function SubscriptionPlanForm({
  plan,
  onSubmit,
  onClose,
  isNew = false
}: {
  plan?: SubscriptionPlan;
  onSubmit: (data: any) => void;
  onClose: () => void;
  isNew?: boolean;
}) {
  const [formData, setFormData] = useState<any>({
    name: plan?.name || "",
    description: plan?.description || "",
    monthlyPrice: plan?.monthlyPrice || 0,
    yearlyPrice: plan?.yearlyPrice || 0,
    features: plan?.features?.join("\n") || "",
    minutesAllowed: plan?.minutesAllowed || 60,
    maxFileSize: plan?.maxFileSize || 100,
    maxConcurrentRequests: plan?.maxConcurrentRequests || 2,
    storageDuration: plan?.storageDuration || 7,
    isActive: plan?.isActive !== undefined ? plan.isActive : true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, isActive: checked });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Prepare data for submission
    const submitData = {
      ...formData,
      features: formData.features.split("\n").filter((f: string) => f.trim() !== ""),
      monthlyPrice: parseFloat(formData.monthlyPrice),
      yearlyPrice: parseFloat(formData.yearlyPrice),
      minutesAllowed: parseInt(formData.minutesAllowed),
      maxFileSize: parseInt(formData.maxFileSize),
      maxConcurrentRequests: parseInt(formData.maxConcurrentRequests),
      storageDuration: parseInt(formData.storageDuration)
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Pro Plan"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Brief description of this plan"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
              <Input
                id="monthlyPrice"
                name="monthlyPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyPrice}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
              <Input
                id="yearlyPrice"
                name="yearlyPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.yearlyPrice}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="features">Features (one per line)</Label>
            <Textarea
              id="features"
              name="features"
              value={formData.features}
              onChange={handleChange}
              required
              placeholder="List features, one per line"
              rows={5}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resource Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="minutesAllowed">Minutes Allowed</Label>
            <Input
              id="minutesAllowed"
              name="minutesAllowed"
              type="number"
              min="1"
              value={formData.minutesAllowed}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
            <Input
              id="maxFileSize"
              name="maxFileSize"
              type="number"
              min="1"
              value={formData.maxFileSize}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="maxConcurrentRequests">Concurrent Requests</Label>
            <Input
              id="maxConcurrentRequests"
              name="maxConcurrentRequests"
              type="number"
              min="1"
              value={formData.maxConcurrentRequests}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="storageDuration">Storage Duration (days)</Label>
            <Input
              id="storageDuration"
              name="storageDuration"
              type="number"
              min="1"
              value={formData.storageDuration}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isNew ? "Create Plan" : "Update Plan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function SubscriptionPlansPage() {
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/subscription-plans');
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscription plans");
      }
      
      const data = await response.json();
      setSubscriptionPlans(data.subscriptionPlans);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load subscription plans"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load subscription plans on initial render
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);
  
  // Handle creating a new subscription plan
  const handleCreatePlan = async (data: any) => {
    try {
      // Use the specific create endpoint for better error handling
      const response = await fetch('/api/admin/subscription-plans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.details || "Failed to create subscription plan");
      }
      
      toast({
        title: "Success",
        description: "Subscription plan created successfully"
      });
      
      setIsDialogOpen(false);
      fetchSubscriptionPlans();
    } catch (error: any) {
      console.error("Error details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create subscription plan"
      });
    }
  };
  
  // Handle updating a subscription plan
  const handleUpdatePlan = async (data: any) => {
    if (!selectedPlan) return;
    
    try {
      const response = await fetch(`/api/admin/subscription-plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update subscription plan");
      }
      
      toast({
        title: "Success",
        description: "Subscription plan updated successfully"
      });
      
      setIsDialogOpen(false);
      setSelectedPlan(undefined);
      fetchSubscriptionPlans();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update subscription plan"
      });
    }
  };
  
  // Handle deleting a subscription plan
  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/subscription-plans/${planToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete subscription plan");
      }
      
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully"
      });
      
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      fetchSubscriptionPlans();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete subscription plan"
      });
    }
  };
  
  // Handle form submission (create or update)
  const handleSubmit = (data: any) => {
    if (selectedPlan) {
      handleUpdatePlan(data);
    } else {
      handleCreatePlan(data);
    }
  };
  
  // Open dialog for creating a new plan
  const handleOpenCreateDialog = () => {
    setSelectedPlan(undefined);
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing an existing plan
  const handleOpenEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-800">Subscription Plans</h1>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleOpenCreateDialog}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create New Plan
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading subscription plans...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Package className="h-5 w-5 mr-2 text-purple-600" />
                  Total Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{subscriptionPlans.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-purple-600" />
                  Active Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {subscriptionPlans.filter(plan => plan.isActive).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                  Lowest Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {subscriptionPlans.length > 0 
                    ? formatCurrency(Math.min(...subscriptionPlans.map(p => p.monthlyPrice)))
                    : '$0.00'
                  }
                </div>
                <div className="text-sm text-gray-500">Monthly</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Highest Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {subscriptionPlans.length > 0 
                    ? formatCurrency(Math.max(...subscriptionPlans.map(p => p.monthlyPrice)))
                    : '$0.00'
                  }
                </div>
                <div className="text-sm text-gray-500">Monthly</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plans</CardTitle>
              <CardDescription>Manage your subscription plans and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptionPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Subscription Plans</h3>
                  <p className="text-gray-500 mb-4">You haven't created any subscription plans yet.</p>
                  <Button onClick={handleOpenCreateDialog}>
                    Create Your First Plan
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Monthly Price</TableHead>
                        <TableHead>Yearly Price</TableHead>
                        <TableHead>Minutes</TableHead>
                        <TableHead>Storage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell>
                            {plan.isActive ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{plan.description}</TableCell>
                          <TableCell>{formatCurrency(plan.monthlyPrice)}</TableCell>
                          <TableCell>{formatCurrency(plan.yearlyPrice)}</TableCell>
                          <TableCell>{plan.minutesAllowed}</TableCell>
                          <TableCell>{plan.storageDuration} days</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEditDialog(plan)}
                              className="h-8 w-8"
                            >
                              <Pencil1Icon className="h-4 w-4" />
                            </Button>
                            <AlertDialog open={deleteDialogOpen && planToDelete === plan.id} onOpenChange={(open) => {
                              if (!open) setPlanToDelete(null);
                              setDeleteDialogOpen(open);
                            }}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-red-500"
                                  onClick={() => {
                                    setPlanToDelete(plan.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subscription Plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the {plan.name} plan? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={handleDeletePlan}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>{selectedPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}</DialogTitle>
                <DialogDescription>
                  {selectedPlan 
                    ? "Update the details of this subscription plan" 
                    : "Set up a new subscription plan for your users"}
                </DialogDescription>
              </DialogHeader>
              <SubscriptionPlanForm
                plan={selectedPlan}
                onSubmit={handleSubmit}
                onClose={() => setIsDialogOpen(false)}
                isNew={!selectedPlan}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}