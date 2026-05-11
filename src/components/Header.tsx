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
};

export const Header = ({ tenant, onLogout }: Props) => {
    return (
        <Animatable.View animation="fadeInDown" style={styles.header}>
            <View style={{ flex: 1 }}>
                <Text style={styles.headerSubtitle}>Bienvenido a</Text>
                <Text style={styles.headerTitle}>
                    {tenant ? `${tenant}.uchile.cl` : "ayuda.uchile.cl"}
                </Text>
                <View style={[styles.devBadge, !__DEV__ && styles.prodBadge]}>
                    <Text style={styles.devBadgeText}>
                        {__DEV__ ? 'DEV' : 'PROD'}
                    </Text>
                </View>
            </View>



            <TouchableOpacity style={styles.logout} onPress={onLogout}>
                <Icon name="log-out" size={16} color="#fff" />
            </TouchableOpacity>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
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
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    devBadge: {
        backgroundColor: "#f59e0b", // amarillo para DEV
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: "flex-start",
    },
    prodBadge: {
        backgroundColor: "#10b981", // verde para PROD
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: "flex-start",
    },
    devBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
});