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
- **9 Tabs**: 
  1. Pending Approvals (resources)
  2. User Management
  3. Manage Content
  4. Upload New
  5. Pending Reels
  6. Pending Curiofacts
  7. User Reports
  8. Site Settings
  9. Matrix Members
- **Master Admin features**: Demote admins
- Export users and matrix members as CSV
- Review and resolve user reports

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

## Implementation Status

### Completed (Latest Session)
1. ✅ Like/Comment buttons changed to outline style for better visibility
2. ✅ Homepage shows "Sign up to unlock all features" message
3. ✅ Removed assistance email from Mathmate section
4. ✅ Removed all filters from Mathmate (search only)
5. ✅ Pending items visible only in user dashboard
6. ✅ Reels contribute to Mentis Score when approved
7. ✅ Users can submit curiofacts
8. ✅ Share content with promotional message (ResourceHub, Reels, Curiofacts)
9. ✅ Saved resources section in ResourceHub
10. ✅ Chat shows LAST message not first
11. ✅ Email hidden - users can request email access
12. ✅ Matrix Members subsection in Mathmate
13. ✅ Edit profile in Dashboard

### Pending/Future Tasks
1. **P1**: Refactor AdminDashboard.jsx into smaller components
2. **P1**: Add rejection email notifications for resources
3. **P2**: Implement email verification for new signups
4. **P2**: Add drag-and-drop uploads in admin dashboard

## Master Admin Credentials
- Email: atreyaghoshal.68@gmail.com
- Password: 4tr3y4@54N14

---
Last Updated: March 3, 2026
