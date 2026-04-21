// ── VENTAS ─────────────────────────────────────────────────
async function cargarVentasHoy() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await db.from('ventas').select('producto_id,cantidad').eq('fecha',today);
  if (error) throw error;
  ventas = {};
  (data||[]).forEach(v=>{ ventas[v.producto_id]=(ventas[v.producto_id]||0)+v.cantidad; });
}

async function addSale(e, id) {
  e.stopPropagation();
  const prod = inventario.find(p=>p.id===id);
  if (!prod) return;
  const card = e.currentTarget.closest('.pos-card') || e.currentTarget;
  const ripple = document.createElement('span');
  ripple.className='ripple';
  const rect=card.getBoundingClientRect();
  ripple.style.left=(e.clientX-rect.left)+'px'; ripple.style.top=(e.clientY-rect.top)+'px';
  card.appendChild(ripple); setTimeout(()=>ripple.remove(),600);
  ventas[id]=(ventas[id]||0)+1; renderPOS();
  const today=new Date().toISOString().split('T')[0];
  const {error}=await db.from('ventas').insert({
    producto_id:id, cantidad:1,
    precio_venta_momento:prod.precio_venta,
    precio_compra_momento:prod.precio_compra, fecha:today
  });
  if (error) { ventas[id]--; renderPOS(); showToast('Error al guardar venta','danger'); }
}

async function undoSale(e, id) {
  e.stopPropagation();
  if ((ventas[id]||0)===0) return;
  const today=new Date().toISOString().split('T')[0];
  ventas[id]--; renderPOS();
  const {data,error}=await db.from('ventas').select('id')
    .eq('producto_id',id).eq('fecha',today)
    .order('creado_en',{ascending:false}).limit(1);
  if (error||!data||!data.length) { ventas[id]++; renderPOS(); showToast('Error al deshacer','danger'); return; }
  await db.from('ventas').delete().eq('id',data[0].id);
}

// ── POS ────────────────────────────────────────────────────
function renderPOS() {
  const activos=inventario.filter(p=>p.activo);
  const grid=document.getElementById('pos-grid');
  const empty=document.getElementById('pos-empty');
  const bar=document.getElementById('pos-total-bar');
  if (!activos.length) { grid.innerHTML=''; empty.style.display='block'; bar.style.display='none'; document.getElementById('pos-subtitle').textContent='Toca un producto para vender'; return; }
  empty.style.display='none'; bar.style.display='flex';
  let total=0,count=0;
  grid.innerHTML = activos.map(p=>{
    const cnt=ventas[p.id]||0, sub=cnt*p.precio_venta;
    total+=sub; count+=cnt;
    return `
      <div class="pos-card${cnt>0?' sold':''}" onclick="addSale(event,'${p.id}')">
        <div class="pos-card-img-wrap">
          ${p.imagen_url ? imgTag(p.imagen_url) : ''}
          ${cnt>0?`<div class="pos-card-count-badge">${cnt}</div>`:''}
        </div>
        <div class="pos-card-body">
          <div class="pos-card-name">${esc(p.nombre)}</div>
          <div class="pos-card-row">
            <div class="pos-card-price">S/. ${p.precio_venta.toFixed(2)}</div>
            <div class="pos-card-btns">
              ${cnt>0?`<button class="pos-btn-undo" onclick="undoSale(event,'${p.id}')" title="Deshacer">−</button>`:''}
              <button class="pos-btn-add" onclick="addSale(event,'${p.id}')">+</button>
            </div>
          </div>
          ${cnt>0?`<div class="pos-card-subtotal">= S/. ${sub.toFixed(2)}</div>`:''}
        </div>
      </div>`;
  }).join('');
  document.getElementById('pos-total-text').textContent='S/. '+total.toFixed(2);
  document.getElementById('pos-count-text').textContent=count;
  document.getElementById('pos-subtitle').textContent=count===0?'Toca un producto para vender':`${count} venta${count!==1?'s':''} · S/. ${total.toFixed(2)}`;
  actualizarDestinoTotal();
}

