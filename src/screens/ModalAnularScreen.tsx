import axios from 'axios'; // Asegúrate de importar axios
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
    // Comprobamos si la solicitud tiene un ID antes de enviar
    if (!request?.id) {
      Alert.alert("No se pudo obtener el ID de la solicitud.");
      return;
    }

    // Datos a enviar en el request
    const payload = {
      request_id: request?.id,
    };

    console.log("Anular ticket:", payload);

    try {
      setLoading(true); // Activar el estado de carga

      // Usamos axios para hacer la solicitud POST
      const response = await axios.post(
        `https://devticket.uchilefau.cl/api/tickets/${request?.id}/anular`,
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Asegúrate de tener el token
          }
        }
      );

      const data = response.data; // Obtener la respuesta de la API

      console.log("RESPUESTA DE ANULACIÓN:", data);

      if (data.success) {
        onSubmit?.(payload); // Si la anulación es exitosa, llamar a onSubmit

        setModalVisible(false); // Cerrar el modal de anulación
        onClose(); // Llamar a onClose para cerrar el modal

        Alert.alert("Ticket anulado exitosamente.");
      } else {
        console.error("Error al anular el ticket", data.message);
        Alert.alert("Error", "No se pudo anular el ticket. Intente nuevamente.");
      }
    } catch (error) {
      console.error("Error al anular el ticket:", error);
      Alert.alert("Error", "Hubo un error al intentar anular el ticket.");
    } finally {
      setLoading(false); // Desactivar el estado de carga
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