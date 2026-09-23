import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Post } from '../../../hooks/usePost';
import { FAN_END_ANGLE, FAN_MAX_DEPTH, FAN_ROOT_RADIUS, fanChildPage, fanPlaceholders, fanPoint, fanRingRadii, fanSectorPath, layoutFan } from './fanLayout';
import { fanAncestorPath, fanBranchIndicator } from './fanNavigation';
import { autoExpandFan, createFanRequestQueue, FAN_PAGE_SIZE } from './fanAutoExpand';
import { createFanTextMeasurer, fanLabelLayout, fitFanText } from './fanLabels';
import { fanWheelFactor, zoomFanAt } from './fanZoom';
import FanCardPreview from './fanCardPreview.jsx';
import './fanView.css';

const NODE_FIELDS = `nodeId uplineLeg totalChildNodes totalNodes customer { id fullName widgets { id } }`;
const ROOT_QUERY = `query FanRoot($treeIds: [String]!, $nodeIds: [String]!, $date: Date) {
  trees(idList: $treeIds) { nodes(nodeIds: $nodeIds, date: $date) { ${NODE_FIELDS} } }
}`;
const CHILD_QUERY = `query FanChildren($treeIds: [String]!, $nodeIds: [String]!, $date: Date, $offset: Int, $count: Int) {
  trees(idList: $treeIds) { nodes(nodeIds: $nodeIds, date: $date) {
    nodeId nodes(levels: 1, offset: $offset, first: $count) { ${NODE_FIELDS} }
  } }
}`;
const COLORS = ['#dbeafe', '#ccfbf1', '#ede9fe', '#fef3c7', '#fce7f3', '#e0f2fe'];

function request(query, variables) {
  return new Promise((resolve, reject) => Post('/graphql', { query, variables }, response => {
    if (response?.errors?.length) reject(new Error(response.errors.map(error => error.message).join('; ')));
    else resolve(response?.data?.trees?.[0]?.nodes?.[0] || null);
  }, () => reject(new Error('Unable to load this branch. Please try again.'))));
}

