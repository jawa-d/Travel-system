import { logMotorRequestError, logMotorRequestWarn } from "@/lib/motor-requests/logger";

export class MotorPortalConfigurationError extends Error {
  constructor(message = "Motor Portal API is not configured.") {
    super(message);
    this.name = "MotorPortalConfigurationError";
  }
}

export class MotorPortalUnavailableError extends Error {
  constructor(message = "Motor Portal API is unavailable.") {
    super(message);
    this.name = "MotorPortalUnavailableError";
  }
}

export class MotorRequestNotFoundError extends Error {
  constructor(message = "Motor request not found.") {
    super(message);
    this.name = "MotorRequestNotFoundError";
  }
}

export function shouldFallbackToMock(error: unknown) {
  return error instanceof MotorPortalConfigurationError || error instanceof MotorPortalUnavailableError;
}

export function handleMotorRepositoryError(stage: string, error: unknown) {
  if (shouldFallbackToMock(error)) {
    logMotorRequestWarn(`${stage}; falling back to mock provider`, {
      reason: error instanceof Error ? error.message : String(error)
    });
    return;
  }

  logMotorRequestError(stage, error);
  throw error;
}
