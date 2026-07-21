import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/Feather";
import { RequestCard } from "../components/RequestCard";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

/* ---------------- MAPA FILTRO → ENDPOINT ---------------- */
const filterToEndpoint: Record<string, { path: string; title: string }> = {
  mis_solicitudes: { path: "/tickets/mis/solicitudes", title: "Mis Solicitudes" },
  colaboraciones: { path: "/tickets/mis/colaboraciones", title: "Colaboraciones" },
  observadas: { path: "/tickets/mis/observadas", title: "Observadas" },
  pendientes: { path: "/tickets/bandeja/pendientes", title: "Pendientes" },
  cerradas: { path: "/tickets/mis/cerradas", title: "Cerradas" },
  anuladas: { path: "/tickets/mis/anuladas", title: "Anuladas" },
};

export default function RequestsListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { logout } = useAuth();

  const filter = route.params?.filter ?? "mis_solicitudes";
  const endpoint = filterToEndpoint[filter] ?? filterToEndpoint.mis_solicitudes;

  const [tickets, setTickets] = useState<any[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const token = await AsyncStorage.getItem("token");
      const tenantStored = await AsyncStorage.getItem("tenant_id");

      setTenant(tenantStored);

      if (!token || !tenantStored) {
        console.log("❌ Falta token o tenant");
        return;
      }

      const response = await api.get(endpoint.path, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant": tenantStored,
        },
        params: { per_page: 50 },
      });

      const data = response.data;
      console.log('pl', data)
      setTickets(data?.data ?? []);
    } catch (e: any) {
      console.log("❌ ERROR TICKETS:", e?.response?.data ?? e);
      const mensaje =
        e?.response?.data?.message ?? e?.message ?? "Error cargando tickets";
      setTickets([]);
      setErrorMsg(mensaje);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTickets();
      AsyncStorage.getItem("user_name").then(setUserName);
    }, [filter])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets();
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
      <View style={styles.headerTwo}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitleTwo}>{endpoint.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007aff" />
        ) : errorMsg ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={40} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>Sin registros</Text>
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
                  participationLabel={request.participation_type || "Sin participante"}
                  sla={request.sla}
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
  contentContainer: {
    padding: 16,
  },
  headerTwo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    marginTop: StatusBar.currentHeight || 44,
  },
  headerTitleTwo: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 12,
  },
});