// ── CATÁLOGO ───────────────────────────────────────────────
async function cargarCatalogo() {
  const { data, error } = await db.from('catalogo').select('*').order('nombre');
  if (error) throw error;
  catalogo = {};
  (data||[]).forEach(item => {
    if (!catalogo[item.categoria]) catalogo[item.categoria] = [];
    catalogo[item.categoria].push(item);
  });
}

// ── INVENTARIO ─────────────────────────────────────────────
async function cargarInventario() {
  const { data, error } = await db.from('productos_usuario').select('*').order('creado_en');
  if (error) throw error;
  inventario = data || [];
}

async function crearProductoManual() {
  const nombre = document.getElementById('m-nombre').value.trim();
  const compra = parseFloat(document.getElementById('m-compra').value);
  const venta  = parseFloat(document.getElementById('m-venta').value);
  if (!nombre)                 return showToast('⚠️ Escribe un nombre','danger');
  if (isNaN(compra)||compra<0) return showToast('⚠️ Precio compra inválido','danger');
  if (isNaN(venta)||venta<=0)  return showToast('⚠️ Precio venta inválido','danger');
  if (venta < compra)          return showToast('⚠️ Venta no puede ser menor que compra','danger');
  const { data, error } = await db.from('productos_usuario')
    .insert({ nombre, precio_compra:compra, precio_venta:venta, catalogo_id:null, activo:true })
    .select().single();
  if (error) { showToast('❌ Error al guardar','danger'); console.error(error); return; }
  inventario.push(data);
  ['m-nombre','m-compra','m-venta'].forEach(id=>document.getElementById(id).value='');
  renderInventario(); renderPOS(); showToast('✅ Producto agregado');
}

async function eliminarProducto(id) {
  showConfirm('Eliminar Producto','¿Eliminar este producto de tu inventario?', async ()=>{
    await db.from('productos_usuario').delete().eq('id',id);
    inventario = inventario.filter(p=>p.id!==id);
    delete ventas[id];
    renderInventario(); renderPOS(); renderResumen();
    showToast('🗑️ Eliminado','danger');
  });
}

async function toggleAgotado(id) {
  const p = inventario.find(x=>x.id===id);
  if (!p) return;
  const nuevoActivo = !p.activo;
  await db.from('productos_usuario').update({activo:nuevoActivo}).eq('id',id);
  p.activo = nuevoActivo;
  renderInventario(); renderPOS();
  showToast(nuevoActivo ? '✅ Reactivado' : '⚠️ Marcado agotado');
}

function renderInventario() {
  const list = document.getElementById('inv-list');
  document.getElementById('inv-count').textContent = inventario.length;
  if (inventario.length === 0) {
    list.innerHTML = '<div class="inv-empty">📭 Tu inventario está vacío<br><small>Agrega productos desde las categorías</small></div>';
    return;
  }
  list.innerHTML = inventario.map(p => {
    const g = (p.precio_venta - p.precio_compra).toFixed(2);
    const imgSrc = p.imagen_url || '';
    return `
      <div class="inv-item${p.activo?'':' agotado'}">
        <div class="thumb-wrap">${imgSrc ? imgTag(imgSrc) : ''}</div>
        <div class="ii-info">
          <div class="ii-name">${esc(p.nombre)}${p.activo?'':' <span style="font-size:10px;color:var(--danger);font-weight:700">AGOTADO</span>'}</div>
          <div class="ii-prices">
            <span class="price-tag price-venta">Venta S/. ${p.precio_venta.toFixed(2)}</span>
            <span class="price-tag price-compra">Compra S/. ${p.precio_compra.toFixed(2)}</span>
            <span class="price-tag price-ganancia">+S/. ${g}</span>
          </div>
        </div>
        <div class="ii-actions">
          <button class="btn-icon" onclick="toggleAgotado('${p.id}')" style="background:var(--warning-light);color:var(--warning)">${p.activo?'⚠️':'✅'}</button>
          <button class="btn-icon" onclick="abrirEditar('${p.id}')" style="background:var(--primary-light);color:var(--primary)">✏️</button>
          <button class="btn-icon" onclick="eliminarProducto('${p.id}')" style="background:var(--danger-light);color:var(--danger)">✕</button>
        </div>
      </div>`;
  }).join('');
  actualizarContadoresCat();
}

