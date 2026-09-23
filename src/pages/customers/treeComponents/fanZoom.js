export function zoomFanAt(transform, factor, point = transform) {
  const scale = Math.max(0.5, Math.min(4, transform.scale * factor));
  if (scale === transform.scale) return transform;
  const ratio = scale / transform.scale;
  return {
    x: point.x - (point.x - transform.x) * ratio,
    y: point.y - (point.y - transform.y) * ratio,
    scale
  };
}

export function fanWheelFactor(deltaY, deltaMode, pageHeight) {
  // Wheel devices report pixels, lines, or pages. Bound large ticks while
  // preserving the smaller deltas produced by trackpads.
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? pageHeight : 1);
  return Math.exp(-Math.max(-100, Math.min(100, pixels)) * 0.002);
}
