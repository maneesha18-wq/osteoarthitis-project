"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; user: User | null }>;
  signInDemo: (role?: "researcher" | "clinician") => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_DEMO_USER_KEY = "kneeai_active_session";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    // 1. If Supabase is configured, check Supabase session
    if (configured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // 2. Local session recovery (for offline / instant demo access)
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(LOCAL_DEMO_USER_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            setUser(parsed);
          }
        } catch {
          // ignore error
        }
      }
      setIsLoading(false);
    }
  }, [configured]);

  const signIn = async (email: string, password: string) => {
    if (configured) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    }

    // Direct Local Sign In if Supabase not configured
    const localUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      email: email,
      app_metadata: {},
      user_metadata: {
        full_name: email.split("@")[0].replace(".", " ").toUpperCase(),
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;
    setUser(localUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_DEMO_USER_KEY, JSON.stringify(localUser));
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (configured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || "",
          },
        },
      });
      return { error, user: data.user };
    }

    // Direct Local Registration
    const localUser = {
      id: "usr-" + Math.random().toString(36).substring(2, 9),
      email: email,
      app_metadata: {},
      user_metadata: {
        full_name: fullName || email.split("@")[0],
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;
    setUser(localUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_DEMO_USER_KEY, JSON.stringify(localUser));
    }
    return { error: null, user: localUser };
  };

  const signInDemo = async (role: "researcher" | "clinician" = "researcher") => {
    const demoUser = {
      id: role === "researcher" ? "demo-researcher-01" : "demo-clinician-02",
      email: role === "researcher" ? "researcher@kneeai.edu" : "radiologist@hospital.edu",
      app_metadata: {},
      user_metadata: {
        full_name: role === "researcher" ? "Dr. Alex Rivera (Lead Researcher)" : "Dr. Sarah Chen (Senior Radiologist)",
        role: role === "researcher" ? "Data Science Researcher" : "Clinical Radiologist",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as unknown as User;
    setUser(demoUser);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_DEMO_USER_KEY, JSON.stringify(demoUser));
    }
  };

  const signOut = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_DEMO_USER_KEY);
    }
  };

  const resetPassword = async (email: string) => {
    if (configured) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    }
    return { error: null };
  };

  const updatePassword = async (password: string) => {
    if (configured) {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    }
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: configured,
        signIn,
        signUp,
        signInDemo,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
