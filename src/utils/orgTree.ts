import { Profile } from '../types/database';

export interface OrgNode extends Profile {
  children?: OrgNode[];
}

/**
 * Builds a hierarchical tree from a flat list of profiles.
 * @param profiles Flat list of profiles
 * @param rootId The root manager ID to start the tree from. If null, find roots (those with no manager or manager not in list).
 */
export function buildOrgTree(profiles: Profile[], rootId: string | null = null): OrgNode[] {
  const profileMap = new Map<string, OrgNode>();
  
  // Clone profiles into OrgNodes
  profiles.forEach(p => {
    profileMap.set(p.id, { ...p, children: [] });
  });

  const roots: OrgNode[] = [];

  profileMap.forEach(node => {
    const managerId = node.reporting_manager_id;
    if (managerId && profileMap.has(managerId)) {
      const manager = profileMap.get(managerId);
      manager?.children?.push(node);
    } else {
      // If no manager or manager not in the current set, it's a root for this view
      roots.push(node);
    }
  });

  if (rootId && profileMap.has(rootId)) {
    // If a specific rootId is requested, return only that branch
    const specificRoot = profileMap.get(rootId);
    return specificRoot ? [specificRoot] : [];
  }

  return roots;
}
