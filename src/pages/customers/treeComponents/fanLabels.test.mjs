import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fanLabelLayout, fitFanText } from './fanLabels.js';
import { FAN_ROOT_RADIUS, FAN_RING_WIDTH } from './fanLayout.js';

const measure = (text, size = 12) => Array.from(text).reduce((width, letter) =>
  width + (letter === 'W' ? 0.9 : letter === 'i' ? 0.25 : 0.55) * size, 0);
const layout = options => fanLabelLayout({ depth: 4, start: 0, end: 0.2, scale: 1,
  name: 'Christopher Montgomery', detail: '#A12345', measure, ...options });

test('measured fitting preserves long names when space allows and accounts for glyph width', () => {
  const name = 'Christopher Montgomery';
  assert.equal(fitFanText(name, 500, measure), name);
  assert.equal(fitFanText('iiiiiiiiii', 50, measure), 'iiiiiiiiii');
  assert.notEqual(fitFanText('WWWWWWWWWW', 50, measure), 'WWWWWWWWWW');
  const short = fitFanText(name, 70, measure);
  assert.ok(short.endsWith('…'));
  assert.ok(measure(short) <= 70);
  assert.equal(fitFanText(name, 2, measure), '');
});

test('truncation keeps joined Unicode characters intact', () => {
  const text = '👩‍💻 Morgan';
  const first = '👩‍💻';
  assert.equal(fitFanText(text, measure(first + '…'), measure), first + '…');
});

test('zoom reveals small labels without changing their size or fitting relative to the segment', () => {
  assert.equal(layout({ end: 0.025, scale: 1 }), null);
  const middle = layout({ end: 0.025, scale: 3 });
  assert.ok(middle?.name);
  assert.equal(middle.detail, '');
  const zoomed = layout({ end: 0.025, scale: 4 });
  assert.equal(zoomed.name, 'Christopher Montgomery');
  assert.deepEqual(zoomed, middle);
  assert.ok(zoomed.fontSize < layout({ scale: 4 }).fontSize);
  assert.equal(layout({ scale: 4, name: 'Sam Taylor' }).detail, '#A12345');
});

test('name takes priority over the ID when the two-line layout would shorten it', () => {
  const fitted = layout({ end: 0.065, scale: 1, name: 'Sam Taylor' });
  assert.equal(fitted.name, 'Sam Taylor');
  assert.equal(fitted.detail, '');
});

test('label rectangles stay inside the ring and radial edges, with space for an expansion marker', () => {
  for (const scale of [0.3, 0.75, 1, 2, 4]) {
    for (const angle of [0.01, 0.03, 0.1, 0.5, 2.5]) {
      const fitted = layout({ end: angle, scale, markerSpace: 26 });
      if (!fitted) continue;
      const halfWidth = fitted.width / 2;
      const halfHeight = (fitted.fontSize * 1.25 + (fitted.detail ? fitted.detailSize * 1.25 + 2 : 0)) / 2;
      const inner = FAN_ROOT_RADIUS + 3 * FAN_RING_WIDTH;
      const outer = inner + FAN_RING_WIDTH;
      assert.ok(fitted.radius - halfWidth >= inner);
      assert.ok(Math.hypot(fitted.radius + halfWidth, halfHeight) < outer);
      assert.ok(Math.atan2(halfHeight, fitted.radius - halfWidth) < angle / 2);
      assert.ok(fitted.radius + halfWidth <= outer - 26);
      assert.ok(measure(fitted.name, fitted.fontSize) <= fitted.width);
    }
  }
});

test('round root uses its diameter and unavailable chart dimensions hide labels safely', () => {
  assert.equal(layout({ depth: 0, name: 'Alex Morgan' }).name, 'Alex Morgan');
  assert.equal(layout({ scale: 0 }), null);
  assert.equal(layout({ scale: NaN }), null);
});

