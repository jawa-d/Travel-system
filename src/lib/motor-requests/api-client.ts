import { MotorPortalConfigurationError, MotorPortalUnavailableError } from "@/lib/motor-requests/errors";
import { motorPortalHeaders, motorPortalPath } from "@/lib/motor-requests/request-mapper";

export interface MotorPortalApiClient {
  get(path: string): Promise<unknown>;
}

export class FetchMotorPortalApiClient implements MotorPortalApiClient {
  constructor(private readonly config: { baseUrl?: string; apiKey?: string }) {}

  async get(path: string) {
    const baseUrl = this.config.baseUrl?.trim();
    const apiKey = this.config.apiKey?.trim();

    if (!baseUrl || !apiKey) throw new MotorPortalConfigurationError();

    const response = await fetch(new URL(motorPortalPath(path), baseUrl), {
      method: "GET",
      headers: motorPortalHeaders(apiKey),
      cache: "no-store"
    }).catch((error: unknown) => {
      throw new MotorPortalUnavailableError(error instanceof Error ? error.message : undefined);
    });

    if (!response.ok) throw new MotorPortalUnavailableError(`Motor Portal returned ${response.status}.`);

    return response.json();
  }
}
