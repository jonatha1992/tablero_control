'use client';

import { useState } from 'react';
import { Archive, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth-context';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useDeleteLocation, useUpdateLocation } from '@/hooks/mutations/use-locations';
import { SectorList } from '@/components/sectores/sector-list';
import { SectorModal } from '@/components/sectores/sector-modal';
import { SectorDetailModal } from '@/components/sectores/sector-detail-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Location } from '@/types/domain/location';
import { useSpaceLabels } from '@/hooks/use-space-labels';

export default function SectoresPage() {
  const { user, loading: authLoading } = useAuth();
  const businessId = user?.businessId || '';

  const { data: sectors = [], isLoading: queryLoading } = useLocationsQuery();
  const isLoading = authLoading || queryLoading;
  const deleteMutation = useDeleteLocation();
  const archiveMutation = useUpdateLocation();
  const labels = useSpaceLabels();
  const site = labels.site;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState<Location | undefined>();
  const [detailSector, setDetailSector] = useState<Location | null>(null);
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

  const handleArchiveConfirm = () => {
    if (!sectorToDelete) return;
    archiveMutation.mutate(
      { id: sectorToDelete.id, data: { status: 'closed' } },
      { onSettled: () => setSectorToDelete(null) }
    );
  };

  const taskCount = sectorToDelete?.taskIds.length ?? 0;
  const isPending = deleteMutation.isPending || archiveMutation.isPending;
  const taskCountLabel = `${taskCount} tarea${taskCount === 1 ? '' : 's'}`;

  return (
    <div className="space-y-6 h-full overflow-auto">
      {sectors.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleCreate} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva {site}
          </Button>
        </div>
      )}

      <SectorList
        sectors={sectors}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onSelect={(sector) => setDetailSector(sector)}
        onCreate={handleCreate}
        isLoading={isLoading}
      />

      <SectorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessId={businessId}
        location={selectedSector}
      />

      <SectorDetailModal
        sector={detailSector}
        open={!!detailSector}
        onClose={() => setDetailSector(null)}
        onEdit={(sector) => { setDetailSector(null); handleEdit(sector); }}
      />

      <Dialog open={!!sectorToDelete} onOpenChange={(open) => { if (!open && !isPending) setSectorToDelete(null); }}>
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(event) => {
            if (isPending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Archivar o eliminar {site.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {sectorToDelete
                ? `"${sectorToDelete.name}" tiene ${taskCountLabel} asociadas.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Archivar cambia el estado a <span className="font-medium text-foreground">cerrado</span> y
              oculta sus tareas activas de las vistas principales.
            </p>
            <p>
              Eliminar borra el {site.toLowerCase()} y también sus tareas asociadas de forma permanente.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:justify-between sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleArchiveConfirm}
              disabled={isPending}
              className="sm:w-auto"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archivar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
