# Social Media Integration for Reels Creator

This document outlines the social media integration features implemented for the Reels Creator application.

## Overview

The social media integration allows users to:

1. Connect their social media accounts (YouTube, TikTok, Instagram, Facebook)
2. Publish their edited videos directly to social platforms
3. Schedule posts for future publication
4. Track published content and performance analytics

## Components Implemented

### Database Models
- `SocialMediaAccount`: Stores connected social media accounts with encrypted OAuth tokens
- `ScheduledPost`: Tracks scheduled and published posts with metadata

### API Endpoints
- `/api/social/accounts`: CRUD operations for social media accounts
- `/api/social/publish`: Immediate publishing of videos to social platforms
- `/api/social/schedule`: Scheduling videos for future publication
- `/api/social/schedule/[id]`: Managing specific scheduled posts
- `/api/cron/process-scheduled-posts`: Background worker for processing scheduled posts

### User Interface
- **Social Accounts Page**: Management of connected social accounts
- **Social API Settings**: Configuration of API credentials for each platform
- **Publish Modal**: Interface for immediate publishing of videos
- **Schedule Modal**: Interface for scheduling future publications
- **Social Dashboard**: Analytics and tracking of published content
- **Schedule Page**: Integrated publish and schedule functionality with video selection

## Technical Details

### Security
- OAuth tokens are encrypted using AES-256-CBC encryption
- API endpoints are properly authenticated
- Background worker is protected with a secret key

### Simulated Features
In this implementation, certain features are simulated for demonstration purposes:
- The OAuth authentication flow is simulated (connect/disconnect accounts)
- Publishing to social platforms is simulated without actual API calls
- Analytics data is simulated with sample statistics

### Future Enhancements
To make this implementation production-ready, the following would be needed:
1. Complete OAuth integration with each social platform
2. Implement actual API calls to publish content to each platform
3. Set up a proper background job scheduler (e.g., using Vercel Cron Jobs or a dedicated service)
4. Implement real analytics data collection from each platform's API
5. Add proper error handling for platform-specific API limitations

## Testing

You can test the social media integration as follows:

1. Visit the Social Accounts page (`/dashboard/social-accounts`) to connect accounts
2. Configure API settings (optional) at `/dashboard/social-accounts/settings`
3. Go to the Schedule page (`/dashboard/schedule`) to select videos
4. Use the "Publish" button to simulate immediate publishing
5. Use the "Schedule" button to schedule posts for future dates
6. Visit the Social Dashboard (`/dashboard/social-dashboard`) to view analytics and scheduled posts

Note: All actions are simulated and no actual posts will be made to social media platforms.

## Dependencies

- `crypto`: For encryption of OAuth tokens
- `date-fns`: For date formatting and handling
- `react-day-picker`: For the calendar component in scheduling
- `recharts`: For analytics visualization

## Implementation Notes

- The encryption system uses environment variables for the encryption key (default is provided for development)
- The system is designed to be extensible for additional social platforms
- All components are responsive and follow the application's design system 