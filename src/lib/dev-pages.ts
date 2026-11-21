// LOCAL DEV ONLY — every page in the app, for the Dev Mode "Pages" checklist
// and page tour. Keep in sync with the <Route>s in src/App.tsx.
// Only imported from dev components that are code-split behind `import.meta.env.DEV`.

import { useEffect, useState } from 'react';

export type PageGroup = 'Public' | 'App' | 'Platform' | 'Affiliate';

export interface DevPage {
  path: string;
  label: string;
  group: PageGroup;
  /** Short note on who can open it, shown in the checklist. */
  access?: string;
}

export const DEV_PAGES: DevPage[] = [
  // Public / marketing
  { path: '/', label: 'Landing', group: 'Public' },
  { path: '/pricing', label: 'Pricing', group: 'Public' },
  { path: '/free-real-estate-crm', label: 'Free CRM', group: 'Public' },
  { path: '/templates/real-estate-crm-excel-template', label: 'Excel Template', group: 'Public' },
  { path: '/crm-for-real-estate-brokers', label: 'Brokers CRM', group: 'Public' },
  { path: '/real-estate-crm-india', label: 'India CRM', group: 'Public' },
  { path: '/features/lead-management', label: 'Lead Management feature', group: 'Public' },
  { path: '/referral-program', label: 'Referral Program', group: 'Public' },
  { path: '/contact', label: 'Contact Us', group: 'Public' },
  { path: '/integration', label: 'Integrations', group: 'Public' },
  { path: '/sitemap', label: 'Sitemap', group: 'Public' },
  { path: '/privacy', label: 'Privacy Policy', group: 'Public' },
  { path: '/data-deletion', label: 'Data Deletion', group: 'Public' },
  { path: '/terms', label: 'Terms of Service', group: 'Public' },
  { path: '/refund-policy', label: 'Refund Policy', group: 'Public' },
  { path: '/shipping-policy', label: 'Shipping Policy', group: 'Public' },
  { path: '/login', label: 'Login', group: 'Public' },
  { path: '/register', label: 'Register Company', group: 'Public' },
  { path: '/unauthorized', label: 'Unauthorized', group: 'Public' },
  { path: '/__dev-missing-page__', label: '404 Not Found', group: 'Public' },

  // Signed-in app
  { path: '/dashboard', label: 'Dashboard', group: 'App', access: 'Any role (layout differs per role)' },
  { path: '/accountant-dashboard', label: 'Accountant Dashboard', group: 'App', access: 'Accountant' },
  { path: '/crm', label: 'CRM', group: 'App', access: 'crm permission' },
  { path: '/crm/pipeline', label: 'CRM Pipeline', group: 'App', access: 'crm permission' },
  { path: '/leads', label: 'Leads', group: 'App', access: 'crm permission' },
  { path: '/sales', label: 'Sales', group: 'App', access: 'sales permission' },
  { path: '/performance', label: 'Performance', group: 'App', access: 'sales permission' },
  { path: '/site-visits', label: 'Site Visits', group: 'App', access: 'site_visits permission' },
  { path: '/projects', label: 'Projects', group: 'App', access: 'inventory permission' },
  { path: '/inventory', label: 'Inventory', group: 'App', access: 'inventory permission' },
  { path: '/targets', label: 'Targets', group: 'App', access: 'incentives permission' },
  { path: '/incentives', label: 'Incentives', group: 'App', access: 'incentives permission' },
  { path: '/accounts', label: 'Accounts', group: 'App', access: 'Admin / Director / Accountant' },
  { path: '/reports', label: 'Reports', group: 'App', access: 'reports permission' },
  { path: '/directory', label: 'Directory', group: 'App', access: 'directory permission' },
  { path: '/users', label: 'Users', group: 'App', access: 'users permission' },
  { path: '/roles', label: 'Roles', group: 'App', access: 'roles permission' },
  { path: '/departments', label: 'Departments', group: 'App', access: 'departments permission' },
  { path: '/announcements', label: 'Announcements', group: 'App', access: 'announcements permission' },
  { path: '/support', label: 'Support', group: 'App', access: 'support permission' },
  { path: '/subscription', label: 'Subscription', group: 'App', access: 'subscription permission' },
  { path: '/configuration/whatsapp', label: 'WhatsApp Config', group: 'App', access: 'Most staff roles' },
  { path: '/settings', label: 'Settings', group: 'App', access: 'Tenant Admin' },
  { path: '/settings/integrations', label: 'Settings › Integrations', group: 'App', access: 'Tenant Admin' },

  // Platform owner
  { path: '/platform/dashboard', label: 'Platform Dashboard', group: 'Platform', access: 'Super Admin (platform)' },
  { path: '/platform/tenants', label: 'Tenants', group: 'Platform', access: 'Super Admin (platform)' },
  { path: '/platform/support', label: 'Platform Support', group: 'Platform', access: 'Super Admin (platform)' },
  { path: '/platform/server-health', label: 'Server Health', group: 'Platform', access: 'Super Admin (platform)' },
  { path: '/platform/whatsapp', label: 'WhatsApp Command Center', group: 'Platform', access: 'Super Admin / Tenant Admin' },
  { path: '/referral-management', label: 'Referral Management', group: 'Platform', access: 'Super Admin (platform)' },

  // Affiliate
  { path: '/affiliate/register', label: 'Affiliate Register', group: 'Affiliate' },
  { path: '/affiliate/terms', label: 'Affiliate Terms', group: 'Affiliate' },
  { path: '/affiliate/dashboard', label: 'Affiliate Dashboard', group: 'Affiliate', access: 'Affiliate (needs a campaign)' },
];

// ---------------------------------------------------------------------------
// Checklist state: per signed-in role, so you can tour once per persona.
// ---------------------------------------------------------------------------

export type PageStatus = 'ok' | 'blocked' | 'broken';
type StatusMap = Record<string, PageStatus>;

const STATUS_KEY = 'crm_dev_page_status';
const TOUR_KEY = 'crm_dev_page_tour';

function readAll(): Record<string, StatusMap> {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getPageStatuses(roleKey: string): StatusMap {
  return readAll()[roleKey] || {};
}

export function setPageStatus(roleKey: string, path: string, status: PageStatus | null) {
  try {
    const all = readAll();
    const map = { ...(all[roleKey] || {}) };
    if (status) map[path] = status;
    else delete map[path];
    all[roleKey] = map;
    localStorage.setItem(STATUS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('crm-dev-pages-changed'));
  } catch {
    // ignore
  }
}

export function clearPageStatuses(roleKey: string) {
  try {
    const all = readAll();
    delete all[roleKey];
    localStorage.setItem(STATUS_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('crm-dev-pages-changed'));
  } catch {
    // ignore
  }
}

/** Index of the current tour stop, or null when no tour is running. */
export function getTourIndex(): number | null {
  try {
    const raw = sessionStorage.getItem(TOUR_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n < DEV_PAGES.length ? n : null;
  } catch {
    return null;
  }
}

export function setTourIndex(index: number | null) {
  try {
    if (index === null) sessionStorage.removeItem(TOUR_KEY);
    else sessionStorage.setItem(TOUR_KEY, String(index));
    window.dispatchEvent(new Event('crm-dev-pages-changed'));
  } catch {
    // ignore
  }
}

/** Re-render when checklist/tour state changes (this tab or another). */
export function useDevPagesVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener('crm-dev-pages-changed', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('crm-dev-pages-changed', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);
  return version;
}
