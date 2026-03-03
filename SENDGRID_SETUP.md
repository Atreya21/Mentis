# SendGrid Integration - Step-by-Step Guide

## Complete Setup in 10 Minutes

Follow these exact steps to integrate SendGrid email for password reset functionality.

---

## Step 1: Create SendGrid Account (2 minutes)

1. **Go to SendGrid website:**
   - Open: https://sendgrid.com/pricing/
   - Click the blue **"Start for Free"** button

2. **Fill registration form:**
   - Email: mentis.mathematics@gmail.com (or your email)
   - Password: Create a strong password
   - Click **"Create Account"**

3. **Verify your email:**
   - Check inbox of mentis.mathematics@gmail.com
   - Click the verification link in the email
   - You'll be redirected to SendGrid dashboard

4. **Complete onboarding:**
   - Select **"I want to send Transactional Email"**
   - Skip other questions or fill as needed
   - Click **"Get Started"**

---

## Step 2: Get Your API Key (2 minutes)

1. **Navigate to API Keys:**
   - In SendGrid dashboard, click **Settings** in left sidebar
   - Click **API Keys**

2. **Create new API key:**
   - Click blue **"Create API Key"** button (top right)
   
3. **Configure the key:**
   - **API Key Name**: Enter `Mentis-Password-Reset`
   - **API Key Permissions**: Select **"Full Access"**
     (Or select "Restricted Access" → Check "Mail Send" → Choose "Full Access" for Mail Send)
   - Click **"Create & View"**

