import { ApiError } from './errors';
import { taskDeleteErrorMessage } from '@/lib/task-delete-access';

/** Parse DELETE task API error body into a user-facing message. */
export function messageFromTaskDeleteError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return err instanceof Error ? err.message : 'Error al eliminar la tarea';
  }
  if (err.status !== 403) return err.message;

  const match = err.message.match(/reason:\s*([a-z_]+)/i) ?? err.message.match(/\(([a-z_]+)\)/);
  const reason = match?.[1];
  if (reason) return taskDeleteErrorMessage(reason);

  if (/subscription_required/i.test(err.message)) {
    return taskDeleteErrorMessage('subscription_required');
  }
  if (/Forbidden/i.test(err.message)) {
    return taskDeleteErrorMessage('missing_permission');
  }
  if (/forbidden/i.test(err.message)) {
    return taskDeleteErrorMessage('wrong_location');
  }
  return taskDeleteErrorMessage();
}
