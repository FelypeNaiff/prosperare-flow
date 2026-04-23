'use client';

import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from './init';

const authorizedEmails = [
  'pscsucesso@gmail.com',
  'felypenaiff01@gmail.com',
  'thalyssonluiz@gmail.com',
  'cpgama79@gmail.com',
  'marrypassosmarques@gmail.com',
  'thalyssonluiz20@gmail.com'
];

async function isAuthorizedCollaboratorEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (authorizedEmails.includes(normalizedEmail)) return true;

  const usersQuery = query(
    collection(firestore, 'users'),
    where('email', '==', normalizedEmail)
  );
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.some((docSnap) => {
    const userData = docSnap.data();
    return (userData.status || 'ATIVO') === 'ATIVO';
  });
}

/** Initiate Google sign-in (non-blocking). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    const email = result.user.email || '';
    const isAuthorized = email ? await isAuthorizedCollaboratorEmail(email) : false;

    if (!isAuthorized) {
      await signOut(authInstance);
      throw new Error('Acesso restrito: O e-mail utilizado nao possui permissao de acesso.');
    }
  } catch (error: any) {
    if (
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      return;
    }
    console.error('Erro de autenticacao Google:', error);
    throw error;
  }
}

/** Logout (non-blocking). */
export function initiateLogout(authInstance: Auth): void {
  signOut(authInstance);
}
