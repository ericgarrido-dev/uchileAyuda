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
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const [tickets, setTickets] = useState<any[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ FIX: estado real para métricas
  const [metrics, setMetrics] = useState({
    openRequests: 0,
    inProgress: 0,
    closedRequests: 0,
    overdueRequests: 0,
  });

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

      const response = await fetch(
        "https://devticket.uchilefau.cl/api/tickets",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant": tenantStored,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("📥 API RESPONSE:", data);

      const counts = data?.meta?.counts ?? {};

      // ✅ FIX: mapping correcto
      setMetrics({
        openRequests: counts.bandeja_entrada ?? 0,
        inProgress: counts.en_proceso ?? 0,
        closedRequests: counts.cerrados ?? 0,
        overdueRequests: counts.anulados ?? 0,
      });

      setTickets(data?.data ?? []);
    } catch (e) {
      console.log("ERROR TICKETS:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleRequestClick = (request: any) => {
    navigation.navigate("Requests", {
      screen: "RequestDetail",
      params: { request },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Función para manejar el refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTickets();  // Actualiza los comentarios
    setIsRefreshing(false);
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Bienvenido a</Text>
          <Text style={styles.headerTitle}>
            {tenant ? `${tenant}.uchile.cl` : "ayuda.uchile.cl"}
          </Text>
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Icon name="log-out" size={16} color="#fff" />
        </TouchableOpacity>

      </Animatable.View>

      <ScrollView contentContainerStyle={styles.contentContainer} refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={["#2563eb"]}
        />
      }>

        {/* METRICS */}
        <View style={styles.metricsContainer}>

          <View style={styles.metricsRow}>
            <MetricCard label="Abiertas" value={metrics.openRequests} iconName="file-text" color="#3b82f6" />
            <MetricCard label="Proceso" value={metrics.inProgress} iconName="clock" color="#f59e0b" />
          </View>

          <View style={styles.metricsRow}>
            <MetricCard label="Vencidas" value={metrics.overdueRequests} iconName="alert-circle" color="#dc2626" />
            <MetricCard label="Finalizadas" value={metrics.closedRequests} iconName="check-circle" color="#10b981" />
          </View>

        </View>

        {/* LOADING */}
        {loading ? (
          <ActivityIndicator size="large" color="#007aff" />
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Solicitudes</Text>

              <TouchableOpacity onPress={() => setShowAll(!showAll)}>
                <Text style={styles.seeAllButton}>
                  {showAll ? "Ver menos" : "Ver todas"}
                </Text>
              </TouchableOpacity>
            </View>

            {(showAll ? tickets : tickets.slice(0, 3)).map((request, index) => (
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

/* ---------------- COMPONENT ---------------- */

function MetricCard({ label, value, iconName, color }: any) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <Icon name={iconName} size={18} color="#fff" />
      </View>

      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },

  header: {
    backgroundColor: "#007aff",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  headerSubtitle: {
    color: "#fff",
    opacity: 0.8,
    marginTop: 8,
  },

  contentContainer: {
    padding: 16,
  },

  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  seeAllButton: {
    color: "#007aff",
  },

  metricsContainer: {
    marginTop: 10,
  },

  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  metricLabel: {
    fontSize: 12,
    color: '#666',
  },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 30,
  },
});