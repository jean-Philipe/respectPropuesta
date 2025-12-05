const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener permisos de un usuario
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // Solo admin puede ver permisos de otros usuarios
    if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const permissions = await db.findPermissionsByUserId(userId);
    // Enriquecer con información del atributo y evento
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

    res.json(permissions);
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener permisos de un atributo de evento
router.get('/attribute/:attributeId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { attributeId } = req.params;

    const permissions = await db.findPermissionsByAttributeId(attributeId);
    // Enriquecer con información del usuario y atributo
    const attr = await db.findEventAttributeById(attributeId);
    const event = attr ? await db.findEventById(attr.eventId) : null;
    
    for (const perm of permissions) {
      const user = await db.findUserById(perm.userId);
      if (user) {
        perm.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
      if (attr) {
        perm.eventAttribute = {
          ...attr,
          event: event ? { id: event.id, name: event.name } : null,
        };
      }
    }

    res.json(permissions);
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear o actualizar permiso (solo admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, eventAttributeId, canCreate, canRead, canUpdate, canDelete } = req.body;

    if (!userId || !eventAttributeId) {
      return res.status(400).json({ error: 'Usuario y atributo de evento son requeridos' });
    }

    const permission = await db.createOrUpdatePermission({
      userId,
      eventAttributeId,
      canCreate,
      canRead,
      canUpdate,
      canDelete,
    });
    
    // Enriquecer con información del usuario y atributo
    const user = await db.findUserById(userId);
    const attr = await db.findEventAttributeById(eventAttributeId);
    if (user) {
      permission.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }
    if (attr) {
      const event = await db.findEventById(attr.eventId);
      permission.eventAttribute = {
        ...attr,
        event: event ? { id: event.id, name: event.name } : null,
      };
    }

    res.status(201).json(permission);
  } catch (error) {
    console.error('Error creando permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar permiso (solo admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { canCreate, canRead, canUpdate, canDelete } = req.body;

    const updateData = {};
    if (canCreate !== undefined) updateData.canCreate = canCreate;
    if (canRead !== undefined) updateData.canRead = canRead;
    if (canUpdate !== undefined) updateData.canUpdate = canUpdate;
    if (canDelete !== undefined) updateData.canDelete = canDelete;

    const permission = await db.updatePermission(id, updateData);
    
    // Enriquecer con información del usuario y atributo
    if (permission) {
      const user = await db.findUserById(permission.userId);
      const attr = await db.findEventAttributeById(permission.eventAttributeId);
      if (user) {
        permission.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
      if (attr) {
        const event = await db.findEventById(attr.eventId);
        permission.eventAttribute = {
          ...attr,
          event: event ? { id: event.id, name: event.name } : null,
        };
      }
    }

    res.json(permission);
  } catch (error) {
    console.error('Error actualizando permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar permiso (solo admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.deletePermission(id);

    res.json({ message: 'Permiso eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando permiso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

