import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useMutation, useConvex } from "convex/react";
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const convex = useConvex();

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

  // Derived loading state to prevent race conditions during query fetching
  const isProfileLoading = sessionUser !== null && profileData === undefined;
  const isTenantLoading = (profileData && profileData.tenant_id) ? (tenantData === undefined) : false;
  const loading = isSigningIn || isProfileLoading || isTenantLoading;

  useEffect(() => {
    if (profileData !== undefined) {
      // profileData resolved from Convex (either a profile or null)
      const p = profileData;
      
      // Auto-promote if this is the designated admin account
      if (p && p.email === 'admin@realsalepro.com' && p.role !== 'platform_admin') {
        const adminProfile = { ...p, id: p._id as string } as Profile;
        setProfile(adminProfile);
        promoteMutation({ email: p.email }).catch(console.error);
      } else {
        setProfile(p ? { ...p, id: p._id as string } as Profile : null);
      }
    }
  }, [profileData, promoteMutation]);

  useEffect(() => {
    if (tenantData !== undefined) {
      // tenantData resolved (either a tenant or null)
      const t = tenantData;
      setTenant(t ? { ...t, id: t._id as string } as Tenant : null);
    }
  }, [tenantData]);

  useEffect(() => {
    if (affiliateData) {
      setAffiliate(affiliateData as any);
    }
  }, [affiliateData]);

  const signIn = async (email: string, password?: string) => {
    setIsSigningIn(true);
    try {
      const profile = await convex.query(api.profiles.getByEmail, { email });
      if (!profile) {
        return { error: new Error('Invalid email or password. Please try again.') };
      }
      if (profile.password && profile.password !== password) {
        return { error: new Error('Invalid email or password. Please try again.') };
      }
      setSessionUser({ id: profile.userId, email: profile.email });
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      setIsSigningIn(false);
    }
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
