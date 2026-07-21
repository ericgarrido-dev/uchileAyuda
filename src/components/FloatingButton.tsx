// components/FloatingButton.tsx
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";

export function FloatingButton() {
  const navigation = useNavigation<any>();

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate("NewRequest")}
      activeOpacity={0.8}
    >
      <Icon name="message-circle" size={20} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: "#629cfa",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});