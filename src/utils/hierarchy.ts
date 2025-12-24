import { supabase } from '../lib/supabase';

/**
 * Fetches all subordinate profile IDs for a given manager ID recursively.
 * Optimization: Fetches all profiles for the tenant once and builds tree in memory.
 * This is efficient for up to a few thousand profiles.
 */
export async function getSubordinateIds(managerId: string, tenantId: string): Promise<string[]> {
  try {
    // 1. Fetch all profiles for this tenant
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, reporting_manager_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error || !profiles) {
      console.error('Error fetching profiles for hierarchy:', error);
      return [];
    }

    // 2. Build adjacency list
    const managerToSubordinates = new Map<string, string[]>();
    profiles.forEach(p => {
      if (p.reporting_manager_id) {
        const subs = managerToSubordinates.get(p.reporting_manager_id) || [];
        subs.push(p.id);
        managerToSubordinates.set(p.reporting_manager_id, subs);
      }
    });

    // 3. Recursive traversal to find all descendants
    const subordinateIds: string[] = [];
    const stack = [managerId];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const subs = managerToSubordinates.get(currentId) || [];
      subs.forEach(subId => {
        subordinateIds.push(subId);
        stack.push(subId);
      });
    }

    return subordinateIds;
  } catch (error) {
    console.error('Hierarchy error:', error);
    return [];
  }
}
