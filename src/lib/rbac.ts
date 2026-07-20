import { Role } from "@prisma/client";

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "مدير",
  UNDERWRITER: "مكتتب",
  FINANCE: "مالية",
  AGENT: "وكيل",
  BANK: "صلاحية البنوك",
  VIEWER: "مشاهد"
};

const permissions = {
  dashboard: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.AGENT, Role.BANK, Role.VIEWER],
  referralsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.BANK],
  referralsCreate: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.BANK],
  referralsManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  referralsDelete: [Role.SUPER_ADMIN],
  referralCommissionsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.BANK],
  referralCommissionsWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  referralReportsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE],
  reportRequestsCreate: [Role.BANK],
  reportRequestsRead: [Role.BANK],
  reportRequestsManage: [Role.SUPER_ADMIN],
  motorRequestsCreate: [],
  motorRequestsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  motorRequestsManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  motorRequestsEdit: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER],
  motorRequestsDelete: [Role.SUPER_ADMIN],
  motorRequestsPricing: [Role.SUPER_ADMIN, Role.UNDERWRITER],
  motorRequestsTermsWrite: [Role.SUPER_ADMIN, Role.UNDERWRITER],
  motorRequestsTermsApprove: [Role.SUPER_ADMIN],
  motorRequestsApprovalAssets: [Role.SUPER_ADMIN, Role.UNDERWRITER],
  motorAccountsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE],
  motorCommissionsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  motorCommissionsWrite: [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE],
  notificationsRead: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER, Role.FINANCE, Role.VIEWER],
  auditRead: [Role.SUPER_ADMIN, Role.ADMIN],
  agentsManage: [Role.SUPER_ADMIN, Role.ADMIN],
  systemManage: [Role.SUPER_ADMIN, Role.ADMIN],
  lookupsManage: [Role.SUPER_ADMIN, Role.ADMIN, Role.UNDERWRITER]
} as const;

export type Permission = keyof typeof permissions;

export function can(role: Role | undefined, permission: Permission) {
  return Boolean(role && (permissions[permission] as readonly Role[]).includes(role));
}
