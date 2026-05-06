import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import * as Animatable from "react-native-animatable";
import { RequestCard } from "../components/RequestCard";
import { useAuth } from "../context/AuthContext";
import { Header } from "../components/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    openRequests: 0,
    inProgress: 0,
    closedRequests: 0,
    overdueRequests: 0,
  });

  /* ---------------- FILTER MAP — fuera de loadTickets ---------------- */
  const filterMap: Record<string, (t: any) => boolean> = {
    abiertas:    (t) => t.state?.id === 1,
    proceso:     (t) => t.state?.id === 2,
    finalizadas: (t) => t.state?.id === 3,
    vencidas:    (t) => t.state?.id === 4,
  };

  //Se recalcula cada vez que cambia tickets o activeFilter
  const filteredTickets = activeFilter
    ? tickets.filter(filterMap[activeFilter])
    : tickets;

  /* ---------------- LOAD TICKETS ---------------- */
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
        "https://devticket.uchilefau.cl/api/tickets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant": tenantStored,
            Accept: "application/json",
          },
        }
      );

      const data = response.data;
      console.log("📥 API RESPONSE:", data);

      const counts = data?.meta?.counts ?? {};

      console.log("📥 countsss:", counts);

      setMetrics({
        openRequests:    counts.bandeja_entrada ?? 0,
        inProgress:      counts.en_proceso ?? 0,
        closedRequests:  counts.cerrados ?? 0,
        overdueRequests: counts.anulados ?? 0,
      });

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

  /* ---------------- HANDLERS ---------------- */
  const handleRequestClick = (request: any) => {
    navigation.navigate("RequestDetail", { request });
  };

  const handleFilterPress = (filter: string) => {
    // Toca el mismo filtro activo → lo desactiva
    setActiveFilter((prev) => (prev === filter ? null : filter));
    setShowAll(false); // resetea "ver todas" al cambiar filtro
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets();
    setIsRefreshing(false);
  };

  /* ---------------- FORMAT DATE ---------------- */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day   = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year  = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  /* ---------------- TÍTULO SECCIÓN ---------------- */
  const sectionTitle = activeFilter
    ? activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)
    : "Solicitudes";

  /* ---------------- RENDER ---------------- */
  return (
    <View style={styles.container}>

      <Header tenant={tenant} onLogout={logout} />

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
              active={activeFilter === "abiertas"}
              onPress={() => handleFilterPress("abiertas")}
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
              active={activeFilter === "vencidas"}
              onPress={() => handleFilterPress("vencidas")}
            />
            <MetricCard
              label="Cerradas"
              value={metrics.closedRequests}
              iconName="check-circle"
              color="#10b981"
              active={activeFilter === "finalizadas"}
              onPress={() => handleFilterPress("finalizadas")}
            />
          </View>
        </View>

        {/* LOADING */}
        {loading ? (
          <ActivityIndicator size="large" color="#007aff" />
        ) : (
          <>
            <View style={styles.section}>
              {/* ✅ Título cambia según filtro activo */}
              <Text style={styles.sectionTitle}>{sectionTitle}</Text>

              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text style={styles.seeAllButton}>
                  {showAll ? "Ver menos" : "Ver todas"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ✅ Lista usa filteredTickets */}
            {filteredTickets.length === 0 ? (
              <Text style={styles.emptyText}>
                No hay solicitudes {activeFilter ? `en "${sectionTitle}"` : ""}
              </Text>
            ) : (
              (showAll ? filteredTickets : filteredTickets.slice(0, 3)).map(
                (request, index) => (
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
                )
              )
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------------- METRIC CARD ---------------- */
function MetricCard({ label, value, iconName, color, onPress, active }: any) {
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
