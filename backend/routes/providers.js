const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los proveedores
router.get('/', authenticate, async (req, res) => {
  try {
    const providers = await db.findAllProviders();

    res.json(providers);
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener proveedor por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await db.findProviderById(id);
    if (provider) {
      // Agregar eventos asociados
      const allEvents = await db.findAllEvents();
      provider.events = allEvents
        .filter(e => e.providers.some(p => p.provider?.id === id))
        .map(e => ({ event: { id: e.id, name: e.name } }));
    }

    if (!provider) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Error obteniendo proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo proveedor (solo admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, dynamicFields } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
    }

    const provider = await db.createProvider({
      name,
      email,
      phone,
      dynamicFields,
    });

    res.status(201).json(provider);
  } catch (error) {
    console.error('Error creando proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar proveedor (solo admin)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, dynamicFields } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dynamicFields) updateData.dynamicFields = dynamicFields;

    const provider = await db.updateProvider(id, updateData);

    res.json(provider);
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar proveedor (solo admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.deleteProvider(id);

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

