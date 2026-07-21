import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/Feather";

type Position = "topLeft" | "topRight" | "bottomLeft" | "bottomRight" | "middle";

interface MetricCardProps {
  label: string;
  value: number;
  iconName: string;
  iconNameChevron: string;
  color: string;
  colorChevron: string;
  active?: boolean;
  onPress: () => void;
  position?: Position;
}

const RADIUS = 16;

const borderRadiusMap: Record<Position, ViewStyle> = {
  topLeft: {
    borderTopLeftRadius: RADIUS,
  },
  topRight: {
    borderTopRightRadius: RADIUS,
  },
  middle: {},
  bottomLeft: {
    borderBottomLeftRadius: RADIUS,
  },
  bottomRight: {
    borderBottomRightRadius: RADIUS,
  },
};

export function MetricCard({ label, value, iconName, iconNameChevron, color, colorChevron, onPress, active, position }: MetricCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        position && borderRadiusMap[position],
        active && { borderColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
        <Icon name={iconName} size={20} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View>
        <Icon name={iconNameChevron} size={18} color={colorChevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 0,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
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