# Mentis - Mathematics Community Platform

## Product Overview
Mentis is a hybrid platform combining features of LinkedIn and Reddit for the mathematics community. It enables users to share resources, connect with peers, and engage with educational content.

## Core Requirements

### User Authentication
- **Full registration and login system** with JWT tokens
- **Role-based access**: user, admin, master_admin
- **Forgot Password**: Secure password reset via SendGrid email
- **Master Admin**: Specific user (atreyaghoshal.68@gmail.com) has elevated privileges to demote/remove admins
- **Edit Profile**: Users can update their name and email from dashboard

### Protected Routes (Require Login)
- Resource Hub
- Funamatics
- Mathmate (Chat/Connect)
- Reels

### Core Sections

#### 1. Resource Hub
- Upload and share educational notes and playlists
- Resources require admin approval
- Uploader's name displayed on each resource
- Search functionality
- **Like and Comment features** (outline button style)
- **Save/Bookmark resources** - personal saved resources section
- **Share resources** with promotional message
- Description tooltips on hover

#### 2. Funamatics
- Gaming section with math-related external game links
- Search functionality
- Description tooltips on hover

#### 3. Curiofacts
- Weekly math facts and interesting content
- **Like and Comment features** (outline button style)
- **Share facts** with promotional message
- **User submissions** - users can submit curiofacts for admin approval

#### 4. Matrix
- Community joining section
- Live counts of registered members and organizations
- WhatsApp community link
- **"All details must be filled in CAPITAL LETTERS"** notice
- **"Organization"** label (replaced "University/College")
- Auto-uppercase input enforcement

#### 5. Reels (NEW)
- Educational short videos up to 2 minutes
- Support for YouTube, Instagram, and Google Drive links
- Direct video upload option
- Caption with creator acknowledgment requirement
- Admin approval workflow
- **Like and Share** functionality
- **Contributes to Mentis Score** when approved

#### 6. Mathmate (formerly Connect)
- User discovery and search (no filters, search only)
- **Email privacy** - emails hidden by default, users can request email access
- Connection requests (send, accept, reject)
- Real-time chat with WebSockets
- **Enhanced Chat Features**:
  - Delete messages
  - Unsend messages
  - Reply to specific messages
  - Pinned chats
  - Refresh chat button
  - Clear chat history
  - **Shows last message** in connection list (not first)
- User profile view with Mentis Score
- **User Report feature** for misconduct
- **Matrix Members subsection** - view registered members (name, org, interests)

### User Dashboard
- **Edit Profile button** - update name and email
- **Pending Submissions section** - view pending resources, reels, curiofacts
- **Email Requests section** - approve/reject email visibility requests
- Mentis Score display
- Approved resources list

### Admin Control Panel
- **10 Tabs**: 
  1. Pending Approvals (resources)
  2. User Management
  3. Manage Content
  4. Upload New
  5. Pending Reels
  6. Pending Curiofacts
  7. User Reports
  8. Site Settings
  9. **About Us** (Master Admin only) - Edit about page content and manage tutorial videos
  10. Matrix Members
- **Master Admin features**: Demote admins, manage About Us content and tutorials
- Export users and matrix members as CSV
- Review and resolve user reports

#### 7. About Us (NEW)
- Public page accessible to all visitors
- Professional design with smooth Framer Motion animations
- Sections: Hero, Our Community, Our Foundation (Vision/Mission/Values), How to Use, Tutorial Videos, Contact
- **Master Admin Management**:
  - Edit tagline, community info, vision, mission, values
  - Add/delete YouTube tutorial videos
  - Set display order for tutorials

### Homepage
- **"Sign up to unlock all features"** message for non-logged-in users

### Footer
- Contact email: mentis.mathematics@gmail.com
- Present on every page

## Tech Stack
- **Backend**: FastAPI, Python, MongoDB (Pymongo), WebSockets
- **Frontend**: React, Tailwind CSS, shadcn/ui, Framer Motion
- **Authentication**: JWT with Passlib
- **Email**: SendGrid

