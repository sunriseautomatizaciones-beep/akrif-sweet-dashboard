// ─── ESTADO GLOBAL ────────────────────────────────────────────────
const state = { clientes: [], productos: [] };

// ─── TOAST ────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  const bg = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  t.className = `${bg} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all duration-300 translate-x-0`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.classList.add('opacity-0', 'translate-x-4'); }, 2700);
  setTimeout(() => t.remove(), 3000);
}

// ─── MODAL ────────────────────────────────────────────────────────
function openModal(html, { onClose } = {}) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  box.innerHTML = html;
  overlay.classList.remove('hidden');

  const close = () => {
    overlay.classList.add('hidden');
    box.innerHTML = '';
    if (onClose) onClose();
  };

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); }, { once: true });
  box.querySelector('.modal-close')?.addEventListener('click', close);
  box.querySelector('.modal-cancel')?.addEventListener('click', close);
  return close;
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-box').innerHTML = '';
}

// ─── SKELETON LOADER ──────────────────────────────────────────────
function skeletonRows(cols, rows = 3) {
  return Array.from({ length: rows }, () =>
    `<tr>${Array.from({ length: cols }, () =>
      `<td class="px-4 py-3"><div class="h-4 bg-gray-200 rounded animate-pulse"></div></td>`
    ).join('')}</tr>`
  ).join('');
}

// ─── UTILIDADES ───────────────────────────────────────────────────
function formatEuros(n) {
  return Number(n).toFixed(2).replace('.', ',') + ' €';
}
function formatFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-ES');
}
function setLoading(btn, loading) {
  if (loading) {
    btn._originalHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Enviando...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._originalHTML || btn.innerHTML;
  }
}
function emptyRow(cols, msg = 'No hay registros todavía') {
  return `<tr><td colspan="${cols}" class="text-center py-10 text-gray-400 text-sm">${msg}</td></tr>`;
}

// ─── NAVEGACIÓN ───────────────────────────────────────────────────
function setActiveNav(view) {
  document.querySelectorAll('[data-view]').forEach(el => {
    const active = el.dataset.view === view;
    el.classList.toggle('bg-amber-400', active);
    el.classList.toggle('text-gray-900', active);
    el.classList.toggle('font-bold', active);
    el.classList.toggle('text-slate-200', !active);
  });
  const titles = { albaranes: '📄 Albaranes', clientes: '👥 Clientes', productos: '📦 Productos' };
  document.getElementById('view-title').textContent = titles[view] || '';
}

function navigate(view) {
  setActiveNav(view);
  const vc = document.getElementById('view-container');
  if (view === 'albaranes') renderAlbaranes(vc);
  else if (view === 'clientes') renderClientes(vc);
  else if (view === 'productos') renderProductos(vc);
}

