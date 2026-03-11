# Email Integration Setup Guide for Mentis

## Overview
This guide will help you set up email integration for password reset functionality. Without email setup, admins can manually share reset links from the admin dashboard.

---

## Option 1: SendGrid (Recommended - Free Tier Available)

### Why SendGrid?
- ✅ Free tier: 100 emails/day forever
- ✅ Easy setup with API key
- ✅ Reliable delivery
- ✅ Good documentation
- ✅ Already integrated in code

### Step-by-Step Setup:

#### 1. Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com/pricing/)
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address

#### 2. Get API Key
1. Login to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Mentis Password Reset`
5. Select **Full Access** (or Mail Send permission)
6. Click **Create & View**
7. **COPY THE KEY IMMEDIATELY** (you won't see it again!)

#### 3. Verify Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Choose **Single Sender Verification** (easiest for getting started)
3. Fill in the form:
   - **From Name**: Mentis
   - **From Email**: your-email@yourdomain.com (or use your Gmail)
   - **Reply To**: same as above
   - **Company Address**: Your details
4. Click **Create**
5. Check your email and verify the sender

**Alternative: Domain Authentication (Professional)**
- If you own a domain (e.g., mentis.com)
- Go to **Authenticate Your Domain**
- Follow DNS setup instructions
- This improves email deliverability

#### 4. Add API Key to Mentis
1. Login to your server or environment
2. Edit `/app/backend/.env` file:
   ```bash
   nano /app/backend/.env
   ```
3. Update these lines:
   ```
   SENDGRID_API_KEY="SG.your-actual-api-key-here"
   FROM_EMAIL="your-verified-email@domain.com"
   FRONTEND_URL="https://mathmate-preview.preview.emergentagent.com"
   ```
4. Save and exit (Ctrl+X, then Y, then Enter)

#### 5. Restart Backend
```bash
sudo supervisorctl restart backend
```

#### 6. Test It!
1. Go to your Mentis website
2. Click "Forgot your password?"
3. Enter a real email address
4. Check your inbox (and spam folder)
5. You should receive a professional password reset email!

---

## Option 2: Gmail SMTP (Quick & Free)

### Setup Gmail SMTP:

#### 1. Enable App Password in Gmail
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter: `Mentis`
7. Click **Generate**
8. Copy the 16-character password

#### 2. Install SMTP Library
```bash
cd /app/backend
pip install aiosmtplib
pip freeze > requirements.txt
```

#### 3. Update Backend Code
Edit `/app/backend/server.py`, replace the SendGrid email section with:

```python
# In the forgot_password endpoint, replace the email sending section with:

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ... existing code ...

# Send email with reset link
reset_link = f"{os.environ.get('FRONTEND_URL')}/reset-password?token={reset_token}"

try:
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER')  # Your Gmail
    smtp_password = os.environ.get('SMTP_PASSWORD')  # App password
    from_email = os.environ.get('FROM_EMAIL', smtp_user)
    
    if smtp_user and smtp_password:
        message = MIMEMultipart('alternative')
        message['Subject'] = 'Reset Your Mentis Password'
        message['From'] = from_email
        message['To'] = request.email
        
        html_content = f'''
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f97316;">Reset Your Password</h2>
            <p>Hi there,</p>
            <p>You recently requested to reset your password for your Mentis account.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Reset Password</a>
            </div>
            <p>Or copy this link: {reset_link}</p>
            <p><strong>This link expires in 1 hour.</strong></p>
            <p>If you didn't request this, ignore this email.</p>
        </div>
        '''
        
        message.attach(MIMEText(html_content, 'html'))
        
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            start_tls=True,
            username=smtp_user,
            password=smtp_password
        )
        
        logger.info(f"Password reset email sent via SMTP to {request.email}")
    else:
        logger.warning(f"SMTP not configured. Reset link: {reset_link}")
        
except Exception as e:
    logger.error(f"Failed to send email: {str(e)}")
