import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import * as Animatable from "react-native-animatable";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useAuth } from "../context/AuthContext";
import ModalFinalizarScreen from "./ModalFinalizarScreen";
import ModalAnularScreen from "./ModalAnularScreen";
import ModalEscalarScreen from "./ModalEscalarScreen";

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
  const [comments, setComments] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleAnular, setModalVisibleAnular] = useState(false);
  const [modalVisibleAsignar, setModalVisibleAsignar] = useState(false);
  const [commentType, setCommentType] = useState<"publico" | "interno">("publico");

  //Estado local del ticket — se actualiza tras acciones
  const [currentRequest, setCurrentRequest] = useState(route.params?.request);

  /* ---------------- LOAD TENANT & TOKEN ---------------- */
  useEffect(() => {
    const loadTenant = async () => {
      const tenantStored = await AsyncStorage.getItem("tenant_id");
      const tokenStore = await AsyncStorage.getItem("token");
      setTenant(tenantStored);
      setToken(tokenStore);
    };
    loadTenant();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (request?.id && token) {
        await loadTicket();
        await loadComments();
      }
    };
    load();
  }, [request?.id, token]);

  if (!request) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay datos de la solicitud</Text>
      </View>
    );
  }

  /* ---------------- LOAD TICKET ---------------- */
  const loadTicket = async () => {
    if (!token || !request?.id) return;

    try {
      const response = await fetch(
        `https://devticket.uchilefau.cl/api/tickets/${request.id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();
      console.log("LOAD TICKET:", json.data);

      if (response.ok && json.data) {
        setCurrentRequest(json.data); // ✅ actualiza estado reactivo
      }
    } catch (error) {
      console.log("ERROR CARGANDO TICKET:", error);
    }
  };

  /* ---------------- LOAD COMMENTS ---------------- */
  const loadComments = async () => {
    if (!token || !request?.id) return;

    try {
      const response = await fetch(
        `https://devticket.uchilefau.cl/api/tickets/${request.id}/comments`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();
      console.log("COMMENTS:", json.data);
      setComments(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.log("ERROR COMMENTS:", error);
    }
  };

  /* ---------------- PICK IMAGES ---------------- */
  const openImagePicker = () => {
    launchImageLibrary(
      { mediaType: "photo", selectionLimit: 0, quality: 0.7 },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        if (Array.isArray(res.assets)) {
          setImages((prev) => [...prev, ...res.assets]);
        }
      }
    );
  };

  const openCamera = () => {
    launchCamera(
      { mediaType: "photo", quality: 0.7, saveToPhotos: true },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        if (res.assets) {
          setImages((prev) => [...prev, ...res.assets]);
        }
      }
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------------- SEND COMMENT ---------------- */
  const handleSend = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("comment", comment);
      formData.append("type", commentType);

      images.forEach((img, index) => {
        formData.append("files[]", {
          uri: img.uri,
          type: img.type || "image/jpeg",
          name: img.fileName || `image_${index}.jpg`,
          nombre: img.fileName || `image_${index}.jpg`,
        });
      });

      const ticketId = Number(request.id);

      const response = await fetch(
        `https://devticket.uchilefau.cl/api/tickets/${ticketId}/comments`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("RESPUESTA API:", data);

      setComment("");
      setImages([]);
      await loadComments();
    } catch (error) {
      console.log("ERROR ENVIANDO:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- FORMAT DATE ---------------- */
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
      date.getSeconds()
    ).padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  /* ---------------- ACCIONES ---------------- */
  const handleTake = async () => {
    console.log("Tomar ticket", request.id);

    try {
      const response = await fetch(
        `https://devticket.uchilefau.cl/api/tickets/${request.id}/take`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Ticket tomado:", data);
        Alert.alert("Éxito", "Ticket tomado correctamente.");
        await loadTicket();   // ✅ recarga datos frescos del ticket
        await loadComments(); // ✅ recarga comentarios
      } else {
        console.error("Error al tomar el ticket:", data);
        Alert.alert("Error", data?.message || "No se pudo tomar el ticket.");
      }
    } catch (error) {
      console.error("Error al hacer la solicitud:", error);
      Alert.alert("Error", "Problema de conexión o del servidor.");
    }
  };

  const handleEscalate = () => {
    console.log("Escalar ticket", request.id);
    setModalVisibleAsignar(true);
  };

  const handleFinish = () => {
    console.log("Finalizar ticket", request.id);
    setModalVisible(true);
  };

  const handleCancel = () => {
    console.log("Anular ticket", request.id);
    setModalVisibleAnular(true);
  };

  //Usa currentRequest para que reaccione a cambios
  const stateId = currentRequest?.state?.id;
  const isBlocked = stateId === 3 || stateId === 4;

  const baseActions = [
    { label: "Escalar", icon: "arrow-up-circle", color: "rgba(241,245,248,1)", textColor: "#1a1d29", onPress: handleEscalate },
    { label: "Finalizar", icon: "check-circle", color: "rgba(230,250,238,1)", textColor: "#008236", onPress: handleFinish },
    { label: "Anular", icon: "x-circle", color: "rgba(255,234,235,1)", textColor: "#c10007", onPress: handleCancel },
  ];

  const actions =
    stateId === 3 || stateId === 4
      ? []
      : stateId === 2
        ? baseActions
        : stateId === 1
          ? [
            //Solo "Tomar ticket"
            { label: "Tomar ticket", icon: "user-check", color: "rgba(61, 123, 186, 0.57)", textColor: "#0d6efd", onPress: handleTake },
          ]
          : [
            { label: "Tomar ticket", icon: "user-check", color: "rgba(61, 123, 186, 0.57)", textColor: "#0d6efd", onPress: handleTake },
            ...baseActions,
          ];

  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);

  /* ---------------- COMMENT ITEM ---------------- */
  interface Comment {
    id: number;
    user: { name: string };
    internal: boolean;
    comment: string;
    created_at: string;
  }

  const renderCommentItem = (item: Comment) => (
    <View key={item.id} style={styles.commentItem}>
      <Text style={styles.commentUser}>
        {item.user?.name}
        <View style={styles.commentStatus}>
          <Icon
            name={item.internal ? "lock" : "unlock"}
            size={10}
            color={"#64748b"}
            style={{ marginLeft: 12 }}
          />
          <Text style={styles.commentStatusText}>
            {item.internal ? "Interno" : "Público"}
          </Text>
        </View>
      </Text>
      <Text style={styles.commentText}>{item.comment}</Text>
      <Text style={styles.commentDate}>{formatDateTime(item.created_at)}</Text>
    </View>
  );

  /* ---------------- REFRESH ---------------- */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTicket();   // ✅ también recarga el ticket completo
    await loadComments();
    setIsRefreshing(false);
  };

  /* ---------------- RENDER ---------------- */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

        {/* SUB HEADER */}
        <View style={styles.headerTwo}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitleTwo}>
            Solicitud #{currentRequest?.id}
          </Text>
        </View>

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

          {/* INFO CARD — ✅ todo usa currentRequest */}
          <View style={styles.card}>
            <Text style={styles.title}>{currentRequest?.subject}</Text>
            <Text style={styles.sub}>
              {currentRequest?.created_at
                ? formatDateTime(currentRequest.created_at)
                : "Sin fecha"}
            </Text>

            {/* TAGS */}
            <View style={styles.tags}>
              <Text style={[styles.tag, getStatusColor(currentRequest?.state?.name)]}>
                {currentRequest?.state?.name ?? "Sin estado"}
              </Text>
              <Text style={[styles.tag, getPriorityColor(currentRequest?.priority?.name)]}>
                {currentRequest?.priority?.name ?? "Sin prioridad"}
              </Text>
              <Text style={styles.category}>
                {currentRequest?.category?.name ?? "Sin categoria"}
              </Text>
            </View>

            <View style={styles.row}>
              <Icon name="user" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.text}>
                <Text style={styles.label}>Asignado a: </Text>
                <Text style={styles.value}>
                  {currentRequest?.assigned_user?.name ?? "Sin asignar"}
                </Text>
              </Text>
            </View>

            <View style={styles.row}>
              <Icon name="users" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.text}>
                <Text style={styles.label}>Grupo: </Text>
                <Text style={styles.value}>
                  {currentRequest?.assigned_group?.name ?? "Sin grupo"}
                </Text>
              </Text>
            </View>

            <View style={styles.row}>
              <Icon name="tag" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.text}>
                <Text style={styles.label}>Creación: </Text>
                <Text style={styles.value}>
                  {currentRequest?.created_at
                    ? formatDate(currentRequest.created_at)
                    : "Sin fecha"}
                </Text>
              </Text>
            </View>
          </View>

          {/* SLA — ✅ usa currentRequest */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="clock" size={14} color="#000000" />
              <Text style={styles.text}>
                <Text style={styles.labelSla}>SLA</Text>
              </Text>
            </View>

            <View style={styles.rowSla}>
              <Text style={styles.label}>Toma</Text>
              <View style={styles.valueContainer}>
                <Icon name="clock" size={14} color="#10b880" />
                <Text style={styles.valueGreen}>
                  {currentRequest?.sla?.toma_horas ?? "0"}
                </Text>
              </View>
            </View>

            <View style={styles.rowSla}>
              <Text style={styles.label}>Respuesta</Text>
              <View style={styles.valueContainer}>
                <Icon name="clock" size={14} color="#10b880" />
                <Text style={styles.valueGreen}>
                  {currentRequest?.sla?.respuesta_horas ?? "0"}
                </Text>
              </View>
            </View>

            <View style={styles.rowSla}>
              <Text style={styles.label}>Resolución</Text>
              <View style={styles.valueContainer}>
                <Icon name="clock" size={14} color="#f59d0b" />
                <Text style={styles.valueOrange}>
                  {currentRequest?.sla?.resolucion_horas ?? "0"}
                </Text>
              </View>
            </View>
          </View>


          {/* ACCIONES */}
          {stateId !== 3 && stateId !== 4 && (
            <View style={styles.card}>
              <Text style={styles.labelSla}>ACCIONES</Text>

              {primaryAction && (
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    { backgroundColor: primaryAction.color },
                    loading && { opacity: 0.6 },
                  ]}
                  onPress={primaryAction.onPress}
                  disabled={loading}
                >
                  <Icon name={primaryAction.icon} size={18} color={primaryAction.textColor} />
                  <Text style={[styles.primaryText, { color: primaryAction.textColor }]}>
                    {primaryAction.label}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.secondaryContainer}>
                {secondaryActions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.secondaryButton,
                      action.label === "Anular" && styles.dangerButton,
                    ]}
                    onPress={action.onPress}
                    disabled={loading}
                  >
                    <Icon name={action.icon} size={16} color={action.textColor} />
                    <Text
                      style={[
                        styles.secondaryText,
                        action.label === "Anular" && styles.dangerText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* COMENTARIOS */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="message-circle" size={14} color="#000000" />
              <Text style={styles.text}>
                <Text style={styles.labelSla}>COMENTARIOS</Text>
              </Text>
            </View>
            {comments.length === 0 ? (
              <Text>No hay comentarios</Text>
            ) : (
              (Array.isArray(comments) ? comments : []).map(renderCommentItem)
            )}

            {stateId !== 3 && stateId !== 4 && (
              <>
                <View style={{ marginTop: 6 }}>
                  <TextInput
                    style={styles.input}
                    placeholder="Añadir un comentario..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                  />
                </View>

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
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() =>
                      setCommentType(commentType === "publico" ? "interno" : "publico")
                    }
                  >
                    <Icon
                      name={commentType === "interno" ? "check-square" : "square"}
                      size={18}
                      color={commentType === "interno" ? "#2563eb" : "#64748b"}
                    />
                  </TouchableOpacity>

                  <View style={styles.internalComment}>
                    <Icon
                      name={commentType === "interno" ? "lock" : "unlock"}
                      size={14}
                      color="#64748b"
                    />
                    <Text style={styles.internalText}>
                      {commentType === "interno" ? "Comentario interno" : "Comentario público"}
                    </Text>
                  </View>

                  <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={openCamera}>
                      <Icon name="camera" size={18} color="#64748b" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={openImagePicker}>
                      <Icon name="image" size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.helperText}>
                  Puedes adjuntar varios archivos (máx. 10 MB c/u)
                </Text>
              </>
            )}
          </View>

          {/* SEND */}
          {stateId !== 3 && stateId !== 4 && (
            <>
              <TouchableOpacity
                style={[styles.sendBtn, (loading || isBlocked) && { opacity: 0.6 }]}
                onPress={handleSend}
                disabled={loading || isBlocked}
              >
                <Icon name="send" size={16} color="#fff" />
                <Text style={styles.btnText}>
                  {loading ? "Enviando..." : "Enviar"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        {/* MODAL FINALIZAR */}
        <ModalFinalizarScreen
          visible={modalVisible}
          request={currentRequest}
          onClose={() => setModalVisible(false)}
          onSubmit={async () => {  // ✅ sin parámetros
            setModalVisible(false);
            await loadTicket();
            await loadComments();
          }}
          setLoading={setLoading}
          setModalVisible={setModalVisible}
        />

        {/* MODAL ANULAR */}
        <ModalAnularScreen
          visible={modalVisibleAnular}
          request={currentRequest}
          onClose={() => setModalVisibleAnular(false)}
          onSubmit={async () => {
            setModalVisibleAnular(false);
            await loadTicket();
            await loadComments();
          }}
          setLoading={setLoading}
          setModalVisible={setModalVisibleAnular}
        />

        {/* MODAL ESCALAR */}
        <ModalEscalarScreen
          visible={modalVisibleAsignar}
          request={currentRequest}
          onClose={() => setModalVisibleAsignar(false)}
          onSubmit={async () => {
            setModalVisibleAsignar(false);
            await loadTicket();
            await loadComments();
          }}
          setLoading={setLoading}
          setModalVisible={setModalVisibleAsignar}
        />

      </View>
    </KeyboardAvoidingView>
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
    case "Anulada":
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
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 30,
  },

  headerTwo: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
  },

  headerTitleTwo: { fontSize: 16, fontWeight: "600" },

  content: { padding: 12 },

  contentContainer: {
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
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

  valueGreen: {
    color: "#10b880", // más oscuro para el nombre
    fontWeight: "500",
  },

  valueOrange: {
    color: "#f59d0b", // más oscuro para el nombre
    fontWeight: "500",
  },

  rowSla: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },

  labelSla: {
    fontWeight: "600",
    color: "#000",
  },

  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4, // si no funciona, usa marginRight en el icon
  },

  actionBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  btnTextAccion: {
    color: "#000000",
    fontWeight: "600",
  },

  commentBox: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#334155',
  },

  commentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  commentDate: {
    fontSize: 12,
    color: 'gray',
  },

  commentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  commentStatusText: {
    marginLeft: 3,
    fontSize: 10,
    color: '#64748b',
  },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },

  primaryText: {
    fontSize: 14,
    fontWeight: "600",
  },

  secondaryContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
  },

  dangerButton: {
    borderColor: "#fecaca",
  },

  secondaryText: {
    fontSize: 13,
    color: "#334155",
  },

  dangerText: {
    color: "#dc2626",
  },
});