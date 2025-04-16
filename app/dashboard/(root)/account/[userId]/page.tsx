'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Lock, Mail, Camera, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import HomeHeader from '@/components/HomeHeader';
import { toast } from '@/hooks/use-toast';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function AccountPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Load user details
  useEffect(() => {
    if (!session?.user) return;
    
    // Better detection for Google users
    const isOAuthUser = session.user.email?.includes('@gmail.com') || false;
    console.log("Is Google user?", isOAuthUser);
    setIsGoogleUser(isOAuthUser);
    
    // Set user details from session data
    const userData = {
      id: session.user.id || '',
      name: session.user.name || '',
      email: session.user.email || '',
      image: session.user.image || undefined
    };
    
    setUserDetails(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      password: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPreviewUrl(userData.image || null);
    setIsLoading(false);
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageError(false);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Store original values for comparison
      const originalName = userDetails?.name || '';
      
      // Trim input values to avoid whitespace issues
      const trimmedName = formData.name.trim();
      
      // Check what has actually changed
      const hasNameChanged = trimmedName !== originalName && trimmedName !== '';
      const hasPasswordChanged = !isGoogleUser && formData.newPassword && 
                              formData.newPassword.length >= 8 && 
                              formData.newPassword === formData.confirmPassword;
      const hasImageChanged = imageFile !== null;

      // Prevent unnecessary API calls if no changes
      if (!hasNameChanged && !hasPasswordChanged && !hasImageChanged) {
        toast({
          title: "No Changes",
          description: "No changes were made to your profile"
        });
        setIsSaving(false);
        return;
      }
      
      // ----------------------------
      // 1. Handle image upload first
      // ----------------------------
      let updatedImageUrl = userDetails?.image;
      
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        try {
          const imageResponse = await fetch('/api/user/image', {
            method: 'POST',
            body: imageFormData,
          });
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            updatedImageUrl = imageData.imageUrl;
            
            // Update local state with new image
            setPreviewUrl(imageData.imageUrl);
            
            toast({
              title: "Success",
              description: "Profile image updated successfully"
            });
          } else {
            const errorData = await imageResponse.json().catch(() => ({}));
            toast({
              variant: "destructive",
              title: "Image Upload Failed",
              description: errorData.error || "Could not upload profile image"
            });
          }
        } catch (imageError) {
          console.error("Image upload error:", imageError);
          toast({
            variant: "destructive",
            title: "Image Upload Failed",
            description: "Connection problem during image upload"
          });
        }
      }

      // ----------------------------
      // 2. Update user profile data
      // ----------------------------
      if (hasNameChanged) {
        try {
          console.log("Updating name to:", trimmedName);
          const updateData = { name: trimmedName };
          
          const profileResponse = await fetch('/api/user', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });
          
          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            console.log("Name update response:", userData);
            
            // Update local state
            setUserDetails(prev => ({
              ...prev as UserDetails,
              name: userData.name || prev?.name || ''
            }));
            
            // Update session
            if (session) {
              await updateSession({
                ...session,
                user: {
                  ...session.user,
                  name: userData.name || session.user.name || ''
                }
              });
            }
            
            toast({
              title: "Success",
              description: "Profile name updated successfully"
            });
          } else {
            const errorData = await profileResponse.json().catch(() => ({ error: "Unknown error" }));
            console.error("Name update error:", errorData);
            toast({
              variant: "destructive",
              title: "Update Failed",
              description: errorData.error || "Could not update profile name"
            });
          }
        } catch (profileError) {
          console.error("Profile update error:", profileError);
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Connection problem while updating profile"
          });
        }
      }

      // ----------------------------
      // 3. Update password if needed (only for non-Google users)
      // ----------------------------
      if (!isGoogleUser && hasPasswordChanged) {
        try {
          const passwordData = {
            currentPassword: formData.password,
            newPassword: formData.newPassword
          };
          
          const passwordResponse = await fetch('/api/user/password', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordData),
          });
          
          if (passwordResponse.ok) {
            // Reset password fields
            setFormData(prev => ({
              ...prev,
              password: '',
              newPassword: '',
              confirmPassword: ''
            }));
            
            toast({
              title: "Success",
              description: "Password updated successfully"
            });
          } else {
            const errorData = await passwordResponse.json().catch(() => ({ error: "Failed to update password" }));
            toast({
              variant: "destructive",
              title: "Password Error",
              description: errorData.error || "Failed to update password"
            });
          }
        } catch (passwordError) {
          console.error("Password update error:", passwordError);
          toast({
            variant: "destructive",
            title: "Password Error",
            description: "Connection problem while updating password"
          });
        }
      }
    } catch (error) {
      console.error("Account update error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again."
      });
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
    <HomeHeader pageName='Account Settings' />
    <div className="max-w-4xl mx-auto p-6 pt-10">
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
              {previewUrl && !imageError ? (
                <img 
                  src={previewUrl} 
                  alt="Profile" 
                  className="h-full w-full object-cover" 
                  onError={handleImageError}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <User size={32} />
                </div>
              )}
            </div>
            <label 
              htmlFor="profile-image" 
              className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-full cursor-pointer"
            >
              <Camera size={16} />
            </label>
            <input 
              type="file" 
              id="profile-image" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{userDetails?.name}</h2>
            <p className="text-gray-500">{userDetails?.email}</p>
            <p className="text-sm text-gray-400 mt-2">Upload a new avatar. JPG, GIF or PNG. 1MB max.</p>
          </div>
        </div>
        
        {/* Personal Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Personal Information</h3>
          
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            {/* Email field - read-only for Google users */}
            <div>
              <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                Email Address
                {isGoogleUser && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    Google account
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-10 w-full px-3 py-2 border ${isGoogleUser ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-300'} rounded-md focus:outline-none ${!isGoogleUser && 'focus:ring-2 focus:ring-purple-500'} focus:border-transparent`}
                  readOnly={isGoogleUser}
                  required
                />
              </div>
              {isGoogleUser && (
                <p className="text-xs text-gray-500 mt-1">Your email is managed by your Google account.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Password Change - Only show for non-Google users */}
        {!isGoogleUser && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">At least 8 characters with letters, numbers & symbols</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
} 