```

#### 4. Update .env File
```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASSWORD="your-16-char-app-password"
FROM_EMAIL="your-gmail@gmail.com"
FRONTEND_URL="https://mathmate-preview.preview.emergentagent.com"
```

#### 5. Restart Backend
```bash
sudo supervisorctl restart backend
```

---

## Option 3: Custom Domain Email (Professional)

If you have your own domain with email hosting:

### For Custom SMTP (like Namecheap, GoDaddy, etc.):

1. Get SMTP credentials from your email provider
2. Update .env:
   ```
   SMTP_HOST="mail.yourdomain.com"
   SMTP_PORT="587"
   SMTP_USER="noreply@yourdomain.com"
   SMTP_PASSWORD="your-email-password"
   FROM_EMAIL="noreply@yourdomain.com"
   ```

3. Use the Gmail SMTP code above (it works for any SMTP)

---

## Testing Email Delivery

### Test SendGrid Integration:
```bash
cd /app/backend
python3 << 'EOF'
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from dotenv import load_dotenv

load_dotenv('.env')

message = Mail(
    from_email=os.environ['FROM_EMAIL'],
    to_emails='your-email@example.com',  # Your test email
    subject='Mentis Email Test',
    html_content='<h1>Success!</h1><p>Email integration is working!</p>'
)

sg = SendGridAPIClient(os.environ['SENDGRID_API_KEY'])
response = sg.send(message)

print(f"Test email sent! Status: {response.status_code}")
EOF
```

### Check Backend Logs:
```bash
tail -f /var/log/supervisor/backend.err.log
```

Look for messages like:
- ✅ "Password reset email sent to..."
- ⚠️ "SendGrid not configured..." (if not set up)
- ❌ "Failed to send password reset email..." (if error)

---

## Without Email Setup (Development Mode)

If you don't set up email integration, the system still works:

1. User requests password reset
2. Admin checks **Admin Dashboard → Site Settings** tab
3. Admin sees pending reset requests with links
4. Admin manually shares the reset link via WhatsApp/SMS/other method

**This works but is not recommended for production!**

---

## Troubleshooting

### SendGrid Issues:

**"Unauthorized" Error**
- Check API key is correct
- Ensure API key has Mail Send permission
- Regenerate API key if needed

**"From email not verified"**
- Go to Settings → Sender Authentication
- Verify your sender email
- Wait a few minutes after verification

**Emails go to spam**
- Use domain authentication instead of single sender
- Ask recipients to mark as "Not Spam"
- Build sending reputation gradually

### Gmail Issues:

**"Authentication failed"**
- Ensure 2-Step Verification is enabled
- Use App Password, not regular password
- App password should be 16 characters without spaces

**"Sending limit exceeded"**
- Gmail free accounts: ~500 emails/day
- Wait 24 hours or upgrade to Google Workspace

### General Issues:

**No emails received**
- Check spam/junk folder
- Verify email address is correct
- Check backend logs for errors
- Test with different email providers

**Link expired**
- Links expire in 1 hour
- Request a new reset link
- User must act quickly

---

## Production Recommendations

1. **Use SendGrid** with domain authentication
2. Set up **SPF, DKIM, DMARC** records for your domain
3. Monitor email delivery rates in SendGrid dashboard
4. Keep backup email provider ready
5. Set up email alerts for failed sends
6. Regularly check admin dashboard for pending resets

---

## Email Template Customization

To customize the password reset email:

1. Edit `/app/backend/server.py`
2. Find the `html_content` section in `forgot_password` endpoint
3. Modify HTML/CSS as needed
4. Test with your email address
5. Restart backend

---

## Cost Comparison

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| SendGrid | 100 emails/day | $15/mo for 40K emails |
| Gmail SMTP | ~500/day | Google Workspace $6/user/mo |
| AWS SES | 62K emails/mo* | $0.10 per 1K emails |
| Mailgun | 5K emails/mo (3 months) | $35/mo for 50K |

*First 12 months if using EC2

---

## Need Help?

- SendGrid Support: [support.sendgrid.com](https://support.sendgrid.com)
- Check logs: `tail -f /var/log/supervisor/backend.err.log`
- Test with curl:
  ```bash
  curl -X POST http://localhost:8001/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  ```

---

## Quick Start Summary

**Fastest Setup (5 minutes):**
1. Create free SendGrid account
2. Get API key
3. Verify sender email
4. Add to `.env` file
5. Restart backend
6. Test!

**Your password reset emails will now be sent automatically and securely!**
