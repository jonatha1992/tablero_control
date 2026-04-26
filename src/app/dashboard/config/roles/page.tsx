import { redirect } from 'next/navigation';

// La sección de Roles y Permisos ahora está dentro de /dashboard/equipo/roles
export default function OldRolesRedirect() {
  redirect('/dashboard/equipo/roles');
}
