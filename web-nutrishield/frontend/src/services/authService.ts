/**
 * NutriShield Authentication & Session Management
 * Connects to backend /api/auth/* endpoints with cookie-based sessions.
 */

import { endpoints, asRecord } from "@/api";

export type UserRole = 'kader' | 'parent' | 'supervisor';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = 'nutrishield_user_cache_v3';

export const authService = {
  /**
   * Check current session against backend. Returns null if not authenticated.
   */
  async verify(): Promise<UserSession | null> {
    try {
      const res = asRecord(await endpoints.me());
      if (!res.id) return null;
      const session: UserSession = {
        id: String(res.id),
        name: String(res.name || ''),
        email: String(res.email || ''),
        role: (res.role as UserRole) || 'parent',
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return session;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  /**
   * Get cached session (optimistic, no network call).
   * Use verify() for authoritative check.
   */
  getCachedSession(): UserSession | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as UserSession;
    } catch { /* ignore */ }
    return null;
  },

  /**
   * Login with email + password. Throws on failure.
   */
  async login(email: string, password: string): Promise<UserSession> {
    const res = asRecord(await endpoints.login(email, password));
    const user = asRecord(res.user || res);
    const session: UserSession = {
      id: String(user.id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      role: (user.role as UserRole) || 'parent',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Register a new family account. Throws on failure.
   */
  async register(displayName: string, email: string, password: string, acceptDataProcessing: boolean): Promise<UserSession> {
    const res = asRecord(await endpoints.register(displayName, email, password, acceptDataProcessing));
    const user = asRecord(res.user || res);
    const session: UserSession = {
      id: String(user.id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      role: (user.role as UserRole) || 'parent',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  /**
   * Logout — clears backend session cookie and local cache.
   */
  async logout(): Promise<void> {
    try { await endpoints.logout(); } catch { /* best effort */ }
    localStorage.removeItem(STORAGE_KEY);
  },

  /**
   * Quick check (cached, no network). Use verify() for reliable check.
   */
  isLoggedIn(): boolean {
    return this.getCachedSession() !== null;
  },

  // Legacy compat — some components call getCurrentSession()
  getCurrentSession(): UserSession | null {
    return this.getCachedSession();
  },
};
