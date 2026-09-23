import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FAN_START_ANGLE, FAN_END_ANGLE, fanChildren, fanPlaceholders, fanSectorPath, layoutFan } from './fanLayout.js';
import { canExpandFanNode, fanAncestorPath, nextFanLevel } from './fanNavigation.js';

const node = (id, leg) => ({ nodeId: id, uplineLeg: leg, customer: { fullName: id } });
const root = node('root');

test('a root without descendants gets one grey ring, while a full ring needs no placeholders', () => {
  assert.deepEqual(fanPlaceholders([]), []);
  const empty = fanPlaceholders(layoutFan(root, new Map(), new Set(), []));
  assert.equal(empty.length, 1);
  assert.equal(empty[0].depth, 1);
  assert.equal(empty[0].start, FAN_START_ANGLE);
  assert.equal(empty[0].end, FAN_END_ANGLE);
  const pages = new Map([['root', { nodes: [node('a', 'Left')], done: true }]]);
  const sectors = layoutFan(root, pages, new Set(['root']), ['Left', 'Right']);
  // Configured placement slots already occupy their arc and remain interactive.
  assert.deepEqual(fanPlaceholders(sectors), []);
});

test('grey gaps complete uneven rings without covering customers or adding deeper rings', () => {
  const pages = new Map([
    ['root', { nodes: [node('a'), node('b'), node('c')], done: true }],
    ['b', { nodes: [node('b1'), node('b2')], done: true }],
    ['b1', { nodes: [node('b11')], done: true }],
    ['b11', { nodes: [{ ...node('edge'), totalChildNodes: 3 }], done: true }]
  ]);
  for (const expanded of [new Set(['root', 'b']), new Set(pages.keys())]) {
    const sectors = layoutFan(root, pages, expanded, []);
    const before = structuredClone(sectors);
    const gaps = fanPlaceholders(sectors);
    assert.deepEqual(sectors, before);
    const depth = Math.max(...sectors.map(sector => sector.depth));
    assert.equal(Math.max(...gaps.map(gap => gap.depth)), depth);
    for (let level = 1; level <= depth; level++) {
      const ring = [...sectors, ...gaps].filter(sector => sector.depth === level).sort((a, b) => a.start - b.start);
      assert.equal(ring[0].start, FAN_START_ANGLE);
      assert.ok(Math.abs(ring.at(-1).end - FAN_END_ANGLE) < 1e-10);
      ring.forEach((sector, index) => {
        assert.ok(sector.end > sector.start);
        if (index) assert.ok(Math.abs(ring[index - 1].end - sector.start) < 1e-10);
        assert.ok(!/NaN|Infinity/.test(fanSectorPath(level, sector.start, sector.end)));
      });
    }
    const a = sectors.find(sector => sector.key === 'a');
    assert.equal(gaps.filter(gap => gap.start === a.start && gap.end === a.end).length, depth - 1);
  }
});

test('configured legs retain their order and empty placement slots', () => {
  const children = fanChildren('root', { nodes: [node('right', 'RIGHT')], done: true }, ['Left', 'Right']);
  assert.equal(children[0].empty, true);
  assert.equal(children[0].uplineId, 'root');
  assert.equal(children[0].uplineLeg, 'Left');
  assert.equal(children[1].nodeId, 'right');
});

test('incomplete pages and hidden occupied legs cannot become placement slots', () => {
  assert.deepEqual(fanChildren('root', { nodes: [], done: false }, ['Left']), []);
  assert.deepEqual(fanChildren('root', {
    nodes: [], done: true, occupiedLegs: new Set(['left'])
  }, ['Left']), []);
});

test('holding tank children and holding tank slots stay out of the fan', () => {
  assert.deepEqual(fanChildren('root', {
    nodes: [node('tank', 'Holding Tank'), node('one', 'Other')], done: true
  }, ['Holding Tank']), [node('one', 'Other')]);
});

