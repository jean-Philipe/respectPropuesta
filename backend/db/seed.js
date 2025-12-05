const db = require('./index');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Iniciando seed...');

  // Crear usuarios admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await db.createUser({
    email: 'admin@respect.com',
    password: adminPassword,
    name: 'Administrador',
    role: 'ADMIN',
  });

  console.log('✅ Admin creado:', admin.email);

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

  console.log('✅ Empleados creados:', maria.email, juan.email);

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

  console.log('✅ Evento creado:', evento.name);

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

  console.log('✅ Atributos creados para el evento');

  // Asignar permisos
  // María solo puede crear en generadores
  await db.createOrUpdatePermission({
    userId: maria.id,
    eventAttributeId: generadores.id,
    canCreate: true,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  });

  // Juan puede modificar generadores y baños
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

  console.log('✅ Permisos asignados');

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

  console.log('✅ Proveedor creado:', proveedor.name);

  // Asociar proveedor al evento
  await db.createEventProvider(evento.id, proveedor.id);

  console.log('✅ Proveedor asociado al evento');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('Admin: admin@respect.com / admin123');
  console.log('María: maria@respect.com / empleado123');
  console.log('Juan: juan@respect.com / empleado123');
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seed().catch(console.error);
}

module.exports = seed;

