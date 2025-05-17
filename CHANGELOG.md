# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Created ARCHITECTURE_BLUEPRINT.md to document project structure and flows
- Created TODO.md to track tasks
- Created CHANGELOG.md to track changes
- Added extensive logging in video upload and save process to troubleshoot database connectivity
- Improved error handling in video processing flows to better handle API failures
- Added development debugging endpoint for checking database connectivity and records
- Fixed issue with uploading videos not showing in UI by adding UI refresh after database save
- Added functionality to save edited videos to the database
- Changed Export button to Save button in the video editor
- Added popup after saving with Download and Publish options
- Added "My Edited Videos" section to the home page to display saved videos
- Added server-side file storage for edited videos in public/editedClips folder
- Added video duration detection before saving to database
- Added editable title input field on the edit page
- Added "All Videos" tab to the social dashboard to display videos with all statuses
- Created video preview functionality for social media posts
- Implemented retry mechanism for failed social media posts
- Enhanced the social dashboard with better status indicators and action buttons
- Added status filtering capability to the social dashboard
- Fixed toast notification system to properly display notifications instead of just logging to console

### Fixed
- Fixed subscription success page to better handle post-payment flow
- Added subscription verification and repair functionality
- Improved error handling in the subscription process
- Fixed database schema mismatch for Clip model by adding missing duration field
- Applied database migration to synchronize Prisma schema with the database
- Fixed "Missing required field: duration" error when saving edited videos
- Fixed syntax error in HomeSidebar.tsx causing build failure
- Fixed date/time selection issues in the social media ScheduleModal component
- Completely redesigned time selection in ScheduleModal to use proper AM/PM format with dropdown selectors

### Changed
- Enhanced subscription success page with better UX and status indicators
- Added retry mechanism for subscription verification
- Improved logging for subscription-related events
- Changed video saving flow to save files on server instead of browser memory
- Removed unnecessary auto-refresh interval on dashboard home page to improve performance
- Improved date/time synchronization in the social media scheduling system
- Upgraded UI for scheduling interface with better spacing, color consistency, and improved time selector

## [1.0.0] - Prior to Current Updates

### Added
- Initial application setup with Next.js
- User authentication system
- Admin dashboard
- Video processing functionality
- Stripe subscription integration
- User dashboard
- Video editing features 

## [0.1.0] - 2023-10-15
- Initial release with basic functionality
- User authentication
- Video upload capability
- Basic dashboard UI
- Clip generation 

## [1.3.0] - 2023-07-15

### Added
- Real OAuth integration for social media platforms
  - Complete YouTube OAuth flow with authorization and callback endpoints
  - Complete TikTok OAuth flow with authorization and callback endpoints
  - Framework for adding additional platforms (Facebook, Instagram)
  - Secure token storage with encryption
  - Automatic token refresh for expired tokens
- Real video publishing to social platforms
  - YouTube video upload implementation
  - Support for hashtags and captions
  - Error handling and status tracking
- Scheduled posts processor for handling future-scheduled content
  - Background job to process posts scheduled for publication
  - Status tracking and error handling

### Changed
- Updated existing social accounts UI to use real OAuth flows
- Replaced simulated publishing with actual API calls

### Fixed
- Token expiration issues through automatic refresh mechanism
- Security improvements for OAuth state handling 

## [1.4.0] - 2023-07-20

### Added
- Fixed OAuth flows for social media platforms
  - Added proper route handlers for all platforms (YouTube, TikTok, Instagram, Facebook, Twitter)
  - Created comprehensive error handling and user feedback
  - Added admin interface for configuring OAuth credentials
- Enhanced social accounts UI
  - Added error messages for connection issues
  - Added admin link to OAuth settings configuration
- Created database storage for OAuth credentials
  - Updated Prisma schema to store platform credentials
  - Added encryption for secure token storage
- Added ROUTES constant system for consistent URL handling
- Improved error handling in social media connections

### Fixed
- "YouTube client ID not configured" error when connecting accounts
- "Bad request" errors in platform authorization
- OAuth navigation errors with incorrect route handling
- Fixed error display and user feedback for connection failures 