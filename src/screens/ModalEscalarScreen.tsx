import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dropdown } from "react-native-element-dropdown";
import api from "../services/api";

type Tecnico = {
    id: number;
    name: string;
    email: string;
};

type Grupo = {
    label: string;
    value: string;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    setLoading: (loading: boolean) => void;
    onSubmit?: () => Promise<void>;
    request: any;
};

export default function ModalFinalizarScreen({ visible, onClose, setLoading, onSubmit, request }: Props) {
    const [tipoRespuesta, setTipoRespuesta] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [loadingGrupos, setLoadingGrupos] = useState(false);
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [loadingTecnicos, setLoadingTecnicos] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<number | null>(null);
    const [searchTecnico, setSearchTecnico] = useState("");

    /* ---------------- LOAD STORAGE ---------------- */
    useEffect(() => {
        const loadToken = async () => {
            const tokenStore = await AsyncStorage.getItem("token");
            setToken(tokenStore);
        };
        loadToken();
    }, []);

    /* ---------------- RESET AL CERRAR ---------------- */
    useEffect(() => {
        if (!visible) {
            setTipoRespuesta(null);
            setTecnicos([]);
            setSelectedTecnico(null);
            setSearchTecnico("");
        }
    }, [visible]);

    /* ---------------- API: GRUPOS ---------------- */
    const getCargarGrupos = async () => {
        try {
            const response = await api.get("/tickets/grupos", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // El endpoint sin params devuelve la lista de grupos
            return response?.data?.data?.groups || response?.data?.groups || [];
        } catch (error) {
            console.error("Error al obtener grupos:", error);
            return [];
        }
    };

    const cargarGruposTotal = async () => {
        setLoadingGrupos(true);
        const data = await getCargarGrupos();
        const ordenados = (data || []).sort((a: any, b: any) => a.id - b.id);
        const formatted: Grupo[] = ordenados.map((item: any) => ({
            label: item.name,
            value: String(item.id),
        }));
        setGrupos(formatted);

        if (request?.assigned_group?.id) {
            const idStr = String(request.assigned_group.id);
            const exists = formatted.find((g) => g.value === idStr);
            setTipoRespuesta(exists ? idStr : null);
        }

        setLoadingGrupos(false);
    };

    useEffect(() => {
        if (visible && token) {
            cargarGruposTotal();
        }
    }, [visible, token]);

    /* ---------------- API: TÉCNICOS ---------------- */
    const getTecnicosPorGrupo = async (grupoId: string) => {
        try {
            setLoadingTecnicos(true);
            setTecnicos([]);

            const response = await api.get(`/tickets/grupos`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    grupo_id: grupoId,
                    search: "",
                    solo_disponibles: 1,
                },
            });

            // ✅ FIX PRINCIPAL: la respuesta trae un objeto, no un array directo
            // Según el log: response.data = { currentGrupoId, groups, technicians, ... }
            const data = response?.data?.data ?? response?.data;
            const usuarios: Tecnico[] = data?.technicians || [];

            console.log("Técnicos obtenidos:", usuarios);
            setTecnicos(usuarios);
        } catch (error) {
            console.error("Error al obtener técnicos:", error);
            setTecnicos([]);
        } finally {
            setLoadingTecnicos(false);
        }
    };

    /* ---------------- TÉCNICOS FILTRADOS ---------------- */
    const tecnicosFiltrados = tecnicos.filter((tec) =>
        tec.name.toLowerCase().includes(searchTecnico.toLowerCase()) ||
        tec.email.toLowerCase().includes(searchTecnico.toLowerCase())
    );

    const grupoSeleccionado = grupos.find(
        (g) => g.value === tipoRespuesta
    );

    const tecnicoSeleccionado = tecnicos.find(
        (t) => t.id === selectedTecnico
    );

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (!tipoRespuesta || !selectedTecnico) {
            Alert.alert("Error", "Debe seleccionar grupo y técnico.");
            return;
        }

        const payload = {
            grupo_id: Number(tipoRespuesta),
            tecnico_id: selectedTecnico,
        };

        console.log("Asignando ticket:", payload);

        try {
            setLoading(true);

            const ticketId = request.id;

            const response = await api.post(
                `/tickets/${ticketId}/asignar`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = response.data;

            console.log("RESPUESTA ASIGNACIÓN:", data);

            if (data?.success) {
                Alert.alert("Éxito", "Ticket asignado correctamente");

                // reset UI
                setTipoRespuesta(null);
                setSelectedTecnico(null);
                setSearchTecnico("");
                
                onClose();
                await onSubmit?.();
            } else {
                Alert.alert("Error", "No se pudo asignar el ticket");
            }

        } catch (error) {
            console.error("Error asignando ticket:", error);
            Alert.alert("Error", "Error al asignar el ticket");
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- RENDER ---------------- */
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        <Text style={styles.title}>Asignar</Text>

                        {/* Asignación actual */}
                        <View style={styles.containerAsig}>
                            <View style={styles.row}>
                                <Text style={styles.labetText}>Asignación actual:</Text>
                                {request?.assigned_group?.name && (
                                    <View style={styles.tag}>
                                        <Icon name="tag" size={10} color="#64748b" />
                                        <Text style={styles.labetTextDat}>
                                            {request.assigned_group.name}
                                        </Text>
                                    </View>
                                )}
                                {request?.assigned_user?.name && (
                                    <View style={styles.tag}>
                                        <Icon name="user" size={10} color="#64748b" />
                                        <Text style={styles.labetTextDat}>
                                            {request.assigned_user.name}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Dropdown grupos */}
                        <View style={{ paddingTop: 8 }}>
                            <Text style={styles.fieldLabel}>Grupo Destino</Text>
                            {loadingGrupos ? (
                                <ActivityIndicator size="small" color="#64748b" style={{ marginTop: 8 }} />
                            ) : grupos.length > 0 ? (
                                <Dropdown
                                    style={styles.dropdownGr}
                                    data={grupos}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Seleccione…"
                                    value={
                                        grupos.some((g) => g.value === tipoRespuesta)
                                            ? tipoRespuesta
                                            : null
                                    }
                                    onChange={(item) => {
                                        setTipoRespuesta(item.value);
                                        setTecnicos([]);
                                        setSelectedTecnico(null);
                                        setSearchTecnico("");
                                        getTecnicosPorGrupo(item.value);
                                    }}
                                />
                            ) : (
                                <Text style={styles.emptyText}>No hay grupos disponibles</Text>
                            )}
                        </View>

                        {/* Buscador técnicos — solo visible si hay grupo seleccionado */}
                        {tipoRespuesta && (
                            <View style={{ paddingTop: 8 }}>
                                <Text style={styles.fieldLabel}>Buscar Técnico</Text>
                                <TextInput
                                    style={styles.inputWrapper}
                                    placeholder="Nombre o correo..."
                                    value={searchTecnico}
                                    onChangeText={setSearchTecnico}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        )}

                        {/* Lista técnicos */}
                        {tipoRespuesta && (
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.sectionTitle}>Técnicos disponibles</Text>

                                {loadingTecnicos ? (
                                    <ActivityIndicator size="small" color="#64748b" style={{ marginTop: 8 }} />
                                ) : tecnicosFiltrados.length === 0 ? (
                                    <Text style={styles.emptyText}>
                                        {searchTecnico
                                            ? "No hay técnicos que coincidan con la búsqueda"
                                            : "No hay técnicos disponibles en este grupo"}
                                    </Text>
                                ) : (
                                    tecnicosFiltrados.map((tec) => (
                                        <TouchableOpacity
                                            key={tec.id}
                                            style={[
                                                styles.tecnicoRow,
                                                selectedTecnico === tec.id && styles.tecnicoRowSelected,
                                            ]}
                                            onPress={() =>
                                                setSelectedTecnico(
                                                    selectedTecnico === tec.id ? null : tec.id
                                                )
                                            }
                                        >
                                            <View
                                                style={[
                                                    styles.checkbox,
                                                    selectedTecnico === tec.id && styles.checkboxSelected,
                                                ]}
                                            >
                                                {selectedTecnico === tec.id && (
                                                    <Icon name="check" size={11} color="#fff" />
                                                )}
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.tecnicoName}>{tec.name}</Text>
                                                <Text style={styles.tecnicoEmail}>{tec.email}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}

                        {/* Asignación actual */}
                        <View style={styles.containerAsig}>
                            <View style={styles.row}>
                                <Text style={styles.labetText}>Seleccionado:</Text>

                                {/* Grupo Destino */}
                                <View style={styles.tag}>
                                    <Icon name="tag" size={10} color="#64748b" />
                                    <Text style={styles.labetTextDat}>
                                        {grupoSeleccionado?.label ?? "Sin grupo"}
                                    </Text>
                                </View>

                                {/* Técnico Seleccionado */}
                                <View style={styles.tag}>
                                    <Icon name="user" size={10} color="#64748b" />
                                    <Text style={styles.labetTextDat}>
                                        {tecnicoSeleccionado?.name ?? "Sin técnico"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.btnCancelar}>
                            <Text style={{ color: "#64748b" }}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.btnAsignar,
                                (!selectedTecnico || !tipoRespuesta) && styles.btnAsignarDisabled,
                            ]}
                            disabled={!selectedTecnico || !tipoRespuesta}
                            onPress={handleSubmit}
                        >
                            <Text
                                style={{
                                    fontWeight: "bold",
                                    color: !selectedTecnico || !tipoRespuesta ? "#94a3b8" : "#000",
                                }}
                            >
                                Asignar
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "90%",
        maxHeight: "85%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#1e293b",
    },
    containerAsig: {
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 4,
    },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
    },
    labetText: {
        fontSize: 12,
        color: "#64748b",
    },
    labetTextDat: {
        fontSize: 11,
        color: "#334155",
        marginLeft: 4,
    },
    tag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e2e8f0",
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    dropdownGr: {
        marginTop: 6,
        borderWidth: 0.5,
        borderColor: "#cbd5e1",
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
    },
    fieldLabel: {
        fontSize: 11,
        color: "#64748b",
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e293b",
        marginBottom: 8,
    },
    inputWrapper: {
        marginTop: 6,
        borderWidth: 0.5,
        borderColor: "#cbd5e1",
        borderRadius: 8,
        paddingHorizontal: 10,
        height: 40,
        fontSize: 13,
        color: "#1e293b",
    },
    tecnicoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 0.5,
        borderColor: "#e2e8f0",
        borderRadius: 6,
    },
    tecnicoRowSelected: {
        backgroundColor: "#f0f9ff",
    },
    tecnicoName: {
        fontSize: 13,
        color: "#1e293b",
    },
    tecnicoEmail: {
        fontSize: 11,
        color: "#64748b",
        marginTop: 1,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1.5,
        borderColor: "#94a3b8",
        borderRadius: 4,
        marginRight: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    checkboxSelected: {
        backgroundColor: "#1e293b",
        borderColor: "#1e293b",
    },
    emptyText: {
        fontSize: 12,
        color: "#94a3b8",
        marginTop: 8,
        textAlign: "center",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 0.5,
        borderColor: "#e2e8f0",
    },
    btnCancelar: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    btnAsignar: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "#f1f5f9",
        borderRadius: 8,
    },
    btnAsignarDisabled: {
        opacity: 0.5,
    },
});
