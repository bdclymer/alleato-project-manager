import { statusColor, cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string | null }) {
  return (
    <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-xs font-medium", statusColor(status))}>
      {status || "Unknown"}
    </span>
  );
}
