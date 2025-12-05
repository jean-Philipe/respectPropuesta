# Guía de Deploy en Netlify

Este proyecto está configurado para deployarse completamente en Netlify como un prototipo.

## Estructura del Proyecto

- **Frontend**: Next.js en `frontend/`
- **Backend**: Convertido a Netlify Functions en `netlify/functions/`
- **Base de datos**: Simulada en memoria (se reinicia entre invocaciones)

## Pasos para Deployar

### 1. Preparar el Repositorio

```bash
# Asegúrate de tener todos los archivos commiteados
git add .
git commit -m "Preparado para deploy en Netlify"
git push
```

### 2. Conectar con Netlify

1. Ve a [Netlify](https://app.netlify.com)
2. Click en "Add new site" → "Import an existing project"
3. Conecta tu repositorio (GitHub, GitLab, etc.)

### 3. Configuración en Netlify

Netlify debería detectar automáticamente la configuración desde `netlify.toml`, pero verifica:

**Build settings:**
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `.next`

O deja que Netlify use el `netlify.toml` automáticamente.

### 4. Instalar Dependencias de las Functions

Netlify instalará automáticamente las dependencias, pero asegúrate de que `netlify/functions/package.json` tenga las dependencias necesarias.

### 5. Variables de Entorno (Opcional)

Si necesitas cambiar el JWT_SECRET:
- Ve a Site settings → Environment variables
- Agrega: `JWT_SECRET` = tu clave secreta

### 6. Deploy

Netlify hará el deploy automáticamente. Las funciones estarán disponibles en:
- `/api/auth/*`
- `/api/users/*`
- `/api/events/*`
- `/api/providers/*`
- `/api/permissions/*`
- `/api/event-data/*`

## Notas Importantes

### Base de Datos en Memoria

⚠️ **IMPORTANTE**: La base de datos es en memoria y se reinicia entre invocaciones de funciones en Netlify. Esto significa que:
- Los datos no persisten entre reinicios
- Cada función puede tener su propia instancia de la DB
- Es solo para prototipos/demos

### Subida de Imágenes

Las imágenes no están implementadas en las funciones de Netlify. Para un prototipo, puedes:
1. Usar URLs de imágenes externas
2. Usar un servicio como Cloudinary
3. Omitir la funcionalidad de imágenes por ahora

### Desarrollo Local

Para desarrollo local con el backend original:

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
# Crear .env.local con:
# NEXT_PUBLIC_USE_BACKEND=true
npm install
npm run dev
```

## Credenciales de Prueba

Después del deploy, las credenciales son las mismas:
- **Admin**: `admin@respect.com` / `admin123`
- **Empleado**: `maria@respect.com` / `empleado123`
- **Empleado**: `juan@respect.com` / `empleado123`

## Solución de Problemas

### Error 404 en las rutas
- Verifica que `netlify.toml` esté en la raíz
- Verifica que las funciones estén en `netlify/functions/api/`

### Las funciones no se ejecutan
- Verifica que `netlify/functions/package.json` tenga las dependencias
- Revisa los logs en Netlify Dashboard

### El frontend no carga
- Verifica que el build command sea correcto
- Verifica que `publish directory` sea `.next`

