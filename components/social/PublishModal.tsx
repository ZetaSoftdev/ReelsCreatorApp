import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaPlus, FaHashtag } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface SocialAccount {
  id: string;
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER';
  accountName: string;
}

interface PublishModalProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onPublish?: (success: boolean) => void;
}

export default function PublishModal({ videoId, videoTitle, isOpen, onClose, onPublish }: PublishModalProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<'DIRECT_POST' | 'INBOX_UPLOAD'>('DIRECT_POST');
  const [privacyLevel, setPrivacyLevel] = useState<string>('PUBLIC_TO_EVERYONE');
  const [disableComment, setDisableComment] = useState(false);
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    title: string;
    message: string;
    platform: string;
    suggestion: string;
  }>({
    title: '',
    message: '',
    platform: '',
    suggestion: '',
  });

  // Fetch connected social accounts when the modal opens
  useEffect(() => {
    if (isOpen) {
      setCaption(videoTitle);
      fetchAccounts();
    }
  }, [isOpen, videoTitle]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social/accounts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch social accounts');
      }
      
      const data = await response.json();
      setAccounts(data.accounts || []);
      
      // Auto-select first account if available
      if (data.accounts && data.accounts.length > 0) {
        setSelectedAccountId(data.accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching social accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your social accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHashtag = () => {
    if (hashtag.trim()) {
      // Remove # if user added it
      const cleanHashtag = hashtag.trim().replace(/^#/, '');
      if (cleanHashtag && !hashtags.includes(cleanHashtag)) {
        setHashtags([...hashtags, cleanHashtag]);
        setHashtag('');
      }
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  // Get the currently selected account's platform
  const getSelectedPlatform = () => {
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    return selectedAccount?.platform || '';
  };

  // Check if the selected account is TikTok
  const isTikTokSelected = getSelectedPlatform() === 'TIKTOK';

  const handlePublish = async () => {
    if (!selectedAccountId) {
      toast({
        title: 'Error',
        description: 'Please select a social account to publish to',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPublishing(true);
      
      // Show processing message for TikTok uploads
      const selectedPlatform = getSelectedPlatform();
      if (selectedPlatform === 'TIKTOK') {
        toast({
          title: 'Preparing video',
          description: `Your video is being optimized for TikTok ${publishMode === 'DIRECT_POST' ? 'direct publishing' : 'inbox upload'}...`
        });
      }
      
      // Prepare platform-specific options
      const platformOptions: any = {};
      
      // Add TikTok-specific options if TikTok is selected
      if (selectedPlatform === 'TIKTOK' && publishMode === 'DIRECT_POST') {
        platformOptions.tiktok = {
          privacyLevel,
          disableComment,
          disableDuet,
          disableStitch
        };
      }
      
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socialAccountId: selectedAccountId,
          videoId,
          caption,
          hashtags,
          publishMode: selectedPlatform === 'TIKTOK' ? publishMode : undefined,
          platformOptions
        }),
      });
      
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = 'Failed to publish post';
        
        try {
          const errorData = JSON.parse(errorBody);
          errorMessage = errorData.details || errorData.error || 'Failed to publish post';
          
          // Format TikTok-specific error messages
          if (errorMessage.includes('TikTok rejected') || 
              errorMessage.includes('picture_size_check_failed') ||
              errorMessage.includes('resolution')) {
            // Show a more detailed modal for TikTok errors
            setErrorModalOpen(true);
            setErrorDetails({
              title: 'TikTok Publishing Error',
              message: errorMessage,
              platform: 'TIKTOK',
              suggestion: 'Your video doesn\'t meet TikTok\'s requirements. We recommend using the vertical 9:16 aspect ratio (e.g., 1080x1920) for best results.',
            });
            setPublishing(false);
            return;
          }
          
          // Handle scope authorization errors
          if (errorMessage.includes('scope_not_authorized') || errorMessage.includes('scope required')) {
            setErrorModalOpen(true);
            setErrorDetails({
              title: 'TikTok Authorization Error',
              message: 'Your TikTok account is missing the required permissions for direct publishing.',
              platform: 'TIKTOK',
              suggestion: 'You need to reconnect your TikTok account and make sure to accept ALL requested permissions on the authorization screen.',
            });
            setPublishing(false);
            return;
          }
          
          // Handle inbox limit errors
          if (errorMessage.includes('inbox limit') || errorMessage.includes('too many unpublished videos')) {
            setErrorModalOpen(true);
            setErrorDetails({
              title: 'TikTok Inbox Limit Reached',
              message: errorMessage,
              platform: 'TIKTOK',
              suggestion: 'Please open the TikTok app, publish or delete pending videos from your inbox, then try again.'
            });
            setPublishing(false);
            return;
          }
        } catch (e) {
          // If we can't parse the JSON, just use the raw error body
          if (errorBody.length < 200) {
            errorMessage = errorBody;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // Handle platform-specific success messages
      const platform = accounts.find(a => a.id === selectedAccountId)?.platform || 'Unknown';
      
      if (platform === 'TIKTOK' && result.publishType === 'INBOX_SHARE') {
        toast({
          title: 'Success!',
          description: 'Video uploaded to your TikTok inbox. Open the TikTok app to review and publish it.',
          variant: 'default'
        });
      } else if (platform === 'TIKTOK' && result.publishType === 'DIRECT_POST') {
        toast({
          title: 'Success!',
          description: 'Your video has been directly published to TikTok.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Success!',
          description: `Your video has been published to ${platform}.`,
          variant: 'default'
        });
      }
      
      // Notify parent component of successful publish
      if (onPublish) {
        onPublish(true);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error publishing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish post',
        variant: 'destructive',
      });
      
      // Notify parent component of failed publish
      if (onPublish) {
        onPublish(false);
      }
    } finally {
      setPublishing(false);
    }
  };

  const getAccountPlatformName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 'social media';
    
    switch (account.platform) {
      case 'YOUTUBE': return 'YouTube';
      case 'TIKTOK': return 'TikTok';
      case 'INSTAGRAM': return 'Instagram';
      case 'FACEBOOK': return 'Facebook';
      case 'TWITTER': return 'Twitter';
      default: return 'social media';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE':
        return <FaYoutube className="text-red-600 text-xl" />;
      case 'TIKTOK':
        return <FaTiktok className="text-black text-xl" />;
      case 'INSTAGRAM':
        return <FaInstagram className="text-pink-600 text-xl" />;
      case 'FACEBOOK':
        return <FaFacebook className="text-blue-600 text-xl" />;
      default:
        return null;
    }
  };

  const noAccountsMessage = (
    <div className="text-center py-6">
      <h3 className="text-lg font-medium mb-2">No Social Accounts Connected</h3>
      <p className="text-gray-500 mb-4">
        You need to connect your social media accounts before you can publish videos.
      </p>
      <Button 
        variant="default" 
        onClick={() => {
          onClose();
          window.location.href = '/dashboard/social-accounts';
        }}
      >
        Connect Accounts
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish to Social Media</DialogTitle>
          <DialogDescription>
            Share your video directly to your connected social accounts.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            <span className="ml-3">Loading your accounts...</span>
          </div>
        ) : accounts.length === 0 ? (
          noAccountsMessage
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {/* Account Selection */}
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="account" className="text-left">
                  Select Account
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {accounts.map((account) => (
                    <Button
                      key={account.id}
                      type="button"
                      variant={selectedAccountId === account.id ? "default" : "outline"}
                      className={`flex items-center justify-start p-3 h-auto ${
                        selectedAccountId === account.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedAccountId(account.id)}
                    >
                      <div className="mr-2">{getPlatformIcon(account.platform)}</div>
                      <div className="text-left overflow-hidden">
                        <div className="font-medium text-sm truncate">
                          {account.platform}
                        </div>
                        <div className="text-xs truncate">
                          {account.accountName}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* TikTok Publish Mode Selection */}
              {isTikTokSelected && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">TikTok Publishing Options</h4>
                  
                  <div className="space-y-4">
                    <RadioGroup 
                      value={publishMode} 
                      onValueChange={(value) => setPublishMode(value as 'DIRECT_POST' | 'INBOX_UPLOAD')}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="DIRECT_POST" id="direct-post" />
                        <Label htmlFor="direct-post" className="font-normal">
                          Direct Post - Publish immediately to TikTok
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="INBOX_UPLOAD" id="inbox-upload" />
                        <Label htmlFor="inbox-upload" className="font-normal">
                          Inbox Upload - Send to TikTok app for editing
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {publishMode === 'INBOX_UPLOAD' && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200">
                        <strong>Note:</strong> TikTok limits users to 5 pending videos in 24 hours. 
                        You'll need to open the TikTok app to complete publishing.
                      </div>
                    )}
                    
                    {publishMode === 'DIRECT_POST' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="privacy-level" className="text-sm">Privacy Setting</Label>
                          <select 
                            id="privacy-level"
                            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                            value={privacyLevel}
                            onChange={(e) => setPrivacyLevel(e.target.value)}
                          >
                            <option value="PUBLIC_TO_EVERYONE">Public</option>
                            <option value="MUTUAL_FOLLOW_FRIENDS">Friends</option>
                            <option value="SELF_ONLY">Private</option>
                          </select>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Label htmlFor="disable-comments" className="text-sm">Disable Comments</Label>
                          <Switch 
                            id="disable-comments" 
                            checked={disableComment}
                            onCheckedChange={setDisableComment}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Label htmlFor="disable-duet" className="text-sm">Disable Duet</Label>
                          <Switch 
                            id="disable-duet" 
                            checked={disableDuet}
                            onCheckedChange={setDisableDuet}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Label htmlFor="disable-stitch" className="text-sm">Disable Stitch</Label>
                          <Switch 
                            id="disable-stitch" 
                            checked={disableStitch}
                            onCheckedChange={setDisableStitch}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="caption" className="text-left">
                  Caption
                </Label>
                <Textarea
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder="Write a caption for your post..."
                  className="resize-none"
                />
              </div>

              {/* Hashtags */}
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-left">Hashtags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {hashtags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHashtag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <FaHashtag />
                    </span>
                    <Input
                      value={hashtag}
                      onChange={(e) => setHashtag(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-8"
                      placeholder="Add hashtag"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddHashtag}
                  >
                    <FaPlus />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={publishing}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={publishing || !selectedAccountId}>
                {publishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : isTikTokSelected && publishMode === 'INBOX_UPLOAD' ? (
                  'Send to TikTok'
                ) : (
                  'Publish Now'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {/* Error Modal */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-red-500">{errorDetails.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">{errorDetails.message}</p>
            <div className="bg-slate-100 p-3 rounded-md mb-4">
              <h4 className="text-sm font-medium">Recommendation:</h4>
              <p className="text-sm text-slate-600">{errorDetails.suggestion}</p>
            </div>
            {errorDetails.platform === 'TIKTOK' && errorDetails.title === 'TikTok Authorization Error' && (
              <div className="mt-4 space-y-4">
                <div className="bg-amber-50 p-3 border border-amber-200 rounded-md">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Why am I seeing this?</h4>
                  <p className="text-sm text-amber-700">
                    TikTok allows users to selectively grant permissions during authorization. 
                    For direct publishing to work, you must allow <strong>all requested permissions</strong>, 
                    especially the <code className="bg-amber-100 px-1 rounded">video.publish</code> permission.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-3 border border-slate-200 rounded-md">
                  <h4 className="text-sm font-medium mb-2">How to fix this:</h4>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>Go to Social Accounts page</li>
                    <li>Disconnect your TikTok account</li>
                    <li>Reconnect your account</li>
                    <li><strong>Important:</strong> When prompted by TikTok, ensure you check/allow <strong>ALL</strong> permissions</li>
                  </ol>
                </div>
                
                <Button 
                  onClick={() => {
                    setErrorModalOpen(false);
                    window.location.href = '/dashboard/social-accounts';
                  }}
                  className="w-full"
                >
                  Go to Social Accounts to Reconnect
                </Button>
              </div>
            )}
            {errorDetails.platform === 'TIKTOK' && errorDetails.title !== 'TikTok Authorization Error' && (
              <div>
                <h4 className="text-sm font-medium mb-2">TikTok Video Requirements:</h4>
                <ul className="list-disc pl-5 text-sm text-slate-600">
                  <li>Resolution: 720x1280 or higher (9:16 aspect ratio)</li>
                  <li>Size: 4KB-200MB</li>
                  <li>Format: MP4 or MOV</li>
                  <li>Duration: 5-60 seconds is optimal</li>
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setErrorModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 