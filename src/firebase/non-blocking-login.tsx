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
    const result = await signInWithPopup(authInstance, provider);
    if (result.user.email !== 'pscsucesso@gmail.com') {
      await signOut(authInstance);
      throw new Error('Acesso restrito: O e-mail utilizado não possui permissão de acesso.');
    }
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      return;
    }
    console.error('Erro de autenticação Google:', error);
    throw error;
  }
}



/** Logout (non-blocking). */
export function initiateLogout(authInstance: Auth): void {
  signOut(authInstance);
}
