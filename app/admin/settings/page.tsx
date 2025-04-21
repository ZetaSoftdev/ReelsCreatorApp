"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, Check, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import BrandingTest from "@/components/branding-test";

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
      
      // Show success message
      alert("Branding settings updated successfully. The page will now reload to apply changes.");
      
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
        
        // Hard reload the page to see the new branding
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
      console.error("Error saving branding settings:", error);
      
      // Show error message
      alert(`Failed to update branding settings: ${(error as Error).message}`);
      
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

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-[#343434]">Settings</h1>
        <div className="flex items-center gap-2">
          <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Reset to Defaults</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to reset all settings to their default values? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-purple-600 text-white hover:bg-purple-700">
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
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
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
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