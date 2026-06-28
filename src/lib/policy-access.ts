import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PolicyActor = { id: string; role: Role };

function ownedPolicyWhere(user: PolicyActor): Prisma.PolicyWhereInput {
  return { OR: [{ issuedByUserId: user.id }, { issuedByUserId: null, issuedById: user.id }] };
}

function isOwnerScoped(user: PolicyActor) {
  return user.role === Role.AGENT;
}

export function visiblePolicyWhere(user: PolicyActor, includeDeleted = false): Prisma.PolicyWhereInput {
  const ownership = isOwnerScoped(user) ? ownedPolicyWhere(user) : {};
  return {
    ...ownership,
    ...(includeDeleted ? {} : { deletedAt: null })
  };
}

export function canAccessPolicy(user: PolicyActor, policy: { issuedByUserId: string | null; issuedById: string | null }) {
  return !isOwnerScoped(user) || policy.issuedByUserId === user.id || (!policy.issuedByUserId && policy.issuedById === user.id);
}

export function visibleCustomerWhere(user: PolicyActor): Prisma.CustomerWhereInput {
  if (!isOwnerScoped(user)) return {};
  return {
    OR: [
      { createdByUserId: user.id },
      { createdByUserId: null, policies: { some: visiblePolicyWhere(user) } }
    ]
  };
}

export function canAccessCustomer(user: PolicyActor, customer: {
  createdByUserId?: string | null;
  policies: Array<{ issuedByUserId: string | null; issuedById: string | null; deletedAt?: Date | null }>;
}) {
  return user.role === Role.SUPER_ADMIN ||
    !isOwnerScoped(user) ||
    customer.createdByUserId === user.id ||
    (!customer.createdByUserId && customer.policies.some((policy) => !policy.deletedAt && canAccessPolicy(user, policy)));
}

export async function getActorSnapshot(user: PolicyActor & { name?: string | null; email?: string | null }) {
  if (user.id === "direct-access-user") {
    return {
      userId: user.id,
      name: user.name ?? "System",
      email: user.email ?? null,
      role: user.role,
      agencyId: null,
      agencyName: null
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agencyId: true,
      agency: { select: { name: true } }
    }
  });

  return {
    userId: user.id,
    name: account?.name ?? user.name ?? user.email ?? "System",
    email: account?.email ?? user.email ?? null,
    role: account?.role ?? user.role,
    agencyId: account?.agencyId ?? null,
    agencyName: account?.agency?.name ?? null
  };
}
