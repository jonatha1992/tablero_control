'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useProjectsQuery } from '@/hooks/queries/use-projects-query';
import { useCyclesQuery } from '@/hooks/queries/use-cycles-query';
import { useObjectivesQuery } from '@/hooks/queries/use-objectives-query';
import { useScrumUIStore } from '@/stores/scrum-ui.store';
import { DEFAULT_BOARD_NAME } from '@/lib/constants/default-board';
import type { ConfirmTasksOptions } from '@/hooks/mutations/use-dictate-tasks';

export function useTaskPreviewContext() {
  const { user } = useAuth();
  const businessId = user?.businessId ?? '';
  const selectedSprintId = useScrumUIStore((s) => s.selectedSprintId);

  const { data: membersData } = useMembersQuery();
  const { data: locationsData = [] } = useLocationsQuery();
  const { data: projectsData = [] } = useProjectsQuery(businessId);
  const { data: cyclesData = [] } = useCyclesQuery(businessId);
  const { data: objectivesData = [] } = useObjectivesQuery(businessId);

  const members = useMemo(
    () => (membersData ?? []).map((m) => ({ id: m.id, name: m.name })),
    [membersData],
  );
  const locations = useMemo(
    () => locationsData.map((l) => ({ id: l.id, name: l.name })),
    [locationsData],
  );
  const projects = useMemo(
    () => projectsData.map((p) => ({ id: p.id, name: p.name })),
    [projectsData],
  );
  const cycles = useMemo(
    () => cyclesData.map((c) => ({ id: c.id, name: c.name })),
    [cyclesData],
  );
  const objectives = useMemo(
    () => objectivesData.map((o) => ({ id: o.id, name: o.name })),
    [objectivesData],
  );

  const confirmOptions: ConfirmTasksOptions = useMemo(() => {
    const defaultProjectId =
      projectsData.find((p) => p.name === DEFAULT_BOARD_NAME)?.id ?? projectsData[0]?.id;
    const activeCycleId = cyclesData.find((c) => c.status === 'active')?.id;
    return {
      defaultProjectId,
      defaultCycleId: selectedSprintId ?? activeCycleId,
    };
  }, [projectsData, cyclesData, selectedSprintId]);

  return {
    members,
    locations,
    projects,
    cycles,
    objectives,
    confirmOptions,
  };
}
