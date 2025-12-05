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
    // El path ya viene sin /api/events
    const path = event.path;
    const pathParts = path.split('/').filter(p => p);
    const eventId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
    const isAttributeRoute = path.includes('/attributes');
    const isProviderRoute = path.includes('/providers');

    // GET /api/events
    if (event.httpMethod === 'GET' && !eventId) {
      const events = await db.findAllEvents();
      return { statusCode: 200, headers, body: JSON.stringify(events) };
    }

    // GET /api/events/:id
    if (event.httpMethod === 'GET' && eventId && !isAttributeRoute && !isProviderRoute) {
      const event = await db.findEventById(eventId);
      if (!event) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Evento no encontrado' }) };
      }
      event.attributes = await db.findEventAttributesByEventId(eventId);
      const allEvents = await db.findAllEvents();
      const eventWithProviders = allEvents.find(e => e.id === eventId);
      event.providers = eventWithProviders?.providers || [];
      return { statusCode: 200, headers, body: JSON.stringify(event) };
    }

    // POST /api/events
    if (event.httpMethod === 'POST' && !eventId) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { name, description, startDate, endDate, dynamicFields } = JSON.parse(event.body);
      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'El nombre del evento es requerido' }) };
      }

      const newEvent = await db.createEvent({ name, description, startDate, endDate, dynamicFields });
      return { statusCode: 201, headers, body: JSON.stringify(newEvent) };
    }

    // PUT /api/events/:id
    if (event.httpMethod === 'PUT' && eventId && !isAttributeRoute && !isProviderRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { name, description, startDate, endDate, dynamicFields } = JSON.parse(event.body || '{}');
      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (startDate) updateData.startDate = startDate;
      if (endDate) updateData.endDate = endDate;
      if (dynamicFields) updateData.dynamicFields = dynamicFields;

      const updated = await db.updateEvent(eventId, updateData);
      if (!updated) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Evento no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(updated) };
    }

    // DELETE /api/events/:id
    if (event.httpMethod === 'DELETE' && eventId && !isAttributeRoute && !isProviderRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const deleted = await db.deleteEvent(eventId);
      if (!deleted) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Evento no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Evento eliminado exitosamente' }) };
    }

    // POST /api/events/:id/attributes
    if (event.httpMethod === 'POST' && isAttributeRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { name, dataType, allowImage, description } = JSON.parse(event.body);
      if (!name || !dataType) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Nombre y tipo de dato son requeridos' }) };
      }

      try {
        const attribute = await db.createEventAttribute({
          eventId,
          name,
          dataType,
          allowImage: allowImage || false,
          description,
        });
        return { statusCode: 201, headers, body: JSON.stringify(attribute) };
      } catch (error) {
        if (error.message.includes('Ya existe')) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
        }
        throw error;
      }
    }

    // PUT /api/events/attributes/:attributeId
    if (event.httpMethod === 'PUT' && isAttributeRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const attributeId = pathParts[pathParts.length - 1];
      const { name, dataType, allowImage, description } = JSON.parse(event.body || '{}');
      const updateData = {};
      if (name) updateData.name = name;
      if (dataType) updateData.dataType = dataType;
      if (allowImage !== undefined) updateData.allowImage = allowImage;
      if (description !== undefined) updateData.description = description;

      const updated = await db.updateEventAttribute(attributeId, updateData);
      if (!updated) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Atributo no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(updated) };
    }

    // DELETE /api/events/attributes/:attributeId
    if (event.httpMethod === 'DELETE' && isAttributeRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const attributeId = pathParts[pathParts.length - 1];
      const deleted = await db.deleteEventAttribute(attributeId);
      if (!deleted) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Atributo no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Atributo eliminado exitosamente' }) };
    }

    // POST /api/events/:id/providers
    if (event.httpMethod === 'POST' && isProviderRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { providerId } = JSON.parse(event.body || '{}');
      if (!providerId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID del proveedor es requerido' }) };
      }

      try {
        const eventProvider = await db.createEventProvider(eventId, providerId);
        return { statusCode: 201, headers, body: JSON.stringify(eventProvider) };
      } catch (error) {
        if (error.message.includes('ya está asociado')) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
        }
        throw error;
      }
    }

    // DELETE /api/events/:id/providers/:providerId
    if (event.httpMethod === 'DELETE' && isProviderRoute) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const providerId = pathParts[pathParts.length - 1];
      const deleted = await db.deleteEventProvider(eventId, providerId);
      if (!deleted) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Proveedor no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Proveedor eliminado del evento exitosamente' }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Ruta no encontrada' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};

