import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
} from "react-native";

import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

  const [tenant, setTenant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 📊 ESTADOS REALES
  const [responseTimeData, setResponseTimeData] = useState<any>(null);
  const [slaComplianceData, setSlaComplianceData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  const API = "https://devticket.uchilefau.cl/api";

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#007aff",
    },
  };

  const loadStats = async () => {
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
        `${API}/tickets/estadisticas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant": tenantStored,
            Accept: "application/json",
          },
        }
      );

      const data = response.data?.data;

      console.log("📥 API respuesta estadistica:", data);

      // 📦 MAPEO DIRECTO
      setResponseTimeData(data.responseTimeData);
      setSlaComplianceData(data.slaComplianceData);
      setCategoryData(data.categoryData || []);

    } catch (e) {
      console.log("❌ ERROR LOAD DASHBOARD:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStats();
    setIsRefreshing(false);
  };

  // 🎨 PIE CHART FORMAT
  const pieChartData = categoryData.map((item, index) => ({
    name: item.name,
    population: item.population,
    color: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"][index % 4],
    legendFontColor: "#333",
    legendFontSize: 12,
  }));

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
        <Text style={styles.title}>Estadísticas</Text>

        {/* KPI (hardcode o luego lo conectas) */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tiempo Promedio</Text>
            <Text style={styles.kpiValue}>3.7h</Text>
            <Text style={styles.kpiTrend}>↓ -12%</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Cumplimiento SLA</Text>
            <Text style={styles.kpiValue}>94%</Text>
            <Text style={styles.kpiTrend}>↑ +3%</Text>
          </View>
        </View>

        {/* LOADING */}
        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Cargando...
          </Text>
        ) : (
          <>
            {/* LINE CHART */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tiempo de Respuesta</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {responseTimeData && (
                  <LineChart
                    data={responseTimeData}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                  />
                )}</ScrollView>

            </View>

            {/* PIE CHART */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Categorías</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {pieChartData.length > 0 && (
                  <PieChart
                    data={pieChartData}
                    width={screenWidth - 32}
                    height={220}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="10"
                    chartConfig={chartConfig}
                  />
                )}
              </ScrollView>
            </View>

            {/* BAR CHART */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cumplimiento SLA</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {slaComplianceData && (
                  <BarChart
                    data={slaComplianceData}
                    width={screenWidth * 1.8}
                    height={220}
                    fromZero
                    chartConfig={chartConfig}
                    yAxisLabel=""
                    yAxisSuffix=""
                  />
                )}
              </ScrollView>
            </View>

          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  contentContainer: { padding: 16 },

  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    color: "#0f172a",
  },

  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#0f172a",
  },

  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  kpiCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },

  kpiLabel: {
    fontSize: 12,
    color: "#64748b",
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  kpiTrend: {
    fontSize: 12,
    color: "#10b981",
  },
});