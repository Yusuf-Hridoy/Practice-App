// Draws the SVG price charts. Charts are built once and then updated in place.
// The big chart also has a hover point: a dashed line, a dot and a small box
// with the time and the price. It works with the mouse and with the keyboard.

import { stepClockText } from './price-engine.js';
import { formatMoney } from './money-format.js';
import { TEXT, chartPointText } from './ui-text.js';
import { TEST_IDS } from './test-ids.js';

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

// How far the box sits from the point it belongs to.
const TOOLTIP_GAP = 10;

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

  // The hover point: a dashed line down the chart and a dot on the price line.
  const hoverGroup = makeSvgElement('g', { visibility: 'hidden', 'aria-hidden': 'true' });
  const hoverLine = makeSvgElement('line', {
    stroke: 'var(--text-muted)',
    'stroke-width': '1.5',
    'stroke-dasharray': '4 4',
    x1: BIG.left,
    x2: BIG.left,
    y1: BIG.top,
    y2: BIG.bottom,
  });
  const hoverDot = makeSvgElement('circle', {
    r: '5',
    cx: BIG.left,
    cy: BIG.bottom,
    fill: 'var(--up)',
    stroke: 'var(--bg)',
    'stroke-width': '2',
  });
  hoverGroup.append(hoverLine, hoverDot);

  svg.append(area, openLine, line, hoverGroup, ...labels);

  // The box with the time and the price is plain HTML, so it can sit over the
  // chart and flip sides near the right edge.
  const host = document.createElement('div');
  host.className = 'chart-hover-area';
  host.setAttribute('data-testid', TEST_IDS.chartHoverArea);
  host.setAttribute('tabindex', '0');
  host.setAttribute('aria-label', TEXT.stock.chartKeysLabel);

  const tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.setAttribute('data-testid', TEST_IDS.chartTooltip);
  tooltip.setAttribute('data-cents', '0');
  tooltip.setAttribute('data-time', '');
  tooltip.hidden = true;

  const tooltipTime = document.createElement('span');
  tooltipTime.className = 'chart-tooltip-time';
  tooltipTime.setAttribute('data-testid', TEST_IDS.chartTooltipTime);

  const tooltipPrice = document.createElement('span');
  tooltipPrice.className = 'chart-tooltip-price';
  tooltipPrice.setAttribute('data-testid', TEST_IDS.chartTooltipPrice);

  tooltip.append(tooltipTime, tooltipPrice);

  const announcer = document.createElement('p');
  announcer.className = 'sr-only';
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('data-testid', TEST_IDS.chartAnnouncer);

  host.append(svg, tooltip, announcer);

  let points = [];
  let xs = [];
  let ys = [];
  let activeIndex = null;

  function hideHover() {
    activeIndex = null;
    hoverGroup.setAttribute('visibility', 'hidden');
    tooltip.hidden = true;
  }

  // Puts the dashed line, the dot and the box on one point.
  function drawHover() {
    if (activeIndex === null || points.length === 0) return '';
    const index = Math.min(activeIndex, points.length - 1);
    activeIndex = index;

    const point = points[index];
    const timeText = stepClockText(point.step);
    const priceText = formatMoney(point.cents);

    hoverLine.setAttribute('x1', xs[index].toFixed(2));
    hoverLine.setAttribute('x2', xs[index].toFixed(2));
    hoverDot.setAttribute('cx', xs[index].toFixed(2));
    hoverDot.setAttribute('cy', ys[index].toFixed(2));
    hoverDot.setAttribute('fill', line.getAttribute('stroke'));
    hoverGroup.setAttribute('visibility', 'visible');

    tooltip.setAttribute('data-cents', String(point.cents));
    tooltip.setAttribute('data-time', timeText);
    tooltipTime.textContent = timeText;
    tooltipPrice.textContent = priceText;
    tooltip.hidden = false;

    // Where the point sits on the screen, in page pixels.
    const rect = svg.getBoundingClientRect();
    const scale = rect.width === 0 ? 0 : rect.width / BIG.width;
    const pointX = xs[index] * scale;
    const pointY = ys[index] * scale;
    const boxWidth = tooltip.offsetWidth;
    const boxHeight = tooltip.offsetHeight;

    // Near the right edge the box flips to the left of the point.
    const flip = pointX + TOOLTIP_GAP + boxWidth > rect.width;
    let left = flip ? pointX - TOOLTIP_GAP - boxWidth : pointX + TOOLTIP_GAP;
    left = Math.max(0, Math.min(left, Math.max(0, rect.width - boxWidth)));

    let top = pointY - boxHeight - TOOLTIP_GAP;
    top = Math.max(0, Math.min(top, Math.max(0, rect.height - boxHeight)));

    tooltip.style.left = `${left.toFixed(2)}px`;
    tooltip.style.top = `${top.toFixed(2)}px`;

    return chartPointText(timeText, priceText);
  }

  function moveTo(index, announce) {
    if (points.length === 0) return;
    activeIndex = Math.max(0, Math.min(index, points.length - 1));
    const said = drawHover();
    if (announce) announcer.textContent = said;
  }

  // The point nearest the mouse.
  function indexFromClientX(clientX) {
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || xs.length === 0) return 0;
    const viewX = ((clientX - rect.left) / rect.width) * BIG.width;
    let best = 0;
    let bestGap = Infinity;
    for (let i = 0; i < xs.length; i += 1) {
      const gap = Math.abs(xs[i] - viewX);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    }
    return best;
  }

  host.addEventListener('mousemove', (event) => {
    moveTo(indexFromClientX(event.clientX), false);
  });
  host.addEventListener('mouseleave', hideHover);

  host.addEventListener('keydown', (event) => {
    if (points.length === 0) return;
    const last = points.length - 1;
    const nothingYet = activeIndex === null;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveTo(nothingYet ? last : activeIndex - 1, true);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveTo(nothingYet ? last : activeIndex + 1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveTo(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveTo(last, true);
    } else if (event.key === 'Escape') {
      hideHover();
      announcer.textContent = '';
    }
  });

  function update({ points: nextPoints, openCents, ariaLabel, goingUp }) {
    points = nextPoints;
    const values = points.map((point) => point.cents).concat([openCents]);
    const y = scaleFor(values, BIG.top, BIG.bottom);
    xs = xPositions(points.length, BIG.left, BIG.right);
    ys = points.map((point) => y(point.cents));

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
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xs[index].toFixed(2)} ${ys[index].toFixed(2)}`)
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

    // New prices must not drop the point someone is reading.
    if (activeIndex !== null) drawHover();
  }

  return { element: host, svg, update, hideHover };
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
