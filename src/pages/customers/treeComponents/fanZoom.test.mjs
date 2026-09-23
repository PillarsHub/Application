import assert from 'node:assert/strict';
import test from 'node:test';
import { fanWheelFactor, zoomFanAt } from './fanZoom.js';

test('zoom keeps the point under the pointer fixed after panning', () => {
  const before = { x: 80, y: -40, scale: 1.5 };
  const point = { x: -120, y: 210 };
  const after = zoomFanAt(before, 1.25, point);
  for (const axis of ['x', 'y']) {
    const world = (point[axis] - before[axis]) / before.scale;
    assert.ok(Math.abs(world * after.scale + after[axis] - point[axis]) < 1e-9);
  }
  assert.deepEqual(zoomFanAt(after, 1 / 1.25, point), before);
});

test('zoom clamps at the existing limits without shifting at a limit', () => {
  const point = { x: 50, y: -60 };
  for (const [scale, factor, limit] of [[3.9, 1.5, 4], [0.6, 0.5, 0.5]]) {
    const before = { x: 10, y: 20, scale };
    const after = zoomFanAt(before, factor, point);
    assert.equal(after.scale, limit);
    assert.equal(zoomFanAt(after, factor, point), after);
    for (const axis of ['x', 'y']) {
      assert.ok(Math.abs((point[axis] - before[axis]) / scale - (point[axis] - after[axis]) / limit) < 1e-9);
    }
  }
});

test('toolbar zoom preserves translation', () => {
  assert.deepEqual(zoomFanAt({ x: 80, y: -40, scale: 1 }, 1.25), { x: 80, y: -40, scale: 1.25 });
});

test('wheel units normalize with smooth trackpad deltas and bounded large ticks', () => {
  assert.equal(fanWheelFactor(3, 1, 600), fanWheelFactor(48, 0, 600));
  assert.equal(fanWheelFactor(0.1, 2, 600), fanWheelFactor(60, 0, 600));
  assert.equal(fanWheelFactor(5000, 0, 600), fanWheelFactor(100, 0, 600));
  assert.ok(fanWheelFactor(-1, 0, 600) > 1);
  assert.ok(fanWheelFactor(1, 0, 600) < 1);
  assert.ok(fanWheelFactor(-1, 0, 600) < fanWheelFactor(-10, 0, 600));
  assert.equal(fanWheelFactor(0, 0, 600), 1);
});
