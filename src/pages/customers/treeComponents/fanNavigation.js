import { FAN_MAX_DEPTH, fanChildren } from './fanLayout.js';

export function canExpandFanNode(node, pages, legNames) {
  if (!node || node.empty || node.summary) return false;
  const page = pages.get(String(node.nodeId));
  if (page?.done) return fanChildren(node.nodeId, page, legNames).length > 0;
  return node.totalChildNodes > 0 ||
    legNames.some(leg => String(leg).toLowerCase() !== 'holding tank');
}

// Placement slots and children excluded from this tree view are not descendants
// to advertise. Until a page is complete, the server count can indicate more.
export function fanBranchIndicator(node, depth, pages, expanded) {
  if (!node?.customer || node.empty) return null;
  const id = String(node.nodeId);
  const page = pages.get(id);
  const hasLoadedChildren = page?.nodes?.some(child => child.customer && !child.empty &&
    String(child.uplineLeg).toLowerCase() !== 'holding tank');
  const hasChildren = hasLoadedChildren || (!page?.done && node.totalChildNodes > 0);
  if (!hasChildren) return null;
  return depth >= FAN_MAX_DEPTH || !expanded.has(id) || !page?.done ? 'more' : 'children';
}

// Expand the nearest closed generation first, without recursively loading an
// entire downline. The view limit applies relative to the current focus.
export function nextFanLevel(sectors, pages, expanded, legNames) {
  const candidates = sectors.filter(({ node, depth }) => depth < FAN_MAX_DEPTH &&
    !expanded.has(String(node.nodeId)) && canExpandFanNode(node, pages, legNames));
  const depth = Math.min(...candidates.map(sector => sector.depth));
  return candidates.filter(sector => sector.depth === depth).map(sector => sector.node);
}

export function fanAncestorPath(node, nodes) {
  const path = [];
  const seen = new Set();
  while (node && !seen.has(String(node.nodeId))) {
    path.unshift(node);
    seen.add(String(node.nodeId));
    node = node.uplineId == null ? null : nodes.get(String(node.uplineId));
  }
  return path;
}
