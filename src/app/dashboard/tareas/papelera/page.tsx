import { redirect } from 'next/navigation';

export default function PapeleraRedirectPage() {
  redirect('/dashboard/tareas/archivadas');
}
