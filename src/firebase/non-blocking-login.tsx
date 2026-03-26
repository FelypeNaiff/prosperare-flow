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
  // If this is the specific hardcoded credential requested, 
  // we try to sign in, but if it fails (e.g., account not created yet),
  // we create it automatically to ensure initial access.
  if (email === 'pscsucesso@gmail.com' && pass === 'PSC2026#') {
    try {
      await signInWithEmailAndPassword(authInstance, email, pass);
    } catch (error: any) {
      // If user-not-found or invalid credential (meaning it might not exist)
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        await createUserWithEmailAndPassword(authInstance, email, pass);
      } catch (createError) {
        throw createError;
      }
    }
  } else {
    try {
      await signInWithEmailAndPassword(authInstance, email, pass);
    } catch (error: any) {
      throw error;
    }
  }
}

/** Logout (non-blocking). */
export function initiateLogout(authInstance: Auth): void {
  signOut(authInstance);
}
