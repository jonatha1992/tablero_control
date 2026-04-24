'use client';

import { useState } from 'react';
import { MapPin, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth-context';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useDeleteLocation } from '@/hooks/mutations/use-locations';
import { SectorList } from '@/components/sectores/sector-list';
import { SectorModal } from '@/components/sectores/sector-modal';
import type { Location } from '@/types/domain/location';

export default function SectoresPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const businessId = user?.businessId || '';
  
  const { data: sectors = [], isLoading } = useLocationsQuery();
  const deleteMutation = useDeleteLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Location | undefined>();

  const canManage = isSuperAdmin || isAdmin;

  const handleEdit = (sector: Location) => {
    setSelectedSector(sector);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSector(undefined);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este sector? Esta acción no se puede deshacer.')) {
      deleteMutation.mutate({ id, businessId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Departamento
        </Button>
      </div>

      <SectorList 
        sectors={sectors} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        onCreate={handleCreate}
        isLoading={isLoading}
      />

      <SectorModal 
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
        location={selectedSector}
      />
    </div>
  );
}