## Database Schema
- `users`: {id, name, email, hashed_password, role, college, total_resources, created_at}
- `resources`: {id, title, url, status, submitted_by, uploader_name, created_at}
- `games`: {id, title, url, thumbnail, difficulty, description}
- `curiofacts`: {id, title, content, published_at, submitted_by, submitter_name}
- `curiofact_submissions`: {id, user_id, user_name, title, content, status, created_at}
- `matrix_registrations`: {id, name, email, college, interests}
- `connections`: {id, requester_id, receiver_id, status}
- `messages`: {id, connection_id, sender_id, content, reply_to, unsent, created_at}
- `likes`: {id, user_id, target_id, target_type, created_at}
- `comments`: {id, user_id, user_name, target_id, target_type, content, created_at}
- `reels`: {id, user_id, user_name, video_url, video_type, caption, status, created_at}
- `user_reports`: {id, reporter_id, reported_user_id, reason, description, status, created_at}
- `pinned_chats`: {id, user_id, connection_id, created_at}
- `saved_resources`: {id, user_id, resource_id, created_at}
- `email_requests`: {id, requester_id, target_user_id, status, created_at}
- `about_us`: {id, tagline, community_info, foundation_info, vision, mission, values, instructions, updated_at}
- `tutorials`: {id, title, description, video_url, order, created_at, created_by}

## Key API Endpoints
- `/api/auth/{signup, login, forgot-password, reset-password}`
- `/api/users/me` (PATCH - update profile)
- `/api/users/me/pending` (GET - pending items)
- `/api/resources`, `/api/saved-resources`, `/api/resources/{id}/save`
- `/api/reels`, `/api/reels/pending`
- `/api/curiofacts`, `/api/curiofacts/submit`, `/api/curiofacts/pending`
- `/api/{target_type}/{target_id}/like`, `/api/{target_type}/{target_id}/comment`
- `/api/users/{user_id}/report`, `/api/users/{user_id}/request-email`
- `/api/email-requests`
- `/api/connections`, `/api/messages`
- `/api/matrix-members-public`
- `/api/master-admin/demote/{user_id}`
- `/api/about-us` (GET - public), `/api/master-admin/about-us` (PATCH)
- `/api/tutorials` (GET), `/api/master-admin/tutorials` (POST, DELETE)

## Implementation Status

### Completed (Current Session - December 3, 2026)
1. ✅ **About Us Section** - Complete implementation with:
   - Professional page with Framer Motion animations
   - Sections: Hero, Our Community, Foundation (Vision/Mission/Values), How to Use, Tutorial Videos, Contact
   - Master Admin management panel in Admin Dashboard
   - CRUD for tutorial videos
   - Content editing for all text sections
   - **Logo Image** management - appears in top-left corner of all pages
   - API: `/api/about-us`, `/api/master-admin/about-us`, `/api/tutorials`, `/api/master-admin/tutorials`

2. ✅ **Promotional Share Message** - Enhanced share buttons across:
   - Resource Hub
   - Curiofacts
   - Reels
   - All include branded "MENTIS - Where Minds Meet Mathematics" footer

3. ✅ **Resource Rejection Email** - Email notification sent when admin rejects a resource

4. ✅ **Navigation Updates**:
   - Renamed "About" to "About us"
   - Logo display in top-left corner (set by Master Admin)

5. ✅ **"Ready to Begin" Section** - Hidden for logged-in users, only shows for visitors

6. ✅ **Mathmate Notification System**:
   - **Notification bubble** on Mathmate nav link when unread messages exist
   - Red/pink pulsing badge with count (shows 99+ for >99 messages)
   - **Auto-removal** when user views the chat (messages marked as read)
   - **24-hour email notification** - Background task sends email for unseen messages older than 24 hours
   - Navigation polls every 30 seconds for unread count
   - API: `/api/messages/unread/count`, `/api/messages/{connection_id}/mark-read`

