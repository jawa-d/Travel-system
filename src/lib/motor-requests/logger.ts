export function logMotorRequestInfo(message: string, details?: Record<string, unknown>) {
  console.log(`[motor-requests] ${message}`, details ?? {});
}

export function logMotorRequestWarn(message: string, details?: Record<string, unknown>) {
  console.warn(`[motor-requests] ${message}`, details ?? {});
}

export function logMotorRequestError(message: string, error: unknown, details?: Record<string, unknown>) {
  console.error(`[motor-requests] ${message}`, {
    ...details,
    error: error instanceof Error ? { name: error.name, message: error.message } : error
  });
}
