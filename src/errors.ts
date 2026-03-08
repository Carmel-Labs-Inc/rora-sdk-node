/**
 * Rora SDK Errors
 */

export class RoraError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'RoraError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class RoraAuthError extends RoraError {
  constructor(message = 'Invalid API key', details?: unknown) {
    super(message, 401, details);
    this.name = 'RoraAuthError';
  }
}

export class RoraNotFoundError extends RoraError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, details);
    this.name = 'RoraNotFoundError';
  }
}

export class RoraRateLimitError extends RoraError {
  constructor(message = 'Rate limit exceeded', details?: unknown) {
    super(message, 429, details);
    this.name = 'RoraRateLimitError';
  }
}
