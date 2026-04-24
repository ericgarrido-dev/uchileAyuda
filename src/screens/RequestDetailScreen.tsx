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
import { launchImageLibrary } from "react-native-image-picker";
import { useAuth } from "../context/AuthContext";

export default function RequestDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { logout } = useAuth();

  const request = route.params?.request;

  const [comment, setComment] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [tenant, setTenant] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD TENANT ---------------- */
  useEffect(() => {
    const loadTenant = async () => {
      const tenantStored = await AsyncStorage.getItem("tenant_id");
      const tokenStore = await AsyncStorage.getItem("token");

      setTenant(tenantStored);
      setToken(tokenStore);

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

  const [commentType, setCommentType] = useState<"publico" | "interno">("publico");

  /* ---------------- PICK IMAGES ---------------- */
  const openImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 0,
        quality: 0.7,
      },
      (res) => {
        if (res.didCancel || res.errorCode) return;

        if (res.assets) {
          setImages((prev) => [...prev, ...res.assets]);
        }
      }
    );
  };

  const handleSend = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      // comentario
      formData.append("comment", comment);

      // interno
      formData.append("type", isChecked ? "interno" : "publico");

      // imágenes
      images.forEach((img, index) => {
        formData.append("files[]", {
          uri: img.uri,
          type: img.type || "image/jpeg",
          name: img.fileName || `image_${index}.jpg`,
          nombre: img.fileName || `image_${index}.jpg`,
        });
      });

      const response = await fetch(
        "https://devticket.uchilefau.cl/api/tickets/2172/comments",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            // si tienes auth:
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      console.log("RESPUESTA API:", data);

      // limpiar UI
      setComment("");
      setImages([]);

    } catch (error) {
      console.log("ERROR ENVIANDO:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------- FORMAT DATE ---------------- */
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Bienvenido a</Text>
          <Text style={styles.headerTitle}>
            {tenant ? `${tenant}.uchile.cl` : "ayuda.uchile.cl"}
          </Text>
        </View>

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Icon name="log-out" size={16} color="#fff" />
        </TouchableOpacity>
      </Animatable.View>

      {/* SUB HEADER */}
      <View style={styles.headerTwo}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} />
        </TouchableOpacity>

        <Text style={styles.headerTitleTwo}>
          Solicitud #{request.id}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* INFO CARD */}
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
            <Icon name="user" size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.text}>
              <Text style={styles.label}>Asignado a: </Text>
              <Text style={styles.value}>
                {request?.assigned_user?.name ?? "Sin asignar"}
              </Text>
            </Text>
          </View>

          <View style={styles.row}>
            <Icon name="users" size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.text}>
              <Text style={styles.label}>Grupo: </Text>
              <Text style={styles.value}>
                {request?.assigned_group?.name ?? "Sin grupo"}
              </Text>
            </Text>
          </View>

          <View style={styles.row}>
            <Icon name="tag" size={14} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.text}>
              <Text style={styles.label}>Creación: </Text>
              <Text style={styles.value}>
                Creación: {formatDate(request.created_at) || "Sin fecha"}
              </Text>
            </Text>
          </View>

        </View>

        {/* COMENTARIOS */}
        <View style={styles.card}>

          <TextInput
            style={styles.input}
            placeholder="Añadir un comentario..."
            value={comment}
            onChangeText={setComment}
            multiline
          />

          {/* IMAGES PREVIEW */}
          {images.length > 0 && (
            <View style={styles.imageRow}>
              {images.map((img, index) => (
                <View key={index} style={styles.imageBox}>
                  <Image source={{ uri: img.uri }} style={styles.previewImage} />

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="x" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* FOOTER */}
          <View style={styles.footer}>

            {/* CHECKBOX */}
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setCommentType(
                  commentType === "publico" ? "interno" : "publico"
                )
              }
            >
              <Icon
                name={commentType === "interno" ? "check-square" : "square"}
                size={18}
                color={commentType === "interno" ? "#2563eb" : "#64748b"}
              />
            </TouchableOpacity>

            {/* TEXTO ESTADO */}
            <View style={styles.internalComment}>
              <Icon
                name={commentType === "interno" ? "lock" : "globe"}
                size={14}
                color="#64748b"
              />
              <Text style={styles.internalText}>
                {commentType === "interno"
                  ? "Comentario interno"
                  : "Comentario público"}
              </Text>
            </View>

            {/* ATTACH */}
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={openImagePicker}>
                <Icon name="paperclip" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

          </View>

          {/* TEXTO ABAJO */}
          <Text style={styles.helperText}>
            Puedes adjuntar varios archivos (máx. 10 MB c/u)
          </Text>
        </View>

        {/* SEND */}
        <TouchableOpacity
          style={[styles.sendBtn, loading && { opacity: 0.6 }]}
          onPress={handleSend}
          disabled={loading}
        >
          <Icon name="send" size={16} color="#fff" />
          <Text style={styles.btnText}>
            {loading ? "Enviando..." : "Enviar"}
          </Text>
        </TouchableOpacity>

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

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#f5f6fa" },

  header: {
    backgroundColor: "#007aff",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerSubtitle: { color: "#fff", opacity: 0.8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  headerTwo: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
  },

  headerTitleTwo: { fontSize: 16, fontWeight: "600" },

  content: { padding: 12 },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },

  title: { fontSize: 16, fontWeight: "600" },
  sub: { fontSize: 12, color: "#64748b", marginBottom: 10 },

  row: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 10 },
  text: { fontSize: 12, color: "#000000" },

  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    borderRadius: 8,
    minHeight: 80,
    marginBottom: 10,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  internalText: {
    fontSize: 12,
    color: "#64748b",
  },

  leftActions: { flexDirection: "row" },

  iconBtn: { padding: 6 },

  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: "#64748b",
  },

  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  imageBox: {
    position: "relative",
  },

  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },

  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },

  sendBtn: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  btnText: { color: "#fff", fontWeight: "600" },

  logout: { marginTop: 20 },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748b" },

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

  internalComment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  label: {
    color: "#64748b", // gris suave para el texto fijo
  },

  value: {
    color: "#0f172a", // más oscuro para el nombre
    fontWeight: "500",
  },
});