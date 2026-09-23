import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fanChildPage, layoutFan, FAN_MAX_DEPTH, FAN_START_ANGLE, FAN_END_ANGLE } from './fanLayout.js';
import { autoExpandFan } from './fanAutoExpand.js';

const node = (id, count = 0, leg) => ({ nodeId: id, totalChildNodes: count, uplineLeg: leg, customer: { fullName: id } });
const root = node('root', 124);
const children = Array.from({ length: 124 }, (_, i) => node(`child-${i}`, 1, i % 2 ? 'Left' : 'Right'));

test('pages partition large families without gaps and give each page the entire fan', () => {
  const pages = new Map([['root', { nodes: children, done: true }]]);
  const seen = [];
  for (let index = 0; index < 9; index++) {
    const page = fanChildPage(root, pages.get('root'), ['Left', 'Right'], index);
    const sectors = layoutFan(root, pages, new Set(['root']), ['Left', 'Right'], FAN_MAX_DEPTH, index).filter(s => s.depth === 1);
    assert.equal(page.total, 124);
    assert.equal(sectors.length, index === 8 ? 4 : 15);
    assert.equal(page.hasNext, index < 8);
    assert.equal(sectors[0].start, FAN_START_ANGLE);
    assert.ok(Math.abs(sectors.at(-1).end - FAN_END_ANGLE) < 1e-10);
    assert.equal(sectors[0].branch, index * 15);
    seen.push(...sectors.map(s => s.key));
  }
  assert.deepEqual(seen, children.map(n => n.nodeId));
  assert.equal(fanChildPage(root, pages.get('root'), [], 999).index, 8);
});

test('incomplete batches display the first page immediately and later batches keep its order', () => {
  const first = fanChildPage(root, { nodes: children.slice(0, 16), done: false }, ['Left', 'Right']);
  const later = fanChildPage(root, { nodes: children, done: true }, ['Left', 'Right']);
  assert.deepEqual(first.children, later.children);
  assert.deepEqual(later.children, children.slice(0, 15));
  assert.equal(first.total, 124);
  assert.equal(first.hasNext, true);
});

test('small complete families retain configured placement slots without paging', () => {
  const result = fanChildPage(node('r', 1), { nodes: [node('a', 0, 'Right')], done: true }, ['Left', 'Right']);
  assert.equal(result.paged, false);
  assert.equal(result.children[0].empty, true);
  assert.equal(result.children[1].nodeId, 'a');
  assert.equal(result.total, 1);
});

test('counts exclude hidden, holding-tank, placement and cyclic entries; complete data overrides stale totals', () => {
  const nodes = [root, node('holding', 0, 'Holding Tank'), { nodeId: 'empty' }, ...children.slice(0, 20)];
  const partial = fanChildPage(root, { nodes, done: false, hiddenCustomers: true }, []);
  assert.equal(partial.total, null);
  assert.equal(partial.loaded, 20);
  assert.equal(partial.children[0].nodeId, 'child-0');
  const complete = fanChildPage(root, { nodes, done: true, hiddenCustomers: true }, [], 1);
  assert.equal(complete.total, 20);
  assert.equal(complete.end, 20);
  assert.equal(complete.hasNext, false);
});

function fixture(directChildren = children) {
  const pages = new Map();
  const calls = [];
  let expanded = new Set();
  let active = true;
  const options = { root, pages, legNames: [], getExpanded: () => expanded, isActive: () => active,
    expand: id => { expanded = new Set(expanded).add(id); },
    loadChildren: async (id, { count }) => {
      const previous = pages.get(id);
      const offset = previous?.offset || 0;
      calls.push({ id, count, offset });
      const all = id === 'root' ? directChildren : [node(`${id}-grandchild`)];
      const fetched = all.slice(offset, offset + count);
      const page = { nodes: [...(previous?.nodes || []), ...fetched], offset: offset + fetched.length, done: fetched.length < count };
      pages.set(id, page);
      return page;
    }
  };
  return { options, calls, cancel: () => { active = false; } };
}