// ══════════════════════════════════════════════════════════════════
// VISTA ALBARANES
// ══════════════════════════════════════════════════════════════════
async function renderAlbaranes(vc) {
  vc.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <input id="albaran-search" type="text" placeholder="Buscar por cliente o código..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-amber-400" />
      <button id="btn-nuevo-albaran"
        class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
        + Nuevo albarán
      </button>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left">Código</th>
            <th class="px-4 py-3 text-left">Lote</th>
            <th class="px-4 py-3 text-left">Cód. Cliente</th>
            <th class="px-4 py-3 text-left">Cliente</th>
            <th class="px-4 py-3 text-left">Observaciones</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-center">Email</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-left">Fecha</th>
            <th class="px-4 py-3 text-center">PDF</th>
          </tr>
        </thead>
        <tbody id="tbody-albaranes">${skeletonRows(10)}</tbody>
      </table>
    </div>`;

  document.getElementById('btn-nuevo-albaran').addEventListener('click', () => modalNuevoAlbaran());

  let allData = [];
  try {
    allData = await API.call(API.EP.listarAlbaranes);
    renderAlbaranesRows(allData);
  } catch { renderAlbaranesRows([]); }

  document.getElementById('albaran-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = allData.filter(r =>
      (r.nombre_cliente || '').toLowerCase().includes(q) ||
      (r.numero_albaran || '').toLowerCase().includes(q)
    );
    renderAlbaranesRows(filtered);
  });
}

function renderAlbaranesRows(data) {
  const tbody = document.getElementById('tbody-albaranes');
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = emptyRow(10); return; }
  const estadoBadge = { borrador: 'bg-gray-100 text-gray-600', emitido: 'bg-green-100 text-green-700', cancelado: 'bg-red-100 text-red-700' };
  tbody.innerHTML = data.map(r => `
    <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td class="px-4 py-3 font-mono text-xs font-medium text-slate-700">${r.numero_albaran || '—'}</td>
      <td class="px-4 py-3 text-slate-600">${r.lote || '—'}</td>
      <td class="px-4 py-3 font-mono text-xs text-slate-500">${r.id_cliente || '—'}</td>
      <td class="px-4 py-3 font-medium text-slate-800">${r.nombre_cliente || '—'}</td>
      <td class="px-4 py-3 text-slate-500 max-w-[160px] truncate" title="${r.observaciones || ''}">${r.observaciones || '—'}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded-full text-xs font-semibold ${estadoBadge[r.estado] || 'bg-gray-100 text-gray-600'}">
          ${r.estado || '—'}
        </span>
      </td>
      <td class="px-4 py-3 text-center text-base">${r.email_enviado ? '✅' : '⬜'}</td>
      <td class="px-4 py-3 text-right font-medium tabular-nums">${formatEuros(r.total_euros || 0)}</td>
      <td class="px-4 py-3 text-slate-600">${formatFecha(r.fecha)}</td>
      <td class="px-4 py-3 text-center">
        ${r.pdf_url
          ? `<a href="${r.pdf_url}" target="_blank" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-colors">Ver PDF</a>`
          : `<button disabled class="text-xs bg-gray-100 text-gray-400 px-3 py-1 rounded-lg cursor-not-allowed">Ver PDF</button>`
        }
      </td>
    </tr>`).join('');
}

// ─── MODAL NUEVO ALBARÁN ──────────────────────────────────────────
async function modalNuevoAlbaran() {
  // Cargar clientes y productos si no están en cache
  if (!state.clientes.length) {
    try { state.clientes = await API.call(API.EP.listarClientes); } catch { state.clientes = []; }
  }
  if (!state.productos.length) {
    try { state.productos = await API.call(API.EP.listarProductos); } catch { state.productos = []; }
  }

  const clienteOptions = state.clientes.map(c =>
    `<option value="${c.id_cliente}">${c.id_cliente} — ${c.nombre}${c.empresa ? ' (' + c.empresa + ')' : ''}</option>`
  ).join('');

  const productoOptions = state.productos.map(p =>
    `<option value="${p.id_producto}" data-precio="${p.precio_unitario}">${p.nombre} (${formatEuros(p.precio_unitario)})</option>`
  ).join('');

  openModal(`
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-bold text-slate-800">Nuevo albarán</h2>
      <button class="modal-close text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
    </div>

    <div class="mb-4">
      <label class="block text-xs font-semibold text-slate-600 mb-1">Cliente <span class="text-red-500">*</span></label>
      <select id="al-cliente" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
        <option value="">Selecciona un cliente...</option>
        ${clienteOptions}
      </select>
    </div>

    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-xs font-semibold text-slate-600">Productos</label>
        <button id="btn-add-producto" class="text-xs text-amber-600 hover:text-amber-700 font-semibold">+ Añadir producto</button>
      </div>
      <div class="border border-gray-200 rounded-lg overflow-hidden">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-3 py-2 text-left">Producto</th>
              <th class="px-3 py-2 text-right w-20">Cantidad</th>
              <th class="px-3 py-2 text-right w-24">Precio/u</th>
              <th class="px-3 py-2 text-right w-24">Subtotal</th>
              <th class="px-3 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody id="productos-table-body"></tbody>
        </table>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 mb-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Lote</label>
        <input id="al-lote" type="text" placeholder="Opcional"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
        <input id="al-obs" type="text" placeholder="Opcional"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
    </div>

    <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
      <span class="text-sm font-semibold text-slate-700">Total</span>
      <span id="al-total" class="text-lg font-bold text-amber-700">0,00 €</span>
    </div>

    <div class="flex gap-3 justify-end">
      <button class="modal-cancel px-4 py-2 text-sm text-slate-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
      <button id="btn-submit-albaran" class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">Crear albarán</button>
    </div>
  `);

  // Añadir primera fila de producto
  addProductoRow(productoOptions);

  document.getElementById('btn-add-producto').addEventListener('click', () => addProductoRow(productoOptions));

  document.getElementById('btn-submit-albaran').addEventListener('click', async () => {
    const idCliente = document.getElementById('al-cliente').value;
    if (!idCliente) { showToast('Selecciona un cliente', 'error'); return; }

    const filas = document.querySelectorAll('.producto-row');
    const productos = [];
    let valid = true;
    filas.forEach(fila => {
      const sel = fila.querySelector('.prod-select');
      const cant = parseFloat(fila.querySelector('.prod-cant').value);
      const precio = parseFloat(fila.querySelector('.prod-precio').value);
      if (sel.value && cant > 0) {
        productos.push({ id_producto: sel.value, cantidad: cant, precio_unitario: precio });
      } else if (sel.value) { valid = false; }
    });

    if (!productos.length) { showToast('Añade al menos un producto', 'error'); return; }
    if (!valid) { showToast('Verifica las cantidades de los productos', 'error'); return; }

    const total = productos.reduce((s, p) => s + p.cantidad * p.precio_unitario, 0);
    const btn = document.getElementById('btn-submit-albaran');
    setLoading(btn, true);

    try {
      const res = await API.call(API.EP.crearAlbaran, {
        id_cliente: idCliente,
        lote: document.getElementById('al-lote').value || '',
        observaciones: document.getElementById('al-obs').value || '',
        productos,
        total_euros: Math.round(total * 100) / 100,
      });
      closeModal();
      showToast(`Albarán ${res.numero_albaran || ''} creado`, 'success');
      navigate('albaranes');
    } catch { setLoading(btn, false); }
  });
}

function addProductoRow(productoOptions) {
  const tbody = document.getElementById('productos-table-body');
  const tr = document.createElement('tr');
  tr.className = 'producto-row border-t border-gray-100';
  tr.innerHTML = `
    <td class="px-2 py-2">
      <select class="prod-select w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400">
        <option value="">Seleccionar...</option>
        ${productoOptions}
      </select>
    </td>
    <td class="px-2 py-2">
      <input type="number" min="1" value="1" class="prod-cant w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-400" />
    </td>
    <td class="px-2 py-2">
      <input type="number" step="0.01" readonly class="prod-precio w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-right text-slate-500 cursor-default" value="0.00" />
    </td>
    <td class="px-2 py-2">
      <input type="number" step="0.01" readonly class="prod-subtotal w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-right font-medium cursor-default" value="0.00" />
    </td>
    <td class="px-2 py-2 text-center">
      <button class="prod-remove text-red-400 hover:text-red-600 text-base leading-none">&times;</button>
    </td>`;

  tbody.appendChild(tr);

  const sel = tr.querySelector('.prod-select');
  const cant = tr.querySelector('.prod-cant');
  const precio = tr.querySelector('.prod-precio');
  const subtotal = tr.querySelector('.prod-subtotal');

  const recalc = () => {
    const p = parseFloat(precio.value) || 0;
    const c = parseFloat(cant.value) || 0;
    subtotal.value = (p * c).toFixed(2);
    updateTotal();
  };

  sel.addEventListener('change', () => {
    const opt = sel.options[sel.selectedIndex];
    precio.value = opt.dataset.precio || '0.00';
    recalc();
  });
  cant.addEventListener('input', recalc);
  tr.querySelector('.prod-remove').addEventListener('click', () => { tr.remove(); updateTotal(); });
}

function updateTotal() {
  let total = 0;
  document.querySelectorAll('.prod-subtotal').forEach(el => { total += parseFloat(el.value) || 0; });
  const el = document.getElementById('al-total');
  if (el) el.textContent = formatEuros(total);
}

// ══════════════════════════════════════════════════════════════════
// VISTA CLIENTES
// ══════════════════════════════════════════════════════════════════
async function renderClientes(vc) {
  vc.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-slate-500">Gestión de clientes</span>
      <button id="btn-nuevo-cliente" class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
        + Nuevo cliente
      </button>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Empresa</th>
            <th class="px-4 py-3 text-left">Teléfono</th>
            <th class="px-4 py-3 text-left">Email</th>
            <th class="px-4 py-3 text-center">Descuento</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-clientes">${skeletonRows(7)}</tbody>
      </table>
    </div>`;

  document.getElementById('btn-nuevo-cliente').addEventListener('click', () => modalNuevoCliente());

  try {
    state.clientes = await API.call(API.EP.listarClientes);
    renderClientesRows(state.clientes);
  } catch { renderClientesRows([]); }
}

