/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'Pabloooo',
  slug: 'pablooo',
  owner: 'leanstix',
  extra: {
    eas: {
      projectId: '14de39da-4abc-4b9b-947a-9fd85dc07166',
    },
  },
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['android'],
  scheme: 'pabloooo',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  android: {
    package: 'com.leanstix.pabloooo',
    versionCode: 1,
    allowBackup: false,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#102C2A',
    },
    blockedPermissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.RECORD_AUDIO',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  plugins: [
    'expo-sqlite',
    'expo-notifications',
    [
      'expo-image-picker',
      {
        photosPermission: 'Select a PNG for your Pabloooo home-screen shortcut.',
        microphonePermission: false,
      },
    ],
    './plugins/withPabloShortcut.js',
  ],
  updates: { enabled: false },
  experiments: { reactCompiler: false },
};

module.exports = config;
