import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", icon: "home", label: "Inicio" },
  { id: "requests", icon: "file-text", label: "Solicitudes" },
  { id: "stats", icon: "bar-chart-2", label: "Estadísticas" },
  { id: "search", icon: "search", label: "Búsqueda" },
  { id: "admin", icon: "settings", label: "Admin" },
];

export default function BottomNav({
  activeTab,
  onTabChange,
}: BottomNavProps) {
  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onTabChange(item.id)}
            style={styles.button}
          >
            <Icon
              name={item.icon}
              size={22}
              color={isActive ? "#3b82f6" : "#94a3b8"}
            />

            <Text
              style={[
                styles.label,
                { color: isActive ? "#3b82f6" : "#94a3b8" },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    paddingBottom: 5,
  },

  button: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },

  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "500",
  },
});