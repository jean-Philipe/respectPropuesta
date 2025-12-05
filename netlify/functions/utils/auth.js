const jwt = require('jsonwebtoken');
const { getDB } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function authenticate(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return { error: 'Token no proporcionado', statusCode: 401 };
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    await db.initialize();
    const user = await db.findUserById(decoded.userId);

    if (!user) {
      return { error: 'Usuario no encontrado', statusCode: 401 };
    }

    return { user };
  } catch (error) {
    return { error: 'Token inválido', statusCode: 401 };
  }
}

function requireAdmin(user) {
  if (user.role !== 'ADMIN') {
    return { error: 'Acceso denegado. Se requiere rol de administrador', statusCode: 403 };
  }
  return null;
}

module.exports = { authenticate, requireAdmin, JWT_SECRET };