function renderClientesRows(data) {
  const tbody = document.getElementById('tbody-clientes');
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = emptyRow(7); return; }
  tbody.innerHTML = data.map(c => `
    <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
      <td class="px-4 py-3 font-mono text-xs text-slate-500">${c.id_cliente || '—'}</td>
      <td class="px-4 py-3 font-medium text-slate-800">${c.nombre || '—'}</td>
      <td class="px-4 py-3 text-slate-600">${c.empresa || '—'}</td>
      <td class="px-4 py-3 text-slate-600">${c.telefono || '—'}</td>
      <td class="px-4 py-3 text-slate-600">${c.email || '—'}</td>
      <td class="px-4 py-3 text-center">
        ${c.descuento > 0
          ? `<span class="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">${c.descuento}%</span>`
          : '<span class="text-slate-400">—</span>'}
      </td>
      <td class="px-4 py-3 text-center">
        <button class="btn-editar-cliente text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-colors"
          data-id="${c.id_cliente}">Editar</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('.btn-editar-cliente').forEach(btn => {
    btn.addEventListener('click', () => {
      const cliente = state.clientes.find(c => c.id_cliente === btn.dataset.id);
      if (cliente) modalEditarCliente(cliente);
    });
  });
}

function clienteFormFields(c = {}) {
  return `
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre <span class="text-red-500">*</span></label>
        <input id="cl-nombre" value="${c.nombre || ''}" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
        <input id="cl-empresa" value="${c.empresa || ''}" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Teléfono <span class="text-red-500">*</span></label>
        <input id="cl-telefono" value="${c.telefono || ''}" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Email</label>
        <input id="cl-email" value="${c.email || ''}" type="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div class="col-span-2">
        <label class="block text-xs font-semibold text-slate-600 mb-1">Dirección</label>
        <input id="cl-direccion" value="${c.direccion || ''}" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Descuento (%)</label>
        <input id="cl-descuento" value="${c.descuento || 0}" type="number" min="0" max="100" step="0.5" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
    </div>`;
}

function getClienteFormData() {
  return {
    nombre:    document.getElementById('cl-nombre').value.trim(),
    empresa:   document.getElementById('cl-empresa').value.trim(),
    telefono:  document.getElementById('cl-telefono').value.trim(),
    email:     document.getElementById('cl-email').value.trim(),
    direccion: document.getElementById('cl-direccion').value.trim(),
    descuento: parseFloat(document.getElementById('cl-descuento').value) || 0,
  };
}

function modalEditarCliente(c) {
  openModal(`
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-bold text-slate-800">Editar cliente</h2>
      <button class="modal-close text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
    </div>
    <div class="mb-1 text-xs text-slate-400 font-mono mb-4">ID: ${c.id_cliente}</div>
    ${clienteFormFields(c)}
    <div class="flex gap-3 justify-end mt-5">
      <button class="modal-cancel px-4 py-2 text-sm text-slate-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
      <button id="btn-guardar-cliente" class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">Guardar cambios</button>
    </div>`);

  document.getElementById('btn-guardar-cliente').addEventListener('click', async () => {
    const data = getClienteFormData();
    if (!data.nombre || !data.telefono) { showToast('Nombre y teléfono son obligatorios', 'error'); return; }
    const btn = document.getElementById('btn-guardar-cliente');
    setLoading(btn, true);
    try {
      await API.call(API.EP.actualizarCliente, { id_cliente: c.id_cliente, ...data });
      closeModal();
      showToast('Cliente actualizado', 'success');
      state.clientes = [];
      navigate('clientes');
    } catch { setLoading(btn, false); }
  });
}

function modalNuevoCliente() {
  openModal(`
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-bold text-slate-800">Nuevo cliente</h2>
      <button class="modal-close text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
    </div>
    ${clienteFormFields()}
    <div class="flex gap-3 justify-end mt-5">
      <button class="modal-cancel px-4 py-2 text-sm text-slate-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
      <button id="btn-crear-cliente" class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">Crear cliente</button>
    </div>`);

  document.getElementById('btn-crear-cliente').addEventListener('click', async () => {
    const data = getClienteFormData();
    if (!data.nombre || !data.telefono) { showToast('Nombre y teléfono son obligatorios', 'error'); return; }
    const btn = document.getElementById('btn-crear-cliente');
    setLoading(btn, true);
    try {
      const res = await API.call(API.EP.crearCliente, data);
      closeModal();
      showToast(`Cliente ${res.id_cliente || ''} creado`, 'success');
      state.clientes = [];
      navigate('clientes');
    } catch { setLoading(btn, false); }
  });
}

// ══════════════════════════════════════════════════════════════════
// VISTA PRODUCTOS
// ══════════════════════════════════════════════════════════════════
async function renderProductos(vc) {
  vc.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-slate-500">Haz clic en el precio para editarlo directamente</span>
      <button id="btn-nuevo-producto" class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
        + Nuevo producto
      </button>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-right">Precio</th>
            <th class="px-4 py-3 text-left">Unidad</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbody-productos">${skeletonRows(5)}</tbody>
      </table>
    </div>`;

  document.getElementById('btn-nuevo-producto').addEventListener('click', () => modalNuevoProducto());

  try {
    state.productos = await API.call(API.EP.listarProductos);
    renderProductosRows(state.productos);
  } catch { renderProductosRows([]); }
}

