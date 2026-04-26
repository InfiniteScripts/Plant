import { create } from 'zustand';
import {
  getAuth,
  onAuthStateChanged,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import * as firebase from '@/services/firebase';

interface AuthStore {
  user: FirebaseAuthTypes.User | null;
  hydrated: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user, hydrated: true }),
  signInWithEmail: async (email, password) => {
    await firebase.signInWithEmail(email, password);
  },
  signUpWithEmail: async (email, password) => {
    await firebase.signUpWithEmail(email, password);
  },
  signInWithApple: async () => {
    await firebase.signInWithApple();
  },
  signInWithGoogle: async () => {
    await firebase.signInWithGoogle();
  },
  signOut: async () => {
    await firebase.signOut();
  },
}));

let unsubscribe: (() => void) | null = null;

export function startAuthListener() {
  if (unsubscribe) return;
  unsubscribe = onAuthStateChanged(getAuth(), (user) => {
    useAuthStore.getState().setUser(user);
  });
}
