// Draws the SVG price charts. Charts are built once and then updated in place.

import { stepClockText } from './price-engine.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const BIG = {
  width: 720,
  height: 280,
  left: 12,
  right: 708,
  top: 20,
  bottom: 230,
  labelY: 262,
};

function makeSvgElement(name, attributes) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}

function scaleFor(values, top, bottom) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    min -= 1;
    max += 1;
  }
  const padding = (max - min) * 0.08;
  min -= padding;
  max += padding;
  return (value) => bottom - ((value - min) / (max - min)) * (bottom - top);
}

function xPositions(count, left, right) {
  if (count <= 1) return [left, right];
  const positions = [];
  for (let i = 0; i < count; i += 1) positions.push(left + (i / (count - 1)) * (right - left));
  return positions;
}

// --- big chart on the stock page ---

export function createPriceChart(testId) {
  const svg = makeSvgElement('svg', {
    viewBox: `0 0 ${BIG.width} ${BIG.height}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'data-testid': testId,
  });

  const area = makeSvgElement('path', { fill: 'var(--up)', 'fill-opacity': '0.12', stroke: 'none', d: '' });
  const openLine = makeSvgElement('line', {
    stroke: 'var(--text-muted)',
    'stroke-width': '1.5',
    'stroke-dasharray': '6 6',
    x1: BIG.left,
    x2: BIG.right,
    y1: BIG.bottom,
    y2: BIG.bottom,
  });
  const line = makeSvgElement('path', {
    fill: 'none',
    stroke: 'var(--up)',
    'stroke-width': '2.5',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    d: '',
  });

  const labels = [];
  for (let i = 0; i < 5; i += 1) {
    const text = makeSvgElement('text', {
      x: BIG.left,
      y: BIG.labelY,
      fill: 'var(--text-muted)',
      'font-size': '13',
      'text-anchor': i === 0 ? 'start' : i === 4 ? 'end' : 'middle',
    });
    labels.push(text);
  }

  svg.append(area, openLine, line, ...labels);

  function update({ points, openCents, ariaLabel, goingUp }) {
    const values = points.map((point) => point.cents).concat([openCents]);
    const y = scaleFor(values, BIG.top, BIG.bottom);
    const xs = xPositions(points.length, BIG.left, BIG.right);

    const color = goingUp ? 'var(--up)' : 'var(--down)';
    line.setAttribute('stroke', color);
    area.setAttribute('fill', color);

    let d = '';
    if (points.length === 1) {
      const flat = y(points[0].cents);
      d = `M ${BIG.left} ${flat} L ${BIG.right} ${flat}`;
      area.setAttribute('d', `${d} L ${BIG.right} ${BIG.bottom} L ${BIG.left} ${BIG.bottom} Z`);
    } else {
      d = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xs[index].toFixed(2)} ${y(point.cents).toFixed(2)}`)
        .join(' ');
      area.setAttribute('d', `${d} L ${BIG.right} ${BIG.bottom} L ${BIG.left} ${BIG.bottom} Z`);
    }
    line.setAttribute('d', d);

    const openY = y(openCents).toFixed(2);
    openLine.setAttribute('y1', openY);
    openLine.setAttribute('y2', openY);

    const firstStep = points[0].step;
    const lastStep = points[points.length - 1].step;
    for (let i = 0; i < labels.length; i += 1) {
      const share = labels.length === 1 ? 0 : i / (labels.length - 1);
      const step = Math.round(firstStep + share * (lastStep - firstStep));
      labels[i].setAttribute('x', (BIG.left + share * (BIG.right - BIG.left)).toFixed(2));
      labels[i].textContent = stepClockText(step);
    }

    svg.setAttribute('aria-label', ariaLabel);
  }

  return { element: svg, update };
}

// --- mini chart in a market row ---

export function createMiniChart() {
  const svg = makeSvgElement('svg', {
    viewBox: '0 0 110 32',
    preserveAspectRatio: 'none',
    class: 'mini-chart',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const line = makeSvgElement('path', {
    fill: 'none',
    stroke: 'var(--up)',
    'stroke-width': '2',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    d: '',
  });
  svg.append(line);

  function update(points, goingUp) {
    const values = points.map((point) => point.cents);
    const y = scaleFor(values, 4, 28);
    const xs = xPositions(points.length, 2, 108);

    line.setAttribute('stroke', goingUp ? 'var(--up)' : 'var(--down)');

    if (points.length === 1) {
      const flat = y(points[0].cents).toFixed(2);
      line.setAttribute('d', `M 2 ${flat} L 108 ${flat}`);
      return;
    }
    line.setAttribute(
      'd',
      points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xs[index].toFixed(2)} ${y(point.cents).toFixed(2)}`)
        .join(' '),
    );
  }

  return { element: svg, update };
}
