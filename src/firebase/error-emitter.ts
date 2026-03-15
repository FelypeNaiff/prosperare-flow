'use client';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Define o formato dos eventos globais da aplicação.
 */
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

type Callback<T> = (data: T) => void;

/**
 * Emitter de eventos tipado para gerenciar falhas de permissão e segurança.
 */
function createEventEmitter<T extends Record<string, any>>() {
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};

  return {
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName]?.push(callback);
    },

    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        return;
      }
      events[eventName] = events[eventName]?.filter(cb => cb !== callback);
    },

    emit<K extends keyof T>(eventName: K, data: T[K]) {
      if (!events[eventName]) {
        return;
      }

      // Em desenvolvimento, logamos no console mas não disparamos o overlay de erro do Next.js
      // Isso evita crashes em cascata por falhas temporárias de permissão (ID: ca9)
      if (eventName === 'permission-error' && process.env.NODE_ENV === 'development') {
        console.warn('[Firestore Permission Denied]', (data as any).message);
        return; 
      }

      events[eventName]?.forEach(callback => callback(data));
    },
  };
}

export const errorEmitter = createEventEmitter<AppEvents>();
