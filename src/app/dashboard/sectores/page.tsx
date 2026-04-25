'use client';

import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth-context';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useDeleteLocation } from '@/hooks/mutations/use-locations';
import { SectorList } from '@/components/sectores/sector-list';
import { SectorModal } from '@/components/sectores/sector-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Location } from '@/types/domain/location';

export default function SectoresPage() {
  const { user, loading: authLoading } = useAuth();
  const businessId = user?.businessId || '';

  const { data: sectors = [], isLoading: queryLoading } = useLocationsQuery();
  const isLoading = authLoading || queryLoading;
  const deleteMutation = useDeleteLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Location | undefined>();
  const [sectorToDelete, setSectorToDelete] = useState<Location | null>(null);

  const handleEdit = (sector: Location) => {
    setSelectedSector(sector);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSector(undefined);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    const sector = sectors.find((s) => s.id === id);
    if (sector) setSectorToDelete(sector);
  };

  const handleDeleteConfirm = () => {
    if (!sectorToDelete) return;
    deleteMutation.mutate(
      { id: sectorToDelete.id, businessId },
      { onSettled: () => setSectorToDelete(null) }
    );
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
        onDelete={handleDeleteRequest}
        onCreate={handleCreate}
        isLoading={isLoading}
      />

      <SectorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
        location={selectedSector}
      />

      <ConfirmDialog
        open={!!sectorToDelete}
        onOpenChange={(open) => { if (!open) setSectorToDelete(null); }}
        title="Eliminar sector"
        description={`¿Estás seguro de eliminar "${sectorToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
