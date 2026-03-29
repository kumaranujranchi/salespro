import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
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
  const [loading, setLoading] = useState(true);

  // Fetch profile via Convex query
  const profileData = useQuery(api.profiles.getByUserId, 
    sessionUser ? { userId: sessionUser.id } : "skip" as any
  );

  // Fetch affiliate campaign via Convex query
  const affiliateData = useQuery(api.referrals.getCampaignByCreator,
    sessionUser ? { userId: sessionUser.id } : "skip"
  );

  // Fetch tenant via Convex query
  const tenantData = useQuery(api.tenants.getById,
    (profileData as any)?.tenant_id ? { id: (profileData as any).tenant_id as Id<"tenants"> } : "skip"
  );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [affiliate, setAffiliate] = useState<ReferralCampaign | null>(null);

  useEffect(() => {
    if (profileData) {
      setProfile(profileData as any);
    } else if (profileData === null && sessionUser) {
      setLoading(false);
    }
  }, [profileData, sessionUser]);

  useEffect(() => {
    if (tenantData) {
      setTenant(tenantData as any);
      setLoading(false);
    } else if (tenantData === null && profile) {
      setLoading(false);
    }
  }, [tenantData, profile]);

  useEffect(() => {
    if (affiliateData) {
      setAffiliate(affiliateData as any);
    }
  }, [affiliateData]);

  const signIn = async (email: string, _password: string) => {
    // Placeholder sign-in logic
    // You would replace this with actual Convex Auth or Clerk sign-in
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
