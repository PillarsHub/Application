export const FAN_ROOT_RADIUS = 90;
export const FAN_RING_WIDTH = 110;
export const FAN_MAX_DEPTH = 4;
export const FAN_GROUP_CHILD_LIMIT = 8;
export const FAN_CHILDREN_PER_PAGE = 15;
const FAN_MIN_CHILD_WIDTH = 24;
// Wrap below the center on both sides, leaving a 120-degree opening below.
export const FAN_START_ANGLE = -210 * Math.PI / 180;
export const FAN_END_ANGLE = 30 * Math.PI / 180;

// Keep configured legs in order and show empty placement slots only once all
// pages have loaded; otherwise an unseen child could look like an empty leg.
export function fanChildren(parentId, page, legNames = []) {
  const children = (page?.nodes || []).filter(node =>
    node.customer && String(node.uplineLeg).toLowerCase() !== 'holding tank'
  );
  const legs = legNames.filter(leg => String(leg).toLowerCase() !== 'holding tank');
  const result = [];
  const known = new Set(legs.map(leg => String(leg).toLowerCase()));
  for (const leg of legs) {
    const matches = children.filter(node => String(node.uplineLeg).toLowerCase() === String(leg).toLowerCase());
    result.push(...matches);
    if (!matches.length && page?.done && !page.occupiedLegs?.has(String(leg).toLowerCase())) {
      result.push({ key: `empty:${parentId}:${leg}`, uplineId: parentId, uplineLeg: leg, empty: true });
    }
  }
  result.push(...children.filter(node => !known.has(String(node.uplineLeg).toLowerCase())));
  return result;
}

// Keep server order for paged families so each page can appear immediately
// without fetching every child. Small families retain configured leg slots.
export function fanChildPage(root, page, legNames, index = 0) {
  const children = (page?.nodes || []).filter(node => node.customer &&
    String(node.uplineLeg).toLowerCase() !== 'holding tank' && String(node.nodeId) !== String(root?.nodeId));
  const pageIndex = Math.min(Math.max(0, index), Math.max(0, Math.ceil(children.length / FAN_CHILDREN_PER_PAGE) - 1));
  const start = pageIndex * FAN_CHILDREN_PER_PAGE;
  const end = Math.min(start + FAN_CHILDREN_PER_PAGE, children.length);
  const paged = children.length > FAN_CHILDREN_PER_PAGE || page && !page.done;
  const serverTotal = Number(root?.totalChildNodes);
  const filtered = page?.hiddenCustomers || children.length !== (page?.nodes.length || 0);
  const total = page?.done ? children.length : !filtered && Number.isSafeInteger(serverTotal) && serverTotal >= children.length
    ? serverTotal : null;
  return { index: pageIndex, start, end, loaded: children.length, total, paged: Boolean(paged),
    hasNext: end < children.length || Boolean(page && !page.done),
    children: paged ? children.slice(start, end) : fanChildren(root?.nodeId, page, legNames) };
}