test('only the selected page and its descendants load, and returning uses cache', async () => {
  const f = fixture();
  await autoExpandFan({ ...f.options, rootPageIndex: 0 });
  assert.equal(f.calls[0].count, 16);
  assert.equal(f.calls.filter(c => c.id === 'root').length, 1);
  assert.equal(f.options.pages.get('root').nodes.length, 16);
  assert.equal(f.options.pages.get('root').done, false);
  assert.deepEqual(f.calls.filter(c => c.id !== 'root').map(c => c.id), children.slice(0, 15).map(n => n.nodeId));
  const firstCalls = f.calls.length;
  await autoExpandFan({ ...f.options, rootPageIndex: 1 });
  assert.deepEqual(f.calls[firstCalls], { id: 'root', count: 15, offset: 16 });
  assert.deepEqual(f.calls.slice(firstCalls + 1).map(c => c.id), children.slice(15, 30).map(n => n.nodeId));
  const loadedCalls = f.calls.length;
  await autoExpandFan({ ...f.options, rootPageIndex: 0 });
  assert.equal(f.calls.length, loadedCalls);
  const visible = layoutFan(root, f.options.pages, f.options.getExpanded(), [], FAN_MAX_DEPTH, 0);
  assert.ok(visible.every(s => s.depth === 0 || Number(s.key.split('-')[1]) < 15));
});

test('paged families retain server order without fetching later branches in advance', async () => {
  const mixed = children.map((child, index) => ({ ...child, totalChildNodes: [5, 91, 120].includes(index) ? 2 : 0 }));
  const original = mixed.map(n => n.nodeId);
  const f = fixture(mixed);
  await autoExpandFan({ ...f.options, rootPageIndex: 0 });
  assert.equal(f.calls.filter(c => c.id === 'root').length, 1);
  assert.deepEqual(fanChildPage(root, f.options.pages.get('root'), [], 0).children.map(n => n.nodeId), original.slice(0, 15));
  assert.deepEqual(f.calls.filter(c => c.id !== 'root').map(c => c.id), ['child-5']);
  assert.deepEqual(mixed.map(n => n.nodeId), original);
  const seen = [];
  for (let index = 0; index < 9; index++) {
    await autoExpandFan({ ...f.options, rootPageIndex: index });
    seen.push(...fanChildPage(root, f.options.pages.get('root'), [], index).children.map(n => n.nodeId));
  }
  assert.deepEqual(seen, original);
  assert.deepEqual(f.options.pages.get('root').nodes.map(n => n.nodeId), original);
});

test('families that fit on one page retain server or configured-leg order even when a leaf precedes a branch', () => {
  const small = [node('leaf', 0, 'Left'), node('branch', 4, 'Right')];
  const page = { nodes: small, done: true };
  assert.deepEqual(fanChildPage(root, page, []).children.map(n => n.nodeId), ['leaf', 'branch']);
  assert.deepEqual(fanChildPage(root, page, ['Right', 'Left']).children.map(n => n.nodeId), ['branch', 'leaf']);
  assert.equal(fanChildPage(root, page, []).paged, false);
});

test('the last partial page ends cleanly and does not expose a phantom next page', async () => {
  const f = fixture();
  await autoExpandFan({ ...f.options, rootPageIndex: 8 });
  const page = fanChildPage(root, f.options.pages.get('root'), [], 8);
  assert.equal(page.start, 120);
  assert.equal(page.end, 124);
  assert.equal(page.hasNext, false);
  assert.equal(page.total, 124);
});

test('page loading stops on failure or cancellation and bounds scans through filtered batches', async () => {
  const f = fixture();
  let calls = 0;
  await autoExpandFan({ ...f.options, rootPageIndex: 0, loadChildren: async () => { calls++; return null; } });
  assert.equal(calls, 1);
  await autoExpandFan({ ...f.options, rootPageIndex: 0, loadChildren: async () => {
    calls++; f.cancel(); return { nodes: [], done: false };
  } });
  assert.equal(calls, 2);
  assert.equal(f.options.getExpanded().size, 0);
  const filtered = fixture();
  let batches = 0;
  await autoExpandFan({ ...filtered.options, rootPageIndex: 0, loadChildren: async id => {
    batches++;
    const page = { nodes: [], done: false, hiddenCustomers: true };
    filtered.options.pages.set(id, page);
    return page;
  } });
  assert.equal(batches, 10);
});
