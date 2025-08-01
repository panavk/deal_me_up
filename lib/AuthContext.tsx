import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase'; // Use the shared auth instance
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { createUserDocument, getUserDocument} from '../util/UserDB';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setIsNewUser: (newVal: boolean) => void;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '879690137107-4fknd9f6ahaeh7tf61apqc2eptsgkf15.apps.googleusercontent.com',
    androidClientId: '879690137107-q1v80agajmdbblqppdjmk3h652ttg8vk.apps.googleusercontent.com',
    iosClientId: '879690137107-9dtor7agh47gkenkqqd2vciglkuohhog.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (request) {
      console.log('Expo redirect URI:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Check if the user has completed onboarding
        const userDoc = await getUserDocument(firebaseUser.email);
        setIsNewUser(!userDoc?.onboardingComplete);
      } else {
        setIsNewUser(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const credential = GoogleAuthProvider.credential(response.authentication.accessToken);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    setIsNewUser(true);
    await createUserDocument(email);
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    await promptAsync();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isNewUser, setIsNewUser, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 