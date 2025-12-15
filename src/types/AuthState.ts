// types/AuthState.ts
export interface UserInfo {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}

export interface AuthState {
  token: string | null;
  user?: UserInfo | null;
}
