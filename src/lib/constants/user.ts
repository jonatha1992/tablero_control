import type { UserRole } from '@/types/domain/user';

/** Labels for business membership roles (team / empresa). */
export const BUSINESS_ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin (sistema)',
  admin: 'Administrador',
  responsable: 'Responsable',
  miembro: 'Miembro',
  viewer: 'Visualizador',
  pending: 'Pendiente',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin (sistema)',
  admin: 'Administrador',
  responsable: 'Responsable',
  miembro: 'Miembro',
  viewer: 'Solo lectura',
  pending: 'Pendiente',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-red-100 text-red-700 border-red-200',
  responsable: 'bg-blue-100 text-blue-700 border-blue-200',
  miembro: 'bg-green-100 text-green-700 border-green-200',
  viewer: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
};
