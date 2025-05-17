import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaPlus, FaHashtag } from 'react-icons/fa';
import { Loader2, Clock, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SocialAccount {
  id: string;
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER';
  accountName: string;
}

interface ScheduleModalProps {
  videoId: string;
  videoTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSchedule?: (success: boolean) => void;
}

export default function ScheduleModal({ videoId, videoTitle, isOpen, onClose, onSchedule }: ScheduleModalProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Date related states
  const [date, setDate] = useState<Date>();
  const [hours, setHours] = useState<string>("12");
  const [minutes, setMinutes] = useState<string>("00");
  const [ampm, setAmPm] = useState<string>("PM");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default to tomorrow at noon
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(12, 0, 0, 0);

      setCaption(videoTitle);
      setDate(tomorrow);
      setHours("12");
      setMinutes("00");
      setAmPm("PM");
      setHashtags([]);
      setHashtag('');
      setSelectedAccountId('');
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

  // Get the combined date and time
  const getScheduledDateTime = () => {
    if (!date) return null;

    try {
      const result = new Date(date);
      let hour = parseInt(hours, 10);

      // Convert 12-hour format to 24-hour format
      if (ampm === "PM" && hour < 12) {
        hour += 12;
      } else if (ampm === "AM" && hour === 12) {
        hour = 0;
      }

      const minute = parseInt(minutes, 10);
      result.setHours(hour, minute, 0, 0);
      return result;
    } catch (error) {
      console.error("Error creating date time:", error);
      return null;
    }
  };

  const handleSchedule = async () => {
    if (!selectedAccountId) {
      toast({
        title: 'Error',
        description: 'Please select a social account to publish to',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Error',
        description: 'Please select a date to schedule the post',
        variant: 'destructive',
      });
      return;
    }

    const scheduledDateTime = getScheduledDateTime();

    if (!scheduledDateTime) {
      toast({
        title: 'Error',
        description: 'Please select a valid time to schedule the post',
        variant: 'destructive',
      });
      return;
    }

    // Validate the date is in the future
    if (scheduledDateTime <= new Date()) {
      toast({
        title: 'Error',
        description: 'Please select a future date and time',
        variant: 'destructive',
      });
      return;
    }

    try {
      setScheduling(true);

      const response = await fetch('/api/social/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socialAccountId: selectedAccountId,
          videoId,
          caption,
          hashtags,
          scheduledFor: scheduledDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to schedule post');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Your video has been scheduled to post on ${format(scheduledDateTime, 'PPP')} at ${format(scheduledDateTime, 'h:mm a')}`,
      });

      if (onSchedule) {
        onSchedule(true);
      }

      onClose();
    } catch (error: any) {
      console.error('Error scheduling post:', error);
      toast({
        title: 'Scheduling Failed',
        description: error.message || 'There was an error scheduling your post',
        variant: 'destructive',
      });

      if (onSchedule) {
        onSchedule(false);
      }
    } finally {
      setScheduling(false);
    }
  };

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // Generate minute options (00, 15, 30, 45)
  const minuteOptions = ['00', '15', '30', '45'];

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
        You need to connect your social media accounts before you can schedule posts.
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
          <DialogTitle>Schedule Social Media Post</DialogTitle>
          <DialogDescription>
            Schedule your video to be published at a specific date and time.
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
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {accounts.map((account) => (
                    <Button
                      key={account.id}
                      type="button"
                      variant={selectedAccountId === account.id ? "default" : "outline"}
                      className={`flex items-center justify-start p-3 h-auto ${selectedAccountId === account.id ? 'ring-2 ring-purple-500' : ''
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

              {/* Schedule Date/Time Selection */}
              <div className="grid grid-cols-1 gap-3">
                <Label className="text-left">Schedule For</Label>
                <div className="flex flex-col space-y-3">
                  {/* Date Picker from ShadcnUI */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Time Picker */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div className="flex items-center gap-2">
                      {/* Hours */}
                      <Select value={hours} onValueChange={setHours}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue>{hours}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map(hour => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <span className="text-gray-500">:</span>

                      {/* Minutes */}
                      <Select value={minutes} onValueChange={setMinutes}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue>{minutes}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {minuteOptions.map(min => (
                            <SelectItem key={min} value={min}>
                              {min}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* AM/PM */}
                      <Select value={ampm} onValueChange={setAmPm}>
                        <SelectTrigger className="w-[70px]">
                          <SelectValue>{ampm}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

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
                      className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveHashtag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={onClose} disabled={scheduling}>
                Cancel
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={scheduling || !selectedAccountId || !date}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Post'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 