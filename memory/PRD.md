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

### Pending/Future Tasks
1. **P1**: Implement "Reply to Message" in Mathmate chat
2. **P1**: Refactor AdminDashboard.jsx into smaller components
3. **P2**: Implement email verification for new signups
4. **P2**: Add drag-and-drop uploads in admin dashboard

## Master Admin Credentials
- Email: atreyaghoshal.68@gmail.com
- Password: 4tr3y4@54N14

---
Last Updated: December 3, 2026
