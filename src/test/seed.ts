/**
 * Seed Script - Tablero de Control
 * 
 * Carga datos de prueba en Firebase Emulator para desarrollo local.
 * 
 * Uso:
 *   npm run seed
 * 
 * Requisitos:
 *   - Firebase Emulators corriendo (npm run emulators)
 *   - USE_FIREBASE_EMULATOR=true en el entorno
 */

import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, Timestamp } from 'firebase/firestore';

// Firebase config for emulator
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'gestordetrabajo.firebaseapp.com',
  projectId: 'gestordetrabajo',
  storageBucket: 'gestordetrabajo.firebasestorage.app',
  messagingSenderId: '478008899800',
  appId: '1:478008899800:web:a5618898a550dff9f67fad',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
connectFirestoreEmulator(db, 'localhost', 8080);

// --- Seed Data ---

const USERS = [
  // TecnoFusión - Dueños del sistema
  {
    uid: 'superadmin-001',
    email: 'tecnofusion.it@gmail.com',
    password: 'superadmin123',
    name: 'TecnoFusión Admin',
    role: 'superadmin' as const,
    businessId: null,
    locationId: null,
  },
  // Admin del negocio
  {
    uid: 'admin-001',
    email: 'admin@negocio.com',
    password: 'admin123',
    name: 'Admin Negocio',
    role: 'admin' as const,
    businessId: 'business-001',
    locationId: null,
  },
  // Responsables de locales
  {
    uid: 'resp-001',
    email: 'resp-local1@negocio.com',
    password: 'resp123',
    name: 'Carlos Responsable',
    role: 'responsable' as const,
    businessId: 'business-001',
    locationId: 'local-001',
  },
  {
    uid: 'resp-002',
    email: 'resp-local2@negocio.com',
    password: 'resp123',
    name: 'Laura Responsable',
    role: 'responsable' as const,
    businessId: 'business-001',
    locationId: 'local-002',
  },
  // Miembros de locales
  {
    uid: 'member-001',
    email: 'ana@negocio.com',
    password: 'ana123',
    name: 'Ana Miembro',
    role: 'miembro' as const,
    businessId: 'business-001',
    locationId: 'local-001',
  },
  {
    uid: 'member-002',
    email: 'pedro@negocio.com',
    password: 'pedro123',
    name: 'Pedro Miembro',
    role: 'miembro' as const,
    businessId: 'business-001',
    locationId: 'local-002',
  },
  // Viewer (solo lectura)
  {
    uid: 'viewer-001',
    email: 'viewer@negocio.com',
    password: 'viewer123',
    name: 'Viewer Solo',
    role: 'viewer' as const,
    businessId: 'business-001',
    locationId: 'local-001',
  },
];

const TEAMS = [
  {
    id: 'team-dev',
    businessId: 'business-001',
    name: 'Equipo de Desarrollo',
    description: 'Desarrollo frontend y backend',
    memberIds: ['member-001', 'member-002'],
    leadId: 'resp-001',
  },
  {
    id: 'team-design',
    businessId: 'business-001',
    name: 'Equipo de Diseño',
    description: 'UX/UI y diseño visual',
    memberIds: ['member-002'],
    leadId: 'resp-002',
  },
];

const PROJECTS = [
  {
    id: 'proj-web',
    name: 'Rediseño Web',
    description: 'Rediseño completo de la plataforma web',
    teamId: 'team-dev',
    status: 'active',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
  },
  {
    id: 'proj-mobile',
    name: 'App Móvil',
    description: 'Desarrollo de la aplicación móvil',
    teamId: 'team-dev',
    status: 'planning',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-09-30'),
  },
  {
    id: 'proj-design-system',
    name: 'Design System',
    description: 'Crear sistema de diseño unificado',
    teamId: 'team-design',
    status: 'active',
    startDate: new Date('2026-04-10'),
    endDate: new Date('2026-05-30'),
  },
];

const LOCATIONS = [
  {
    id: 'local-001',
    businessId: 'business-001',
    name: 'Sucursal Centro',
    type: 'local',
    description: 'Local principal en el centro',
    address: 'Av. Principal 123',
    managerId: 'resp-001',
    status: 'active' as const,
  },
  {
    id: 'local-002',
    businessId: 'business-001',
    name: 'Sucursal Norte',
    type: 'local',
    description: 'Local en zona norte',
    address: 'Calle Norte 456',
    managerId: 'resp-002',
    status: 'active' as const,
  },
  {
    id: 'sector-001',
    businessId: 'business-001',
    name: 'Depósito Central',
    type: 'sector',
    description: 'Área de almacenamiento principal',
    managerId: 'resp-001',
    status: 'active' as const,
  },
];

