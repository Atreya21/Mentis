# Mentis Deployment Configuration Guide

## Important Environment Variables for Production

When deploying to your production domain (`mentismathematicsfoundation.com`), you need to update these environment variables:

### Backend Environment Variables

```env
# Required - Set this to your production domain
FRONTEND_URL="https://mentismathematicsfoundation.com"

# MongoDB connection (update for production database)
MONGO_URL="your-production-mongodb-url"
DB_NAME="mentis_production"

# JWT Secret (change this to a secure random string in production!)
JWT_SECRET="your-super-secure-random-string-here"

# SendGrid for emails
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="mentis.mathematics@gmail.com"

# CORS settings (optional, can be more restrictive in production)
CORS_ORIGINS="https://mentismathematicsfoundation.com"
```

### Frontend Environment Variables

```env
# Set this to your backend API URL
REACT_APP_BACKEND_URL="https://api.mentismathematicsfoundation.com"
# OR if backend is on same domain:
REACT_APP_BACKEND_URL="https://mentismathematicsfoundation.com"
```

## Password Reset Email Configuration

The password reset link is generated using `FRONTEND_URL`:

```
{FRONTEND_URL}/reset-password?token={token}
```

So if `FRONTEND_URL="https://mentismathematicsfoundation.com"`, the reset link will be:
```
https://mentismathematicsfoundation.com/reset-password?token=xyz123...
```

## Deployment Checklist

1. [ ] Update `FRONTEND_URL` in backend environment
2. [ ] Update `MONGO_URL` for production database
3. [ ] Generate new `JWT_SECRET` (use a secure random string)
4. [ ] Verify `SENDGRID_API_KEY` is set
5. [ ] Update `REACT_APP_BACKEND_URL` in frontend environment
6. [ ] Test forgot password flow after deployment
7. [ ] Test login/signup flow
8. [ ] Test all API endpoints

## Common Issues

### Reset Password Link Goes to Wrong Domain
- **Cause**: `FRONTEND_URL` environment variable not set correctly
- **Fix**: Update `FRONTEND_URL` to your production domain

### CORS Errors
- **Cause**: Backend not allowing requests from frontend domain
- **Fix**: Update `CORS_ORIGINS` to include your production domain

### API Calls Failing
- **Cause**: `REACT_APP_BACKEND_URL` not set correctly
- **Fix**: Update to point to your production backend URL

## Testing After Deployment

1. Go to `/forgot-password`
2. Enter an email address
3. Check the email for the reset link
4. Verify the link points to your domain
5. Click the link and reset the password
6. Login with the new password
