'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { auth as authInstance, firestore as firestoreInstance, firebaseApp as appInstance } from './init';

interface UserAuthState {
  user: User | null;
  userData: any | null; 
  selectedUser: any | null; 
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userLoaded: boolean;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  setSelectedUser: (user: any) => void;
  logoutSelectedUser: () => void;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<UserAuthState>({
    user: null,
    userData: null,
    selectedUser: null,
    isUserLoading: true,
    isAuthChecking: true,
    userLoaded: false,
  });

  useEffect(() => {
    // Carregar colaborador persistido
    const saved = localStorage.getItem('prosperare_selected_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, selectedUser: parsed }));
      } catch (e) {
        localStorage.removeItem('prosperare_selected_user');
      }
    }

    const unsubscribeAuth = onAuthStateChanged(authInstance, (firebaseUser) => {
      setState(prev => ({
        ...prev,
        user: firebaseUser,
        userData: firebaseUser ? { email: firebaseUser.email, uid: firebaseUser.uid } : null,
        isUserLoading: false,
        isAuthChecking: false,
        userLoaded: true,
      }));
    });

    return () => unsubscribeAuth();
  }, []);

  const setSelectedUser = (collab: any) => {
    setState(prev => ({ ...prev, selectedUser: collab }));
    if (collab) {
      localStorage.setItem('prosperare_selected_user', JSON.stringify(collab));
    } else {
      localStorage.removeItem('prosperare_selected_user');
    }
  };

  const logoutSelectedUser = () => {
    setSelectedUser(null);
  };

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      areServicesAvailable: true,
      firebaseApp: appInstance,
      firestore: firestoreInstance,
      auth: authInstance,
      ...state,
      setSelectedUser,
      logoutSelectedUser
    };
  }, [state]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = () => authInstance;
export const useFirestore = () => firestoreInstance;
export const useFirebaseApp = () => appInstance;

export const useUser = () => {
  const { user, userData, selectedUser, isUserLoading, isAuthChecking, userLoaded, setSelectedUser, logoutSelectedUser } = useFirebase();
  return { user, userData, selectedUser, isUserLoading, isAuthChecking, userLoaded, setSelectedUser, logoutSelectedUser };
};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T & {__memo?: boolean} {
  return useMemo(() => {
    const result = factory() as any;
    if (typeof result === 'object' && result !== null) {
      result.__memo = true;
    }
    return result;
  }, deps);
}
