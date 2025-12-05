const { getDB } = require('../db');
const { authenticate, requireAdmin } = require('../utils/auth');

exports.handler = async (event, context) => {
  const db = getDB();
  await db.initialize();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const authResult = await authenticate(event);
  if (authResult.error) {
    return { statusCode: authResult.statusCode, headers, body: JSON.stringify({ error: authResult.error }) };
  }
  const user = authResult.user;

  try {
    const pathParts = event.path.split('/').filter(p => p);
    const isUserRoute = event.path.includes('/user/');
    const isAttributeRoute = event.path.includes('/attribute/');
    const permissionId = pathParts[pathParts.length - 1];

    // GET /api/permissions/user/:userId
    if (event.httpMethod === 'GET' && isUserRoute) {
      const userId = pathParts[pathParts.length - 1];
      if (user.role !== 'ADMIN' && user.id !== userId) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Acceso denegado' }) };
      }

      const permissions = await db.findPermissionsByUserId(userId);
      for (const perm of permissions) {
        const attr = await db.findEventAttributeById(perm.eventAttributeId);
        if (attr) {
          const event = await db.findEventById(attr.eventId);
          perm.eventAttribute = {
            ...attr,
            event: event ? { id: event.id, name: event.name } : null,
          };
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify(permissions) };
    }

    // GET /api/permissions/attribute/:attributeId
    if (event.httpMethod === 'GET' && isAttributeRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const attributeId = pathParts[pathParts.length - 1];
      const permissions = await db.findPermissionsByAttributeId(attributeId);
      const attr = await db.findEventAttributeById(attributeId);
      const event = attr ? await db.findEventById(attr.eventId) : null;

      for (const perm of permissions) {
        const permUser = await db.findUserById(perm.userId);
        if (permUser) {
          perm.user = {
            id: permUser.id,
            name: permUser.name,
            email: permUser.email,
          };
        }
        if (attr) {
          perm.eventAttribute = {
            ...attr,
            event: event ? { id: event.id, name: event.name } : null,
          };
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify(permissions) };
    }

    // POST /api/permissions
    if (event.httpMethod === 'POST') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { userId, eventAttributeId, canCreate, canRead, canUpdate, canDelete } = JSON.parse(event.body);
      if (!userId || !eventAttributeId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Usuario y atributo de evento son requeridos' }) };
      }

      const permission = await db.createOrUpdatePermission({
        userId,
        eventAttributeId,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
      });

      const permUser = await db.findUserById(userId);
      const attr = await db.findEventAttributeById(eventAttributeId);
      if (permUser) {
        permission.user = {
          id: permUser.id,
          name: permUser.name,
          email: permUser.email,
        };
      }
      if (attr) {
        const event = await db.findEventById(attr.eventId);
        permission.eventAttribute = {
          ...attr,
          event: event ? { id: event.id, name: event.name } : null,
        };
      }

      return { statusCode: 201, headers, body: JSON.stringify(permission) };
    }

    // PUT /api/permissions/:id
    if (event.httpMethod === 'PUT') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { canCreate, canRead, canUpdate, canDelete } = JSON.parse(event.body);
      const updateData = {};
      if (canCreate !== undefined) updateData.canCreate = canCreate;
      if (canRead !== undefined) updateData.canRead = canRead;
      if (canUpdate !== undefined) updateData.canUpdate = canUpdate;
      if (canDelete !== undefined) updateData.canDelete = canDelete;

      const permission = await db.updatePermission(permissionId, updateData);
      if (!permission) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Permiso no encontrado' }) };
      }

      const permUser = await db.findUserById(permission.userId);
      const attr = await db.findEventAttributeById(permission.eventAttributeId);
      if (permUser) {
        permission.user = {
          id: permUser.id,
          name: permUser.name,
          email: permUser.email,
        };
      }
      if (attr) {
        const event = await db.findEventById(attr.eventId);
        permission.eventAttribute = {
          ...attr,
          event: event ? { id: event.id, name: event.name } : null,
        };
      }

      return { statusCode: 200, headers, body: JSON.stringify(permission) };
    }

    // DELETE /api/permissions/:id
    if (event.httpMethod === 'DELETE') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const deleted = await db.deletePermission(permissionId);
      if (!deleted) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Permiso no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Permiso eliminado exitosamente' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};

