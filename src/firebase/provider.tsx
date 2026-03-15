'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
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
  userLoaded: boolean;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
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
    userLoaded: false,
  });

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!firebaseUser) {
          setState({
            user: null,
            userData: null,
            isUserLoading: false,
            isAuthChecking: false,
            userError: null,
            userLoaded: true,
          });
          return;
        }

        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        try {
          const uidSnap = await getDoc(userDocRef);
          
          if (uidSnap.exists()) {
            const userData = { ...uidSnap.data(), id: uidSnap.id };
            setState(prev => ({ 
              ...prev, 
              user: firebaseUser, 
              userData, 
              isUserLoading: false, 
              isAuthChecking: false,
              userLoaded: true 
            }));
            
            const unsubscribeDb = onSnapshot(userDocRef, (snapshot) => {
              if (snapshot.exists()) {
                const updatedData = { ...snapshot.data(), id: snapshot.id };
                setState(prev => ({ ...prev, userData: updatedData }));
              }
            });
            return () => unsubscribeDb();
          } else {
            // Provisioning for the main admin
            if (firebaseUser.email === "felypenaiff01@gmail.com") {
              const adminData = {
                id: firebaseUser.uid,
                fullName: firebaseUser.displayName || "Felype Naiff",
                email: firebaseUser.email,
                profile: "ADMINISTRADOR",
                role: "ADMINISTRADOR",
                status: "ATIVO",
                createdAt: new Date().toISOString(),
                departmentIds: ["Diretoria", "Administrativo"]
              };
              await setDoc(userDocRef, adminData, { merge: true });
              setState(prev => ({ 
                ...prev, 
                user: firebaseUser, 
                userData: adminData, 
                isUserLoading: false, 
                isAuthChecking: false,
                userLoaded: true 
              }));
            } else {
              // Not a registered collaborator
              setState(prev => ({ 
                ...prev, 
                user: firebaseUser, 
                userData: null, 
                isUserLoading: false, 
                isAuthChecking: false, 
                userLoaded: true 
              }));
            }
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setState(prev => ({ ...prev, isUserLoading: false, isAuthChecking: false, userLoaded: true }));
        }
      },
      (error) => {
        setState(prev => ({ ...prev, isUserLoading: false, isAuthChecking: false, userError: error, userLoaded: true }));
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
      ...state,
    };
  }, [firebaseApp, firestore, auth, state]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  if (!auth) throw new Error('Firebase Auth not available.');
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firebase Firestore not available.');
  return firestore;
};

export const useUser = () => {
  const { user, userData, isUserLoading, isAuthChecking, userError, userLoaded } = useFirebase();
  return { user, userData, isUserLoading, isAuthChecking, userError, userLoaded };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  return useMemo(() => {
    const result = factory() as any;
    if (typeof result === 'object' && result !== null) {
      result.__memo = true;
    }
    return result;
  }, deps);
}