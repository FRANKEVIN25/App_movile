// ── FINANZAS ────────────────────────────────────────────────
const DIST_KEY = 'tiendita_distribuciones';

function getDistribuciones() {
  try { return JSON.parse(localStorage.getItem(DIST_KEY)) || {}; } catch { return {}; }
}

function getTodayDistribucion() {
  const today = new Date().toISOString().split('T')[0];
  return getDistribuciones()[today] || { costs: 0, transport: 0, food: 0, savings: 0, other: 0 };
}

function saveDistribucionHoy(dist) {
  const today = new Date().toISOString().split('T')[0];
  const all = getDistribuciones();
  all[today] = dist;
  localStorage.setItem(DIST_KEY, JSON.stringify(all));
}

function renderFinanzas() {
  const { ganancia } = getTotals();
  document.getElementById('fin-total').textContent = 'S/. ' + ganancia.toFixed(2);
  const dist = getTodayDistribucion();
  document.getElementById('fin-costs').value    = dist.costs    || '';
  document.getElementById('fin-transport').value = dist.transport || '';
  document.getElementById('fin-food').value     = dist.food     || '';
  document.getElementById('fin-savings').value  = dist.savings  || '';
  document.getElementById('fin-other').value    = dist.other    || '';
  updateFinanzasCalc();
}

function updateFinanzasCalc() {
  const { ganancia } = getTotals();
  const costs     = parseFloat(document.getElementById('fin-costs').value)    || 0;
  const transport = parseFloat(document.getElementById('fin-transport').value) || 0;
  const food      = parseFloat(document.getElementById('fin-food').value)     || 0;
  const savings   = parseFloat(document.getElementById('fin-savings').value)  || 0;
  const other     = parseFloat(document.getElementById('fin-other').value)    || 0;
  const totalGastos = costs + transport + food + savings + other;
  const neta = ganancia - totalGastos;

  const elNeta = document.getElementById('fin-neta');
  elNeta.textContent = 'S/. ' + neta.toFixed(2);
  elNeta.style.color = neta >= 0 ? 'var(--success)' : 'var(--danger)';

  const base = ganancia > 0 ? ganancia : 1;
  const pcts = { costs, transport, food, savings, other };
  Object.keys(pcts).forEach(k => {
    const el = document.getElementById('pct-' + k);
    if (el) el.textContent = ganancia > 0 ? Math.round((pcts[k] / base) * 100) + '%' : '0%';
  });

  saveDistribucionHoy({ costs, transport, food, savings, other });
  drawPieChart(ganancia, { costs, transport, food, savings, other });
}

function drawPieChart(total, dist) {
  const canvas = document.getElementById('fin-pie');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 6;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const slices = [
    { val: dist.costs,     color: '#e63946' },
    { val: dist.transport, color: '#f4a261' },
    { val: dist.food,      color: '#f72585' },
    { val: dist.savings,   color: '#2ec4b6' },
    { val: dist.other,     color: '#9ca3af' },
  ];
  const allocated = slices.reduce((s, d) => s + d.val, 0);
  const remaining = Math.max(0, total - allocated);
  if (remaining > 0) slices.push({ val: remaining, color: '#4361ee' });

  const totalDraw = slices.reduce((s, d) => s + d.val, 0);

  if (totalDraw <= 0) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e2e6f0'; ctx.fill();
  } else {
    let start = -Math.PI / 2;
    slices.forEach(s => {
      if (s.val <= 0) return;
      const angle = (s.val / totalDraw) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath(); ctx.fillStyle = s.color; ctx.fill();
      start += angle;
    });
  }

  // Donut hole
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2);
  ctx.fillStyle = 'var(--surface)' in document.documentElement.style ? 'white' : '#fff';
  ctx.fillStyle = '#ffffff'; ctx.fill();
}
