# Mentis - Google Play Store Publishing Guide

This guide will help you publish Mentis to the Google Play Store using PWABuilder.

---

## Part 1: Create a Google Play Developer Account

### Step 1: Go to Google Play Console
1. Visit: https://play.google.com/console/signup
2. Sign in with your Google account (use one you want associated with Mentis)

### Step 2: Accept Developer Agreement
1. Read and accept the Google Play Developer Distribution Agreement
2. This is a legal agreement - read carefully

### Step 3: Pay Registration Fee
1. One-time fee: **$25 USD**
2. Payment methods: Credit/Debit card
3. This is non-refundable

### Step 4: Complete Account Details
Fill in your developer profile:
- **Developer name**: `Mentis Mathematics Foundation` (this appears on Play Store)
- **Email address**: `mentis.mathematics@gmail.com` (for customer support)
- **Phone number**: Your contact number
- **Website**: `https://mentismathematicsfoundation.com`

### Step 5: Identity Verification (Required since 2023)
Google requires identity verification for new accounts:
1. **For Individual accounts**: 
   - Government-issued ID
   - Takes 1-3 business days

2. **For Organization accounts**: 
   - D-U-N-S number (free to obtain)
   - Business documentation
   - Takes longer (5-10 days)

**Recommendation**: Start as Individual, you can change to Organization later.

---

## Part 2: Prepare Your App Assets

Before using PWABuilder, you need these assets ready:

### Required Assets Checklist

| Asset | Specification | Status |
|-------|---------------|--------|
| App Icon | 512x512 PNG | ✅ Ready (`/icons/icon-512x512.png`) |
| Feature Graphic | 1024x500 PNG/JPG | ❌ Need to create |
| Screenshots (Phone) | Min 2, 16:9 or 9:16 | ❌ Need to create |
| Screenshots (Tablet) | Optional but recommended | ❌ Optional |
| Short Description | Max 80 characters | ✅ See below |
| Full Description | Max 4000 characters | ✅ See below |
| Privacy Policy URL | Required | ❌ Need to create |

### App Store Texts (Ready to Use)

**Short Description (80 chars max):**
```
Mathematics community platform. Learn, share, and connect with math enthusiasts.
```

**Full Description:**
```
Mentis is the premier platform for mathematics enthusiasts. Whether you're a student, teacher, or math lover, Mentis provides a space to learn, share, and grow with a community that speaks your language.

FEATURES:

📚 Resource Hub
• Access curated mathematical resources, notes, and tutorials
• Upload and share your own learning materials
• Search and filter by topic

🎮 Funamatics
• Educational math games to make learning fun
• Various difficulty levels for all ages

🧠 Curiofacts
• Discover fascinating mathematical facts weekly
• Submit your own interesting math discoveries

🎬 VEX (Video Education Exchange)
• Watch short educational math videos
• Share your own teaching content

👥 Mathmate
• Connect with fellow math enthusiasts
• Real-time chat with your connections
• Build your mathematics network

📊 Matrix
• Join the growing mathematics community
• See community statistics and growth

🏆 Mentis Score
• Earn points by contributing content
• Build your reputation in the community

WHY MENTIS?
• 100% free to use
• Safe and moderated community
• Mobile-friendly design
• Regular content updates
• Built by math lovers, for math lovers

Join Mentis today and be part of a world where minds meet mathematics!

Contact: mentis.mathematics@gmail.com
Website: https://mentismathematicsfoundation.com
```

---

## Part 3: Create Privacy Policy

Google Play requires a privacy policy. Create one at your website.

### Option A: Use a Generator
1. Visit: https://www.freeprivacypolicy.com/free-privacy-policy-generator/
2. Fill in your app details
3. Host the generated policy on your website

### Option B: Use This Template
Host this at `https://mentismathematicsfoundation.com/privacy-policy`:

```
Privacy Policy for Mentis

Last updated: [DATE]

Mentis Mathematics Foundation ("we", "our", or "us") operates the Mentis mobile application.

INFORMATION WE COLLECT:
- Account information (name, email) when you register
- Content you create (resources, comments, messages)
- Usage data to improve our services

HOW WE USE YOUR INFORMATION:
- To provide and maintain our service
- To notify you about changes
- To provide customer support
- To detect and prevent fraud

DATA SECURITY:
We implement appropriate security measures to protect your personal information.

CONTACT US:
If you have questions about this Privacy Policy, contact us at:
Email: mentis.mathematics@gmail.com

```

---

## Part 4: Generate Android App with PWABuilder

### Step 1: Visit PWABuilder
1. Go to: https://www.pwabuilder.com/
2. Click "Start" or "Build My PWA"

### Step 2: Enter Your Website URL
1. Enter: `https://mentismathematicsfoundation.com`
2. Click "Start"
3. PWABuilder will analyze your PWA

### Step 3: Review PWA Score
PWABuilder will show your PWA readiness score. Your app should score well because:
- ✅ Manifest.json is configured
- ✅ Service Worker is registered
- ✅ Icons are provided
- ✅ HTTPS is enabled

