import React, { useMemo, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";

/* ---------------- Tunables ---------------- */
const VIEWBOX_INITIAL = { x: 0, y: 0, w: 1600, h: 1000 };
const ZOOM_ID_ONLY = 0.6;                 // when zoom <= this, show only valueId in nodes
const GROUP_COLLAPSE_ZOOM = 0.85;         // when zoom <= this, render groups collapsed
const CLICK_THRESHOLD_PX = 6;             // click vs drag threshold

// Node size
const NODE_WIDTH_PX = 240;
const NODE_HEIGHT_PX = 72;

// Snap every half node height
const GRID_SNAP_STEP = NODE_HEIGHT_PX / 2; // 36
const GRID_SNAP_OFFSET_X = 0;
const GRID_SNAP_OFFSET_Y = 0;

// Rank special node
const RANK_NODE_ID = "Rank";
const RANK_FILL = "#fff7ed";
const RANK_STROKE = "#f59e0b";
const RANK_TEXT = "#7c2d12";

// Bonus special styling
const BONUS_FILL = "#ecfdf5";
const BONUS_STROKE = "#10b981";
const BONUS_TEXT = "#065f46";

// Group visuals
const GROUP_PAD = 20;                     // padding around member bbox
const GROUP_FILL = "#f8f9fa";
const GROUP_STROKE = "#adb5bd";
const GROUP_LABEL_BG = "#0d6efd";
const GROUP_LABEL_FG = "#ffffff";

// Layout defaults for auto placement
const LAYER_SPACING_Y = 140;
const COLUMN_SPACING_X = 260;
const BASE_X = 160;
const BASE_Y = 80;

// Scale members when they are inside a (visible) group
const GROUP_MEMBER_SCALE = 0.25;

// Group header/title sizes
const GROUP_LABEL_FONT_EXPANDED = 14;   // when zoomed-in (contents visible)
const GROUP_TITLE_FONT_COLLAPSED = 40;  // when zoomed-out (collapsed) → twice the old 20


/* ---------------- Helpers ---------------- */

// Snap helper
const snap = (v, step, offset = 0) =>
  Math.round((v - offset) / step) * step + offset;

/** Build a case-insensitive canonicalizer for valueIds. */
function buildCanon(defs, extraIds = []) {
  const canon = new Map();
  for (const d of defs) {
    const k = String(d.valueId).toLowerCase();
    if (!canon.has(k)) canon.set(k, d.valueId);
  }
  for (const ex of extraIds) {
    const k = String(ex).toLowerCase();
    if (!canon.has(k)) canon.set(k, ex); // don't override real defs
  }
  return (x) => {
    if (x == null) return undefined;
    const k = String(x).trim().toLowerCase();
    return canon.get(k);
  };
}

/** Extract referenced canonical valueIds from a formula string using toCanon */
function extractReferencedIds(formula, toCanon) {
  if (typeof formula !== "string" || !formula) return [];
  const tokens = formula.match(/[A-Za-z0-9_]+/g) || [];
  const out = [];
  const seen = new Set();
  for (const t of tokens) {
    const c = toCanon(t);
    if (c && !seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/* --------------- Signature + persistence --------------- */
function computeSignature(defs, ranks = [], bonusDefinitions = []) {
  const toCanon = buildCanon(defs, (Array.isArray(ranks) && ranks.length) ? [RANK_NODE_ID] : []);

  const ids = defs
    .map(d => d.valueId)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const edges = [];

  for (const def of defs) {
    const childId = def.valueId;
    const childLC = childId.toLowerCase();

    // Formula params
    const formulaParams = (def.parameters || []).filter(
      p => p && typeof p.id === "string" && p.id.toLowerCase() === "formula"
    );
    for (const fp of formulaParams) {
      for (const r of extractReferencedIds(fp.value, toCanon)) {
        if (r.toLowerCase() === childLC) continue;
        edges.push(`${r}->${childId}`);
      }
    }

    // Direct param refs (comma-separated supported)
    for (const p of def.parameters || []) {
      if (typeof p.value !== "string" || !p.value) continue;
      const candidates = p.value.split(",").map(s => s.trim()).filter(Boolean);
      for (const v of candidates) {
        const c = toCanon(v);
        if (!c) continue;
        if (c.toLowerCase() === childLC) continue;
        edges.push(`${c}->${childId}`);
      }
    }
  }

  // Rank
  if (Array.isArray(ranks) && ranks.length) {
    const rankParents = new Set();
    for (const r of ranks) {
      const req = r && r.requirement ? r.requirement : {};
      for (const key of ["groupVolumeKey", "legVolumeKey", "qualVolumeKey", "personalVolumeKey"]) {
        const raw = req[key];
        if (!raw) continue;
        const c = toCanon(raw);
        if (c) rankParents.add(c);
      }
    }
    for (const p of rankParents) edges.push(`${p}->${RANK_NODE_ID}`);
    ids.push(RANK_NODE_ID);
  }

  // Bonuses
  if (Array.isArray(bonusDefinitions) && bonusDefinitions.length) {
    for (const b of bonusDefinitions) {
      ids.push(b.id);
      if (b.volumeKey) {
        const c = toCanon(b.volumeKey);
        if (c) edges.push(`${c}->${b.id}`);
      }
      const sections = [
        ...(b.generationBonuses || []),
        ...(b.rollingBonuses || []),
        ...(b.binaryBonuses || []),
        ...(b.poolBonus || []),
      ];
      for (const sec of sections) {
        const qs = sec?.qualifications || [];
        for (const q of qs) {
          const k = q?.key;
          if (!k) continue;
          const c = toCanon(k);
          if (c) edges.push(`${c}->${b.id}`);
        }
      }
    }
  }

  edges.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const canonical = JSON.stringify({ ids: Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b)), edges });
  let h = 5381;
  for (let i = 0; i < canonical.length; i++) h = ((h << 5) + h) ^ canonical.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const STORAGE_PREFIX = "defFlow:v2:"; // v2 to include groups
const loadState = (setId) => { try { const raw = localStorage.getItem(STORAGE_PREFIX + setId); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const saveState = (setId, payload) => {
  try { localStorage.setItem(STORAGE_PREFIX + setId, JSON.stringify(payload)); } catch {
    //
  }
};

/* ---------------- Graph build ---------------- */
function buildGraph(defs, ranks = [], bonusDefinitions = []) {
  const byId = new Map(defs.map(d => [d.valueId, d]));
  const toCanon = buildCanon(defs, (Array.isArray(ranks) && ranks.length) ? [RANK_NODE_ID] : []);

  const edges = [];
  const indeg = new Map(defs.map(d => [d.valueId, 0]));
  const adj = new Map(defs.map(d => [d.valueId, []]));
  if (Array.isArray(ranks) && ranks.length) {
    if (!indeg.has(RANK_NODE_ID)) indeg.set(RANK_NODE_ID, 0);
    if (!adj.has(RANK_NODE_ID)) adj.set(RANK_NODE_ID, []);
  }

  // Definition edges
  for (const def of defs) {
    const childId = def.valueId;
    const childLC = childId.toLowerCase();

    // Formula refs
    const formulaParams = (def.parameters || []).filter(
      p => p && typeof p.id === "string" && p.id.toLowerCase() === "formula"
    );
    for (const fp of formulaParams) {
      const refs = extractReferencedIds(fp.value, toCanon);
      for (const r of refs) {
        if (r.toLowerCase() === childLC) continue;
        edges.push({ tail: r, head: childId, id: `${r}->${childId}:Formula` });
        indeg.set(childId, (indeg.get(childId) || 0) + 1);
        if (!adj.has(r)) adj.set(r, []);
        adj.get(r).push(childId);
      }
    }

    // Direct param refs (supports comma-separated)
    for (const p of def.parameters || []) {
      if (typeof p.value !== "string" || !p.value) continue;
      const candidates = p.value.split(",").map(s => s.trim()).filter(Boolean);
      for (const v of candidates) {
        const c = toCanon(v);
        if (!c) continue;
        if (c.toLowerCase() === childLC) continue;
        edges.push({ tail: c, head: childId, id: `${c}->${childId}:${p.id}` });
        indeg.set(childId, (indeg.get(childId) || 0) + 1);
        if (!adj.has(c)) adj.set(c, []);
        adj.get(c).push(childId);
      }
    }
  }

  // Bonus edges (defs/Rank -> bonus sinks)
  if (Array.isArray(bonusDefinitions) && bonusDefinitions.length) {
    for (const b of bonusDefinitions) {
      if (!indeg.has(b.id)) indeg.set(b.id, 0);
      if (!adj.has(b.id)) adj.set(b.id, []);

      if (b.volumeKey) {
        const c = toCanon(b.volumeKey);
        if (c && c.toLowerCase() !== b.id.toLowerCase()) {
          edges.push({ tail: c, head: b.id, id: `${c}->${b.id}:vol` });
          indeg.set(b.id, (indeg.get(b.id) || 0) + 1);
          if (!adj.has(c)) adj.set(c, []);
          adj.get(c).push(b.id);
        }
      }
      const sections = [
        ...(b.generationBonuses || []),
        ...(b.rollingBonuses || []),
        ...(b.binaryBonuses || []),
        ...(b.poolBonus || []),
      ];
      for (const sec of sections) {
        const qs = sec?.qualifications || [];
        for (const q of qs) {
          const k = q?.key;
          if (!k) continue;
          const c = toCanon(k);
          if (!c) continue;
          if (c.toLowerCase() === b.id.toLowerCase()) continue;
          edges.push({ tail: c, head: b.id, id: `${c}->${b.id}:q` });
          indeg.set(b.id, (indeg.get(b.id) || 0) + 1);
          if (!adj.has(c)) adj.set(c, []);
          adj.get(c).push(b.id);
        }
      }
    }
  }

  // Roots (indegree 0)
  let roots = Array.from(indeg.entries()).filter(([, deg]) => (deg || 0) === 0).map(([id]) => id);
  if (roots.length === 0) roots = defs.map(d => d.valueId);
  const rootSet = new Set(roots);

  // DFS order
  const seen = new Set();
  const order = [];
  function dfs(u) { if (seen.has(u)) return; seen.add(u); order.push(u); for (const v of adj.get(u) || []) dfs(v); }
  for (const r of roots) dfs(r);
  for (const d of defs) if (!seen.has(d.valueId)) dfs(d.valueId);
  if (Array.isArray(ranks) && ranks.length && !seen.has(RANK_NODE_ID)) dfs(RANK_NODE_ID);
  if (Array.isArray(bonusDefinitions)) for (const b of bonusDefinitions) if (!seen.has(b.id)) dfs(b.id);

  // Longest path layering (defs only)
  const layer = new Map(defs.map(d => [d.valueId, 0]));
  for (let i = 0; i < defs.length; i++) {
    for (const e of edges) {
      if (!layer.has(e.tail) || !layer.has(e.head)) continue;
      const lu = layer.get(e.tail) || 0, lv = layer.get(e.head) || 0;
      if (lu + 1 > lv) layer.set(e.head, lu + 1);
    }
  }

  // Buckets by layer
  const orderIndex = new Map(order.map((id, i) => [id, i]));
  const buckets = new Map();
  for (const d of defs) {
    const l = layer.get(d.valueId) || 0;
    if (!buckets.has(l)) buckets.set(l, []);
    buckets.get(l).push(d.valueId);
  }
  const sortedLayers = Array.from(buckets.keys()).sort((a, b) => a - b);
  const layers = sortedLayers.map(l => buckets.get(l).sort((a, b) => (orderIndex.get(a) - orderIndex.get(b))));

  // Initial coordinates (defs)
  const nodes = [];
  layers.forEach((ids, layerIdx) => {
    ids.forEach((id, i) => {
      nodes.push({
        id,
        x: BASE_X + i * COLUMN_SPACING_X,
        y: BASE_Y + layerIdx * LAYER_SPACING_Y,
        width: NODE_WIDTH_PX,
        height: NODE_HEIGHT_PX,
        definition: byId.get(id),
      });
    });
  });

  // Rank node
  if (Array.isArray(ranks) && ranks.length) {
    const rankParents = [];
    const seenP = new Set();
    for (const r of ranks) {
      const req = r && r.requirement ? r.requirement : {};
      for (const key of ["groupVolumeKey", "legVolumeKey", "qualVolumeKey", "personalVolumeKey"]) {
        const raw = req[key];
        if (!raw) continue;
        const c = toCanon(raw);
        if (c && !seenP.has(c)) { seenP.add(c); rankParents.push(c); }
      }
    }

    for (const p of rankParents) {
      edges.push({ tail: p, head: RANK_NODE_ID, id: `${p}->${RANK_NODE_ID}:rank` });
    }

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const parentXs = rankParents.map(id => nodeById.get(id)?.x).filter(x => typeof x === "number");
    const avgX = parentXs.length ? (parentXs.reduce((a, b) => a + b, 0) / parentXs.length) : BASE_X;
    const maxY = parentXs.length
      ? Math.max(...rankParents.map(id => (nodeById.get(id)?.y ?? BASE_Y)))
      : BASE_Y;

    nodes.push({
      id: RANK_NODE_ID,
      x: avgX,
      y: maxY + LAYER_SPACING_Y,
      width: NODE_WIDTH_PX,
      height: NODE_HEIGHT_PX,
      definition: {
        valueId: RANK_NODE_ID,
        name: "Ranks",
        componentId: "Rank",
        comment: `${ranks.length} rank${ranks.length > 1 ? "s" : ""} configured`,
        parameters: [],
      },
    });
  }

  // Bonuses as sinks
  if (Array.isArray(bonusDefinitions) && bonusDefinitions.length) {
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    for (const b of bonusDefinitions) {
      const parents = edges
        .filter(e => e.head === b.id)
        .map(e => nodeById.get(e.tail))
        .filter(Boolean);

      const avgX = parents.length
        ? parents.reduce((s, p) => s + p.x, 0) / parents.length
        : BASE_X;

      const maxY = parents.length
        ? Math.max(...parents.map(p => p.y))
        : BASE_Y;

      nodes.push({
        id: b.id,
        x: avgX,
        y: maxY + LAYER_SPACING_Y,
        width: NODE_WIDTH_PX,
        height: NODE_HEIGHT_PX,
        definition: {
          valueId: b.id,
          name: b.name || b.id,
          componentId: "Bonus",
          comment: b.description || "",
          parameters: [],
        },
      });
    }
  }

  return { nodes, edges, rootSet };
}

function roundedRectPath(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + rr} ${y}`,
    `H ${x + w - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`,
    `V ${y + h - rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`,
    `H ${x + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`,
    `V ${y + rr}`,
    `A ${rr} ${rr} 0 0 1 ${x + rr} ${y}`,
    "Z",
  ].join(" ");
}

// Closest perimeter point toward a target point (rect centered at cx,cy with w x h)
function rectPortToward(cx, cy, w, h, towardX, towardY, padOut = 0) {
  const dx = towardX - cx, dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy + h / 2 + padOut };
  const hw = w / 2, hh = h / 2;
  const s = Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  let x = cx + dx / s, y = cy + dy / s;
  if (padOut) {
    const len = Math.hypot(dx, dy) || 1;
    x += (dx / len) * padOut; y += (dy / len) * padOut;
  }
  return { x, y };
}

/* --------------- Pan/zoom via viewBox --------------- */
function usePanZoom() {
  const [viewBox, setViewBox] = useState({ ...VIEWBOX_INITIAL });
  const isPanning = useRef(false);
  const start = useRef({ x: 0, y: 0 });

  const onWheel = (e) => {
    e.preventDefault();
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - svgRect.left;
    const my = e.clientY - svgRect.top;
    // Reversed: scroll up zooms in
    const scaleFactor = Math.exp(e.deltaY * 0.0015);

    setViewBox(vb => {
      const nx = vb.x + (mx / svgRect.width) * vb.w * (1 - scaleFactor);
      const ny = vb.y + (my / svgRect.height) * vb.h * (1 - scaleFactor);
      let nw = vb.w * scaleFactor;
      let nh = vb.h * scaleFactor;
      const minW = VIEWBOX_INITIAL.w * 0.1;
      const maxW = VIEWBOX_INITIAL.w * 8;
      const clampedW = Math.min(Math.max(nw, minW), maxW);
      const clampedH = Math.min(Math.max(nh, VIEWBOX_INITIAL.h * 0.1), VIEWBOX_INITIAL.h * 8);
      const adjScaleW = clampedW / nw;
      const adjScaleH = clampedH / nh;
      return {
        x: nx + (mx / svgRect.width) * clampedW * (1 - adjScaleW),
        y: ny + (my / svgRect.height) * clampedH * (1 - adjScaleH),
        w: clampedW,
        h: clampedH,
      };
    });
  };

  const onPointerDown = (e) => {
    isPanning.current = true;
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e) => {
    if (!isPanning.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = viewBox.w / (rect.width || 1);
    const scaleY = viewBox.h / (rect.height || 1);
    const dx = (e.clientX - start.current.x) * scaleX;
    const dy = (e.clientY - start.current.y) * scaleY;
    setViewBox(v => ({ ...v, x: v.x - dx, y: v.y - dy }));
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => { isPanning.current = false; };

  return { viewBox, onWheel, onPointerDown, onPointerMove, onPointerUp };
}

/* ---------------- Main Component ---------------- */
export default function DefinitionFlowchart({ setId, definitions, ranks = [], bonusDefinitions = [] }) {
  const signature = useMemo(
    () => computeSignature(definitions || [], ranks || [], bonusDefinitions || []),
    [definitions, ranks, bonusDefinitions]
  );
  const { nodes: autoNodes, edges: rawEdges, rootSet } = useMemo(
    () => buildGraph(definitions || [], ranks || [], bonusDefinitions || []),
    [definitions, ranks, bonusDefinitions]
  );
  const { viewBox, onWheel, onPointerDown, onPointerMove, onPointerUp } = usePanZoom();
  const svgRef = useRef(null);

  // Draggable positions (persisted)
  const [nodePos, setNodePos] = useState(new Map()); // id -> {x,y}

  // Groups: array of { id, name, members: string[] }
  const [groups, setGroups] = useState([]); // persisted

  // selection: multiple ids (can include group ids)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Node dragging
  const draggingNodeId = useRef(null); // can be node id or group id
  const draggingGroupIds = useRef(new Set()); // real node ids being moved
  const groupStartPos = useRef(new Map()); // id -> {x,y}
  const pointerStartPt = useRef({ x: 0, y: 0 });
  const movedBeyondClick = useRef(false);

  // Background click vs pan
  const bgPressing = useRef(false);
  const bgStartClient = useRef({ x: 0, y: 0 });
  const bgMovedBeyondClick = useRef(false);

  // Lasso selection (Alt)
  const [lasso, setLasso] = useState(null);

  // Bonus lookup (styling + inspector)
  const byBonusId = useMemo(
    () => new Map((bonusDefinitions || []).map(b => [b.id, b])),
    [bonusDefinitions]
  );

  // Load persisted state for this setId
  useEffect(() => {
    const saved = loadState(setId);
    const map = new Map();
    if (saved && saved.signature === signature) {
      // restore positions
      if (saved.positions && typeof saved.positions === "object") {
        for (const n of autoNodes) {
          if (saved.positions[n.id]) map.set(n.id, { x: saved.positions[n.id].x, y: saved.positions[n.id].y });
        }
      }
      // restore groups
      setGroups(Array.isArray(saved.groups) ? saved.groups.filter(g => Array.isArray(g.members) && g.members.length >= 1) : []);
    } else {
      setGroups([]);
      for (const n of autoNodes) map.set(n.id, { x: n.x, y: n.y });
    }
    for (const n of autoNodes) if (!map.has(n.id)) map.set(n.id, { x: n.x, y: n.y });
    setNodePos(map);
  }, [setId, signature, autoNodes.length]);

  // Persist when positions/groups change
  useEffect(() => {
    const t = setTimeout(() => {
      saveState(setId, {
        signature,
        positions: Object.fromEntries(nodePos),
        groups,
        lastUpdated: Date.now(),
      });
    }, 300);
    return () => clearTimeout(t);
  }, [nodePos, groups, setId, signature]);

  // --- client -> SVG coords ---
  const clientToSvg = (e) => {
    const svg = svgRef.current;
    if (svg && typeof svg.getScreenCTM === "function" && svg.getScreenCTM()) {
      const pt = svg.createSVGPoint ? svg.createSVGPoint() : null;
      if (pt) {
        pt.x = e.clientX; pt.y = e.clientY;
        const inv = svg.getScreenCTM().inverse();
        const loc = pt.matrixTransform(inv);
        return { x: loc.x, y: loc.y };
      }
    }
    const rect = svg.getBoundingClientRect();
    const sx = (e.clientX - rect.left) / rect.width;
    const sy = (e.clientY - rect.top) / rect.height;
    return { x: viewBox.x + sx * viewBox.w, y: viewBox.y + sy * viewBox.h };
  };

  // Nodes with applied positions
  const nodesBase = useMemo(() => {
    const byId = new Map(autoNodes.map(n => [n.id, { ...n }]));
    for (const [id, p] of nodePos.entries()) if (byId.has(id)) { byId.get(id).x = p.x; byId.get(id).y = p.y; }
    return Array.from(byId.values());
  }, [autoNodes, nodePos]);

  // Build group metadata from current positions
  const groupsMeta = useMemo(() => {
    const mapNode = new Map(nodesBase.map(n => [n.id, n]));
    const meta = groups.map((g, idx) => {
      const members = g.members.filter(id => mapNode.has(id));
      if (members.length === 0) return null;
      const xs = members.map(id => mapNode.get(id).x);
      const ys = members.map(id => mapNode.get(id).y);

      // Use scaled node size for bbox so groups look tighter
      const halfW = (NODE_WIDTH_PX * GROUP_MEMBER_SCALE) / 2;
      const halfH = (NODE_HEIGHT_PX * GROUP_MEMBER_SCALE) / 2;

      const minX = Math.min(...xs) - halfW - GROUP_PAD;
      const maxX = Math.max(...xs) + halfW + GROUP_PAD;
      const minY = Math.min(...ys) - halfH - GROUP_PAD;
      const maxY = Math.max(...ys) + halfH + GROUP_PAD;

      const w = Math.max(120, maxX - minX);
      const h = Math.max(80, maxY - minY);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      return {
        id: g.id,
        name: g.name || `Group ${idx + 1}`,
        members,
        x: cx,
        y: cy,
        width: w,
        height: h,
      };
    }).filter(Boolean);
    return meta;
  }, [groups, nodesBase]);

  // Zoom
  const zoom = VIEWBOX_INITIAL.w / viewBox.w;
  const idOnly = zoom <= ZOOM_ID_ONLY;
  const collapsedGroupIds = useMemo(() => new Set(groupsMeta.filter(() => zoom <= GROUP_COLLAPSE_ZOOM).map(g => g.id)), [groupsMeta, zoom]);

  // Any membership (expanded or collapsed)
  const memberToGroupAll = useMemo(() => {
    const m = new Map();
    for (const g of groups) for (const id of g.members) m.set(id, g.id);
    return m;
  }, [groups]);

  // Arrowhead scale: 0.5 for nodes inside a visible group, else 1
  const effArrowScale = (node) => {
    if (node.isGroup) return 1; // never shrink group capsules
    const gId = memberToGroupAll.get(node.id);
    const collapsed = gId && collapsedGroupIds.has(gId);
    return gId && !collapsed ? GROUP_MEMBER_SCALE : 1;
  };

  // Mapping: node id -> group id (if member of a collapsed group)
  const groupIndexByMember = useMemo(() => {
    const m = new Map();
    for (const g of groupsMeta) {
      if (!collapsedGroupIds.has(g.id)) continue;
      for (const id of g.members) m.set(id, g.id);
    }
    return m;
  }, [groupsMeta, collapsedGroupIds]);

  // Nodes for render: optionally hide members of collapsed groups, and append group "capsules"
  const nodesForRender = useMemo(() => {
    const base = nodesBase.filter(n => !groupIndexByMember.has(n.id)); // hide collapsed members
    const groupCapsules = groupsMeta.map(g => ({
      id: g.id,
      x: g.x,
      y: g.y,
      width: g.width,
      height: g.height,
      isGroup: true,
      name: g.name,
      definition: { valueId: g.id, name: g.name, componentId: "Group", comment: `${g.members.length} items` },
    }));
    // Keep dragging item on top (node or group)
    const out = [...base, ...groupCapsules];
    if (draggingNodeId.current) {
      const idx = out.findIndex(n => n.id === draggingNodeId.current);
      if (idx >= 0) { const [d] = out.splice(idx, 1); out.push(d); }
    }
    return out;
  }, [nodesBase, groupsMeta, groupIndexByMember]);

  // Transform edges for groups: reroute to group when endpoint is member of a collapsed group
  const visualEdges = useMemo(() => {
    const mapped = [];
    for (const e of rawEdges) {
      if (e.tail === e.head) continue;
      const tailGroup = groupIndexByMember.get(e.tail);
      const headGroup = groupIndexByMember.get(e.head);
      // both in same collapsed group => hide
      if (tailGroup && headGroup && tailGroup === headGroup) continue;
      const tail = tailGroup || e.tail;
      const head = headGroup || e.head;
      if (tail === head) continue;
      mapped.push({ tail, head });
    }
    // merge into undirected pairs with arrow flags
    const pairs = new Map();
    for (const e of mapped) {
      const a = e.tail < e.head ? e.tail : e.head;
      const b = e.tail < e.head ? e.head : e.tail;
      const key = `${a}|${b}`;
      if (!pairs.has(key)) pairs.set(key, { a, b, from: new Set() });
      pairs.get(key).from.add(e.tail);
    }
    const list = [];
    for (const [key, v] of pairs.entries()) {
      list.push({ a: v.a, b: v.b, rid: `pair:${key}`, fromA: v.from.has(v.a), fromB: v.from.has(v.b) });
    }
    return list;
  }, [rawEdges, groupIndexByMember]);

  const singleSelectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;
  const byIdDef = useMemo(() => new Map(nodesForRender.map(n => [n.id, n.definition])), [nodesForRender]);
  const byGroupId = useMemo(() => new Map(groupsMeta.map(g => [g.id, g])), [groupsMeta]);

  const arrowAt = (x2, y2, angle, size = 16) => {
    const ax = x2, ay = y2;
    const p1x = ax - size * Math.cos(angle) + (size / 1.5) * Math.sin(angle);
    const p1y = ay - size * Math.sin(angle) - (size / 1.5) * Math.cos(angle);
    const p2x = ax - size * Math.cos(angle) - (size / 1.5) * Math.sin(angle);
    const p2y = ay - size * Math.sin(angle) + (size / 1.5) * Math.cos(angle);
    return `${p1x},${p1y} ${ax},${ay} ${p2x},${p2y}`;
  };

  /* ----- Node/group pointer down ----- */
  const handleNodePointerDown = (e, n) => {
    e.stopPropagation();
    const pt = clientToSvg(e);
    pointerStartPt.current = pt;
    movedBeyondClick.current = false;

    // If clicking a group capsule or its label, move all its members
    const gMeta = byGroupId.get(n.id);
    if (gMeta || n.isGroup) {
      const members = (gMeta?.members) || groups.find(g => g.id === n.id)?.members || [];
      draggingNodeId.current = n.id;
      draggingGroupIds.current = new Set(members);
      groupStartPos.current = new Map();
      for (const id of members) {
        const nn = nodesBase.find(x => x.id === id);
        const pos = nn ? { x: nn.x, y: nn.y } : (nodePos.get(id) || { x: 0, y: 0 });
        groupStartPos.current.set(id, pos);
      }
      e.currentTarget.setPointerCapture?.(e.pointerId);
      return;
    }

    // Regular node: group move if multi-selected includes this node
    const group = selectedIds.has(n.id) && selectedIds.size > 0
      ? new Set([...selectedIds].filter(id => !byGroupId.has(id))) // ignore group ids in selection
      : new Set([n.id]);

    draggingNodeId.current = n.id;
    draggingGroupIds.current = group;

    groupStartPos.current = new Map();
    for (const id of group) {
      const nn = nodesBase.find(x => x.id === id);
      const pos = nn ? { x: nn.x, y: nn.y } : (nodePos.get(id) || { x: n.x, y: n.y });
      groupStartPos.current.set(id, pos);
    }

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  /* ----- Background events (pan / lasso / clear) ----- */
  const handleSvgPointerDown = (e) => {
    if (e.target !== svgRef.current) return;
    const isAlt = e.altKey;
    if (isAlt) {
      const pt = clientToSvg(e);
      setLasso({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      return;
    }
    bgPressing.current = true;
    bgStartClient.current = { x: e.clientX, y: e.clientY };
    bgMovedBeyondClick.current = false;
    onPointerDown(e);
  };

  const handleSvgPointerMove = (e) => {
    // Lasso update
    if (lasso) {
      const pt = clientToSvg(e);
      setLasso(prev => prev ? { ...prev, x2: pt.x, y2: pt.y } : null);
      return;
    }

    // Dragging nodes/group
    if (draggingNodeId.current && draggingGroupIds.current.size) {
      const pt = clientToSvg(e);
      const dx = pt.x - pointerStartPt.current.x;
      const dy = pt.y - pointerStartPt.current.y;

      if (!movedBeyondClick.current && (dx * dx + dy * dy) > (CLICK_THRESHOLD_PX * CLICK_THRESHOLD_PX)) {
        movedBeyondClick.current = true;
      }

      // Snap based on an anchor node
      const anchorId = [...draggingGroupIds.current][0];
      const anchorStart = groupStartPos.current.get(anchorId);
      const rawAx = anchorStart.x + dx;
      const rawAy = anchorStart.y + dy;
      const snappedAx = snap(rawAx, GRID_SNAP_STEP, GRID_SNAP_OFFSET_X);
      const snappedAy = snap(rawAy, GRID_SNAP_STEP, GRID_SNAP_OFFSET_Y);
      const sdx = snappedAx - rawAx;
      const sdy = snappedAy - rawAy;

      const next = new Map(nodePos);
      for (const [id, startPos] of groupStartPos.current.entries()) {
        next.set(id, { x: startPos.x + dx + sdx, y: startPos.y + dy + sdy });
      }
      setNodePos(next);
      return;
    }

    // Pan
    if (!draggingNodeId.current) {
      onPointerMove(e);
      if (bgPressing.current) {
        const dx = e.clientX - bgStartClient.current.x;
        const dy = e.clientY - bgStartClient.current.y;
        if (!bgMovedBeyondClick.current && (dx * dx + dy * dy) > (CLICK_THRESHOLD_PX * CLICK_THRESHOLD_PX)) {
          bgMovedBeyondClick.current = true;
        }
      }
    }
  };

  const handleSvgPointerUp = (e) => {
    // Finish lasso
    if (lasso) {
      const { x1, y1, x2, y2 } = lasso;
      const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);

      const hit = [];
      for (const n of nodesForRender.filter(n => !n.isGroup)) {
        const gId = memberToGroupAll.get(n.id);
        const collapsed = gId && collapsedGroupIds.has(gId);
        const s = gId && !collapsed ? GROUP_MEMBER_SCALE : 1;
        const w = n.width * s;
        const h = n.height * s;

        const nx = n.x - w / 2, ny = n.y - h / 2;
        const intersects = !(nx + w < minX || nx > maxX || ny + h < minY || ny > maxY);
        if (intersects) hit.push(n.id);
      }
      setSelectedIds(prev => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          const merged = new Set(prev);
          for (const id of hit) merged.add(id);
          return merged;
        } else {
          return new Set(hit);
        }
      });

      setLasso(null);
      return;
    }

    // Click vs drag for nodes/groups
    if (draggingNodeId.current) {
      if (!movedBeyondClick.current) {
        const id = draggingNodeId.current;
        // If clicked a group capsule, select the group; if clicked a node, select node
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          });
        } else {
          setSelectedIds(new Set([id]));
        }
      }
      draggingNodeId.current = null;
      draggingGroupIds.current = new Set();
      groupStartPos.current = new Map();
      movedBeyondClick.current = false;
    }

    // Background click clears selection
    if (bgPressing.current) {
      if (!bgMovedBeyondClick.current && e.target === svgRef.current) {
        setSelectedIds(new Set());
      }
      bgPressing.current = false;
      bgMovedBeyondClick.current = false;
    }

    onPointerUp(e);
  };

  // Keyboard: Esc to clear
  useEffect(() => {
    const onKeyDown = (ev) => {
      if (ev.key === "Escape") setSelectedIds(new Set());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ---- Group helpers ----
  const selectableNodeIds = useMemo(() => new Set(nodesBase.map(n => n.id)), [nodesBase]);

  const createGroupFromSelection = () => {
    const members = [...selectedIds].filter(id => selectableNodeIds.has(id) && !byBonusId.has(id) && id !== RANK_NODE_ID && !groups.some(g => g.id === id));
    // Also exclude any currently selected groups themselves
    const filtered = members.filter(id => !groups.some(g => g.id === id));
    if (filtered.length < 2) return;
    const id = nextGroupId();
    const name = `Group ${id.slice(1)}`;
    setGroups(prev => [...prev, { id, name, members: filtered }]);
    setSelectedIds(new Set([id]));
  };

  const ungroupSelected = () => {
    if (!singleSelectedId) return;
    const gi = groups.findIndex(g => g.id === singleSelectedId);
    if (gi < 0) return;
    const next = [...groups];
    next.splice(gi, 1);
    setGroups(next);
    setSelectedIds(new Set());
  };

  const renameGroup = (groupId, name) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name: name || g.name } : g)));
  };

  const removeMemberFromGroup = (groupId, memberId) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, members: g.members.filter(m => m !== memberId) } : g)));
  };

  const nextGroupId = () => {
    // Collect every taken id: nodes, bonuses, rank, and existing groups
    const used = new Set([
      ...autoNodes.map(n => String(n.id)),
      ...(bonusDefinitions || []).map(b => String(b.id)),
      ...(Array.isArray(ranks) && ranks.length ? [RANK_NODE_ID] : []),
      ...groups.map(g => String(g.id)),
    ]);

    let i = 1;
    while (used.has(`G${i}`)) i++;
    return `G${i}`;
  };

  /* ------------------- Render ------------------- */
  return (
    <div className="p-2 bg-white rounded shadow-sm d-flex flex-column" style={{ height: "80vh" }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <div className="fw-semibold fs-5">
            Definition Flowchart{" "}
            <span className="badge bg-light text-secondary ms-2">roots tinted</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={[...selectedIds].filter(id => selectableNodeIds.has(id) && !byBonusId.has(id) && id !== RANK_NODE_ID && !groups.some(g => g.id === id)).length < 2}
            onClick={createGroupFromSelection}
            title="Group selected nodes"
          >
            Group selection
          </button>
          {singleSelectedId && groups.some(g => g.id === singleSelectedId) && (
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={ungroupSelected}>
              Ungroup
            </button>
          )}
        </div>
        <div className="text-muted small">
          Zoom: wheel • Pan: drag background • Move: drag box (snaps) • Multi-select: <kbd>Shift/Ctrl/⌘</kbd>+Click • Lasso: <kbd>Alt</kbd>+Drag
        </div>
      </div>

      <div className="flex-grow-1 position-relative" style={{ minHeight: 0 }}>
        <svg
          ref={svgRef}
          className="border rounded w-100 h-100"
          style={{ display: "block" }}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onWheel={onWheel}
          onPointerDown={handleSvgPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
        >
          {/* Group backgrounds (behind edges and nodes) */}
          <g fill="none" stroke={GROUP_STROKE} strokeWidth={2} pointerEvents="none">
            {groupsMeta.map(g => {
              const collapsed = collapsedGroupIds.has(g.id);
              const x = g.x - g.width / 2;
              const y = g.y - g.height / 2;
              return (
                <g key={`gbg-${g.id}`} opacity={collapsed ? 1 : 0.5}>
                  <rect x={x} y={y} width={g.width} height={g.height} rx={10} ry={10} fill={GROUP_FILL} />
                </g>
              );
            })}
          </g>

          {/* Edges (behind nodes) */}
          <g fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none">
            {visualEdges.map((e) => {
              const aNode = nodesForRender.find(n => n.id === e.a);
              const bNode = nodesForRender.find(n => n.id === e.b);
              if (!aNode || !bNode) return null;

              const effSize = (node) => {
                if (node.isGroup) return { w: node.width, h: node.height };
                const gId = memberToGroupAll.get(node.id);
                const collapsed = gId && collapsedGroupIds.has(gId);
                const s = gId && !collapsed ? GROUP_MEMBER_SCALE : 1;
                return { w: node.width * s, h: node.height * s };
              };

              const aSize = effSize(aNode);
              const bSize = effSize(bNode);

              const aPort = rectPortToward(aNode.x, aNode.y, aSize.w, aSize.h, bNode.x, bNode.y, 4);
              const bPort = rectPortToward(bNode.x, bNode.y, bSize.w, bSize.h, aNode.x, aNode.y, 0);


              const x1 = aPort.x, y1 = aPort.y;
              const x2 = bPort.x, y2 = bPort.y;

              const touchesSelection =
                (selectedIds.size > 0) &&
                ([...selectedIds].some(id => id === e.a || id === e.b));
              const baseStroke = touchesSelection ? "#0d6efd" : "#94a3b8";
              const edgeOpacity = touchesSelection ? 0.95 : 0.35;
              const edgeWidth = touchesSelection ? 2.5 : 1.5;

              const angleAB = Math.atan2(y2 - y1, x2 - x1);
              const angleBA = Math.atan2(y1 - y2, x1 - x2);
              const aArrowScale = effArrowScale(aNode);
              const bArrowScale = effArrowScale(bNode);

              return (
                <g key={e.rid}>
                  <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={baseStroke} opacity={edgeOpacity} strokeWidth={edgeWidth} />
                  {e.fromA && (
                    <polygon
                      points={arrowAt(x2, y2, angleAB, 16 * bArrowScale)}
                      fill={baseStroke}
                      fillOpacity={edgeOpacity}
                    />
                  )}
                  {e.fromB && (
                    <polygon
                      points={arrowAt(x1, y1, angleBA, 16 * aArrowScale)}
                      fill={baseStroke}
                      fillOpacity={edgeOpacity}
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes (non-group) */}
          {nodesForRender.filter(n => !n.isGroup).map((n) => {
            const selected = selectedIds.has(n.id);
            const isRoot = rootSet.has(n.id);
            const isRank = n.id === RANK_NODE_ID;
            const isBonus = byBonusId.has(n.id);

            const inGroupId = memberToGroupAll.get(n.id);
            const isCollapsedGroup = inGroupId && collapsedGroupIds.has(inGroupId);
            const scale = inGroupId && !isCollapsedGroup ? GROUP_MEMBER_SCALE : 1;

            const dimmedContext =
              (selectedIds.size === 1) &&
              !(
                n.id === singleSelectedId ||
                visualEdges.some(e => (e.a === singleSelectedId && e.b === n.id) || (e.b === singleSelectedId && e.a === n.id))
              );
            const dimmed = selectedIds.size === 1 ? dimmedContext : false;

            const rootTint = "#f2f8ff";
            const normalFill = "#ffffff";
            const dimFill = "#f8fafc";
            const selectedFill = "#eef2ff";

            const fillColor = isRank ? RANK_FILL : isBonus ? BONUS_FILL : (selected ? selectedFill : (dimmed ? dimFill : (isRoot ? rootTint : normalFill)));
            const strokeColor = isRank ? RANK_STROKE : isBonus ? BONUS_STROKE : (selected ? "#0d6efd" : (dimmed ? "#dee2e6" : "#cbd5e1"));
            const titleColor = isRank ? RANK_TEXT : isBonus ? BONUS_TEXT : (dimmed ? "#6c757d" : "#212529");
            const idColor = dimmed ? "#9aa5b1" : "#495057";
            const subColor = dimmed ? "#8c98a4" : "#6c757d";

            const idFontSize = idOnly ? computeIdOnlyFontSize(n.id, n.width * scale, n.height * scale) : 18;

            return (
              <g key={n.id} onPointerDown={(e) => handleNodePointerDown(e, n)} style={{ cursor: "grab" }}
                transform={`translate(${n.x},${n.y}) scale(${scale}) translate(${-n.width / 2},${-n.height / 2})`}>
                <path d={roundedRectPath(0, 0, n.width, n.height, 10)} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
                {idOnly ? (
                  <text x={n.width / 2} y={n.height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={idFontSize} fontWeight={500} fill={titleColor}>
                    {n.id}
                  </text>
                ) : (
                  <>
                    <text x={n.width / 2} y={22} textAnchor="middle" fontSize={14} fontWeight={700} fill={titleColor}>
                      {(n.definition && n.definition.name) || n.id}
                    </text>
                    <text x={n.width / 2} y={40} textAnchor="middle" fontSize={12} fill={idColor}>
                      {n.id}
                    </text>
                    {n.definition?.componentId && (
                      <text x={n.width / 2} y={58} textAnchor="middle" fontSize={11} fill={subColor}>
                        {n.definition.componentId}
                      </text>
                    )}
                  </>
                )}
                {n.definition?.comment && <title>{n.definition.comment}</title>}
              </g>
            );
          })}


          {/* Group labels (interactive; drag to move the whole group) */}
          <g>
            {groupsMeta.map(g => {
              const collapsed = collapsedGroupIds.has(g.id);
              const labelText = g.name || g.id;

              if (collapsed) {
                // Big centered title when contents are hidden (zoomed-out)
                const fs = GROUP_TITLE_FONT_COLLAPSED; // 2× larger than before
                return (
                  <g
                    key={`glab-${g.id}`}
                    style={{ cursor: "grab" }}
                    onPointerDown={(e) => handleNodePointerDown(e, { id: g.id, isGroup: true })}
                  >
                    <text
                      x={g.x}
                      y={g.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={fs}
                      fontWeight={800}
                      fill={GROUP_LABEL_BG}
                    >
                      {labelText}
                    </text>
                    <text
                      x={g.x}
                      y={g.y + fs * 0.9}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#6c757d"
                    >
                      {g.members.length} items
                    </text>
                  </g>
                );
              }

              // Zoomed-in (expanded): render a pill centered ABOVE the group box
              const labelH = 26;
              const labelW = Math.max(100, labelText.length * 8 + 24);
              const margin = 10; // gap above the group rect
              const lx = g.x - labelW / 2;
              const ly = g.y - g.height / 2 - labelH - margin;

              return (
                <g
                  key={`glab-${g.id}`}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => handleNodePointerDown(e, { id: g.id, isGroup: true })}
                >
                  <rect
                    x={lx}
                    y={ly}
                    rx={12}
                    ry={12}
                    width={labelW}
                    height={labelH}
                    fill={GROUP_LABEL_BG}
                    stroke="none"
                  />
                  <text
                    x={g.x}
                    y={ly + labelH / 2 + 4}
                    textAnchor="middle"
                    fontSize={GROUP_LABEL_FONT_EXPANDED}
                    fontWeight={700}
                    fill={GROUP_LABEL_FG}
                  >
                    {labelText}
                  </text>
                </g>
              );
            })}
          </g>


          {/* Lasso rectangle */}
          {lasso && (() => {
            const x = Math.min(lasso.x1, lasso.x2);
            const y = Math.min(lasso.y1, lasso.y2);
            const w = Math.abs(lasso.x2 - lasso.x1);
            const h = Math.abs(lasso.y2 - lasso.y1);
            return (
              <g pointerEvents="none">
                <rect x={x} y={y} width={w} height={h} fill="rgba(13,110,253,0.08)" stroke="#0d6efd" strokeDasharray="6,4" />
              </g>
            );
          })()}
        </svg>

        {/* Inspector Panel: single selection */}
        <aside
          className="position-absolute top-0 end-0 h-100 bg-white border-start shadow p-3 d-flex flex-column"
          style={{
            width: 380,
            maxWidth: "42%",
            overflow: "auto",
            zIndex: 1050,
            transform: singleSelectedId ? "translateX(0)" : "translateX(100%)",
            transition: "transform 240ms ease",
            pointerEvents: singleSelectedId ? "auto" : "none",
          }}
        >
          {singleSelectedId && (() => {
            // If group selected
            const g = byGroupId.get(singleSelectedId);
            if (g) {
              return (
                <>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
                    <div>
                      <div className="fw-semibold">{g.name || g.id}</div>
                      <div className="text-muted small">{g.id} · <span className="badge bg-secondary">Group</span></div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIds(new Set())} type="button">Close</button>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted mb-1">Group name</label>
                    <input className="form-control form-control-sm" defaultValue={g.name} onBlur={(e) => renameGroup(g.id, e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold small mb-2">Members</div>
                    <div className="d-flex flex-column gap-1">
                      {g.members.map(id => (
                        <div key={id} className="d-flex align-items-center justify-content-between border rounded px-2 py-1">
                          <div className="text-truncate" title={byIdDef.get(id)?.name || id}>
                            {byIdDef.get(id)?.name || id} <span className="text-muted">({id})</span>
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedIds(new Set([id]))}>Go to</button>
                            <button type="button" className="btn btn-outline-danger" onClick={() => removeMemberFromGroup(g.id, id)}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto d-flex justify-content-between">
                    <button className="btn btn-sm btn-outline-danger" onClick={ungroupSelected}>Ungroup</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIds(new Set())}>Done</button>
                  </div>
                </>
              );
            }

            // Else show node/bonus/rank as before
            const n = nodesForRender.find(nn => nn.id === singleSelectedId);
            if (!n) return null;
            const isBonus = byBonusId.has(n.id);
            const def = n.definition || {};
            // Use rawEdges for logical parents/children (not grouped)
            const inbound = Array.from(new Set(rawEdges.filter(e => e.head === n.id && e.tail !== e.head).map(e => e.tail)));
            //const outbound = Array.from(new Set(rawEdges.filter(e => e.tail === n.id && e.tail !== e.head).map(e => e.head)));

            if (isBonus) {
              const b = bonusDefinitions.find(bb => bb.id === n.id);
              const sections = [
                { label: "Generation bonuses", list: b?.generationBonuses || [], cols: ["generation", "percent"] },
                { label: "Rolling bonuses", list: b?.rollingBonuses || [], cols: ["generation", "percent"] },
                { label: "Binary bonuses", list: b?.binaryBonuses || [], cols: ["generation", "percent"] },
                { label: "Pool bonus", list: b?.poolBonus || [], cols: ["generation", "percent"] },
              ];
              return (
                <>
                  <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <div>
                      <div className="fw-semibold">{b?.name || n.id}</div>
                      <div className="text-muted small">{n.id} · <span className="badge bg-success-subtle text-success">Bonus</span></div>
                    </div>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIds(new Set())} type="button">Close</button>
                  </div>

                  {b?.description && <div className="mb-2 text-muted">{b.description}</div>}

                  <div className="mb-3">
                    <div className="fw-semibold small mb-1">Depends on (parents)</div>
                    {inbound.length ? (
                      <div className="d-flex flex-wrap gap-1">
                        {inbound.map((id) => (
                          <button key={`in-${id}`} type="button" onClick={() => setSelectedIds(new Set([id]))}
                            className="btn btn-sm btn-outline-secondary" title={byIdDef.get(id)?.name || id}>
                            {byIdDef.get(id)?.name || id}
                          </button>
                        ))}
                      </div>
                    ) : <div className="text-muted small">None</div>}
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold small mb-1">Volume key</div>
                    <div className="small">{b?.volumeKey || <span className="text-muted">—</span>}</div>
                  </div>

                  {sections.map(({ label, list, cols }) => (
                    <div className="mb-3" key={label}>
                      <div className="fw-semibold small mb-2">{label}</div>
                      {list.length ? (
                        <table className="table table-sm">
                          <thead className="table-light">
                            <tr>
                              {cols.map(c => <th key={c} className="small text-capitalize">{c}</th>)}
                              <th className="small">Qualifications (keys)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((row, i) => (
                              <tr key={i}>
                                {cols.map(c => <td key={c} className="small">{row?.[c] ?? "—"}</td>)}
                                <td className="small">
                                  {(row?.qualifications || []).length
                                    ? row.qualifications.map(q => q?.key).filter(Boolean).join(", ")
                                    : <span className="text-muted">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <div className="text-muted small">None</div>}
                    </div>
                  ))}

                  <div className="mb-0">
                    <div className="fw-semibold small mb-1">Raw bonus</div>
                    <pre className="border rounded p-2 small bg-light" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {JSON.stringify(b || {}, null, 2)}
                    </pre>
                  </div>
                </>
              );
            }

            const memberGroupId = memberToGroupAll.get(n.id);
            // default definition inspector
            return (
              <>
                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                  <div>
                    <div className="fw-semibold">{def.name || n.id}</div>
                    <div className="text-muted small">{n.id}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedIds(new Set())} type="button">
                    Close
                  </button>
                </div>

                <div className="mb-3">
                  <span className="badge bg-primary">{def.componentId || "—"}</span>
                  {def.comment && <div className="mt-2 text-muted fst-italic small">“{def.comment}”</div>}
                </div>

                {memberGroupId && (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeMemberFromGroup(memberGroupId, n.id)}
                      title={`Remove ${n.id} from ${memberGroupId}`}
                    >
                      Remove from group
                    </button>
                  </div>
                )}

                <div className="mb-3">
                  <div className="fw-semibold small mb-2">Parameters</div>
                  {Array.isArray(def.parameters) && def.parameters.length > 0 ? (
                    <table className="table table-sm mb-0">
                      <tbody>
                        {def.parameters.map((p, idx) => (
                          <tr key={idx} className="align-top">
                            <td className="text-muted" style={{ width: 140 }}>{p.id}</td>
                            <td className="text-break">{p.value || <span className="text-muted">—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-muted small">No parameters</div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="fw-semibold small mb-1">Used by (children)</div>
                  {Array.from(new Set(rawEdges.filter(e => e.tail === n.id && e.tail !== e.head).map(e => e.head))).length ? (
                    <div className="d-flex flex-wrap gap-1">
                      {Array.from(new Set(rawEdges.filter(e => e.tail === n.id && e.tail !== e.head).map(e => e.head))).map((id) => (
                        <button key={`out-${id}`} type="button" onClick={() => setSelectedIds(new Set([id]))}
                          className="btn btn-sm btn-outline-secondary" title={byIdDef.get(id)?.name || id}>
                          {byIdDef.get(id)?.name || id}
                        </button>
                      ))}
                    </div>
                  ) : <div className="text-muted small">None</div>}
                </div>

                <div className="mb-0">
                  <div className="fw-semibold small mb-1">Depends on (parents)</div>
                  {Array.from(new Set(rawEdges.filter(e => e.head === n.id && e.tail !== e.head).map(e => e.tail))).length ? (
                    <div className="d-flex flex-wrap gap-1">
                      {Array.from(new Set(rawEdges.filter(e => e.head === n.id && e.tail !== e.head).map(e => e.tail))).map((id) => (
                        <button key={`in-${id}`} type="button" onClick={() => setSelectedIds(new Set([id]))}
                          className="btn btn-sm btn-outline-secondary" title={byIdDef.get(id)?.name || id}>
                          {byIdDef.get(id)?.name || id}
                        </button>
                      ))}
                    </div>
                  ) : <div className="text-muted small">None</div>}
                </div>

                <div className="mb-0">
                  <div className="fw-semibold small mb-1">Raw definition</div>
                  <pre className="border rounded p-2 small bg-light" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {JSON.stringify(def || {}, null, 2)}
                  </pre>
                </div>
              </>
            );
          })()}
        </aside>

        {/* Selection count chip when multi-selected */}
        {selectedIds.size > 1 && (
          <div
            className="position-absolute top-0 start-50 translate-middle-x mt-2 px-2 py-1 bg-dark text-white rounded-pill small shadow"
            style={{ zIndex: 1060, opacity: 0.9 }}
          >
            {selectedIds.size} selected
          </div>
        )}
      </div>
    </div>
  );
}

/* Big ID text sizing in compact mode */
function computeIdOnlyFontSize(text, boxW, boxH) {
  const padX = 16, padY = 12;
  const maxW = Math.max(20, boxW - 2 * padX);
  const maxH = Math.max(14, boxH - 2 * padY);
  let fs = Math.min(maxH * 0.95, 64);
  const est = (size) => 0.62 * size * Math.max(1, text.length);
  if (est(fs) > maxW) fs = maxW / (0.62 * Math.max(1, text.length));
  return Math.max(10, fs);
}

DefinitionFlowchart.propTypes = {
  setId: PropTypes.string.isRequired,
  definitions: PropTypes.arrayOf(
    PropTypes.shape({
      valueId: PropTypes.string.isRequired,
      name: PropTypes.string,
      comment: PropTypes.string,
      componentId: PropTypes.string,
      parameters: PropTypes.arrayOf(
        PropTypes.shape({ id: PropTypes.string, value: PropTypes.string })
      ),
    })
  ).isRequired,
  ranks: PropTypes.arrayOf(
    PropTypes.shape({
      rankId: PropTypes.number.isRequired,
      rankName: PropTypes.string,
      requirement: PropTypes.shape({
        groupVolumeKey: PropTypes.string,
        legVolumeKey: PropTypes.string,
        qualVolumeKey: PropTypes.string,
        personalVolumeKey: PropTypes.string,
      }),
    })
  ),
  bonusDefinitions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      volumeKey: PropTypes.string,
      generationBonuses: PropTypes.array,
      rollingBonuses: PropTypes.array,
      binaryBonuses: PropTypes.array,
      poolBonus: PropTypes.array,
    })
  ),
};