4. **IMPORTANT - Copy the key:**
   - You'll see a long key starting with `SG.`
   - **Copy it immediately!** 
   - Store it safely (you won't see it again)
   - Example format: `SG.abcd1234efgh5678ijkl...`

---

## Step 3: Verify Sender Email (3 minutes)

**This step is CRITICAL - emails won't send without it!**

### Option A: Single Sender Verification (Easiest)

1. **Go to Sender Authentication:**
   - Click **Settings** → **Sender Authentication**
   - Under "Single Sender Verification", click **"Get Started"** or **"Verify a Single Sender"**

2. **Fill the form:**
   ```
   From Name: Mentis
   From Email Address: mentis.mathematics@gmail.com
   Reply To: mentis.mathematics@gmail.com
   Company Address: [Your address]
   City: [Your city]
   State/Province: [Your state]
   Zip Code: [Your zip]
   Country: [Your country]
   ```

3. **Create the sender:**
   - Click **"Create"** button

4. **Verify the email:**
   - Check inbox of mentis.mathematics@gmail.com
   - You'll receive email: "Please Verify Your Sender Email Address"
   - Click the **"Verify Single Sender"** button
   - You'll see "Email address verified!" confirmation

5. **Confirm in dashboard:**
   - Go back to SendGrid → Settings → Sender Authentication
   - You should see your email with a green **"Verified"** badge

---

## Step 4: Add API Key to Mentis (2 minutes)

### If you have terminal/SSH access:

1. **Connect to your server:**
   ```bash
   # Connect via SSH or open terminal in Emergent environment
   ```

2. **Edit the .env file:**
   ```bash
   nano /app/backend/.env
   ```

3. **Update these three lines:**
   Find these lines and update them:
   ```
   SENDGRID_API_KEY="SG.paste-your-actual-api-key-here"
   FROM_EMAIL="mentis.mathematics@gmail.com"
   FRONTEND_URL="https://math-collab-space.preview.emergentagent.com"
   ```

4. **Save and exit:**
   - Press `Ctrl + X`
   - Press `Y` to confirm
   - Press `Enter`

### Alternative: Using file editor in Emergent:

Ask me to update the .env file with:
```
SENDGRID_API_KEY="your-key-here"
FROM_EMAIL="mentis.mathematics@gmail.com"
```

---

## Step 5: Restart Backend (1 minute)

**Run this command:**
```bash
sudo supervisorctl restart backend
```

**Expected output:**
```
backend: stopped
backend: started
```

**Check if backend is running:**
```bash
sudo supervisorctl status backend
```

You should see: `backend RUNNING`

---

## Step 6: Test Email Sending (2 minutes)

### Test 1: Quick API Test

```bash
cd /app/backend
python3 << 'EOF'
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from dotenv import load_dotenv

load_dotenv('.env')

print("Testing SendGrid configuration...")
print(f"FROM_EMAIL: {os.environ.get('FROM_EMAIL')}")
print(f"API Key exists: {'Yes' if os.environ.get('SENDGRID_API_KEY') else 'No'}")

message = Mail(
    from_email=os.environ['FROM_EMAIL'],
    to_emails='mentis.mathematics@gmail.com',  # Send to yourself
    subject='Mentis Email Integration Test',
    html_content='<h1 style="color: #f97316;">Success!</h1><p>Your SendGrid integration is working perfectly!</p>'
)

try:
    sg = SendGridAPIClient(os.environ['SENDGRID_API_KEY'])
    response = sg.send(message)
    print(f"✓ Test email sent successfully! Status: {response.status_code}")
    print("Check your inbox at mentis.mathematics@gmail.com")
except Exception as e:
    print(f"✗ Error: {str(e)}")
EOF
```

### Test 2: Password Reset Test

1. **Go to your website:**
   - Open: https://math-collab-space.preview.emergentagent.com/forgot-password

2. **Request password reset:**
   - Enter: mentis.mathematics@gmail.com
   - Click "Get Reset Link"
   - You should see "Check Your Email" message

3. **Check your email:**
   - Go to mentis.mathematics@gmail.com inbox
   - Look for email from "Mentis" with subject "Reset Your Mentis Password"
   - Check spam folder if not in inbox
   - Email should arrive within 1-2 minutes

4. **Test the reset link:**
   - Click "Reset Password" button in email
   - Or copy the link and paste in browser
   - Set a new password
   - Verify you can login with new password

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Solution:**
```bash
# Verify API key format
cd /app/backend
python3 << 'EOF'
import os
from dotenv import load_dotenv
load_dotenv('.env')
key = os.environ.get('SENDGRID_API_KEY')
print(f"Key starts with 'SG.': {key.startswith('SG.') if key else 'No key found'}")
print(f"Key length: {len(key) if key else 0}")
EOF
```

If key doesn't start with `SG.` or is wrong:
1. Go to SendGrid → Settings → API Keys
2. Delete old key
3. Create new key
4. Update .env file
5. Restart backend

---

### Issue: Email Not Received

**Check 1: Sender verified?**
- SendGrid → Settings → Sender Authentication
- Should show green "Verified" badge

**Check 2: Check spam folder**
- First emails often go to spam
- Mark as "Not Spam" to train email provider

**Check 3: Check backend logs**
```bash
tail -n 50 /var/log/supervisor/backend.err.log
```

Look for:
- ✅ "Password reset email sent to..."
- ❌ "Failed to send password reset email"

**Check 4: SendGrid activity**
- SendGrid → Activity
- See if email was sent
- Check delivery status

---

### Issue: "From email not verified"

**Solution:**
1. SendGrid → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Check email for verification link
4. Click the verification link
5. Wait 2-3 minutes
6. Try sending again

---

### Issue: Backend not restarting

```bash
# Check backend status
sudo supervisorctl status backend

# If stopped, start it
sudo supervisorctl start backend

# View real-time logs
tail -f /var/log/supervisor/backend.err.log
```

---

## Verification Checklist

Before going live, verify:

- [ ] SendGrid account created and verified
- [ ] API key created with Mail Send permission
- [ ] Sender email verified (green badge in SendGrid)
- [ ] API key added to .env file
- [ ] FROM_EMAIL matches verified email
- [ ] Backend restarted successfully
- [ ] Test email received in inbox
- [ ] Password reset email received
- [ ] Reset link works and password can be changed
- [ ] Can login with new password

---

## SendGrid Dashboard Overview

### Key Sections:

1. **Dashboard (Home)**
   - Overview of email activity
   - Sent, delivered, opened stats

2. **Activity**
   - See all sent emails
   - Check delivery status
   - Debug failed sends

3. **Settings → API Keys**
   - Manage API keys
   - Create/delete keys

4. **Settings → Sender Authentication**
   - Verify sender emails
   - Domain authentication (advanced)

---

## Free Tier Limits

**SendGrid Free Plan:**
- ✅ 100 emails per day (forever free)
- ✅ All email features
- ✅ 7-day activity logs
- ✅ Email API access

**What happens at 100 emails/day?**
- Additional emails queued for next day
- Or upgrade to paid plan ($15/mo for 40,000 emails)

**For Mentis:**
- 100 emails/day = ~3,000 password resets/month
- More than enough for starting out!

---

## Production Best Practices

1. **Domain Authentication** (Optional but recommended)
   - Better email deliverability
   - Professional sender reputation
   - Setup: SendGrid → Settings → Sender Authentication → Authenticate Your Domain
   - Requires adding DNS records to your domain

2. **Monitor Delivery**
   - Check SendGrid Activity weekly
   - Watch for bounces or spam reports
   - Keep email reputation high

3. **Email Template Updates**
   - Customize in `/app/backend/server.py`
   - Search for `html_content` in `forgot_password` function
   - Test after changes

4. **Backup Plan**
   - Keep Gmail SMTP as backup
   - Have admin dashboard manual sharing ready
   - Monitor for API issues

---

## Cost Estimates

| Usage | SendGrid Plan | Cost |
|-------|---------------|------|
| 0-100 emails/day | Free | $0 |
| 100-1,333 emails/day | Essentials | $15/mo |
| Up to 3,333 emails/day | Pro | $60/mo |

For most startups: **Free tier is sufficient!**

---

## Support Resources

- **SendGrid Docs:** https://docs.sendgrid.com/
- **SendGrid Support:** https://support.sendgrid.com/
- **API Reference:** https://docs.sendgrid.com/api-reference/

---

## Quick Commands Reference

```bash
# Edit .env file
nano /app/backend/.env

# Restart backend
sudo supervisorctl restart backend

# Check backend status
sudo supervisorctl status backend

# View logs
tail -f /var/log/supervisor/backend.err.log

# Test SendGrid from Python
cd /app/backend && python3 test_sendgrid.py
```

---

## You're Done! 🎉

Your password reset emails will now be sent securely through SendGrid!

**Next steps:**
1. Test with a real user account
2. Ask team members to test
3. Monitor SendGrid dashboard for first few days
4. Go live with confidence!

**Questions?** Check troubleshooting section or email mentis.mathematics@gmail.com
