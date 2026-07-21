import React, { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
  Modal,
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
import api, { STORAGE_URL } from "../services/api";
import messaging from "@react-native-firebase/messaging";
import { WebView } from "react-native-webview";
import { FloatingButton } from "../components/FloatingButton";
import { StatusBar } from "react-native";

export default function RequestDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { logout } = useAuth();

  const request = route.params?.request;

  const [comment, setComment] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [tenant, setTenant] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [comments, setComments] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleAnular, setModalVisibleAnular] = useState(false);
  const [modalVisibleAsignar, setModalVisibleAsignar] = useState(false);
  const [commentType, setCommentType] = useState<"publico" | "interno">("publico");
  const [currentRequest, setCurrentRequest] = useState(route.params?.request);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(50);

  const tokenRef = useRef<string | null>(null);
  const loadCommentsRef = useRef<() => Promise<void>>(async () => { });

  /* ---------------- LOAD TENANT & TOKEN ---------------- */
  useEffect(() => {
    const loadTenant = async () => {
      const tenantStored = await AsyncStorage.getItem("tenant_id");
      const tokenStore = await AsyncStorage.getItem("token");
      setTenant(tenantStored);
      setToken(tokenStore);
      tokenRef.current = tokenStore;
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

  /* ---------------- LOAD TICKET ---------------- */
  const loadTicket = async () => {
    if (!token || !request?.id) return;
    try {
      setLoadingTicket(true);
      const response = await api.get(`/tickets/${request.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data?.data;
      console.log('numero', data)
      if (data) setCurrentRequest(data);
    } catch (error) {
      console.log("ERROR CARGANDO TICKET:", error);
    } finally {
      setLoadingTicket(false);
    }
  };

  /* ---------------- LOAD COMMENTS ---------------- */
  const loadComments = async () => {
    const currentToken = tokenRef.current || token;
    if (!currentToken || !request?.id) return;

    try {
      const response = await api.get(`/tickets/${request.id}/comments`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      const json = response.data;
      const sortedComments = Array.isArray(json.data) ? json.data : [];

      setComments((prev: any[]) => {
        const prevIds = prev.map((c) => c.id).join(",");
        const newIds = sortedComments.map((c: any) => c.id).join(",");
        if (prevIds === newIds) return prev;
        return sortedComments;
      });

      sortedComments.forEach((c: any) => {
        if (Array.isArray(c.attachments)) {
          c.attachments.forEach((att: any) => {
            if (att.path) loadImageBase64(att.path, att.src);
          });
        }
      });
    } catch (error) {
      console.log("ERROR COMMENTS:", error);
    }
  };

  useEffect(() => {
    loadCommentsRef.current = loadComments;
  }, [loadComments, token]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  /* ---------------- FIREBASE FOREGROUND ---------------- */
  useEffect(() => {
    if (!request?.id) return;
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const ticketId = remoteMessage.data?.ticket_id;
      if (String(ticketId) === String(request.id)) {
        await loadCommentsRef.current();
      }
    });
    return () => unsubscribe();
  }, [request?.id]);

  /* ---------------- POLLING (15s) ---------------- */
  useEffect(() => {
    if (!request?.id || !token) return;
    const interval = setInterval(() => {
      loadCommentsRef.current();
    }, 15000);
    return () => clearInterval(interval);
  }, [request?.id, token]);

  /* ---------------- CARGAR IMAGEN CON TOKEN ---------------- */
  const loadImageBase64 = async (path: string, src?: string) => {
    if (imageCache[path]) return;
    if (src) {
      setImageCache((prev) => ({ ...prev, [path]: src }));
    }
  };

  /* ---------------- PICK IMAGES ---------------- */
  const openImagePicker = () => {
    launchImageLibrary(
      { mediaType: "photo", selectionLimit: 0, quality: 0.7 },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        if (Array.isArray(res.assets)) setImages((prev) => [...prev, ...res.assets]);
      }
    );
  };

  const openCamera = () => {
    launchCamera(
      { mediaType: "photo", quality: 0.7, saveToPhotos: true },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        if (res.assets) setImages((prev) => [...prev, ...res.assets]);
      }
    );
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openAttachmentImage = (uri: string) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
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
        } as any);
      });
      await api.post(`/tickets/${Number(request.id)}/comments`, formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
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
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  /* ---------------- ACCIONES ---------------- */
  const handleTake = async () => {
    try {
      const response = await api.post(
        `/tickets/${request.id}/take`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      if (data.success) {
        Alert.alert("Éxito", "Ticket tomado correctamente.");
        await loadTicket();
        await loadComments();
      } else {
        Alert.alert("Error", data?.message || "No se pudo tomar el ticket.");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Problema de conexión.");
    }
  };

  const handleEscalate = () => setModalVisibleAsignar(true);
  const handleFinish = () => setModalVisible(true);
  const handleCancel = () => setModalVisibleAnular(true);

  /* ---------------- REFRESH ---------------- */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTicket();
    await loadComments();
    setIsRefreshing(false);
  };

  /* ---------------- COMMENT ITEM ---------------- */
  interface Comment {
    id: number;
    user: { name: string };
    internal: boolean;
    comment: string;
    created_at: string;
    attachments?: { path: string; name?: string; src?: string }[];
  }

  const renderCommentItem = (item: Comment) => {
    const isInternal = item.internal;

    return (
      <View
        key={item.id}
        style={[
          styles.commentItem,
          isInternal && { backgroundColor: "#fef3c7", borderLeftWidth: 3, borderLeftColor: "#fef3c7" },
        ]}
      >
        <View style={styles.commentHeader}>
          <View style={[styles.iconBox, { backgroundColor: isInternal ? "#92400e20" : "#155dfc20" }]}>
            <Icon name="user" size={18} color={isInternal ? "#92400e" : "#155dfc"} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.commentUser}>{item.user?.name}</Text>
              <View
                style={[
                  styles.commentStatus,
                  isInternal && { backgroundColor: "#92400e15" },
                ]}
              >
                <Icon
                  name={isInternal ? "lock" : "unlock"}
                  size={10}
                  color={isInternal ? "#92400e" : "#767676"}
                />
                <Text
                  style={[
                    styles.commentStatusText,
                    isInternal && { color: "#92400e" },
                  ]}
                >
                  {isInternal ? "Interno" : "Público"}
                </Text>
              </View>
            </View>
            <Text style={[styles.commentDate, { marginTop: 2 }]}>
              {formatDateTime(item.created_at)}
            </Text>
          </View>
        </View>
        <Text style={[styles.commentText, { marginLeft: 44 }]}>{item.comment}</Text>

        {Array.isArray(item.attachments) && item.attachments.length > 0 && (
          <View style={styles.imageRow}>
            {item.attachments.map((att, idx) => {
              const cachedUri = imageCache[att.path];
              const uri = cachedUri ?? att.src;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.imageBox}
                  onPress={() => uri && openAttachmentImage(uri)}
                >
                  {uri ? (
                    <Image source={{ uri }} style={styles.previewImage} />
                  ) : (
                    <View style={[styles.previewImage, styles.imagePlaceholder]}>
                      <ActivityIndicator size="small" color="#64748b" />
                    </View>
                  )}
                  <View style={styles.attachOverlay}>
                    <Icon name="zoom-in" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  /* ---------------- ACTIONS CONFIG ---------------- */
  const stateId = currentRequest?.state?.id;
  const isBlocked = stateId === 3 || stateId === 4;
  const permissions = currentRequest?.permissions;

  const baseActions = [
    permissions?.can_assign && { label: "Escalar", icon: "arrow-up-circle", color: "rgba(241,245,248,1)", textColor: "#1a1d29", onPress: handleEscalate },
    permissions?.can_finalize && { label: "Finalizar", icon: "check-circle", color: "rgba(230,250,238,1)", textColor: "#008236", onPress: handleFinish },
    permissions?.can_cancel && { label: "Anular", icon: "x-circle", color: "rgba(255,234,235,1)", textColor: "#c10007", onPress: handleCancel },
  ].filter(Boolean);

  const takeAction = permissions?.can_take && { label: "Tomar ticket", icon: "user-check", color: "rgba(61, 123, 186, 0.57)", textColor: "#0d6efd", onPress: handleTake };

  const actions =
    stateId === 3 || stateId === 4
      ? []
      : stateId === 2
        ? baseActions
        : stateId === 1 && permissions?.can_take
          ? [takeAction]
          : permissions?.can_take
            ? [takeAction, ...baseActions]
            : baseActions;

  const primaryAction = actions[0];
  const secondaryActions = actions.slice(1);

  const injectedJS = `
    setTimeout(() => {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ height: document.body.scrollHeight })
      );
    }, 300);
    true;
  `;

  /* ---------------- GUARDS ---------------- */
  if (!request?.id) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay datos de la solicitud</Text>
      </View>
    );
  }

  if (loadingTicket && !currentRequest?.subject) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={{ marginTop: 10, color: "#64748b" }}>Cargando ticket...</Text>
      </View>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerTwo}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitleTwo}>Solicitud #{currentRequest?.id}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#2563eb"]} />}
        >
          {/* INFO CARD */}
          <View style={styles.card}>
            <Text style={styles.title}>{currentRequest?.subject}</Text>
            <Text style={styles.sub}>
              <Icon name="calendar" size={12} /> Creado {currentRequest?.created_at ? formatDateTime(currentRequest.created_at) : "Sin fecha"} - Actualizado{" "}
              {currentRequest?.updated_at ? formatDateTime(currentRequest.updated_at) : "Sin fecha"}
            </Text>
            <View style={styles.tags}>
              <Text style={[styles.tag, getStatusColor(currentRequest?.state?.name)]}>
                {currentRequest?.state?.name ?? "Sin estado"}
              </Text>
              <Text style={[styles.tag, getPriorityColor(currentRequest?.priority?.name)]}>
                {currentRequest?.priority?.name ?? "Sin prioridad"}
              </Text>
              <Text style={styles.category}>{currentRequest?.category?.name ?? "Sin categoria"}</Text>
            </View>

            <View style={styles.separator} />

            {/* DESCRIPCIÓN */}
            <View style={styles.row}>
              <Icon name="user" size={14} color="#000000" style={{ marginRight: 2 }} />
              <Text style={styles.labelSolicitante}>Solicitante:</Text>
              <Text style={[styles.value, { flex: 1 }]}>
                {currentRequest?.requester?.name ?? "Sin responsable"}
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="at-sign" size={14} color="#000000" style={{ marginRight: 2 }} />
              <Text style={styles.labelSolicitante}>Correo :</Text>
              <Text style={[styles.valueSolicitamte, { flex: 1 }]}>
                {currentRequest?.requester?.email ?? "Sin responsable"}
              </Text>
            </View>
            {currentRequest?.description_html ? (

              <WebView
                style={{ height: webViewHeight, marginBottom: 2 }}
                originWhitelist={["*"]}
                scrollEnabled={false}
                injectedJavaScript={injectedJS}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.height) setWebViewHeight(data.height);
                  } catch (e) { }
                }}
                source={{
                  html: `
                    <html>
                      <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                      <body style="font-family:-apple-system,sans-serif;font-size:14px;color:#334155;padding:0;margin:0;line-height:1.5;">
                        <h4>Descripción</h4>
                        ${currentRequest.description_html}
                      </body>
                    </html>
                  `,
                }}
              />
            ) : (
              <Text style={styles.sub}>Sin descripción</Text>
            )}

            {/* ADJUNTOS */}
            {currentRequest?.attachments?.length > 0 && (
              <View style={styles.attachmentsSection}>
                <View style={styles.attachmentsHeader}>
                  <Icon name="paperclip" size={14} color="#64748b" />
                  <Text style={styles.label}>Adjuntos ({currentRequest.attachments.length})</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.attachmentsRow}>
                    {currentRequest.attachments.map((att: any) => {
                      const isImage = att.name?.match(/\.(png|jpg|jpeg|gif|webp)$/i);
                      return (
                        <TouchableOpacity
                          key={att.id}
                          style={styles.attachmentItem}
                          onPress={() => openAttachmentImage(att.src)}
                        >
                          {isImage ? (
                            <Image source={{ uri: att.src }} style={styles.attachmentImage} resizeMode="cover" />
                          ) : (
                            <View style={styles.attachmentFile}>
                              <Icon name="file" size={24} color="#64748b" />
                            </View>
                          )}
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {att.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* PARTICIPANTES */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="users" size={14} color="#000000" />
              <Text style={styles.text}>
                <Text style={styles.labelSla}>Participantes</Text>
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="shield" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.labelParticipante}>Responsable</Text>
              <Text style={[styles.value, { flex: 1, textAlign: "right" }]}>
                {currentRequest?.assigned_user?.name ?? "Sin responsable"}
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="layers" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.labelParticipante}>Grupo</Text>
              <Text style={[styles.value, { flex: 1, textAlign: "right" }]}>
                {currentRequest?.currentGrupoNombre ?? "Sin grupo"}
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="users" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.labelParticipante}>Colaboradores</Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                {currentRequest?.participants?.filter((p: any) => p.type === "colaborador").length > 0
                  ? currentRequest.participants
                    .filter((p: any) => p.type === "colaborador")
                    .map((p: any, index: number) => (
                      <Text key={p.id || index} style={styles.value}>
                        {p.user?.name}
                      </Text>
                    ))
                  : <Text style={styles.value}>Sin colaborador</Text>}
              </View>
            </View>
            <View style={styles.row}>
              <Icon name="eye" size={14} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.labelParticipante}>Observadores</Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                {currentRequest?.participants?.filter((p: any) => p.type === "observador").length > 0
                  ? currentRequest.participants
                    .filter((p: any) => p.type === "observador")
                    .map((p: any, index: number) => (
                      <Text key={p.id || index} style={styles.value}>
                        {p.user?.name}
                      </Text>
                    ))
                  : <Text style={styles.value}>Sin observador</Text>}
              </View>
            </View>
          </View>

          {/* SLA */}
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
                <Text style={styles.valueGreen}>{currentRequest?.sla?.toma_horas ?? "0"}</Text>
              </View>
            </View>
            <View style={styles.rowSla}>
              <Text style={styles.label}>Respuesta</Text>
              <View style={styles.valueContainer}>
                <Icon name="clock" size={14} color="#10b880" />
                <Text style={styles.valueGreen}>{currentRequest?.sla?.respuesta_horas ?? "0"}</Text>
              </View>
            </View>
            <View style={styles.rowSla}>
              <Text style={styles.label}>Resolución</Text>
              <View style={styles.valueContainer}>
                <Icon name="clock" size={14} color="#f59d0b" />
                <Text style={styles.valueOrange}>{currentRequest?.sla?.resolucion_horas ?? "0"}</Text>
              </View>
            </View>
          </View>

          {/* ACCIONES */}
          {actions.length > 0 && (
            <View style={styles.card}>
              <View style={styles.row}>
                <Icon name="menu" size={14} color="#000000" />
                <Text style={styles.text}>
                  <Text style={styles.labelSla}>Acciones</Text>
                </Text>
              </View>
              {primaryAction && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: primaryAction.color }, loading && { opacity: 0.6 }]}
                  onPress={primaryAction.onPress}
                  disabled={loading}
                >
                  <Icon name={primaryAction.icon} size={18} color={primaryAction.textColor} />
                  <Text style={[styles.primaryText, { color: primaryAction.textColor }]}>{primaryAction.label}</Text>
                </TouchableOpacity>
              )}
              {secondaryActions.length > 0 && (
                <View style={styles.secondaryContainer}>
                  {secondaryActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.secondaryButton, action.label === "Anular" && styles.dangerButton]}
                      onPress={action.onPress}
                      disabled={loading}
                    >
                      <Icon name={action.icon} size={16} color={action.textColor} />
                      <Text style={[styles.secondaryText, action.label === "Anular" && styles.dangerText]}>
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* COMENTARIOS */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="message-circle" size={14} color="#000000" />
              <Text style={styles.text}>
                <Text style={styles.labelSla}>Comentarios</Text>
              </Text>
            </View>
            {comments.length === 0 ? (
              <Text>No hay comentarios</Text>
            ) : (
              (Array.isArray(comments) ? comments : []).map(renderCommentItem)
            )}

            <View style={styles.separator} />

            {stateId !== 3 && stateId !== 4 && (
              <>
                {/* TABS */}
                <View style={styles.commentTabs}>
                  <TouchableOpacity
                    style={[
                      styles.commentTab,
                      commentType === "publico" && styles.commentTabActive,
                    ]}
                    onPress={() => setCommentType("publico")}
                  >
                    <Icon name="message-square" size={14} color={commentType === "publico" ? "#1d4ed8" : "#64748b"} />
                    <Text style={[
                      styles.commentTabText,
                      commentType === "publico" && styles.commentTabTextActive,
                    ]}>
                      Comentario público
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.commentTab,
                      commentType === "interno" && styles.commentTabActiveInterno,
                    ]}
                    onPress={() => setCommentType("interno")}
                  >
                    <Icon name="lock" size={14} color={commentType === "interno" ? "#92400e" : "#64748b"} />
                    <Text style={[
                      styles.commentTabText,
                      commentType === "interno" && styles.commentTabTextActiveInterno,
                    ]}>
                      Nota interna
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* AVISO INTERNO */}
                {commentType === "interno" && permissions?.can_add_internal_comment && (
                  <View style={styles.internalWarning}>
                    <Icon name="lock" size={12} color="#92400e" />
                    <Text style={styles.internalWarningText}>
                      Solo visible para el equipo técnico
                    </Text>
                  </View>
                )}

                {/* INPUT */}
                {permissions?.can_comment && (
                  <View style={{ marginTop: 6 }}>
                    <TextInput
                      style={[
                        styles.input,
                        commentType === "interno" && styles.inputInterno,
                      ]}
                      placeholder={
                        commentType === "interno"
                          ? "Escribe una nota interna..."
                          : "Escribe un comentario público..."
                      }
                      value={comment}
                      onChangeText={setComment}
                      multiline
                    />
                  </View>
                )}
                {/* IMÁGENES */}
                {images.length > 0 && permissions?.can_comment && (
                  <View style={styles.imageRow}>
                    {images.map((img, index) => (
                      <View key={index} style={styles.imageBox}>
                        <Image source={{ uri: img.uri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                          <Icon name="x" size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* ADJUNTAR */}
                <View style={styles.footer}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TouchableOpacity style={styles.iconBtn} onPress={openImagePicker}>
                      <Icon name="paperclip" size={16} color="#64748b" />
                    </TouchableOpacity>
                    <Text style={styles.internalText}>Adjuntar archivo</Text>
                  </View>
                  <Text style={styles.internalText}>Máx. 10 MB</Text>
                </View>
              </>
            )}

            {/* SEND */}
            {stateId !== 3 && stateId !== 4 && permissions?.can_comment && (
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!comment.trim() || loading || isBlocked) && { backgroundColor: "#f1f5f9" },
                ]}
                onPress={handleSend}
                disabled={!comment.trim() || loading || isBlocked}
              >
                <Icon name="send" size={16} color={!comment.trim() ? "#64748b" : "#fff"} />
                <Text style={[
                  styles.btnText,
                  { color: !comment.trim() ? "#64748b" : "#fff" },
                ]}>
                  {loading
                    ? "Enviando..."
                    : commentType === "interno"
                      ? "Guardar nota interna"
                      : "Enviar comentario"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* MODAL PREVIEW IMAGEN */}
        <Modal visible={imageModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setImageModalVisible(false)}>
              <Icon name="x" size={28} color="#fff" />
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
            )}
          </View>
        </Modal>

        <ModalFinalizarScreen
          visible={modalVisible}
          request={currentRequest}
          onClose={() => setModalVisible(false)}
          onSubmit={async () => { setModalVisible(false); await loadTicket(); await loadComments(); }}
          setLoading={setLoading}
          setModalVisible={setModalVisible}
        />

        <ModalAnularScreen
          visible={modalVisibleAnular}
          request={currentRequest}
          onClose={() => setModalVisibleAnular(false)}
          onSubmit={async () => { setModalVisibleAnular(false); await loadTicket(); await loadComments(); }}
          setLoading={setLoading}
          setModalVisible={setModalVisibleAnular}
        />

        <ModalEscalarScreen
          visible={modalVisibleAsignar}
          request={currentRequest}
          onClose={() => setModalVisibleAsignar(false)}
          onSubmit={async () => { setModalVisibleAsignar(false); await loadTicket(); await loadComments(); }}
          setLoading={setLoading}
          setModalVisible={setModalVisibleAsignar}
        />
        {/*<FloatingButton /> */}
      </View>
    </KeyboardAvoidingView >
  );
}

/* ---------------- HELPERS ---------------- */
function getStatusColor(status: string) {
  switch (status) {
    case "Pendiente":
      return { backgroundColor: "#fef3c7", color: "#f69e0b" };
    case "Proceso":
      return { backgroundColor: "#dbeafe", color: "#3b85f7" };
    case "Cerrado":
      return { backgroundColor: "#dcfce7", color: "#10b99b" };
    case "Anulada":
      return { backgroundColor: "#b0b5bd", color: "#64768f" };
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
      return { backgroundColor: "#fee2e2", color: "#dc2626" };
    default:
      return { backgroundColor: "#f1f5f9", color: "#64748b" };
  }
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: { backgroundColor: "#007aff", padding: 20, flexDirection: "row", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: "#fff", opacity: 0.8, marginTop: 8 },
  logout: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 30 },
  headerTwo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    marginTop: StatusBar.currentHeight || 44,
  },
  headerTitleTwo: { fontSize: 16, fontWeight: "600", marginLeft: 20, },
  content: { padding: 12 },
  contentContainer: { padding: 16 },
  card: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  sub: { fontSize: 12, color: "#64748b", marginBottom: 10 },
  row: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 10 },
  text: { fontSize: 12, color: "#000000" },
  input: { borderWidth: 1, borderColor: "#e2e8f0", padding: 10, borderRadius: 8, minHeight: 80, marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  checkbox: { flexDirection: "row", alignItems: "center", gap: 6 },
  internalText: { fontSize: 12, color: "#64748b" },
  internalComment: { flexDirection: "row", alignItems: "center", gap: 4 },
  leftActions: { flexDirection: "row" },
  iconBtn: { padding: 6 },
  helperText: { marginTop: 8, fontSize: 11, color: "#64748b" },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  imageBox: { position: "relative" },
  previewImage: { width: 80, height: 80, borderRadius: 10 },
  imagePlaceholder: { backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  removeBtn: { position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 2 },
  sendBtn: { backgroundColor: "#3b82f6", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "center", gap: 6 },
  btnText: { color: "#64748b", fontWeight: "500" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#64748b" },
  tags: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 8,
    borderRadius: 12,
    textAlign: "center",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  category: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingVertical: 8,
    borderRadius: 12,
    textAlign: "center",
    textTransform: "uppercase",
    fontWeight: "600",
  },
  label: { color: "#64748b", fontSize: 12 },
  labelParticipante: { color: "#64748b", fontSize: 13 },
  labelSolicitante: { color: "#000000", fontSize: 13 },
  value: { color: "#0f172a", fontWeight: "500" },
  valueSolicitamte: { color: "#0f172a", fontWeight: "500", paddingLeft: 20 },
  valueGreen: { color: "#10b880", fontWeight: "500" },
  valueOrange: { color: "#f59d0b", fontWeight: "500" },
  rowSla: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 4 },
  labelSla: { fontWeight: "600", color: "#000" },
  valueContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  commentItem: {
    padding: 10, borderBottomWidth: 1, borderColor: "#f8f9fc", backgroundColor: "#f8f9fc",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  commentUser: { fontWeight: "400" },
  commentText: { color: "#000000" },
  commentDate: { fontSize: 10, color: "#767676" },
  commentStatus: { flexDirection: "row", alignItems: "center" },
  commentStatusText: { marginLeft: 3, fontSize: 12, color: "#767676" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 10 },
  primaryText: { fontSize: 14, fontWeight: "600" },
  secondaryContainer: { flexDirection: "row", gap: 10, marginTop: 10 },
  secondaryButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e2e8f0", gap: 6 },
  dangerButton: { borderColor: "#fecaca" },
  secondaryText: { fontSize: 13, color: "#334155" },
  dangerText: { color: "#dc2626" },
  attachOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 28, backgroundColor: "rgba(0,0,0,0.45)", borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: "center", justifyContent: "center" },
  separator: { height: 1, backgroundColor: "#767676", marginVertical: 12 },
  attachmentsSection: { marginTop: 12 },
  attachmentsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  attachmentsRow: { flexDirection: "row", gap: 10 },
  attachmentItem: { width: 100, alignItems: "center" },
  attachmentImage: { width: 100, height: 100, borderRadius: 8, backgroundColor: "#f1f5f9" },
  attachmentFile: { width: 100, height: 100, borderRadius: 8, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
  attachmentName: { fontSize: 10, color: "#64748b", marginTop: 4, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  modalClose: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  modalImage: { width: "90%", height: "70%" },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  commentTabs: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 10,
  },
  commentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  commentTabActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  commentTabActiveInterno: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  commentTabText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  commentTabTextActive: {
    color: "#1d4ed8",
    fontWeight: "500",
  },
  commentTabTextActiveInterno: {
    color: "#92400e",
    fontWeight: "500",
  },
  internalWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fffbeb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  internalWarningText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "400",
  },
  inputInterno: {
    borderColor: "#fde68a",
    backgroundColor: "#ffffff",
  },
});