function confirmNuevoDia() {
  showConfirm('Nuevo Día','Se limpiarán los contadores. Las ventas quedan guardadas en el historial. ¿Continuar?',()=>{
    archivarDiaActual();
    ventas={}; renderPOS(); renderResumen(); renderDestinos(); showToast('Nuevo día iniciado');
  });
}

// ── RESUMEN ────────────────────────────────────────────────
function getTotals() {
  let tv=0,tc=0,count=0; const rows=[];
  inventario.forEach(p=>{
    const c=ventas[p.id]||0;
    if(c>0){const sv=c*p.precio_venta,sc=c*p.precio_compra;tv+=sv;tc+=sc;count+=c;rows.push({name:p.nombre,imagen_url:p.imagen_url,qty:c,pv:p.precio_venta,sv,ganancia:sv-sc});}
  });
  return {totalVenta:tv,ganancia:tv-tc,count,avg:count>0?tv/count:0,rows};
}

function renderResumen() {
  const {totalVenta,ganancia,count,avg,rows}=getTotals();
  document.getElementById('r-total').textContent='S/. '+totalVenta.toFixed(2);
  document.getElementById('r-qty').textContent=count;
  document.getElementById('r-avg').textContent='S/. '+avg.toFixed(2);
  document.getElementById('r-note').textContent=count===0?'Sin ventas aún':`${count} unidad${count!==1?'es':''} vendida${count!==1?'s':''}`;
  document.getElementById('r-ganancia').textContent='S/. '+ganancia.toFixed(2);
  document.getElementById('ganancia-badge').style.display=count>0?'flex':'none';
  const wrap=document.getElementById('resumen-table-wrap');
  if(!rows.length){wrap.innerHTML='<div class="no-sales"><p>Sin ventas registradas hoy</p></div>';return;}
  wrap.innerHTML=`<table class="summary-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th><th>Ganancia</th></tr></thead><tbody>
    ${rows.map(r=>`<tr><td style="display:flex;align-items:center;gap:8px"><div class="thumb-wrap" style="width:32px;height:32px;border-radius:6px">${r.imagen_url?imgTag(r.imagen_url):''}</div>${esc(r.name)}</td><td class="td-num">${r.qty}</td><td class="td-num">S/. ${r.pv.toFixed(2)}</td><td class="td-num td-blue">S/. ${r.sv.toFixed(2)}</td><td class="td-num td-green">+S/. ${r.ganancia.toFixed(2)}</td></tr>`).join('')}
    <tr style="font-weight:900;background:var(--surface2)"><td>TOTAL</td><td class="td-num">${count}</td><td></td><td class="td-num td-blue">S/. ${totalVenta.toFixed(2)}</td><td class="td-num td-green">+S/. ${ganancia.toFixed(2)}</td></tr>
  </tbody></table>`;
  document.getElementById('resumen-fecha').textContent=new Date().toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'});
}

