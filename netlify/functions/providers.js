const { getDB } = require('./db');
const { authenticate, requireAdmin } = require('./utils/auth');

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
    const path = event.path || event.rawPath || '';
    const pathParts = path.split('/').filter(p => p);
    const providerId = pathParts[pathParts.length - 1];

    // GET /api/providers
    if (event.httpMethod === 'GET' && pathParts.length <= 2) {
      const providers = await db.findAllProviders();
      return { statusCode: 200, headers, body: JSON.stringify(providers) };
    }

    // GET /api/providers/:id
    if (event.httpMethod === 'GET' && pathParts.length > 2) {
      const provider = await db.findProviderById(providerId);
      if (!provider) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Proveedor no encontrado' }) };
      }
      const allEvents = await db.findAllEvents();
      provider.events = allEvents
        .filter(e => e.providers.some(p => p.provider?.id === providerId))
        .map(e => ({ event: { id: e.id, name: e.name } }));
      return { statusCode: 200, headers, body: JSON.stringify(provider) };
    }

    // POST /api/providers
    if (event.httpMethod === 'POST') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }
      const { name, email, phone, dynamicFields } = JSON.parse(event.body || '{}');
      if (!name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'El nombre del proveedor es requerido' }) };
      }
      const provider = await db.createProvider({ name, email, phone, dynamicFields });
      return { statusCode: 201, headers, body: JSON.stringify(provider) };
    }

    // PUT /api/providers/:id
    if (event.httpMethod === 'PUT') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }
      const { name, email, phone, dynamicFields } = JSON.parse(event.body || '{}');
      const updateData = {};
      if (name) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (dynamicFields) updateData.dynamicFields = dynamicFields;
      const updated = await db.updateProvider(providerId, updateData);
      if (!updated) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Proveedor no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(updated) };
    }

    // DELETE /api/providers/:id
    if (event.httpMethod === 'DELETE') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }
      const deleted = await db.deleteProvider(providerId);
      if (!deleted) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Proveedor no encontrado' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Proveedor eliminado exitosamente' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};

