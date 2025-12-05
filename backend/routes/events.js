const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los eventos
router.get('/', authenticate, async (req, res) => {
  try {
    const events = await db.findAllEvents();

    res.json(events);
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener evento por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await db.findEventById(id);
    if (event) {
      event.attributes = await db.findEventAttributesByEventId(id);
      const allEvents = await db.findAllEvents();
      const eventWithProviders = allEvents.find(e => e.id === id);
      event.providers = eventWithProviders?.providers || [];
    }

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo evento (solo admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, startDate, endDate, dynamicFields } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del evento es requerido' });
    }

    const event = await db.createEvent({
      name,
      description,
      startDate,
      endDate,
      dynamicFields,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar evento (solo admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, startDate, endDate, dynamicFields } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (dynamicFields) updateData.dynamicFields = dynamicFields;

    const event = await db.updateEvent(id, updateData);

    res.json(event);
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar evento (solo admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.deleteEvent(id);

    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar atributo a evento (solo admin)
router.post('/:id/attributes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dataType, allowImage, description } = req.body;

    if (!name || !dataType) {
      return res.status(400).json({ error: 'Nombre y tipo de dato son requeridos' });
    }

    const attribute = await db.createEventAttribute({
      eventId: id,
      name,
      dataType,
      allowImage: allowImage || false,
      description,
    });

    res.status(201).json(attribute);
    } catch (error) {
      if (error.message.includes('Ya existe')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creando atributo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar atributo (solo admin)
router.put('/attributes/:attributeId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { attributeId } = req.params;
    const { name, dataType, allowImage, description } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (dataType) updateData.dataType = dataType;
    if (allowImage !== undefined) updateData.allowImage = allowImage;
    if (description !== undefined) updateData.description = description;

    const attribute = await db.updateEventAttribute(attributeId, updateData);

    res.json(attribute);
  } catch (error) {
    console.error('Error actualizando atributo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar atributo (solo admin)
router.delete('/attributes/:attributeId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { attributeId } = req.params;

    await db.deleteEventAttribute(attributeId);

    res.json({ message: 'Atributo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando atributo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Agregar proveedor a evento
router.post('/:id/providers', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { providerId } = req.body;

    if (!providerId) {
      return res.status(400).json({ error: 'ID del proveedor es requerido' });
    }

    const eventProvider = await db.createEventProvider(id, providerId);

    res.status(201).json(eventProvider);
    } catch (error) {
      if (error.message.includes('ya está asociado')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error agregando proveedor:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar proveedor de evento
router.delete('/:id/providers/:providerId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id, providerId } = req.params;

    await db.deleteEventProvider(id, providerId);

    res.json({ message: 'Proveedor eliminado del evento exitosamente' });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

