const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten archivos de imagen'));
  },
});

// Middleware para verificar permisos
const checkPermission = async (req, res, next) => {
  try {
    const { eventAttributeId } = req.body;
    const userId = req.user.id;

    if (req.method === 'GET') {
      // Para GET, solo verificamos si el usuario tiene acceso de lectura
      return next();
    }

    if (!eventAttributeId) {
      return res.status(400).json({ error: 'ID del atributo de evento es requerido' });
    }

    const permission = await db.findPermissionByUserAndAttribute(userId, eventAttributeId);

    if (!permission) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción' });
    }

    if (req.method === 'POST' && !permission.canCreate) {
      return res.status(403).json({ error: 'No tienes permiso para crear datos' });
    }

    if (req.method === 'PUT' && !permission.canUpdate) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar datos' });
    }

    if (req.method === 'DELETE' && !permission.canDelete) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar datos' });
    }

    req.permission = permission;
    next();
  } catch (error) {
    console.error('Error verificando permisos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener datos de un atributo de evento
router.get('/attribute/:attributeId', authenticate, async (req, res) => {
  try {
    const { attributeId } = req.params;
    const userId = req.user.id;

    // Verificar que el usuario tenga permiso de lectura
    const permission = await db.findPermissionByUserAndAttribute(userId, attributeId);

    // Admin puede ver todo
    if (req.user.role !== 'ADMIN' && !permission?.canRead) {
      return res.status(403).json({ error: 'No tienes permiso para ver estos datos' });
    }

    let eventData = await db.findEventDataByAttributeId(attributeId);
    
    // Enriquecer con información del usuario y atributo
    for (const data of eventData) {
      const user = await db.findUserById(data.userId);
      const attr = await db.findEventAttributeById(data.eventAttributeId);
      if (user) {
        data.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
      if (attr) {
        data.eventAttribute = attr;
      }
    }
    
    // Ordenar por fecha de creación descendente
    eventData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(eventData);
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener datos de un evento
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    let eventData = await db.findEventDataByEventId(eventId);
    
    // Enriquecer con información del usuario y atributo
    for (const data of eventData) {
      const user = await db.findUserById(data.userId);
      const attr = await db.findEventAttributeById(data.eventAttributeId);
      if (user) {
        data.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
      if (attr) {
        data.eventAttribute = attr;
      }
    }
    
    // Ordenar por fecha de creación descendente
    eventData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(eventData);
  } catch (error) {
    console.error('Error obteniendo datos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo dato (con posibilidad de imagen)
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { eventId, eventAttributeId, data, comment } = req.body;
    const userId = req.user.id;

    if (!eventId || !eventAttributeId || !data) {
      // Si hay un archivo subido, eliminarlo antes de retornar error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Evento, atributo y datos son requeridos' });
    }

    // Verificar permisos después de que multer procese el FormData
    const permission = await db.findPermissionByUserAndAttribute(userId, eventAttributeId);
    
    // Admin puede crear datos sin permiso específico
    if (req.user.role !== 'ADMIN') {
      if (!permission) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'No tienes permisos para esta acción' });
      }
      if (!permission.canCreate) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'No tienes permiso para crear datos' });
      }
    }

    // Verificar que el atributo permita imágenes si se está subiendo una
    if (req.file) {
      const attribute = await db.findEventAttributeById(eventAttributeId);

      if (!attribute || !attribute.allowImage) {
        // Eliminar archivo subido
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Este atributo no permite subir imágenes' });
      }
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

    const eventData = await db.createEventData({
      eventId,
      eventAttributeId,
      userId,
      data: parsedData,
      comment,
      imageUrl,
    });
    
    // Enriquecer con información del usuario y atributo
    const user = await db.findUserById(userId);
    const attr = await db.findEventAttributeById(eventAttributeId);
    if (user) {
      eventData.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
    }
    if (attr) {
      eventData.eventAttribute = attr;
    }

    res.status(201).json(eventData);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error creando dato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar dato
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { data, comment } = req.body;
    const userId = req.user.id;

    const existingData = await db.findEventDataById(id);

    if (!existingData) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Dato no encontrado' });
    }

    // Verificar permisos después de que multer procese el FormData
    if (req.user.role !== 'ADMIN') {
      // Verificar que el usuario sea el dueño
      if (existingData.userId !== userId) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'No tienes permiso para actualizar este dato' });
      }
      
      // Verificar permiso de actualización
      const permission = await db.findPermissionByUserAndAttribute(userId, existingData.eventAttributeId);
      if (!permission || !permission.canUpdate) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'No tienes permiso para actualizar datos' });
      }
    }

    const updateData = {};
    if (data) {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      updateData.data = parsedData;
    }
    if (comment !== undefined) updateData.comment = comment;

    if (req.file) {
      // Eliminar imagen anterior si existe
      if (existingData.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', existingData.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const eventData = await db.updateEventData(id, updateData);
    
    // Enriquecer con información del usuario y atributo
    if (eventData) {
      const user = await db.findUserById(eventData.userId);
      const attr = await db.findEventAttributeById(eventData.eventAttributeId);
      if (user) {
        eventData.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
      if (attr) {
        eventData.eventAttribute = attr;
      }
    }

    res.json(eventData);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error actualizando dato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar dato
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingData = await db.findEventDataById(id);

    if (!existingData) {
      return res.status(404).json({ error: 'Dato no encontrado' });
    }

    // Verificar permisos
    if (req.user.role !== 'ADMIN') {
      // Verificar que el usuario sea el dueño
      if (existingData.userId !== userId) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este dato' });
      }
      
      // Verificar permiso de eliminación
      const permission = await db.findPermissionByUserAndAttribute(userId, existingData.eventAttributeId);
      if (!permission || !permission.canDelete) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar datos' });
      }
    }

    // Eliminar imagen si existe
    if (existingData.imageUrl) {
      const imagePath = path.join(__dirname, '..', existingData.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await db.deleteEventData(id);

    res.json({ message: 'Dato eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando dato:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

