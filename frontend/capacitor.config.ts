import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mentismathematicsfoundation.app',
  appName: 'Mentis',
  webDir: 'build',
  server: {
    // Points directly to the live production website so every prompt/deployment automatically updates the app
    url: 'https://mentismathematicsfoundation.com',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
