# Respect Intern - Backend

Backend API para la plataforma interna de Respect.

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar servidor:
```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001` y ejecutará automáticamente el seed para poblar la base de datos simulada.

**Nota:** Este proyecto usa una base de datos simulada en memoria. Los datos se reinician cada vez que se reinicia el servidor. No se requiere configuración de PostgreSQL ni variables de entorno.

## Endpoints

- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Verificar token

- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `PUT /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

- `GET /api/events` - Listar eventos
- `POST /api/events` - Crear evento (admin)
- `PUT /api/events/:id` - Actualizar evento (admin)
- `DELETE /api/events/:id` - Eliminar evento (admin)
- `POST /api/events/:id/attributes` - Agregar atributo (admin)
- `POST /api/events/:id/providers` - Agregar proveedor (admin)

- `GET /api/providers` - Listar proveedores
- `POST /api/providers` - Crear proveedor (admin)
- `PUT /api/providers/:id` - Actualizar proveedor (admin)
- `DELETE /api/providers/:id` - Eliminar proveedor (admin)

- `GET /api/permissions/user/:userId` - Permisos de usuario
- `POST /api/permissions` - Crear/actualizar permiso (admin)

- `GET /api/event-data/attribute/:attributeId` - Datos de atributo
- `POST /api/event-data` - Crear dato (con imagen opcional)
- `PUT /api/event-data/:id` - Actualizar dato
- `DELETE /api/event-data/:id` - Eliminar dato