const TASKS = [
  // Proyecto: Rediseño Web
  { id: 'task-001', title: 'Diseñar mockups homepage', description: 'Crear mockups de alta fidelidad para la nueva homepage', status: 'in_progress', priority: 'high', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-001', projectId: 'proj-web', tags: ['design', 'ui'], dueDate: new Date('2026-04-15'), position: 0 },
  { id: 'task-002', title: 'Implementar nueva navbar', description: 'Navbar responsive con mega-menu', status: 'todo', priority: 'high', type: 'feature', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', projectId: 'proj-web', tags: ['frontend'], dueDate: new Date('2026-04-20'), position: 0 },
  { id: 'task-003', title: 'Configurar CI/CD pipeline', description: 'Pipeline de deploy automático con GitHub Actions', status: 'todo', priority: 'medium', type: 'task', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'sector-001', projectId: 'proj-web', tags: ['devops'], dueDate: new Date('2026-04-25'), position: 1 },
  { id: 'task-004', title: 'Fix: login con Google no funciona', description: 'El auth con Google falla en Safari', status: 'in_review', priority: 'urgent', type: 'bug', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', projectId: 'proj-web', tags: ['bug', 'auth'], dueDate: new Date('2026-04-14'), position: 0 },
  { id: 'task-005', title: 'Documentar API endpoints', description: 'Documentación OpenAPI/Swagger de todos los endpoints', status: 'done', priority: 'low', type: 'documentation', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'sector-001', projectId: 'proj-web', tags: ['docs'], dueDate: new Date('2026-04-10'), completedDate: new Date('2026-04-09'), position: 0 },
  { id: 'task-006', title: 'Optimizar queries de Firestore', description: 'Las queries de la lista de tareas son lentas', status: 'in_progress', priority: 'high', type: 'improvement', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-002', projectId: 'proj-web', tags: ['backend', 'performance'], dueDate: new Date('2026-04-18'), position: 1 },
  { id: 'task-007', title: 'Crear componente de tabla', description: 'Tabla reutilizable con sorting y filtering', status: 'backlog', priority: 'medium', type: 'feature', assigneeIds: [], creatorId: 'resp-001', locationId: 'local-001', projectId: 'proj-web', tags: ['frontend', 'ui'], dueDate: new Date('2026-05-01'), position: 0 },
  { id: 'task-008', title: 'Test unitarios de auth', description: 'Tests para login, register, logout', status: 'backlog', priority: 'medium', type: 'task', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'sector-001', projectId: 'proj-web', tags: ['test'], dueDate: new Date('2026-05-05'), position: 1 },

  // Proyecto: App Móvil
  { id: 'task-009', title: 'Definir arquitectura móvil', description: 'Elegir entre React Native, Flutter o nativo', status: 'todo', priority: 'high', type: 'task', assigneeIds: ['member-001', 'member-002'], creatorId: 'resp-001', locationId: 'local-001', projectId: 'proj-mobile', tags: ['architecture'], dueDate: new Date('2026-05-10'), position: 0 },
  { id: 'task-010', title: 'Wireframes app móvil', description: 'Wireframes de las pantallas principales', status: 'backlog', priority: 'medium', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', projectId: 'proj-mobile', tags: ['design', 'ux'], dueDate: new Date('2026-05-15'), position: 0 },
  { id: 'task-011', title: 'Setup proyecto React Native', description: 'Configurar proyecto con TypeScript y navigation', status: 'backlog', priority: 'low', type: 'task', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', projectId: 'proj-mobile', tags: ['mobile'], dueDate: new Date('2026-05-20'), position: 0 },

  // Proyecto: Design System
  { id: 'task-012', title: 'Definir tokens de diseño', description: 'Colores, tipografía, spacing, shadows', status: 'in_progress', priority: 'high', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', projectId: 'proj-design-system', tags: ['design', 'tokens'], dueDate: new Date('2026-04-20'), position: 0 },
  { id: 'task-013', title: 'Crear componentes base', description: 'Button, Input, Card, Modal, Tooltip', status: 'todo', priority: 'high', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', projectId: 'proj-design-system', tags: ['ui', 'components'], dueDate: new Date('2026-05-01'), position: 0 },
  { id: 'task-014', title: 'Documentar Design System', description: 'Storybook con todos los componentes', status: 'backlog', priority: 'medium', type: 'documentation', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', projectId: 'proj-design-system', tags: ['docs'], dueDate: new Date('2026-05-15'), position: 0 },
  { id: 'task-015', title: 'Icon set personalizado', description: 'Crear set de iconos SVG para el proyecto', status: 'blocked', priority: 'medium', type: 'feature', assigneeIds: ['member-002'], creatorId: 'resp-002', locationId: 'local-002', projectId: 'proj-design-system', tags: ['design', 'icons'], dueDate: new Date('2026-04-25'), position: 0 },

  // Tareas generales (sin proyecto)
  { id: 'task-016', title: 'Revisar y actualizar dependencias', description: 'Actualizar npm packages a últimas versiones', status: 'todo', priority: 'low', type: 'improvement', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'local-001', projectId: undefined, tags: ['maintenance'], dueDate: new Date('2026-04-30'), position: 0 },
  { id: 'task-017', title: 'Configurar monitoring y alertas', description: 'Setup Sentry + Firebase Performance', status: 'todo', priority: 'medium', type: 'task', assigneeIds: ['member-001'], creatorId: 'resp-001', locationId: 'sector-001', projectId: undefined, tags: ['devops', 'monitoring'], dueDate: new Date('2026-04-22'), position: 1 },
  { id: 'task-018', title: 'Onboarding nuevo miembro', description: 'Preparar documentación de onboarding', status: 'in_progress', priority: 'high', type: 'documentation', assigneeIds: ['resp-001'], creatorId: 'admin-001', locationId: 'local-001', projectId: undefined, tags: ['docs', 'onboarding'], dueDate: new Date('2026-04-16'), position: 0 },
];

const ALERTS = [
  {
    id: 'alert-001',
    type: 'deadline_approaching',
    severity: 'high',
    title: 'Deadline próximo: Fix login Google',
    message: 'La tarea "Fix: login con Google no funciona" vence mañana y está en revisión.',
    taskId: 'task-004',
    projectId: 'proj-web',
    resolved: false,
  },
  {
    id: 'alert-002',
    type: 'blocked',
    severity: 'medium',
    title: 'Tarea bloqueada: Icon set personalizado',
    message: 'La tarea lleva 3 días en estado bloqueada sin resolución.',
    taskId: 'task-015',
    projectId: 'proj-design-system',
    resolved: false,
  },
  {
    id: 'alert-003',
    type: 'workload_imbalance',
    severity: 'low',
    title: 'Desequilibrio de carga',
    message: 'Ana tiene 8 tareas asignadas mientras Pedro tiene 1.',
    resolved: false,
  },
];

// --- Seed Functions ---

async function seedUsers() {
  console.log('\n👥 Creating users...');
  
  for (const u of USERS) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, u.email, u.password);
      
      // Update display name
      await updateProfile(userCredential.user, { displayName: u.name });
      
      // Create Firestore user document
      await setDoc(doc(db, 'users', u.uid), {
        name: u.name,
        email: u.email,
        role: u.role,
        businessId: u.businessId,
        locationId: u.locationId,
        avatar: null,
        phone: null,
        teamIds: u.role === 'miembro' ? ['team-dev'] : [],
        preferences: {
          theme: 'system',
          locale: 'es',
          timezone: 'America/Argentina/Buenos_Aires',
          notifications: { email: true, push: true, agentReports: true, agentAlerts: true },
          dashboardLayout: [],
        },
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      console.log(`  ✅ ${u.name} (${u.email}) [${u.role}]`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ❌ ${u.email}: ${message}`);
    }
  }
}

async function seedTeams() {
  console.log('\n🏢 Creating teams...');
  
  for (const team of TEAMS) {
    await setDoc(doc(db, 'teams', team.id), {
      name: team.name,
      description: team.description,
      businessId: team.businessId,
      memberIds: team.memberIds,
      leadId: team.leadId,
      settings: {
        defaultTaskPriority: 'medium',
        workingHours: { start: '09:00', end: '18:00' },
        sprintDuration: 14,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✅ ${team.name}`);
  }
}

async function seedProjects() {
  console.log('\n📁 Creating projects...');
  
  for (const project of PROJECTS) {
    await setDoc(doc(db, 'projects', project.id), {
      name: project.name,
      description: project.description,
      teamId: project.teamId,
      status: project.status,
      taskIds: [],
      startDate: Timestamp.fromDate(project.startDate),
      endDate: Timestamp.fromDate(project.endDate),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✅ ${project.name} [${project.status}]`);
  }
}

async function seedTasks() {
  console.log('\n📋 Creating tasks...');
  
  let count = 0;
  for (const task of TASKS) {
    const taskData: Record<string, unknown> = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      assigneeIds: task.assigneeIds,
      creatorId: task.creatorId,
      tags: task.tags,
      position: task.position,
      subtaskIds: [],
      attachmentUrls: [],
      commentCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    if (task.projectId) taskData.projectId = task.projectId;
    if (task.dueDate) taskData.dueDate = Timestamp.fromDate(task.dueDate);
    if (task.completedDate) taskData.completedDate = Timestamp.fromDate(task.completedDate);
    
    await setDoc(doc(db, 'tasks', task.id), taskData);
    count++;
  }
  console.log(`  ✅ ${count} tasks created`);
  
  // Summary by status
  const byStatus: Record<string, number> = {};
  for (const t of TASKS) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
  }
  console.log('\n  Status breakdown:');
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`    ${status}: ${count}`);
  }
}

async function seedAlerts() {
  console.log('\n🚨 Creating alerts...');
  
  for (const alert of ALERTS) {
    await setDoc(doc(db, 'alerts', alert.id), {
      ...alert,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✅ ${alert.title} [${alert.severity}]`);
  }
}

// --- Main ---

async function main() {
  console.log('🚀 Seeding Firebase Emulator...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Seed business (multi-tenant)
    console.log('\n🏢 Creating business...');
    await setDoc(doc(db, 'businesses', 'business-001'), {
      name: 'Mi Negocio Demo',
      plan: 'pro',
      status: 'active',
      adminId: 'admin-001',
      locationIds: ['local-001', 'local-002', 'sector-001'],
      teamIds: ['team-dev', 'team-design'],
      featureFlags: { canExportReports: true },
      settings: {
        maxLocations: 20,
        maxUsers: 50,
        features: ['kanban', 'calendar', 'reports', 'alerts'],
        localeTypes: ['local', 'sector', 'area'],
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Roles del sistema para business-001
    console.log('\n🛡️ Creating system roles...');
    const SYSTEM_ROLES = [
      { id: 'role-admin',       name: 'Admin',       slug: 'admin',       baseRole: 'responsable', color: '#6366f1', isSystem: true, isActive: true },
      { id: 'role-responsable', name: 'Responsable', slug: 'responsable', baseRole: 'responsable', color: '#8b5cf6', isSystem: true, isActive: true },
      { id: 'role-miembro',     name: 'Miembro',     slug: 'miembro',     baseRole: 'miembro',     color: '#22c55e', isSystem: true, isActive: true },
      { id: 'role-viewer',      name: 'Viewer',      slug: 'viewer',      baseRole: 'viewer',      color: '#64748b', isSystem: true, isActive: true },
    ];
    for (const r of SYSTEM_ROLES) {
      await setDoc(doc(db, 'businesses', 'business-001', 'roles', r.id), {
        ...r,
        businessId: 'business-001',
        description: '',
        scope: { type: 'business' },
        permissions: {},
        userCount: 0,
        createdBy: 'system',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`  ✅ ${r.name}`);
    }
    console.log('  ✅ Mi Negocio Demo [pro]');

    // Seed locations
    console.log('\n📍 Creating locations...');
    for (const loc of LOCATIONS) {
      await setDoc(doc(db, 'locations', loc.id), {
        ...loc,
        taskIds: [],
        metadata: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      console.log(`  ✅ ${loc.name} [${loc.type}]`);
    }

    await seedUsers();
    await seedTeams();
    await seedProjects();
    await seedTasks();
    await seedAlerts();

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Seed completed successfully!');
    console.log('\n📧 Test credentials:');
    console.log('  SuperAdmin: tecnofusion.it@gmail.com / superadmin123');
    console.log('  Admin:      admin@negocio.com / admin123');
    console.log('  Responsable: resp-local1@negocio.com / resp123');
    console.log('  Miembro:    ana@negocio.com / ana123');
    console.log('  Viewer:     viewer@negocio.com / viewer123');
    console.log('\n🔥 Emulator UI: http://localhost:4000');
    console.log('🌐 App: http://localhost:3000\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
