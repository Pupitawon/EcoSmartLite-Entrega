// Expo solo reemplaza variables escritas completas: process.env.EXPO_PUBLIC_...
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
