// Router centralizado para todas las rutas /api/*
const authHandler = require('./api/auth');
const usersHandler = require('./api/users');
const eventsHandler = require('./api/events');
const providersHandler = require('./api/providers');
const permissionsHandler = require('./api/permissions');
const eventDataHandler = require('./api/event-data');

exports.handler = async (event, context) => {
  // Extraer la ruta después de /api/
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const pathParts = path.split('/').filter(p => p);
  const resource = pathParts[0]; // auth, users, events, etc.

  // Crear un nuevo event con el path ajustado
  const modifiedEvent = {
    ...event,
    path: path,
  };

  try {
    // Enrutar a la función correspondiente
    if (resource === 'auth') {
      return await authHandler.handler(modifiedEvent, context);
    } else if (resource === 'users') {
      return await usersHandler.handler(modifiedEvent, context);
    } else if (resource === 'events') {
      return await eventsHandler.handler(modifiedEvent, context);
    } else if (resource === 'providers') {
      return await providersHandler.handler(modifiedEvent, context);
    } else if (resource === 'permissions') {
      return await permissionsHandler.handler(modifiedEvent, context);
    } else if (resource === 'event-data') {
      return await eventDataHandler.handler(modifiedEvent, context);
    }

    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Ruta no encontrada' }),
    };
  } catch (error) {
    console.error('Error en router:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Error interno del servidor' }),
    };
  }
};

