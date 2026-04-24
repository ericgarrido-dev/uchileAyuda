import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import * as Animatable from "react-native-animatable";

interface Tenant {
  id: string;
  name: string;
  domain: string;
  description: string;
}

interface Props {
  tenants: Tenant[]; // 👈 OBLIGATORIO YA
  userName: string;
  onSelectTenant: (tenantId: string) => void;
  onLogout: () => void;
}

export default function TenantSelectionScreen({
  tenants,
  userName,
  onSelectTenant,
  onLogout,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) onSelectTenant(selected);
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <Text style={styles.headerSubtitle}>
          Bienvenido {userName}
        </Text>
        <Text style={styles.headerTitle}>
          Selecciona un sistema
        </Text>
      </Animatable.View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* LISTA DINÁMICA */}
        {tenants?.map((tenant) => {
          const isSelected = selected === tenant.id;

          return (
            <TouchableOpacity
              key={tenant.id}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              onPress={() => setSelected(tenant.id)}
            >
              <View style={styles.row}>

                <View
                  style={[
                    styles.iconBox,
                    isSelected && styles.iconBoxSelected,
                  ]}
                >
                  <Icon name="grid" size={20} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{tenant.name}</Text>
                  <Text style={styles.domain}>{tenant.domain}</Text>
                  <Text style={styles.desc}>
                    {tenant.description}
                  </Text>
                </View>

                {isSelected && (
                  <Icon name="check-circle" size={22} color="#007aff" />
                )}

              </View>
            </TouchableOpacity>
          );
        })}

        {/* CONTINUAR */}
        <TouchableOpacity
          style={[
            styles.button,
            !selected && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Icon name="log-out" size={16} color="#666" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Sistema multi-tenant · Universidad de Chile
        </Text>

      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0",
    },

    header: {
        backgroundColor: "#007aff",
        padding: 20,
    },

    headerTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 5,
    },

    headerSubtitle: {
        color: "#fff",
        opacity: 0.8,
        marginTop: 2,
    },

    content: {
        padding: 16,
    },

    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 2,
        borderWidth: 2,
        borderColor: "transparent",
    },

    cardSelected: {
        borderColor: "#007aff",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#ccc",
        justifyContent: "center",
        alignItems: "center",
    },

    iconBoxSelected: {
        backgroundColor: "#007aff",
    },

    title: {
        fontWeight: "600",
    },

    domain: {
        fontSize: 12,
        color: "#007aff",
        marginTop: 2,
    },

    desc: {
        fontSize: 12,
        color: "#666",
    },

    button: {
        backgroundColor: "#007aff",
        padding: 14,
        borderRadius: 10,
        marginTop: 20,
    },

    buttonDisabled: {
        backgroundColor: "#ccc",
    },

    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
    },

    logout: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 15,
        gap: 6,
    },

    logoutText: {
        color: "#666",
    },

    footer: {
        textAlign: "center",
        fontSize: 10,
        color: "#999",
        marginTop: 20,
    },
});