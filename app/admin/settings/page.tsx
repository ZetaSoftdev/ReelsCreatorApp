"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, Check, AlertCircle, Loader2, EyeIcon, EyeOffIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BrandingTest from "@/components/branding-test";
import { toast } from "@/hooks/use-toast";

// Define a type for branding settings
type BrandingSettings = {
  siteName: string;
  logo: string | File | null;
  favicon: string | File | null;
  primaryColor: string;
  accentColor: string;
  defaultFont: string;
}

// Define the complete settings type
type Settings = {
  branding: BrandingSettings;
  general: {
    userRegistration: boolean;
    maxUploadSize: string;
    defaultVideoQuality: string;
    defaultLanguage: string;
    enableEmailNotifications: boolean;
    maintenanceMode: boolean;
  };
  email: {
    fromEmail: string;
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    enableSMTP: boolean;
  };
  subscription: {
    trialPeriod: string;
    defaultPlan: string;
    enableRecurring: boolean;
    gracePeriod: string;
    allowCancellation: boolean;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    enableLiveMode: boolean;
  };
  privacy: {
    privacyPolicy: string;
    termsOfService: string;
    cookiePolicy: string;
    dataRetentionDays: string;
    allowDataExport: boolean;
  };
  storage: {
    provider: string;
    s3BucketName: string;
    s3AccessKey: string;
    s3SecretKey: string;
    s3Region: string;
    maxStorageGB: string;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("branding");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  
  // Updated settings structure with loading state
  const [settings, setSettings] = useState<Settings>({
    branding: {
      siteName: "Editur",
      logo: null,
      favicon: null,
      primaryColor: "#8B5CF6",
      accentColor: "#F59E0B",
      defaultFont: "Poppins"
    },
    general: {
      userRegistration: true,
      maxUploadSize: "500",
      defaultVideoQuality: "720p",
      defaultLanguage: "en",
      enableEmailNotifications: true,
      maintenanceMode: false
    },
    email: {
      fromEmail: "noreply@reelscreator.com",
      smtpHost: "smtp.example.com",
      smtpPort: "587",
      smtpUsername: "",
      smtpPassword: "",
      enableSMTP: false
    },
    subscription: {
      trialPeriod: "14",
      defaultPlan: "basic",
      enableRecurring: true,
      gracePeriod: "3",
      allowCancellation: true
    },
    stripe: {
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      enableLiveMode: false
    },
    privacy: {
      privacyPolicy: "Your privacy policy text here...",
      termsOfService: "Your terms of service text here...",
      cookiePolicy: "Your cookie policy text here...",
      dataRetentionDays: "90",
      allowDataExport: true
    },
    storage: {
      provider: "local",
      s3BucketName: "",
      s3AccessKey: "",
      s3SecretKey: "",
      s3Region: "",
      maxStorageGB: "50"
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [testingStripeConnection, setTestingStripeConnection] = useState(false);
  
  // Fetch branding settings from API on component mount
  useEffect(() => {
    const fetchBrandingSettings = async () => {
      try {
        setLoading(true);
        console.log('Fetching branding settings...');
        const response = await fetch('/api/branding', {
          next: { revalidate: 3600 } // Revalidate every hour
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch branding settings: ${response.status} ${response.statusText}`);
          throw new Error('Failed to fetch branding settings');
        }
        
        const data = await response.json();
        console.log('Branding settings received:', data);
        
        setSettings(prev => ({
          ...prev,
          branding: {
            siteName: data.siteName || "Editur",
            logo: data.logoUrl || "/branding/logo.png",
            favicon: data.faviconUrl || "/branding/favicon.png",
            primaryColor: data.primaryColor || "#8B5CF6",
            accentColor: data.accentColor || "#F59E0B",
            defaultFont: data.defaultFont || "Poppins"
          }
        }));
      } catch (error) {
        console.error("Error fetching branding settings:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrandingSettings();
  }, []);

  const handleSave = async () => {
    setSaveStatus("saving");
    
    try {
      // First save all general settings (including Stripe credentials)
      await handleSaveSettings();
      
      console.log('Saving branding settings...');
      
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add text fields
      formData.append('siteName', settings.branding.siteName);
      formData.append('primaryColor', settings.branding.primaryColor);
      formData.append('accentColor', settings.branding.accentColor);
      formData.append('defaultFont', settings.branding.defaultFont);
      
      // Add logo and favicon if they are File objects
      if (settings.branding.logo instanceof File) {
        console.log('Adding logo file to form data:', settings.branding.logo.name);
        formData.append('logo', settings.branding.logo);
      } else {
        console.log('No new logo file to upload');
      }
      
      if (settings.branding.favicon instanceof File) {
        console.log('Adding favicon file to form data:', settings.branding.favicon.name);
        formData.append('favicon', settings.branding.favicon);
      } else {
        console.log('No new favicon file to upload');
      }
      
      console.log('Sending branding update request...');
      
      // Send to API
      const response = await fetch('/api/branding', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to update branding settings: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Branding successfully updated:', result);
      
      // If we get a successful response but no data property, use the response as is
      const updatedBranding = result.data || result;
      
      // Update local state with the response data
      if (updatedBranding) {
        setSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            ...updatedBranding
          }
        }));
      }
      
      // Set success status
      setSaveStatus("success");
      
      // Show success message using toast instead of alert
      toast({
        title: "Settings Updated",
        description: "Settings updated successfully. The page will now reload to apply changes.",
        variant: "default"
      });
      
      // Clear any cached branding data
      try {
        // Force a fresh fetch of the branding data to clear cache
        const cacheBuster = Date.now();
        await fetch(`/api/branding?t=${cacheBuster}`, {
          next: { revalidate: 3600 }, // Revalidate every hour
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        // Wait a moment for the backend to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hard reload the page to see the new settings
        window.location.href = window.location.href.split('?')[0] + '?cache=' + cacheBuster;
      } catch (refreshError) {
        console.error('Error refreshing branding cache:', refreshError);
        // Still do a regular reload if the cache busting fails
        window.location.reload();
      }
      
      // Reset status after 3 seconds (though the page will likely reload before this)
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      
      // Show error message using toast instead of alert
      toast({
        title: "Error",
        description: `Failed to update settings: ${(error as Error).message}`,
        variant: "destructive"
      });
      
      setSaveStatus("error");
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };
  
  const handleReset = async () => {
    setResetDialogOpen(false);
    setSaveStatus("saving");
    
    try {
      // Create default settings
      const defaultSettings = {
        siteName: "Editur",
        primaryColor: "#8B5CF6",
        accentColor: "#F59E0B",
        defaultFont: "Poppins"
      };
      
      // Send to API
      const formData = new FormData();
      Object.entries(defaultSettings).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      const response = await fetch('/api/branding', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset branding settings');
      }
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        branding: {
          ...defaultSettings,
          logo: "/branding/logo.png",
          favicon: "/branding/favicon.png"
        }
      }));
      
      setSaveStatus("success");
      
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    } catch (error) {
      console.error("Error resetting branding settings:", error);
      setSaveStatus("error");
      
      setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
    }
  };
  
  const handleFileUpload = (field: 'logo' | 'favicon') => {
    // Create a file input and trigger click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = field === 'logo' ? 'image/png, image/jpeg, image/svg+xml' : 'image/png, image/x-icon, image/svg+xml';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file: File | null = target.files?.[0] || null;
      
      if (file) {
        setSettings({
          ...settings,
          branding: {
            ...settings.branding,
            [field]: file // Store the File object directly
          }
        });
      }
    };
    
    input.click();
  };

  const getImagePreviewUrl = (field: 'logo' | 'favicon'): string => {
    const file = settings.branding[field];
    if (file instanceof File) {
      return URL.createObjectURL(file);
    } else if (typeof file === 'string') {
      return file;
    }
    return '';
  };

  // Add validation function
  const validateStripeKeys = () => {
    const publishableKeyPattern = /^pk_(test|live)_/;
    const secretKeyPattern = /^sk_(test|live)_/;
    const webhookSecretPattern = /^whsec_/;
    
    const errors = [];
    
    if (settings.stripe.publishableKey && !publishableKeyPattern.test(settings.stripe.publishableKey)) {
      errors.push("Publishable key must start with pk_test_ or pk_live_");
    }
    
    if (settings.stripe.secretKey && !secretKeyPattern.test(settings.stripe.secretKey)) {
      errors.push("Secret key must start with sk_test_ or sk_live_");
    }
    
    if (settings.stripe.webhookSecret && !webhookSecretPattern.test(settings.stripe.webhookSecret)) {
      errors.push("Webhook secret must start with whsec_");
    }
    
    return errors;
  };
  
  // Update handleSaveSettings to use validation
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Validate Stripe keys before saving
    const stripeErrors = validateStripeKeys();
    if (stripeErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: stripeErrors.join("\n"),
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }
    
    try {
      console.log('Saving all settings...');
      console.log('Stripe credentials being sent:', {
        publishableKey: settings.stripe.publishableKey,
        secretKey: settings.stripe.secretKey ? '[PRESENT]' : '[EMPTY]',
        webhookSecret: settings.stripe.webhookSecret ? '[PRESENT]' : '[EMPTY]',
        enableLiveMode: settings.stripe.enableLiveMode
      });
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add function to fetch all settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        
        const data = await response.json();
        
        if (data.success && data.settings) {
          // Transform API response to match our state structure
          const apiSettings = data.settings;
          setSettings({
            branding: {
              siteName: apiSettings.branding?.siteName || "Editur",
              logo: apiSettings.branding?.logoUrl || null,
              favicon: apiSettings.branding?.faviconUrl || null,
              primaryColor: apiSettings.branding?.primaryColor || "#8B5CF6",
              accentColor: apiSettings.branding?.accentColor || "#F59E0B",
              defaultFont: apiSettings.branding?.defaultFont || "Poppins"
            },
            general: {
              userRegistration: apiSettings.userRegistration ?? true,
              maxUploadSize: apiSettings.maxUploadSize?.toString() || "500",
              defaultVideoQuality: apiSettings.defaultVideoQuality || "720p",
              defaultLanguage: apiSettings.defaultLanguage || "en",
              enableEmailNotifications: apiSettings.enableEmailNotifications ?? true,
              maintenanceMode: apiSettings.maintenanceMode ?? false
            },
            email: {
              fromEmail: apiSettings.fromEmail || "noreply@reelscreator.com",
              smtpHost: apiSettings.smtpHost || "",
              smtpPort: apiSettings.smtpPort || "",
              smtpUsername: apiSettings.smtpUsername || "",
              smtpPassword: apiSettings.smtpPassword || "",
              enableSMTP: apiSettings.enableSMTP ?? false
            },
            subscription: {
              trialPeriod: apiSettings.trialPeriod?.toString() || "14",
              defaultPlan: apiSettings.defaultPlan || "basic",
              enableRecurring: apiSettings.enableRecurring ?? true,
              gracePeriod: apiSettings.gracePeriod?.toString() || "3",
              allowCancellation: apiSettings.allowCancellation ?? true
            },
            stripe: {
              publishableKey: apiSettings.stripePublishableKey || "",
              secretKey: apiSettings.stripeSecretKey || "",
              webhookSecret: apiSettings.stripeWebhookSecret || "",
              enableLiveMode: apiSettings.stripeLiveMode ?? false
            },
            privacy: {
              privacyPolicy: apiSettings.privacyPolicy || "Your privacy policy text here...",
              termsOfService: apiSettings.termsOfService || "Your terms of service text here...",
              cookiePolicy: apiSettings.cookiePolicy || "Your cookie policy text here...",
              dataRetentionDays: apiSettings.dataRetentionDays?.toString() || "90",
              allowDataExport: apiSettings.allowDataExport ?? true
            },
            storage: {
              provider: apiSettings.storageProvider || "local",
              s3BucketName: apiSettings.s3BucketName || "",
              s3AccessKey: apiSettings.s3AccessKey || "",
              s3SecretKey: apiSettings.s3SecretKey || "",
              s3Region: apiSettings.s3Region || "",
              maxStorageGB: apiSettings.maxStorageGB?.toString() || "50"
            }
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []); // Only run once on component mount

  const testStripeConnection = async () => {
    // First validate the keys
    const stripeErrors = validateStripeKeys();
    if (stripeErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: stripeErrors.join("\n"),
        variant: "destructive",
      });
      return;
    }
    
    // If keys are valid, test the connection
    setTestingStripeConnection(true);
    try {
      const response = await fetch('/api/admin/stripe/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publishableKey: settings.stripe.publishableKey,
          secretKey: settings.stripe.secretKey,
          webhookSecret: settings.stripe.webhookSecret,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Your Stripe API keys are valid and working correctly.",
          variant: "default",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Unable to connect to Stripe with the provided credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
      console.error('Error testing Stripe connection:', error);
    } finally {
      setTestingStripeConnection(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-[#343434]">Settings</h1>
        <div className="flex items-center gap-2">
          
          <Button 
            className="gap-2 bg-purple-600 hover:bg-purple-700" 
            onClick={handleSave}
            disabled={saveStatus === "saving"}
          >
            {saveStatus === "idle" && (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <span className="animate-spin">
                  <Upload size={16} />
                </span>
                Saving...
              </>
            )}
            {saveStatus === "success" && (
              <>
                <Check size={16} />
                Saved Successfully
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle size={16} />
                Error Saving
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="branding" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 border">
          <TabsTrigger value="branding" className="px-2 py-1 text-sm">Branding</TabsTrigger>
          <TabsTrigger value="general" className="px-2 py-1 text-sm">General</TabsTrigger>
          <TabsTrigger value="email" className="px-2 py-1 text-sm">Email</TabsTrigger>
          <TabsTrigger value="subscription" className="px-2 py-1 text-sm">Subscription</TabsTrigger>
          <TabsTrigger value="stripe" className="px-2 py-1 text-sm">Stripe</TabsTrigger>
          <TabsTrigger value="privacy" className="px-2 py-1 text-sm">Privacy</TabsTrigger>
          <TabsTrigger value="storage" className="px-2 py-1 text-sm">Storage</TabsTrigger>
        </TabsList>
        
        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding Settings</CardTitle>
              <CardDescription>
                Customize your application's branding and appearance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-32 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input 
                      id="siteName" 
                      value={settings.branding.siteName}
                      onChange={(e) => setSettings({
                        ...settings,
                        branding: { ...settings.branding, siteName: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="border rounded-md p-4">
                        {settings.branding.logo ? (
                          <div className="space-y-2">
                            <img 
                              id="logoPreview"
                              src={getImagePreviewUrl('logo')}
                              alt="Logo" 
                              className="max-h-20 object-contain"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSettings({
                                ...settings,
                                branding: { ...settings.branding, logo: null }
                              })}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 mb-2">Upload your logo (PNG, JPG, SVG)</p>
                            <Button onClick={() => handleFileUpload('logo')}>Upload Logo</Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Recommended size: 300x80px</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Favicon</Label>
                      <div className="border rounded-md p-4">
                        {settings.branding.favicon ? (
                          <div className="space-y-2">
                            <img 
                              id="faviconPreview"
                              src={getImagePreviewUrl('favicon')}
                              alt="Favicon" 
                              className="max-h-10 object-contain"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSettings({
                                ...settings,
                                branding: { ...settings.branding, favicon: null }
                              })}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 mb-2">Upload your favicon (PNG, ICO)</p>
                            <Button onClick={() => handleFileUpload('favicon')}>Upload Favicon</Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Recommended size: 32x32px</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-md border" 
                          style={{ backgroundColor: settings.branding.primaryColor }}
                        />
                        <Input 
                          id="primaryColor"
                          type="text"
                          value={settings.branding.primaryColor}
                          onChange={(e) => setSettings({
                            ...settings,
                            branding: { ...settings.branding, primaryColor: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <div className="flex gap-2">
                        <div 
                          className="w-10 h-10 rounded-md border" 
                          style={{ backgroundColor: settings.branding.accentColor }}
                        />
                        <Input 
                          id="accentColor"
                          type="text"
                          value={settings.branding.accentColor}
                          onChange={(e) => setSettings({
                            ...settings,
                            branding: { ...settings.branding, accentColor: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultFont">Default Font</Label>
                    <Select 
                      value={settings.branding.defaultFont}
                      onValueChange={(value) => setSettings({
                        ...settings,
                        branding: { ...settings.branding, defaultFont: value }
                      })}
                    >
                      <SelectTrigger id="defaultFont">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Futura">Futura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Current Branding Preview</h3>
                    <BrandingTest />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="userRegistration">User Registration</Label>
                  <p className="text-sm text-gray-500">Allow new users to register</p>
                </div>
                <Switch 
                  id="userRegistration"
                  checked={settings.general.userRegistration}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    general: { ...settings.general, userRegistration: checked }
                  })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxUploadSize">Maximum Upload Size (MB)</Label>
                  <Input 
                    id="maxUploadSize"
                    type="number"
                    value={settings.general.maxUploadSize}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, maxUploadSize: e.target.value }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultVideoQuality">Default Video Quality</Label>
                  <Select 
                    value={settings.general.defaultVideoQuality}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      general: { ...settings.general, defaultVideoQuality: value }
                    })}
                  >
                    <SelectTrigger id="defaultVideoQuality">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      <SelectItem value="2160p">2160p (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select 
                  value={settings.general.defaultLanguage}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    general: { ...settings.general, defaultLanguage: value }
                  })}
                >
                  <SelectTrigger id="defaultLanguage">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send email notifications to users</p>
                </div>
                <Switch 
                  id="enableEmailNotifications"
                  checked={settings.general.enableEmailNotifications}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    general: { ...settings.general, enableEmailNotifications: checked }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode" className="font-medium">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Take site offline for maintenance</p>
                </div>
                <Switch 
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    general: { ...settings.general, maintenanceMode: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email delivery settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email Address</Label>
                <Input 
                  id="fromEmail"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, fromEmail: e.target.value }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableSMTP">Enable SMTP</Label>
                  <p className="text-sm text-gray-500">Use custom SMTP server for sending emails</p>
                </div>
                <Switch 
                  id="enableSMTP"
                  checked={settings.email.enableSMTP}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    email: { ...settings.email, enableSMTP: checked }
                  })}
                />
              </div>
              
              {settings.email.enableSMTP && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP Host</Label>
                      <Input 
                        id="smtpHost"
                        value={settings.email.smtpHost}
                        onChange={(e) => setSettings({
                          ...settings,
                          email: { ...settings.email, smtpHost: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP Port</Label>
                      <Input 
                        id="smtpPort"
                        value={settings.email.smtpPort}
                        onChange={(e) => setSettings({
                          ...settings,
                          email: { ...settings.email, smtpPort: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">SMTP Username</Label>
                      <Input 
                        id="smtpUsername"
                        value={settings.email.smtpUsername}
                        onChange={(e) => setSettings({
                          ...settings,
                          email: { ...settings.email, smtpUsername: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input 
                        id="smtpPassword"
                        type="password"
                        value={settings.email.smtpPassword}
                        onChange={(e) => setSettings({
                          ...settings,
                          email: { ...settings.email, smtpPassword: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Test SMTP Connection
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Subscription Settings */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Settings</CardTitle>
              <CardDescription>
                Configure subscription and billing options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trialPeriod">Trial Period (Days)</Label>
                  <Input 
                    id="trialPeriod"
                    type="number"
                    value={settings.subscription.trialPeriod}
                    onChange={(e) => setSettings({
                      ...settings,
                      subscription: { ...settings.subscription, trialPeriod: e.target.value }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultPlan">Default Plan</Label>
                  <Select 
                    value={settings.subscription.defaultPlan}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      subscription: { ...settings.subscription, defaultPlan: value }
                    })}
                  >
                    <SelectTrigger id="defaultPlan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableRecurring">Recurring Billing</Label>
                  <p className="text-sm text-gray-500">Enable recurring billing for subscriptions</p>
                </div>
                <Switch 
                  id="enableRecurring"
                  checked={settings.subscription.enableRecurring}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    subscription: { ...settings.subscription, enableRecurring: checked }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Payment Grace Period (Days)</Label>
                <Input 
                  id="gracePeriod"
                  type="number"
                  value={settings.subscription.gracePeriod}
                  onChange={(e) => setSettings({
                    ...settings,
                    subscription: { ...settings.subscription, gracePeriod: e.target.value }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowCancellation">Allow Self-Cancellation</Label>
                  <p className="text-sm text-gray-500">Allow users to cancel their subscriptions</p>
                </div>
                <Switch 
                  id="allowCancellation"
                  checked={settings.subscription.allowCancellation}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    subscription: { ...settings.subscription, allowCancellation: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stripe Settings */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Settings</CardTitle>
              <CardDescription>
                Configure Stripe API credentials for payment processing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="publishableKey">Publishable Key</Label>
                <p className="text-sm text-gray-500">Your Stripe publishable key (starts with pk_)</p>
                <Input 
                  id="publishableKey"
                  placeholder="pk_test_..."
                  value={settings.stripe.publishableKey}
                  onChange={(e) => setSettings({
                    ...settings,
                    stripe: { ...settings.stripe, publishableKey: e.target.value }
                  })}
                  className={!settings.stripe.publishableKey || /^pk_(test|live)_/.test(settings.stripe.publishableKey) 
                    ? "" 
                    : "border-red-500 focus-visible:ring-red-500"}
                />
                {settings.stripe.publishableKey && !/^pk_(test|live)_/.test(settings.stripe.publishableKey) && (
                  <p className="text-sm text-red-500 mt-1">Must start with pk_test_ or pk_live_</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <p className="text-sm text-gray-500">Your Stripe secret key (starts with sk_). This is sensitive information.</p>
                <div className="relative">
                  <Input 
                    id="secretKey"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="sk_test_..."
                    value={settings.stripe.secretKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      stripe: { ...settings.stripe, secretKey: e.target.value }
                    })}
                    className={!settings.stripe.secretKey || /^sk_(test|live)_/.test(settings.stripe.secretKey) 
                      ? "" 
                      : "border-red-500 focus-visible:ring-red-500"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecretKey ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {settings.stripe.secretKey && !/^sk_(test|live)_/.test(settings.stripe.secretKey) && (
                  <p className="text-sm text-red-500 mt-1">Must start with sk_test_ or sk_live_</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <p className="text-sm text-gray-500">Your Stripe webhook signing secret (starts with whsec_)</p>
                <div className="relative">
                  <Input 
                    id="webhookSecret"
                    type={showWebhookSecret ? "text" : "password"}
                    placeholder="whsec_..."
                    value={settings.stripe.webhookSecret}
                    onChange={(e) => setSettings({
                      ...settings,
                      stripe: { ...settings.stripe, webhookSecret: e.target.value }
                    })}
                    className={!settings.stripe.webhookSecret || /^whsec_/.test(settings.stripe.webhookSecret) 
                      ? "" 
                      : "border-red-500 focus-visible:ring-red-500"}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showWebhookSecret ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {settings.stripe.webhookSecret && !/^whsec_/.test(settings.stripe.webhookSecret) && (
                  <p className="text-sm text-red-500 mt-1">Must start with whsec_</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableLiveMode">Enable Live Mode</Label>
                  <p className="text-sm text-gray-500">Switch to Stripe live mode for processing real payments</p>
                </div>
                <Switch 
                  id="enableLiveMode"
                  checked={settings.stripe.enableLiveMode}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    stripe: { ...settings.stripe, enableLiveMode: checked }
                  })}
                />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={testStripeConnection}
                disabled={testingStripeConnection}
                className="mt-2"
              >
                {testingStripeConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Configure privacy and legal settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Textarea 
                  id="privacyPolicy"
                  rows={6}
                  value={settings.privacy.privacyPolicy}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, privacyPolicy: e.target.value }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="termsOfService">Terms of Service</Label>
                <Textarea 
                  id="termsOfService"
                  rows={6}
                  value={settings.privacy.termsOfService}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, termsOfService: e.target.value }
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cookiePolicy">Cookie Policy</Label>
                <Textarea 
                  id="cookiePolicy"
                  rows={6}
                  value={settings.privacy.cookiePolicy}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, cookiePolicy: e.target.value }
                  })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowDataExport">Allow Data Export</Label>
                  <p className="text-sm text-gray-500">Let users export their data</p>
                </div>
                <Switch 
                  id="allowDataExport"
                  checked={settings.privacy.allowDataExport}
                  onCheckedChange={(checked: boolean) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, allowDataExport: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Storage Settings */}
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>
                Configure media storage options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="storageProvider">Storage Provider</Label>
                <Select 
                  value={settings.storage.provider}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, provider: value }
                  })}
                >
                  <SelectTrigger id="storageProvider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {settings.storage.provider === 's3' && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="s3BucketName">S3 Bucket Name</Label>
                    <Input 
                      id="s3BucketName"
                      value={settings.storage.s3BucketName}
                      onChange={(e) => setSettings({
                        ...settings,
                        storage: { ...settings.storage, s3BucketName: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="s3Region">AWS Region</Label>
                    <Input 
                      id="s3Region"
                      value={settings.storage.s3Region}
                      onChange={(e) => setSettings({
                        ...settings,
                        storage: { ...settings.storage, s3Region: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="s3AccessKey">Access Key</Label>
                      <Input 
                        id="s3AccessKey"
                        value={settings.storage.s3AccessKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          storage: { ...settings.storage, s3AccessKey: e.target.value }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="s3SecretKey">Secret Key</Label>
                      <Input 
                        id="s3SecretKey"
                        type="password"
                        value={settings.storage.s3SecretKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          storage: { ...settings.storage, s3SecretKey: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Test Connection
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="maxStorageGB">Maximum Storage (GB)</Label>
                <Input 
                  id="maxStorageGB"
                  type="number"
                  value={settings.storage.maxStorageGB}
                  onChange={(e) => setSettings({
                    ...settings,
                    storage: { ...settings.storage, maxStorageGB: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 