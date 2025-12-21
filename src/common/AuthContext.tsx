// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn,
  signOut,
  confirmSignIn,
  fetchAuthSession,
  fetchUserAttributes,
} from '@aws-amplify/auth';
import type { AuthState } from '../types/AuthState';
import { apiFetch } from './api';

type Role = 'member' | 'leader' | 'manager';
type LoginResult = { status: 'SIGNED_IN' } | { status: 'NEW_PASSWORD_REQUIRED' };

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
  login: (
    email: string,
    password: string
  ) => Promise<LoginResult>;
  completeNewPassword: (newPassword: string) => Promise<void>;
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

  const hydrateAuthFromCurrentSession = async () => {
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
        role: role,
      },
    });

    // Ensure DB user record exists (maps Cognito user -> `users` table).
    // Non-fatal: app can still show UI, but team/leader scopes may fail until resolved.
    try {
      const res = await apiFetch(
        '/auth/ensure-user',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: attributes.email ?? null,
            name: (attributes.name || attributes.email) ?? null,
            team: attributes.locale ?? null,
          }),
        },
        token
      );
      if (!res.ok) {
        const text = await res.text();
        console.warn('[auth]', 'ensure-user failed:', res.status, text);
      }
    } catch (e) {
      console.warn('[auth]', 'ensure-user network error:', e);
    }
  };


  // LOGIN
  const login = async (email: string, password: string): Promise<LoginResult> => {
    // If a session already exists, avoid calling signIn() which can throw UserAlreadyAuthenticatedException.
    try {
      const existing = await fetchAuthSession();
      if (existing.tokens?.accessToken) {
        await hydrateAuthFromCurrentSession();
        return { status: 'SIGNED_IN' };
      }
    } catch {
      // ignore
    }

    let res: unknown;
    try {
      res = await signIn({ username: email, password });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Common during dev when a previous session is still cached.
      if (msg.includes('UserAlreadyAuthenticatedException')) {
        try {
          await signOut();
        } catch {
          // ignore
        }
        res = await signIn({ username: email, password });
      } else {
        throw e;
      }
    }

    // Defensive: depending on Amplify/Auth versions, `signIn` may return different shapes.
    // If we don't see the expected output, treat this as a successful sign-in and hydrate from session.
    if (!res || typeof (res as { isSignedIn?: unknown }).isSignedIn !== 'boolean') {
      await hydrateAuthFromCurrentSession();
      return { status: 'SIGNED_IN' };
    }

    if ((res as { isSignedIn: boolean }).isSignedIn) {
      await hydrateAuthFromCurrentSession();
      return { status: 'SIGNED_IN' };
    }

    const step = ((res as { nextStep?: unknown }).nextStep as { signInStep?: unknown } | undefined)
      ?.signInStep;
    if (typeof step === 'string' && step.toUpperCase().includes('NEW_PASSWORD')) {
      return { status: 'NEW_PASSWORD_REQUIRED' };
    }

    throw new Error(
      `[auth] Unsupported sign-in step: ${typeof step === 'string' ? step : 'unknown'}`
    );
  };

  const completeNewPassword = async (newPassword: string) => {
    await confirmSignIn({ challengeResponse: newPassword });
    await hydrateAuthFromCurrentSession();
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
        await hydrateAuthFromCurrentSession();
      } catch {
        // not logged in
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, isInitializing, login, completeNewPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
