import { ChevronRight, User, Users } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { SLAIndicator } from "./SLAIndicator";
import { motion } from "motion/react";

interface RequestCardProps {
  id: number;
  title: string;
  status: "pending" | "process" | "closed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  assignedUser?: string;
  assignedGroup?: string;
  createdAt: string;
  slaStatus: "ok" | "warning" | "danger";
  slaLabel: string;
  onClick: () => void;
}

export function RequestCard({
  id,
  title,
  status,
  priority,
  category,
  assignedUser,
  assignedGroup,
  createdAt,
  slaStatus,
  slaLabel,
  onClick,
}: RequestCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">#{id}</span>
            <SLAIndicator status={slaStatus} label={slaLabel} />
          </div>
          <h3 className="font-medium text-foreground mb-2 line-clamp-2">
            {title}
          </h3>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <StatusBadge status={status} />
        <PriorityBadge priority={priority} />
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-muted text-muted-foreground">
          {category}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {assignedUser && (
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>{assignedUser}</span>
            </div>
          )}
          {assignedGroup && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{assignedGroup}</span>
            </div>
          )}
        </div>
        <span>{createdAt}</span>
      </div>
    </motion.button>
  );
}
