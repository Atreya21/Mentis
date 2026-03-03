# Mentis Android App Build Guide

## Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - During installation, make sure to install:
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (for testing)

2. **Install Java Development Kit (JDK 17+)**
   - Download from: https://adoptium.net/

## Project Structure

```
frontend/
├── android/                 # Android native project
│   ├── app/
│   │   └── src/main/
│   │       ├── assets/public/    # Built web app
│   │       └── res/              # Android resources
│   └── gradle/
├── capacitor.config.ts      # Capacitor configuration
└── build/                   # React build output
```

## Building the APK

### Option 1: Using Android Studio (Recommended)

1. **Open the Project**
   ```bash
   cd frontend
   npx cap open android
   ```
   This opens the `android` folder in Android Studio.

2. **Wait for Gradle Sync**
   - Android Studio will automatically sync Gradle dependencies
   - Wait for the "Gradle sync finished" message

3. **Build Debug APK**
   - Go to: `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Build Release APK (for distribution)**
   - Go to: `Build` → `Generate Signed Bundle / APK`
   - Select `APK`
   - Create a new keystore or use existing one
   - Follow the wizard to generate a signed APK

### Option 2: Using Command Line

1. **Build Debug APK**
   ```bash
   cd frontend/android
   ./gradlew assembleDebug
   ```
   Output: `app/build/outputs/apk/debug/app-debug.apk`

2. **Build Release APK**
   ```bash
   cd frontend/android
   ./gradlew assembleRelease
   ```
   Note: Requires signing configuration in `app/build.gradle`

## Updating the App

After making changes to the React web app:

```bash
cd frontend

# Build the React app
yarn build

# Copy to Android project
npx cap copy android

# Or sync (copy + update plugins)
npx cap sync android
```

## Testing on Device

### Using USB Debugging

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect device via USB
4. In Android Studio: Click `Run` → `Run 'app'`

### Using Emulator

1. In Android Studio: `Tools` → `Device Manager`
2. Create a new virtual device
3. Click `Run` → `Run 'app'`

## App Configuration

### App Details
- **App Name**: Mentis
- **Package ID**: com.mentismathematicsfoundation.app
- **Min SDK**: 22 (Android 5.1)
- **Target SDK**: 34 (Android 14)

### Theme Colors
- **Primary**: #0f172a (Dark slate)
- **Accent**: #f97316 (Orange)

### Capacitor Plugins Included
- `@capacitor/status-bar` - Control status bar appearance
- `@capacitor/splash-screen` - Splash screen management
- `@capacitor/keyboard` - Keyboard handling

## Troubleshooting

### Build Fails with SDK Error
Make sure Android SDK is properly installed:
- Open Android Studio → Settings → Appearance & Behavior → System Settings → Android SDK
- Install required SDK platforms and tools

### App Shows Blank Screen
1. Check if `build` folder exists in `frontend/`
2. Run `yarn build` and `npx cap sync android`

### Network Requests Fail
The app is configured to use HTTPS. For local development, update `capacitor.config.ts`:
```ts
server: {
  url: 'http://YOUR_LOCAL_IP:3000',
  cleartext: true
}
```

## Publishing to Google Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Generate a signed release APK or AAB (Android App Bundle)
3. Create a new app listing in Google Play Console
4. Upload your APK/AAB
5. Fill in store listing details
6. Submit for review

## Live Updates (Optional)

To update the app without publishing to the store, you can enable live updates by pointing to your hosted web app:

In `capacitor.config.ts`:
```ts
server: {
  url: 'https://your-deployed-app.com',
  androidScheme: 'https'
}
```

---

## Quick Commands Reference

```bash
# Build React app
yarn build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Build debug APK (command line)
cd android && ./gradlew assembleDebug
```
