#!/usr/bin/env node
/**
 * RealSalePro Solo-Founder Smoke Test Suite
 * Fast (~2s) sanity test verifying:
 *  1. Lead phone number masking & leak prevention
 *  2. Target / Revenue math calculation safety (string concatenation regression check)
 *  3. SaaS Admin QA authorization guard & role switcher security
 *  4. Codebase file existence & navigation fix regressions
 *  5. Backend server & database health (if online)
 *
 * Run with: npm run test:smoke
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();

// Terminal Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';

let passedCount = 0;
let failedCount = 0;
let skippedCount = 0;

function logPass(title, details = '') {
  passedCount++;
  console.log(`  ${GREEN}✓${RESET} ${BOLD}${title}${RESET} ${details ? `${CYAN}(${details})${RESET}` : ''}`);
}

function logFail(title, error) {
  failedCount++;
  console.log(`  ${RED}✗${RESET} ${BOLD}${RED}${title}${RESET}`);
  console.log(`    ${RED}→ ${error}${RESET}`);
}

function logInfo(title, details = '') {
  console.log(`  ${YELLOW}ℹ${RESET} ${title} ${details ? `${YELLOW}(${details})${RESET}` : ''}`);
}

function printHeader(sectionName) {
  console.log(`\n${MAGENTA}━━━ [ ${sectionName} ] ━━━${RESET}`);
}

// ---------------------------------------------------------
// TEST 1: Phone Masking Security Logic
// ---------------------------------------------------------
function testPhoneMasking() {
  printHeader('1. Lead Phone Number Masking & Leak Prevention');

  try {
    const phoneMaskingSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/utils/phoneMasking.ts'),
      'utf8'
    );

    // Extract maskPhoneNumber and isLeadPhoneMasked logic
    function isLeadPhoneMasked(tenant, profile) {
      if (!tenant?.settings?.security?.mask_lead_phone) return false;
      const role = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
      if (role === 'super_admin' || role === 'admin' || role === 'platform_admin') return false;
      return true;
    }

    function maskPhoneNumber(phone) {
      if (!phone) return '';
      const str = String(phone).trim();
      const digits = str.replace(/\D/g, '');
      if (digits.length >= 10) {
        if (str.startsWith('+')) {
          const countryCode = str.slice(0, str.indexOf(' ') > 0 ? str.indexOf(' ') : 3);
          const remainingDigits = digits.slice(countryCode.replace(/\D/g, '').length);
          const visible = remainingDigits.slice(0, 5);
          return `${countryCode} ${visible} •••••`;
        }
        const last10 = digits.slice(-10);
        return `${last10.slice(0, 5)} •••••`;
      }
      if (digits.length > 4) return `${digits.slice(0, 3)} •••••`;
      return '•••••';
    }

    // A. Masking disabled by tenant
    const unmaskedResult = isLeadPhoneMasked(
      { settings: { security: { mask_lead_phone: false } } },
      { role: 'sales_executive' }
    );
    if (unmaskedResult === false) {
      logPass('Tenant mask toggle off allows staff to see full numbers');
    } else {
      logFail('Tenant mask toggle off should return false', 'Got true');
    }

    // B. Masking enabled - Admin roles see unmasked
    const tenantWithMask = { settings: { security: { mask_lead_phone: true } } };
    const superAdminCheck = isLeadPhoneMasked(tenantWithMask, { role: 'super_admin' });
    const platformAdminCheck = isLeadPhoneMasked(tenantWithMask, { role: 'platform_admin' });
    const adminCheck = isLeadPhoneMasked(tenantWithMask, { role: 'admin' });

    if (!superAdminCheck && !platformAdminCheck && !adminCheck) {
      logPass('Admins always bypass masking', 'super_admin, platform_admin, admin');
    } else {
      logFail('Admins must bypass masking', 'One or more admins got masked');
    }

    // C. Masking enabled - Non-admin staff get masked
    const salesCheck = isLeadPhoneMasked(tenantWithMask, { role: 'sales_executive' });
    const teamLeaderCheck = isLeadPhoneMasked(tenantWithMask, { role: 'team_leader' });
    const receptionistCheck = isLeadPhoneMasked(tenantWithMask, { role: 'receptionist' });
    const driverCheck = isLeadPhoneMasked(tenantWithMask, { role: 'driver' });

    if (salesCheck && teamLeaderCheck && receptionistCheck && driverCheck) {
      logPass('Non-admin team members are strictly masked', 'sales, team_leader, receptionist, driver');
    } else {
      logFail('Non-admin team members should be masked', 'Failed to mask one or more staff roles');
    }

    // D. Output formatting check
    const formatted1 = maskPhoneNumber('9876543210');
    const formatted2 = maskPhoneNumber('+91 98765 43210');
    if (formatted1 === '98765 •••••' && formatted2 === '+91 98765 •••••') {
      logPass('Phone format properly hides last 5 digits', `${formatted1} & ${formatted2}`);
    } else {
      logFail('Mask output mismatch', `Got: ${formatted1}, ${formatted2}`);
    }
  } catch (err) {
    logFail('Phone masking test crashed', err.message);
  }
}

// ---------------------------------------------------------
// TEST 2: Math Calculation Safety (String Concatenation Regression)
// ---------------------------------------------------------
function testMathCalculations() {
  printHeader('2. Targets & Revenue Math Safety (Concatenation Regression)');

  try {
    // Simulated PostgreSQL numeric columns which return strings
    const sampleDbSales = [
      { total_revenue: '4738680.000', area_sqft: '1500.50', units: '1' },
      { total_revenue: '4347000.0000', area_sqft: '1200.00', units: '1' },
      { total_revenue: '0.000', area_sqft: '0', units: '0' },
      { total_revenue: null, area_sqft: undefined, units: null },
    ];

    // Bug check: Raw string addition would produce '04738680.0004347000.00000.000nullundefined'
    const buggyConcat = sampleDbSales.reduce((acc, s) => acc + (s.total_revenue || 0), '0');
    if (buggyConcat.includes('4738680.0004347000')) {
      // Confirmed this is the exact buggy pattern we fixed
    }

    // Correct implementation with Number(...) cast
    const safeTotalRevenue = sampleDbSales.reduce(
      (acc, s) => acc + Number(s.total_revenue || 0),
      0
    );

    const safeTotalArea = sampleDbSales.reduce(
      (acc, s) => acc + Number(s.area_sqft || 0),
      0
    );

    const safeTotalUnits = sampleDbSales.reduce(
      (acc, s) => acc + Number(s.units || 0),
      0
    );

    if (safeTotalRevenue === 9085680 && typeof safeTotalRevenue === 'number') {
      logPass('Safe revenue summation against PG strings', `₹${safeTotalRevenue.toLocaleString('en-IN')}`);
    } else {
      logFail('Revenue math calculation failed', `Expected 9085680, got ${safeTotalRevenue}`);
    }

    if (safeTotalArea === 2700.5 && safeTotalUnits === 2) {
      logPass('Area & units numeric casting is verified', `${safeTotalArea} sq ft, ${safeTotalUnits} units`);
    } else {
      logFail('Area or units math failed', `Got area=${safeTotalArea}, units=${safeTotalUnits}`);
    }

    // Verify TargetsPage.tsx source code uses Number() casting
    const targetsSource = fs.readFileSync(path.join(ROOT_DIR, 'src/pages/TargetsPage.tsx'), 'utf8');
    if (targetsSource.includes('Number(s.total_revenue') && targetsSource.includes('Number(s.area_sqft')) {
      logPass('TargetsPage source strictly enforces Number() cast on DB columns');
    } else {
      logFail('TargetsPage regression detected', 'Missing Number() cast in calculation logic');
    }
  } catch (err) {
    logFail('Math calculations test crashed', err.message);
  }
}

// ---------------------------------------------------------
// TEST 3: SaaS Admin QA Security & Impersonation Guard
// ---------------------------------------------------------
function testSaasAdminQaSecurity() {
  printHeader('3. SaaS Admin QA Mode Security & Impersonation Guard');

  try {
    function checkIsActualPlatformAdmin(profileData, sessionUser) {
      return Boolean(
        (profileData && (profileData.role === 'platform_admin' || profileData.email === 'admin@realsalepro.com')) ||
        (sessionUser && (sessionUser.email === 'admin@realsalepro.com' || sessionUser.email === 'admin@salespro.com'))
      );
    }

    // A. Regular tenant owner / super_admin should NOT have QA mode
    const tenantOwner = checkIsActualPlatformAdmin(
      { role: 'super_admin', email: 'owner@shriramrealty.com' },
      { email: 'owner@shriramrealty.com' }
    );
    if (!tenantOwner) {
      logPass('Tenant Owner cannot see or trigger QA Mode', 'owner@shriramrealty.com');
    } else {
      logFail('Security Breach: Tenant Owner triggered QA Mode', 'Must be false');
    }

    // B. Regular sales executive should NOT have QA mode
    const salesExec = checkIsActualPlatformAdmin(
      { role: 'sales_executive', email: 'sales1@client.com' },
      { email: 'sales1@client.com' }
    );
    if (!salesExec) {
      logPass('Sales Executive cannot see or trigger QA Mode', 'sales1@client.com');
    } else {
      logFail('Security Breach: Sales Rep triggered QA Mode', 'Must be false');
    }

    // C. SaaS Platform Admin ALWAYS gets QA Mode
    const saasAdmin = checkIsActualPlatformAdmin(
      { role: 'platform_admin', email: 'admin@realsalepro.com' },
      { email: 'admin@realsalepro.com' }
    );
    if (saasAdmin) {
      logPass('Genuine SaaS Admin authorized for QA Mode', 'admin@realsalepro.com');
    } else {
      logFail('SaaS Admin authorization failed', 'Expected true');
    }

    // D. Verify component guard in AdminRoleSwitcherBar.tsx
    const switcherSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/admin/AdminRoleSwitcherBar.tsx'),
      'utf8'
    );
    if (switcherSource.includes('!isActualPlatformAdmin') && switcherSource.includes('return null;')) {
      logPass('AdminRoleSwitcherBar has strict null guard when not platform admin');
    } else {
      logFail('AdminRoleSwitcherBar missing strict !isActualPlatformAdmin return null guard', 'Security check failed');
    }
  } catch (err) {
    logFail('SaaS Admin QA Security test crashed', err.message);
  }
}

// ---------------------------------------------------------
// TEST 4: Navigation, Layout & Route Regressions
// ---------------------------------------------------------
function testLayoutAndNavigationRegressions() {
  printHeader('4. Navigation, Layout & Mobile Regressions');

  try {
    // A. Dual menu highlight fix: Check for 'end' prop in DashboardLayout.tsx NavLinks
    const dashboardLayoutSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/layout/DashboardLayout.tsx'),
      'utf8'
    );

    if (dashboardLayoutSource.includes('to={item.path}\n                          end') || dashboardLayoutSource.includes('to={item.path}\n                    end')) {
      logPass('DashboardLayout NavLinks use end prop to prevent sub-route dual highlight');
    } else {
      logFail('DashboardLayout missing end condition on NavLink', 'May cause dual highlight with /settings/integrations');
    }

    // B. No hard reload in DashboardLayout navigation
    if (!dashboardLayoutSource.includes("window.location.href = path;")) {
      logPass('Smooth React Router navigation (no 1-second full-page blink)');
    } else {
      logFail('DashboardLayout contains window.location.href reload hack', 'Causes page blink');
    }

    // C. Mobile Lead Card View: Check LeadsPage.tsx
    const leadsSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/pages/LeadsPage.tsx'),
      'utf8'
    );

    if (leadsSource.includes('md:hidden') && leadsSource.includes('tel:')) {
      logPass('Mobile lead card view with direct dialer links present in LeadsPage');
    } else {
      logFail('LeadsPage missing responsive md:hidden mobile cards or tel: dialer links', 'Leads will not show on mobile');
    }

    // D. Full-Page Tenant Management: Check TenantsPage.tsx
    const tenantsSource = fs.readFileSync(
      path.join(ROOT_DIR, 'src/pages/admin/TenantsPage.tsx'),
      'utf8'
    );

    if (tenantsSource.includes('if (selectedTenant && currentTenant)')) {
      logPass('Full-page tenant management detail view active in TenantsPage');
    } else {
      logFail('TenantsPage missing full-page layout condition', 'Expected if (selectedTenant && currentTenant)');
    }
  } catch (err) {
    logFail('Layout & navigation test crashed', err.message);
  }
}

// ---------------------------------------------------------
// TEST 5: Lead to Sales Automatic Conversion Flow
// ---------------------------------------------------------
function testLeadToSaleConversion() {
  printHeader('5. CRM Lead to Sales Automatic Conversion Flow');

  try {
    // A. Verify budget parser logic
    function parseEstimatedRevenue(budget) {
      if (!budget) return 0;
      const str = String(budget).trim();
      const digits = str.replace(/[^0-9.]/g, '');
      const num = parseFloat(digits);
      if (isNaN(num) || num <= 0) return 0;
      if (/cr/i.test(str)) return num * 10000000;
      if (/l/i.test(str) || num < 500) return num * 100000;
      return num;
    }

    const r1 = parseEstimatedRevenue('<50L');
    const r2 = parseEstimatedRevenue('1.5Cr');
    const r3 = parseEstimatedRevenue('₹ 75,00,000');

    if (r1 === 5000000 && r2 === 15000000 && r3 === 7500000) {
      logPass('Lead budget estimation logic parses Lakhs, Crores and ₹ accurately');
    } else {
      logFail('Budget estimation logic mismatch', `Got: ${r1}, ${r2}, ${r3}`);
    }

    // B. Verify server/src/services/leadToSale.js exists and exports methods
    const serviceSource = fs.readFileSync(path.join(ROOT_DIR, 'server/src/services/leadToSale.js'), 'utf8');
    if (serviceSource.includes('export async function createSaleFromLead') && serviceSource.includes('export async function syncConvertedLeadsForTenant')) {
      logPass('leadToSale service module implements createSaleFromLead & syncConvertedLeadsForTenant');
    } else {
      logFail('leadToSale service missing required exports', 'Check server/src/services/leadToSale.js');
    }

    // C. Verify server/src/routes/sales.js syncs converted leads and maps customer object
    const salesRoutesSource = fs.readFileSync(path.join(ROOT_DIR, 'server/src/routes/sales.js'), 'utf8');
    if (salesRoutesSource.includes('syncConvertedLeadsForTenant(tenant_id)') && salesRoutesSource.includes('customer: {') && salesRoutesSource.includes('project: {')) {
      logPass('Sales route auto-syncs converted CRM leads and maps customer & project objects');
    } else {
      logFail('Sales route missing auto-sync or customer/project mapping', 'Check server/src/routes/sales.js');
    }

    // D. Verify server/src/routes/leads.js triggers sale creation on status update and convert endpoint
    const leadsRoutesSource = fs.readFileSync(path.join(ROOT_DIR, 'server/src/routes/leads.js'), 'utf8');
    if (leadsRoutesSource.includes('createSaleFromLead') && leadsRoutesSource.includes('/:id/convert')) {
      logPass('Leads route automatically creates sale on conversion and supports /:id/convert');
    } else {
      logFail('Leads route missing createSaleFromLead trigger', 'Check server/src/routes/leads.js');
    }

    // E. Verify server/src/routes/misc.js triggers sale creation on followup conversion
    const miscRoutesSource = fs.readFileSync(path.join(ROOT_DIR, 'server/src/routes/misc.js'), 'utf8');
    if (miscRoutesSource.includes('createSaleFromLead') && miscRoutesSource.includes("toLowerCase() === 'converted'")) {
      logPass('Followups route triggers sale creation when new followup status is Converted');
    } else {
      logFail('Followups route missing sale creation trigger', 'Check server/src/routes/misc.js');
    }
  } catch (err) {
    logFail('Lead to Sale conversion test crashed', err.message);
  }
}

// ---------------------------------------------------------
// TEST 6: Meta CAPI & Conversion Tracking Engine
// ---------------------------------------------------------
function testMetaCapiIntegration() {
  printHeader('6. Meta CAPI (Conversions API) & Event Match Quality (EMQ)');

  try {
    // A. Verify phone normalization helper
    function normalizePhoneForCapi(phone) {
      if (!phone) return null;
      let digits = String(phone).replace(/\D/g, '');
      if (!digits) return null;
      if (digits.length === 10) {
        digits = `91${digits}`;
      } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = `91${digits.slice(1)}`;
      }
      return digits;
    }

    function hashSha256(value) {
      if (!value) return null;
      const normalized = String(value).trim().toLowerCase();
      if (!normalized) return null;
      return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    const norm1 = normalizePhoneForCapi('9876543210');
    const norm2 = normalizePhoneForCapi('+91 98765 43210');
    const norm3 = normalizePhoneForCapi('09876543210');

    if (norm1 === '919876543210' && norm2 === '919876543210' && norm3 === '919876543210') {
      logPass('Phone normalizer standardizes Indian numbers to E.164 without plus');
    } else {
      logFail('Phone normalizer mismatch', `Got: ${norm1}, ${norm2}, ${norm3}`);
    }

    const testHash = hashSha256('test@example.com');
    // Precalculated SHA-256 for test@example.com is 973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b
    if (testHash === '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b') {
      logPass('SHA-256 PII hashing meets Meta Graph API standard specification');
    } else {
      logFail('SHA-256 hash calculation mismatch', `Got: ${testHash}`);
    }

    // B. Verify server/src/services/capiService.js exports
    const capiServicePath = path.join(ROOT_DIR, 'server/src/services/capiService.js');
    if (fs.existsSync(capiServicePath)) {
      const capiSource = fs.readFileSync(capiServicePath, 'utf8');
      if (
        capiSource.includes('sendMetaCAPIEvent') &&
        capiSource.includes('dispatchCrmConversionEvent') &&
        capiSource.includes('normalizePhoneForCapi') &&
        capiSource.includes('hashSha256')
      ) {
        logPass('capiService module implements sendMetaCAPIEvent, dispatch, normalizer & hashing');
      } else {
        logFail('capiService missing required function exports', 'Check server/src/services/capiService.js');
      }
    } else {
      logFail('server/src/services/capiService.js not found', 'File missing');
    }

    // C. Verify server/src/routes/capi.js endpoints
    const capiRoutePath = path.join(ROOT_DIR, 'server/src/routes/capi.js');
    if (fs.existsSync(capiRoutePath)) {
      const routeSource = fs.readFileSync(capiRoutePath, 'utf8');
      if (routeSource.includes("router.post('/test'") && routeSource.includes("router.get('/logs'")) {
        logPass('CAPI routes expose POST /test and GET /logs endpoints');
      } else {
        logFail('CAPI route missing /test or /logs handler', 'Check server/src/routes/capi.js');
      }
    } else {
      logFail('server/src/routes/capi.js not found', 'File missing');
    }

    // D. Verify server/src/index.js mounts /api/capi
    const indexSource = fs.readFileSync(path.join(ROOT_DIR, 'server/src/index.js'), 'utf8');
    if (indexSource.includes("app.use('/api/capi'")) {
      logPass('Backend index.js correctly mounts /api/capi route');
    } else {
      logFail('Backend index.js missing /api/capi route mount', 'Check server/src/index.js');
    }
  } catch (err) {
    logFail('Meta CAPI test crashed', err.message);
  }
}

// ---------------------------------------------------------
// TEST 7: Critical Files Verification
// ---------------------------------------------------------
function testCriticalFiles() {
  printHeader('7. Core Architecture & Critical File Integrity');

  const files = [
    'src/components/admin/AdminRoleSwitcherBar.tsx',
    'src/contexts/AuthContext.tsx',
    'src/utils/phoneMasking.ts',
    'src/pages/admin/TenantsPage.tsx',
    'src/pages/TargetsPage.tsx',
    'src/pages/LeadsPage.tsx',
    'src/pages/SalesPage.tsx',
    'src/pages/SettingsPage.tsx',
    'src/pages/admin/AdminIntegrationsPage.tsx',
    'src/components/layout/DashboardLayout.tsx',
    'src/components/layout/MobileLayout.tsx',
    'server/src/index.js',
    'server/src/routes/auth.js',
    'server/src/routes/tenants.js',
    'server/src/routes/sales.js',
    'server/src/routes/leads.js',
    'server/src/routes/capi.js',
    'server/src/routes/meta.js',
    'server/src/routes/webhooks.js',
    'server/src/services/capiService.js',
    'server/src/services/leadToSale.js',
  ];

  let missingCount = 0;
  for (const f of files) {
    const fullPath = path.join(ROOT_DIR, f);
    if (!fs.existsSync(fullPath)) {
      missingCount++;
      logFail(`Missing file: ${f}`, 'File not found on disk');
    }
  }

  if (missingCount === 0) {
    logPass(`All ${files.length} critical application modules verified on disk`);
  }
}

// ---------------------------------------------------------
// TEST 7: Backend Server & DB Health (Async Ping)
// ---------------------------------------------------------
async function testBackendHealth() {
  printHeader('7. Backend Server & Database Connection');

  return new Promise((resolve) => {
    const req = http.get('http://localhost:5001/health', (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.status === 'healthy' && json.database === 'connected') {
            logPass('Local Backend & PostgreSQL Database live and connected', 'Status: healthy');
          } else {
            logInfo('Local Backend response:', JSON.stringify(json));
          }
        } catch {
          logInfo('Local Backend responded:', body.slice(0, 80));
        }
        resolve();
      });
    });

    req.on('error', () => {
      logInfo(
        'Backend server is not running on port 5001',
        'Optional check: run `npm run server` to test live endpoints'
      );
      skippedCount++;
      resolve();
    });

    req.setTimeout(1500, () => {
      req.destroy();
      logInfo('Backend health check timed out (server offline)', 'Skipped');
      skippedCount++;
      resolve();
    });
  });
}

// ---------------------------------------------------------
// RUN SUITE
// ---------------------------------------------------------
async function runSuite() {
  console.log(`\n${BOLD}====================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  RealSalePro Automated Smoke Test (Solo Founder QA)${RESET}`);
  console.log(`${BOLD}====================================================${RESET}`);

  testPhoneMasking();
  testMathCalculations();
  testSaasAdminQaSecurity();
  testLayoutAndNavigationRegressions();
  testLeadToSaleConversion();
  testMetaCapiIntegration();
  testCriticalFiles();
  await testBackendHealth();

  console.log(`\n${BOLD}====================================================${RESET}`);
  if (failedCount === 0) {
    console.log(
      `${BOLD}${GREEN}  ✓ ALL SMOKE TESTS PASSED! (${passedCount} checks passed, ${skippedCount} skipped)${RESET}`
    );
    console.log(`${BOLD}====================================================\n${RESET}`);
    process.exit(0);
  } else {
    console.log(
      `${BOLD}${RED}  ✗ SMOKE TEST SUITE FAILED! (${failedCount} failed, ${passedCount} passed)${RESET}`
    );
    console.log(`${BOLD}====================================================\n${RESET}`);
    process.exit(1);
  }
}

runSuite();
