export const policyStatusLabelsAr: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "فعالة",
  EXPIRED: "منتهية",
  CANCELLED: "ملغاة"
};

export const policyStatusLabelsEn: Record<string, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  DRAFT: "Draft"
};

export const policyStatusClasses: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  CANCELLED: "bg-red-50 text-red-700"
};

export const policyVerificationStatusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  EXPIRED: "bg-amber-50 text-amber-700 ring-amber-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200"
};

export const workflowStatusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  DRAFT: "bg-slate-400",
  EXPIRED: "bg-amber-500",
  CANCELLED: "bg-red-500",
  NEW: "bg-blue-500",
  UNDER_REVIEW: "bg-amber-500",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  CLOSED: "bg-slate-500"
};

export const workflowStatusLabelsAr: Record<string, string> = {
  ...policyStatusLabelsAr,
  NEW: "جديدة",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبولة",
  REJECTED: "مرفوضة",
  CLOSED: "مغلقة"
};
