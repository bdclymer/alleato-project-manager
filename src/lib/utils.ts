export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function statusColor(status: string | null | undefined): string {
  if (!status) return "bg-gray-100 text-gray-700";
  const s = status.toLowerCase().replace(/_/g, " ");
  if (["approved", "closed", "complete", "completed", "passed", "pass", "executed", "paid", "cleared", "received", "resolved", "installed", "unconditional"].includes(s))
    return "bg-green-100 text-green-800";
  if (["open", "in progress", "active", "pending", "submitted", "scheduled", "mobilizing", "ordered", "in transit", "conditional"].includes(s))
    return "bg-amber-100 text-amber-800";
  if (["draft", "not started", "inactive", "idle", "not required"].includes(s))
    return "bg-gray-100 text-gray-600";
  if (["rejected", "overdue", "failed", "fail", "void", "cancelled", "critical", "expired", "demobilized"].includes(s))
    return "bg-red-100 text-red-800";
  if (["reported", "investigating", "corrective action", "requires action", "on hold", "maintenance", "due"].includes(s))
    return "bg-orange-100 text-orange-800";
  return "bg-blue-100 text-blue-800";
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
