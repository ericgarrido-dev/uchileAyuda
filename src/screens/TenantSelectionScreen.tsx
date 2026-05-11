import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import * as Animatable from "react-native-animatable";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import api from "../services/api";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  description: string;
}

interface Props {
  tenants: Tenant[];
  userName: string;
  loginTicket: string;                      // ✅ necesario para canjear por token
  onSelectTenant: (tenantId: string) => void;
  onLogout: () => void;
}

export default function TenantSelectionScreen({
  tenants,
  userName,
  loginTicket,
  onSelectTenant,
  onLogout,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected) return;

    try {
      setLoading(true);
      setError("");

      // 1. Canjear el login_ticket por el token del tenant seleccionado.
      //    El backend necesita saber QUÉ tenant eligió el usuario para
      //    generar el token con los permisos correctos de esa unidad.
      const response = await api.post('/mobile/auth/select-tenant', {
        login_ticket: loginTicket,
        tenant_id: selected,
      });

      const token =
        response.data?.token ??
        response.data?.access_token;

      if (!token) {
        setError("No se recibió token del servidor");
        return;
      }

      // 2. Guardar token + tenant_id en AsyncStorage
      //    (mismo lugar donde los lee DashboardScreen)
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("tenant_id", selected);

      // 👇 Guardar FCM token aquí, cuando el JWT ya está en AsyncStorage
      try {
        const fcmToken = await messaging().getToken();
        console.log("✅ tenant ", selected);
        console.log("✅ FCM token ", fcmToken);

        await api.post('/mobile/fcm-token', {
          token: fcmToken,
          platform: 'android',
          tenant_id: selected,
        }, {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 token que acabas de recibir, no desde AsyncStorage
          },
        });
        console.log("✅ FCM token guardado correctamente");
      } catch (fcmError) {
        console.log("❌ Error guardando FCM token:", fcmError);
      }

      // 3. Navegar al dashboard
      onSelectTenant(selected);

    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setError(msg || "Error al seleccionar el sistema. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <Text style={styles.headerSubtitle}>Bienvenido {userName}</Text>
        <Text style={styles.headerTitle}>Selecciona un sistema</Text>
      </Animatable.View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* LISTA DE TENANTS */}
        {tenants?.map((tenant) => {
          const isSelected = selected === tenant.id;

          return (
            <TouchableOpacity
              key={tenant.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => {
                setSelected(tenant.id);
                setError("");
              }}
            >
              <View style={styles.row}>
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Icon name="grid" size={20} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{tenant.name}</Text>
                  <Text style={styles.domain}>{tenant.domain}</Text>
                  <Text style={styles.desc}>{tenant.description}</Text>
                </View>

                {isSelected && (
                  <Icon name="check-circle" size={22} color="#007aff" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ERROR */}
        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={14} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* CONTINUAR */}
        <TouchableOpacity
          style={[styles.button, (!selected || loading) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Icon name="log-out" size={16} color="#666" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Sistema multi-tenant · Universidad de Chile
        </Text>

      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    backgroundColor: "#007aff",
    padding: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 5,
  },
  headerSubtitle: {
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: "#007aff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBoxSelected: {
    backgroundColor: "#007aff",
  },
  title: {
    fontWeight: "600",
  },
  domain: {
    fontSize: 12,
    color: "#007aff",
    marginTop: 2,
  },
  desc: {
    fontSize: 12,
    color: "#666",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    flex: 1,
  },
  button: {
    backgroundColor: "#007aff",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  logout: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    gap: 6,
  },
  logoutText: {
    color: "#666",
  },
  footer: {
    textAlign: "center",
    fontSize: 10,
    color: "#999",
    marginTop: 20,
  },
});
