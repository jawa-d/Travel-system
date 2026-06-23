export const workflowStatuses = ["OPEN", "UNDER_REVIEW", "APPROVED", "REJECTED", "CLOSED"] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number];

export const finalizedStatuses = new Set<WorkflowStatus>(["REJECTED", "CLOSED"]);

export function isFinalizedStatus(status: string): status is "REJECTED" | "CLOSED" {
  return finalizedStatuses.has(status as WorkflowStatus);
}

export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return typeof value === "string" && workflowStatuses.includes(value as WorkflowStatus);
}

export function validateWorkflowTransition(currentStatus: string, nextStatus: unknown) {
  if (!isWorkflowStatus(nextStatus)) return "INVALID_STATUS" as const;
  if (isFinalizedStatus(currentStatus)) return "FINALIZED" as const;
  return null;
}

export const workflowStatusDetails: Record<WorkflowStatus, {
  labelAr: string;
  labelEn: string;
  className: string;
}> = {
  OPEN: {
    labelAr: "مفتوحة",
    labelEn: "Open",
    className: "border-blue-200 bg-blue-50 text-blue-700"
  },
  UNDER_REVIEW: {
    labelAr: "قيد المراجعة",
    labelEn: "Under Review",
    className: "border-orange-200 bg-orange-50 text-orange-700"
  },
  APPROVED: {
    labelAr: "معتمدة",
    labelEn: "Approved",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  REJECTED: {
    labelAr: "مرفوضة",
    labelEn: "Rejected",
    className: "border-red-200 bg-red-50 text-red-700"
  },
  CLOSED: {
    labelAr: "مغلقة",
    labelEn: "Closed",
    className: "border-slate-200 bg-slate-100 text-slate-700"
  }
};
