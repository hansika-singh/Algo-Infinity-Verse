// modules/chartUtils.js
// Reusable chart utilities extracted from personal-analytics-dashboard
export function drawLineChart(svg, points, color = "#38bdf8") {
  if (!svg) return;
  const width = 720;
  const height = 260;
  svg.innerHTML = "";

  if (!points.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(226,232,240,0.65)" font-size="16">No history yet</text>';
    return;
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const padding = 28;
  const step = points.length === 1 ? 0 : (width - padding * 2) / (points.length - 1);

  const mapped = points.map((point, index) => {
    const x = padding + step * index;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { x, y, point };
  });

  const areaPoints = [
    `${padding},${height - padding}`,
    ...mapped.map(item => `${item.x},${item.y}`),
    `${width - padding},${height - padding}`
  ].join(" ");
  const linePoints = mapped.map(item => `${item.x},${item.y}`).join(" ");

  svg.innerHTML = `
    <defs>
      <linearGradient id="xpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.34" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0.02" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="720" height="260" fill="transparent"></rect>
    <polyline points="${areaPoints}" fill="url(#xpGradient)" stroke="none"></polyline>
    <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
    ${mapped.map(item => `<circle cx="${item.x}" cy="${item.y}" r="5.5" fill="${color}" stroke="#020617" stroke-width="2"></circle>`).join("")}
    ${points.map((point, index) => `<text x="${mapped[index].x}" y="${height - 10}" text-anchor="middle" fill="rgba(226,232,240,0.7)" font-size="12">${point.label}</text>`).join("")}
  `;
}

export function drawRadarChart(svg, topicStats) {
  if (!svg) return;
  svg.innerHTML = "";
  const points = topicStats.map(topic => ({
    label: topic.label,
    value: Math.max(10, Math.min(100, topic.attempts ? topic.accuracy : 18))
  }));

  if (!points.length) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="rgba(226,232,240,0.65)" font-size="16">No topic data yet</text>';
    return;
  }

  const center = 180;
  const radius = 120;
  const levels = [0.25, 0.5, 0.75, 1];
  const angleStep = (Math.PI * 2) / points.length;

  const polygonPoints = multiplier =>
    points
      .map((point, index) => {
        const angle = -Math.PI / 2 + angleStep * index;
        const x = center + Math.cos(angle) * radius * multiplier;
        const y = center + Math.sin(angle) * radius * multiplier;
        return `${x},${y}`;
      })
      .join(" ");

  const dataPoints = points
    .map((point, index) => {
      const angle = -Math.PI / 2 + angleStep * index;
      const distance = radius * (point.value / 100);
      const x = center + Math.cos(angle) * distance;
      const y = center + Math.sin(angle) * distance;
      return `${x},${y}`;
    })
    .join(" ");

  const spokes = points
    .map((point, index) => {
      const angle = -Math.PI / 2 + angleStep * index;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const labelX = center + Math.cos(angle) * (radius + 26);
      const labelY = center + Math.sin(angle) * (radius + 26);
      return `
        <line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(148,163,184,0.18)" />
        <text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="rgba(226,232,240,0.78)" font-size="11">${point.label}</text>
      `;
    })
    .join("");

  svg.innerHTML = `
    ${levels
      .map(level => `<polygon points="${polygonPoints(level)}" fill="none" stroke="rgba(148,163,184,0.15)" />`)
      .join("")}
    ${spokes}
    <polygon points="${dataPoints}" fill="rgba(56,189,248,0.24)" stroke="#38bdf8" stroke-width="3" stroke-linejoin="round"></polygon>
    ${points
      .map((point, index) => {
        const angle = -Math.PI / 2 + angleStep * index;
        const distance = radius * (point.value / 100);
        const x = center + Math.cos(angle) * distance;
        const y = center + Math.sin(angle) * distance;
        return `<circle cx="${x}" cy="${y}" r="4.5" fill="#38bdf8" stroke="#020617" stroke-width="2"></circle>`;
      })
      .join("")}
  `;
}
// Legacy global exports
window.drawLineChart = drawLineChart;
window.drawRadarChart = drawRadarChart;
