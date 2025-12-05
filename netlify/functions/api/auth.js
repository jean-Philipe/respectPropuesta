const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db');
const { JWT_SECRET } = require('../utils/auth');

exports.handler = async (event, context) => {
  const db = getDB();
  await db.initialize();

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.path.endsWith('/login')) {
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
      }

      const { email, password } = JSON.parse(event.body);

      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email y contraseña son requeridos' }) };
      }

      const user = await db.findUserByEmail(email);

      if (!user) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Credenciales inválidas' }) };
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        }),
      };
    }

    if (event.path.endsWith('/me')) {
      if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
      }

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
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Ruta no encontrada' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};

