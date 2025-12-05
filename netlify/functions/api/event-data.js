const { getDB } = require('../db');
const { authenticate } = require('../utils/auth');

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
    const isAttributeRoute = event.path.includes('/attribute/');
    const isEventRoute = event.path.includes('/event/');
    const dataId = pathParts[pathParts.length - 1];

    // GET /api/event-data/attribute/:attributeId
    if (event.httpMethod === 'GET' && isAttributeRoute) {
      const attributeId = pathParts[pathParts.length - 1];
      const permission = await db.findPermissionByUserAndAttribute(user.id, attributeId);

      if (user.role !== 'ADMIN' && !permission?.canRead) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permiso para ver estos datos' }) };
      }

      let eventData = await db.findEventDataByAttributeId(attributeId);
      for (const data of eventData) {
        const dataUser = await db.findUserById(data.userId);
        const attr = await db.findEventAttributeById(data.eventAttributeId);
        if (dataUser) {
          data.user = {
            id: dataUser.id,
            name: dataUser.name,
            email: dataUser.email,
          };
        }
        if (attr) {
          data.eventAttribute = attr;
        }
      }
      eventData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { statusCode: 200, headers, body: JSON.stringify(eventData) };
    }

    // GET /api/event-data/event/:eventId
    if (event.httpMethod === 'GET' && isEventRoute) {
      const eventId = pathParts[pathParts.length - 1];
      let eventData = await db.findEventDataByEventId(eventId);
      for (const data of eventData) {
        const dataUser = await db.findUserById(data.userId);
        const attr = await db.findEventAttributeById(data.eventAttributeId);
        if (dataUser) {
          data.user = {
            id: dataUser.id,
            name: dataUser.name,
            email: dataUser.email,
          };
        }
        if (attr) {
          data.eventAttribute = attr;
        }
      }
      eventData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { statusCode: 200, headers, body: JSON.stringify(eventData) };
    }

    // POST /api/event-data
    if (event.httpMethod === 'POST') {
      const { eventId, eventAttributeId, data: dataValue, comment, imageUrl } = JSON.parse(event.body);

      if (!eventId || !eventAttributeId || !dataValue) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Evento, atributo y datos son requeridos' }) };
      }

      const permission = await db.findPermissionByUserAndAttribute(user.id, eventAttributeId);
      if (user.role !== 'ADMIN') {
        if (!permission) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permisos para esta acción' }) };
        }
        if (!permission.canCreate) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permiso para crear datos' }) };
        }
      }

      if (imageUrl) {
        const attribute = await db.findEventAttributeById(eventAttributeId);
        if (!attribute || !attribute.allowImage) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Este atributo no permite subir imágenes' }) };
        }
      }

      const parsedData = typeof dataValue === 'string' ? JSON.parse(dataValue) : dataValue;
      const eventData = await db.createEventData({
        eventId,
        eventAttributeId,
        userId: user.id,
        data: parsedData,
        comment,
        imageUrl,
      });

      const dataUser = await db.findUserById(user.id);
      const attr = await db.findEventAttributeById(eventAttributeId);
      if (dataUser) {
        eventData.user = {
          id: dataUser.id,
          name: dataUser.name,
          email: dataUser.email,
        };
      }
      if (attr) {
        eventData.eventAttribute = attr;
      }

      return { statusCode: 201, headers, body: JSON.stringify(eventData) };
    }

    // PUT /api/event-data/:id
    if (event.httpMethod === 'PUT') {
      const { data: dataValue, comment, imageUrl } = JSON.parse(event.body);
      const existingData = await db.findEventDataById(dataId);

      if (!existingData) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Dato no encontrado' }) };
      }

      if (user.role !== 'ADMIN') {
        if (existingData.userId !== user.id) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permiso para actualizar este dato' }) };
        }
        const permission = await db.findPermissionByUserAndAttribute(user.id, existingData.eventAttributeId);
        if (!permission || !permission.canUpdate) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permiso para actualizar datos' }) };
        }
      }

      const updateData = {};
      if (dataValue) {
        const parsedData = typeof dataValue === 'string' ? JSON.parse(dataValue) : dataValue;
        updateData.data = parsedData;
      }
      if (comment !== undefined) updateData.comment = comment;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

      const eventData = await db.updateEventData(dataId, updateData);
      if (!eventData) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Dato no encontrado' }) };
      }

      const dataUser = await db.findUserById(eventData.userId);
      const attr = await db.findEventAttributeById(eventData.eventAttributeId);
      if (dataUser) {
        eventData.user = {
          id: dataUser.id,
          name: dataUser.name,
          email: dataUser.email,
        };
      }
      if (attr) {
        eventData.eventAttribute = attr;
      }

      return { statusCode: 200, headers, body: JSON.stringify(eventData) };
    }

    // DELETE /api/event-data/:id
    if (event.httpMethod === 'DELETE') {
      const existingData = await db.findEventDataById(dataId);

      if (!existingData) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Dato no encontrado' }) };
      }

      if (user.role !== 'ADMIN') {
        if (existingData.userId !== user.id) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permiso para eliminar este dato' }) };
        }
        const permission = await db.findPermissionByUserAndAttribute(user.id, existingData.eventAttributeId);
        if (!permission || !permission.canDelete) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'No tienes permiso para eliminar datos' }) };
        }
      }

      await db.deleteEventData(dataId);
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Dato eliminado exitosamente' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};

