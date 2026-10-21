import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Estos valores identifican tu app web; no son contraseñas (la seguridad la dan las reglas de Firebase y el backend).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigurado = Object.values(firebaseConfig).every(Boolean);
export const auth = firebaseConfigurado ? getAuth(initializeApp(firebaseConfig)) : null;
