import { Prisma, Role } from "@prisma/client";

export type PolicyActor = { id: string; role: Role };

export function visiblePolicyWhere(user: PolicyActor, includeDeleted = false): Prisma.PolicyWhereInput {
  const ownership = user.role === Role.AGENT
    ? { OR: [{ issuedByUserId: user.id }, { issuedByUserId: null, issuedById: user.id }] }
    : {};
  return {
    ...ownership,
    ...(includeDeleted ? {} : { deletedAt: null })
  };
}

export function canAccessPolicy(user: PolicyActor, policy: { issuedByUserId: string | null; issuedById: string | null }) {
  return user.role !== Role.AGENT || policy.issuedByUserId === user.id || (!policy.issuedByUserId && policy.issuedById === user.id);
}
