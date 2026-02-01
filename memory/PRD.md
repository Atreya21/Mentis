# Mentis - Mathematics Community Platform

## Product Overview
A hybrid LinkedIn + Reddit style platform for mathematics enthusiasts, built for the mathematics community.

## Original Problem Statement
Build a website called "Mentis" for a mathematics community with user authentication, four core content sections, a comprehensive admin dashboard, and a modern dark academic theme.

## Core Requirements

### User Authentication
- [x] Full registration and login system (JWT-based)
- [x] Role-based access control (user, admin)
- [x] Secure password reset via email (SendGrid)

### Four Core Sections
1. **Resource Hub** - [x] Students can find notes and playlists. Resources require admin approval.
2. **Funamatics** - [x] Gaming section with links to external math-related games.
3. **Curiofacts** - [x] Weekly updates of interesting math facts.
4. **Matrix** - [x] Community joining section with live member/college counts and WhatsApp link.

### Admin Control Panel
- [x] Approve/reject pending resources
- [x] Add/delete content in Resource Hub, Funamatics, Curiofacts
- [x] View registered users and export as CSV
- [x] Promote users to admin status
- [x] Update site-wide settings (hero image)

### Design & UI
- [x] Modern dark theme with academic elegance
- [x] Interactive animations (Framer Motion)
- [x] Footer on every page with contact email: mentis.mathematics@gmail.com

## Tech Stack
- **Backend:** FastAPI, Python, MongoDB (Motor async driver)
- **Frontend:** React, Tailwind CSS, shadcn/ui, Framer Motion
- **Authentication:** JWT with Passlib (bcrypt)
- **Email:** SendGrid for transactional emails

## Database Schema
- `users`: {id, name, email, hashed_password, role, college}
- `resources`: {id, title, description, url, status, created_by, created_at}
- `games`: {id, title, description, url, difficulty, thumbnail}
- `curiofacts`: {id, title, content, image_url, published_at}
- `matrix_registrations`: {id, name, email, college, created_at}
- `password_reset_tokens`: {email, token, expires_at, used}
- `settings`: {key, hero_image_url}

## Key API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/resources` - Get approved resources
- `GET /api/games` - Get all games
- `GET /api/curiofacts` - Get all facts
- `GET /api/matrix/stats` - Get community statistics
- `GET /api/admin/users` - Admin: get all users
- `POST /api/admin/promote-user/{user_id}` - Admin: promote to admin
- `PUT /api/settings/hero-image` - Admin: update hero image

## Implementation Status
**MVP COMPLETE** ✅ (as of February 2026)

All requested features have been implemented and tested:
- Full authentication flow with secure password reset
- All four content sections populated with data
- Comprehensive admin dashboard
- Dark theme with animations
- Footer on all pages
- Email notifications when user resources are approved

## Test Credentials
- **Admin Email:** atreyaghoshal.68@gmail.com
- **Admin Password:** 4tr3y4@54N14

## Third-Party Integrations
- **SendGrid:** Password reset emails & resource approval notifications (API key configured)

## Files of Reference
- `/app/backend/server.py` - Main API server
- `/app/frontend/src/pages/AdminDashboard.jsx` - Admin panel
- `/app/frontend/src/App.js` - Frontend routes
- `/app/backend/.env` - Environment configuration

## Known Technical Notes
- `AdminDashboard.jsx` is a large monolithic file - consider refactoring into smaller components for future maintenance
