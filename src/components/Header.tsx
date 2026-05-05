import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Animatable from "react-native-animatable";
import Icon from "react-native-vector-icons/Feather";

type Props = {
    tenant?: string | null;
    onLogout: () => void;
};

export const Header = ({ tenant, onLogout }: Props) => {
    return (
        <Animatable.View animation="fadeInDown" style={styles.header}>
            <View style={{ flex: 1 }}>
                <Text style={styles.headerSubtitle}>Bienvenido a</Text>
                <Text style={styles.headerTitle}>
                    {tenant ? `${tenant}.uchile.cl` : "ayuda.uchile.cl"}
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
});