const FanView = ({ rootId, rootName, headerTarget, treeId, date, legNames, dashboard, trees, onSelect, onFocusChange }) => {
  const [root, setRoot] = useState(null);
  const [pages, setPages] = useState(new Map());
  const [expanded, setExpanded] = useState(new Set());
  const [focusId, setFocusId] = useState(rootId);
  const [history, setHistory] = useState([]);
  const [childPages, setChildPages] = useState(new Map());
  const [pending, setPending] = useState(new Set());
  const [errors, setErrors] = useState(new Map());
  const [retry, setRetry] = useState(0);
  const [autoExpanding, setAutoExpanding] = useState(false);
  const [autoLimited, setAutoLimited] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [viewport, setViewport] = useState(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0, fontFamily: 'sans-serif' });
  const [fontRevision, setFontRevision] = useState(0);
  const [preview, setPreview] = useState(null);
  const chartRef = useRef(null);
  const previewRef = useRef(null);
  const previewTimer = useRef(null);
  const previewCache = useMemo(() => new Map(), [treeId, date, dashboard]);
  const labelId = useId();
  const measureText = useMemo(() => createFanTextMeasurer(chartSize.fontFamily), [chartSize.fontFamily, fontRevision]);
  const session = useRef(null);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const expansionRun = useRef(0);
  const requestQueue = useRef(null);
  if (!requestQueue.current) requestQueue.current = createFanRequestQueue();

  useEffect(() => () => clearTimeout(previewTimer.current), []);

  // Each date/tree change owns its requests. Late responses from an old view
  // cannot update this view or replace newer placement data.
  useEffect(() => {
    const current = { active: true, pages: new Map(), pending: new Set(), requests: new Map(), expanded: new Set(), childPages: new Map() };
    session.current = current;
    setRoot(null);
    setPages(new Map());
    setExpanded(new Set());
    setFocusId(String(rootId));
    setHistory([]);
    setChildPages(new Map());
    setAutoExpanding(false);
    setAutoLimited(false);
    setPreview(null);
    setErrors(new Map());
    setPending(new Set(['root']));
    setTransform({ x: 0, y: 0, scale: 1 });
    setViewport(null);
    const variables = { treeIds: [String(treeId)], nodeIds: [String(rootId)], date };
    requestQueue.current(() => request(ROOT_QUERY, variables), () => current.active).then(node => {
      if (!current.active) return;
      if (!node?.customer) throw new Error('This customer is not in the tree for the selected date.');
      setRoot(node);
      setPending(new Set());
      startAutoExpansion(node, current);
    }).catch(error => {
      if (!current.active) return;
      setErrors(new Map([['root', error.message]]));
      setPending(new Set());
    });
    return () => { current.active = false; expansionRun.current++; };
  }, [rootId, treeId, date, dashboard, legNames, retry]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let active = true;
    const resize = () => {
      const { width, height } = svg.getBoundingClientRect();
      const fontFamily = getComputedStyle(svg).fontFamily;
      setChartSize(old => old.width === width && old.height === height && old.fontFamily === fontFamily
        ? old : { width, height, fontFamily });
    };
    const fontsReady = () => {
      if (!active) return;
      resize();
      setFontRevision(old => old + 1);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(svg);
    document.fonts?.ready.then(fontsReady);
    document.fonts?.addEventListener('loadingdone', fontsReady);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', fontsReady);
    };
  }, [root]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = event => {
      if (!event.deltaY) return;
      const point = pointerPosition(event);
      if (!point) return;
      event.preventDefault();
      if (drag.current) return;
      setPreview(null);
      const factor = fanWheelFactor(event.deltaY, event.deltaMode, svg.clientHeight);
      setTransform(old => zoomFanAt(old, factor, point));
    };
    // React's wheel listener is passive; use a local non-passive listener so
    // zooming the chart does not also scroll the page.
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [root]);

  async function loadChildren(nodeId, current = session.current, { count = FAN_PAGE_SIZE, isActive = () => current.active } = {}) {
    const id = String(nodeId);
    if (!current?.active || !isActive()) return;
    if (current.requests.has(id)) {
      const result = await current.requests.get(id);
      // A new focus may share a queued request cancelled by the old focus.
      if (result === undefined && current.active && isActive()) return loadChildren(id, current, { count, isActive });
      return result;
    }
    const previous = current.pages.get(id);
    if (previous?.done) return previous;
    current.pending.add(id);
    setPending(new Set(current.pending));
    setErrors(old => { const next = new Map(old); next.delete(id); return next; });
    const loading = requestQueue.current(() => request(CHILD_QUERY, {
      treeIds: [String(treeId)], nodeIds: [id], date,
      offset: previous?.offset || 0, count
    }), () => current.active && isActive()).then(parent => {
      if (!current.active || parent === undefined) return;
      if (!parent) throw new Error('This branch is unavailable for the selected date.');
      const fetched = parent.nodes || [];
      const card = dashboard?.children?.[0];
      const visible = fetched.filter(node => !card || !node.customer ||
        card.children?.length || node.customer.widgets?.some(widget => widget.id === card.widgetId));
      const unique = new Map((previous?.nodes || []).map(node => [String(node.nodeId), node]));
      visible.forEach(node => unique.set(String(node.nodeId), { ...node, uplineId: id }));
      // Preserve occupied legs even when a dashboard hides their customer.
      const occupiedLegs = new Set([...(previous?.occupiedLegs || []), ...fetched.map(node => String(node.uplineLeg).toLowerCase())]);
      current.pages.set(id, {
        nodes: [...unique.values()], occupiedLegs,
        hiddenCustomers: previous?.hiddenCustomers || visible.length !== fetched.length,
        offset: (previous?.offset || 0) + fetched.length, done: fetched.length < count
      });
      setPages(new Map(current.pages));
      return current.pages.get(id);
    }).catch(error => {
      if (current.active) setErrors(old => new Map(old).set(id, error.message));
      return null;
    }).finally(() => {
      current.pending.delete(id);
      current.requests.delete(id);
      if (current.active) setPending(new Set(current.pending));
    });
    current.requests.set(id, loading);
    return loading;
  }

  function updateExpanded(update, current = session.current) {
    if (!current?.active) return;
    current.expanded = update(current.expanded);
    setExpanded(new Set(current.expanded));
  }

  async function startAutoExpansion(node, current = session.current) {
    if (!node || !current?.active) return;
    const run = ++expansionRun.current;
    const isActive = () => current.active && run === expansionRun.current;
    setAutoExpanding(true);
    setAutoLimited(false);
    const id = String(node.nodeId);
    const rootPageIndex = current.childPages.get(id) || 0;
    try {
      const result = await autoExpandFan({
        root: node, pages: current.pages, getExpanded: () => current.expanded, legNames, isActive, rootPageIndex,
        loadChildren: (id, options) => loadChildren(id, current, options),
        expand: id => updateExpanded(old => new Set(old).add(id), current)
      });
      if (isActive()) {
        setAutoLimited(result.limited);
        current.childPages.set(id, fanChildPage(node, current.pages.get(id), legNames, rootPageIndex).index);
        setChildPages(new Map(current.childPages));
      }
    } finally {
      if (isActive()) setAutoExpanding(false);
    }
  }

  const nodes = new Map(root ? [[String(root.nodeId), root]] : []);
  pages.forEach(page => page.nodes.forEach(node => nodes.set(String(node.nodeId), node)));
  const focus = nodes.get(String(focusId)) || root;
  const focusedId = focus?.nodeId == null ? undefined : String(focus.nodeId);
  const focusedPage = pages.get(focusedId);
  const branchLoading = autoExpanding || pending.size > 0;
  const childPage = fanChildPage(focus, focusedPage, legNames, childPages.get(focusedId) || 0);
  const ancestors = fanAncestorPath(focus, nodes);
  const parent = ancestors[ancestors.length - 2];
  const parentKey = parent && String(parent.nodeId);
  const parentName = parent?.customer?.fullName || 'Unnamed customer';
  const parentWidth = 160;
  const parentHeight = 55;
  const pagerWidth = 220;
  const pagerHeight = 70;
  const pagerTop = FAN_ROOT_RADIUS + 16;
  const parentTop = childPage.paged ? pagerTop + pagerHeight + 12 : FAN_ROOT_RADIUS + 16;
  const parentLabelY = parentTop + parentHeight / 2;
  const parentNameWidth = parentWidth - 20;
  const sectors = layoutFan(focus, pages, expanded, legNames, FAN_MAX_DEPTH, childPage.index);
  const depth = Math.max(0, ...sectors.map(sector => sector.depth));
  const contentRadius = fanRingRadii(Math.max(1, depth)).outer;
  const contentBottom = Math.max(parent ? parentTop + parentHeight : FAN_ROOT_RADIUS,
    childPage.paged ? pagerTop + pagerHeight : 0, contentRadius * Math.sin(FAN_END_ANGLE));
  // Follow the initial focus as it expands, then keep the same SVG framing
  // throughout paging, even if later pages have fewer or more rings.
  const { radius, bottom } = viewport || { radius: contentRadius, bottom: contentBottom };
  const screenScale = Math.min(chartSize.width / (2 * radius + 48), chartSize.height / (radius + bottom + 48)) * transform.scale;
  const visiblePreview = preview && (preview.key === parentKey || sectors.some(sector => sector.key === preview.key)) ? preview : null;

  useEffect(() => {
    onFocusChange(focusedId);
  }, [focusedId, onFocusChange]);

  useLayoutEffect(() => {
    if (!visiblePreview || !previewRef.current || !chartRef.current) return;
    const position = () => {
      const bounds = chartRef.current.getBoundingClientRect();
      const popup = previewRef.current.getBoundingClientRect();
      let x = visiblePreview.x + 12;
      let y = visiblePreview.y + 12;
      if (x + popup.width > bounds.width - 8) x = visiblePreview.x - popup.width - 12;
      if (y + popup.height > bounds.height - 8) y = visiblePreview.y - popup.height - 12;
      previewRef.current.style.left = `${Math.max(8, Math.min(x, bounds.width - popup.width - 8))}px`;
      previewRef.current.style.top = `${Math.max(8, Math.min(y, bounds.height - popup.height - 8))}px`;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [visiblePreview, chartSize, fontRevision]);

  function hideHoverPreview(key) {
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      setPreview(old => old?.key === key && old.source === 'hover' ? null : old);
    }, 180);
  }

  function showPreview(event, node, source) {
    if (drag.current || (source === 'hover' && event.pointerType === 'touch')) return;
    clearTimeout(previewTimer.current);
    const chart = chartRef.current?.getBoundingClientRect();
    if (!chart) return;
    const segment = event.currentTarget.getBoundingClientRect();
    const keyboard = source === 'focus';
    setPreview({ key: node.key || String(node.nodeId), node, source,
      x: (keyboard ? segment.left + segment.width / 2 : event.clientX) - chart.left,
      y: (keyboard ? segment.top + segment.height / 2 : event.clientY) - chart.top });
  }

  function cancelLevelExpansion() {
    expansionRun.current++;
    setAutoExpanding(false);
    setAutoLimited(false);
  }

  function focusBranch(node, recordHistory = true) {
    if (!node || node.empty || node.summary) return;
    cancelLevelExpansion();
    setPreview(null);
    if (String(node.nodeId) !== String(focus?.nodeId)) {
      if (recordHistory) setHistory(old => [...old, String(focus.nodeId)]);
      setFocusId(String(node.nodeId));
    }
    setTransform({ x: 0, y: 0, scale: 1 });
    setViewport(null);
    startAutoExpansion(node);
  }

  function choose(node) {
    if (suppressClick.current || node.summary) return;
    setPreview(null);
    if (node.empty) {
      onSelect({ uplineId: node.uplineId, uplineLeg: node.uplineLeg });
      return;
    }
    focusBranch(node);
  }

  function changeChildPage(index) {
    if (!session.current?.active || autoExpanding) return;
    cancelLevelExpansion();
    clearTimeout(previewTimer.current);
    setPreview(null);
    setViewport(old => old || { radius, bottom });
    session.current.childPages.set(focusedId, index);
    setChildPages(new Map(session.current.childPages));
    startAutoExpansion(focus);
  }

  function fitFan() {
    setPreview(null);
    setViewport({ radius: contentRadius, bottom: contentBottom });
    setTransform({ x: 0, y: 0, scale: 1 });
  }

  function zoom(factor) {
    setPreview(null);
    setTransform(old => zoomFanAt(old, factor));
  }

  function pointerPosition(event) {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  }

  return <div className="container-fluid fan-view">
      {headerTarget && createPortal(root ? <nav className="fan-breadcrumbs" aria-label="Fan path">
        <ol>
          {ancestors.map((node, index) => <li key={node.nodeId}>
            {index > 0 && <span className="fan-breadcrumb-separator" aria-hidden="true">›</span>}
            {index === ancestors.length - 1 ? <div className="fan-current-customer" aria-current="location">
              <h2 className="page-title">{node.customer?.fullName || 'Unnamed customer'}</h2>
            </div> : <button type="button" className="btn btn-link btn-sm"
              onClick={() => focusBranch(node)}>
              {node.customer?.fullName || 'Unnamed customer'}
            </button>}
          </li>)}
        </ol>
      </nav> : <h2 className="page-title">{rootName}</h2>, headerTarget)}
      {errors.has('root') && <div className="py-3" role="alert">
        {errors.get('root')} <button type="button" className="btn btn-sm ms-2" onClick={() => setRetry(old => old + 1)}>Retry</button>
      </div>}
      {pending.has('root') && <div className="py-3 text-center" role="status">Loading fan view…</div>}
      {root && <>
        {autoLimited && <div className="pb-2 text-muted small" role="status">
          Some branches are not shown yet. Focus a position to explore its connections.
        </div>}
        {[...errors].filter(([id]) => id !== 'root').map(([id, message]) => <div key={id} className="py-2" role="alert">
          {message} <button type="button" className="btn btn-sm" disabled={pending.has(id)} onClick={() => {
            cancelLevelExpansion();
            if (id === focusedId) startAutoExpansion(focus);
            else {
              updateExpanded(old => new Set(old).add(id));
              loadChildren(id);
            }
          }}>Retry</button>
        </div>)}
        <div ref={chartRef} className="fan-chart-container" onKeyDownCapture={event => {
          if (event.key === 'Escape') setPreview(null);
        }}>
        {branchLoading && <div className="fan-loading-overlay">
          <div className="fan-loading-status" role="status" aria-live="polite">
            <span className="spinner-border text-primary" aria-hidden="true" />
            <span>Loading branch…</span>
          </div>
        </div>}
        <div className="fan-floating-controls" role="group" aria-label="Fan navigation" onPointerEnter={() => setPreview(null)}>
          <button type="button" className="btn btn-sm" disabled={!history.length} onClick={() => {
            const id = history[history.length - 1];
            setHistory(old => old.slice(0, -1));
            focusBranch(nodes.get(id), false);
          }}>Back</button>
          <div className="btn-group" role="group" aria-label="Fan zoom">
            <button type="button" className="btn btn-sm" aria-label="Zoom out" onClick={() => zoom(1 / 1.25)}>−</button>
            <button type="button" className="btn btn-sm" onClick={fitFan}>Fit</button>
            <button type="button" className="btn btn-sm" aria-label="Zoom in" onClick={() => zoom(1.25)}>+</button>
          </div>
        </div>
        <svg ref={svgRef} className="fan-chart" viewBox={`${-radius - 24} ${-radius - 24} ${2 * radius + 48} ${radius + bottom + 48}`}
          role="group" aria-busy={branchLoading} aria-label={`Organization fan for ${focus?.customer?.fullName}`} onPointerDown={event => {
            if (event.button !== 0 || !event.isPrimary) return;
            suppressClick.current = false;
            setPreview(null);
            drag.current = { point: pointerPosition(event), x: event.clientX, y: event.clientY, transform };
          }} onPointerMove={event => {
            if (!drag.current?.point) return;
            if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < 5) return;
            suppressClick.current = true;
            setPreview(null);
            svgRef.current.setPointerCapture(event.pointerId);
            const point = pointerPosition(event);
            if (point) setTransform({ ...drag.current.transform,
              x: drag.current.transform.x + point.x - drag.current.point.x,
              y: drag.current.transform.y + point.y - drag.current.point.y });
          }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
          onPointerLeave={() => { if (!suppressClick.current) drag.current = null; }}>
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            {childPage.paged && <foreignObject x={-pagerWidth / 2} y={pagerTop} width={pagerWidth} height={pagerHeight}
              className="fan-child-pages-panel" onPointerDown={event => event.stopPropagation()}
              onPointerEnter={() => setPreview(null)} onFocus={() => setPreview(null)}>
              <nav className="fan-child-pages" aria-label="Fan pages" aria-busy={autoExpanding}>
                <span className="fan-child-page-caption" role="status">{!childPage.loaded
                  ? autoExpanding ? 'Loading…' : 'More to load'
                  : `${childPage.start + 1}–${childPage.end} of ${childPage.total ?? `${childPage.loaded}+`}`}</span>
                <div className="fan-child-page-buttons">
                  <button type="button" className="btn btn-sm" disabled={childPage.index === 0 || autoExpanding}
                    onClick={() => changeChildPage(childPage.index - 1)}>Previous</button>
                  <button type="button" className="btn btn-sm" disabled={!childPage.hasNext || autoExpanding}
                    onClick={() => changeChildPage(childPage.index + (childPage.loaded ? 1 : 0))}>
                    {childPage.loaded ? 'Next' : 'Load more'}
                  </button>
                </div>
              </nav>
            </foreignObject>}
            <g className="fan-placeholders" aria-hidden="true">
              {fanPlaceholders(sectors).map(({ key, depth: level, start, end }) =>
                <path key={key} d={fanSectorPath(level, start, end)} />)}
            </g>
            {parent && <g className="fan-node fan-parent" role="button" tabIndex={0}
              aria-label={`Up one level to ${parentName}, customer ${parentKey}`}
              aria-describedby={visiblePreview?.key === parentKey ? `${labelId}-preview` : undefined}
              onPointerEnter={event => showPreview(event, parent, 'hover')}
              onPointerLeave={() => hideHoverPreview(parentKey)}
              onFocus={event => { suppressClick.current = false; showPreview(event, parent, 'focus'); }}
              onBlur={event => {
                if (!previewRef.current?.contains(event.relatedTarget)) setPreview(old => old?.key === parentKey ? null : old);
              }}
              onClick={() => choose(parent)} onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault(); suppressClick.current = false; choose(parent);
                }
              }}>
              <rect x={-parentWidth / 2} y={parentTop} width={parentWidth} height={parentHeight} fill="#dbeafe" />
              <text x="0" y={parentLabelY - 10} textAnchor="middle" dominantBaseline="central"
                className="fan-node-meta">Up one level</text>
              <text x="0" y={parentLabelY + 6} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: '12px', fontFamily: chartSize.fontFamily }}>
                {fitFanText(parentName, parentNameWidth, text => measureText(text, 12, 600))}
              </text>
            </g>}
            {sectors.map((sector, index) => {
              const { node, key, depth: level, start, end, branch } = sector;
              const angle = (start + end) / 2;
              const label = node.summary ? node.label : node.empty ? `Empty ${node.uplineLeg}` : node.customer?.fullName || 'Unnamed customer';
              const displayLabel = node.summary && level > FAN_MAX_DEPTH
                ? node.descendantCount == null ? '+' : String(node.descendantCount)
                : label;
              let rotation = angle * 180 / Math.PI;
              if (rotation < -90) rotation += 180;
              const indicator = fanBranchIndicator(node, level, pages, expanded);
              const labelLayout = fanLabelLayout({ depth: level, start, end, scale: screenScale,
                name: displayLabel, detail: node.summary ? node.detailLabel : node.empty ? 'Place customer' : '',
                measure: measureText, allowCurve: !node.summary && !node.empty });
              // A truncated count could be misleading; the full summary stays
              // available on hover and keyboard focus even without a label.
              const fitted = node.summary && labelLayout?.name !== displayLabel ? null : labelLayout;
              const detail = node.summary && fitted?.detail !== node.detailLabel ? '' : fitted?.detail;
              const point = fitted && (level ? fanPoint(fitted.radius, angle) : { x: 0, y: 0 });
              const path = fanSectorPath(level, start, end);
              const clipId = `${labelId}-segment-${index}`;
              return <g key={key} className={`fan-node${node.empty ? ' is-empty' : ''}${node.summary ? ' is-summary' : ''}`}
                role={node.summary ? 'img' : 'button'} tabIndex={0} aria-label={node.summary ?
                  `${label}. ${node.detailLabel ? `${node.detailLabel}. ` : ''}${node.countDescription} ${node.instruction}` : node.empty ? `${label}, choose placement` :
                  `${label}, customer ${node.nodeId}, level ${level}, ${indicator === 'more' ? 'More direct connections to explore, ' : indicator ? 'Has direct connections, ' : ''}Focus fan here`}
                aria-describedby={visiblePreview?.key === key ? `${labelId}-preview` : undefined}
                onPointerEnter={event => showPreview(event, node, 'hover')}
                onPointerLeave={() => hideHoverPreview(key)}
                onFocus={event => { suppressClick.current = false; showPreview(event, node, 'focus'); }}
                onBlur={event => {
                  if (!previewRef.current?.contains(event.relatedTarget)) setPreview(old => old?.key === key ? null : old);
                }}
                onClick={node.summary ? undefined : () => choose(node)} onKeyDown={node.summary ? undefined : event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); suppressClick.current = false; choose(node);
                  }
                }}>
                <path d={path} fill={level === 0 ? '#1e3a5f' : COLORS[branch % COLORS.length]}
                  fillOpacity={node.summary ? 0.45 : 1} />
                {fitted && <g clipPath={`url(#${clipId})`} className="fan-label">
                  <defs>
                    <clipPath id={clipId} clipPathUnits="userSpaceOnUse"><path d={path} /></clipPath>
                    {fitted.arcPath && <path id={`${clipId}-arc`} d={fitted.arcPath} />}
                  </defs>
                  <text transform={fitted.arcPath ? undefined : `translate(${point.x} ${point.y}) rotate(${level ? rotation : 0})`}
                    textAnchor="middle" dominantBaseline="central" className={level === 0 ? 'fan-root-label' : ''}
                    style={{ fontSize: `${fitted.fontSize}px`, fontFamily: chartSize.fontFamily }}>
                    {fitted.arcPath ? <textPath href={`#${clipId}-arc`} startOffset="50%">{fitted.name}</textPath> : <>
                      <tspan x="0" y={fitted.nameY}>{fitted.name}</tspan>
                      {detail && <tspan x="0" y={fitted.detailY} className="fan-node-meta"
                        style={{ fontSize: `${fitted.detailSize}px` }}>{detail}</tspan>}
                    </>}
                  </text>
                </g>}
              </g>;
            })}
          </g>
        </svg>
        {visiblePreview && <div ref={previewRef} id={`${labelId}-preview`} role="tooltip" className="fan-name-preview"
          style={{ maxHeight: chartSize.height ? chartSize.height - 16 : undefined }}
          onPointerEnter={() => clearTimeout(previewTimer.current)}
          onPointerLeave={() => hideHoverPreview(visiblePreview.key)}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null); }}>
          <FanCardPreview key={visiblePreview.key} node={visiblePreview.node} treeId={treeId}
            date={date} dashboard={dashboard} trees={trees} cache={previewCache} />
        </div>}
        </div>
        <div className="fan-help text-muted small">
          {sectors.length === 1 && !pending.size ? 'No connections are currently shown. ' : ''}
          Scroll to zoom · Drag to pan
        </div>
      </>}
  </div>;
};

FanView.propTypes = {
  rootId: PropTypes.string.isRequired,
  rootName: PropTypes.string,
  headerTarget: PropTypes.object,
  treeId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  legNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  dashboard: PropTypes.object,
  trees: PropTypes.array,
  onSelect: PropTypes.func.isRequired,
  onFocusChange: PropTypes.func.isRequired
};

export default FanView;
