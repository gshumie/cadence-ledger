'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_USER, AuthUser } from '@/lib/auth';

export interface UserProfile extends AuthUser {
  isDemo: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface AuthContextType {
  user: UserProfile;
  session: Session | null;
  accessToken: string | null;
  isLoaded: boolean;
  isDemoUser: boolean;
  isSupabaseEnabled: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  switchToDemo: () => void;

  // Modal controls
  isAuthModalOpen: boolean;
  openAuthModal: (defaultTab?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  authModalTab: 'signin' | 'signup';
  setAuthModalTab: (tab: 'signin' | 'signup') => void;
}

const defaultDemoProfile: UserProfile = {
  ...DEFAULT_USER,
  isDemo: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile>(defaultDemoProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  const isSupabaseEnabled = isSupabaseConfigured();

  // Helper to map Supabase session to our UserProfile
  const mapSessionToProfile = useCallback((currentSession: Session | null): UserProfile => {
    if (!currentSession?.user) {
      return defaultDemoProfile;
    }
    const supaUser = currentSession.user;
    const meta = supaUser.user_metadata || {};
    const name = meta.name || meta.full_name || supaUser.email?.split('@')[0] || 'Cadence User';
    return {
      id: supaUser.id,
      email: supaUser.email || DEFAULT_USER.email,
      name,
      isDemo: false,
    };
  }, []);

  // Listen to Supabase auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseEnabled) {
        if (mounted) {
          setUser(defaultDemoProfile);
          setIsLoaded(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session && mounted) {
          setSession(data.session);
          setUser(mapSessionToProfile(data.session));
        } else if (mounted) {
          setUser(defaultDemoProfile);
        }
      } catch (err) {
        console.warn('Error reading Supabase session:', err);
        if (mounted) setUser(defaultDemoProfile);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    }

    initAuth();

    if (isSupabaseEnabled) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(mapSessionToProfile(newSession));
        if (newSession) {
          setIsAuthModalOpen(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isSupabaseEnabled, mapSessionToProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!isSupabaseEnabled) {
        return {
          success: false,
          error: 'Supabase authentication is not configured in this environment. Continuing in Demo Mode.',
        };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session) {
          setSession(data.session);
          setUser(mapSessionToProfile(data.session));
          setIsAuthModalOpen(false);
          return { success: true, message: 'Successfully signed in!' };
        }

        return { success: false, error: 'Failed to establish session.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign in failed.';
        return { success: false, error: message };
      }
    },
    [isSupabaseEnabled, mapSessionToProfile]
  );

  const signUp = useCallback(
    async (email: string, password: string, name?: string): Promise<AuthResult> => {
      if (!isSupabaseEnabled) {
        return {
          success: false,
          error: 'Supabase authentication is not configured in this environment.',
        };
      }

      try {
        const trimmedName = name?.trim() || email.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: trimmedName,
              full_name: trimmedName,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.session) {
          setSession(data.session);
          setUser(mapSessionToProfile(data.session));
          setIsAuthModalOpen(false);
          return { success: true, message: 'Account created and signed in!' };
        }

        // If email confirmation is disabled or auto-confirmed, attempt immediate session establishment
        if (data.user && !data.session) {
          try {
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
              });

            if (!signInError && signInData?.session) {
              setSession(signInData.session);
              setUser(mapSessionToProfile(signInData.session));
              setIsAuthModalOpen(false);
              return { success: true, message: 'Account created and signed in!' };
            }
          } catch {
            // Ignore fallback error and inform user
          }

          return {
            success: true,
            message:
              'Account created! A confirmation email has been sent. Please verify your address, then sign in.',
          };
        }

        return { success: true, message: 'Account created successfully.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        return { success: false, error: message };
      }
    },
    [isSupabaseEnabled, mapSessionToProfile]
  );

  const signOut = useCallback(async () => {
    if (isSupabaseEnabled) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out encountered error:', err);
      }
    }
    setSession(null);
    setUser(defaultDemoProfile);
  }, [isSupabaseEnabled]);

  const switchToDemo = useCallback(() => {
    if (isSupabaseEnabled && session) {
      supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
    setUser(defaultDemoProfile);
    setIsAuthModalOpen(false);
  }, [isSupabaseEnabled, session]);

  const openAuthModal = useCallback((defaultTab: 'signin' | 'signup' = 'signin') => {
    setAuthModalTab(defaultTab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const accessToken = useMemo(() => session?.access_token || null, [session]);
  const isDemoUser = useMemo(() => user.isDemo || !session, [user.isDemo, session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        accessToken,
        isLoaded,
        isDemoUser,
        isSupabaseEnabled,
        signIn,
        signUp,
        signOut,
        switchToDemo,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authModalTab,
        setAuthModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
