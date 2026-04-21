/**
 * Seed script para PostgreSQL
 * Uso: npm run seed:pg
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SUPERADMIN_ID = 'CLtfsgAw6fUYZVTxP1ad2lVPplG2';

// ─── IDs fijos para referencias cruzadas ─────────────────────────────────────

const BIZ1 = 'biz-restaurante-001';
const BIZ2 = 'biz-techstar-001';

const LOC = {
  b1_centro:  'loc-b1-centro',
  b1_norte:   'loc-b1-norte',
  b1_cocina:  'loc-b1-cocina',
  b2_devs:    'loc-b2-devs',
  b2_ventas:  'loc-b2-ventas',
};

const USR = {
  // Business 1 — Restaurante El Portal
  b1_admin:   'usr-b1-admin',
  b1_resp1:   'usr-b1-resp1',
  b1_resp2:   'usr-b1-resp2',
  b1_m1:      'usr-b1-m1',
  b1_m2:      'usr-b1-m2',
  b1_m3:      'usr-b1-m3',
  b1_viewer:  'usr-b1-viewer',
  // Business 2 — TechStar Solutions
  b2_admin:   'usr-b2-admin',
  b2_resp1:   'usr-b2-resp1',
  b2_resp2:   'usr-b2-resp2',
  b2_m1:      'usr-b2-m1',
  b2_m2:      'usr-b2-m2',
  b2_m3:      'usr-b2-m3',
  b2_m4:      'usr-b2-m4',
};

// ─── Limpieza ─────────────────────────────────────────────────────────────────

async function clean() {
  console.log('🧹 Limpiando datos anteriores...');
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.location.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany({ where: { id: { not: SUPERADMIN_ID } } });
  await prisma.business.deleteMany();
}

// ─── Negocios ─────────────────────────────────────────────────────────────────

async function seedBusinesses() {
  console.log('\n🏢 Creando negocios...');

  await prisma.business.createMany({
    data: [
      {
        id: BIZ1,
        name: 'Restaurante El Portal',
        plan: 'pro',
        status: 'active',
        adminId: USR.b1_admin,
        settings: { maxLocations: 10, maxUsers: 30, features: ['kanban', 'calendar', 'reports'], localeTypes: ['local', 'sector'] },
        featureFlags: { canExportReports: true },
      },
      {
        id: BIZ2,
        name: 'TechStar Solutions',
        plan: 'basic',
        status: 'active',
        adminId: USR.b2_admin,
        settings: { maxLocations: 5, maxUsers: 20, features: ['kanban', 'calendar'], localeTypes: ['area'] },
        featureFlags: {},
      },
    ],
  });
  console.log('  ✅ Restaurante El Portal [pro]');
  console.log('  ✅ TechStar Solutions [basic]');
}

// ─── Locales ──────────────────────────────────────────────────────────────────

async function seedLocations() {
  console.log('\n📍 Creando locales...');

  const locations = [
    { id: LOC.b1_centro,  businessId: BIZ1, name: 'Salón Principal',    type: 'local',   address: 'Av. Corrientes 1234, CABA',       managerId: USR.b1_resp1, status: 'active' as const, metadata: {} },
    { id: LOC.b1_norte,   businessId: BIZ1, name: 'Sucursal Norte',     type: 'local',   address: 'Av. Cabildo 3456, CABA',          managerId: USR.b1_resp2, status: 'active' as const, metadata: {} },
    { id: LOC.b1_cocina,  businessId: BIZ1, name: 'Cocina Central',     type: 'sector',  address: 'Av. Corrientes 1234, Subsuelo',   status: 'active' as const, metadata: {} },
    { id: LOC.b2_devs,    businessId: BIZ2, name: 'Equipo Desarrollo',  type: 'area',    address: 'Av. del Libertador 8000, CABA',   managerId: USR.b2_resp1, status: 'active' as const, metadata: {} },
    { id: LOC.b2_ventas,  businessId: BIZ2, name: 'Equipo Ventas',      type: 'area',    address: 'Av. del Libertador 8000, CABA',   managerId: USR.b2_resp2, status: 'active' as const, metadata: {} },
  ];

  for (const loc of locations) {
    await prisma.location.create({ data: loc });
    console.log(`  ✅ ${loc.name} (${loc.businessId === BIZ1 ? 'El Portal' : 'TechStar'})`);
  }
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('\n👥 Creando usuarios...');

  await prisma.user.update({
    where: { id: SUPERADMIN_ID },
    data: { role: 'superadmin', name: 'TecnoFusión Admin' },
  });
  console.log('  ✅ TecnoFusión Admin [superadmin]');

  const users = [
    // ── Restaurante El Portal ──
    { id: USR.b1_admin,  email: 'martin@elportal.com',    name: 'Martín Rodríguez',  role: 'admin'       as const, businessId: BIZ1, locationId: null },
    { id: USR.b1_resp1,  email: 'sofia@elportal.com',     name: 'Sofía Méndez',      role: 'responsable' as const, businessId: BIZ1, locationId: LOC.b1_centro },
    { id: USR.b1_resp2,  email: 'gabriel@elportal.com',   name: 'Gabriel Torres',    role: 'responsable' as const, businessId: BIZ1, locationId: LOC.b1_norte },
    { id: USR.b1_m1,     email: 'lucia@elportal.com',     name: 'Lucía Fernández',   role: 'miembro'     as const, businessId: BIZ1, locationId: LOC.b1_centro },
    { id: USR.b1_m2,     email: 'nicolas@elportal.com',   name: 'Nicolás Gómez',     role: 'miembro'     as const, businessId: BIZ1, locationId: LOC.b1_cocina },
    { id: USR.b1_m3,     email: 'valentina@elportal.com', name: 'Valentina López',   role: 'miembro'     as const, businessId: BIZ1, locationId: LOC.b1_norte },
    { id: USR.b1_viewer, email: 'contador@elportal.com',  name: 'Roberto Contador',  role: 'viewer'      as const, businessId: BIZ1, locationId: null },
    // ── TechStar Solutions ──
    { id: USR.b2_admin,  email: 'ana@techstar.io',        name: 'Ana Prieto',        role: 'admin'       as const, businessId: BIZ2, locationId: null },
    { id: USR.b2_resp1,  email: 'diego@techstar.io',      name: 'Diego Castillo',    role: 'responsable' as const, businessId: BIZ2, locationId: LOC.b2_devs },
    { id: USR.b2_resp2,  email: 'camila@techstar.io',     name: 'Camila Reyes',      role: 'responsable' as const, businessId: BIZ2, locationId: LOC.b2_ventas },
    { id: USR.b2_m1,     email: 'juan@techstar.io',       name: 'Juan Herrera',      role: 'miembro'     as const, businessId: BIZ2, locationId: LOC.b2_devs },
    { id: USR.b2_m2,     email: 'paula@techstar.io',      name: 'Paula Sosa',        role: 'miembro'     as const, businessId: BIZ2, locationId: LOC.b2_devs },
    { id: USR.b2_m3,     email: 'matias@techstar.io',     name: 'Matías Cruz',       role: 'miembro'     as const, businessId: BIZ2, locationId: LOC.b2_ventas },
    { id: USR.b2_m4,     email: 'florencia@techstar.io',  name: 'Florencia Vargas',  role: 'miembro'     as const, businessId: BIZ2, locationId: LOC.b2_devs },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, preferences: {}, isActive: true },
    });
    console.log(`  ✅ ${u.name} [${u.role}] — ${u.businessId === BIZ1 ? 'El Portal' : 'TechStar'}`);
  }
}

// ─── Equipos ──────────────────────────────────────────────────────────────────

async function seedTeams() {
  console.log('\n🤝 Creando equipos...');

  await prisma.team.create({
    data: {
      id: 'team-b1-salon',
      name: 'Equipo Salón',
      description: 'Personal del salón y atención al cliente',
      businessId: BIZ1,
      locationId: LOC.b1_centro,
      leadId: USR.b1_resp1,
      members: {
        create: [
          { userId: USR.b1_admin },
          { userId: USR.b1_resp1 },
          { userId: USR.b1_m1 },
          { userId: USR.b1_m3 },
        ],
      },
    },
  });
  console.log('  ✅ Equipo Salón — El Portal (4 miembros)');

  await prisma.team.create({
    data: {
      id: 'team-b1-cocina',
      name: 'Equipo Cocina',
      description: 'Brigada de cocina',
      businessId: BIZ1,
      locationId: LOC.b1_cocina,
      leadId: USR.b1_resp2,
      members: {
        create: [
          { userId: USR.b1_resp2 },
          { userId: USR.b1_m2 },
        ],
      },
    },
  });
  console.log('  ✅ Equipo Cocina — El Portal (2 miembros)');

  await prisma.team.create({
    data: {
      id: 'team-b2-dev',
      name: 'Desarrollo',
      description: 'Equipo de desarrollo de producto',
      businessId: BIZ2,
      locationId: LOC.b2_devs,
      leadId: USR.b2_resp1,
      members: {
        create: [
          { userId: USR.b2_admin },
          { userId: USR.b2_resp1 },
          { userId: USR.b2_m1 },
          { userId: USR.b2_m2 },
          { userId: USR.b2_m4 },
        ],
      },
    },
  });
  console.log('  ✅ Desarrollo — TechStar (5 miembros)');

  await prisma.team.create({
    data: {
      id: 'team-b2-ventas',
      name: 'Ventas',
      description: 'Equipo comercial',
      businessId: BIZ2,
      locationId: LOC.b2_ventas,
      leadId: USR.b2_resp2,
      members: {
        create: [
          { userId: USR.b2_resp2 },
          { userId: USR.b2_m3 },
        ],
      },
    },
  });
  console.log('  ✅ Ventas — TechStar (2 miembros)');
}

// ─── Tareas ───────────────────────────────────────────────────────────────────

async function seedTasks() {
  console.log('\n📋 Creando tareas...');

  type T = {
    title: string; description: string;
    status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    type: 'task' | 'bug' | 'feature';
    locationId: string; creatorId: string;
    assigneeIds: string[]; tags: string[]; position: number;
    dueDate?: Date;
  };

  const tasks: T[] = [
    // ── Restaurante El Portal ──
    { title: 'Renovar carta de temporada',        description: 'Actualizar menú con platos de otoño',                     status: 'in_progress', priority: 'high',   type: 'task',    locationId: LOC.b1_centro, creatorId: USR.b1_admin,  assigneeIds: [USR.b1_resp1, USR.b1_m1], tags: ['menu', 'temporada'], position: 0, dueDate: new Date('2026-05-01') },
    { title: 'Capacitar personal nuevo meseros',  description: 'Inducción para los 2 meseros que ingresan esta semana',   status: 'todo',        priority: 'urgent', type: 'task',    locationId: LOC.b1_centro, creatorId: USR.b1_resp1,  assigneeIds: [USR.b1_resp1],            tags: ['rrhh', 'capacitacion'], position: 0, dueDate: new Date('2026-04-22') },
    { title: 'Revisar stock de bodega',           description: 'Inventario mensual de vinos y bebidas',                   status: 'done',        priority: 'medium', type: 'task',    locationId: LOC.b1_centro, creatorId: USR.b1_resp1,  assigneeIds: [USR.b1_m1],               tags: ['inventario'], position: 1 },
    { title: 'Arreglar freidora sucursal norte',  description: 'La freidora 2 hace ruido extraño desde el martes',        status: 'todo',        priority: 'urgent', type: 'bug',     locationId: LOC.b1_norte,  creatorId: USR.b1_resp2,  assigneeIds: [],                        tags: ['mantenimiento', 'urgente'], position: 0, dueDate: new Date('2026-04-20') },
    { title: 'Diseñar nueva señalética',          description: 'Carteles para la remodelación del salón norte',           status: 'backlog',     priority: 'low',    type: 'feature', locationId: LOC.b1_norte,  creatorId: USR.b1_admin,  assigneeIds: [USR.b1_resp2],            tags: ['diseño', 'remodelacion'], position: 0 },
    { title: 'Preparar mise en place para evento', description: 'Evento corporativo 80 personas el sábado',              status: 'in_progress', priority: 'urgent', type: 'task',    locationId: LOC.b1_cocina, creatorId: USR.b1_resp2,  assigneeIds: [USR.b1_m2, USR.b1_m3],   tags: ['evento', 'cocina'], position: 0, dueDate: new Date('2026-04-19') },
    { title: 'Actualizar libro de novedades',     description: 'Digitalizar el registro de incidentes del mes pasado',   status: 'done',        priority: 'low',    type: 'task',    locationId: LOC.b1_centro, creatorId: USR.b1_m1,     assigneeIds: [USR.b1_m1],               tags: ['admin'], position: 2 },
    { title: 'Implementar sistema de reservas',   description: 'Evaluar software de reservas online (OpenTable, etc.)',  status: 'in_review',   priority: 'high',   type: 'feature', locationId: LOC.b1_centro, creatorId: USR.b1_admin,  assigneeIds: [USR.b1_admin],            tags: ['tecnologia', 'reservas'], position: 0 },
    // ── TechStar Solutions ──
    { title: 'Migrar API a Node 22',              description: 'Actualizar runtime y dependencias para Node 22 LTS',      status: 'in_progress', priority: 'high',   type: 'task',    locationId: LOC.b2_devs,   creatorId: USR.b2_admin,  assigneeIds: [USR.b2_m1, USR.b2_resp1], tags: ['backend', 'infra'], position: 0, dueDate: new Date('2026-04-25') },
    { title: 'Bug: login falla en Safari 17',     description: 'Reported by 3 clientes — problema con cookies SameSite', status: 'in_review',   priority: 'urgent', type: 'bug',     locationId: LOC.b2_devs,   creatorId: USR.b2_resp1,  assigneeIds: [USR.b2_m2],               tags: ['bug', 'auth', 'safari'], position: 0, dueDate: new Date('2026-04-19') },
    { title: 'Diseñar onboarding para nuevos usuarios', description: 'Flujo de bienvenida con tour interactivo',        status: 'todo',        priority: 'medium', type: 'feature', locationId: LOC.b2_devs,   creatorId: USR.b2_resp1,  assigneeIds: [USR.b2_m4],               tags: ['ux', 'onboarding'], position: 0 },
    { title: 'Preparar demo para cliente Acme',   description: 'Presentación del producto para Acme Corp el viernes',    status: 'in_progress', priority: 'urgent', type: 'task',    locationId: LOC.b2_ventas, creatorId: USR.b2_resp2,  assigneeIds: [USR.b2_resp2, USR.b2_m3], tags: ['ventas', 'demo'], position: 0, dueDate: new Date('2026-04-18') },
    { title: 'Escribir tests de integración',     description: 'Cobertura de endpoints críticos de pagos',               status: 'backlog',     priority: 'medium', type: 'task',    locationId: LOC.b2_devs,   creatorId: USR.b2_m1,     assigneeIds: [USR.b2_m1, USR.b2_m2],   tags: ['testing', 'calidad'], position: 1 },
    { title: 'Landing page Q2',                   description: 'Rediseño de la landing con nuevo branding',              status: 'backlog',     priority: 'medium', type: 'feature', locationId: LOC.b2_ventas, creatorId: USR.b2_admin,  assigneeIds: [USR.b2_m3],               tags: ['marketing', 'diseño'], position: 0 },
    { title: 'Documentar endpoints REST',         description: 'Swagger/OpenAPI completo para v2 de la API',             status: 'done',        priority: 'low',    type: 'task',    locationId: LOC.b2_devs,   creatorId: USR.b2_resp1,  assigneeIds: [USR.b2_m4],               tags: ['docs', 'api'], position: 2 },
    { title: 'Configurar alertas de monitoreo',   description: 'Datadog alerts para latencia y errores 5xx',             status: 'todo',        priority: 'high',   type: 'task',    locationId: LOC.b2_devs,   creatorId: USR.b2_admin,  assigneeIds: [USR.b2_resp1],            tags: ['infra', 'observabilidad'], position: 1, dueDate: new Date('2026-04-30') },
  ];

  for (const { assigneeIds, ...t } of tasks) {
    await prisma.task.create({
      data: {
        ...t,
        assignees: assigneeIds.length ? { connect: assigneeIds.map(id => ({ id })) } : undefined,
      },
    });
  }

  const byStatus = tasks.reduce((a, t) => ({ ...a, [t.status]: (a[t.status] || 0) + 1 }), {} as Record<string, number>);
  console.log(`  ✅ ${tasks.length} tareas creadas`);
  for (const [s, n] of Object.entries(byStatus)) console.log(`     ${s}: ${n}`);
}

// ─── Suscripciones ────────────────────────────────────────────────────────────

async function seedSubscriptions() {
  console.log('\n💳 Creando suscripciones...');

  await prisma.subscription.createMany({
    data: [
      {
        businessId: BIZ1, plan: 'pro', status: 'active', amount: 14900, currency: 'ARS',
        frequency: 'monthly',
        currentPeriodStart: new Date('2026-03-18'),
        currentPeriodEnd: new Date('2026-05-18'),
        nextBillingDate: new Date('2026-05-18'),
      },
      {
        businessId: BIZ2, plan: 'basic', status: 'active', amount: 7900, currency: 'ARS',
        frequency: 'monthly',
        currentPeriodStart: new Date('2026-04-01'),
        currentPeriodEnd: new Date('2026-05-01'),
        nextBillingDate: new Date('2026-05-01'),
      },
    ],
  });
  console.log('  ✅ El Portal — Pro $14.900/mes');
  console.log('  ✅ TechStar  — Basic $7.900/mes');
}

// ─── Audit logs de muestra ────────────────────────────────────────────────────

async function seedAuditLogs() {
  console.log('\n📋 Creando audit logs...');

  await prisma.auditLog.createMany({
    data: [
      { actorId: SUPERADMIN_ID,  actorRole: 'superadmin', businessId: BIZ1,  action: 'business.create',   targetType: 'business', targetId: BIZ1 },
      { actorId: SUPERADMIN_ID,  actorRole: 'superadmin', businessId: BIZ2,  action: 'business.create',   targetType: 'business', targetId: BIZ2 },
      { actorId: USR.b1_admin,   actorRole: 'admin',      businessId: BIZ1,  action: 'user.create',       targetType: 'user',     targetId: USR.b1_resp1 },
      { actorId: USR.b1_admin,   actorRole: 'admin',      businessId: BIZ1,  action: 'user.create',       targetType: 'user',     targetId: USR.b1_m1 },
      { actorId: USR.b2_admin,   actorRole: 'admin',      businessId: BIZ2,  action: 'user.create',       targetType: 'user',     targetId: USR.b2_m1 },
      { actorId: USR.b1_resp1,   actorRole: 'responsable',businessId: BIZ1,  action: 'task.create',       targetType: 'task',     targetId: 'task-001' },
      { actorId: USR.b2_resp1,   actorRole: 'responsable',businessId: BIZ2,  action: 'task.update',       targetType: 'task',     targetId: 'task-002', metadata: { field: 'status', from: 'todo', to: 'in_progress' } },
    ],
  });
  console.log('  ✅ 7 audit logs creados');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Seeding PostgreSQL — Tablero de Control');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await clean();
    await seedBusinesses();
    await seedLocations();
    await seedUsers();
    await seedTeams();
    await seedTasks();
    await seedSubscriptions();
    await seedAuditLogs();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed completado!');
    console.log('\n🏢 Negocios:');
    console.log('  • Restaurante El Portal  — 7 usuarios, 3 locales, 8 tareas, plan Pro');
    console.log('  • TechStar Solutions     — 7 usuarios, 2 áreas,  8 tareas, plan Basic');
    console.log('\n🔑 SuperAdmin: tecnofusion.it@gmail.com');
  } catch (err) {
    console.error('\n❌ Seed falló:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
