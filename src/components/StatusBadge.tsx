import { cn } from "./ui/utils";

interface StatusBadgeProps {
  status: "pending" | "process" | "closed" | "cancelled";
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pendiente",
    bg: "bg-[var(--status-pending-bg)]",
    text: "text-[var(--status-pending)]",
  },
  process: {
    label: "En Proceso",
    bg: "bg-[var(--status-process-bg)]",
    text: "text-[var(--status-process)]",
  },
  closed: {
    label: "Cerrado",
    bg: "bg-[var(--status-closed-bg)]",
    text: "text-[var(--status-closed)]",
  },
  cancelled: {
    label: "Anulado",
    bg: "bg-[var(--status-cancelled-bg)]",
    text: "text-[var(--status-cancelled)]",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
