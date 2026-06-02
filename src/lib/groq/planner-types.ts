import type { ExtractedTask } from './extract-tasks';
import type { GeneratedPlan } from './generate-plan';

export type PlannerResponse =
  | { type: 'message'; content: string }
  | { type: 'clarify'; question: string; options?: string[]; field: string }
  | { type: 'preview_tasks'; tasks: ExtractedTask[]; parseError: boolean }
  | {
      type: 'preview_plan';
      planType: 'cycle' | 'objective';
      description: string;
      plan: GeneratedPlan;
    }
  | { type: 'query' };