### Step 4: Package for Android
1. Click "Package For Stores"
2. Select "Android" (Google Play)
3. Choose **"Google Play"** option (not Samsung or other stores)

### Step 5: Configure Android Options
Fill in the following:

| Field | Value |
|-------|-------|
| Package ID | `com.mentismathematicsfoundation.app` |
| App Name | `Mentis` |
| App Short Name | `Mentis` |
| App Version | `1.0.0` |
| App Version Code | `1` |
| Display Mode | `Standalone` |
| Status Bar Color | `#0f172a` |
| Navigation Bar Color | `#0f172a` |
| Theme Color | `#0f172a` |
| Background Color | `#0f172a` |
| Icon URL | (will auto-detect from manifest) |
| Signing Key | Choose "Let PWABuilder create a signing key" |

### Step 6: Download Package
1. Click "Generate"
2. Download the ZIP file
3. Extract it - you'll find:
   - `app-release.aab` (Android App Bundle for Play Store)
   - `signing-key-info.txt` (KEEP THIS SAFE - needed for updates!)

**⚠️ IMPORTANT**: Save `signing-key-info.txt` securely! You need this to update your app in the future.

---

## Part 5: Upload to Google Play Console

### Step 1: Create New App
1. Go to: https://play.google.com/console/
2. Click "Create app"
3. Fill in:
   - **App name**: Mentis
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept the declarations
5. Click "Create app"

### Step 2: Complete Store Listing
Navigate to "Main store listing" and fill in:

1. **App name**: Mentis
2. **Short description**: (use text from Part 2)
3. **Full description**: (use text from Part 2)
4. **App icon**: Upload 512x512 icon
5. **Feature graphic**: Upload 1024x500 image
6. **Screenshots**: Upload at least 2 phone screenshots

### Step 3: App Content
Navigate to "App content" and complete:

1. **Privacy policy**: Enter your privacy policy URL
2. **App access**: Select "All functionality is available without special access"
3. **Ads**: Select "No, my app does not contain ads"
4. **Content rating**: Complete the questionnaire (select "Education")
5. **Target audience**: Select appropriate age group (likely "18+")
6. **News apps**: Select "No"

### Step 4: Upload AAB File
1. Go to "Production" → "Releases"
2. Click "Create new release"
3. Upload your `app-release.aab` file
4. Add release notes: "Initial release of Mentis - Mathematics Community Platform"
5. Click "Save" then "Review release"

### Step 5: Review and Submit
1. Review all the information
2. Fix any errors (shown in red)
3. Complete any warnings (yellow) if possible
4. Click "Start rollout to Production"

---

## Part 6: After Submission

### Review Timeline
- **Typical review time**: 1-3 days
- **First app review**: May take up to 7 days
- You'll receive email notification when approved/rejected

### If Rejected
Common reasons and fixes:
1. **Privacy Policy issues**: Make sure URL works and policy is complete
2. **Content issues**: Ensure all content is appropriate
3. **Metadata issues**: Fix any spelling/formatting problems

### After Approval
Your app will be live at:
```
https://play.google.com/store/apps/details?id=com.mentismathematicsfoundation.app
```

---

## Part 7: Creating Required Graphics

### Feature Graphic (1024x500)
You need to create this. Options:

**Option A: Use Canva (Free)**
1. Go to https://www.canva.com/
2. Create custom size: 1024x500
3. Use Mentis branding colors:
   - Background: #0f172a (dark blue)
   - Accent: #f97316 (orange) to #ec4899 (pink) gradient
4. Add text: "Mentis - Where Minds Meet Mathematics"
5. Add mathematical symbols/graphics
6. Export as PNG

**Option B: I can generate one for you**
Just ask and I'll create a feature graphic using AI image generation.

### Screenshots
1. Open Mentis on your phone
2. Take screenshots of key pages:
   - Landing page
   - Resource Hub
   - Mathmate chat
   - Dashboard
3. Recommended: Use a phone mockup frame

---

## Quick Checklist

### Before PWABuilder:
- [ ] Privacy Policy URL created and accessible
- [ ] Feature Graphic (1024x500) ready
- [ ] At least 2 phone screenshots ready

### Before Play Store Upload:
- [ ] Google Play Developer account created ($25 paid)
- [ ] Identity verification completed
- [ ] AAB file downloaded from PWABuilder
- [ ] Signing key info saved securely

### During Play Store Setup:
- [ ] Store listing completed
- [ ] App content questionnaire completed
- [ ] Privacy policy URL added
- [ ] AAB file uploaded
- [ ] Release submitted for review

---

## Need Help?

If you get stuck at any step, let me know and I can provide more detailed guidance!

**Resources:**
- PWABuilder Documentation: https://docs.pwabuilder.com/
- Google Play Console Help: https://support.google.com/googleplay/android-developer/
- Play Store Policy Center: https://play.google.com/about/developer-content-policy/

