import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://supa.synergybrandarchitect.in';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase Credentials in .env');
}

// Clients for two different users
const clientA = createClient(SUPABASE_URL, SUPABASE_KEY);
const clientB = createClient(SUPABASE_URL, SUPABASE_KEY);

const emailA = `audit_a_${uuidv4()}@example.com`;
const emailB = `audit_b_${uuidv4()}@example.com`;
const password = 'Password123!';

describe('Multi-Tenancy Security Audit', () => {
    
  it('should prevent Tenant B from accessing Tenant A data', async () => {
    // 1. SignUp User A
    const { data: authA, error: errA } = await clientA.auth.signUp({
      email: emailA,
      password: password,
      options: {
        data: {
          employee_id: `EMP_A_${uuidv4()}`
        }
      }
    });
    if (errA) throw errA;
    // Note: If email confirmation is required, this might fail or hang. 
    // We assume dev environment allows login or auto-confirm.
    // If 'session' is null, we can't proceed.
    
    if(!authA.session) {
        console.warn('Skipping test: User A session not created (Email confirmation likely required).');
        return; 
    }

    // 2. Register Tenant A
    const { error: regA } = await clientA.rpc('register_tenant', {
      company_name: 'Tenant A Corp',
      company_slug: `tenant-a-${uuidv4()}`,
      user_full_name: 'User A'
    });
    if (regA) throw regA;

    // 3. Insert Data as User A (into 'projects' table)
    const { data: projectA, error: insertError } = await clientA
      .from('projects')
      .insert({
        name: 'Secret Project A',
        status: 'Running',
        // tenant_id should be auto-assigned by trigger or default
      })
      .select()
      .single();
      
    if (insertError) throw insertError;
    expect(projectA).toBeDefined();
    expect(projectA.name).toBe('Secret Project A');
    
    // 4. SignUp User B
    const { data: authB, error: errB } = await clientB.auth.signUp({
      email: emailB,
      password: password,
       options: {
        data: {
          employee_id: `EMP_B_${uuidv4()}`
        }
      }
    });
    if (errB) throw errB;
     if(!authB.session) {
        console.warn('Skipping test: User B session not created.');
        return; 
    }

    // 5. Register Tenant B
    const { error: regB } = await clientB.rpc('register_tenant', {
      company_name: 'Tenant B Corp',
      company_slug: `tenant-b-${uuidv4()}`,
      user_full_name: 'User B'
    });
    if (regB) throw regB;

    // 6. ATTACK: User B tries to read User A's project
    const { data: leakedData, error: readError } = await clientB
      .from('projects')
      .select('*')
      .eq('id', projectA.id); // Try to fetch by specifically known ID

    // EXPECTATION: 
    // Data should be empty string or null or empty array depending on library version, 
    // but definitely NOT containing the record.
    // Supabase returns [] for no matches.
    
    expect(readError).toBeNull();
    expect(leakedData).toEqual([]);
  }, 60000); // 60s timeout
});