test('wide customer segments curve their names while narrow segments and the root remain radial', () => {
  const options = { depth: 1, start: -2.3, end: -0.8, name: 'Maya Mccarty', detail: '', allowCurve: true };
  assert.ok(layout(options).arcPath);
  assert.equal(layout({ ...options, end: -2.1 }).arcPath, undefined);
  assert.equal(layout({ ...options, depth: 0 }).arcPath, undefined);
  assert.equal(layout({ ...options, allowCurve: false }).arcPath, undefined);
  // A large radius alone must not turn a narrow angular slice into curved text.
  assert.equal(layout({ ...options, depth: 4, end: -1.95 }).arcPath, undefined);
});

test('curved labels keep their geometry and text through zoom, with edge margins and a bounded arc', () => {
  const options = { depth: 1, start: -3.6, end: 0.5, name: 'Christopher Montgomery '.repeat(5), detail: '', allowCurve: true };
  const fitted = layout(options);
  assert.ok(fitted.arcPath);
  assert.deepEqual(layout({ ...options, scale: 2 }), fitted);
  assert.deepEqual(layout({ ...options, scale: 4 }), fitted);
  assert.ok(fitted.width <= fitted.radius * Math.PI / 2);
  assert.ok(fitted.width < fitted.radius * (options.end - options.start));
  assert.ok(measure(fitted.name, fitted.fontSize) <= fitted.width);
  assert.ok(fitted.radius - fitted.fontSize > FAN_ROOT_RADIUS);
  assert.ok(fitted.radius + fitted.fontSize < FAN_ROOT_RADIUS + FAN_RING_WIDTH);
  assert.ok(fitted.name.endsWith('…'));
  assert.equal(layout({ ...options, scale: 0.3 }), null);
});

test('curved names reverse direction in the lower half so they remain upright on both sides', () => {
  for (const middle of [-3.4, -2.5, -Math.PI / 2, -0.5, 0.2]) {
    const fitted = layout({ depth: 3, start: middle - 0.35, end: middle + 0.35,
      name: 'Mari Carter', detail: '', allowCurve: true });
    const values = fitted.arcPath.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
    assert.equal(values[6], Math.sin(middle) > 0 ? 0 : 1);
    assert.ok(Math.abs(Math.hypot(values[0], values[1]) - fitted.radius) < 1e-8);
    assert.ok(Math.abs(Math.hypot(values[7], values[8]) - fitted.radius) < 1e-8);
  }
});

test('roomy segments keep larger curved names while narrow segments keep radial text', () => {
  const options = { depth: 1, start: -Math.PI, name: 'Alex Morgan', detail: '', allowCurve: true };
  const large = layout({ ...options, end: -Math.PI + 1.5 });
  const medium = layout({ ...options, end: -Math.PI + 1.25 });
  const narrow = layout({ ...options, end: -Math.PI + 0.2 });
  assert.ok(large.arcPath);
  assert.ok(medium.arcPath);
  assert.equal(narrow.arcPath, undefined);
  assert.ok(large.fontSize >= medium.fontSize);
  assert.ok(medium.fontSize > narrow.fontSize);
});

test('larger curved names stay centered in their rings and keep their geometry through zoom', () => {
  for (const depth of [1, 2, 3, 4]) {
    for (const middle of [-3.3, -2.5, -Math.PI / 2, -0.5, 0.2]) {
      const options = { depth, start: middle - 0.75, end: middle + 0.75, name: 'Alex Morgan', detail: '', allowCurve: true };
      const fitted = layout(options);
      const inner = FAN_ROOT_RADIUS + (depth - 1) * FAN_RING_WIDTH;
      assert.equal(fitted.radius, inner + FAN_RING_WIDTH / 2);
      assert.ok(fitted.radius - fitted.fontSize > inner);
      assert.ok(fitted.radius + fitted.fontSize < inner + FAN_RING_WIDTH);
      assert.ok(measure(fitted.name, fitted.fontSize) <= fitted.width);
      assert.deepEqual(layout({ ...options, scale: 4 }), fitted);
    }
  }
});

test('focused customer keeps its larger straight name centered in the circle', () => {
  const fitted = layout({ depth: 0, name: 'Alex Morgan', detail: '' });
  assert.equal(fitted.arcPath, undefined);
  assert.equal(fitted.fontSize, 16);
  assert.equal(fitted.radius, 0);
  assert.equal(fitted.nameY, 0);
  assert.ok(measure(fitted.name, fitted.fontSize) <= fitted.width);
});
