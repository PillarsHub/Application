import assert from 'node:assert/strict';
import { test } from 'node:test';
import { autoExpandFan, createFanRequestQueue } from './fanAutoExpand.js';
import { layoutFan } from './fanLayout.js';

const node = (id, totalChildNodes = 2, uplineLeg) => ({ nodeId: id, totalChildNodes, uplineLeg, customer: { fullName: id } });
const pause = () => new Promise(resolve => setTimeout(resolve, 1));

function fixture(children, legNames = []) {
  const pages = new Map();
  const calls = [];
  const snapshots = [];
  let expanded = new Set();
  let active = true;
  let requests = 0;
  let maximumRequests = 0;
  const options = {
    root: node('r'), pages, getExpanded: () => expanded, legNames,
    isActive: () => active,
    loadChildren: async (id, { count, isActive }) => {
      calls.push({ id, count });
      requests++;
      maximumRequests = Math.max(maximumRequests, requests);
      await pause();
      requests--;
      const result = children(id);
      if (!result) return null;
      const fetched = result.slice(0, count);
      const page = { nodes: fetched, done: fetched.length < count };
      pages.set(id, page);
      return isActive() ? page : undefined;
    },
    expand: id => {
      expanded = new Set(expanded).add(id);
      snapshots.push(layoutFan(options.root, pages, expanded, legNames).length);
    }
  };
  return { options, pages, calls, snapshots, cancel: () => { active = false; }, maximum: () => maximumRequests };
}

test('automatically reveals four binary generations progressively with four concurrent loads', async () => {
  const f = fixture(id => [node(id + 'L', 2, 'Left'), node(id + 'R', 2, 'Right')], ['Left', 'Right']);
  const result = await autoExpandFan(f.options);
  assert.equal(result.limited, false);
  assert.equal(f.snapshots[0], 3);
  assert.equal(f.snapshots.at(-1), 47); // 31 customers and 16 continuation summaries.
  assert.equal(f.calls.length, 15);
  assert.equal(f.maximum(), 4);
  assert.ok(f.calls.every(call => call.id.length <= 4));
});

test('wide branches become summaries and stop automatic requests below their children', async () => {
  const f = fixture(id => Array.from({ length: id === 'r' ? 10 : 1000 }, (_, index) => node(`${id}-${index}`, 1000)));
  f.options.root.totalChildNodes = 1000;
  const result = await autoExpandFan(f.options);
  assert.equal(result.limited, false);
  assert.equal(f.snapshots.at(-1), 21);
  assert.equal(f.calls.length, 11);
  assert.ok(f.calls.every(call => call.id === 'r' || /^r-\d+$/.test(call.id)));
  assert.ok(f.snapshots.every(count => count <= 200));
  assert.ok(f.maximum() <= 4);
  assert.ok(f.calls.some(call => call.count < 100));
});

test('the focused customer stays ungrouped and still respects the automatic node budget', async () => {
  const f = fixture(id => Array.from({ length: 1000 }, (_, index) => node(`${id}-${index}`, 1000)));
  f.options.root.totalChildNodes = 1000;
  const result = await autoExpandFan({ ...f.options, nodeLimit: 25 });
  assert.equal(result.limited, true);
  assert.equal(f.snapshots.at(-1), 25);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].count, 24);
});

test('focusing a summarized parent reveals its children; returning groups them again without requests', async () => {
  const f = fixture(id => id === 'r' ? [node('wide', 24)] : id === 'wide'
    ? Array.from({ length: 24 }, (_, index) => node(`child-${index}`, 0)) : []);
  await autoExpandFan(f.options);
  assert.deepEqual(f.calls.map(call => call.id), ['r', 'wide']);
  const summary = layoutFan(f.options.root, f.pages, f.options.getExpanded(), []).at(-1).node;
  assert.equal(summary.label, '24 direct');
  const original = f.options.root;
  f.options.root = f.pages.get('r').nodes[0];
  await autoExpandFan(f.options);
  assert.equal(layoutFan(f.options.root, f.pages, f.options.getExpanded(), []).length, 25);
  f.options.root = original;
  await autoExpandFan(f.options);
  assert.equal(layoutFan(f.options.root, f.pages, f.options.getExpanded(), []).at(-1).node.summary, true);
  assert.equal(f.calls.length, 2);
});

test('empty leg placeholders count toward the visible-node budget', async () => {
  const f = fixture(id => id === 'r' ? [node('a', 0, 'Left'), node('b', 0, 'Right')] : [], ['Left', 'Right']);
  const result = await autoExpandFan({ ...f.options, nodeLimit: 5 });
  assert.equal(result.limited, true);
  assert.ok(f.snapshots.every(count => count <= 5));
  assert.ok(f.calls.every(call => call.count > 0));
});

test('returning to a cached fan does not issue requests and focusing explores beyond its old depth', async () => {
  const f = fixture(id => [node(id + 'L', 2, 'Left'), node(id + 'R', 2, 'Right')], ['Left', 'Right']);
  await autoExpandFan(f.options);
  const count = f.calls.length;
  await autoExpandFan(f.options);
  assert.equal(f.calls.length, count);
  f.options.root = f.pages.get('r').nodes[0];
  await autoExpandFan(f.options);
  assert.equal(f.snapshots.at(-1), 47);
  assert.ok(f.calls.slice(count).every(call => call.id.startsWith('rL') && call.id.length === 5));
});

test('cached descendants cannot push a newly opened branch over the budget', async () => {
  const f = fixture(() => { throw new Error('Cached pages should not be fetched'); });
  f.pages.set('r', { nodes: Array.from({ length: 250 }, (_, index) => node(String(index))), done: true });
  const result = await autoExpandFan(f.options);
  assert.equal(result.limited, true);
  assert.equal(f.calls.length, 0);
  assert.equal(f.options.getExpanded().size, 0);
});

test('cancelling automatic work stops later generations and does not reopen collapsed branches', async () => {
  const f = fixture(id => {
    if (id !== 'r') f.cancel();
    return [node(id + 'L'), node(id + 'R')];
  });
  await autoExpandFan(f.options);
  assert.ok(f.calls.every(call => call.id.length <= 2));
  assert.equal(f.snapshots.at(-1), 3);
});

test('failed branches do not loop or prevent other branches from expanding', async () => {
  const f = fixture(id => id === 'rL' ? null : [node(id + 'L'), node(id + 'R')]);
  await autoExpandFan(f.options);
  assert.equal(f.calls.filter(call => call.id === 'rL').length, 1);
  assert.ok(f.calls.some(call => call.id === 'rRRR'));
  assert.equal(f.options.getExpanded().has('rL'), false);
});

test('request queue shares its four slots and drops cancelled waiting requests', async () => {
  const schedule = createFanRequestQueue();
  const release = [];
  const started = [];
  let oldFocusActive = true;
  const oldFocus = Array.from({ length: 8 }, (_, id) => schedule(() => {
    started.push(id);
    return new Promise(resolve => release.push(resolve));
  }, () => oldFocusActive));
  await Promise.resolve();
  assert.deepEqual(started, [0, 1, 2, 3]);
  oldFocusActive = false;
  const newFocus = schedule(() => { started.push('new'); return 'new'; }, () => true);
  release.forEach(resolve => resolve('finished'));
  const results = await Promise.all(oldFocus);
  assert.deepEqual(results.slice(4), [undefined, undefined, undefined, undefined]);
  assert.equal(await newFocus, 'new');
  assert.deepEqual(started, [0, 1, 2, 3, 'new']);
});