7. ✅ **Chat Scrollbar Fix**:
   - Added fixed height (350px) ScrollArea for chat messages
   - Users can scroll through older messages without layout overlap

8. ✅ **Conditional Footer**:
   - Footer only visible on Homepage (/) and About Us (/about) pages
   - Hidden on all other pages (Curiofacts, Mathmate, Resources, etc.)

9. ✅ **Curiofacts Cover Image & Uploader Name**:
   - Users can upload optional cover image URL when submitting Curiofacts
   - Uploader name displayed on each Curiofact card ("by [name]")
   - Admin Dashboard shows images in pending Curiofacts review

10. ✅ **Chat Scrollbar Fix (Enhanced)**:
    - Messages contained within fixed-height (300px) scrollable container
    - Uses `overflow-hidden` + `absolute inset-0` ScrollArea pattern
    - No message overflow outside chatbox

11. ✅ **Non-Registered User Access Restriction**:
    - Non-logged-in users only see Homepage (/) and About Us (/about)
    - All other pages redirect to login
    - Navigation hides protected links for non-authenticated users

12. ✅ **Description Tooltips**:
    - Resource Hub: Tooltip on hover shows full description
    - Reels: Tooltip on hover shows full caption
    - Both use `cursor-help` class for visual indication

### Completed (Previous Session - Fixes)
1. ✅ **Like/Comment/Save/Share buttons fixed** - Added z-index, preventDefault, stopPropagation for proper click handling
2. ✅ **Sign up banner conditional** - Only shows for non-logged-in users
3. ✅ **Mathmate scrolling and pagination** - Added proper overflow handling and pagination controls (10 items per page)
4. ✅ **Email hidden in user list** - Removed email from Discover tab, only shows name and organization

### Previously Completed
- Full authentication system with password reset
- Resource Hub with like/comment, search, save, share
- Funamatics with search, tooltips
- Curiofacts with like/comment, share, user submissions
- Matrix with organization labels and CAPITAL letters enforcement
- Mathmate with enhanced chat features
- User reporting system
- Reels section for educational videos
- Admin dashboard with 9 management tabs
- Master admin role with demote capability
- Protected routes requiring authentication

### Completed (December 3, 2026 - Session 2)
1. ✅ **FAQ Section for About Us**
   - Accordion-style FAQ display on About Us page
   - Master Admin FAQ management (add, edit, delete) in Admin Dashboard
   - API: `/api/faqs` (public), `/api/master-admin/faqs` (CRUD)

2. ✅ **Deep Linking for Shared Content**
   - Share URLs use `?view=` query parameter
   - Clicking shared link opens content in modal popup
   - Implemented for Resources, Curiofacts, and Reels
   - Single item fetch endpoints: `/api/resources/{id}`, `/api/curiofacts/{id}`, `/api/reels/{id}`

3. ✅ **Master Admin Matrix Member Editing**
   - Edit button added to Matrix Members tab for Master Admin
   - Can edit name, email, organization, and interests
   - API: `PATCH /api/master-admin/matrix-members/{id}`

4. ✅ **Unique Name/Email for Matrix Registration**
   - Case-insensitive duplicate checking for name and email
   - Auto-capitalization of name and organization fields
   - Clear error messages for duplicates

### Completed (December 10-11, 2026)
1. ✅ **Mathmate Chat List Sorting Bug Fix**
   - Fixed bug where chat connections were not sorted by most recent message
   - Root cause: Frontend was looking for `last_message.timestamp` but backend returns `last_message.created_at`
   - Fix location: `/app/frontend/src/pages/ConnectPage.jsx` lines 144-149
   - Connections now correctly display with most recent chats at top