function abrirEditar(id) {
  const p = inventario.find(x=>x.id===id);
  if (!p) return;
  pendingEditId = id;
  document.getElementById('modal-editar-sub').textContent = p.nombre;
  document.getElementById('edit-compra').value = p.precio_compra;
  document.getElementById('edit-venta').value  = p.precio_venta;
  openModal('modal-editar');
}

async function confirmarEditar() {
  const compra = parseFloat(document.getElementById('edit-compra').value);
  const venta  = parseFloat(document.getElementById('edit-venta').value);
  if (isNaN(compra)||compra<0) return showToast('⚠️ Precio compra inválido','danger');
  if (isNaN(venta)||venta<=0)  return showToast('⚠️ Precio venta inválido','danger');
  await db.from('productos_usuario').update({precio_compra:compra, precio_venta:venta}).eq('id',pendingEditId);
  const p = inventario.find(x=>x.id===pendingEditId);
  p.precio_compra=compra; p.precio_venta=venta;
  closeModal('modal-editar'); renderInventario(); renderPOS();
  showToast('✅ Precios actualizados');
}

// ── CATÁLOGO VISTA ─────────────────────────────────────────
let catActual = null;
const CAT_LABELS = { dulces:'Dulces', ropa:'Ropa', comida:'Comida', accesorios:'Accesorios' };

function actualizarContadoresCat() {
  ['dulces','ropa','comida','accesorios'].forEach(cat => {
    const enCat = inventario.filter(p => p.categoria === cat).length;
    const el = document.getElementById('cc-'+cat);
    if (el) el.textContent = enCat > 0 ? `${enCat} producto${enCat!==1?'s':''}` : 'Sin productos';
  });
}

function openCategoria(cat) {
  catActual = cat;
  document.getElementById('cat-view-title').textContent = CAT_LABELS[cat];
  document.getElementById('prod-main').classList.add('hidden');
  document.getElementById('prod-cat-view').classList.add('active');
  document.getElementById('prod-screen-title').textContent = CAT_LABELS[cat];
  document.getElementById('prod-screen-sub').textContent = 'Tus productos en esta categoría';
  renderCatalogoGrid(cat);
}

function cerrarCategoria() {
  catActual = null;
  document.getElementById('prod-main').classList.remove('hidden');
  document.getElementById('prod-cat-view').classList.remove('active');
  document.getElementById('prod-screen-title').textContent = 'Gestionar Productos';
  document.getElementById('prod-screen-sub').textContent = 'Elige una categoría';
  actualizarContadoresCat();
}

function renderCatalogoGrid(cat) {
  const grid = document.getElementById('catalogo-grid');

  // Productos del usuario en esta categoría
  const misProductos = inventario.filter(p => p.categoria === cat);

  const productosHTML = misProductos.map(p => {
    const imgUrl = p.imagen_url || '';
    return `
      <div class="catalogo-item ya-agregado">
        <div class="catalogo-item-img">
          ${imgUrl ? imgTag(imgUrl) : ''}
          <div class="ci-overlay-btns">
            <button class="ci-overlay-btn" onclick="event.stopPropagation();abrirEditarNombreCatalogo('${p.id}')" title="Editar nombre">✏️</button>
            <button class="ci-overlay-btn" onclick="event.stopPropagation();triggerImagenCatalogo('${p.id}')" title="Cambiar imagen">📷</button>
          </div>
        </div>
        <div class="catalogo-item-body">
          <div class="ci-name">${esc(p.nombre)}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px;font-family:var(--mono)">
            S/. ${p.precio_venta.toFixed(2)}
          </div>
        </div>
      </div>`;
  }).join('');

  // Botón nuevo producto — siempre al final, una sola vez
  const nuevoHTML = `
    <div class="catalogo-item catalogo-nuevo" onclick="abrirNuevoCatalogo()">
      <div class="catalogo-item-img ci-nuevo-img">
        <span style="font-size:36px;color:var(--primary)">＋</span>
      </div>
      <div class="catalogo-item-body">
        <div class="ci-name" style="color:var(--primary);font-weight:800">Nuevo producto</div>
      </div>
    </div>`;

  grid.innerHTML = productosHTML + nuevoHTML;
}

// ── EDITAR NOMBRE ──────────────────────────────────────────
let editingCatalogoId = null;
let pendingNuevoCatFile = null;