function renderProductosRows(data) {
  const tbody = document.getElementById('tbody-productos');
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = emptyRow(5); return; }
  tbody.innerHTML = data.map(p => `
    <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors" data-id="${p.id_producto}">
      <td class="px-4 py-3 font-mono text-xs text-slate-500">${p.id_producto || '—'}</td>
      <td class="px-4 py-3 font-medium text-slate-800">${p.nombre || '—'}</td>
      <td class="px-4 py-3 text-right">
        <span class="precio-display tabular-nums font-medium text-slate-700 cursor-pointer hover:bg-amber-50 hover:text-amber-700 px-2 py-1 rounded transition-colors" title="Clic para editar">
          ${formatEuros(p.precio_unitario)}
        </span>
        <input type="number" step="0.01" min="0" class="precio-input hidden w-24 border border-amber-400 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          value="${p.precio_unitario}" data-original="${p.precio_unitario}" />
      </td>
      <td class="px-4 py-3 text-slate-600">${p.unidad || '—'}</td>
      <td class="px-4 py-3 text-center">
        <button class="btn-editar-precio text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-colors"
          data-id="${p.id_producto}">Editar precio</button>
      </td>
    </tr>`).join('');

  // Inline price edit — click on display
  tbody.querySelectorAll('.precio-display').forEach(span => {
    span.addEventListener('click', () => activarPrecioInline(span.closest('tr')));
  });
  tbody.querySelectorAll('.btn-editar-precio').forEach(btn => {
    btn.addEventListener('click', () => activarPrecioInline(btn.closest('tr')));
  });
}