export function layoutFan(root, pages, expanded, legNames, maxDepth = FAN_MAX_DEPTH, rootPageIndex = null) {
  if (!root) return [];
  const sectors = [];
  const addSummary = (node, depth, start, end, branch, count, hasMore = false, descendants = false) => {
    const parentName = node.customer?.fullName || String(node.nodeId);
    const noun = descendants ? 'total' : 'direct';
    const total = Number(node.totalNodes);
    // Compare server totals, not the number of children loaded so far.
    const showDescendants = !descendants && Number.isSafeInteger(total) && total > 0 &&
      total !== Number(node.totalChildNodes);
    const summary = {
      key: `summary:${node.nodeId}`, summary: true, parentId: String(node.nodeId),
      parentName, hasMore,
      ...(descendants ? { descendantCount: count } : { childCount: count }),
      label: count == null ? (descendants ? 'Total' : 'Direct') : `${count}${hasMore ? '+' : ''} ${noun}`,
      detailLabel: showDescendants ? `${total} total` : '',
      countDescription: descendants ? 'Total: Across all levels below this position.' :
        `Direct: Immediately below this position.${showDescendants ? ' Total: Across all levels below this position.' : ''}`,
      instruction: descendants ? `Focus on ${parentName} to explore this branch.` :
        `Focus on ${parentName} to see direct connections.`
    };
    sectors.push({ node: summary, key: summary.key, depth: depth + 1, start, end, branch });
  };
  const visit = (node, depth, start, end, branch, ancestors) => {
    const key = node.key || String(node.nodeId);
    if (ancestors.has(key)) return;
    sectors.push({ node, key, depth, start, end, branch });
    if (node.empty || node.summary) return;
    const page = pages.get(String(node.nodeId));
    const nextAncestors = new Set([...ancestors, key]);
    const rootWindow = depth === 0 && rootPageIndex !== null ? fanChildPage(root, page, legNames, rootPageIndex) : null;
    const children = (rootWindow ? rootWindow.children : fanChildren(node.nodeId, page, legNames)).filter(child =>
      child.empty || !nextAncestors.has(String(child.nodeId)));
    const customerCount = children.filter(child => !child.empty).length;
    // Cached children decide whether a branch is visible, but only the server's
    // totalNodes counts all descendants. Pagination must not change that total.
    if (depth >= maxDepth) {
      if (customerCount || (!page?.done && (node.totalChildNodes > 0 || node.totalNodes > 0))) {
        const total = Number(node.totalNodes);
        const count = Number.isSafeInteger(total) && total > 0 ? total : null;
        addSummary(node, depth, start, end, branch, count, false, true);
      }
      return;
    }
    if (!expanded.has(String(node.nodeId))) return;
    const step = (end - start) / children.length;
    const childRadius = FAN_ROOT_RADIUS + (depth + 0.5) * FAN_RING_WIDTH;
    const childWidth = 2 * childRadius * Math.sin(Math.min(step / 2, Math.PI / 2));
    // Work in fan coordinates, so zoom never changes the grouping. Focusing
    // this parent reveals its immediate children, even when the branch is wide.
    if (depth > 0 && customerCount > 1 &&
      (customerCount > FAN_GROUP_CHILD_LIMIT || childWidth < FAN_MIN_CHILD_WIDTH)) {
      addSummary(node, depth, start, end, branch, customerCount, !page.done);
      return;
    }
    children.forEach((child, index) => visit(
      child, depth + 1, start + index * step, start + (index + 1) * step,
      depth === 0 ? index + (rootWindow?.start || 0) : branch, nextAncestors
    ));
  };
  visit(root, 0, FAN_START_ANGLE, FAN_END_ANGLE, 0, new Set());
  return sectors;
}

export function fanPoint(radius, angle) {
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

// Decorative gaps stay separate from customer data and expansion budgets.
// Children partition their parent's full arc; where a branch ends, carry that
// arc outward only as far as the deepest ring already on screen.
export function fanPlaceholders(sectors) {
  if (!sectors.length) return [];
  const placeholders = [];
  const lastDepth = Math.max(1, ...sectors.map(sector => sector.depth));
  let previous = sectors.filter(sector => sector.depth === 0);
  for (let depth = 1; depth <= lastDepth; depth++) {
    const current = sectors.filter(sector => sector.depth === depth);
    const gaps = previous.filter(parent => !current.some(child =>
      child.start >= parent.start - 1e-10 && child.end <= parent.end + 1e-10
    )).map(parent => ({
      key: `gap:${depth}:${parent.key}`, depth, start: parent.start, end: parent.end
    }));
    placeholders.push(...gaps);
    previous = [...current, ...gaps];
  }
  return placeholders;
}

// The fifth ring is a continuation hint, so give it half the radial space.
// Share these bounds between paths, label fitting and the chart's viewBox.
export function fanRingRadii(depth, widthScale = 1) {
  if (depth === 0) return { inner: 0, outer: FAN_ROOT_RADIUS };
  const inner = FAN_ROOT_RADIUS + (depth - 1) * FAN_RING_WIDTH;
  return { inner, outer: inner + FAN_RING_WIDTH * (depth > FAN_MAX_DEPTH ? 0.5 : 1) * widthScale };
}

export function fanSectorPath(depth, start, end, widthScale = 1) {
  if (depth === 0) {
    const r = FAN_ROOT_RADIUS;
    return `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 Z`;
  }
  const { inner, outer } = fanRingRadii(depth, widthScale);
  const a = fanPoint(outer, start);
  const b = fanPoint(outer, end);
  const c = fanPoint(inner, end);
  const d = fanPoint(inner, start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y}` +
    (inner ? ` A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y}` : '') + ' Z';
}