function abrirEditarNombreCatalogo(invId) {
  const p = inventario.find(x=>x.id===invId);
  if (!p) return;
  editingCatalogoId = invId;
  document.getElementById('edit-cat-nombre').value = p.nombre;
  openModal('modal-editar-catalogo');
}

async function confirmarEditarNombreCatalogo() {
  const nombre = document.getElementById('edit-cat-nombre').value.trim();
  if (!nombre) return showToast('⚠️ Escribe un nombre','danger');
  const { error } = await db.from('productos_usuario').update({ nombre }).eq('id', editingCatalogoId);
  if (error) { showToast('❌ Error al guardar','danger'); return; }
  const p = inventario.find(x=>x.id===editingCatalogoId);
  if (p) p.nombre = nombre;
  closeModal('modal-editar-catalogo');
  renderCatalogoGrid(catActual);
  renderInventario();
  showToast('✅ Nombre actualizado');
}

// ── IMAGEN PRODUCTO ────────────────────────────────────────
function triggerImagenCatalogo(invId) {
  editingCatalogoId = invId;
  const input = document.getElementById('file-img-catalogo');
  input.value = '';
  input.click();
}

async function handleImagenCatalogo(input) {
  const file = input.files[0];
  if (!file || !editingCatalogoId) return;
  showToast('⏳ Subiendo imagen...');
  let imageUrl;
  try {
    imageUrl = await uploadImageToStorage(file);
  } catch(e) {
    showToast('❌ Error al subir imagen','danger');
    console.error(e);
    return;
  }
  const { error } = await db.from('productos_usuario')
    .update({ imagen_url: imageUrl }).eq('id', editingCatalogoId);
  if (error) { showToast('❌ Error al guardar imagen','danger'); return; }
  const p = inventario.find(x=>x.id===editingCatalogoId);
  if (p) p.imagen_url = imageUrl;
  renderCatalogoGrid(catActual);
  renderInventario();
  renderPOS();
  showToast('✅ Imagen actualizada');
  input.value = '';
}

// ── NUEVO PRODUCTO EN CATEGORÍA ────────────────────────────
function abrirNuevoCatalogo() {
  document.getElementById('nuevo-cat-nombre').value  = '';
  document.getElementById('nuevo-cat-compra').value  = '';
  document.getElementById('nuevo-cat-venta').value   = '';
  const prev = document.getElementById('nuevo-cat-preview-img');
  prev.src = ''; prev.style.display = 'none';
  pendingNuevoCatFile = null;
  document.getElementById('file-nuevo-cat').value = '';
  openModal('modal-nuevo-catalogo');
}

function previewNuevoCatImagen(input) {
  const file = input.files[0];
  if (!file) return;
  pendingNuevoCatFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('nuevo-cat-preview-img');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function confirmarNuevoCatalogo() {
  const nombre = document.getElementById('nuevo-cat-nombre').value.trim();
  const compra = parseFloat(document.getElementById('nuevo-cat-compra').value);
  const venta  = parseFloat(document.getElementById('nuevo-cat-venta').value);
  if (!nombre)                 return showToast('⚠️ Escribe un nombre','danger');
  if (isNaN(compra)||compra<0) return showToast('⚠️ Precio compra inválido','danger');
  if (isNaN(venta)||venta<=0)  return showToast('⚠️ Precio venta inválido','danger');

  let imagen_url = null;
  if (pendingNuevoCatFile) {
    showToast('⏳ Subiendo imagen...');
    try {
      imagen_url = await uploadImageToStorage(pendingNuevoCatFile);
    } catch(e) {
      showToast('❌ Error al subir imagen','danger');
      console.error(e);
      return;
    }
  }

  const { data, error } = await db.from('productos_usuario').insert({
    nombre,
    imagen_url,
    precio_compra: compra,
    precio_venta:  venta,
    catalogo_id:   null,
    categoria:     catActual,
    activo:        true
  }).select().single();

  if (error) { showToast('❌ Error al crear producto','danger'); console.error(error); return; }

  inventario.push(data);
  closeModal('modal-nuevo-catalogo');
  renderCatalogoGrid(catActual);
  renderInventario();
  renderPOS();
  showToast(`✅ "${nombre}" creado y listo para vender`);
  pendingNuevoCatFile = null;
}