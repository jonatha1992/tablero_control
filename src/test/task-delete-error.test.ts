import { describe, it, expect } from 'vitest';
import { ApiError } from '@/lib/api/errors';
import { messageFromTaskDeleteError } from '@/lib/api/task-delete-error';

describe('messageFromTaskDeleteError', () => {
  it('maps missing_permission from API body', () => {
    const err = new ApiError('forbidden (reason: missing_permission)', 403);
    expect(messageFromTaskDeleteError(err)).toContain('permisos');
  });

  it('maps wrong_location', () => {
    const err = new ApiError('forbidden (reason: wrong_location)', 403);
    expect(messageFromTaskDeleteError(err)).toContain('sector');
  });
});
