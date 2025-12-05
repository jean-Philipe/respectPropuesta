// Base de datos simulada en memoria (compartida entre funciones)
// Nota: En Netlify Functions, cada invocación puede tener su propia instancia
// Para un prototipo, esto funciona, pero los datos se reinician entre invocaciones
// En producción real, necesitarías una DB persistente

const bcrypt = require('bcryptjs');

class InMemoryDB {
  constructor() {
    this.users = [];
    this.events = [];
    this.providers = [];
    this.eventProviders = [];
    this.eventAttributes = [];
    this.permissions = [];
    this.eventData = [];
    this.nextIds = {
      users: 1,
      events: 1,
      providers: 1,
      eventProviders: 1,
      eventAttributes: 1,
      permissions: 1,
      eventData: 1,
    };
    this.initialized = false;
  }

  // Inicializar con datos seed
  async initialize() {
    if (this.initialized) return;
    
    try {
      const seed = require('./seed');
      await seed(this);
      this.initialized = true;
    } catch (error) {
      console.error('Error inicializando seed:', error);
      // Continuar aunque falle el seed
      this.initialized = true;
    }
  }

  // Generar ID único
  generateId(type) {
    return `id_${type}_${this.nextIds[type]++}`;
  }

  // ========== USERS ==========
  async createUser(data) {
    const user = {
      id: this.generateId('users'),
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || 'EMPLOYEE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return { ...user, password: undefined };
  }

  async findUserByEmail(email) {
    return this.users.find(u => u.email === email) || null;
  }

  async findUserById(id) {
    const user = this.users.find(u => u.id === id);
    if (!user) return null;
    return { ...user, password: undefined };
  }

  async findAllUsers() {
    return this.users.map(u => ({ ...u, password: undefined }));
  }

  async updateUser(id, data) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };
    this.users[index] = updated;
    return { ...updated, password: undefined };
  }

  async deleteUser(id) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    this.permissions = this.permissions.filter(p => p.userId !== id);
    this.eventData = this.eventData.filter(d => d.userId !== id);
    return true;
  }

  // ========== EVENTS ==========
  async createEvent(data) {
    const event = {
      id: this.generateId('events'),
      name: data.name,
      description: data.description || null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      dynamicFields: data.dynamicFields || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.events.push(event);
    return event;
  }

  async findEventById(id) {
    return this.events.find(e => e.id === id) || null;
  }

  async findAllEvents() {
    return this.events.map(e => ({
      ...e,
      attributes: this.eventAttributes.filter(a => a.eventId === e.id),
      providers: this.eventProviders
        .filter(ep => ep.eventId === e.id)
        .map(ep => ({
          provider: this.providers.find(p => p.id === ep.providerId),
        })),
      _count: {
        eventData: this.eventData.filter(d => d.eventId === e.id).length,
      },
    }));
  }

  async updateEvent(id, data) {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.events[index],
      ...data,
      updatedAt: new Date(),
    };
    if (data.startDate) updated.startDate = new Date(data.startDate);
    if (data.endDate) updated.endDate = new Date(data.endDate);
    this.events[index] = updated;
    return updated;
  }

  async deleteEvent(id) {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.events.splice(index, 1);
    this.eventProviders = this.eventProviders.filter(ep => ep.eventId !== id);
    this.eventAttributes = this.eventAttributes.filter(a => a.eventId !== id);
    this.eventData = this.eventData.filter(d => d.eventId !== id);
    this.permissions = this.permissions.filter(p => {
      const attr = this.eventAttributes.find(a => a.id === p.eventAttributeId);
      return attr && attr.eventId !== id;
    });
    return true;
  }

  // ========== PROVIDERS ==========
  async createProvider(data) {
    const provider = {
      id: this.generateId('providers'),
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      dynamicFields: data.dynamicFields || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.providers.push(provider);
    return provider;
  }

  async findProviderById(id) {
    return this.providers.find(p => p.id === id) || null;
  }

  async findAllProviders() {
    return this.providers.map(p => ({
      ...p,
      _count: {
        events: this.eventProviders.filter(ep => ep.providerId === p.id).length,
      },
    }));
  }

  async updateProvider(id, data) {
    const index = this.providers.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.providers[index],
      ...data,
      updatedAt: new Date(),
    };
    this.providers[index] = updated;
    return updated;
  }

  async deleteProvider(id) {
    const index = this.providers.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.providers.splice(index, 1);
    this.eventProviders = this.eventProviders.filter(ep => ep.providerId !== id);
    return true;
  }

  // ========== EVENT PROVIDERS ==========
  async createEventProvider(eventId, providerId) {
    const exists = this.eventProviders.find(
      ep => ep.eventId === eventId && ep.providerId === providerId
    );
    if (exists) {
      throw new Error('El proveedor ya está asociado a este evento');
    }

    const eventProvider = {
      id: this.generateId('eventProviders'),
      eventId,
      providerId,
      createdAt: new Date(),
    };
    this.eventProviders.push(eventProvider);
    return {
      ...eventProvider,
      provider: this.providers.find(p => p.id === providerId),
    };
  }

  async deleteEventProvider(eventId, providerId) {
    const index = this.eventProviders.findIndex(
      ep => ep.eventId === eventId && ep.providerId === providerId
    );
    if (index === -1) return false;
    this.eventProviders.splice(index, 1);
    return true;
  }

  // ========== EVENT ATTRIBUTES ==========
  async createEventAttribute(data) {
    const exists = this.eventAttributes.find(
      a => a.eventId === data.eventId && a.name === data.name
    );
    if (exists) {
      throw new Error('Ya existe un atributo con ese nombre para este evento');
    }

    const attribute = {
      id: this.generateId('eventAttributes'),
      eventId: data.eventId,
      name: data.name,
      dataType: data.dataType || 'TEXT',
      allowImage: data.allowImage || false,
      description: data.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.eventAttributes.push(attribute);
    return attribute;
  }

  async findEventAttributeById(id) {
    return this.eventAttributes.find(a => a.id === id) || null;
  }

  async findEventAttributesByEventId(eventId) {
    return this.eventAttributes.filter(a => a.eventId === eventId);
  }

  async updateEventAttribute(id, data) {
    const index = this.eventAttributes.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.eventAttributes[index],
      ...data,
      updatedAt: new Date(),
    };
    this.eventAttributes[index] = updated;
    return updated;
  }

  async deleteEventAttribute(id) {
    const index = this.eventAttributes.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.eventAttributes.splice(index, 1);
    this.eventData = this.eventData.filter(d => d.eventAttributeId !== id);
    this.permissions = this.permissions.filter(p => p.eventAttributeId !== id);
    return true;
  }

  // ========== PERMISSIONS ==========
  async createOrUpdatePermission(data) {
    const existing = this.permissions.find(
      p => p.userId === data.userId && p.eventAttributeId === data.eventAttributeId
    );

    if (existing) {
      const index = this.permissions.indexOf(existing);
      const updated = {
        ...existing,
        canCreate: data.canCreate !== undefined ? data.canCreate : existing.canCreate,
        canRead: data.canRead !== undefined ? data.canRead : existing.canRead,
        canUpdate: data.canUpdate !== undefined ? data.canUpdate : existing.canUpdate,
        canDelete: data.canDelete !== undefined ? data.canDelete : existing.canDelete,
        updatedAt: new Date(),
      };
      this.permissions[index] = updated;
      return updated;
    } else {
      const permission = {
        id: this.generateId('permissions'),
        userId: data.userId,
        eventAttributeId: data.eventAttributeId,
        canCreate: data.canCreate || false,
        canRead: data.canRead !== undefined ? data.canRead : true,
        canUpdate: data.canUpdate || false,
        canDelete: data.canDelete || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.permissions.push(permission);
      return permission;
    }
  }

  async findPermissionById(id) {
    return this.permissions.find(p => p.id === id) || null;
  }

  async findPermissionsByUserId(userId) {
    return this.permissions.filter(p => p.userId === userId);
  }

  async findPermissionsByAttributeId(attributeId) {
    return this.permissions.filter(p => p.eventAttributeId === attributeId);
  }

  async findPermissionByUserAndAttribute(userId, eventAttributeId) {
    return this.permissions.find(
      p => p.userId === userId && p.eventAttributeId === eventAttributeId
    ) || null;
  }

  async updatePermission(id, data) {
    const index = this.permissions.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.permissions[index],
      ...data,
      updatedAt: new Date(),
    };
    this.permissions[index] = updated;
    return updated;
  }

  async deletePermission(id) {
    const index = this.permissions.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.permissions.splice(index, 1);
    return true;
  }

  // ========== EVENT DATA ==========
  async createEventData(data) {
    const eventData = {
      id: this.generateId('eventData'),
      eventId: data.eventId,
      eventAttributeId: data.eventAttributeId,
      userId: data.userId,
      data: data.data,
      comment: data.comment || null,
      imageUrl: data.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.eventData.push(eventData);
    return eventData;
  }

  async findEventDataById(id) {
    return this.eventData.find(d => d.id === id) || null;
  }

  async findEventDataByAttributeId(attributeId) {
    return this.eventData.filter(d => d.eventAttributeId === attributeId);
  }

  async findEventDataByEventId(eventId) {
    return this.eventData.filter(d => d.eventId === eventId);
  }

  async updateEventData(id, data) {
    const index = this.eventData.findIndex(d => d.id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.eventData[index],
      ...data,
      updatedAt: new Date(),
    };
    this.eventData[index] = updated;
    return updated;
  }

  async deleteEventData(id) {
    const index = this.eventData.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.eventData.splice(index, 1);
    return true;
  }
}

// Instancia única compartida (en Netlify Functions, esto se reinicia entre invocaciones)
// Para un prototipo funciona, pero los datos no persisten entre reinicios
let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    dbInstance = new InMemoryDB();
  }
  return dbInstance;
}

module.exports = { getDB, InMemoryDB };