test('uneven nonbinary trees partition the wider fan within each parent', () => {
  const pages = new Map([
    ['root', { nodes: [node('a'), node('b'), node('c')], done: true }],
    ['b', { nodes: [node('b1'), node('b2')], done: true }]
  ]);
  const sectors = layoutFan(root, pages, new Set(['root', 'b']), []);
  assert.equal(sectors.length, 6);
  const children = sectors.filter(sector => sector.depth === 1);
  assert.equal(children[0].start, FAN_START_ANGLE);
  assert.ok(Math.abs(children[2].end - FAN_END_ANGLE) < 1e-12);
  assert.equal(children[0].end, children[1].start);
  const grandchildren = sectors.filter(sector => sector.depth === 2);
  assert.equal(grandchildren[0].start, children[1].start);
  assert.equal(grandchildren[1].end, children[1].end);
  assert.equal(grandchildren[0].end, grandchildren[1].start);
  assert.ok(grandchildren.every(sector => sector.branch === children[1].branch));
});

test('collapsed branches hide descendants without dropping their cached pages', () => {
  const pages = new Map([['root', { nodes: [node('a')], done: true }]]);
  assert.equal(layoutFan(root, pages, new Set(), []).length, 1);
  assert.equal(layoutFan(root, pages, new Set(['root']), []).length, 2);
  assert.equal(pages.get('root').nodes.length, 1);
});

test('depth limit and cycle guard keep long branches bounded', () => {
  const pages = new Map();
  for (let i = 0; i < 10; i++) pages.set(String(i), { nodes: [node(String(i + 1))], done: true });
  const expanded = new Set(pages.keys());
  const sectors = layoutFan(node('0'), pages, expanded, [], 4);
  assert.equal(sectors.length, 6);
  assert.equal(sectors.at(-1).node.summary, true);
  assert.equal(sectors.at(-1).depth, 5);
  pages.set('1', { nodes: [node('0')], done: true });
  assert.equal(layoutFan(node('0'), pages, expanded, [], 4).length, 2);
});

test('empty and very wide trees produce finite closed SVG sectors', () => {
  assert.deepEqual(layoutFan(null, new Map(), new Set(), []), []);
  const pages = new Map([['root', { nodes: Array.from({ length: 250 }, (_, i) => node(String(i))), done: true }]]);
  const sectors = layoutFan(root, pages, new Set(['root']), []);
  assert.equal(sectors.length, 251);
  sectors.forEach(sector => {
    const path = fanSectorPath(sector.depth, sector.start, sector.end);
    assert.ok(!/NaN|Infinity/.test(path));
    assert.ok(path.endsWith(' Z'));
  });
});

test('expand next level opens the nearest closed generation without crossing the view limit', () => {
  const pages = new Map();
  for (let i = 0; i < 6; i++) {
    pages.set(String(i), { nodes: [{ ...node(String(i + 1)), totalChildNodes: 1 }], done: true });
  }
  const base = { ...node('0'), totalChildNodes: 1 };
  const expanded = new Set(['0']);
  for (let i = 1; i < 4; i++) {
    const sectors = layoutFan(base, pages, expanded, []);
    const next = nextFanLevel(sectors, pages, expanded, []);
    assert.deepEqual(next.map(node => node.nodeId), [String(i)]);
    next.forEach(node => expanded.add(node.nodeId));
  }
  const limited = layoutFan(base, pages, expanded, []);
  const edge = limited.find(sector => sector.depth === 4);
  assert.equal(edge.node.nodeId, '4');
  assert.equal(limited.at(-1).node.summary, true);
  assert.deepEqual(nextFanLevel(limited, pages, expanded, []), []);
  // Recentering at the edge allows traversal past generation four.
  expanded.add('4');
  const deeper = layoutFan(edge.node, pages, expanded, []);
  assert.equal(deeper[1].node.nodeId, '5');
  assert.equal(deeper[1].depth, 1);
});

test('expand next level fills shallow siblings before expanding deeper branches', () => {
  const a = { ...node('a'), totalChildNodes: 1 };
  const b = { ...node('b'), totalChildNodes: 1 };
  const a1 = { ...node('a1'), totalChildNodes: 1 };
  const pages = new Map([
    ['root', { nodes: [a, b], done: true }],
    ['a', { nodes: [a1], done: true }]
  ]);
  const expanded = new Set(['root', 'a']);
  const sectors = layoutFan(root, pages, expanded, []);
  assert.deepEqual(nextFanLevel(sectors, pages, expanded, []).map(node => node.nodeId), ['b']);
});

