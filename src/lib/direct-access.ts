import { Role } from "@prisma/client";

let warnedAboutProductionDemo = false;

export function isDemoModeEnabled() {
  const requested = process.env.NODE_ENV === "development" || process.env.DEMO_MODE === "true";
  if (process.env.NODE_ENV === "production") {
    if (requested && !warnedAboutProductionDemo) {
      warnedAboutProductionDemo = true;
      console.warn("[security] Demo mode is disabled in production");
    }
    return false;
  }
  return requested;
}

export function isDirectAccessEnabled() {
  return isDemoModeEnabled() && process.env.DIRECT_ACCESS === "true";
}

export const directAccessUser = {
  id: "direct-access-user",
  name: "مدير تجريبي",
  email: "direct@trinsu.local",
  image: null,
  role: Role.SUPER_ADMIN
};
