import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/Feather";

interface Tenant {
    id: string;
    name: string;
    domain: string;
}

type Props = {
    tenant?: string | null;
    onLogout: () => void;
    tenants?: Tenant[];
    onChangeTenant?: (tenantId: string) => void;
    user?: string | null;
};

export const Header = ({ tenant, onLogout, user }: Props) => {
    return (
        <Animatable.View animation="fadeInDown" style={styles.header}>
            <View style={{ flex: 1 }}>
                <Text style={styles.headerSubtitle}>Bienvenido,</Text>
                <Text style={styles.headerName}>{user ?? "Usuario"}</Text>
                <Text style={styles.headerTitle}>
                    {tenant ? `${tenant}.ayuda.uchilefau.cl` : "ayuda.uchilefau.cl"}
                </Text>
            </View>
            <TouchableOpacity style={styles.logout} onPress={onLogout}>
                <Icon name="log-out" size={16} color="#fff" />
            </TouchableOpacity>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: "#1e40af",
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    headerTitle: {
        color: "#fff",
        opacity: 0.8,
        fontSize: 14,
    },
    headerSubtitle: {
        color: "#fff",
        opacity: 0.8,
        marginTop: 16,
        fontSize: 14,
    },
    headerName: {
        color: "#fff",
        fontSize: 18,
    },
    logout: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 30,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    }
});