import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

type Props = {
  visible: boolean;
  onClose: () => void;
  request: any;
  onSubmit?: (data: any) => void;
  setLoading: (loading: boolean) => void; // Recibir setLoading
  setModalVisible: (visible: boolean) => void; // Recibimos setModalVisible
};

export default function ModalAnularScreen({
  visible,
  onClose,
  request,
  onSubmit,
  setLoading, // Recibimos setLoading
  setModalVisible, // Recibimos setModalVisible
}: Props) {
  // Declarar los hooks fuera de handleSubmit
  const [tenant, setTenant] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  /* ---------------- LOAD STORAGE ---------------- */
  useEffect(() => {
    const loadTenant = async () => {
      const tenantStored = await AsyncStorage.getItem("tenant_id");
      const tokenStore = await AsyncStorage.getItem("token");

      setTenant(tenantStored);
      setToken(tokenStore);
    };

    loadTenant();
  }, []); // Solo se ejecuta al montar el componente

  const handleSubmit = async () => {
    if (!request?.id) {
      Alert.alert("No se pudo obtener el ID de la solicitud.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        `/tickets/${request.id}/anular`,
        { request_id: request.id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;
      console.log("RESPUESTA DE ANULACIÓN:", data);

      if (data.success) {
        onSubmit?.({ request_id: request.id });
        setModalVisible(false);
        onClose();
        Alert.alert("Ticket anulado exitosamente.");
      } else {
        Alert.alert("Error", "No se pudo anular el ticket. Intente nuevamente.");
      }

    } catch (error: any) {
      const msg = error?.response?.data?.message;
      Alert.alert("Error", msg || "Hubo un error al intentar anular el ticket.");
      console.error("Error al anular el ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <Text style={styles.title}>Anular Ticket</Text>

            <Text style={styles.text}>
              ¿Seguro que deseas anular esta solicitud? Esta acción no se puede deshacer.
            </Text>
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.confirm}>Anular</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  text: {
    color: "#374151",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  cancel: {
    color: "#64748b",
  },

  confirm: {
    color: "#f60817",
    fontWeight: "bold",
  },
});