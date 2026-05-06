import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    StyleSheet,
    Alert,  // Importar Alert de React Native
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {
    launchCamera,
    launchImageLibrary,
} from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dropdown } from "react-native-element-dropdown";
import api from "../services/api";

type Props = {
    visible: boolean;
    onClose: () => void;
    request: any;
    onSubmit?: () => Promise<void>;
    setLoading: (loading: boolean) => void;  // Esta es la propiedad para setLoading
    setModalVisible: (visible: boolean) => void;  // Esta es la propiedad para setModalVisible
};

export default function ModalFinalizarScreen({
    visible,
    onClose,
    request,
    onSubmit,
    setLoading,  // Aceptamos esta prop
    setModalVisible,  // Aceptamos esta prop
}: Props) {
    const [comment, setComment] = useState("");
    const [reason, setReason] = useState<string | null>(null);
    const [images, setImages] = useState<any[]>([]);
    const [tipoRespuesta, setTipoRespuesta] = useState(null);

    const [tenant, setTenant] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [estadosCierre, setEstadosCierre] = useState<any[]>([]);
    const [loadingEstados, setLoadingEstados] = useState(false);

    /* ---------------- LOAD STORAGE ---------------- */
    useEffect(() => {
        const loadTenant = async () => {
            const tenantStored = await AsyncStorage.getItem("tenant_id");
            const tokenStore = await AsyncStorage.getItem("token");

            setTenant(tenantStored);
            setToken(tokenStore);
        };

        loadTenant();
    }, []);

    /* ---------------- API ---------------- */
    const getEstadoCierre = async () => {
        try {
            const response = await api.get("/tickets/estados-cierre", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data.data;
        } catch (error) {
            console.error("Error al obtener estados de cierre:", error);
            return [];
        }
    };

    /* ---------------- LOAD DATA ---------------- */
    useEffect(() => {
        if (visible) {
            cargarEstadosCierre();
        }
    }, [visible]);

    interface Comment {
        id: number;
        name: string;
    }

    const cargarEstadosCierre = async () => {
        setLoadingEstados(true);

        const data = await getEstadoCierre();

        const ordenados = data.sort((a: Comment, b: Comment) => a.id - b.id);

        const formatted = ordenados.map((item: Comment) => ({
            label: item.name,
            value: String(item.id),
        }));

        setEstadosCierre(formatted);
        setLoadingEstados(false);
    };

    /* ---------------- MEDIA ---------------- */
    const openCamera = () => {
        launchCamera(
            { mediaType: "photo", quality: 0.7, saveToPhotos: true },
            (res) => {
                if (res.didCancel || res.errorCode) return;

                // Verificamos que 'res.assets' sea un array antes de intentar usarlo
                if (res.assets && Array.isArray(res.assets)) {
                    setImages((prev) => [...prev, ...res.assets]);
                }
            }
        );
    };

    const openGallery = () => {
        launchImageLibrary(
            { mediaType: "photo", selectionLimit: 0, quality: 0.7 },
            (res) => {
                if (res.didCancel || res.errorCode) return;
                if (res.assets) setImages((prev) => [...prev, ...res.assets]);
            }
        );
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (submitting) return;
        // Verifica que `tipoRespuesta` tenga un valor válido
        if (!comment) {
            Alert.alert("Por favor, ingrese comentario.");
            return;

        }
        if (!tipoRespuesta) {
            Alert.alert("Por favor, seleccione un estado de cierre.");
            return;
        }

        const payload = {
            comment,         // Comentario ingresado por el usuario
            estadoCierreId: tipoRespuesta,  // Aquí asignamos `estado_cierre_id` con el `value` del Dropdown
            images,          // Archivos de imágenes adjuntos
        };

        console.log("Finalizar ticket:", payload);  // Solo para verificar

        try {
            setSubmitting(true);
            setLoading(true);  // Activar el estado de carga mientras se procesa

            const formData = new FormData();

            // Agregar el estado de cierre (ID) que seleccionó el usuario
            formData.append("estado_cierre_id", payload.estadoCierreId);  // Esto es lo que espera la API

            // Agregar comentario al FormData
            formData.append("comentario", payload.comment);

            // Agregar las imágenes al FormData
            payload.images.forEach((img, index) => {
                formData.append("files[]", {
                    uri: img.uri,
                    type: img.type || "image/jpeg",  // Asegúrate de que sea el tipo correcto
                    name: img.fileName || `image_${index}.jpg`,  // Nombre del archivo
                });
            });

            const ticketId = request.id;  // El ID del ticket que viene de `request`

            // Realizar la solicitud POST para finalizar el ticket
            const response = await fetch(
                `https://devticket.uchilefau.cl/api/tickets/${ticketId}/finalizar`,
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,  // Añadir el token de autenticación
                    },
                    body: formData,  // Enviar los datos como FormData
                }
            );

            const data = await response.json();  // Obtener la respuesta de la API

            console.log("RESPUESTA DE FINALIZACIÓN:", data);

            if (data.success) {
                // Limpiar formulario
                setComment("");
                setTipoRespuesta(null);
                setImages([]);

                // Cerrar modal
                setModalVisible(false);
                onClose();

                // ✅ Una sola llamada, sin argumentos
                await onSubmit?.();
            } else {
                console.error("Error al finalizar el ticket", data.message);
                Alert.alert("No se pudo finalizar el ticket, por favor intente nuevamente.");
            }

        } catch (error) {
            console.error("Error al finalizar el ticket:", error);
            Alert.alert("Hubo un error al intentar finalizar el ticket.");
        } finally {
            setSubmitting(false);
            setLoading(false);  // Desactivar el estado de carga
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        <Text style={styles.title}>Finalizar Ticket</Text>

                        {/* DROPDOWN DINÁMICO */}
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholder}
                            selectedTextStyle={styles.selectedText}
                            data={estadosCierre}
                            labelField="label"
                            valueField="value"
                            placeholder={loadingEstados ? "Cargando..." : "Seleccione…"}
                            value={tipoRespuesta}
                            onChange={(item) => {
                                console.log("Estado seleccionado:", item.value);  // Verifica el valor aquí
                                setTipoRespuesta(item.value);
                            }}
                            itemTextStyle={styles.itemTextStyle}
                        />

                        {/* COMMENT */}
                        <TextInput
                            placeholder="Comentario..."
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            style={styles.input}
                        />

                        {/* ACTIONS */}
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={openCamera}>
                                <Icon name="camera" size={22} color="#64748b" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={openGallery}>
                                <Icon name="image" size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* IMAGES */}
                        <ScrollView horizontal style={{ marginVertical: 10 }}>
                            {images.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img.uri }}
                                    style={styles.preview}
                                />
                            ))}
                        </ScrollView>
                    </ScrollView>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: "#64748b" }}>Cancelar</Text>
                        </TouchableOpacity>

                        {/* ✅ disabled mientras loading, opacity para feedback visual */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={{ opacity: submitting ? 0.5 : 1 }}
                        >
                            <Text style={{ color: "#008236", fontWeight: "bold" }}>
                                {submitting ? "Finalizando..." : "Finalizar"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/* ---------------- STYLES ---------------- */
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
    input: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        minHeight: 80,
        textAlignVertical: "top",
    },
    actions: {
        flexDirection: "row",
        gap: 15,
        marginTop: 10,
    },
    preview: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 8,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
    },
    dropdown: {
        height: 40,
        borderColor: "#e5e7eb",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginTop: 10,
    },
    placeholder: {
        color: "#9ca3af",
        fontSize: 12,
    },
    selectedText: {
        color: "#111827",
    },
    itemTextStyle: {
        fontSize: 12,
    },
});