2. ✅ **Android Mobile App Setup**
   - Configured Capacitor for Android build
   - Updated `capacitor.config.json` with proper splash screen and status bar settings
   - Enhanced `AndroidManifest.xml` with required permissions and deep linking
   - Configured `build.gradle` for both debug and release builds with signing support
   - Created comprehensive build guide: `README-ANDROID.md`
   - Web app built and synced with Capacitor
   - Package: `com.mentismathematicsfoundation.app`

3. ✅ **PWA Support for PWABuilder**
   - Added `manifest.json` with app icons, shortcuts, and metadata
   - Implemented service worker for caching and offline support
   - Generated app icons in all required sizes (72x72 to 512x512)
   - Added meta tags for iOS and Android PWA support
   - Ready for PWABuilder packaging

4. ✅ **Renamed "Reels" to "VEX"**
   - Updated navigation menu, page titles, buttons
   - Updated all toast messages and share text
   - Updated admin dashboard tabs
   - Updated user dashboard references

5. ✅ **Push Notifications System**
   - Created NotificationService (`/app/frontend/src/services/NotificationService.js`)
   - Notifications for new messages when tab is in background
   - Notifications for new connection requests
   - "Enable Notifications" button in Mathmate header
   - Notifications auto-trigger when browser tab is hidden

6. ✅ **Real-time Chat Auto-refresh**
   - Chat messages auto-refresh every 1 second when a chat is open
   - Connection list auto-refreshes every 1 second
   - Pending requests also auto-refresh for real-time updates
   - Fixed scroll bug that was auto-scrolling page to bottom

7. ✅ **PWA Auto-Update System**
   - Service Worker v2 with cache versioning
   - PWAUpdatePrompt component shows toast when new version available
   - Auto-checks for updates every 5 minutes
   - "Update Now" button for immediate refresh

8. ✅ **Mentis Score System**
   - Resource Hub upload (approved): +5 points
   - VEX upload (approved): +3 points
   - Curiofacts upload (approved): +1 point
   - Score displayed in user dashboard with breakdown
   - Added `mentis_score` field to User model

### Completed (March 11, 2026)
1. ✅ **File Sharing in Mathmate Chat**
   - Backend: `/api/messages/{connection_id}/with-file` endpoint for file uploads
   - Backend: `/api/upload-file` general file upload endpoint
   - Files stored in `/app/uploads/files/` directory
   - Supports images, videos, audio, documents (PDF, DOC, XLS, etc.)
   - Max file size: 50MB
   - Files render inline for images, as download links for documents

2. ✅ **Group Chat Feature in Mathmate**
   - Backend: Full CRUD for group chats (`/api/groups`)
   - Create groups with name, description, and member selection from connections
   - Send text and file messages to groups
   - Leave group functionality
   - Group list shows member count and last message preview
   - Real-time message refresh in group chats

3. ✅ **Auto-scroll Bug Fix**
   - Fixed issue where chat would forcibly scroll to bottom on every refresh
   - Implemented smart scrolling: only scrolls when NEW messages arrive
   - Uses `prevMessageCountRef` to track message count changes
   - Fixed in both private chat (ChatWindow) and group chat (GroupChat) components

4. ✅ **ConnectPage Refactoring**
   - Reduced ConnectPage.jsx from 1625 lines to 1073 lines (~34% reduction)
   - Extracted components:
     - `ChatWindow.jsx` (458 lines) - Private chat UI, messaging, file attachments
     - `ConnectionList.jsx` (156 lines) - Sidebar with connections and requests
     - `UserProfileDialog.jsx` (152 lines) - User profile modal
   - Created `/app/frontend/src/components/connect/` directory with index.js
   - All components properly export and function correctly

### Completed (March 15, 2026)
1. ✅ **Email Verification for New Signups**
   - Backend: `/api/auth/verify-email` and `/api/auth/resend-verification` endpoints
   - Frontend: `VerifyEmailPage.jsx` and `ResendVerificationPage.jsx` pages
   - New users receive verification email via SendGrid
   - Login blocked (403) until email verified
   - **Special bypass rules**:
     - Master Admin (`atreyaghoshal.68@gmail.com`) can login without verification
     - Existing users (no `verification_token` field) can login without verification
   - 24-hour token expiration
   - User schema updated: `email_verified`, `verification_token`, `verification_token_expires` fields

