'use client';

import { useState } from 'react';
import { redirect } from 'next/navigation';
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

export function SectoresPageContent() {
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
  const [sectorToArchive, setSectorToArchive] = useState<Location | null>(null);
  const [sectorToDelete, setSectorToDelete] = useState<Location | null>(null);

  const handleEdit = (sector: Location) => {
    setSelectedSector(sector);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSector(undefined);
    setIsModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!sectorToArchive) return;
    archiveMutation.mutate(
      { id: sectorToArchive.id, data: { status: 'closed' } },
      { onSettled: () => setSectorToArchive(null) }
    );
  };

  const handleDeleteConfirm = () => {
    if (!sectorToDelete) return;
    deleteMutation.mutate(
      { id: sectorToDelete.id, businessId },
      { onSettled: () => setSectorToDelete(null) }
    );
  };

  const archiveTaskCount = sectorToArchive?.taskIds.length ?? 0;
  const deleteTaskCount = sectorToDelete?.taskIds.length ?? 0;
  const archivePending = archiveMutation.isPending;
  const deletePending = deleteMutation.isPending;
  const archiveTaskLabel = `${archiveTaskCount} tarea${archiveTaskCount === 1 ? '' : 's'}`;
  const deleteTaskLabel = `${deleteTaskCount} tarea${deleteTaskCount === 1 ? '' : 's'}`;

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
        onArchive={(sector) => setSectorToArchive(sector)}
        onDelete={(sector) => setSectorToDelete(sector)}
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

      <Dialog
        open={!!sectorToArchive}
        onOpenChange={(open) => { if (!open && !archivePending) setSectorToArchive(null); }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(event) => {
            if (archivePending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Archivar {site.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {sectorToArchive
                ? `"${sectorToArchive.name}" tiene ${archiveTaskLabel} asociadas.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Archivar cambia el estado a <span className="font-medium text-foreground">cerrado</span> y
            oculta sus tareas activas de las vistas principales. Podés reactivarla editándola después.
          </p>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSectorToArchive(null)}
              disabled={archivePending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleArchiveConfirm}
              disabled={archivePending}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!sectorToDelete}
        onOpenChange={(open) => { if (!open && !deletePending) setSectorToDelete(null); }}
      >
        <DialogContent
          className="sm:max-w-md"
          onInteractOutside={(event) => {
            if (deletePending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Eliminar {site.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {sectorToDelete
                ? `"${sectorToDelete.name}" tiene ${deleteTaskLabel} asociadas.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Esta acción es permanente: borra el {site.toLowerCase()} y también sus tareas asociadas.
          </p>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSectorToDelete(null)}
              disabled={deletePending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletePending}
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

export default function LegacySectoresPage() {
  redirect('/dashboard/sectores');
}
