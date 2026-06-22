import { Role } from "@prisma/client";

export function isDirectAccessEnabled() {
  return process.env.DIRECT_ACCESS === "true";
}

export const directAccessUser = {
  id: "direct-access-user",
  name: "مدير تجريبي",
  email: "direct@trinsu.local",
  image: null,
  role: Role.SUPER_ADMIN
};
