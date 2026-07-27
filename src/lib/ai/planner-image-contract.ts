export const PLANNER_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const PLANNER_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type PlannerImageMimeType = (typeof PLANNER_IMAGE_MIME_TYPES)[number];

export interface PlannerImagePayload {
  mimeType: PlannerImageMimeType;
  base64: string;
}

export function isPlannerImageMimeType(value: string): value is PlannerImageMimeType {
  return PLANNER_IMAGE_MIME_TYPES.includes(value as PlannerImageMimeType);
}
