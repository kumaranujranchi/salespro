import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Profile, Tenant, ReferralCampaign } from '../types/database';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  affiliate: ReferralCampaign | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Local state for "session" simulation since we're migrating
  // In a real app, this would come from useConvexAuth() or Clerk
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string } | null>(null);
  // Start loading as false — only go to true while resolving a session
  const [loading, setLoading] = useState(false);

  // Fetch profile via Convex query
  const profileData = useQuery(api.profiles.getByUserId, 
    sessionUser ? { userId: sessionUser.id } : "skip" as any
  ) as Profile | null | undefined;

  const promoteMutation = useMutation(api.profiles.promoteToPlatformAdmin);

  // Fetch affiliate campaign via Convex query
  const affiliateData = useQuery(api.referrals.getCampaignByCreator,
    sessionUser ? { userId: sessionUser.id } : "skip"
  );

  // Fetch tenant via Convex query
  const tenantData = useQuery(api.tenants.getById,
    profileData?.tenant_id ? { id: profileData.tenant_id as Id<"tenants"> } : "skip"
  ) as Tenant | null | undefined;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [affiliate, setAffiliate] = useState<ReferralCampaign | null>(null);

  useEffect(() => {
    if (profileData !== undefined) {
      // profileData resolved from Convex (either a profile or null)
      const p = profileData;
      
      // Auto-promote if this is the designated admin account
      if (p && p.email === 'admin@realsalepro.com' && p.role !== 'platform_admin') {
        setProfile({ ...p, role: 'platform_admin' });
        promoteMutation({ email: p.email }).catch(console.error);
      } else {
        setProfile(p);
      }

      if (!p || !p.tenant_id) {
        // No profile or no tenant — stop loading immediately
        setLoading(false);
      }
    }
  }, [profileData, promoteMutation]);

  useEffect(() => {
    if (tenantData !== undefined) {
      // tenantData resolved (either a tenant or null)
      setTenant(tenantData as any);
      setLoading(false);
    }
  }, [tenantData]);

  useEffect(() => {
    if (affiliateData) {
      setAffiliate(affiliateData as any);
    }
  }, [affiliateData]);

  const signIn = async (email: string) => {
    // Placeholder sign-in logic
    // You would replace this with actual Convex Auth or Clerk sign-in
    setLoading(true);
    setSessionUser({ id: email, email });
    return { error: null };
  };

  const signOut = async () => {
    setSessionUser(null);
    setProfile(null);
    setTenant(null);
    setAffiliate(null);
  };

  const refreshProfile = async () => {
    // Queries in Convex auto-refresh, so this might not be needed
  };

  const refreshTenant = async () => {
    // Same as above
  };

  return (
    <AuthContext.Provider value={{ 
      user: sessionUser, 
      profile, 
      affiliate, 
      tenant, 
      loading, 
      signIn, 
      signOut, 
      refreshProfile, 
      refreshTenant 
    }}>
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