function activarPrecioInline(tr) {
  const display = tr.querySelector('.precio-display');
  const input = tr.querySelector('.precio-input');
  display.classList.add('hidden');
  input.classList.remove('hidden');
  input.focus();
  input.select();

  const guardar = async () => {
    const nuevoPrecio = parseFloat(input.value);
    const original = parseFloat(input.dataset.original);
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      input.classList.add('hidden');
      display.classList.remove('hidden');
      return;
    }
    if (nuevoPrecio === original) {
      input.classList.add('hidden');
      display.classList.remove('hidden');
      return;
    }
    input.disabled = true;
    try {
      await API.call(API.EP.actualizarProducto, { id_producto: tr.dataset.id, precio_unitario: nuevoPrecio });
      display.textContent = formatEuros(nuevoPrecio);
      input.dataset.original = nuevoPrecio;
      state.productos = [];
      showToast('Precio actualizado', 'success');
    } catch {
      input.value = original;
      showToast('No se pudo actualizar el precio', 'error');
    } finally {
      input.disabled = false;
      input.classList.add('hidden');
      display.classList.remove('hidden');
    }
  };

  input.addEventListener('blur', guardar, { once: true });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') {
      input.value = input.dataset.original;
      input.classList.add('hidden');
      display.classList.remove('hidden');
    }
  });
}

function modalNuevoProducto() {
  openModal(`
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-lg font-bold text-slate-800">Nuevo producto</h2>
      <button class="modal-close text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="col-span-2">
        <label class="block text-xs font-semibold text-slate-600 mb-1">Nombre <span class="text-red-500">*</span></label>
        <input id="pr-nombre" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Precio (€) <span class="text-red-500">*</span></label>
        <input id="pr-precio" type="number" step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1">Unidad <span class="text-red-500">*</span></label>
        <select id="pr-unidad" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          <option value="">Seleccionar...</option>
          <option value="kg">kg</option>
          <option value="caja">caja</option>
          <option value="unidad">unidad</option>
          <option value="otro">otro</option>
        </select>
      </div>
    </div>
    <div class="flex gap-3 justify-end">
      <button class="modal-cancel px-4 py-2 text-sm text-slate-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
      <button id="btn-crear-producto" class="bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors">Crear producto</button>
    </div>`);

  document.getElementById('btn-crear-producto').addEventListener('click', async () => {
    const nombre = document.getElementById('pr-nombre').value.trim();
    const precio = parseFloat(document.getElementById('pr-precio').value);
    const unidad = document.getElementById('pr-unidad').value;
    if (!nombre || isNaN(precio) || !unidad) { showToast('Completa todos los campos obligatorios', 'error'); return; }
    const btn = document.getElementById('btn-crear-producto');
    setLoading(btn, true);
    try {
      await API.call(API.EP.crearProducto, { nombre, precio_unitario: precio, unidad });
      closeModal();
      showToast('Producto creado', 'success');
      state.productos = [];
      navigate('productos');
    } catch { setLoading(btn, false); }
  });
}

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.view));
  });
  navigate('albaranes');
});
