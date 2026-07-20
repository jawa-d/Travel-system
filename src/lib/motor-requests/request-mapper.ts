export function motorPortalHeaders(apiKey: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    "x-api-key": apiKey
  };
}

export function motorPortalPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}
