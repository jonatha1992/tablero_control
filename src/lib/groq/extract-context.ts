import { teamService } from '@/services/team.service';
import { projectService } from '@/services/project.service';
import {
  cycleRepository,
  objectiveRepository,
  locationRepository,
  businessRepository,
} from '@/repositories';
import { DEFAULT_BOARD_NAME } from '@/lib/constants/default-board';
import { isArchivedProjectStatus } from '@/lib/tasks/active-entity';
import { resolveSpaceLabels } from '@/lib/terminology';

export interface ExtractContextItem {
  id: string;
  name: string;
  status?: string;
}

export interface ExtractContext {
  members: ExtractContextItem[];
  locations: ExtractContextItem[];
  projects: ExtractContextItem[];
  cycles: ExtractContextItem[];
  objectives: ExtractContextItem[];
  defaultProjectId?: string;
  activeCycleId?: string;
  siteLabel: string;
  today: string;
}

export async function loadExtractContext(businessId: string): Promise<ExtractContext> {
  const today = new Date().toISOString().split('T')[0];

  const [membersRaw, locationsRaw, projectsRaw, cyclesRaw, objectivesRaw, business] =
    await Promise.all([
      teamService.getMembersByBusiness(businessId),
      locationRepository.findByBusiness(businessId),
      projectService.getByBusiness(businessId),
      cycleRepository.findByBusiness(businessId),
      objectiveRepository.findByBusiness(businessId),
      businessRepository.findById(businessId),
    ]);

  const labels = resolveSpaceLabels(business?.settings);
  const activeProjects = projectsRaw.filter((project) => !isArchivedProjectStatus(project.status));
  const defaultProject =
    activeProjects.find((p) => p.name === DEFAULT_BOARD_NAME) ?? activeProjects[0];
  const activeCycle = cyclesRaw.find((c) => c.status === 'active');

  return {
    members: membersRaw.map((m) => ({ id: m.id, name: m.name })),
    locations: locationsRaw.map((l) => ({ id: l.id, name: l.name })),
    projects: projectsRaw.map((p) => ({ id: p.id, name: p.name, status: p.status })),
    cycles: cyclesRaw.map((c) => ({ id: c.id, name: c.name, status: c.status })),
    objectives: objectivesRaw.map((o) => ({ id: o.id, name: o.name, status: o.status })),
    defaultProjectId: defaultProject?.id,
    activeCycleId: activeCycle?.id,
    siteLabel: labels.site,
    today,
  };
}
