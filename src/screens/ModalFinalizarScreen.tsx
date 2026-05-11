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
    Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import {
    launchCamera,
    launchImageLibrary,
    Asset,
} from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dropdown } from "react-native-element-dropdown";
import api from "../services/api";

type Props = {
    visible: boolean;
    onClose: () => void;
    request: any;
    onSubmit?: () => Promise<void>;
    setLoading: (loading: boolean) => void;
    setModalVisible: (visible: boolean) => void;
};

export default function ModalFinalizarScreen({
    visible,
    onClose,
    request,
    onSubmit,
    setLoading,
    setModalVisible,
}: Props) {

    const [comment, setComment] = useState("");
    const [reason, setReason] = useState<string | null>(null);
    const [images, setImages] = useState<Asset[]>([]);
    const [tipoRespuesta, setTipoRespuesta] = useState<string | null>(null);

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

    const cargarEstadosCierre = async () => {
        setLoadingEstados(true);

        const data = await getEstadoCierre();

        const ordenados = data.sort((a: any, b: any) => a.id - b.id);

        const formatted = ordenados.map((item: any) => ({
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

                const assets = res.assets ?? [];
                setImages((prev) => [...prev, ...assets]);
            }
        );
    };

    const openGallery = () => {
        launchImageLibrary(
            { mediaType: "photo", selectionLimit: 0, quality: 0.7 },
            (res) => {
                if (res.didCancel || res.errorCode) return;

                const assets = res.assets ?? [];
                setImages((prev) => [...prev, ...assets]);
            }
        );
    };

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (submitting) return;

        if (!comment) {
            Alert.alert("Por favor, ingrese comentario.");
            return;
        }

        if (!tipoRespuesta) {
            Alert.alert("Por favor, seleccione un estado de cierre.");
            return;
        }

        try {
            setSubmitting(true);
            setLoading(true);

            const formData = new FormData();
            formData.append("estado_cierre_id", tipoRespuesta);
            formData.append("comentario", comment);

            images.forEach((img, index) => {
                formData.append("files[]", {
                    uri: img.uri,
                    type: img.type || "image/jpeg",
                    name: img.fileName || `image_${index}.jpg`,
                } as any);
            });

            const response = await api.post(
                `/tickets/${request.id}/finalizar`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const data = response.data;

            if (data.success) {
                setComment("");
                setTipoRespuesta(null);
                setImages([]);
                setModalVisible(false);
                onClose();
                await onSubmit?.();
            } else {
                Alert.alert("No se pudo finalizar el ticket.");
            }

        } catch (error: any) {
            const msg = error?.response?.data?.message;
            Alert.alert(msg || "Error al finalizar ticket.");
        } finally {
            setSubmitting(false);
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>

                    <Text style={styles.title}>Finalizar Ticket</Text>

                    <Dropdown
                        style={styles.dropdown}
                        data={estadosCierre}
                        labelField="label"
                        valueField="value"
                        placeholder={loadingEstados ? "Cargando..." : "Seleccione..."}
                        value={tipoRespuesta}
                        onChange={(item) => setTipoRespuesta(item.value)}
                    />

                    <TextInput
                        placeholder="Comentario..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        style={styles.input}
                    />

                    <View style={styles.actions}>
                        <TouchableOpacity onPress={openCamera}>
                            <Icon name="camera" size={22} color="#64748b" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={openGallery}>
                            <Icon name="image" size={22} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal>
                        {images.map((img, index) => (
                            <Image
                                key={index}
                                source={{ uri: img.uri }}
                                style={styles.preview}
                            />
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose}>
                            <Text>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={submitting}
                            style={{ opacity: submitting ? 0.5 : 1 }}
                        >
                            <Text style={{ fontWeight: "bold", color: "#008236" }}>
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
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    input: {
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 10,
        padding: 10,
        marginTop: 10,
        minHeight: 80,
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
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginTop: 10,
        paddingHorizontal: 10,
    },
});