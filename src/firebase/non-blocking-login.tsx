'use client';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

/** Initiate Google sign-in (non-blocking). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(authInstance, provider);
  } catch (error: any) {
    // Usuário fechou o popup — não é erro real, ignorar silenciosamente
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      return;
    }
    // Outros erros reais — logar normalmente
    console.error('Erro de autenticação:', error);
  }
}

/** Logout (non-blocking). */
export function initiateLogout(authInstance: Auth): void {
  signOut(authInstance);
}