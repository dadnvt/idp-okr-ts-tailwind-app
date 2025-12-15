// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, fetchAuthSession, fetchUserAttributes } from '@aws-amplify/auth';
import type { AuthState } from '../types/AuthState';

type Role = 'member' | 'leader';

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    user: {
      id: null,
      email: null,
      name: null,
    },
  });


  // LOGIN
  const login = async (email: string, password: string) => {
    await signIn({ username: email, password });

    const session = await fetchAuthSession();
    const attributes = await fetchUserAttributes();
    const token = session.tokens?.accessToken?.toString() || null;
    const groups = session.tokens?.idToken?.payload['cognito:groups'];
    const role =
      (Array.isArray(groups) ? groups[0] : 'member') as Role;

    setAuth({
      token: token,
      user: {
        id: attributes.sub,
        email: attributes.email,
        name: attributes.name || attributes.email,
        // We use Cognito standard attribute `locale` as team code/name (per project convention).
        team: attributes.locale || null,
        role : role
      },
    });
  };

  // LOGOUT
  const logout = async () => {
    await signOut();
    setAuth({ token: null, user: null});
  };

  // LOAD SESSION WHEN APP STARTS
  useEffect(() => {
    const init = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString() || null;
        const groups = session.tokens?.accessToken?.payload['cognito:groups'];
        const attributes = await fetchUserAttributes();
        const role =
            (Array.isArray(groups) ? groups[0] : 'member') as Role;

        setAuth({
          token: token,
          user: {
            id: attributes.sub,
            email: attributes.email,
            name: attributes.name || attributes.email,
            team: attributes.locale || null,
            role : role
          },
        });
      } catch {
        // not logged in
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