// ── DESTINOS ───────────────────────────────────────────────
async function cargarDestinos() {
  const {data,error}=await db.from('destinos').select('*').order('creado_en');
  if(error)throw error;
  destinos=data||[];
  activeDestinoId=destinos.find(d=>d.activo)?.id||destinos[0]?.id||null;
}
async function addDestino(){
  const nombre=document.getElementById('dest-nombre').value.trim();
  const meta=parseFloat(document.getElementById('dest-meta').value);
  if(!nombre)return showToast('Escribe el nombre','danger');
  if(isNaN(meta)||meta<=0)return showToast('Monto inválido','danger');
  await _pushDestino(nombre,meta);
  document.getElementById('dest-nombre').value='';document.getElementById('dest-meta').value='';
}
async function quickDestino(nombre,meta){await _pushDestino(nombre,meta);}
async function _pushDestino(nombre,meta){
  if(destinos.find(d=>d.nombre.toLowerCase()===nombre.toLowerCase()))
    return showToast('Ya existe un destino con ese nombre','danger');
  const emoji=getDestinoIcon(nombre),esFirst=destinos.length===0;
  const{data,error}=await db.from('destinos').insert({nombre,emoji,meta,activo:esFirst}).select().single();
  if(error){showToast('Error','danger');return;}
  destinos.push(data);if(esFirst)activeDestinoId=data.id;
  renderDestinos();showToast('"' + nombre + '" agregado');
}
async function setActiveDestino(id){
  if(activeDestinoId===id)return;
  await db.from('destinos').update({activo:false}).neq('id','00000000-0000-0000-0000-000000000000');
  await db.from('destinos').update({activo:true}).eq('id',id);
  destinos.forEach(d=>d.activo=d.id===id);activeDestinoId=id;renderDestinos();
}
function eliminarDestino(id){
  showConfirm('Eliminar Destino','¿Eliminar este destino?',async()=>{
    await db.from('destinos').delete().eq('id',id);
    destinos=destinos.filter(d=>d.id!==id);
    if(activeDestinoId===id)activeDestinoId=destinos[0]?.id||null;
    renderDestinos();showToast('Destino eliminado','danger');
  });
}
function actualizarDestinoTotal(){
  const{ganancia}=getTotals();
  const el=document.getElementById('destino-total');
  if(el)el.textContent='S/. '+ganancia.toFixed(2);
  const ad=destinos.find(d=>d.id===activeDestinoId);
  if(ad){const pct=Math.min(100,(ganancia/ad.meta)*100);const pf=document.getElementById('progreso-fill');const pp=document.getElementById('progreso-pct');if(pf)pf.style.width=pct+'%';if(pp)pp.textContent=pct.toFixed(0)+'%';}
}
function renderDestinos(){
  const{ganancia}=getTotals();
  document.getElementById('destino-total').textContent='S/. '+ganancia.toFixed(2);
  document.getElementById('destino-note').textContent=ganancia===0?'Sigue vendiendo':ganancia<20?'Buen comienzo':'Excelente día';
  document.getElementById('destino-count').textContent=destinos.length;
  const ad=destinos.find(d=>d.id===activeDestinoId);
  const pw=document.getElementById('progreso-wrap');
  if(ad){pw.style.display='block';const pct=Math.min(100,(ganancia/ad.meta)*100);document.getElementById('progreso-label-text').textContent=ad.emoji+' '+ad.nombre;document.getElementById('progreso-pct').textContent=pct.toFixed(0)+'%';document.getElementById('progreso-fill').style.width=pct+'%';document.getElementById('progreso-actual').textContent='S/. '+ganancia.toFixed(2)+' ganado';document.getElementById('progreso-meta').textContent='Meta: S/. '+ad.meta.toFixed(2);}else{pw.style.display='none';}
  const list=document.getElementById('destinos-list');
  if(!destinos.length){list.innerHTML='<div class="no-destinos"><div class="icon">🎯</div><p>Agrega un destino para motivarte</p></div>';return;}
  list.innerHTML=destinos.map(d=>{const pct=Math.min(100,(ganancia/d.meta)*100);const isAct=d.id===activeDestinoId;const falta=Math.max(0,d.meta-ganancia);return`<div class="destino-card${isAct?' active-destino':''}" onclick="setActiveDestino('${d.id}')">${isAct?'<span class="dc-badge">ACTIVO</span>':''}<span class="dc-icon">${d.emoji}</span><div class="dc-info"><div class="dc-nombre">${esc(d.nombre)}</div><div class="dc-meta">Meta: S/. ${d.meta.toFixed(2)} · ${falta>0?'Faltan S/. '+falta.toFixed(2):'¡Meta alcanzada! 🎉'}</div><div class="dc-mini-bar"><div class="dc-mini-fill" style="width:${pct}%"></div></div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="dc-pct">${pct.toFixed(0)}%</span><button onclick="event.stopPropagation();eliminarDestino('${d.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;color:#9ca3af;padding:2px">✕</button></div></div>`;}).join('');
}
