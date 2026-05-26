# Akrif Sweet — Panel de Administración

Dashboard interno para gestión de albaranes, clientes y productos.

## Configuración

Editar `api.js` y reemplazar `PENDIENTE_CONFIGURAR` con la URL base de n8n:

```js
const N8N_BASE = 'https://tu-instancia.n8n.cloud';
```

## Uso

Abrir `index.html` directamente en el navegador. No requiere servidor.

## Endpoints esperados (todos POST)

| Acción | Endpoint |
|---|---|
| Listar albaranes | `POST /webhook/albaranes/listar` |
| Crear albarán | `POST /webhook/albaranes/crear` |
| Listar clientes | `POST /webhook/clientes/listar` |
| Crear cliente | `POST /webhook/clientes/crear` |
| Actualizar cliente | `POST /webhook/clientes/actualizar` |
| Listar productos | `POST /webhook/productos/listar` |
| Crear producto | `POST /webhook/productos/crear` |
| Actualizar producto | `POST /webhook/productos/actualizar` |

## Stack

- HTML5 + Vanilla JS
- Tailwind CSS (CDN)
- Sin frameworks ni bundlers
