import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';

const SYSTEM_ROLES = [
  { id: 'role-admin',       name: 'Admin',       slug: 'admin',       baseRole: 'responsable', color: '#6366f1' },
  { id: 'role-responsable', name: 'Responsable', slug: 'responsable', baseRole: 'responsable', color: '#8b5cf6' },
  { id: 'role-miembro',     name: 'Miembro',     slug: 'miembro',     baseRole: 'miembro',     color: '#22c55e' },
  { id: 'role-viewer',      name: 'Viewer',      slug: 'viewer',      baseRole: 'viewer',      color: '#64748b' },
] as const;

export async function initSystemRoles(businessId: string): Promise<void> {
  const db = getAdminFirestore();
  const batch = db.batch();
  for (const r of SYSTEM_ROLES) {
    const ref = db.doc(`businesses/${businessId}/roles/${r.id}`);
    batch.set(ref, {
      ...r,
      businessId,
      description: '',
      scope: { type: 'business' },
      permissions: {},
      isActive: true,
      isSystem: true,
      userCount: 0,
      createdBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}
