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
  
  // Clone profiles into OrgNodes with resilient id matching (_id and id)
  (profiles || []).forEach(p => {
    const key = String((p as any)._id || p.id || '');
    if (key) {
      const node: OrgNode = {
        ...p,
        id: key,
        _id: key as any,
        children: []
      };
      profileMap.set(key, node);
      // Also map secondary id if different
      if (p.id && String(p.id) !== key) profileMap.set(String(p.id), node);
      if ((p as any)._id && String((p as any)._id) !== key) profileMap.set(String((p as any)._id), node);
    }
  });

  const roots: OrgNode[] = [];
  const processed = new Set<string>();

  profileMap.forEach(node => {
    const nodeKey = String(node._id || node.id);
    if (processed.has(nodeKey)) return;
    processed.add(nodeKey);

    const managerId = node.reporting_manager_id ? String(node.reporting_manager_id) : null;
    if (managerId && profileMap.has(managerId) && managerId !== nodeKey) {
      const manager = profileMap.get(managerId);
      if (manager && manager.children) {
        // Prevent duplicate child insertions
        const alreadyChild = manager.children.some(c => String(c._id || c.id) === nodeKey);
        if (!alreadyChild) {
          manager.children.push(node);
        }
      }
    } else {
      roots.push(node);
    }
  });

  if (rootId) {
    const targetKey = String(rootId);
    if (profileMap.has(targetKey)) {
      const specificRoot = profileMap.get(targetKey);
      return specificRoot ? [specificRoot] : [];
    }
  }

  return roots;
}
