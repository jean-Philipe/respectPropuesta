const bcrypt = require('bcryptjs');
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

  // Autenticación
  const authResult = await authenticate(event);
  if (authResult.error) {
    return { statusCode: authResult.statusCode, headers, body: JSON.stringify({ error: authResult.error }) };
  }
  const user = authResult.user;

  try {
    // GET /api/users
    if (event.httpMethod === 'GET' && !event.path.includes('/')) {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const users = await db.findAllUsers();
      return { statusCode: 200, headers, body: JSON.stringify(users) };
    }

    // GET /api/users/:id
    if (event.httpMethod === 'GET') {
      const path = event.path || event.rawPath || '';
      const pathParts = path.split('/').filter(p => p);
      // Si hay más de 2 partes (api, users, id), entonces es GET /api/users/:id
      if (pathParts.length > 2) {
        const id = pathParts[pathParts.length - 1];
        if (user.role !== 'ADMIN' && user.id !== id) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Acceso denegado' }) };
        }

        const foundUser = await db.findUserById(id);
        if (!foundUser) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Usuario no encontrado' }) };
        }

        return { statusCode: 200, headers, body: JSON.stringify(foundUser) };
      }
    }

    // POST /api/users
    if (event.httpMethod === 'POST') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const { email, password, name, role } = JSON.parse(event.body);

      if (!email || !password || !name) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email, contraseña y nombre son requeridos' }) };
      }

      const existingUser = await db.findUserByEmail(email);
      if (existingUser) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'El email ya está registrado' }) };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await db.createUser({
        email,
        password: hashedPassword,
        name,
        role: role || 'EMPLOYEE',
      });

      return { statusCode: 201, headers, body: JSON.stringify(newUser) };
    }

    // PUT /api/users/:id
    if (event.httpMethod === 'PUT') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const path = event.path || event.rawPath || '';
      const pathParts = path.split('/').filter(p => p);
      const id = pathParts[pathParts.length - 1];
      const { email, name, role, password } = JSON.parse(event.body);

      const updateData = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await db.updateUser(id, updateData);
      if (!updatedUser) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Usuario no encontrado' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify(updatedUser) };
    }

    // DELETE /api/users/:id
    if (event.httpMethod === 'DELETE') {
      const adminError = requireAdmin(user);
      if (adminError) {
        return { statusCode: adminError.statusCode, headers, body: JSON.stringify({ error: adminError.error }) };
      }

      const path = event.path || event.rawPath || '';
      const pathParts = path.split('/').filter(p => p);
      const id = pathParts[pathParts.length - 1];
      const deleted = await db.deleteUser(id);
      if (!deleted) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Usuario no encontrado' }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Usuario eliminado exitosamente' }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Error interno del servidor' }) };
  }
};

