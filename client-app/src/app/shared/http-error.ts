import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns an HttpErrorResponse into a message that can be shown to the user.
 *
 * The Express API always replies with { message: "..." } on failure, so the
 * server message is preferred. Network failures fall back to a generic text.
 *
 * @param error The error object from an RxJS subscribe() call.
 * @param fallback Message used when the server did not send one.
 * @returns A user friendly error message.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }

    const body = error.error as { message?: string } | string | null;

    if (body && typeof body === 'object' && body.message) {
      return body.message;
    }

    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }

    return fallback + ' (HTTP ' + error.status + ')';
  }

  return fallback;
}
