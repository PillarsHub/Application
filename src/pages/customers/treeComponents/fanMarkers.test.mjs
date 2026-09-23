import assert from 'node:assert/strict';
import test from 'node:test';
import { fanBranchIndicator } from './fanNavigation.js';
import { FAN_MAX_DEPTH, layoutFan } from './fanLayout.js';

const parent = { nodeId: 'parent', customer: { fullName: 'Parent Customer' }, totalChildNodes: 2, totalNodes: 45 };
const child = { nodeId: 'child', customer: { fullName: 'Child Customer' } };
const expanded = new Set(['parent']);

test('accessible branch descriptions distinguish visible and hidden children', () => {
  const pages = new Map([['parent', { nodes: [child], done: true }]]);
  assert.equal(fanBranchIndicator(parent, 1, pages, expanded), 'children');
  assert.equal(fanBranchIndicator(parent, FAN_MAX_DEPTH, pages, expanded), 'more');
  assert.equal(fanBranchIndicator(parent, 1, pages, new Set()), 'more');
  assert.equal(fanBranchIndicator(parent, 1, new Map(), expanded), 'more');
  pages.get('parent').done = false;
  assert.equal(fanBranchIndicator(parent, 1, pages, expanded), 'more');
});

test('leaves, empty slots, filtered customers and holding tank children do not get markers', () => {
  assert.equal(fanBranchIndicator({ ...parent, totalChildNodes: 0 }, 1, new Map(), expanded), null);
  assert.equal(fanBranchIndicator({ ...parent, empty: true }, 1, new Map(), expanded), null);
  assert.equal(fanBranchIndicator(null, 1, new Map(), expanded), null);
  for (const nodes of [[], [{ empty: true }], [{ nodeId: 'no-customer' }], [{ ...child, uplineLeg: 'Holding Tank' }]]) {
    assert.equal(fanBranchIndicator(parent, 1, new Map([['parent', { nodes, done: true }]]), expanded), null);
  }
});

test('loaded children take precedence over a stale zero child count', () => {
  const pages = new Map([['parent', { nodes: [child], done: true }]]);
  assert.equal(fanBranchIndicator({ ...parent, totalChildNodes: 0 }, 2, pages, expanded), 'children');
});

function edgeFan(edgeNodes, edgePages = []) {
  const root = { nodeId: 'root', customer: { fullName: 'Root' } };
  const pages = new Map(edgePages);
  let previous = root;
  for (let depth = 1; depth < FAN_MAX_DEPTH; depth++) {
    const next = { nodeId: `level${depth}`, customer: { fullName: `Level ${depth}` } };
    pages.set(previous.nodeId, { nodes: [next], done: true });
    previous = next;
  }
  pages.set(previous.nodeId, { nodes: edgeNodes, done: true });
  return { root, pages, expanded: new Set(pages.keys()) };
}

test('fourth-ring parents have a summary-only fifth ring even without loaded children', () => {
  const f = edgeFan([parent, { ...child, totalChildNodes: 0 }]);
  const sectors = layoutFan(f.root, f.pages, f.expanded, []);
  const outer = sectors.filter(sector => sector.depth === 5);
  assert.equal(outer.length, 1);
  assert.equal(outer[0].node.label, '45 total');
  assert.equal(outer[0].node.countDescription, 'Total: Across all levels below this position.');
  assert.equal(outer[0].node.descendantCount, 45);
  assert.equal(outer[0].node.instruction, 'Focus on Parent Customer to explore this branch.');
  assert.equal(outer[0].node.summary, true);
  const fourth = sectors.find(sector => sector.node.nodeId === 'parent');
  assert.equal(outer[0].start, fourth.start);
  assert.equal(outer[0].end, fourth.end);
  assert.equal(outer[0].branch, fourth.branch);
  assert.ok(sectors.every(sector => sector.depth <= 5));
});

test('descendant totals stay stable as direct children are loaded or filtered', () => {
  const f = edgeFan([parent], [['parent', { nodes: [child,
    { ...child, nodeId: 'tank', uplineLeg: 'Holding Tank' }, { nodeId: 'hidden' }, { empty: true }], done: true }]]);
  let sectors = layoutFan(f.root, f.pages, f.expanded, ['Left']);
  assert.equal(sectors.at(-1).node.label, '45 total');
  assert.ok(!sectors.some(sector => sector.node.nodeId === 'child'));
  f.pages.get('parent').done = false;
  assert.equal(layoutFan(f.root, f.pages, f.expanded, []).at(-1).node.label, '45 total');
  f.pages.get('parent').nodes = [];
  assert.equal(layoutFan(f.root, f.pages, f.expanded, []).at(-1).node.label, '45 total');
  f.pages.get('parent').done = true;
  sectors = layoutFan(f.root, f.pages, f.expanded, []);
  assert.ok(!sectors.some(sector => sector.depth === 5));
});

test('missing descendant totals never fall back to a direct-child count', () => {
  for (const totalNodes of [undefined, null, -1, 'invalid']) {
    const f = edgeFan([{ ...parent, totalNodes }]);
    const summary = layoutFan(f.root, f.pages, f.expanded, []).at(-1).node;
    assert.equal(summary.descendantCount, null);
    assert.equal(summary.label, 'Total');
    assert.equal(summary.hasMore, false);
  }
  const f = edgeFan([{ ...parent, totalChildNodes: 1, totalNodes: 1 }]);
  assert.equal(layoutFan(f.root, f.pages, f.expanded, []).at(-1).node.label, '1 total');
});

test('inner summaries keep the child count first and include a different descendant total', () => {
  const pages = new Map([
    ['root', { nodes: [parent], done: true }],
    ['parent', { nodes: Array.from({ length: 9 }, (_, i) => ({ ...child, nodeId: `child${i}` })), done: true }]
  ]);
  const root = { nodeId: 'root', customer: { fullName: 'Root' } };
  const summary = layoutFan(root, pages, new Set(['root', 'parent']), []).at(-1).node;
  assert.equal(summary.label, '9 direct');
  assert.equal(summary.childCount, 9);
  assert.equal(summary.detailLabel, '45 total');
  assert.equal(summary.countDescription, 'Direct: Immediately below this position. Total: Across all levels below this position.');
  assert.equal(summary.instruction, 'Focus on Parent Customer to see direct connections.');
});

test('inner descendant labels omit zero or equal totals and compare against all direct children, not a partial page', () => {
  const root = { nodeId: 'root', customer: { fullName: 'Root' } };
  const children = Array.from({ length: 9 }, (_, i) => ({ ...child, nodeId: `child${i}` }));
  for (const totalNodes of [0, 20, '20', null, undefined, -1, 'invalid', 45]) {
    const pages = new Map([
      ['root', { nodes: [{ ...parent, totalChildNodes: 20, totalNodes }], done: true }],
      ['parent', { nodes: children, done: false }]
    ]);
    const summary = layoutFan(root, pages, new Set(['root', 'parent']), []).at(-1).node;
    assert.equal(summary.label, '9+ direct');
    assert.equal(summary.detailLabel, totalNodes === 45 ? '45 total' : '');
  }
});

test('focusing a fourth-ring parent reveals cached children and returning restores the summary', () => {
  const f = edgeFan([parent], [['parent', { nodes: [child], done: true }]]);
  const before = layoutFan(f.root, f.pages, f.expanded, []);
  const focused = layoutFan(parent, f.pages, f.expanded, []);
  assert.equal(focused[1].node.nodeId, 'child');
  assert.equal(focused[1].depth, 1);
  assert.deepEqual(layoutFan(f.root, f.pages, f.expanded, []), before);
});
