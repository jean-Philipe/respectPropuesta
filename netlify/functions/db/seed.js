const bcrypt = require('bcryptjs');

async function seed(db) {
  // Verificar si ya hay datos
  const existingUsers = await db.findAllUsers();
  if (existingUsers.length > 0) {
    return; // Ya está inicializado
  }

  // Crear usuarios admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await db.createUser({
    email: 'admin@respect.com',
    password: adminPassword,
    name: 'Administrador',
    role: 'ADMIN',
  });

  // Crear usuarios empleados
  const employeePassword = await bcrypt.hash('empleado123', 10);
  
  const maria = await db.createUser({
    email: 'maria@respect.com',
    password: employeePassword,
    name: 'María González',
    role: 'EMPLOYEE',
  });

  const juan = await db.createUser({
    email: 'juan@respect.com',
    password: employeePassword,
    name: 'Juan Pérez',
    role: 'EMPLOYEE',
  });

  // Crear un evento de ejemplo
  const evento = await db.createEvent({
    name: 'EtMday',
    description: 'Evento de ejemplo para demostración',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-03'),
    dynamicFields: {
      ubicacion: 'Centro de Convenciones',
      capacidad: 5000,
      tipo: 'Conferencia',
    },
  });

  // Crear atributos para el evento
  const generadores = await db.createEventAttribute({
    eventId: evento.id,
    name: 'generadores',
    dataType: 'TEXT',
    allowImage: true,
    description: 'Generadores de energía del evento',
  });

  const camiones = await db.createEventAttribute({
    eventId: evento.id,
    name: 'camiones',
    dataType: 'TEXT',
    allowImage: true,
    description: 'Camiones utilizados en el evento',
  });

  const banos = await db.createEventAttribute({
    eventId: evento.id,
    name: 'baños',
    dataType: 'NUMBER',
    allowImage: false,
    description: 'Cantidad de baños portátiles',
  });

  // Asignar permisos
  await db.createOrUpdatePermission({
    userId: maria.id,
    eventAttributeId: generadores.id,
    canCreate: true,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  });

  await db.createOrUpdatePermission({
    userId: juan.id,
    eventAttributeId: generadores.id,
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
  });

  await db.createOrUpdatePermission({
    userId: juan.id,
    eventAttributeId: banos.id,
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
  });

  // Crear un proveedor de ejemplo
  const proveedor = await db.createProvider({
    name: 'Proveedor de Energía Sostenible',
    email: 'contacto@energia-sostenible.com',
    phone: '+34 123 456 789',
    dynamicFields: {
      especialidad: 'Energía solar',
      añosExperiencia: 10,
      certificaciones: ['ISO 14001', 'ISO 50001'],
    },
  });

  // Asociar proveedor al evento
  await db.createEventProvider(evento.id, proveedor.id);
}

module.exports = seed;

