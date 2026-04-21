// ── RESUMEN DEL MES ────────────────────────────────────────
let mesViendo = new Date().toISOString().slice(0, 7);

const NOMBRES_MES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function renderMes() {
  const [y, m] = mesViendo.split('-');
  document.getElementById('mes-label').textContent = `${NOMBRES_MES[parseInt(m)-1]} ${y}`;

  // Disable "›" if we're in current month
  const hoyMes = new Date().toISOString().slice(0, 7);
  document.getElementById('btn-mes-next').disabled = (mesViendo >= hoyMes);

  let records = getHistorial().filter(r => r.date.startsWith(mesViendo));

  // Include today's live data if same month
  const today = new Date().toISOString().split('T')[0];
  if (today.startsWith(mesViendo)) {
    const t = getTotals();
    if (t.count > 0 && !records.find(r => r.date === today)) {
      records.push({ date: today, total: t.totalVenta, ganancia: t.ganancia, count: t.count, avg: t.avg });
    }
  }

  if (!records.length) {
    document.getElementById('mes-stats').innerHTML =
      `<div class="hist-empty"><div class="h-icon">📈</div><p>Sin ventas en ${NOMBRES_MES[parseInt(m)-1]}</p></div>`;
    document.getElementById('mes-tabla-wrap').innerHTML = '';
    return;
  }

  records.sort((a, b) => a.date.localeCompare(b.date));

  const totalMes = records.reduce((s, r) => s + r.total, 0);
  const countMes = records.reduce((s, r) => s + r.count, 0);
  const avgDia   = totalMes / records.length;
  const mejorDia = records.reduce((b, r) => r.total > b.total ? r : b, records[0]);

  document.getElementById('mes-stats').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card wide">
        <div class="s-label">Total del mes</div>
        <div class="s-value">S/. ${totalMes.toFixed(2)}</div>
        <div class="s-note">${records.length} día${records.length !== 1 ? 's' : ''} con ventas</div>
      </div>
      <div class="stat-card">
        <div class="s-label">Unidades</div>
        <div class="s-value" style="font-size:24px">${countMes}</div>
        <div class="s-note">vendidas</div>
      </div>
      <div class="stat-card">
        <div class="s-label">Prom./día</div>
        <div class="s-value" style="font-size:22px">S/. ${avgDia.toFixed(0)}</div>
        <div class="s-note">promedio</div>
      </div>
      <div class="stat-card wide mejor-dia-card">
        <div class="s-label">🏆 Mejor día</div>
        <div class="s-value" style="font-size:16px;line-height:1.3">${fechaLarga(mejorDia.date)}</div>
        <div class="s-note">S/. ${mejorDia.total.toFixed(2)} en ventas</div>
      </div>
    </div>`;

  document.getElementById('mes-tabla-wrap').innerHTML = `
    <div class="section-label" style="margin-top:16px">Detalle por día</div>
    <table class="summary-table">
      <thead><tr><th>Día</th><th>Total</th><th>Unid.</th><th>Prom.</th></tr></thead>
      <tbody>
        ${records.map(r => `
          <tr>
            <td>${fechaCorta(r.date)}</td>
            <td class="td-num td-blue">S/. ${r.total.toFixed(2)}</td>
            <td class="td-num">${r.count}</td>
            <td class="td-num">S/. ${r.count > 0 ? (r.total/r.count).toFixed(2) : '0.00'}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function cambiarMes(delta) {
  const [y, m] = mesViendo.split('-').map(Number);
  const nd = new Date(y, m - 1 + delta, 1);
  mesViendo = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
  renderMes();
}
