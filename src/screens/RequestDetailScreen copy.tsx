import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import * as Animatable from "react-native-animatable";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchCamera } from "react-native-image-picker";
import { useAuth } from "../context/AuthContext";

export default function RequestDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { logout } = useAuth();
  const request = route.params?.request;
  const [isChecked, setIsChecked] = useState(false);

  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [tenant, setTenant] = useState<string | null>(null);

  console.log("REQUEST:", request);


  /* ---------------- FIX ASYNC STORAGE ---------------- */
  useEffect(() => {
    const loadTenant = async () => {
      const tenantStored = await AsyncStorage.getItem("tenant_id");
      setTenant(tenantStored);
    };

    loadTenant();
  }, []);

  if (!request) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay datos de la solicitud</Text>
      </View>
    );
  }

  /* ---------------- CAMARA ---------------- */
  const openCamera = () => {
    launchCamera(
      {
        mediaType: "photo",
        saveToPhotos: true,
        quality: 0.7,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          console.log("Camera error:", response.errorMessage);
          return;
        }

        const uri = response.assets?.[0]?.uri;
        if (uri) setPhoto(uri);
      }
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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

      {/* HEADER */}
      <View style={styles.headerTwo}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} />
        </TouchableOpacity>

        <Text style={styles.headerTitleTwo}>
          Solicitud #{request.id}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* INFO */}
        <View style={styles.card}>
          <Text style={styles.title}>{request.subject}</Text>
          <Text style={styles.sub}>{formatDateTime(request?.created_at) || "Sin fecha"}</Text>

          {/* TAGS */}
          <View style={styles.tags}>
            <Text style={[styles.tag, getStatusColor(request?.state?.name)]}>
              {request?.state?.name ?? "Sin estado"}
            </Text>

            <Text style={[styles.tag, getPriorityColor(request?.priority?.name)]}>
              {request?.priority?.name ?? "Sin prioridad"}
            </Text>

            <Text style={styles.category}>
              {request?.category?.name ?? "Sin categoria"}
            </Text>
          </View>

          <View style={styles.row}>
            <Icon name="user" size={14} color="#64748b" />
            <Text style={styles.text}>
              Asignado a: {request?.assigned_user?.name ?? "Sin asignar"}
            </Text>
          </View>

          <View style={styles.row}>
            <Icon name="users" size={14} color="#64748b" />
            <Text style={styles.text}>
              Grupo: {request?.assigned_group?.name ?? "Sin grupo"}
            </Text>
          </View>

          <View style={styles.row}>
            <Icon name="tag" size={14} color="#64748b" />
            <Text style={styles.text}>
              Creación: {formatDate(request.created_at) || "Sin fecha"}
            </Text>
          </View>

        </View>

        {/* COMENTARIOS + FOTO */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Añadir un comentario..."
            value={comment}
            onChangeText={setComment}
            multiline
          />

          {/* FOTO PREVIEW */}
          {photo && (
            <Image source={{ uri: photo }} style={styles.preview} />
          )}

          {/* FOOTER */}
          <View style={styles.footer}>

            {/* IZQUIERDA */}
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setIsChecked(!isChecked)}
            >
              <Icon
                name={isChecked ? "check-square" : "square"}
                size={18}
                color={isChecked ? "#2563eb" : "#64748b"}
              />
            </TouchableOpacity>
            
            {/* DERECHA */}
            <View style={styles.internalComment}>
              <Icon name="lock" size={14} color="#64748b" />
              <Text style={styles.internalText}>Comentario interno</Text>
            </View>

            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={openCamera}>
                <Icon name="paperclip" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* TEXTO ABAJO */}
          <Text style={styles.helperText}>
            Puedes adjuntar varios archivos (máx. 10 MB c/u)
          </Text>
        </View>

        <View>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              console.log("Comentario:", comment);
              console.log("Foto:", photo);
              setComment("");
              setPhoto(null);
            }}
          >
            <Icon name="send" size={16} color="#fff" />
            <Text style={styles.btnText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------------- HELPERS ---------------- */

function getStatusColor(status: string) {
  switch (status) {
    case "Pendiente":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "Proceso":
      return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
    case "Cerrado":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "Cnulada":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return {};
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "Baja":
      return { backgroundColor: "#dcfce7", color: "#166534" };
    case "Media":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "Alta":
      return { backgroundColor: "#fed7aa", color: "#9a3412" };
    case "Critical":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    default:
      return {};
  }
}

/* ---------------- COMPONENT ---------------- */

function ActionButton({ icon, label, color = "#0f172a" }: any) {
  return (
    <Animatable.View animation="fadeInUp">
      <TouchableOpacity style={styles.actionBtn}>
        <Icon name={icon} size={16} color={color} />
        <Text style={[styles.actionText, { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    color: "#64748b",
  },

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

  headerSubtitle: {
    color: "#fff",
    opacity: 0.8,
    marginTop: 8,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  headerTwo: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
  },

  headerTitleTwo: {
    fontSize: 16,
    fontWeight: "600",
  },

  content: {
    padding: 12,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },

  sub: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 6,
  },

  text: {
    fontSize: 12,
    color: "#334155",
  },

  sectionTitle: {
    fontWeight: "600",
    marginBottom: 10,
  },

  actionBtn: {
    flexDirection: "row",
    gap: 6,
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 6,
    alignItems: "center",
  },

  actionText: {
    fontWeight: "500",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    borderRadius: 8,
    minHeight: 80,
    marginBottom: 10,
  },

  sendBtn: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  preview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },

  cameraBtn: {
    flex: 1,
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 30,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  tag: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },

  category: {
    fontSize: 10,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconBtn: {
    padding: 6,
  },

  internalComment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  internalText: {
    fontSize: 12,
    color: "#64748b",
  },

  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: "#64748b",
  },

  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  checkboxText: {
    fontSize: 14,
    color: "#334155",
  },
});