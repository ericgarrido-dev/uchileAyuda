import { Plus, FileText, Clock, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { RequestCard } from "./RequestCard";
import { motion } from "motion/react";

interface DashboardScreenProps {
  tenantName: string;
  onRequestClick: (id: number) => void;
  onCreateRequest: () => void;
}

const mockRequests = [
  {
    id: 2165,
    title: "Mantención LABLIBRE",
    status: "process" as const,
    priority: "medium" as const,
    category: "Sin Categoría",
    assignedUser: "Juan Pablo Morales",
    assignedGroup: "Desarrollo",
    createdAt: "31/03/2026",
    slaStatus: "ok" as const,
    slaLabel: "24h",
  },
  {
    id: 2164,
    title: "Problema con conexión WiFi en sala 301",
    status: "pending" as const,
    priority: "high" as const,
    category: "Infraestructura",
    assignedGroup: "Soporte TI",
    createdAt: "31/03/2026",
    slaStatus: "warning" as const,
    slaLabel: "2h",
  },
  {
    id: 2163,
    title: "Solicitud de acceso a biblioteca digital",
    status: "closed" as const,
    priority: "low" as const,
    category: "Accesos",
    assignedUser: "María González",
    assignedGroup: "Administración",
    createdAt: "30/03/2026",
    slaStatus: "ok" as const,
    slaLabel: "Cumplido",
  },
];

export function DashboardScreen({ tenantName, onRequestClick, onCreateRequest }: DashboardScreenProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-primary-foreground/80 text-xs mb-0.5">Bienvenido a</p>
          <h1 className="text-xl font-semibold text-primary-foreground">{tenantName}</h1>
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pb-20">
        {/* Metrics */}
        <div className="px-4 mt-4 mb-6">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <MetricCard
              label="Solicitudes Abiertas"
              value={24}
              icon={FileText}
              color="bg-blue-500"
              trend={{ value: 12, isPositive: true }}
            />
            <MetricCard
              label="En Proceso"
              value={18}
              icon={Clock}
              color="bg-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Vencidas SLA"
              value={3}
              icon={AlertCircle}
              color="bg-red-500"
              trend={{ value: -25, isPositive: true }}
            />
            <MetricCard
              label="Finalizadas"
              value={156}
              icon={CheckCircle2}
              color="bg-green-500"
              trend={{ value: 8, isPositive: true }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">Acciones Rápidas</h2>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCreateRequest}
            className="w-full bg-primary text-primary-foreground rounded-xl p-4 flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Crear Nueva Solicitud</span>
          </motion.button>
        </div>

        {/* Recent Requests */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Solicitudes Recientes</h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="text-sm text-primary font-medium"
            >
              Ver todas
            </motion.button>
          </div>
          <div className="space-y-3">
            {mockRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RequestCard {...request} onClick={() => onRequestClick(request.id)} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
