import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface MetricCardProps {
  label: string;
  value: number;
  iconName: string;
  color: string;
  active?: boolean;
  onPress: () => void;
}

export function MetricCard({ label, value, iconName, color, onPress, active }: MetricCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        active && { borderWidth: 2, borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Icon name={iconName} size={18} color="#fff" />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
});
