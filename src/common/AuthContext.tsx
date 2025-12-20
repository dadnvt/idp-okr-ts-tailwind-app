// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signIn, signOut, fetchAuthSession, fetchUserAttributes } from '@aws-amplify/auth';
import type { AuthState } from '../types/AuthState';

type Role = 'member' | 'leader' | 'manager';

function getGroupList(groups: unknown): string[] {
  return Array.isArray(groups) ? (groups as string[]) : typeof groups === 'string' ? [groups] : [];
}

function deriveRoleFromGroups(groups: unknown): Role {
  const list = getGroupList(groups);
  if (list.includes('manager')) return 'manager';
  if (list.includes('leader')) return 'leader';
  return 'member';
}

interface AuthContextType {
  auth: AuthState;
  isInitializing: boolean;
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
  const [isInitializing, setIsInitializing] = useState(true);


  // LOGIN
  const login = async (email: string, password: string) => {
    await signIn({ username: email, password });

    const session = await fetchAuthSession();
    const attributes = await fetchUserAttributes();
    const token = session.tokens?.accessToken?.toString() || null;
    const groups =
      session.tokens?.idToken?.payload['cognito:groups'] ??
      session.tokens?.accessToken?.payload['cognito:groups'];
    const role = deriveRoleFromGroups(groups);

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
        const groups =
          session.tokens?.idToken?.payload['cognito:groups'] ??
          session.tokens?.accessToken?.payload['cognito:groups'];
        const attributes = await fetchUserAttributes();
        const role = deriveRoleFromGroups(groups);

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
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, isInitializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