2. ✅ **Profile View Bug Fix**
   - Fixed blank screen when viewing user profiles in Mathmate/Connect
   - Root cause: Missing lucide-react icon imports
   - Profile modal now displays correctly with all user stats

3. ✅ **Chat "Unsend" Feature Removed**
   - Removed "Unsend" option from chat message hover actions
   - Only "Reply" and "Delete" buttons remain
   - Backend endpoint still exists but is unused by frontend

4. ✅ **Admin Content Deletion Fix**
   - Replaced unreliable `window.confirm()` with proper `AlertDialog` component
   - Delete confirmations now work reliably in Admin Dashboard

5. ✅ **Health Check Endpoint**
   - Added `/api/health` endpoint for Kubernetes deployment monitoring
   - Returns `{"status": "healthy"}` for liveness/readiness probes

### Completed (March 15, 2026 - Session 2)
1. ✅ **Comprehensive Filter System**
   - **Resource Hub Filters**: Content Type (Notes, Playlist, Book, Article, PPTs, Others), Education Level, Math Domain, Difficulty
   - **Curiofacts Filters**: Education Level, Math Domain, Difficulty with search
   - **VEX Filters**: Education Level, Math Domain with search
   - Server-side filtering via query parameters
   - Filter badges with multi-select capability
   - "Clear All Filters" button when filters active

2. ✅ **Search Functionality**
   - **Resource Hub**: Search by title, topic, or tags
   - **Curiofacts**: Search by title, content, or tags
   - **VEX**: Search by caption or tags
   - Real-time search with server-side filtering

3. ✅ **Tags System**
   - Users can add tags when uploading content
   - Tags are searchable across all content types
   - Tag input with Enter key or Add button
   - Tags displayed as badges in upload forms

4. ✅ **New Resource Categories**
   - Added "PPTs" content type for presentations
   - Added "Others" content type for miscellaneous resources

5. ✅ **Filter Options API**
   - `GET /api/filter-options` - Returns all filter categories
   - Auto-seeding of 58 default filter options on first call
   - Categories: education_level (5), math_domain (14), class_grade (16), difficulty (4), exam_type (9), language (10)
   - Admin endpoints for managing filter options

6. ✅ **Upload Form Enhancements**
   - All upload forms now include categorization section
   - Education Level, Math Domain, Difficulty selectors
   - Tags input for user-generated keywords
   - Language selection dropdown

### Pending/Future Tasks
1. **P1**: Implement "Reply to Message" in Mathmate chat (UI exists, needs backend)
2. **P1**: Complete AdminDashboard.jsx refactoring (partially done)
3. **P1**: Optimize N+1 database queries for better performance
4. **P2**: Add drag-and-drop uploads in admin dashboard
5. **P2**: Add `data-testid` attributes to new interactive elements

## Master Admin Credentials
- Email: atreyaghoshal.68@gmail.com
- Password: 4tr3y4@54N14

## Database Schema Updates (March 15, 2026)
- `users`: Added `email_verified` (bool), `verification_token` (str), `verification_token_expires` (datetime)
- `resources`: Added `education_level` (array), `math_domain` (array), `class_grade` (str), `difficulty` (str), `exam_type` (array), `language` (str), `tags` (array)
- `curiofacts`: Added `education_level` (array), `math_domain` (array), `difficulty` (str), `language` (str), `tags` (array)
- `reels`: Added `education_level` (array), `math_domain` (array), `difficulty` (str), `exam_type` (array), `language` (str), `tags` (array)
- `filter_options`: New collection for admin-managed filter categories

---
Last Updated: March 15, 2026
