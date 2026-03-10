# Mentis Android App - Build Guide

## Overview
This guide explains how to build the Mentis Android app for testing and Play Store release.

## Prerequisites
- **Android Studio** (Arctic Fox or later recommended)
- **Java JDK 11+**
- **Node.js 18+** and **Yarn**

---

## Quick Start (Debug APK for Testing)

### Step 1: Build the Web App
```bash
cd /app/frontend
yarn build
```

### Step 2: Sync with Capacitor
```bash
npx cap sync android
```

### Step 3: Open in Android Studio
```bash
npx cap open android
```

### Step 4: Build Debug APK
In Android Studio:
1. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete
3. Click **"locate"** in the notification to find the APK
4. The debug APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 5: Install on Device
- Transfer the APK to your Android device
- Enable "Install from unknown sources" in Settings
- Open the APK file to install

---

## Play Store Release Build

### Step 1: Create a Signing Key (One-time setup)
```bash
keytool -genkey -v -keystore mentis-release-key.keystore -alias mentis -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Keystore password (save this!)
- Key password (save this!)
- Your name, organization, etc.

**⚠️ IMPORTANT: Back up your keystore file and passwords. You'll need them for every update!**

### Step 2: Create keystore.properties
Create a file at `android/keystore.properties`:
```properties
storeFile=../mentis-release-key.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=mentis
keyPassword=YOUR_KEY_PASSWORD
```

**⚠️ DO NOT commit this file to git!**

### Step 3: Build Release Bundle (AAB for Play Store)
```bash
cd android
./gradlew bundleRelease \
  -PMENTIS_STORE_FILE=../mentis-release-key.keystore \
  -PMENTIS_STORE_PASSWORD=YOUR_PASSWORD \
  -PMENTIS_KEY_ALIAS=mentis \
  -PMENTIS_KEY_PASSWORD=YOUR_PASSWORD
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Build Release APK (for direct distribution)
```bash
./gradlew assembleRelease \
  -PMENTIS_STORE_FILE=../mentis-release-key.keystore \
  -PMENTIS_STORE_PASSWORD=YOUR_PASSWORD \
  -PMENTIS_KEY_ALIAS=mentis \
  -PMENTIS_KEY_PASSWORD=YOUR_PASSWORD
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## App Icons Setup

Replace the default icons with your custom Mentis icons.

### Required Icon Sizes
| Directory | Size | Purpose |
|-----------|------|---------|
| `mipmap-mdpi` | 48x48 | Medium density |
| `mipmap-hdpi` | 72x72 | High density |
| `mipmap-xhdpi` | 96x96 | Extra high |
| `mipmap-xxhdpi` | 144x144 | Extra extra high |
| `mipmap-xxxhdpi` | 192x192 | Extra extra extra high |

### Icon Files to Replace
Located in `android/app/src/main/res/`:
- `mipmap-*/ic_launcher.png` - Standard icon
- `mipmap-*/ic_launcher_round.png` - Round icon (Android 7.1+)
- `mipmap-*/ic_launcher_foreground.png` - Adaptive icon foreground

### Easy Icon Generation
Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html) to generate all sizes from a single image.

---

## Splash Screen Setup

### Replace Splash Image
Replace the file at:
`android/app/src/main/res/drawable/splash.png`

Recommended size: 1920x1920 (will be cropped/scaled)

### Splash Screen Colors
Edit `android/app/src/main/res/values/styles.xml`:
```xml
<item name="android:background">@color/splash_background</item>
```

Edit `android/app/src/main/res/values/colors.xml`:
```xml
<color name="splash_background">#0f172a</color>
```

---

## Version Management

### Before Each Release
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2          // Increment this for each release
    versionName "1.1.0"    // User-visible version
}
```

**Version Code Rules:**
- Must be an integer
- Must increase with each Play Store upload
- Can never decrease

---

## Play Store Submission Checklist

### Required Assets
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (min 2, recommended 8)
  - Phone: 1080x1920 or similar
  - Tablet: 1200x1920 (optional but recommended)
- [ ] Short description (80 chars max)
- [ ] Full description (4000 chars max)
- [ ] Privacy policy URL

### App Content Rating
Complete the content rating questionnaire in Play Console.

### Target Audience
Specify your target age group (likely "Everyone" or "Teen" for educational content).

---

## Troubleshooting

### Build Fails with "SDK not found"
```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Gradle Sync Failed
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### App Crashes on Launch
1. Check `capacitor.config.json` has correct `webDir: "build"`
2. Ensure web build completed: `yarn build`
3. Sync again: `npx cap sync android`

### White Screen on App Open
1. Verify the backend URL is accessible from the device
2. Check network permissions in AndroidManifest.xml
3. Try on WiFi instead of mobile data

---

## Useful Commands

```bash
# Build web app
yarn build

# Sync to Android
npx cap sync android

# Open Android Studio
npx cap open android

# Run on connected device
npx cap run android

# Build debug APK from command line
cd android && ./gradlew assembleDebug

# Clean build
cd android && ./gradlew clean
```

---

## App Details

| Property | Value |
|----------|-------|
| Package Name | `com.mentismathematicsfoundation.app` |
| App Name | Mentis |
| Min SDK | 22 (Android 5.1) |
| Target SDK | 34 (Android 14) |

---

## Support
For issues specific to this build, contact the development team.
For Capacitor issues, see: https://capacitorjs.com/docs/android
