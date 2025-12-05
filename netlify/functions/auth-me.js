const jwt = require('jsonwebtoken');
const { getDB } = require('./db');
const { JWT_SECRET } = require('./utils/auth');

exports.handler = async (event, context) => {
  const db = getDB();
  await db.initialize();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token no proporcionado' }) };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findUserById(decoded.userId);

    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Usuario no encontrado' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token inválido' }) };
  }
};

