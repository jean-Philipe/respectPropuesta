# Respect Intern

Plataforma interna para la gestión de eventos y cálculo de huella de carbono de la empresa Respect.

## 🚀 Deploy en Netlify

Este proyecto está configurado para deployarse completamente en Netlify como un prototipo. Ver [DEPLOY.md](./DEPLOY.md) para instrucciones detalladas.

**Configuración rápida:**
1. Conecta tu repositorio a Netlify
2. Netlify detectará automáticamente la configuración desde `netlify.toml`
3. El deploy se realizará automáticamente

**Nota**: La base de datos es en memoria y se reinicia entre invocaciones (solo para prototipos).

## 🚀 Características

- **Gestión de Eventos**: Crea eventos con información flexible y dinámica
- **Atributos Dinámicos**: Define qué datos recopilar para cada evento (generadores, camiones, energía, etc.)
- **Sistema de Permisos**: Asigna permisos granulares a empleados para ingresar/modificar datos específicos
- **Proveedores**: Gestiona proveedores con campos dinámicos y asócialos a eventos
- **Datos con Imágenes**: Permite subir imágenes junto con los datos ingresados
- **Roles de Usuario**: Administradores y empleados con diferentes niveles de acceso

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

### Backend

1. Navega al directorio del backend:
```bash
cd backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor:
```bash
npm run dev
```

El backend estará disponible en `http://localhost:3001`

**Nota:** Este proyecto usa una base de datos simulada en memoria. Los datos se reinician cada vez que se reinicia el servidor. El seed se ejecuta automáticamente al iniciar el servidor.

### Frontend

1. Navega al directorio del frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.local.example .env.local
```

Edita `.env.local` y configura:
- `NEXT_PUBLIC_API_URL`: URL del backend (default: http://localhost:3001)

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 👤 Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales:

**Administrador:**
- Email: `admin@respect.com`
- Contraseña: `admin123`

**Empleados:**
- Email: `maria@respect.com` / Contraseña: `empleado123`
- Email: `juan@respect.com` / Contraseña: `empleado123`

## 📁 Estructura del Proyecto

```
respect/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de base de datos
│   │   └── seed.js            # Datos iniciales
│   ├── routes/                # Rutas de la API
│   ├── middleware/            # Middleware de autenticación
│   └── server.js              # Servidor Express
│
└── frontend/
    ├── app/
    │   ├── login/             # Página de inicio de sesión
    │   └── dashboard/         # Dashboard principal
    │       ├── events/        # Gestión de eventos
    │       ├── providers/     # Gestión de proveedores
    │       └── users/         # Gestión de usuarios
    └── lib/                   # Utilidades y API client
```

## 🔑 Funcionalidades Principales

### Para Administradores

1. **Crear Eventos**: Define eventos con información flexible
2. **Definir Atributos**: Crea atributos/tablas para recopilar datos (ej: generadores, camiones)
3. **Gestionar Proveedores**: Crea y administra proveedores con campos dinámicos
4. **Asignar Permisos**: Define qué empleados pueden ingresar/modificar qué datos
5. **Crear Usuarios**: Gestiona cuentas de empleados

### Para Empleados

1. **Ver Eventos**: Accede a los eventos asignados
2. **Ingresar Datos**: Ingresa datos según los permisos asignados
3. **Subir Imágenes**: Adjunta imágenes cuando el atributo lo permita
4. **Ver Historial**: Consulta datos ingresados anteriormente

## 🎨 Diseño

El diseño está inspirado en la identidad visual de Respect, con:
- Colores principales: Teal/Verde (#00a896)
- Diseño moderno y profesional
- Interfaz intuitiva y responsiva

## 🔒 Seguridad

- Autenticación basada en JWT
- Contraseñas hasheadas con bcrypt
- Validación de permisos en backend y frontend
- Protección de rutas sensibles

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Verificar token

### Eventos
- `GET /api/events` - Listar eventos
- `POST /api/events` - Crear evento (admin)
- `GET /api/events/:id` - Obtener evento
- `PUT /api/events/:id` - Actualizar evento (admin)
- `DELETE /api/events/:id` - Eliminar evento (admin)
- `POST /api/events/:id/attributes` - Agregar atributo (admin)
- `POST /api/events/:id/providers` - Agregar proveedor (admin)

### Proveedores
- `GET /api/providers` - Listar proveedores
- `POST /api/providers` - Crear proveedor (admin)
- `PUT /api/providers/:id` - Actualizar proveedor (admin)
- `DELETE /api/providers/:id` - Eliminar proveedor (admin)

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `PUT /api/users/:id` - Actualizar usuario (admin)
- `DELETE /api/users/:id` - Eliminar usuario (admin)

### Permisos
- `GET /api/permissions/user/:userId` - Permisos de usuario
- `POST /api/permissions` - Crear/actualizar permiso (admin)
- `PUT /api/permissions/:id` - Actualizar permiso (admin)
- `DELETE /api/permissions/:id` - Eliminar permiso (admin)

### Datos de Eventos
- `GET /api/event-data/attribute/:attributeId` - Datos de atributo
- `POST /api/event-data` - Crear dato (con imagen opcional)
- `PUT /api/event-data/:id` - Actualizar dato
- `DELETE /api/event-data/:id` - Eliminar dato

## 🚧 Desarrollo

### Ejecutar seed manualmente
```bash
cd backend
npm run seed
```

**Nota:** El seed se ejecuta automáticamente al iniciar el servidor. La base de datos es en memoria, por lo que los datos se pierden al reiniciar el servidor.

## 📄 Licencia

Este proyecto es propiedad de Respect.

