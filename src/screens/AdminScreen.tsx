import {
  Users,
  UserCog,
  Layers,
  Tag,
  CheckSquare,
  Package,
  Briefcase,
  FileText,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

const adminModules = [
  {
    id: "users",
    title: "Usuarios",
    description: "Gestión de usuarios del sistema",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    id: "groups",
    title: "Grupos",
    description: "Administrar grupos de trabajo",
    icon: Layers,
    color: "bg-green-500",
  },
  {
    id: "profiles",
    title: "Perfiles",
    description: "Roles y permisos",
    icon: UserCog,
    color: "bg-purple-500",
  },
  {
    id: "categories",
    title: "Categorías",
    description: "Categorías de solicitudes",
    icon: Tag,
    color: "bg-amber-500",
  },
  {
    id: "status",
    title: "Estados de Cierre",
    description: "Configuración de estados",
    icon: CheckSquare,
    color: "bg-pink-500",
  },
  {
    id: "inventory",
    title: "Inventario",
    description: "Gestión de activos y recursos",
    icon: Package,
    color: "bg-indigo-500",
  },
  {
    id: "providers",
    title: "Proveedores",
    description: "Base de proveedores",
    icon: Briefcase,
    color: "bg-teal-500",
  },
  {
    id: "documents",
    title: "Documentos",
    description: "Repositorio de documentos",
    icon: FileText,
    color: "bg-cyan-500",
  },
  {
    id: "knowledge",
    title: "Base de Conocimientos",
    description: "Artículos y guías",
    icon: BookOpen,
    color: "bg-orange-500",
  },
];

export function AdminScreen() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-6 pb-4">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Administración</h1>
        <p className="text-sm text-muted-foreground">
          Configuración y gestión del sistema
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4 pb-20">
        <div className="grid gap-3">
          {adminModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.button
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 ${module.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground mb-0.5">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
