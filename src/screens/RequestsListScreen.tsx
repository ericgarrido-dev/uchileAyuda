import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import * as Animatable from 'react-native-animatable';
import { RequestCard } from "../components/RequestCard";
import { useNavigation } from "@react-navigation/native";

/* ---------------- MOCK DATA ---------------- */

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
  {
    id: 2166,
    title: "Solicitud de acceso a biblioteca digital",
    status: "closed" as const,
    priority: "low" as const,
    category: "Accesos",
    assignedUser: "Eric Garrido",
    assignedGroup: "Administración",
    createdAt: "30/03/2026",
    slaStatus: "ok" as const,
    slaLabel: "Cumplido",
  },
  {
    id: 2169,
    title: "Solicitud de acceso a biblioteca digital",
    status: "closed" as const,
    priority: "low" as const,
    category: "Accesos",
    assignedUser: "Eric Garrido",
    assignedGroup: "Administración",
    createdAt: "30/03/2026",
    slaStatus: "ok" as const,
    slaLabel: "Cumplido",
  },
];

export default function RequestsListScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState("");

  const handleRequestClick = (request: any) => {
    navigation.navigate("RequestDetail", {
      request
    });
  };

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Solicitudes</Text>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color="#94a3b8" />
            <TextInput
              placeholder="Buscar solicitudes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* FILTERS */}
          <View style={styles.filters}>
            <TouchableOpacity style={styles.filterBtn}>
              <Icon name="filter" size={16} color="#0f172a" />
              <Text style={styles.filterText}>Filtros</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterBtn}>
              <Icon name="arrow-up-down" size={16} color="#0f172a" />
              <Text style={styles.filterText}>Ordenar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LISTA */}
        {mockRequests.map((request, index) => (
          <Animatable.View
            key={request.id}
            animation="fadeInUp"
            delay={index * 100}
            style={styles.list}
          >
            <RequestCard
              {...request}
              onClick={() => handleRequestClick(request)}
            />
          </Animatable.View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  contentContainer: {
    padding: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    color: "#0f172a",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  input: {
    flex: 1,
    padding: 10,
    color: "#0f172a",
  },

  filters: {
    flexDirection: "row",
    gap: 10,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },

  filterText: {
    fontSize: 12,
    color: "#0f172a",
  },

  list: {
    paddingTop: 8,
  },
});