test('navigation distinguishes terminal nodes, placement slots, and filtered empty branches', () => {
  assert.equal(canExpandFanNode(node('leaf'), new Map(), []), false);
  assert.equal(canExpandFanNode(node('leaf'), new Map(), ['Left']), true);
  assert.equal(canExpandFanNode(node('leaf'), new Map(), ['Holding Tank']), false);
  assert.equal(canExpandFanNode({ empty: true }, new Map(), ['Left']), false);
  const hiddenPage = new Map([['parent', { nodes: [], done: true, occupiedLegs: new Set(['left']) }]]);
  assert.equal(canExpandFanNode({ ...node('parent'), totalChildNodes: 1 }, hiddenPage, ['Left']), false);
});

test('ancestry includes skipped generations and guards malformed parent cycles', () => {
  const child = { ...node('child'), uplineId: 'root' };
  const grandchild = { ...node('grandchild'), uplineId: 'child' };
  const nodes = new Map([['root', root], ['child', child], ['grandchild', grandchild]]);
  assert.deepEqual(fanAncestorPath(grandchild, nodes).map(node => node.nodeId), ['root', 'child', 'grandchild']);
  nodes.set('root', { ...root, uplineId: 'grandchild' });
  assert.equal(fanAncestorPath(grandchild, nodes).length, 3);
});

test('more than eight children share one summary sector, hiding their cached descendants', () => {
  const parent = node('parent');
  const children = Array.from({ length: 9 }, (_, i) => node(`child-${i}`));
  const pages = new Map([
    ['root', { nodes: [parent], done: true }],
    ['parent', { nodes: children, done: true }],
    ['child-0', { nodes: [node('grandchild')], done: true }]
  ]);
  const expanded = new Set(['root', 'parent', 'child-0']);
  const sectors = layoutFan(root, pages, expanded, []);
  assert.equal(sectors.length, 3);
  const summary = sectors[2];
  assert.equal(summary.node.label, '9 direct');
  assert.equal(summary.start, sectors[1].start);
  assert.equal(summary.end, sectors[1].end);
  assert.equal(summary.depth, 2);
  assert.equal(summary.node.parentId, 'parent');
  assert.equal(canExpandFanNode(summary.node, pages, ['Left', 'Right']), false);
  assert.deepEqual(nextFanLevel(sectors, pages, expanded, ['Left', 'Right']), []);
  const focused = layoutFan(parent, pages, expanded, []);
  assert.equal(focused.filter(sector => sector.depth === 1).length, 9);
  assert.ok(focused.some(sector => sector.node.nodeId === 'grandchild'));
});

test('eight children stay separate when there is room but narrower siblings group even below the count limit', () => {
  const parent = node('parent');
  const pages = new Map([
    ['root', { nodes: [parent], done: true }],
    ['parent', { nodes: Array.from({ length: 8 }, (_, i) => node(`c${i}`)), done: true }]
  ]);
  const expanded = new Set(['root', 'parent']);
  assert.equal(layoutFan(root, pages, expanded, []).filter(sector => sector.depth === 2).length, 8);
  pages.get('root').nodes.push(...Array.from({ length: 19 }, (_, i) => node(`sibling${i}`)));
  pages.get('parent').nodes = [node('a'), node('b'), node('c')];
  const sectors = layoutFan(root, pages, expanded, []);
  assert.equal(sectors.filter(sector => sector.depth === 2).length, 1);
  assert.equal(sectors.find(sector => sector.node.summary).node.label, '3 direct');
});

test('summary counts exclude placement slots and holding tank children; incomplete pages use a lower bound', () => {
  const pages = new Map([
    ['root', { nodes: [node('parent', 'Left')], done: true }],
    ['parent', { nodes: [...Array.from({ length: 9 }, (_, i) => node(`c${i}`, 'Left')), node('tank', 'Holding Tank')], done: false }]
  ]);
  const expanded = new Set(['root', 'parent']);
  let summary = layoutFan(root, pages, expanded, ['Left', 'Right']).find(sector => sector.node.summary).node;
  assert.equal(summary.label, '9+ direct');
  assert.equal(summary.hasMore, true);
  pages.get('parent').done = true;
  summary = layoutFan(root, pages, expanded, ['Left', 'Right']).find(sector => sector.node.summary).node;
  assert.equal(summary.childCount, 9);
  assert.equal(summary.hasMore, false);
  const focused = layoutFan(node('parent'), pages, expanded, ['Left', 'Right']);
  assert.equal(focused.filter(sector => sector.depth === 1 && !sector.node.empty).length, 9);
  assert.equal(focused.filter(sector => sector.node.empty).length, 1);
});
