// ── NAVEGACIÓN ─────────────────────────────────────────────
function switchScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.getElementById('btn-'+name).classList.add('active');
  if(name==='venta')renderPOS();
  if(name==='resumen')renderResumen();
  if(name==='productos')renderInventario();
  if(name==='destino')renderDestinos();
  if(name==='historial')renderHistorial();
  if(name==='mes')renderMes();
  if(name==='finanzas')renderFinanzas();
}

// ── MODALS ─────────────────────────────────────────────────
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function showConfirm(title,msg,cb){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-msg').textContent=msg;
  document.getElementById('confirm-ok-btn').onclick=()=>{closeModal('modal-confirm');cb();};
  openModal('modal-confirm');
}

// ── TOAST ──────────────────────────────────────────────────
let toastTimer;
function showToast(msg,type='success'){
  const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+type;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

// ── INIT ───────────────────────────────────────────────────
async function init() {
  try { await Promise.all([cargarCatalogo(), cargarInventario(), cargarVentasHoy(), cargarDestinos()]); }
  catch(e) { console.error('Init error:', e); }
  renderPOS(); renderInventario(); renderResumen(); renderDestinos(); actualizarContadoresCat();
}

init();
