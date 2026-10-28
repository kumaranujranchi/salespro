import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useQuery, useMutation, useBackend } from "../lib/reactive";
import { api, Id } from '../lib/api-endpoints';
import { authService } from '../lib/services';
import { getAuthToken, getStoredSessionUser, setAuthToken, setStoredSessionUser } from '../lib/auth-token';
import { Profile, Tenant, ReferralCampaign, UserRole } from '../types/database';

interface AuthContextType {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  affiliate: ReferralCampaign | null;
  tenant: Tenant | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error: Error | null; profile?: Profile }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshTenant: () => Promise<void>;
  setSessionUser: (user: { id: string; email?: string } | null) => void;
  isActualPlatformAdmin: boolean;
  activeRoleOverride: UserRole | null;
  setActiveRoleOverride: (role: UserRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore session from localStorage so refresh doesn't log user out
  const [sessionUser, setSessionUserState] = useState<{ id: string; email?: string } | null>(() => {
    // A stored user without a token means the session was cleared/expired.
    if (!getAuthToken()) return null;
    return getStoredSessionUser<{ id: string; email?: string }>();
  });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const backend = useBackend();

  // Persist sessionUser to localStorage on every change
  const setSessionUser = (u: { id: string; email?: string } | null) => {
    setSessionUserState(u);
    setStoredSessionUser(u);
    if (!u) setAuthToken(null);
  };

  // Fetch profile from the backend
  const profileData = useQuery(api.profiles.getByUserId, 
    sessionUser ? { userId: sessionUser.id } : "skip" as any
  ) as Profile | null | undefined;

  const promoteMutation = useMutation(api.profiles.promoteToPlatformAdmin);
  const promotedEmailRef = useRef<string | null>(null);

  // Fetch affiliate campaign from the backend
  const affiliateData = useQuery(api.referrals.getCampaignByCreator,
    sessionUser ? { userId: sessionUser.id } : "skip"
  );

  // Fetch tenant from the backend
  const tenantData = useQuery(api.tenants.getById,
    profileData?.tenant_id ? { id: profileData.tenant_id as Id<"tenants"> } : "skip"
  ) as Tenant | null | undefined;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [affiliate, setAffiliate] = useState<ReferralCampaign | null>(null);

  // Determine if current logged in user is genuine SaaS/Platform Admin
  // (Strict check based on underlying database profile/session email)
  const isActualPlatformAdmin = Boolean(
    (profileData && (profileData.role === 'platform_admin' || profileData.email === 'admin@realsalepro.com')) ||
    (profile && (profile.email === 'admin@realsalepro.com' || (profile as any)._actual_role === 'platform_admin')) ||
    (sessionUser && (sessionUser.email === 'admin@realsalepro.com' || sessionUser.email === 'admin@salespro.com'))
  );

  // In-memory / session-stored role override for SaaS Admin QA testing
  const [activeRoleOverride, setActiveRoleOverrideState] = useState<UserRole | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem('realsalepro_qa_role_override');
        return saved ? (saved as UserRole) : null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const setActiveRoleOverride = (role: UserRole | null) => {
    if (!isActualPlatformAdmin) return;
    setActiveRoleOverrideState(role);
    try {
      if (typeof window !== 'undefined') {
        if (role) {
          sessionStorage.setItem('realsalepro_qa_role_override', role);
        } else {
          sessionStorage.removeItem('realsalepro_qa_role_override');
        }
      }
    } catch {
      // ignore
    }
  };

  // Ensure role override is completely cleared if user is not platform admin
  useEffect(() => {
    if (sessionUser && !isActualPlatformAdmin && activeRoleOverride) {
      setActiveRoleOverrideState(null);
      try {
        sessionStorage.removeItem('realsalepro_qa_role_override');
      } catch {}
    }
  }, [sessionUser, isActualPlatformAdmin, activeRoleOverride]);

  // Derived effective profile (applies role override for QA testing while preserving real admin profile)
  const effectiveProfile: Profile | null = (profile && isActualPlatformAdmin && activeRoleOverride)
    ? ({ ...profile, role: activeRoleOverride, _actual_role: 'platform_admin' } as Profile)
    : profile;

  // Derived loading state to prevent race conditions during query fetching
  const isProfileLoading = sessionUser !== null && profileData === undefined;
  const isTenantLoading = (profileData && profileData.tenant_id) ? (tenantData === undefined) : false;
  const loading = isSigningIn || isProfileLoading || isTenantLoading;

  useEffect(() => {
    if (profileData !== undefined) {
      // profileData resolved from the backend (either a profile or null)
      const p = profileData;
      
      // Auto-promote if this is the designated admin account.
      // Guarded by a ref so a refetch never re-triggers the promote call
      // (promote invalidates queries, which would refetch and loop forever).
      if (
        p &&
        p.email === 'admin@realsalepro.com' &&
        p.role !== 'platform_admin' &&
        promotedEmailRef.current !== p.email
      ) {
        promotedEmailRef.current = p.email;
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

  // Clean up stale session if profile cannot be authorized
  useEffect(() => {
    if (sessionUser && profileData === null) {
      handleSessionExpired();
    }
  }, [sessionUser, profileData]);

  const signIn = async (email: string, password?: string) => {
    setIsSigningIn(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Primary: Use backend REST API /api/auth/login
      try {
        const loginRes = await authService.login({ email: cleanEmail, password });
        if (loginRes?.profile) {
          setAuthToken(loginRes.token || null);
          const userProfile = {
            ...loginRes.profile,
            id: (loginRes.profile._id || loginRes.profile.id) as string,
          } as Profile;
          setProfile(userProfile);
          setSessionUser({
            id: userProfile.userId || userProfile.email,
            email: userProfile.email,
          });
          return { error: null, profile: userProfile };
        }
        return { error: new Error('Invalid email or password. Please try again.') };
      } catch (loginErr: any) {
        const msg = loginErr?.message || '';
        if (msg.includes('Invalid email or password') || msg.includes('401')) {
          return { error: new Error('Invalid email or password. Please try again.') };
        }
        return { error: loginErr instanceof Error ? loginErr : new Error(msg || 'Sign in failed') };
      }
    } catch (err: any) {
      return { error: err };
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    promotedEmailRef.current = null;
    setActiveRoleOverrideState(null);
    try {
      sessionStorage.removeItem('realsalepro_qa_role_override');
    } catch {}
    setAuthToken(null);
    setSessionUser(null);
    setProfile(null);
    setTenant(null);
    setAffiliate(null);
  };

  const refreshProfile = async () => {
    // Queries refresh reactively, so this might not be needed
  };

  const refreshTenant = async () => {
    // Same as above
  };

  return (
    <AuthContext.Provider value={{ 
      user: sessionUser, 
      profile: effectiveProfile, 
      affiliate, 
      tenant, 
      loading, 
      signIn, 
      signOut, 
      refreshProfile, 
      refreshTenant,
      setSessionUser,
      isActualPlatformAdmin,
      activeRoleOverride: isActualPlatformAdmin ? activeRoleOverride : null,
      setActiveRoleOverride
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
