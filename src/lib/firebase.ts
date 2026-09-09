import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence benign Firestore network offline warnings/retry notices
try {
  setLogLevel('error');
} catch {
  // Ignore if already set
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase App Check safely (supports debug tokens in dev & reCAPTCHA v3/Play Integrity)
let appCheckInstance = null;
if (typeof window !== 'undefined') {
  try {
    const recaptchaKey = (firebaseConfig as any).recaptchaSiteKey;
    // Enable debug token in development or until production key is supplied
    if (process.env.NODE_ENV !== 'production' || !recaptchaKey) {
      // @ts-expect-error Firebase global debug token flag
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (recaptchaKey && typeof recaptchaKey === 'string' && recaptchaKey.trim() !== '') {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (err) {
    console.warn('[Firebase App Check] Initialization deferred:', err);
  }
}

const databaseId = firebaseConfig.firestoreDatabaseId || undefined;

// Use initializeFirestore with persistent local cache and auto-detect long polling
let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      experimentalAutoDetectLongPolling: true,
    },
    databaseId
  );
} catch {
  try {
    dbInstance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      databaseId
    );
  } catch {
    dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
}

export const db = dbInstance;
export const appCheck = appCheckInstance;
export default app;


