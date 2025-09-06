import React, { useMemo, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";

/* ---------------- Tunables ---------------- */
const VIEWBOX_INITIAL = { x: 0, y: 0, w: 1600, h: 1000 };
const ZOOM_ID_ONLY = 0.6; // when zoom <= 0.6, show only valueId in the node
const CLICK_THRESHOLD_PX = 6; // click vs drag threshold

const RANK_NODE_ID = "Rank";
const RANK_FILL = "#fff7ed";         // warm amber background
const RANK_STROKE = "#f59e0b";         // amber border
const RANK_TEXT = "#7c2d12";         // darker label color

// Node size (must match what you render)
const NODE_HEIGHT_PX = 72;

// Snap every half node height
const GRID_SNAP_STEP = NODE_HEIGHT_PX / 2; // 36px

// Optional offsets if you want to shift the grid origin
const GRID_SNAP_OFFSET_X = 0;
const GRID_SNAP_OFFSET_Y = 0;

// Snap helper (world/SVG coords)
const snap = (v, step, offset = 0) =>
  Math.round((v - offset) / step) * step + offset;


/* ---------------- Helpers ---------------- */

/** Build a case-insensitive canonicalizer for valueIds. */
function buildCanon(defs, extraIds = []) {
  const canon = new Map();
  for (const d of defs) {
    const k = String(d.valueId).toLowerCase();
    if (!canon.has(k)) canon.set(k, d.valueId);
  }
  for (const ex of extraIds) {
    const k = String(ex).toLowerCase();
    if (!canon.has(k)) canon.set(k, ex); // only add if not already a real def
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

/* Build edges from defs; return nodes, raw edges, rootSet (for tint) */
function buildGraph(defs, ranks = []) {
  const byId = new Map(defs.map(d => [d.valueId, d]));
  const toCanon = buildCanon(defs, (Array.isArray(ranks) && ranks.length) ? [RANK_NODE_ID] : []);

  const edges = [];
  const indeg = new Map(defs.map(d => [d.valueId, 0]));
  const adj = new Map(defs.map(d => [d.valueId, []]));
  if (Array.isArray(ranks) && ranks.length) {
    if (!indeg.has(RANK_NODE_ID)) indeg.set(RANK_NODE_ID, 0);
    if (!adj.has(RANK_NODE_ID)) adj.set(RANK_NODE_ID, []);
  }

  for (const def of defs) {
    const childId = def.valueId;
    const childLC = childId.toLowerCase();

    // Parse ANY parameter named "Formula" (case-insensitive), regardless of componentId
    const formulaParams = (def.parameters || []).filter(
      p => p && typeof p.id === "string" && p.id.toLowerCase() === "formula"
    );
    for (const fp of formulaParams) {
      const refs = extractReferencedIds(fp.value, toCanon);
      for (const r of refs) {
        if (r.toLowerCase() === childLC) continue; // ignore self
        edges.push({ tail: r, head: childId, id: `${r}->${childId}:Formula` });
        indeg.set(childId, (indeg.get(childId) || 0) + 1);
        if (!adj.has(r)) adj.set(r, []);
        adj.get(r).push(childId);
      }
    }

    // Direct param references — support comma-separated valueIds (case-insensitive)
    for (const p of def.parameters || []) {
      if (typeof p.value !== "string" || !p.value) continue;
      const candidates = p.value.split(",").map(s => s.trim()).filter(Boolean);
      for (const v of candidates) {
        const c = toCanon(v);
        if (!c) continue;
        if (c.toLowerCase() === childLC) continue; // ignore self
        edges.push({ tail: c, head: childId, id: `${c}->${childId}:${p.id}` });
        indeg.set(childId, (indeg.get(childId) || 0) + 1);
        if (!adj.has(c)) adj.set(c, []);
        adj.get(c).push(childId);
      }
    }
  }

  // Roots = indegree 0 (if none, fallback to all)
  let roots = defs.filter(d => (indeg.get(d.valueId) || 0) === 0).map(d => d.valueId);
  if (roots.length === 0) roots = defs.map(d => d.valueId);
  const rootSet = new Set(roots);

  // DFS order from roots
  const seen = new Set();
  const order = [];
  function dfs(u) { if (seen.has(u)) return; seen.add(u); order.push(u); for (const v of adj.get(u) || []) dfs(v); }
  for (const r of roots) dfs(r);
  for (const d of defs) if (!seen.has(d.valueId)) dfs(d.valueId);

  // Longest-path layering (parents above children)
  const layer = new Map(defs.map(d => [d.valueId, 0]));
  for (let i = 0; i < defs.length; i++) {
    for (const e of edges) {
      const lu = layer.get(e.tail) || 0, lv = layer.get(e.head) || 0;
      if (lu + 1 > lv) layer.set(e.head, lu + 1);
    }
  }

  // Group by layer & sort by DFS order
  const orderIndex = new Map(order.map((id, i) => [id, i]));
  const buckets = new Map();
  for (const d of defs) {
    const l = layer.get(d.valueId) || 0;
    if (!buckets.has(l)) buckets.set(l, []);
    buckets.get(l).push(d.valueId);
  }
  const sortedLayers = Array.from(buckets.keys()).sort((a, b) => a - b);
  const layers = sortedLayers.map(l => buckets.get(l).sort((a, b) => orderIndex.get(a) - orderIndex.get(b)));

  // Initial coordinates
  const nodeSize = { w: 240, h: 72 };
  const spacingX = 260, spacingY = 140;
  const baseX = 160, baseY = 80;

  const nodes = [];
  layers.forEach((ids, layerIdx) => {
    ids.forEach((id, i) => {
      nodes.push({
        id,
        x: baseX + i * spacingX,
        y: baseY + layerIdx * spacingY,
        width: nodeSize.w,
        height: nodeSize.h,
        definition: byId.get(id),
      });
    });
  });

  // --- Rank aggregator node & edges ---
  if (Array.isArray(ranks) && ranks.length) {
    const toCanon = buildCanon(defs, (Array.isArray(ranks) && ranks.length) ? [RANK_NODE_ID] : []);

    // Collect parent definition ids (case-insensitive)
    const rankParents = [];
    const seen = new Set();
    for (const r of ranks) {
      const req = r && r.requirement ? r.requirement : {};
      for (const key of ["groupVolumeKey", "legVolumeKey", "qualVolumeKey", "personalVolumeKey"]) {
        const raw = req[key];
        if (!raw) continue;
        const c = toCanon(raw);
        if (c && !seen.has(c)) { seen.add(c); rankParents.push(c); }
      }
    }

    if (rankParents.length) {
      // Edges: parent def -> Rank
      for (const p of rankParents) {
        edges.push({ tail: p, head: RANK_NODE_ID, id: `${p}->${RANK_NODE_ID}:rank` });
      }

      // Position the Rank node below its parents, centered among them
      const nodeById = new Map(nodes.map(n => [n.id, n]));
      const parentXs = rankParents.map(id => nodeById.get(id)?.x).filter(x => typeof x === "number");
      //const parentLayers = rankParents.map(id => nodeById.get(id) ? 0 : 0); // placeholder (we'll just look at y)

      const avgX = parentXs.length ? (parentXs.reduce((a, b) => a + b, 0) / parentXs.length) : 160;
      const maxY = parentXs.length
        ? Math.max(...rankParents.map(id => (nodeById.get(id)?.y ?? 80)))
        : 80;

      const rankNode = {
        id: RANK_NODE_ID,
        x: avgX,
        y: maxY + 140, // one layer below deepest parent
        width: 240,
        height: 72,
        definition: {
          valueId: RANK_NODE_ID,
          name: "Ranks",
          componentId: "Rank",
          comment: `${ranks.length} rank${ranks.length > 1 ? "s" : ""} configured`,
          parameters: [], // show details in inspector from ranks prop if desired
        },
      };

      // If a Rank node already exists (e.g., persisted), keep its position
      const existing = nodeById.get(RANK_NODE_ID);
      nodes.push(existing ? { ...rankNode, x: existing.x, y: existing.y } : rankNode);
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

/* --------------- Signature + persistence --------------- */
function computeSignature(defs, ranks = []) {
  const toCanon = buildCanon(defs, (Array.isArray(ranks) && ranks.length) ? [RANK_NODE_ID] : []);

  const ids = defs
    .map(d => d.valueId)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const edges = [];

  for (const def of defs) {
    const childId = def.valueId;
    const childLC = childId.toLowerCase();

    // include ANY "Formula" parameter
    const formulaParams = (def.parameters || []).filter(
      p => p && typeof p.id === "string" && p.id.toLowerCase() === "formula"
    );
    for (const fp of formulaParams) {
      for (const r of extractReferencedIds(fp.value, toCanon)) {
        if (r.toLowerCase() === childLC) continue; // skip self
        edges.push(`${r}->${childId}`);
      }
    }

    for (const p of def.parameters || []) {
      if (typeof p.value !== "string" || !p.value) continue;
      const candidates = p.value.split(",").map(s => s.trim()).filter(Boolean);
      for (const v of candidates) {
        const c = toCanon(v);
        if (!c) continue;
        if (c.toLowerCase() === childLC) continue; // skip self
        edges.push(`${c}->${childId}`);
      }
    }
  }

  // --- Rank dependencies (aggregate to single Rank node) ---
  if (Array.isArray(ranks) && ranks.length) {
    const toCanon = buildCanon(defs, (Array.isArray(ranks) && ranks.length) ? [RANK_NODE_ID] : []);
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

    for (const p of rankParents) {
      edges.push(`${p}->${RANK_NODE_ID}`);
    }
  }

  // (edges already declared above)
  edges.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  // If you want the presence of the Rank node itself to affect the signature:
  if (Array.isArray(ranks) && ranks.length) {
    ids.push(RANK_NODE_ID);
  }

  const canonical = JSON.stringify({ ids, edges });
  let h = 5381;
  for (let i = 0; i < canonical.length; i++) h = ((h << 5) + h) ^ canonical.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const STORAGE_PREFIX = "defFlow:v1:";
const loadPositions = (setId) => { try { const raw = localStorage.getItem(STORAGE_PREFIX + setId); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const savePositions = (setId, payload) => {
  try { localStorage.setItem(STORAGE_PREFIX + setId, JSON.stringify(payload)); } catch {
    //
  }
};

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
export default function DefinitionFlowchart({ setId, definitions, ranks = [] }) {
  const signature = useMemo(() => computeSignature(definitions || [], ranks || []), [definitions, ranks]);
  const { nodes: autoNodes, edges: rawEdges, rootSet } = useMemo(() => buildGraph(definitions || [], ranks || []), [definitions, ranks]);
  const { viewBox, onWheel, onPointerDown, onPointerMove, onPointerUp } = usePanZoom();

  // Draggable positions (persisted)
  const [nodePos, setNodePos] = useState(new Map()); // id -> {x,y}
  const svgRef = useRef(null);

  // selection: multiple ids
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Node dragging
  const draggingNodeId = useRef(null);
  const draggingGroupIds = useRef(new Set());
  const groupStartPos = useRef(new Map()); // id -> {x,y}
  const pointerStartPt = useRef({ x: 0, y: 0 });
  const movedBeyondClick = useRef(false);

  // Background click vs pan
  const bgPressing = useRef(false);
  const bgStartClient = useRef({ x: 0, y: 0 });
  const bgMovedBeyondClick = useRef(false);

  // Lasso selection (Alt) — stateful so it renders
  const [lasso, setLasso] = useState(null); // null or {x1,y1,x2,y2}

  // Load positions for this setId; merge if signature differs
  useEffect(() => {
    const saved = loadPositions(setId);
    const map = new Map();
    if (saved && saved.positions && typeof saved.positions === "object") {
      for (const n of autoNodes) if (saved.positions[n.id]) map.set(n.id, { x: saved.positions[n.id].x, y: saved.positions[n.id].y });
    }
    for (const n of autoNodes) if (!map.has(n.id)) map.set(n.id, { x: n.x, y: n.y });
    setNodePos(map);
    if (!saved || saved.signature !== signature) {
      savePositions(setId, { signature, positions: Object.fromEntries(map), lastUpdated: Date.now() });
    }
  }, [setId, signature, autoNodes.length]);

  // Persist when positions change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      savePositions(setId, { signature, positions: Object.fromEntries(nodePos), lastUpdated: Date.now() });
    }, 300);
    return () => clearTimeout(t);
  }, [nodePos, setId, signature]);

  // --- client -> SVG coords using CTM; fallback to viewBox math ---
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
  const nodes = useMemo(() => {
    const byId = new Map(autoNodes.map(n => [n.id, { ...n }]));
    for (const [id, p] of nodePos.entries()) if (byId.has(id)) { byId.get(id).x = p.x; byId.get(id).y = p.y; }
    const out = Array.from(byId.values());
    if (draggingNodeId.current) {
      const idx = out.findIndex(n => n.id === draggingNodeId.current);
      if (idx >= 0) { const [d] = out.splice(idx, 1); out.push(d); }
    }
    return out;
  }, [autoNodes, nodePos]);

  /* ----- Consolidated edges for drawing: straight line + dual arrows if mutual ----- */
  const renderEdges = useMemo(() => {
    const pairs = new Map();
    for (const e of rawEdges) {
      if (e.tail === e.head) continue;
      const a = e.tail < e.head ? e.tail : e.head;
      const b = e.tail < e.head ? e.head : e.tail;
      const key = `${a}|${b}`;
      if (!pairs.has(key)) pairs.set(key, { a, b, from: new Set() });
      pairs.get(key).from.add(e.tail);
    }
    const list = [];
    for (const [key, v] of pairs.entries()) {
      const twoWay = v.from.has(v.a) && v.from.has(v.b);
      list.push({ a: v.a, b: v.b, twoWay, rid: `pair:${key}` });
    }
    return list;
  }, [rawEdges]);

  const singleSelectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;

  const arrowAt = (x2, y2, angle, size = 8) => {
    const ax = x2, ay = y2;
    const p1x = ax - size * Math.cos(angle) + (size / 1.5) * Math.sin(angle);
    const p1y = ay - size * Math.sin(angle) - (size / 1.5) * Math.cos(angle);
    const p2x = ax - size * Math.cos(angle) - (size / 1.5) * Math.sin(angle);
    const p2y = ay - size * Math.sin(angle) + (size / 1.5) * Math.cos(angle);
    return `${p1x},${p1y} ${ax},${ay} ${p2x},${p2y}`;
  };

  // zoom factor for label mode (once)
  const zoom = VIEWBOX_INITIAL.w / viewBox.w;
  const idOnly = zoom <= ZOOM_ID_ONLY;

  /* ----- Node events ----- */
  const handleNodePointerDown = (e, n) => {
    e.stopPropagation(); // prevent starting background pan/lasso

    const pt = clientToSvg(e);
    pointerStartPt.current = pt;
    movedBeyondClick.current = false;

    // Determine group: if node in selection, move group; else move only this node
    const group = selectedIds.has(n.id) && selectedIds.size > 0 ? new Set(selectedIds) : new Set([n.id]);
    draggingGroupIds.current = group;
    draggingNodeId.current = n.id;

    // snapshot starting positions
    groupStartPos.current = new Map();
    for (const id of group) {
      const nn = nodes.find(x => x.id === id);
      const pos = nn ? { x: nn.x, y: nn.y } : (nodePos.get(id) || { x: n.x, y: n.y });
      groupStartPos.current.set(id, pos);
    }

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  /* ----- Background events (pan / lasso / clear) ----- */
  const handleSvgPointerDown = (e) => {
    if (e.target !== svgRef.current) return; // ignore clicks on children
    const isAlt = e.altKey;
    if (isAlt) {
      const pt = clientToSvg(e);
      setLasso({ x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y });
      return;
    }
    // start pan & background click tracking
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

    // Group dragging
    if (draggingNodeId.current && draggingGroupIds.current.size) {
      const pt = clientToSvg(e);
      const dx = pt.x - pointerStartPt.current.x;
      const dy = pt.y - pointerStartPt.current.y;

      if (!movedBeyondClick.current && (dx * dx + dy * dy) > (CLICK_THRESHOLD_PX * CLICK_THRESHOLD_PX)) {
        movedBeyondClick.current = true;
      }

      // Snap based on the anchor (the node you grabbed), then shift the whole group by the same snap delta
      const anchorId = draggingNodeId.current;
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

      // compute selection by intersection
      const hit = [];
      for (const n of nodes) {
        const nx = n.x - n.width / 2, ny = n.y - n.height / 2;
        const intersects = !(nx + n.width < minX || nx > maxX || ny + n.height < minY || ny > maxY);
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

    // Complete node click vs drag and toggle selection
    if (draggingNodeId.current) {
      if (!movedBeyondClick.current) {
        const id = draggingNodeId.current;
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

    // Background click (no significant movement) clears selection
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

  const byIdDef = useMemo(() => new Map(nodes.map(n => [n.id, n.definition])), [nodes]);

  /* ------------------- Render ------------------- */
  return (
    <div className="p-2 bg-white rounded shadow-sm d-flex flex-column" style={{ height: "80vh" }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-semibold fs-5">
          Definition Flowchart{" "}
          <span className="badge bg-light text-secondary ms-2">roots tinted</span>
        </div>
        <div className="text-muted small">
          Zoom: wheel • Pan: drag background • Move: drag box • Multi-select: <kbd>Shift/Ctrl/⌘</kbd>+Click • Lasso: <kbd>Alt</kbd>+Drag
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
          {/* Edges (behind nodes) */}
          <g fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {renderEdges.map((e) => {
              const aNode = nodes.find(n => n.id === e.a);
              const bNode = nodes.find(n => n.id === e.b);
              if (!aNode || !bNode) return null;

              const aPort = rectPortToward(aNode.x, aNode.y, aNode.width, aNode.height, bNode.x, bNode.y, 4);
              const bPort = rectPortToward(bNode.x, bNode.y, bNode.width, bNode.height, aNode.x, aNode.y, 0);

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

              const hasAB = rawEdges.some(r => r.tail === e.a && r.head === e.b);
              const hasBA = rawEdges.some(r => r.tail === e.b && r.head === e.a);

              return (
                <g key={e.rid}>
                  <path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={baseStroke} opacity={edgeOpacity} strokeWidth={edgeWidth} />
                  {hasAB && <polygon points={arrowAt(x2, y2, angleAB, 16)} fill={baseStroke} fillOpacity={edgeOpacity} />}
                  {hasBA && <polygon points={arrowAt(x1, y1, angleBA, 16)} fill={baseStroke} fillOpacity={edgeOpacity} />}
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          {nodes.map((n) => {
            const x = n.x - n.width / 2;
            const y = n.y - n.height / 2;
            const selected = selectedIds.has(n.id);
            const isRoot = rootSet.has(n.id);
            const isRank = n.id === RANK_NODE_ID;

            const rootTint = "#f2f8ff";
            const normalFill = "#ffffff";
            const dimFill = "#f8fafc";
            const selectedFill = "#eef2ff";

            const connectedToSingle =
              singleSelectedId &&
              (renderEdges.some(e =>
                (e.a === singleSelectedId && e.b === n.id) || (e.b === singleSelectedId && e.a === n.id)
              ) || n.id === singleSelectedId);

            const dimmed = singleSelectedId ? !connectedToSingle : false;

            const fillColor = isRank
              ? RANK_FILL
              : selected ? selectedFill : dimmed ? dimFill : isRoot ? rootTint : normalFill;
            const strokeColor = isRank
              ? RANK_STROKE
              : selected ? "#0d6efd" : dimmed ? "#dee2e6" : "#cbd5e1";
            const titleColor = isRank ? RANK_TEXT : (dimmed ? "#6c757d" : "#212529");

            const idColor = dimmed ? "#9aa5b1" : "#495057";
            const subColor = dimmed ? "#8c98a4" : "#6c757d";

            const idFontSize = idOnly ? computeIdOnlyFontSize(n.id, n.width, n.height) : 18;

            return (
              <g
                key={n.id}
                onPointerDown={(e) => handleNodePointerDown(e, n)}
                style={{ cursor: "grab" }}
              >
                <path d={roundedRectPath(x, y, n.width, n.height, 10)} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
                {idOnly ? (
                  <text
                    x={n.x}
                    y={n.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={idFontSize}
                    fontWeight={500}
                    fill={titleColor}
                  >
                    {n.id}
                  </text>
                ) : (
                  <>
                    <text x={n.x} y={y + 22} textAnchor="middle" fontSize={14} fontWeight={700} fill={titleColor}>
                      {(n.definition && n.definition.name) || n.id}
                    </text>
                    <text x={n.x} y={y + 40} textAnchor="middle" fontSize={12} fill={idColor}>
                      {n.id}
                    </text>
                    {n.definition?.componentId && (
                      <text x={n.x} y={y + 58} textAnchor="middle" fontSize={11} fill={subColor}>
                        {n.definition.componentId}
                      </text>
                    )}
                  </>
                )}
                {n.definition?.comment && <title>{n.definition.comment}</title>}
              </g>
            );
          })}

          {/* Lasso rectangle (pointer-events: none) */}
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

        {/* Inspector Panel: show only on single selection (slides over, no layout shift) */}
        <aside
          className="position-absolute top-0 end-0 h-100 bg-white border-start shadow p-3 d-flex flex-column"
          style={{
            width: 360,
            maxWidth: "40%",
            overflow: "auto",
            zIndex: 1050,
            transform: singleSelectedId ? "translateX(0)" : "translateX(100%)",
            transition: "transform 240ms ease",
            pointerEvents: singleSelectedId ? "auto" : "none",
          }}
        >
          {singleSelectedId && (() => {
            const n = nodes.find(nn => nn.id === singleSelectedId);
            if (!n) return null;
            const def = n.definition || {};
            const inbound = Array.from(new Set(rawEdges.filter(e => e.head === n.id && e.tail !== e.head).map(e => e.tail)));
            const outbound = Array.from(new Set(rawEdges.filter(e => e.tail === n.id && e.tail !== e.head).map(e => e.head)));

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
                  {outbound.length ? (
                    <div className="d-flex flex-wrap gap-1">
                      {outbound.map((id) => (
                        <button
                          key={`out-${id}`}
                          type="button"
                          onClick={() => setSelectedIds(new Set([id]))}
                          className="btn btn-sm btn-outline-secondary"
                          title={byIdDef.get(id)?.name || id}
                        >
                          {byIdDef.get(id)?.name || id}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">None</div>
                  )}
                </div>

                <div className="mb-0">
                  <div className="fw-semibold small mb-1">Depends on (parents)</div>
                  {inbound.length ? (
                    <div className="d-flex flex-wrap gap-1">
                      {inbound.map((id) => (
                        <button
                          key={`in-${id}`}
                          type="button"
                          onClick={() => setSelectedIds(new Set([id]))}
                          className="btn btn-sm btn-outline-secondary"
                          title={byIdDef.get(id)?.name || id}
                        >
                          {byIdDef.get(id)?.name || id}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted small">None</div>
                  )}
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
};