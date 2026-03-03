# Mentis - Mathematics Community Platform

## Product Overview
Mentis is a hybrid platform combining features of LinkedIn and Reddit for the mathematics community. It enables users to share resources, connect with peers, and engage with educational content.

## Core Requirements

### User Authentication
- **Full registration and login system** with JWT tokens
- **Role-based access**: user, admin, master_admin
- **Forgot Password**: Secure password reset via SendGrid email
- **Master Admin**: Specific user (atreyaghoshal.68@gmail.com) has elevated privileges to demote/remove admins

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
- **Like and Comment features** for user engagement
- Description tooltips on hover

#### 2. Funamatics
- Gaming section with math-related external game links
- Search functionality
- Description tooltips on hover

#### 3. Curiofacts
- Weekly math facts and interesting content
- **Like and Comment features** for user engagement

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
- Like functionality

#### 6. Mathmate (formerly Connect)
- User discovery and search
- Connection requests (send, accept, reject)
- Real-time chat with WebSockets
- **Enhanced Chat Features**:
  - Delete messages
  - Unsend messages
  - Reply to specific messages
  - Pinned chats
  - Refresh chat button
  - Clear chat history
- User profile view with Mentis Score
- **User Report feature** for misconduct
- Organization-based filtering (removed "All Colleges" option)

### Admin Control Panel
- **8 Tabs**: Pending Approvals, User Management, Manage Content, Upload New, Pending Reels, User Reports, Site Settings, Matrix Members
- Approve/reject resources and reels
- Manage users (promote to admin, delete users)
- **Master Admin features**: Demote admins
- Manage games and curiofacts
- Update site settings (hero image with Google Drive URL support)
- Export users and matrix members as CSV
- Review and resolve user reports

### Footer
- Contact email: mentis.mathematics@gmail.com
- Present on every page

## Tech Stack
- **Backend**: FastAPI, Python, MongoDB (Pymongo), WebSockets
- **Frontend**: React, Tailwind CSS, shadcn/ui, Framer Motion
- **Authentication**: JWT with Passlib
- **Email**: SendGrid
- **Architecture**: MERN-like (MongoDB, FastAPI, React)

## Database Schema
- `users`: {id, name, email, hashed_password, role, college, created_at}
- `resources`: {id, title, url, status, submitted_by, uploader_name, created_at}
- `games`: {id, title, url, thumbnail, difficulty, description}
- `curiofacts`: {id, title, content, published_at}
- `matrix_registrations`: {id, name, email, college, interests}
- `password_reset_tokens`: {email, token, expires_at}
- `settings` & `site_settings`: {key/id, hero_image_url}
- `connections`: {id, requester_id, receiver_id, status}
- `messages`: {id, connection_id, sender_id, content, reply_to, unsent, created_at}
- `likes`: {id, user_id, target_id, target_type, created_at}
- `comments`: {id, user_id, user_name, target_id, target_type, content, created_at}
- `reels`: {id, user_id, user_name, video_url, video_type, caption, status, created_at}
- `user_reports`: {id, reporter_id, reported_user_id, reason, description, status, created_at}
- `pinned_chats`: {id, user_id, connection_id, created_at}

## Key API Endpoints
- `/api/auth/{signup, login, forgot-password, reset-password}`
- `/api/resources`, `/api/games`, `/api/curiofacts`
- `/api/admin/{approve-resource, users, delete-user, promote-admin, site-settings}`
- `/api/reels`, `/api/reels/pending`, `/api/admin/reels/{reel_id}`
- `/api/{target_type}/{target_id}/like`, `/api/{target_type}/{target_id}/comment`
- `/api/users/{user_id}/report`, `/api/admin/reports`
- `/api/connections`, `/api/messages`, `/api/connections/{id}/pin`
- `/api/messages/{id}/unsend`, `/api/messages/{id}/reply`
- `/api/master-admin/demote/{user_id}`
- `WS /api/ws/{user_id}` (WebSocket for real-time chat)

## Implementation Status

### Completed ✅
- Full authentication system with password reset
- Resource Hub with like/comment, search, tooltips
- Funamatics with search, tooltips
- Curiofacts with like/comment
- Matrix with organization labels and CAPITAL letters enforcement
- Mathmate with enhanced chat features (reply, unsend, delete, pin, refresh)
- User reporting system
- Reels section for educational videos
- Admin dashboard with 8 management tabs
- Master admin role with demote capability
- Protected routes requiring authentication
- Email notifications (password reset, resource approval)
- Google Drive URL conversion for all media

### Pending/Future Tasks
1. **Refactor AdminDashboard.jsx** (P1) - Break into smaller components
2. **Rejection Email Notifications** (P1) - Email users when resources are rejected
3. **Email Verification for Signups** (P2) - Verify email addresses
4. **Drag-and-Drop Uploads** (P2) - Enhanced admin UX

## Master Admin Credentials
- Email: atreyaghoshal.68@gmail.com
- Password: 4tr3y4@54N14

---
Last Updated: March 3, 2026
