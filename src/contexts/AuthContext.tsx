import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Tenant } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        role_details:tenant_roles (
          id,
          name,
          permissions
        )
      `)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (!data) {
      // Profile missing - Likely deleted user
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      throw new Error('Account does not exist. It may have been deleted.');
    }

    if (data.is_active === false) {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      throw new Error('Account is deactivated. Please contact support.');
    }

    setProfile(data);
    if (data.tenant_id) {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', data.tenant_id)
        .single();
      if (tenantData) setTenant(tenantData as Tenant);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      try {
        await fetchProfile(user.id);
      } catch (error) {
        console.error('Error refreshing profile:', error);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch (error) {
            // Error handled in fetchProfile (sign out)
            console.error(error);
          }
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch (error) {
            console.error(error);
          }
        } else {
          setProfile(null);
          setTenant(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        try {
          await fetchProfile(data.user.id);
        } catch (profileError: any) {
          return { error: new Error(profileError.message || 'Access denied') };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await supabase.auth.signOut();
    setProfile(null);
    setTenant(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, tenant, session, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
