import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import * as Animatable from 'react-native-animatable';
import { RequestCard } from "../components/RequestCard";
import { useNavigation } from "@react-navigation/native";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function RequestsListScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const tenantStored = await AsyncStorage.getItem("tenant_id");

      setTenant(tenantStored);

      if (!token || !tenantStored) {
        console.log("❌ Falta token o tenant");
        return;
      }

      const response = await axios.get(
        "https://devticket.uchilefau.cl/api/tickets/mis/solicitudes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant": tenantStored,
            Accept: "application/json",
          },
        }
      );

      const data = response.data; // 👈 axios ya parsea JSON

      console.log("📥 API respuesta:", data);

      setTickets(data?.data ?? []);
    } catch (e) {
      console.log("❌ ERROR TICKETS:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Función para manejar el refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets();  // Actualiza los comentarios
    setIsRefreshing(false);
  };

  const handleRequestClick = (request: any) => {
    navigation.navigate("RequestDetail", { request });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Header tenant={tenant} onLogout={logout} />

      <ScrollView contentContainerStyle={styles.contentContainer} refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={["#2563eb"]}
        />
      }>

        <View style={styles.header}>
          <Text style={styles.title}>Mis Solicitudes</Text>
        </View>
        {/* LOADING */}
        {loading ? (
          <ActivityIndicator size="large" color="#007aff" />
        ) : tickets.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              Sin registros
            </Text>
          </View>
        ) : (
          <>
            {tickets.map((request, index) => (
              <Animatable.View
                key={request.id || index}
                animation="fadeInUp"
                delay={index * 100}
              >
                <RequestCard
                  id={request.id}
                  title={request.subject}
                  status={request.state?.name?.toLowerCase()}
                  priority={request.priority?.name?.toLowerCase()}
                  category={request.category?.name || "Sin categoría"}
                  assignedUser={request.assigned_user?.name}
                  assignedGroup={request.assigned_group?.name}
                  createdAt={formatDate(request.created_at)}
                  slaStatus="ok"
                  slaLabel="--"
                  slaCommen={request.sla}
                  updateAt={formatDate(request.updated_at)}
                  onClick={() => handleRequestClick(request)}
                />
              </Animatable.View>
            ))}
          </>
        )}
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
    padding: 4,
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

  list: {
    paddingTop: 8,
  },

  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },

  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#94a3b8",
  },
});