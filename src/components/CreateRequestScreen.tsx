import { ArrowLeft, Paperclip, Lightbulb } from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { motion } from "motion/react";
import { useState } from "react";

interface CreateRequestScreenProps {
  onBack: () => void;
  onCreate: () => void;
}

export function CreateRequestScreen({ onBack, onCreate }: CreateRequestScreenProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <h1 className="text-lg font-semibold text-foreground">
          Nueva Solicitud
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-4 pb-20">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Título
            </label>
            <Input
              type="text"
              placeholder="Breve descripción del problema o solicitud"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-input-background"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Categoría
            </label>
            <Select>
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infrastructure">Infraestructura</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="access">Accesos</SelectItem>
                <SelectItem value="training">Capacitación</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Prioridad
            </label>
            <Select>
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Selecciona la prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Descripción
            </label>
            <Textarea
              placeholder="Describe el problema o solicitud con el mayor detalle posible..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] bg-input-background"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Incluye toda la información relevante para resolver tu solicitud más rápidamente.
            </p>
          </div>

          {/* AI Suggestions */}
          {description.length > 20 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    Contenido relacionado
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    ¿Tu pregunta ya está resuelta?
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground mb-1">
                    Preguntas frecuentes sobre acceso WiFi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Artículo · 5 min de lectura
                  </p>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Archivos adjuntos
            </label>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Seleccionar archivos o arrastrar aquí
              </span>
            </motion.button>
            <p className="text-xs text-muted-foreground mt-2">
              Máximo 10 MB por archivo. Formatos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG.
            </p>
          </div>

          {/* Assign */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Asignar a (opcional)
            </label>
            <Select>
              <SelectTrigger className="bg-input-background">
                <SelectValue placeholder="Selecciona un grupo o usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Grupo: Desarrollo</SelectItem>
                <SelectItem value="support">Grupo: Soporte TI</SelectItem>
                <SelectItem value="admin">Grupo: Administración</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCreate}
            className="w-full px-4 py-4 bg-primary text-primary-foreground rounded-xl font-medium shadow-sm"
          >
            Crear Solicitud
          </motion.button>
        </div>
      </div>
    </div>
  );
}
