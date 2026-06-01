import { taskRepository, cycleRepository } from '@/repositories';
import { loadExtractContext } from '@/lib/groq/extract-context';
import type { AssistantContext, TaskSummary } from '@/lib/groq/assistant';
import { DEFAULT_BOARD_NAME } from '@/lib/constants/default-board';

interface BuildContextInput {
  businessId?: string;
  userName: string;
  userRole: string;
  businessName?: string;
}

export async function buildAssistantContext(input: BuildContextInput): Promise<AssistantContext> {
  const today = new Date().toISOString().split('T')[0];
  let taskSummaries: TaskSummary[] = [];
  let activeCycleName: string | undefined;
  let enrichment: Partial<AssistantContext> = {};

  if (input.businessId) {
    try {
      const [tasks, cycles, extractCtx] = await Promise.all([
        taskRepository.findAll(input.businessId),
        cycleRepository.findByBusiness(input.businessId),
        loadExtractContext(input.businessId),
      ]);

      const cycleMap = new Map(cycles.map((c) => [c.id, c.name]));
      activeCycleName = cycles.find((c) => c.status === 'active')?.name;

      const sorted = [
        ...tasks.filter((t) => t.status !== 'done'),
        ...tasks.filter((t) => t.status === 'done').slice(0, 20),
      ].slice(0, 100);

      taskSummaries = sorted.map((t): TaskSummary => {
        const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : undefined;
        return {
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: dueDateStr,
          assignees: (t.assignees ?? []).map((a) => a.name),
          cycleName: t.cycleId ? cycleMap.get(t.cycleId) : undefined,
          isOverdue: !!dueDateStr && dueDateStr < today && t.status !== 'done',
        };
      });

      const defaultProject = extractCtx.projects.find((p) => p.name === DEFAULT_BOARD_NAME);

      enrichment = {
        siteLabel: extractCtx.siteLabel,
        locations: extractCtx.locations,
        projects: extractCtx.projects,
        cycles: extractCtx.cycles,
        objectives: extractCtx.objectives,
        defaultProjectName: defaultProject?.name ?? extractCtx.projects[0]?.name,
      };
    } catch {
      // non-fatal
    }
  }

  return {
    userName: input.userName,
    userRole: input.userRole,
    businessName: input.businessName,
    activeCycleName,
    tasks: taskSummaries,
    today,
    ...enrichment,
  };
}
