import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface SlaData {
  toma_horas?: number;
  respuesta_horas?: number;
  resolucion_horas?: number;
  target?: string;
  limit_hours?: number;
  due_at?: string;
  elapsed_minutes?: number;
  remaining_minutes?: number;
  progress_percentage?: number;
  status?: string;
  is_overdue?: boolean;
}

interface RequestCardProps {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  assignedUser?: string;
  assignedGroup?: string;
  createdAt: string;
  participationLabel: string;
  sla?: SlaData | null;
  updateAt: string;
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
  participationLabel,
  sla,
  updateAt,
  onClick,
}: RequestCardProps) {
  const participation = getParticipationConfig(participationLabel?.toLowerCase());
  const slaConfig = getSlaConfig(sla);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onClick} style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.id}>#{id}</Text>

          {/* SLA */}
          {slaConfig && (
            <View style={[styles.sla, { backgroundColor: slaConfig.bg, borderColor: slaConfig.border, borderWidth: 1 }]}>
              <Icon name="clock" size={10} color={slaConfig.color} />
              <Text style={[styles.slaText, { color: slaConfig.color }]}>
                {slaConfig.label}
              </Text>
            </View>
          )}

          {/* PARTICIPACIÓN */}
          <View style={[styles.participation, {
            backgroundColor: participation.bg,
            borderColor: participation.border,
            borderWidth: 1,
          }]}>
            <Icon name={participation.icon} size={12} color={participation.color} />
            <Text style={[styles.participationText, { color: participation.color }]}>
              {participationLabels[participationLabel?.toLowerCase()] || participationLabel}
            </Text>
          </View>
        </View>

        <Icon name="chevron-right" size={20} color="#64748b" />
      </View>

      {/* TITLE */}
      <Text style={styles.title} numberOfLines={2}>{title}</Text>

      {/* TAGS */}
      <View style={styles.tags}>
        <Text style={[styles.tag, getStatusColor(status)]}>{status}</Text>
        <Text style={[styles.tag, getPriorityColor(priority)]}>{priority}</Text>
        <Text style={styles.category}>{category}</Text>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.leftFooter}>
          {assignedUser && (
            <View style={styles.userRow}>
              <Icon name="user" size={14} color="#64748b" />
              <Text style={styles.footerText}>{assignedUser}</Text>
            </View>
          )}
          {assignedGroup && (
            <View style={styles.userRow}>
              <Icon name="users" size={14} color="#64748b" />
              <Text style={styles.footerText}>{assignedGroup}</Text>
            </View>
          )}
        </View>
        <Text style={styles.footerText}>{createdAt}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ---------------- HELPERS ---------------- */

function getSlaConfig(sla?: SlaData | null) {
  if (!sla || !sla.limit_hours) return null;

  const isOverdue = sla.is_overdue || sla.status === "vencido";
  const remainingMinutes = sla.remaining_minutes ?? 0;

  // Calcular texto del tiempo
  let timeLabel = "";
  if (isOverdue) {
    const overdueMinutes = Math.abs(remainingMinutes);
    if (overdueMinutes >= 1440) {
      timeLabel = `${Math.floor(overdueMinutes / 1440)}d vencido`;
    } else if (overdueMinutes >= 60) {
      timeLabel = `${Math.floor(overdueMinutes / 60)}h vencido`;
    } else {
      timeLabel = `${overdueMinutes}m vencido`;
    }
  } else {
    if (remainingMinutes >= 1440) {
      timeLabel = `${Math.floor(remainingMinutes / 1440)}d`;
    } else if (remainingMinutes >= 60) {
      timeLabel = `${Math.floor(remainingMinutes / 60)}h`;
    } else {
      timeLabel = `${remainingMinutes}m`;
    }
  }

  // Colores según estado
  if (isOverdue) {
    return { label: timeLabel, bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
  }

  const progress = sla.progress_percentage ?? 0;
  if (progress >= 75) {
    return { label: timeLabel, bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
  }

  return { label: timeLabel, bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
}

function getStatusColor(status: string) {
  switch (status) {
    case "pendiente":
      return { backgroundColor: "#fef3c7", color: "#f69e0b" };
    case "proceso":
      return { backgroundColor: "#dbeafe", color: "#155dfc" };
    case "cerrado":
      return { backgroundColor: "#dcfce7", color: "#10b99b" };
    case "anulada":
      return { backgroundColor: "#b0b5bd", color: "#64748b" };
    default:
      return {};
  }
}

const participationLabels: Record<string, string> = {
  assigned: "Responsable",
  requester: "Solicitante",
  colaborador: "Colaborador",
  observador: "Observador",
};

function getParticipationConfig(status: string) {
  switch (status) {
    case "assigned":
      return { bg: "#f3e8ff", color: "#7008e7", border: "#7008e7", icon: "user-check" };
    case "requester":
      return { bg: "#dbeafe", color: "#1447ea", border: "#1447ea", icon: "user" };
    case "colaborador":
      return { bg: "#dcfce7", color: "#00786f", border: "#00786f", icon: "user-plus" };
    case "observador":
      return { bg: "#fef3c7", color: "#d97706", border: "#d97706", icon: "eye" };
    default:
      return { bg: "#f1f5f9", color: "#64748b", border: "#64748b", icon: "x-square" };
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "baja":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "media":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "alta":
      return { backgroundColor: "#ffe4e6", color: "#ec003e" };
    case "critica":
      return { backgroundColor: "#fef2f2", color: "#dc2626" };
    default:
      return { backgroundColor: "#f1f5f9", color: "#64748b" };
  }
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    flex: 1,
  },
  id: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  sla: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slaText: {
    fontSize: 10,
    fontWeight: "600",
  },
  participation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  participationText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#0f172a",
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 8,
    borderRadius: 12,
    textAlign: "center",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  category: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    borderRadius: 12,
    textAlign: "center",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftFooter: {
    flexDirection: "row",
    gap: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
  },
});