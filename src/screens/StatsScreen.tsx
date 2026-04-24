import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/Feather";

const screenWidth = Dimensions.get("window").width;

/* ---------------- DATA ---------------- */

const responseTimeData = {
  labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  datasets: [{ data: [4.2, 3.8, 4.5, 3.2, 4.1, 2.8, 2.5] }],
};

const slaComplianceData = {
  labels: ["Ene", "Feb", "Mar", "Abr"],
  datasets: [{ data: [92, 88, 95, 91] }],
};

const categoryData = [
  {
    name: "Infraestructura",
    population: 35,
    color: "#3b82f6",
    legendFontColor: "#333",
    legendFontSize: 12,
  },
  {
    name: "Sistema",
    population: 28,
    color: "#10b981",
    legendFontColor: "#333",
    legendFontSize: 12,
  },
  {
    name: "Accesos",
    population: 22,
    color: "#f59e0b",
    legendFontColor: "#333",
    legendFontSize: 12,
  },
  {
    name: "Capacitación",
    population: 15,
    color: "#8b5cf6",
    legendFontColor: "#333",
    legendFontSize: 12,
  },
];

/* ---------------- CHART CONFIG ---------------- */

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#3b82f6",
  },
};

export default function StatsScreen() {
  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
      </View>

      {/* KPI */}
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

      {/* LINE CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tiempo de Respuesta</Text>

        <LineChart
          data={responseTimeData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
        />
      </View>

      {/* PIE CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Categorías</Text>

        <PieChart
          data={categoryData}
          width={screenWidth - 32}
          height={220}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"10"}
          chartConfig={chartConfig}
        />
      </View>

      {/* BAR CHART */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cumplimiento SLA</Text>

        <BarChart
          data={slaComplianceData}
          width={screenWidth - 32}
          height={220}
          fromZero
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix=""
        />
      </View>

    </ScrollView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 16 },
  title: { fontSize: 22, fontWeight: "bold" },

  kpiRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  kpiCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
  },

  kpiLabel: { fontSize: 12, color: "#64748b" },
  kpiValue: { fontSize: 20, fontWeight: "bold" },
  kpiTrend: { fontSize: 12, color: "green" },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 12,
    borderRadius: 12,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
});