import { cn } from "./ui/utils";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high" | "critical";
  className?: string;
}

const priorityConfig = {
  low: {
    label: "Baja",
    bg: "bg-[var(--priority-low-bg)]",
    text: "text-[var(--priority-low)]",
  },
  medium: {
    label: "Media",
    bg: "bg-[var(--priority-medium-bg)]",
    text: "text-[var(--priority-medium)]",
  },
  high: {
    label: "Alta",
    bg: "bg-[var(--priority-high-bg)]",
    text: "text-[var(--priority-high)]",
  },
  critical: {
    label: "Crítica",
    bg: "bg-[var(--priority-critical-bg)]",
    text: "text-[var(--priority-critical)]",
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

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
