import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  browserSessionPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

export const DELETE_ACCOUNT_FUNCTION_NAME = "deleteMyAccount";
export const DELETE_ACCOUNT_FUNCTION_REGION = "us-central1";
const APP_CHECK_ENTERPRISE_SITE_KEY = "6Lc8WbwtAAAAAI4mflvU4lxvDUYGy-1Ib2Jo27Wd";

const firebaseConfig = {
  apiKey: "AIzaSyCREAChZ62epE-x7QMtFIQZrp_1iLopTu0",
  authDomain: "mr-copy.firebaseapp.com",
  projectId: "mr-copy",
  appId: "1:624777915101:web:c4fa9d882c0fe87d3ec934",
};

let appCheckInitialized = false;

function getFirebaseApp(): FirebaseApp {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (!appCheckInitialized) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_ENTERPRISE_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  }
  return app;
}

export async function signInForAccountDeletion(): Promise<{ email: string | null }> {
  const auth = getAuth(getFirebaseApp());
  await setPersistence(auth, browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return { email: result.user.email };
}

export function getDeletionAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export async function invokeDeleteMyAccount(): Promise<void> {
  const functions = getFunctions(getFirebaseApp(), DELETE_ACCOUNT_FUNCTION_REGION);
  const deleteMyAccount = httpsCallable(functions, DELETE_ACCOUNT_FUNCTION_NAME);
  await deleteMyAccount();
}

export async function signOutOfDeletionFlow(): Promise<void> {
  await signOut(getDeletionAuth());
}
