import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  AppleAuthProvider,
} from '@react-native-firebase/auth';
import { getAnalytics, logEvent as analyticsLogEvent } from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
  recordError as crashlyticsRecordError,
} from '@react-native-firebase/crashlytics';
import {
  getMessaging,
  requestPermission,
  getToken,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

let configured = false;

export function configureFirebase() {
  if (configured) return;
  configured = true;

  GoogleSignin.configure();
  setCrashlyticsCollectionEnabled(getCrashlytics(), true);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(getAuth(), email, password);
}

export async function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(getAuth(), email, password);
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (!idToken) throw new Error('Google Sign-In did not return an ID token');
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(getAuth(), credential);
}

export async function signInWithApple() {
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token');
  }
  const credential = AppleAuthProvider.credential(
    appleCredential.identityToken,
    appleCredential.authorizationCode ?? undefined
  );
  return signInWithCredential(getAuth(), credential);
}

export async function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(getAuth(), email);
}

export async function signOut() {
  await Promise.allSettled([
    GoogleSignin.signOut().catch(() => {}),
    firebaseSignOut(getAuth()),
  ]);
}

export async function logEvent(name: string, params?: Record<string, unknown>) {
  await analyticsLogEvent(getAnalytics(), name, params);
}

export function recordError(error: Error) {
  crashlyticsRecordError(getCrashlytics(), error);
}

// TODO: call once user is signed in and you have a backend to receive the token.
export async function registerForPushNotifications(): Promise<string | null> {
  const messaging = getMessaging();
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  if (!enabled) return null;
  return getToken(messaging);
}
