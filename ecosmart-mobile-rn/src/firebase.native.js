import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, firebaseConfigurado } from './config';

let auth = null;
if (firebaseConfigurado) {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app); // ya estaba inicializado (recarga en caliente)
  }
}
export { auth };
