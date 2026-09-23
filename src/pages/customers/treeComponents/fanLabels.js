import { fanPoint, fanRingRadii } from './fanLayout.js';

const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

export function fitFanText(text, width, measure) {
  if (width <= 0) return '';
  if (measure(text) <= width) return text;
  const characters = graphemes
    ? [...graphemes.segment(text)].map(part => part.segment)
    : Array.from(text);
  let low = 0;
  let high = characters.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (measure(characters.slice(0, middle).join('').trimEnd() + '…') <= width) low = middle;
    else high = middle - 1;
  }
  return low ? characters.slice(0, low).join('').trimEnd() + '…' : '';
}

// Fit in SVG coordinates so the text scales together with its segment.
// Zoom affects readability thresholds only, never font size or truncation.
export function fanLabelLayout({ depth, start, end, scale, name, detail, markerSpace = 0, measure, allowCurve = false }) {
  if (!(scale > 0)) return null;
  const { inner, outer } = fanRingRadii(depth);
  const segmentHeight = depth === 0 ? 2 * outer :
    (inner + outer) * Math.sin(Math.min((end - start) / 2, Math.PI / 2));
  const fontSize = depth === 0 ? 16 : Math.min(12, Math.max(3, segmentHeight / 2));
  const detailSize = fontSize * 0.8;
  if (depth > 0 && fontSize * scale < 7) return null;
  const nameHeight = fontSize * 1.25;
  const detailHeight = detailSize * 1.25;
  const padding = fontSize / 4;

  if (allowCurve && depth > 0 && end - start >= Math.PI / 6) {
    const middleRadius = (inner + outer) / 2;
    // Leave room for the glyphs at both radial edges and avoid wrapping a
    // long name around more than a quarter-circle in very broad segments.
    const edgePadding = (fontSize + 4) / (middleRadius - fontSize);
    const span = Math.min(end - start - 2 * edgePadding, Math.PI / 2);
    const width = middleRadius * span;
    // Curve only when the arc offers meaningfully more space than a radial
    // label. This decision is in fan coordinates, independent of zoom.
    if (width >= (outer - inner) * 1.25) {
      const middle = (start + end) / 2;
      // Reverse the path in the lower half so the text stays upright.
      const reverse = Math.sin(middle) > 0;
      const curvedFontSize = Math.min(18, Math.max(14, middleRadius * (end - start) / 16));
      const radius = middleRadius;
      const labelPadding = (curvedFontSize + 4) / (radius - curvedFontSize);
      const labelSpan = Math.min(end - start - 2 * labelPadding, Math.PI / 2);
      const labelWidth = radius * labelSpan;
      const fittedName = fitFanText(name, labelWidth, text => measure(text, curvedFontSize, 600));
      const from = fanPoint(radius, middle + (reverse ? labelSpan / 2 : -labelSpan / 2));
      const to = fanPoint(radius, middle + (reverse ? -labelSpan / 2 : labelSpan / 2));
      return fittedName ? { name: fittedName, detail: '', fontSize: curvedFontSize, radius, width: labelWidth,
        arcPath: `M ${from.x} ${from.y} A ${radius} ${radius} 0 0 ${reverse ? 0 : 1} ${to.x} ${to.y}` } : null;
    }
  }

  function box(height) {
    const halfHeight = height / 2;
    if (halfHeight >= outer - padding) return null;
    const outerEdge = Math.sqrt((outer - padding) ** 2 - halfHeight ** 2);
    if (depth === 0) return { radius: 0, width: 2 * outerEdge };
    const halfAngle = (end - start) / 2;
    if (halfAngle <= 0) return null;
    // The text rectangle must stay inside both the arc and the radial edges.
    const left = Math.max(inner + padding, halfAngle < Math.PI / 2 ? (halfHeight + padding) / Math.tan(halfAngle) : 0);
    const right = Math.min(outerEdge, outer - markerSpace - padding);
    return right > left ? { radius: (left + right) / 2, width: right - left } : null;
  }

  const nameWidth = text => measure(text, fontSize, 600);
  const detailWidth = text => measure(text, detailSize, 400);
  const both = detail ? box(nameHeight + detailHeight + 2) : null;
  // Hide the ID before sacrificing any of the customer's name.
  if (both && nameWidth(name) <= both.width) {
    const fittedDetail = fitFanText(detail, both.width, detailWidth);
    if (fittedDetail) return { ...both, name, detail: detailSize * scale >= 6 ? fittedDetail : '', fontSize, detailSize,
      nameY: -(detailHeight + 2) / 2, detailY: (nameHeight + 2) / 2 };
  }
  const single = box(nameHeight);
  const fittedName = single && fitFanText(name, single.width, nameWidth);
  return fittedName ? { ...single, name: fittedName, detail: '', fontSize, detailSize, nameY: 0 } : null;
}

export function createFanTextMeasurer(fontFamily) {
  const context = document.createElement('canvas').getContext('2d');
  const cache = new Map();
  return (text, size, weight) => {
    const key = `${size}:${weight}:${text}`;
    if (!cache.has(key)) {
      if (context) context.font = `${weight} ${size}px ${fontFamily}`;
      cache.set(key, context ? context.measureText(text).width : Array.from(text).length * size * 0.65);
    }
    return cache.get(key);
  };
}
