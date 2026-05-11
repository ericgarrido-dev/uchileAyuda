import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import { RequestCard } from "../components/RequestCard";
import { useAuth } from "../context/AuthContext";
import { Header } from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MetricCard } from "../components/MetricCard";
import api from "../services/api";

/* ---------------- MAPA FILTRO → STATUS_ID ---------------- */
const filterToStatusId: Record<string, number> = {
  pendientes: 1,
  proceso: 2,
  cerradas: 3,
  anuladas: 4,
};

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);   // ← lista completa de tenants
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    openRequests: 0,
    inProgress: 0,
    closedRequests: 0,
    overdueRequests: 0,
  });

  /* ---------------- LOAD TENANTS ---------------- */
  // Lee la lista guardada en AsyncStorage al hacer login (ver App.tsx)
  const loadTenants = async () => {
    try {
      const stored = await AsyncStorage.getItem("tenants");
      if (stored) setTenants(JSON.parse(stored));
    } catch (e) {
      console.warn("No se pudieron cargar los tenants:", e);
    }
  };

  /* ---------------- LOAD TICKETS ---------------- */
  const loadTickets = async (filter: string | null = null) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const tenantStored = await AsyncStorage.getItem("tenant_id");

      setTenant(tenantStored);

      if (!token || !tenantStored) {
        console.warn("❌ Falta token o tenant_id en AsyncStorage");
        return;
      }

      const params: Record<string, any> = { per_page: 50 };
      if (filter && filterToStatusId[filter]) {
        params.status_id = filterToStatusId[filter];
      }

      const response = await api.get('/tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant": tenantStored,
        },
        params,
      });

      const data = response.data;
      const counts = data?.meta?.counts ?? {};

      setMetrics({
        openRequests: counts.bandeja_entrada ?? 0,
        inProgress: counts.en_proceso ?? 0,
        closedRequests: counts.cerrados ?? 0,
        overdueRequests: counts.anulados ?? 0,
      });

      setTickets(data?.data ?? []);
    } catch (e) {
      console.error("❌ ERROR TICKETS:", e);
    } finally {
      setLoading(false);
    }
  };

  /* Cada vez que la pantalla toma foco, recarga tenants + tickets */
  useFocusEffect(
    useCallback(() => {
      loadTenants();
      loadTickets(activeFilter);
    }, [activeFilter])
  );

  /* ---------------- CAMBIO DE TENANT ---------------- */
  const handleChangeTenant = async (tenantId: string) => {
    try {
      if (tenantId === tenant) return; // ya estamos en ese tenant

      setLoading(true);

      const loginTicket = await AsyncStorage.getItem("login_ticket");

      // Canjear el login_ticket por el token del tenant elegido
      const response = await api.post('/mobile/auth/select-tenant', {
        login_ticket: loginTicket,
        tenant_id: tenantId,
      });

      const token =
        response.data?.token ??
        response.data?.access_token;

      if (!token) {
        console.warn("❌ No se recibió token al cambiar tenant");
        return;
      }

      // Guardar nuevo token + tenant activo
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("tenant_id", tenantId);

      // Resetear filtros y recargar con el nuevo tenant
      setActiveFilter(null);
      setShowAll(false);
      await loadTickets(null);

    } catch (e: any) {
      console.error("❌ Error cambiando tenant:", e);
    }
  };

  /* ---------------- OTROS HANDLERS ---------------- */
  const handleRequestClick = (request: any) => {
    navigation.navigate("RequestDetail", { request });
  };

  const handleFilterPress = (filter: string) => {
    const nuevoFiltro = activeFilter === filter ? null : filter;
    setActiveFilter(nuevoFiltro);
    setShowAll(false);
    loadTickets(nuevoFiltro);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets(activeFilter);
    setIsRefreshing(false);
  };

  /* ---------------- FORMAT DATE ---------------- */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  /* ---------------- TÍTULO SECCIÓN ---------------- */
  const sectionTitle = activeFilter
    ? activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)
    : "Solicitudes";

  /* ---------------- RENDER ---------------- */
  return (
    <View style={styles.container}>

      {/*
        Header ahora recibe:
        - tenants: muestra el switcher solo si hay más de 1
        - onChangeTenant: canjea el ticket y recarga los datos
      */}
      <Header
        tenant={tenant}
        onLogout={logout}
        tenants={tenants}
        onChangeTenant={handleChangeTenant}
      />

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
        <View style={styles.header}>
          <Text style={styles.title}>Inicio</Text>
        </View>

        {/* METRICS */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Pendientes"
              value={metrics.openRequests}
              iconName="file-text"
              color="#3b82f6"
              active={activeFilter === "pendientes"}
              onPress={() => handleFilterPress("pendientes")}
            />
            <MetricCard
              label="Proceso"
              value={metrics.inProgress}
              iconName="clock"
              color="#f59e0b"
              active={activeFilter === "proceso"}
              onPress={() => handleFilterPress("proceso")}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Anuladas"
              value={metrics.overdueRequests}
              iconName="alert-circle"
              color="#dc2626"
              active={activeFilter === "anuladas"}
              onPress={() => handleFilterPress("anuladas")}
            />
            <MetricCard
              label="Cerradas"
              value={metrics.closedRequests}
              iconName="check-circle"
              color="#10b981"
              active={activeFilter === "cerradas"}
              onPress={() => handleFilterPress("cerradas")}
            />
          </View>
        </View>

        {/* LISTA */}
        {loading ? (
          <ActivityIndicator size="large" color="#007aff" style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>
              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text style={styles.seeAllButton}>
                  {showAll ? "Ver menos" : "Ver todas"}
                </Text>
              </TouchableOpacity>
            </View>

            {tickets.length === 0 ? (
              <Text style={styles.emptyText}>
                No hay solicitudes{activeFilter ? ` en "${sectionTitle}"` : ""}
              </Text>
            ) : (
              (showAll ? tickets : tickets.slice(0, 3)).map((request, index) => (
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
              ))
            )}
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
    backgroundColor: "#f1f5f9",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
  },
  metricsContainer: {
    marginBottom: 16,
    gap: 10,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
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
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  seeAllButton: {
    fontSize: 13,
    color: "#2563eb",
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 24,
    fontSize: 14,
  },
});
