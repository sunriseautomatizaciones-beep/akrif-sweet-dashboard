// ─── CONFIGURACIÓN ───────────────────────────────────────────────
const N8N_BASE = 'PENDIENTE_CONFIGURAR';

const ENDPOINTS = {
  listarAlbaranes:    N8N_BASE + '/webhook/albaranes/listar',
  crearAlbaran:       N8N_BASE + '/webhook/albaranes/crear',
  listarClientes:     N8N_BASE + '/webhook/clientes/listar',
  crearCliente:       N8N_BASE + '/webhook/clientes/crear',
  actualizarCliente:  N8N_BASE + '/webhook/clientes/actualizar',
  listarProductos:    N8N_BASE + '/webhook/productos/listar',
  crearProducto:      N8N_BASE + '/webhook/productos/crear',
  actualizarProducto: N8N_BASE + '/webhook/productos/actualizar',
};

// ─── FETCH WRAPPER ────────────────────────────────────────────────
async function apiCall(endpoint, body = {}) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    showToast('Error de conexión. Inténtalo de nuevo.', 'error');
    throw err;
  }
}

window.API = { call: apiCall, EP: ENDPOINTS };
