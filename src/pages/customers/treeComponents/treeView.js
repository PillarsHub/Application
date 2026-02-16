import { renderToStaticMarkup } from "react-dom/server";
import { Post } from "../../../hooks/usePost";
import "./treeView.css";

function treeBorad(id, rootId, treeId, periodDate, dataUrl, selectNode, getTemplate, getLoading) {
  const defaults = {
    canvasBox: 'canvasBox',
    canvasBoradIdName: 'tree',
  };

  let currentPeriodDate = periodDate;

  // --- State & indexes ---
  const nodeIndex = new Map(); // nodeId -> { li, nodeDiv, parentUl }
  const ulIndex = new Map();   // parentNodeId -> child <ul>
  let treeLegs = null;         // array of leg names (lowercased) or null
  let legsWithRealNodeAtRoot = []; // lowercased leg names that actually have a first-gen node
  let treeLegsOriginal = null;   // original-cased for templates

  const PAGE_SIZE = 100;                      // you can tune this
  const childPaging = new Map();              // parentId -> { offset, count, done }

  // Helper to init/get paging state
  function getPaging(parentId) {
    const key = String(parentId);
    let st = childPaging.get(key);
    if (!st) {
      st = { offset: 0, count: PAGE_SIZE, done: false };
      childPaging.set(key, st);
    }
    return st;
  }

  function removeLoadMoreRow(parentUl) {
    if (!parentUl) return;
    const row = parentUl.querySelector('li[data-load-more="1"]');
    if (row) parentUl.removeChild(row);
  }

  function insertLoadMoreRow(parentUl, onClick) {
    if (!parentUl) return null;
    removeLoadMoreRow(parentUl);

    const li = document.createElement('li');
    li.setAttribute('data-load-more', '1');
    li.style.listStyle = 'none';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-secondary btn-sm';
    btn.textContent = 'Load more';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick?.();
    });

    // small spacer for readability
    const wrap = document.createElement('div');
    wrap.className = 'node-host';
    wrap.style.padding = '6px 8px';
    wrap.appendChild(btn);

    li.appendChild(wrap);
    parentUl.appendChild(li);
    return li;
  }

  // Ready callback plumbing (fires AFTER root's first-gen is loaded)
  let rootLoaded = false;        // means: first-generation of root is loaded
  const readyCallbacks = [];

  // Host
  const tagbox = document.getElementById(id);
  if (!tagbox) return () => { };

  // Clear host
  while (tagbox.firstChild) tagbox.removeChild(tagbox.firstChild);

  const canvasBox = document.createElement('div');
  const canvas = document.createElement('div');

  canvas.style.width = '999999px';
  canvas.style.height = `${window.innerHeight}px`;
  canvas.style.transformOrigin = 'top left';
  canvas.classList.add("genealogy-tree");

  canvasBox.id = defaults.canvasBox;
  canvas.id = defaults.canvasBoradIdName;

  tagbox.appendChild(canvasBox);
  canvasBox.appendChild(canvas);

  canvasBox.classList.add("genealogy-host");
  canvasBox.style.touchAction = 'none'; // important on mobile
  tagbox.style.overflow = 'hidden';
  tagbox.style.position = "fixed";

  // Transform context (virtual canvas)
  const ctx = {};
  trackTransforms();

  let lastX = (canvasBox.canvas || 0) / 2;
  let lastY = (window.innerHeight || 0) / 2;
  let dragStart = null;
  let dragged = false;
  let activeNode = null;

  // GPU-batched redraw
  let rafId = null;
  const scheduleRedraw = () => {
    if (rafId != null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const tx = ctx.getTransform();
      canvas.style.transform = `matrix3d(${tx.a}, ${tx.b}, 0, 0, ${tx.c}, ${tx.d}, 0, 0, 0, 0, 1, 0, ${tx.e}, ${tx.f}, 0, 1)`;
    });
  };
  const redraw = scheduleRedraw;

  // Zoom clamping
  const scaleFactor = 1.1;
  let zoomLevel = 1;
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 3;

  const zoom = (clicks) => {
    const pt = ctx.transformedPoint(lastX, lastY);
    const factor = Math.pow(scaleFactor, clicks);
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomLevel * factor));
    if (next === zoomLevel) return;
    const adj = next / zoomLevel;
    zoomLevel = next;

    canvas.style.willChange = 'transform';
    ctx.translate(pt.x, pt.y);
    ctx.scale(adj, adj);
    ctx.translate(-pt.x, -pt.y);
    redraw();
    setTimeout(() => { canvas.style.willChange = ''; }, 120);
  };

  // Offsets cache
  let canvasLeft = 0, canvasTop = 0;
  const recalcOffsets = () => {
    canvasLeft = canvas.offsetLeft;
    canvasTop = canvas.offsetTop;
  };
  recalcOffsets();

  // Helpers
  const posFromMouse = (evt) => ({
    x: (evt.pageX - canvasLeft),
    y: (evt.pageY - canvasTop)
  });

  const handlers = [];
  const add = (el, ev, fn, opts) => {
    el.addEventListener(ev, fn, opts);
    handlers.push(() => el.removeEventListener(ev, fn, opts));
  };

  // Mouse handlers
  const onMouseDown = (evt) => {
    document.body.style.userSelect = 'none';
    recalcOffsets();
    const p = posFromMouse(evt);
    lastX = p.x; lastY = p.y;
    dragStart = ctx.transformedPoint(lastX, lastY);
    dragged = false;
  };

  const onMouseMove = (evt) => {
    const p = posFromMouse(evt);
    if (Math.abs(p.x - lastX) > 5 || Math.abs(p.y - lastY) > 5) dragged = true;
    lastX = p.x; lastY = p.y;
    const flags = evt.buttons !== undefined ? evt.buttons : evt.which;
    if (flags === 0) dragStart = null;
    if (dragStart) {
      const pt = ctx.transformedPoint(lastX, lastY);
      ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
      redraw();
    }
  };

  const onMouseUp = () => {
    dragStart = null;
    requestAnimationFrame(() => { dragged = false; });
  };

  const onWheel = (evt) => {
    const dy = ('deltaY' in evt) ? -evt.deltaY : (evt.wheelDelta ? evt.wheelDelta : (evt.detail ? -evt.detail : 0));
    const clicks = dy / 120;
    if (clicks) zoom(clicks);
    if (evt.cancelable) evt.preventDefault();
    return false;
  };

  // Touch handlers
  let prevDiff = -1;

  const onTouchStart = (evt) => {
    if (!evt.touches || evt.touches.length === 0) return;
    lastX = (evt.touches[0].pageX - canvas.offsetLeft);
    lastY = (evt.touches[0].pageY - canvas.offsetTop);
    dragStart = ctx.transformedPoint(lastX, lastY);
  };

  const onTouchMove = (evt) => {
    if (evt.cancelable) evt.preventDefault();

    if (evt.touches && evt.touches.length > 1) {
      let x1 = evt.touches[0].pageX;
      let y1 = evt.touches[0].pageY;
      let x2 = evt.touches[1].pageX;
      let y2 = evt.touches[1].pageY;
      let curDiff = Math.hypot(x2 - x1, y2 - y1);

      if (prevDiff > 0) {
        zoom(curDiff > prevDiff ? curDiff * 0.003 : curDiff * -0.003);
      }

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      lastX = (midX - canvas.offsetLeft);
      lastY = (midY - canvas.offsetTop);
      dragStart = ctx.transformedPoint(lastX, lastY);

      prevDiff = curDiff;
    } else if (evt.touches && evt.touches.length === 1) {
      const lX = (evt.touches[0].pageX - canvas.offsetLeft);
      const lY = (evt.touches[0].pageY - canvas.offsetTop);
      lastX = lX; lastY = lY;

      if (dragStart) {
        const pt = ctx.transformedPoint(lastX, lastY);
        ctx.translate(pt.x - dragStart.x, pt.y - dragStart.y);
        redraw();
      }
    }
  };

  const onTouchEnd = (evt) => {
    if (evt.touches && evt.touches.length === 1) {
      lastX = (evt.touches[0].pageX - canvas.offsetLeft);
      lastY = (evt.touches[0].pageY - canvas.offsetTop);
      dragStart = ctx.transformedPoint(lastX, lastY);
    } else {
      prevDiff = -1;
    }
  };

  let flipHeightRafId = null;
  const scheduleFlipHeightSync = () => {
    if (flipHeightRafId != null) return;
    flipHeightRafId = requestAnimationFrame(() => {
      flipHeightRafId = null;
      syncFlipCardHeight(canvas);
    });
  };

  function syncFlipCardHeight(nodeHostOrRoot) {
    if (!nodeHostOrRoot) return;

    const flipCards = [];
    if (nodeHostOrRoot.classList?.contains('flip-card')) {
      flipCards.push(nodeHostOrRoot);
    }
    if (typeof nodeHostOrRoot.querySelectorAll === 'function') {
      nodeHostOrRoot.querySelectorAll('.flip-card').forEach((card) => flipCards.push(card));
    }

    for (const flipCard of flipCards) {
      const front = flipCard.querySelector('.flip-card-front');
      const back = flipCard.querySelector('.flip-card-back');
      if (!front) continue;

      if (!back) {
        flipCard.classList.add('no-back');
        flipCard.style.removeProperty('--flip-card-height');
        continue;
      }

      flipCard.classList.remove('no-back');
      const frontContentHeight = front.firstElementChild?.scrollHeight || 0;
      const backContentHeight = back.firstElementChild?.scrollHeight || 0;
      const frontHeight = Math.max(front.scrollHeight || 0, frontContentHeight);
      const backHeight = Math.max(back.scrollHeight || 0, backContentHeight);
      const maxHeight = Math.max(frontHeight, backHeight);
      if (maxHeight > 0) {
        flipCard.style.setProperty('--flip-card-height', `${maxHeight}px`);
      }
    }
  }


  add(canvasBox, 'mousedown', onMouseDown);
  add(canvasBox, 'mousemove', onMouseMove);
  add(canvasBox, 'mouseup', onMouseUp);
  add(canvasBox, 'wheel', onWheel, { passive: false });
  add(canvasBox, 'DOMMouseScroll', onWheel, { passive: false });
  add(canvasBox, 'mousewheel', onWheel, { passive: false });
  add(canvasBox, 'touchstart', onTouchStart, { passive: false });
  add(canvasBox, 'touchmove', onTouchMove, { passive: false });
  add(canvasBox, 'touchend', onTouchEnd, { passive: false });
  add(window, 'resize', () => {
    recalcOffsets();
    scheduleFlipHeightSync();
  }, { passive: true });

  // Initial draw
  redraw();

  // --- Utilities / helpers ---

  function BuildLoading(parent) {
    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.classList.add("node-host");
    nodeDiv.style.left = 0;
    nodeDiv.style.top = 0;
    nodeDiv.innerHTML = renderToStaticMarkup(getLoading());
    li.appendChild(nodeDiv);
    parent.appendChild(li);
    return li;
  }

  function ensureChildUl(parentId) {
    if (!parentId) return null;
    let ul = ulIndex.get(parentId);
    if (ul) return ul;

    const host = canvas.querySelector(`.node-host[data-nodeid="${parentId}"]`);
    if (host) {
      const container = host.parentElement; // <li>
      ul = container.querySelector('ul');
      if (ul) {
        ul.setAttribute('data-nodeId', parentId);
        ulIndex.set(parentId, ul);
        return ul;
      }
      ul = document.createElement('ul');
      ul.setAttribute('data-nodeId', parentId);
      ul.style.display = "none";
      container.appendChild(ul);
      ulIndex.set(parentId, ul);
      return ul;
    }
    return null;
  }

  function insertIntoUlRespectingLegs(ul, li, uplineLeg) {
    if (!ul) return;
    if (!treeLegs || !uplineLeg) {
      ul.appendChild(li);
      return;
    }
    const desired = String(uplineLeg).toLowerCase();
    const desiredIdx = treeLegs.indexOf(desired);
    if (desiredIdx < 0) { ul.appendChild(li); return; }

    let placed = false;
    for (const childLi of ul.children) {
      const host = childLi.querySelector('.node-host');
      if (!host) continue;
      const leg = host.getAttribute('data-uplineLeg')?.toLowerCase();
      const idx = leg ? treeLegs.indexOf(leg) : Number.MAX_SAFE_INTEGER;
      if (idx >= desiredIdx) {
        ul.insertBefore(li, childLi);
        placed = true;
        break;
      }
    }
    if (!placed) ul.appendChild(li);
  }

  function centerOnNode(nodeDiv, { vBias = 0.70 } = {}) {
    if (!nodeDiv) return;
    // make sure offsets are fresh
    recalcOffsets();
    const tx = ctx.getTransform();
    const rect = nodeDiv.getBoundingClientRect();
    // screen position of the point we want to center on (prefer a slight vertical bias)
    const screenX = rect.left + rect.width / 2 + window.scrollX;
    const screenY = rect.top + rect.height * (vBias ?? 0.35) + window.scrollY;
    // convert to canvas-local coordinates (pre-transform)
    const localX = screenX - canvas.offsetLeft;
    const localY = screenY - canvas.offsetTop;
    // map from screen → world using inverse of current transform
    const worldPt = ctx.transformedPoint(localX, localY);
    const viewportW = canvasBox.clientWidth;
    const viewportH = canvasBox.clientHeight;
    const targetX = (viewportW / 2) - tx.a * worldPt.x;
    const targetY = (viewportH * (vBias ?? 0.35)) - tx.d * worldPt.y;
    ctx.setTransform(tx.a, tx.b, tx.c, tx.d, targetX, targetY);
    redraw();
  }

  function isUlVisible(ul) {
    return !!ul && ul.style.display !== 'none';
  }

  function deepestVisibleIndexOnPath(pathIds) {
    if (!Array.isArray(pathIds) || pathIds.length === 0) return 0;
    let deepest = 0;
    for (let i = 0; i < pathIds.length; i++) {
      const id = pathIds[i];
      const rec = nodeIndex.get(id);
      if (!rec) break; // not rendered yet

      if (i === 0) { deepest = i; continue; }

      const parentId = pathIds[i - 1];
      const parentUl = ulIndex.get(parentId);
      if (!isUlVisible(parentUl)) break;
      deepest = i;
    }
    return deepest;
  }

  // Count only real children (exclude loading rows and empty leg placeholders)
  function countRealChildren(ul) {
    if (!ul) return 0;
    let count = 0;
    for (const childLi of ul.children) {
      const host = childLi.querySelector('.node-host');
      if (!host) continue;
      if (host.hasAttribute('data-loading-slot')) continue;     // spinner rows
      if (host.hasAttribute('data-empty-slot')) continue;       // leg placeholders
      const id = host.getAttribute('data-nodeId');
      if (!id || id === 'undefined' || id === 'null') continue; // not a real node
      count++;
    }
    return count;
  }

  // --- Fetch helpers (GraphQL via Post) ---

  async function fetchBottomForLeg({ dataUrl, treeId, fromNodeId, leg }) {
    const data = {
      query: `
      query ($treeId: String!, $nodeIds: [String]!, $leg: String!, $date: Date) {
        trees(idList: [$treeId]) {
          nodes(nodeIds: $nodeIds, date: $date) {
            bottomPath(leg: $leg) {
              uplineId
              nodeId
              uplineLeg
            }
          }
        }
      }
    `,
      variables: {
        treeId: String(treeId),
        nodeIds: [String(fromNodeId)],
        leg: String(leg),
        date: currentPeriodDate
      }
    };

    return new Promise((resolve, reject) => {
      Post(dataUrl, data, (resp) => {
        const chain = resp?.data?.trees?.[0]?.nodes?.[0]?.bottomPath || [];
        if (!chain.length) {
          resolve(null);
          return;
        }

        // Build a path including the starting node at the top, then all bottomPath nodes
        const path = [String(fromNodeId), ...chain.map(step => String(step.nodeId))];

        resolve({
          bottomNodeId: path[path.length - 1],
          path
        });
      }, reject);
    });
  }

  async function fetchNodeBasics({ dataUrl, treeId, nodeId }) {
    const data = {
      query: `
      query NodeBasics($treeIds: [String]!, $nodeIds: [String]!, $cardIds: [String]!, $date: Date) {
        trees(idList: $treeIds) {
          nodes(nodeIds: $nodeIds, date: $date) {
            nodeId
            uplineLeg
            totalChildNodes
            customer {
              id
              webAlias
              fullName
              enrollDate
              profileImage
              status { id name statusClass }
              phoneNumbers { type number }
              emailAddress
              customerType { id name }
              cards(idList: $cardIds, date: $date) {
                name
                values { value valueName valueId }
              }
              widgets {
                id
                name
                title
                description
                type
                showDatePicker
                headerColor
                headerTextColor
                headerAlignment
                backgroundColor
                textColor
                borderColor
                css
                settings
                panes {
                  imageUrl
                  title
                  text
                  description
                  values { text value }
                }
              }
            }
          }
        }
      }
    `,
      variables: {
        treeIds: [String(treeId)],
        nodeIds: [String(nodeId)],
        cardIds: [`Tree-${String(treeId)}`],
        date: currentPeriodDate
      }
    };

    return new Promise((resolve, reject) => {
      Post(dataUrl, data, (resp) => {
        const t = resp?.data?.trees?.[0];
        resolve(t?.nodes?.[0] || null);
      }, reject);
    });
  }


  // --- Building & expanding ---

  function handleExpand(expandDiv) {
    const target = expandDiv.parentElement.parentElement;
    const startPos = expandDiv.offsetLeft;

    for (const child of target.children) {
      if (child.tagName === 'UL') {
        if (child.style.display === "none") {
          if (child.children.length === 0) addNodes(child, expandDiv);
          child.style.display = "block";
          expandDiv.classList.remove("collaped");
          expandDiv.classList.add("expanded");
        } else {
          child.style.display = "none";
          expandDiv.classList.remove("expanded");
          expandDiv.classList.add("collaped");
        }
      }
    }

    const endPos = expandDiv.offsetLeft;
    ctx.translate(startPos - endPos, 0);
    redraw();
  }

  function addChild(ul, node) {
    if (node?.nodeId && nodeIndex.has(String(node.nodeId))) {
      return null;
    }

    let result = null;
    if (node.uplineLeg?.toLowerCase() === "holding tank") return null;
    if (!node || (!node.customer && !node.legs)) return null;

    // If template returns null/undefined, skip rendering this child entirely.
    const tpl = getTemplate(node);
    if (tpl == null) return null;
    const template = renderToStaticMarkup(tpl);

    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.classList.add("node-host");
    nodeDiv.setAttribute('data-nodeId', node.nodeId);
    nodeDiv.setAttribute('data-uplineLeg', node.uplineLeg);
    nodeDiv.setAttribute('data-uplineId', node.uplineId);
    // Mark empty leg placeholders so we can remove them later.
    //const isEmptySlot = (!node.customer && node.legs && (node.nodeId === undefined || node.nodeId === null));
    const isEmptySlot = (!node.customer && Array.isArray(node.legs) && (node.nodeId === undefined || node.nodeId === null));
    if (isEmptySlot) {
      nodeDiv.setAttribute('data-empty-slot', '1');
      nodeDiv.classList.add('empty-leg-slot'); // optional, handy for styling/debug
    }
    nodeDiv.style.left = 0;
    nodeDiv.style.top = 0;
    nodeDiv.innerHTML = template;
    li.appendChild(nodeDiv);

    const onNodeClick = (e) => {
      if (!dragged) {
        if (activeNode) {
          activeNode.classList.remove("active");
          activeNode = undefined;
        }
        const target = e.currentTarget;
        target.classList.add("active");
        activeNode = target;
        const dataNodeId = target.getAttribute('data-nodeId');
        selectNode({
          id: dataNodeId === 'undefined' ? undefined : dataNodeId,
          uplineLeg: target.getAttribute('data-uplineLeg'),
          uplineId: target.getAttribute('data-uplineId')
        });
      }
    };
    nodeDiv.addEventListener("click", onNodeClick);
    handlers.push(() => nodeDiv.removeEventListener("click", onNodeClick));

    let ul1 = null;
    if (node.childArr) {
      const expandDiv = document.createElement('div');
      expandDiv.classList.add("node-expand", "collaped");
      expandDiv.innerHTML = `
        <div class="expandDown">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-down" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M6 9l6 6l6 -6"></path>
          </svg>
        </div>
        <div class="expandUp">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-up" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M6 15l6 -6l6 6"></path>
          </svg>
        </div>
      `;
      nodeDiv.appendChild(expandDiv);
      const onExpandClick = (e) => {
        if (!dragged) {
          handleExpand(e.currentTarget);
          e.stopPropagation();
        }
      };
      expandDiv.addEventListener("click", onExpandClick);
      handlers.push(() => expandDiv.removeEventListener("click", onExpandClick));

      ul1 = document.createElement('ul');
      ul1.setAttribute('data-nodeId', node.nodeId);
      li.appendChild(ul1);
      ul1.style.display = "none";

      if (node.childArr.length !== 0) {
        for (const child of node.childArr) addChild(ul1, child);
      }
      result = expandDiv;
    }

    // Index
    if (node.nodeId) nodeIndex.set(node.nodeId, { li, nodeDiv, parentUl: ul });
    if (ul1) ulIndex.set(node.nodeId, ul1);

    ul.appendChild(li);
    syncFlipCardHeight(nodeDiv);
    scheduleFlipHeightSync();
    return result;
  }

  function addRootNode() {
    const parent = document.createElement('ul');
    canvas.appendChild(parent);

    const loading = BuildLoading(parent);

    const data = {
      query: `query ($nodeIds: [String]!, $treeIds: [String]!, $cardIds: [String]!, $periodDate: Date) {
        trees(idList: $treeIds) {
          id
          name
          legNames
          nodes(nodeIds: $nodeIds, date: $periodDate) {
            nodeId
            totalChildNodes
            customer{
              id fullName enrollDate profileImage webAlias
              status { id, name, statusClass }
              phoneNumbers { type number }
              emailAddress
              customerType { id name }
              cards(idList: $cardIds, date: $periodDate){ name values { value valueName valueId } }
              widgets {
                id name title description type showDatePicker
                headerColor headerTextColor headerAlignment
                backgroundColor textColor borderColor css settings
                panes { imageUrl title text description values { text value } }
              }
            }
          }
        }
      }`,
      variables: { nodeIds: [rootId], treeIds: [treeId], cardIds: [`Tree-${treeId}`], periodDate: currentPeriodDate }
    };

    Post(dataUrl, data, (nodeData) => {
      parent.removeChild(loading);
      const baseNode = nodeData?.data?.trees?.[0];
      if (!baseNode) return;

      const legNames = baseNode.legNames;
      const hasLegs = Array.isArray(legNames) && legNames.length > 0;
      treeLegs = hasLegs ? legNames.map(x => String(x).toLowerCase()) : null;
      treeLegsOriginal = hasLegs ? legNames.slice() : null;

      // Build root node(s) and auto-expand first generation
      for (const node of baseNode.nodes) {
        const expander = addChild(parent, {
          customer: node.customer,
          nodeId: node.nodeId,
          legs: legNames,
          card: node.customer?.cards?.[0],
          childArr: (node.totalChildNodes > 0 || hasLegs) ? [] : null
        });
        if (expander) handleExpand(expander); // triggers addNodes for root
      }

      // Center the tree on load
      ctx.translate((canvasBox.clientWidth / 2) - 150, 0);
      redraw();

      // NOTE: Do NOT fire onReady here — first-gen hasn't finished loading yet.
    }, (error) => {
      try { parent.removeChild(loading); } catch (e) {
        //empty
      }
      alert(error);
    });
  }

  function addNodes(parent, expanding, opts = {}) {
    const { reset = false } = opts;

    let startPos = 0;
    if (expanding) startPos = expanding.offsetLeft;

    const loading = BuildLoading(parent);
    const nodeId = parent.getAttribute('data-nodeId') ?? rootId;
    const beforeRealCount = countRealChildren(parent);

    // Init / read paging
    const pg = getPaging(nodeId);
    if (reset) {
      pg.offset = 0;
      pg.done = false;
    }
    if (pg.done) {
      try { parent.removeChild(loading); } catch (_) {  /* empty */ }
      // Nothing more to load
      removeLoadMoreRow(parent);
      return;
    }

    // IMPORTANT: with paging, we never nuke existing children; we only append more.
    // For leg trees, paging isn’t meaningful (legs are a fixed small set), we still fetch once.

    const data = {
      query: `query ($nodeIds: [String]!, $treeIds: [String]!, $cardIds: [String]!, $periodDate: Date, $offset: Int, $count: Int) {
      trees(idList: $treeIds) {
        id
        name
        legNames
        nodes(nodeIds: $nodeIds, date: $periodDate) {
          nodeId
          nodes (levels: 1, offset: $offset, first: $count) {
            nodeId
            uplineLeg
            totalChildNodes
            customer {
              id
              webAlias
              fullName
              enrollDate
              profileImage
              status { id, name, statusClass }
              phoneNumbers { type number }
              emailAddress
              customerType { id name }
              cards(idList: $cardIds, date: $periodDate) {
                name
                values { value valueName valueId }
              }
              widgets {
                id
                name
                title
                description
                type
                showDatePicker
                headerColor
                headerTextColor
                headerAlignment
                backgroundColor
                textColor
                borderColor
                css
                settings
                panes {
                  imageUrl
                  title
                  text
                  description
                  values { text value }
                }
              }
            }
          }
        }
      }
    }
    `,
      variables: {
        treeIds: [treeId],
        nodeIds: [nodeId],
        cardIds: [`Tree-${treeId}`],
        periodDate: currentPeriodDate,
        offset: pg.offset,
        count: pg.count
      }
    };

    Post(dataUrl, data, (nodeData) => {
      try { parent.removeChild(loading); } catch (_) {  /* empty */ }

      const tree = nodeData?.data?.trees?.[0];
      if (!tree) return;

      const baseNode = tree?.nodes?.[0];
      const fetched = baseNode?.nodes ?? [];

      const legNamesSrc = tree.legNames; // may be null/undefined/[]
      const hasLegs = Array.isArray(legNamesSrc) && legNamesSrc.length > 0;

      // Remove any previous "Load more" before inserting new rows
      removeLoadMoreRow(parent);

      if (hasLegs) {
        // Legged trees: render by specific leg (paging not really applicable—usually small & fixed)
        const legsLower = legNamesSrc.map(x => String(x).toLowerCase());
        const byLeg = new Map();
        for (const n of fetched) {
          const key = n?.uplineLeg ? String(n.uplineLeg).toLowerCase() : null;
          if (key) byLeg.set(key, n);
        }

        for (let i = 0; i < legNamesSrc.length; i++) {
          const legOriginal = String(legNamesSrc[i]);
          const legLower = legOriginal.toLowerCase();

          if (byLeg.has(legLower)) {
            const n = byLeg.get(legLower);
            addChild(parent, {
              customer: n.customer,
              uplineId: nodeId,
              uplineLeg: n.uplineLeg,
              nodeId: n.nodeId,
              legs: legNamesSrc,
              card: n.customer?.cards?.[0],
              childArr: []
            });
          } else {
            // empty slot placeholder for this leg
            addChild(parent, {
              customer: undefined,
              uplineId: nodeId,
              uplineLeg: legOriginal,
              nodeId: undefined,
              legs: legNamesSrc,
              card: undefined,
              childArr: null
            });
          }
        }

        // Render any unexpected extra children (with unknown leg labels)
        const known = new Set(legsLower);
        for (const n of fetched) {
          const legLower = String(n?.uplineLeg || '').toLowerCase();
          if (!known.has(legLower)) {
            addChild(parent, {
              customer: n.customer,
              uplineId: nodeId,
              uplineLeg: n.uplineLeg,
              nodeId: n.nodeId,
              legs: legNamesSrc,
              card: n.customer?.cards?.[0],
              childArr: []
            });
          }
        }

        // Mark as "done" for leg trees (no true paging)
        pg.done = true;
      } else {
        // Flat child list (typical big-fanout case) → paging applies
        for (const n of fetched) {
          // Skip duplicates if reloading
          if (n?.nodeId && nodeIndex.has(String(n.nodeId))) continue;

          addChild(parent, {
            customer: n.customer,
            uplineId: nodeId,
            uplineLeg: n.uplineLeg,
            nodeId: n.nodeId,
            card: n.customer?.cards?.[0],
            childArr: n.totalChildNodes > 0 ? [] : null
          });
        }

        // Advance paging window
        pg.offset += fetched.length;

        // If fewer than requested were returned, we're done; otherwise offer "Load more"
        if (fetched.length < pg.count) {
          pg.done = true;
        } else {
          insertLoadMoreRow(parent, () => {
            // remove the load-more row while loading next page, to prevent double clicks
            removeLoadMoreRow(parent);
            // after a tick, replace spinner by next page (spinner is removed by addNodes on success/fail)
            setTimeout(() => addNodes(parent, null, { reset: false }), 0);
          });
        }

        // If this page produced no new real children and we're done, hide chevron.
        const afterRealCount = countRealChildren(parent);
        if (pg.done && afterRealCount === beforeRealCount) {
          maybeHideExpandIfNoChildren(nodeId);
        }
      }

      // Root first-generation ready callback handling (unchanged)
      if (!rootLoaded && String(nodeId) === String(rootId)) {
        const present = new Set(
          fetched
            .filter(n => n?.customer?.id)
            .map(n => String(n.uplineLeg).toLowerCase())
        );
        legsWithRealNodeAtRoot = Array.from(present);

        rootLoaded = true;
        const payload = {
          legsWithRealNodeAtRoot: [...legsWithRealNodeAtRoot],
          treeLegs: treeLegs ? [...treeLegs] : null,
          rootId: String(rootId)
        };
        readyCallbacks.splice(0).forEach(cb => {
          try { cb(payload); } catch (e) { /* empty */ }
        });
      }

      if (expanding) {
        const endPos = expanding.offsetLeft;
        ctx.translate(startPos - endPos, 0);
        redraw();
      }
    }, (error) => {
      try { parent.removeChild(loading); } catch (_) {  /* empty */ }
      // On error, let user try again by keeping (or restoring) the Load More row if paging
      if (!getPaging(nodeId).done) {
        insertLoadMoreRow(parent, () => addNodes(parent, null, { reset: false }));
      }
      alert(error);
    });
  }

  // Ensure an entire path exists; optionally expand along it
  async function ensurePathRendered(pathIds, { expandPath = false } = {}) {
    for (let i = 0; i < pathIds.length; i++) {
      const id = pathIds[i];

      if (!nodeIndex.get(id)) {
        const basics = await fetchNodeBasics({ dataUrl, treeId, nodeId: id, currentPeriodDate });
        const parentId = i === 0 ? rootId : pathIds[i - 1];
        const parentUl = ensureChildUl(parentId) || canvas.querySelector('ul');

        const node = {
          customer: basics?.customer,
          nodeId: id,
          uplineId: parentId,
          uplineLeg: basics?.uplineLeg,
          legs: treeLegs,
          card: basics?.customer?.cards?.[0],
          childArr: []
        };
        const tmpUl = document.createElement('ul');
        addChild(tmpUl, node);
        const li = tmpUl.firstChild;
        if (li) insertIntoUlRespectingLegs(parentUl, li, node.uplineLeg);
        const rec = nodeIndex.get(id);
        if (rec) rec.parentUl = parentUl;
      }

      if (i < pathIds.length - 1) {
        const ul = ensureChildUl(pathIds[i]);
        if (ul) {
          if (expandPath) {
            ul.style.display = "block";
            const exp = nodeIndex.get(pathIds[i])?.li?.querySelector('.node-expand');
            if (exp && exp.classList.contains('collaped')) {
              exp.classList.remove('collaped'); exp.classList.add('expanded');
            }
          } else {
            ul.style.display = "none";
            const exp = nodeIndex.get(pathIds[i])?.li?.querySelector('.node-expand');
            if (exp && exp.classList.contains('expanded')) {
              exp.classList.remove('expanded'); exp.classList.add('collaped');
            }
          }
        }
      }
    }

    const bottomId = pathIds[pathIds.length - 1];
    const bottomRec = nodeIndex.get(bottomId);
    const parentId = pathIds.length > 1 ? pathIds[pathIds.length - 2] : bottomId;
    const parentUl = ulIndex.get(parentId);
    const parentVisible = parentUl && parentUl.style.display !== 'none';
    const deepestVisibleNodeDiv = parentVisible ? bottomRec?.nodeDiv : nodeIndex.get(parentId)?.nodeDiv;

    return { bottomNodeDiv: bottomRec?.nodeDiv || null, deepestVisibleNodeDiv: deepestVisibleNodeDiv || null };
  }

  // --- Surrogate collapsed-chain + progressive expand up ---

  function createCollapsedChainSurrogate({ parentId, leg, pathIds, bottomNodeData }) {
    const parentUl = ensureChildUl(parentId);
    if (!parentUl) return null;

    // Remove any existing surrogate under this parent for this leg
    [...parentUl.children].forEach(childLi => {
      const h = childLi.querySelector('.collapsed-chain-host');
      if (!h) return;
      if (h.getAttribute('data-parent-id') === String(parentId) &&
        (h.getAttribute('data-leg') || '').toLowerCase() === String(leg || '').toLowerCase()) {
        parentUl.removeChild(childLi);
      }
    });

    const hiddenCount = Math.max(0, pathIds.length - 2);
    const li = document.createElement('li');
    li.classList.add('collapsed-chain');

    const host = document.createElement('div');
    host.classList.add('node-host', 'collapsed-chain-host', 'card');
    host.setAttribute('data-surrogate', '1');
    host.setAttribute('data-parent-id', parentId);
    host.setAttribute('data-path', JSON.stringify(pathIds));
    host.setAttribute('data-leg', leg ?? '');
    li.appendChild(host);

    const header = document.createElement('div');
    header.classList.add('collapsed-chain-header', 'm-auto', 'p-2');
    header.innerHTML = `
      <span class="collapsed-chain-label">[ … ${hiddenCount} hidden level${hiddenCount === 1 ? '' : 's'} … ]</span>
      <button class="btn btn-link btn-sm collapsed-chain-expand-up d-none" title="Expand up to show the path">Expand Up</button>
    `;
    host.appendChild(header);

    const innerUl = document.createElement('ul');
    innerUl.style.display = 'block';
    li.appendChild(innerUl);

    const tmpUl = document.createElement('ul');
    addChild(tmpUl, {
      customer: bottomNodeData.customer,
      nodeId: bottomNodeData.nodeId,
      uplineId: parentId,
      uplineLeg: leg,
      legs: treeLegsOriginal,                 // <-- use original-cased labels here
      card: bottomNodeData.customer?.cards?.[0],
      childArr: treeLegsOriginal ? [] : null  // keep chevron for legged trees
    });

    const bottomLi = tmpUl.firstChild;
    if (bottomLi) {
      innerUl.appendChild(bottomLi);
      console.log('[treeView] bottom node inserted:', bottomNodeData.nodeId, {
        hasCustomer: !!bottomNodeData.customer,
        widgets: bottomNodeData.customer?.widgets?.length ?? 0
      });
      const rec = nodeIndex.get(bottomNodeData.nodeId);
      if (rec) rec.parentUl = innerUl;
    }

    insertIntoUlRespectingLegs(parentUl, li, leg);

    const btn = header.querySelector('.collapsed-chain-expand-up');
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (btn.dataset.busy === '1') return;
      btn.dataset.busy = '1';
      await expandEntireChain({ surrogateLi: li });
    });

    return li;
  }

  async function expandEntireChain({ surrogateLi }) {
    if (!surrogateLi) return;
    if (surrogateLi) return; //For now, this is disabled.

    const host = surrogateLi.querySelector('.collapsed-chain-host');
    if (!host) return;

    // Path stored as [ parentId, ..., bottomId ]
    const pathIds = JSON.parse(host.getAttribute('data-path') || '[]');
    if (!Array.isArray(pathIds) || pathIds.length < 2) return;

    // Ensure the parent UL is open so inserts are visible
    const parentId0 = String(pathIds[0]);
    const parentUl0 = ensureChildUl(parentId0);
    if (parentUl0 && parentUl0.style.display === 'none') {
      parentUl0.style.display = 'block';
      const exp0 = nodeIndex.get(parentId0)?.li?.querySelector('.node-expand');
      if (exp0 && exp0.classList.contains('collaped')) {
        exp0.classList.remove('collaped');
        exp0.classList.add('expanded');
      }
    }

    // Walk from parent -> bottom; ensure/move each node into place and keep its UL open
    for (let i = 1; i < pathIds.length; i++) {
      const parentId = String(pathIds[i - 1]);
      const thisId = String(pathIds[i]);

      // Destination UL under this parent
      let destUl = ensureChildUl(parentId);
      if (!destUl) {
        // The parent node should exist; if not, synthesize it
        if (!nodeIndex.get(parentId)) {
          const parentBasics = await fetchNodeBasics({ dataUrl, treeId, nodeId: parentId, currentPeriodDate });
          const tmp = document.createElement('ul');
          addChild(tmp, {
            customer: parentBasics?.customer ?? { id: parentId, fullName: '(Unavailable)' },
            nodeId: parentBasics?.nodeId ?? parentId,
            uplineId: (i - 2 >= 0) ? String(pathIds[i - 2]) : parentId, // best effort
            uplineLeg: parentBasics?.uplineLeg,
            legs: treeLegsOriginal,
            card: parentBasics?.customer?.cards?.[0],
            childArr: treeLegsOriginal ? [] : (parentBasics?.totalChildNodes > 0 ? [] : null)
          });
          const li = tmp.firstChild;
          const higherUl = ensureChildUl(String(pathIds[i - 2])) || canvas.querySelector('ul');
          if (li && higherUl) {
            insertIntoUlRespectingLegs(higherUl, li, parentBasics?.uplineLeg);
            const rec = nodeIndex.get(parentBasics?.nodeId);
            if (rec) rec.parentUl = higherUl;
          }
        }
        destUl = ensureChildUl(parentId);
      }

      // Make destination UL open/expanded
      if (destUl && destUl.style.display === 'none') {
        destUl.style.display = 'block';
        const exp = nodeIndex.get(parentId)?.li?.querySelector('.node-expand');
        if (exp) { exp.classList.remove('collaped'); exp.classList.add('expanded'); }
      }

      const existing = nodeIndex.get(thisId);
      if (existing) {
        // Move existing LI (e.g., bottom node that was under the surrogate) into the correct UL
        insertIntoUlRespectingLegs(destUl, existing.li, existing.nodeDiv.getAttribute('data-uplineLeg'));
        existing.parentUl = destUl;
      } else {
        // Create node if absent
        const basics = await fetchNodeBasics({ dataUrl, treeId, nodeId: thisId, currentPeriodDate });
        const tmp = document.createElement('ul');
        addChild(tmp, {
          customer: basics?.customer,
          nodeId: basics?.nodeId,
          uplineId: parentId,
          uplineLeg: basics?.uplineLeg,
          legs: treeLegsOriginal,
          card: basics?.customer?.cards?.[0],
          childArr: treeLegsOriginal ? [] : (basics?.totalChildNodes > 0 ? [] : null)
        });
        const li = tmp.firstChild;
        if (li) {
          insertIntoUlRespectingLegs(destUl, li, basics?.uplineLeg);
          const rec = nodeIndex.get(basics?.nodeId);
          if (rec) rec.parentUl = destUl;
        }
      }
    }

    // Focus the bottom node
    const bottomId = String(pathIds[pathIds.length - 1]);
    const bottomRec = nodeIndex.get(bottomId);
    if (bottomRec?.nodeDiv) {
      if (activeNode) activeNode.classList.remove('active');
      bottomRec.nodeDiv.classList.add('active');
      activeNode = bottomRec.nodeDiv;
      centerOnNode(bottomRec.nodeDiv);
    }

    // Remove the surrogate wrapper entirely
    surrogateLi.parentElement?.removeChild(surrogateLi);
  }

  function buildLegInlineLoading(parentUl, leg) {
    if (!parentUl) return null;
    const li = document.createElement('li');
    const nodeDiv = document.createElement('div');
    nodeDiv.classList.add('node-host');
    nodeDiv.setAttribute('data-loading-slot', '1');
    nodeDiv.innerHTML = renderToStaticMarkup(getLoading());
    li.appendChild(nodeDiv);
    insertIntoUlRespectingLegs(parentUl, li, leg);
    return li;
  }

  function findNodeDivById(id) {
    if (!id) return null;
    const key = String(id);
    const rec = nodeIndex.get(key);
    if (rec?.nodeDiv?.isConnected) return rec.nodeDiv;
    const esc = (window.CSS && CSS.escape) ? CSS.escape(key) : key.replace(/([#.&:,[\]()>+~*^$|=! ])/g, '\\$1');
    return canvas.querySelector(`.node-host[data-nodeid="${esc}"]`);
  }

  function openExistingUlsAlongPath(pathIds) {
    // Only open ULs that already exist; do NOT create/move anything.
    for (let i = 0; i < pathIds.length - 1; i++) {
      const id = String(pathIds[i]);
      const ul = ulIndex.get(id);
      if (ul && ul.style.display === 'none') {
        ul.style.display = 'block';
      }
      const exp = nodeIndex.get(id)?.li?.querySelector('.node-expand');
      if (exp) {
        exp.classList.remove('collaped');
        exp.classList.add('expanded');
        exp.setAttribute?.('aria-expanded', 'true');
      }
    }
  }

  function removeEmptySlotFromUl(ul, leg) {
    if (!ul || !leg) return;
    const legLower = String(leg).toLowerCase();
    for (const childLi of ul.children) {
      const host = childLi.querySelector('.node-host');
      if (!host) continue;
      if (host.hasAttribute('data-loading-slot')) continue;
      const cleg = (host.getAttribute('data-uplineLeg') || '').toLowerCase();
      const isEmpty =
        host.hasAttribute('data-empty-slot') ||
        !host.getAttribute('data-nodeId') ||
        host.getAttribute('data-nodeId') === 'undefined' ||
        host.getAttribute('data-nodeId') === 'null';
      if (isEmpty && cleg === legLower) {
        ul.removeChild(childLi);
        break;
      }
    }
  }

  function ensureExpandControl(parentId) {
    const pid = String(parentId);
    const rec = nodeIndex.get(pid);
    if (!rec?.li || !rec.nodeDiv) return;

    // Ensure child UL exists (keep it hidden)
    let ul = ulIndex.get(pid);
    if (!ul) {
      ul = document.createElement('ul');
      ul.setAttribute('data-nodeId', pid);
      ul.style.display = 'none';
      rec.li.appendChild(ul);
      ulIndex.set(pid, ul);
    }

    // Ensure expand chevron exists
    let exp = rec.li.querySelector('.node-expand');
    if (!exp) {
      exp = document.createElement('div');
      exp.classList.add('node-expand', 'collaped');
      exp.innerHTML = `
      <div class="expandDown">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-down" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 9l6 6l6 -6"></path></svg>
      </div>
      <div class="expandUp">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-up" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M6 15l6 -6l6 6"></path></svg>
      </div>
    `;
      rec.nodeDiv.appendChild(exp);
      const onExpandClick = (e) => {
        if (!dragged) {
          handleExpand(e.currentTarget);
          e.stopPropagation();
        }
      };
      exp.addEventListener('click', onExpandClick);
      handlers.push(() => exp.removeEventListener('click', onExpandClick));
    }
  }

  function maybeHideExpandIfNoChildren(parentId) {
    if (treeLegsOriginal) return; // leg-name trees keep expand placeholders
    const pid = String(parentId);
    const ul = ulIndex.get(pid);
    const rec = nodeIndex.get(pid);
    if (!ul || !rec?.li) return;
    const realCount = countRealChildren(ul);
    if (realCount === 0) {
      const exp = rec.li.querySelector('.node-expand');
      if (exp) exp.remove();
    }
  }

  // --- API ---

  const api = {
    setPeriodDate(iso) {
      if (!iso) return;
      currentPeriodDate = iso;
    },
    moveNode(args) {
      const nodeId = String(args?.nodeId || '');
      const toParentId = String(args?.toParentId ?? args?.uplineId ?? args?.uplineIdOverride ?? '');
      const toUplineLeg = args?.toUplineLeg ?? args?.uplineLeg ?? '';
      const fromParentId = args?.fromParentId ?? args?.fromNodeId;
      const fromUplineLeg = args?.fromUplineLeg ?? args?.fromLeg;
      const nodeData = args?.nodeData;

      if (!nodeId || !toParentId) {
        console.warn('[treeView] moveNode: missing nodeId/toParentId', args);
        return;
      }

      const toLegLower = String(toUplineLeg || '').toLowerCase();
      const isHoldingTank = (toLegLower === 'holding tank');

      // Destination render/visibility info (do NOT create/expand here)
      const parentRec = nodeIndex.get(toParentId);
      const destIsRendered = !!parentRec;
      const destUl = destIsRendered ? ensureChildUl(toParentId) : null;
      const destIsVisible = destUl ? isUlVisible(destUl) : false;

      let rec = nodeIndex.get(nodeId);

      // --- HOLDING TANK: never render in tree ---
      if (isHoldingTank) {
        if (rec) {
          const { li, nodeDiv, parentUl } = rec;
          const oldParentId = fromParentId ? String(fromParentId) : nodeDiv.getAttribute('data-uplineId');
          const oldLegLower = String(fromUplineLeg || '').toLowerCase();

          // Remove from old parent UI
          if (parentUl && li && parentUl.contains(li)) parentUl.removeChild(li);

          // Housekeeping on the old parent
          if (treeLegsOriginal && oldParentId && oldLegLower) {
            // restore empty slot for the leg if it became empty
            const oldUl = ensureChildUl(oldParentId);
            if (oldUl) {
              let hasAny = false;
              for (const childLi of oldUl.children) {
                const host = childLi.querySelector('.node-host');
                if (!host) continue;
                const cid = host.getAttribute('data-nodeId');
                const cleg = (host.getAttribute('data-uplineLeg') || '').toLowerCase();
                if (cid && cleg === oldLegLower) { hasAny = true; break; }
              }
              if (!hasAny) {
                const tmp = document.createElement('ul');
                addChild(tmp, {
                  customer: undefined,
                  uplineId: oldParentId,
                  uplineLeg: fromUplineLeg,
                  nodeId: undefined,
                  legs: treeLegsOriginal,
                  card: undefined,
                  childArr: null
                });
                const slotLi = tmp.firstChild;
                if (slotLi) insertIntoUlRespectingLegs(oldUl, slotLi, fromUplineLeg);
              }
            }
          } else if (oldParentId) {
            // no-leg trees: hide chevron if parent became empty
            maybeHideExpandIfNoChildren(oldParentId);
          }

          // Clear selection if it was active, drop from index, and stop.
          if (activeNode === nodeDiv) { activeNode.classList.remove('active'); activeNode = null; }
          nodeIndex.delete(nodeId);
        }
        // If it wasn't rendered, nothing to do in the DOM.
        return;
      }


      // --- REPOSITION MODE: node already in DOM ---
      if (rec) {
        const { li, nodeDiv, parentUl } = rec;

        // Compute old-parent housekeeping inputs BEFORE changing attributes
        const oldParentId = fromParentId ? String(fromParentId) : nodeDiv.getAttribute('data-uplineId');
        const oldLegLower = String(fromUplineLeg || '').toLowerCase();

        // Remove from current parent UL
        if (parentUl && li && parentUl.contains(li)) parentUl.removeChild(li);

        // CASE 1: destination parent is NOT rendered at all → don't insert, just clean up and stop
        if (!destIsRendered) {
          if (treeLegsOriginal && oldParentId && oldParentId !== toParentId && oldLegLower) {
            // leg trees: restore empty slot in the old parent if the leg went empty
            const oldUl = ensureChildUl(oldParentId);
            if (oldUl) {
              let hasAny = false;
              for (const childLi of oldUl.children) {
                const host = childLi.querySelector('.node-host');
                if (!host) continue;
                const cid = host.getAttribute('data-nodeId');
                const cleg = (host.getAttribute('data-uplineLeg') || '').toLowerCase();
                if (cid && cleg === oldLegLower) { hasAny = true; break; }
              }
              if (!hasAny) {
                const tmp = document.createElement('ul');
                addChild(tmp, {
                  customer: undefined,
                  uplineId: oldParentId,
                  uplineLeg: fromUplineLeg,
                  nodeId: undefined,
                  legs: treeLegsOriginal,
                  card: undefined,
                  childArr: null
                });
                const slotLi = tmp.firstChild;
                if (slotLi) insertIntoUlRespectingLegs(oldUl, slotLi, fromUplineLeg);
              }
            }
          } else if (oldParentId) {
            // no-leg trees: maybe hide chevron if the old parent is now empty
            maybeHideExpandIfNoChildren(oldParentId);
          }

          // Clear selection if we just removed the active node
          if (activeNode === nodeDiv) {
            activeNode.classList.remove('active');
            activeNode = null;
          }

          // Drop from index so future expand re-creates it from server
          nodeIndex.delete(nodeId);
          return;
        }

        // CASE 2: destination rendered but COLLAPSED → don't insert, just prep controls for later
        if (!destIsVisible) {
          ensureExpandControl(toParentId); // add chevron + hidden UL, but don't open

          if (treeLegsOriginal && oldParentId && oldParentId !== toParentId && oldLegLower) {
            const oldUl = ensureChildUl(oldParentId);
            if (oldUl) {
              let hasAny = false;
              for (const childLi of oldUl.children) {
                const host = childLi.querySelector('.node-host');
                if (!host) continue;
                const cid = host.getAttribute('data-nodeId');
                const cleg = (host.getAttribute('data-uplineLeg') || '').toLowerCase();
                if (cid && cleg === oldLegLower) { hasAny = true; break; }
              }
              if (!hasAny) {
                const tmp = document.createElement('ul');
                addChild(tmp, {
                  customer: undefined,
                  uplineId: oldParentId,
                  uplineLeg: fromUplineLeg,
                  nodeId: undefined,
                  legs: treeLegsOriginal,
                  card: undefined,
                  childArr: null
                });
                const slotLi = tmp.firstChild;
                if (slotLi) insertIntoUlRespectingLegs(oldUl, slotLi, fromUplineLeg);
              }
            }
          } else if (oldParentId) {
            maybeHideExpandIfNoChildren(oldParentId);
          }

          if (activeNode === nodeDiv) {
            activeNode.classList.remove('active');
            activeNode = null;
          }
          nodeIndex.delete(nodeId);
          return;
        }

        // CASE 3: destination is visible → proceed with insert
        if (nodeData) {
          const html = renderToStaticMarkup(getTemplate(nodeData)) || '';
          rec.nodeDiv.innerHTML = html;
          syncFlipCardHeight(rec.nodeDiv);
          scheduleFlipHeightSync();
        }
        nodeDiv.setAttribute('data-uplineId', toParentId);
        nodeDiv.setAttribute('data-uplineLeg', toUplineLeg ?? '');

        if (treeLegsOriginal) removeEmptySlotFromUl(destUl, toUplineLeg);

        insertIntoUlRespectingLegs(destUl, li, toUplineLeg);
        nodeIndex.set(nodeId, { li, nodeDiv, parentUl: destUl });

        // Old-parent cleanup after successful reinsert
        if (treeLegsOriginal && oldParentId && oldParentId !== toParentId && oldLegLower) {
          const oldUl = ensureChildUl(oldParentId);
          if (oldUl) {
            let hasAny = false;
            for (const childLi of oldUl.children) {
              const host = childLi.querySelector('.node-host');
              if (!host) continue;
              const cid = host.getAttribute('data-nodeId');
              const cleg = (host.getAttribute('data-uplineLeg') || '').toLowerCase();
              if (cid && cleg === oldLegLower) { hasAny = true; break; }
            }
            if (!hasAny) {
              const tmp = document.createElement('ul');
              addChild(tmp, {
                customer: undefined,
                uplineId: oldParentId,
                uplineLeg: fromUplineLeg,
                nodeId: undefined,
                legs: treeLegsOriginal,
                card: undefined,
                childArr: null
              });
              const slotLi = tmp.firstChild;
              if (slotLi) insertIntoUlRespectingLegs(oldUl, slotLi, fromUplineLeg);
            }
          }
        } else if (oldParentId && oldParentId !== toParentId) {
          maybeHideExpandIfNoChildren(oldParentId);
        }

        /* // Focus & center moved node
        if (nodeDiv?.isConnected) {
          if (activeNode) activeNode.classList.remove('active');
          nodeDiv.classList.add('active');
          activeNode = nodeDiv;
          requestAnimationFrame(() => requestAnimationFrame(() => centerOnNode(nodeDiv)));
        } */
        return;
      }

      // --- INSERT MODE: node not yet in DOM ---
      // If destination parent itself isn’t rendered yet, nothing to show now.
      if (!destIsRendered) {
        return;
      }

      // If rendered but collapsed, prep expand control and stop (no visual insert)
      if (!destIsVisible) {
        ensureExpandControl(toParentId);
        return;
      }

      // Visible destination → insert with inline spinner
      if (treeLegsOriginal) removeEmptySlotFromUl(destUl, toUplineLeg);
      const inlineSpinner = buildLegInlineLoading(destUl, toUplineLeg);
      //const spinnerNode = inlineSpinner?.querySelector?.('.node-host') || inlineSpinner;
      /* if (spinnerNode) {
        requestAnimationFrame(() => requestAnimationFrame(() => centerOnNode(spinnerNode, { vBias: 0.45 })));
      } */

      const ensureDataAndInsert = async () => {
        let basics = nodeData;
        if (!basics) {
          try { basics = await fetchNodeBasics({ dataUrl, treeId, nodeId, periodDate: undefined }); }
          catch (e) { console.warn('[treeView] moveNode: fetchNodeBasics failed for', nodeId, e); }
        }

        const tempUl = document.createElement('ul');
        addChild(tempUl, {
          customer: basics?.customer,
          nodeId,
          uplineId: toParentId,
          uplineLeg: toUplineLeg,
          legs: treeLegsOriginal,
          card: basics?.customer?.cards?.[0],
          childArr: treeLegsOriginal ? [] : (basics?.totalChildNodes > 0 ? [] : null)
        });
        const newLi = tempUl.firstChild;
        if (!newLi) return;

        insertIntoUlRespectingLegs(destUl, newLi, toUplineLeg);

        rec = nodeIndex.get(nodeId);
        if (rec) {
          rec.parentUl = destUl;
          rec.nodeDiv.setAttribute('data-uplineId', toParentId);
          rec.nodeDiv.setAttribute('data-uplineLeg', toUplineLeg ?? '');
        }

        if (inlineSpinner && inlineSpinner.parentElement) {
          inlineSpinner.parentElement.removeChild(inlineSpinner);
        }

        /* const nodeDiv = rec?.nodeDiv;
        if (nodeDiv?.isConnected) {
          if (activeNode) activeNode.classList.remove('active');
          nodeDiv.classList.add('active');
          activeNode = nodeDiv;
          requestAnimationFrame(() => requestAnimationFrame(() => centerOnNode(nodeDiv)));
        } */
      };

      ensureDataAndInsert();
    },

    updateNodeContent(nodeId, nodeData) {
      const rec = nodeIndex.get(nodeId);
      if (!rec || !nodeData) return;
      const html = renderToStaticMarkup(getTemplate(nodeData));
      rec.nodeDiv.innerHTML = html;
      syncFlipCardHeight(rec.nodeDiv);
      scheduleFlipHeightSync();
    },

    removeNode(nodeId) {
      const rec = nodeIndex.get(nodeId);
      if (!rec) return;
      const { li, parentUl, nodeDiv } = rec;
      const oldParentId = nodeDiv?.getAttribute?.('data-uplineId');

      if (parentUl && li && parentUl.contains(li)) parentUl.removeChild(li);
      nodeIndex.delete(nodeId);

      // NEW: non-leg trees — if old parent now empty, remove its chevron
      if (oldParentId) {
        maybeHideExpandIfNoChildren(oldParentId);
      }

      // (optional) clear selection if this was the active node
      if (activeNode && nodeDiv && activeNode === nodeDiv) {
        activeNode.classList.remove('active');
        activeNode = null;
      }
    },

    insertNode({ parentId, uplineLeg, nodeData }) {
      if (!parentId || !nodeData) return;
      const ul = ensureChildUl(parentId);
      if (!ul) return;
      const tempUl = document.createElement('ul');
      addChild(tempUl, {
        ...nodeData,
        uplineId: parentId,
        uplineLeg,
        childArr: nodeData.childArr ?? []
      });
      const newLi = tempUl.firstChild;
      if (!newLi) return;
      insertIntoUlRespectingLegs(ul, newLi, uplineLeg);
      const rec = nodeIndex.get(nodeData.nodeId);
      if (rec) rec.parentUl = ul;
    },

    async goToBottom({ fromNodeId, leg, mode = 'surrogate' }) {
      if (!fromNodeId || !leg) return;

      // If from is root and the leg doesn't exist at first gen, do nothing
      if (String(fromNodeId) === String(rootId) && treeLegs && !legsWithRealNodeAtRoot.includes(String(leg).toLowerCase())) {
        return;
      }

      const result = await fetchBottomForLeg({ dataUrl, treeId, fromNodeId, leg, currentPeriodDate });
      if (!result) return;

      const path = (result.path && result.path.length) ? result.path : [fromNodeId, result.bottomNodeId].filter(Boolean);
      const bottomId = path[path.length - 1];

      // If the bottom node already exists in the DOM, just expand its path & focus it.
      const existingDiv = findNodeDivById(bottomId);
      if (existingDiv) {
        const underSurrogate = !!existingDiv.closest('li.collapsed-chain');

        if (underSurrogate) {
          // Node is already rendered under a surrogate → just focus/center it.
          if (activeNode) activeNode.classList.remove('active');
          existingDiv.classList.add('active');
          activeNode = existingDiv;
          requestAnimationFrame(() => requestAnimationFrame(() => centerOnNode(existingDiv)));
          return;
        }

        // Node exists in the real path (not under surrogate). Open ONLY existing ULs, then focus.
        openExistingUlsAlongPath(path);

        if (activeNode) activeNode.classList.remove('active');
        existingDiv.classList.add('active');
        activeNode = existingDiv;
        requestAnimationFrame(() => requestAnimationFrame(() => centerOnNode(existingDiv)));
        return;
      }

      if (!nodeIndex.get(fromNodeId)) {
        await ensurePathRendered([fromNodeId], { expandPath: false });
      }

      // Place surrogate under the deepest already visible node on that path
      const idx = deepestVisibleIndexOnPath(path);
      const hostParentId = path[idx];

      // Ensure the host UL is visible so the surrogate becomes visible
      const hostUl = ensureChildUl(hostParentId);
      if (hostUl && hostUl.style.display === 'none') {
        hostUl.style.display = 'block';
        const exp = nodeIndex.get(hostParentId)?.li?.querySelector('.node-expand');
        if (exp && exp.classList.contains('collaped')) {
          exp.classList.remove('collaped');
          exp.classList.add('expanded');
        }
      }

      // Inline loading placeholder at the correct leg position
      let inlineSpinner = null;
      try {
        inlineSpinner = buildLegInlineLoading(hostUl, leg);

        // Center on the inline spinner so users see *where* we’re working
        const spinnerNode = inlineSpinner?.querySelector?.('.node-host') || inlineSpinner;
        if (spinnerNode) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              centerOnNode(spinnerNode, { vBias: 0.4 }); // 40% from top feels nice
            });
          });
        }

        if (mode === 'surrogate') {
          const bottomBasics = await fetchNodeBasics({ dataUrl, treeId, nodeId: bottomId, currentPeriodDate });

          createCollapsedChainSurrogate({
            parentId: hostParentId,
            leg,
            pathIds: path.slice(idx),
            bottomNodeData: bottomBasics
          });

          const bottomRec = nodeIndex.get(bottomId);
          if (bottomRec?.nodeDiv) {
            if (activeNode) activeNode.classList.remove('active');
            bottomRec.nodeDiv.classList.add('active');
            activeNode = bottomRec.nodeDiv;
            // center after layout and transform are applied
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                centerOnNode(bottomRec.nodeDiv);
              });
            });
          }
          return;
        }

        // other modes (optional)
        const { bottomNodeDiv, deepestVisibleNodeDiv } = await ensurePathRendered(path, { expandPath: mode === 'pathOnly' });
        const focusDiv = mode === 'pathOnly' ? bottomNodeDiv : (deepestVisibleNodeDiv || bottomNodeDiv);
        if (focusDiv) {
          if (activeNode) activeNode.classList.remove('active');
          focusDiv.classList.add('active');
          activeNode = focusDiv;
          // center after layout and transform are applied
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              centerOnNode(focusDiv);
            });
          });
        }
      } finally {
        // Remove inline loader if it was created
        if (inlineSpinner && inlineSpinner.parentElement) {
          inlineSpinner.parentElement.removeChild(inlineSpinner);
        }
      }
    },

    onReady(cb) {
      if (typeof cb !== 'function') return;
      if (rootLoaded) {
        cb({
          legsWithRealNodeAtRoot: [...legsWithRealNodeAtRoot],
          treeLegs: treeLegs ? [...treeLegs] : null,
          rootId: String(rootId)
        });
      } else {
        readyCallbacks.push(cb);
      }
    },

    // (kept for completeness—unused by CustomerTree now)
    getRootLegsWithNodes() {
      return [...legsWithRealNodeAtRoot];
    }
  };

  // --- Start ---
  addRootNode();

  // --- Cleanup function that also exposes the API ---
  function cleanup() {
    if (flipHeightRafId != null) {
      cancelAnimationFrame(flipHeightRafId);
      flipHeightRafId = null;
    }
    // remove listeners
    handlers.forEach((off) => {
      try { off(); } catch (e) { /* listener may already be removed */ }
    });

    // clear DOM
    while (canvasBox.firstChild) {
      canvasBox.removeChild(canvasBox.firstChild);
    }
    if (tagbox.contains(canvasBox)) {
      tagbox.removeChild(canvasBox);
    }

    // restore styles
    document.body.style.userSelect = '';
  }
  cleanup.api = api;
  return cleanup;

  // --- Transform tracker ---
  function trackTransforms() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    let xform = svg.createSVGMatrix();

    ctx.getTransform = function () { return xform; };

    const savedTransforms = [];
    ctx.save = function () { savedTransforms.push(xform.translate(0, 0)); };
    ctx.restore = function () { xform = savedTransforms.pop(); };
    ctx.scale = function (sx, sy) { xform = xform.scaleNonUniform(sx, sy); };
    ctx.rotate = function (radians) { xform = xform.rotate((radians * 180) / Math.PI); };
    ctx.translate = function (dx, dy) { xform = xform.translate(dx, dy); };
    ctx.transform = function (a, b, c, d, e, f) {
      const m2 = svg.createSVGMatrix(); m2.a = a; m2.b = b; m2.c = c; m2.d = d; m2.e = e; m2.f = f;
      xform = xform.multiply(m2);
    };
    ctx.setTransform = function (a, b, c, d, e, f) {
      xform.a = a; xform.b = b; xform.c = c; xform.d = d; xform.e = e; xform.f = f;
    };
    const pt = svg.createSVGPoint();
    ctx.transformedPoint = function (x, y) { pt.x = x; pt.y = y; return pt.matrixTransform(xform.inverse()); };
  }
}

export { treeBorad };
