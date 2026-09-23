import { FAN_CHILDREN_PER_PAGE, FAN_MAX_DEPTH, fanChildPage, layoutFan } from './fanLayout.js';
import { canExpandFanNode } from './fanNavigation.js';

export const FAN_AUTO_NODE_LIMIT = 200;
export const FAN_REQUEST_LIMIT = 4;
export const FAN_PAGE_SIZE = 100;

// Shared by automatic and manual loads, including requests from a previous
// focus/date that are still finishing. Cancelled queued requests never start.
export function createFanRequestQueue(limit = FAN_REQUEST_LIMIT) {
  let active = 0;
  const waiting = [];
  function drain() {
    while (active < limit && waiting.length) {
      const entry = waiting.shift();
      if (!entry.isActive()) { entry.resolve(undefined); continue; }
      active++;
      Promise.resolve().then(() => entry.isActive() ? entry.task() : undefined).then(entry.resolve, entry.reject).finally(() => {
        active--;
        drain();
      });
    }
  }
  return (task, isActive) => new Promise((resolve, reject) => {
    waiting.push({ task, isActive, resolve, reject });
    drain();
  });
}

export async function autoExpandFan({ root, pages, getExpanded, legNames, loadChildren, expand, isActive,
  nodeLimit = FAN_AUTO_NODE_LIMIT, rootPageIndex = null }) {
  let limited = false;
  let reserved = 0;
  const legSlots = legNames.filter(leg => String(leg).toLowerCase() !== 'holding tank').length;
  const visible = () => layoutFan(root, pages, getExpanded(), legNames, FAN_MAX_DEPTH, rootPageIndex);

  if (rootPageIndex !== null) {
    const id = String(root.nodeId);
    // Fetch only enough children for this page and one extra to detect the
    // next page. Bound scans through filtered records and reuse cached pages.
    const target = (rootPageIndex + 1) * FAN_CHILDREN_PER_PAGE + 1;
    for (let batches = 0; batches < 10 && isActive(); batches++) {
      const page = pages.get(id);
      const loaded = fanChildPage(root, page, legNames, rootPageIndex).loaded;
      if (page?.done || loaded >= target || (!page && !canExpandFanNode(root, pages, legNames))) break;
      const result = await loadChildren(id, { count: Math.min(FAN_PAGE_SIZE, target - loaded), isActive });
      if (!result) return { limited: false }; // Leave failures for the explicit Retry action.
    }
  }

  // Finish each generation before discovering the next one. Publish completed
  // branches immediately, without waiting for the slowest request in a level.
  for (let depth = 0; depth < FAN_MAX_DEPTH && isActive(); depth++) {
    const queue = visible().filter(sector => sector.depth === depth &&
      canExpandFanNode(sector.node, pages, legNames) &&
      (!getExpanded().has(sector.key) || !pages.has(sector.key))).map(sector => sector.node);
    await Promise.all(Array.from({ length: Math.min(FAN_REQUEST_LIMIT, queue.length) }, async () => {
      while (isActive() && queue.length) {
        const node = queue[0];
        const id = String(node.nodeId);
        if (!pages.has(id)) {
          const available = nodeLimit - visible().length - reserved;
          // Reserve room for the response and any empty leg placeholders.
          // Leave the item queued while other workers can free reservations.
          if (available <= legSlots) {
            if (reserved) return;
            limited = true;
            queue.shift();
            continue;
          }
          queue.shift();
          const estimate = (Math.max(legSlots, Number(node.totalChildNodes) || 0) || FAN_PAGE_SIZE) + 1;
          const count = Math.min(FAN_PAGE_SIZE, available - legSlots, estimate);
          const reservation = count + legSlots;
          reserved += reservation;
          try {
            await loadChildren(id, { count, isActive });
          } finally {
            reserved -= reservation;
          }
        } else {
          queue.shift();
        }
        if (!isActive()) return;
        if (!pages.has(id)) continue; // A failed branch remains available for Retry.
        const next = new Set(getExpanded()).add(id);
        if (layoutFan(root, pages, next, legNames, FAN_MAX_DEPTH, rootPageIndex).length > nodeLimit) {
          limited = true;
          continue;
        }
        expand(id);
        if (!pages.get(id).done && visible().length >= nodeLimit) limited = true;
      }
    }));
  }
  return { limited };
}
