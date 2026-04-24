import { Search, Sparkles, FileText, Book, Folder } from "lucide-react";
import { Input } from "./ui/input";
import { motion } from "motion/react";
import { useState } from "react";

const suggestedQuestions = [
  "¿Cómo solicito acceso a WiFi?",
  "Protocolo de mantención de laboratorios",
  "¿Qué hacer si olvidé mi contraseña?",
  "Solicitar reserva de sala",
];

const mockResults = [
  {
    id: 1,
    type: "knowledge",
    title: "Guía de acceso a WiFi institucional",
    description: "Paso a paso para conectarte a la red WiFi de la universidad",
    icon: Book,
  },
  {
    id: 2,
    type: "request",
    title: "Solicitud #2165 - Mantención LABLIBRE",
    description: "En proceso · Media prioridad",
    icon: FileText,
  },
  {
    id: 3,
    type: "document",
    title: "Manual de usuario - Sistema de tickets",
    description: "Documento PDF · Actualizado hace 1 semana",
    icon: Folder,
  },
];

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleSearch = () => {
    if (query.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-blue-600 px-4 pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
            <h1 className="text-2xl font-semibold text-primary-foreground">
              Búsqueda IA
            </h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Encuentra respuestas inteligentes a tus preguntas
          </p>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="px-4 -mt-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pregunta cualquier cosa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-12 pr-4 py-6 bg-white shadow-lg border-0 text-base"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Buscar
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-20">
        {!showResults ? (
          <>
            {/* Suggested Questions */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-foreground mb-3">
                Preguntas sugeridas
              </h2>
              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setQuery(question);
                      setShowResults(true);
                    }}
                    className="w-full text-left px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm text-foreground">{question}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    Búsqueda potenciada por IA
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Utiliza inteligencia artificial para encontrar las mejores respuestas en
                    solicitudes, documentos y base de conocimiento.
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="mb-4">
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Encontramos {mockResults.length} resultados
              </h2>
            </div>
            <div className="space-y-3">
              {mockResults.map((result, index) => {
                const Icon = result.icon;
                return (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground mb-1 line-clamp-1">
                          {result.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
