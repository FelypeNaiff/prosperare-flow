'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, onSnapshot, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  userData: any | null;
  isUserLoading: boolean;
  isAuthChecking: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [state, setState] = useState<UserAuthState>({
    user: null,
    userData: null,
    isUserLoading: true,
    isAuthChecking: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          // Auditoria: SEMPRE buscar pelo UID do Firebase Auth como chave do documento
          const userDocRef = doc(firestore, "users", firebaseUser.uid);
          const uidSnap = await getDoc(userDocRef);
          
          if (uidSnap.exists()) {
            const unsubscribeDb = onSnapshot(userDocRef, (snapshot) => {
              if (snapshot.exists()) {
                const userData = { ...snapshot.data(), id: snapshot.id };
                setState(prev => ({ 
                  ...prev, 
                  user: firebaseUser, 
                  userData, 
                  isUserLoading: false, 
                  isAuthChecking: false 
                }));
              }
            });
            return () => unsubscribeDb();
          } else {
            // Provisionamento Admin ou vínculo por e-mail
            if (firebaseUser.email === "felypenaiff01@gmail.com") {
              const adminData = {
                id: firebaseUser.uid,
                fullName: "Felype Naiff",
                email: firebaseUser.email,
                profile: "ADMINISTRADOR",
                role: "ADMINISTRADOR",
                status: "ATIVO",
                createdAt: new Date().toISOString(),
                departmentIds: ["Diretoria", "Administrativo"]
              };
              await setDoc(userDocRef, adminData, { merge: true });
              setState(prev => ({ ...prev, user: firebaseUser, userData: adminData, isUserLoading: false, isAuthChecking: false }));
            } else {
              const q = query(collection(firestore, "users"), where("email", "==", firebaseUser.email));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                const existingData = querySnapshot.docs[0].data();
                const finalData = { ...existingData, id: firebaseUser.uid, role: existingData.profile || "ASSISTENTE", updatedAt: new Date().toISOString() };
                await setDoc(userDocRef, finalData, { merge: true });
                setState(prev => ({ ...prev, user: firebaseUser, userData: finalData, isUserLoading: false, isAuthChecking: false }));
              } else {
                setState(prev => ({ ...prev, user: firebaseUser, userData: null, isUserLoading: false, isAuthChecking: false }));
              }
            }
          }
        } else {
          setState({ user: null, userData: null, isUserLoading: false, isAuthChecking: false, userError: null });
        }
      },
      (error) => {
        setState(prev => ({ ...prev, isUserLoading: false, isAuthChecking: false, userError: error }));
      }
    );

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: state.user,
      userData: state.userData,
      isUserLoading: state.isUserLoading,
      isAuthChecking: state.isAuthChecking,
      userError: state.userError,
    };
  }, [firebaseApp, firestore, auth, state]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available.');
  }
  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    userData: context.userData,
    isUserLoading: context.isUserLoading,
    isAuthChecking: context.isAuthChecking,
    userError: context.userError,
  };
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;
export const useUser = () => {
  const { user, userData, isUserLoading, isAuthChecking, userError } = useFirebase();
  return { user, userData, isUserLoading, isAuthChecking, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = factory() as any;
  if(typeof memoized === 'object' && memoized !== null) memoized.__memo = true;
  return memoized;
}