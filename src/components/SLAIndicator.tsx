import { Clock } from "lucide-react";
import { cn } from "./ui/utils";

interface SLAIndicatorProps {
  status: "ok" | "warning" | "danger";
  label: string;
  className?: string;
}

const slaConfig = {
  ok: {
    color: "text-[var(--sla-ok)]",
  },
  warning: {
    color: "text-[var(--sla-warning)]",
  },
  danger: {
    color: "text-[var(--sla-danger)]",
  },
};

export function SLAIndicator({ status, label, className }: SLAIndicatorProps) {
  const config = slaConfig[status];

  return (
    <div className={cn("flex items-center gap-1", config.color, className)}>
      <Clock className="w-3.5 h-3.5" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
