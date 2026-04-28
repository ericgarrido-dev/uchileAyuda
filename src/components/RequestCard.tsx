import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

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
  slaCommen: string;
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
  slaCommen,
  onClick,
}: RequestCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onClick}
      style={styles.card}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.id}>#{id}</Text>

          <View style={styles.sla}>
            <Text style={styles.slaText}>{slaLabel}</Text>
          </View>
        </View>

        <Icon name="chevron-right" size={20} color="#94a3b8" />
      </View>

      {/* TITLE */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* TAGS */}
      <View style={styles.tags}>
        <Text style={[styles.tag, getStatusColor(status)]}>
          {status}
        </Text>

        <Text style={[styles.tag, getPriorityColor(priority)]}>
          {priority}
        </Text>

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

function getStatusColor(status: string) {
  switch (status) {
    case "pendiente":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "proceso":
      return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    case "cerrado":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "anulada":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return {};
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "baja":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "media":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "alta":
      return { backgroundColor: "#fed7aa", color: "#9a3412" };
    case "critical":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return {};
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
  },

  id: {
    fontSize: 12,
    color: "#64748b",
  },

  sla: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  slaText: {
    fontSize: 10,
    color: "#4f46e5",
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
    flex: 1,              // 🔥 todos ocupan el mismo ancho
    fontSize: 10,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: "center",
    textTransform: 'uppercase',
  },

  category: {
    flex: 1,              // 🔥 igual que los otros
    fontSize: 10,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: "center",
  },

  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // 👈 clave
  },

  leftFooter: {
    flexDirection: "row",
    gap: 10,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  footerText: {
    fontSize: 11,
    color: "#64748b",
  },
});