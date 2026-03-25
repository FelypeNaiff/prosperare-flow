'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

/** Initiate Google sign-in (non-blocking). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      return;
    }
    console.error('Erro de autenticação Google:', error);
  }
}

/** Initiate Email/Password sign-in (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, pass: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(authInstance, email, pass);
  } catch (error: any) {
    throw error;
  }
}

/** Logout (non-blocking). */
export function initiateLogout(authInstance: Auth): void {
  signOut(authInstance);
}
