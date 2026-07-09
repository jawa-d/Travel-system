import { Role } from "@prisma/client";

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "مدير",
  UNDERWRITER: "مكتتب",
  FINANCE: "مالية",
  AGENT: "وكيل",
  VIEWER: "مشاهد"
};

const permissions = {
  dashboard: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT, Role.VIEWER],
  customersRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT, Role.VIEWER],
  customersWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.AGENT],
  customersDelete: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  policiesRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT, Role.VIEWER],
  plansWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  countriesWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  policiesWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  policiesManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  policiesDelete: [Role.SUPER_ADMIN],
  financeRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  motorAccountsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE],
  motorCommissionsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  motorCommissionsWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  claimsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT],
  claimsWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.AGENT],
  claimsManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  reportsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT],
  auditRead: [Role.SUPER_ADMIN, Role.ADMIN],
  notificationsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.VIEWER],
  endorsementsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.AGENT],
  endorsementsWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  cancellationsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT],
  cancellationsWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE],
  agencyRead: [Role.SUPER_ADMIN, Role.ADMIN],
  agentsManage: [Role.SUPER_ADMIN, Role.ADMIN],
  agentAccountsRead: [Role.SUPER_ADMIN],
  motorRequestsCreate: [Role.AGENT],
  motorRequestsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.AGENT],
  motorRequestsManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  motorRequestsEdit: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  motorRequestsDelete: [Role.SUPER_ADMIN],
  motorRequestsPricing: [Role.SUPER_ADMIN, Role.UNDERWRITER],
  motorRequestsTermsWrite: [Role.SUPER_ADMIN, Role.UNDERWRITER],
  motorRequestsTermsApprove: [Role.SUPER_ADMIN],
  motorRequestsApprovalAssets: [Role.SUPER_ADMIN, Role.UNDERWRITER],
  systemManage: [Role.SUPER_ADMIN, Role.ADMIN]
  ,lookupsManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER]
} as const;

export type Permission = keyof typeof permissions;

export function can(role: Role | undefined, permission: Permission) {
  return Boolean(role && (permissions[permission] as readonly Role[]).includes(role));
}
