import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ label, value, icon: Icon, color, trend }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}
