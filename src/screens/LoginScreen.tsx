import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import { RutInput } from "./RutInput";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../config/env";

interface LoginScreenProps {
  onLogin: (payload: any) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
}: LoginScreenProps) {
  const [rut, setRut] = useState("");
  const [rutValid, setRutValid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: ENV.GOOGLE_CLIENT_ID,
      iosClientId: ENV.GOOGLE_CLIENT_ID,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError("");

      if (!rutValid) {
        setError("RUT inválido");
        return;
      }

      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();

      const idToken = result?.idToken ?? result?.data?.idToken;

      console.log("📥 TOKEN1:", idToken);  

      if (!idToken) {
        setError("Error autenticación Google");
        return;
      }

      const loginResponse = await fetch(
        "https://devticket.uchilefau.cl/api/mobile/auth/google",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: idToken,
            rut: rut,
          }),
        }
      );

      const loginData = await loginResponse.json();

      console.log("📥 LOGIN RESPONSE:", loginData);

      if (!loginResponse.ok) {
        setError(loginData?.message || "Error login");
        return;
      }

      /* ---------------- MULTI TENANT ---------------- */
      if (loginData.requires_tenant_selection) {
        onLogin({
          requiresTenantSelection: true,
          loginTicket: loginData.login_ticket,
          tenants: loginData.tenants,
        });
        return;
      }

      /* ---------------- SINGLE TENANT ---------------- */

      const token =
        loginData?.token ||
        loginData?.access_token ||
        loginData?.data?.token;

      if (!token) {
        setError("No se recibió token");
        return;
      }

      await AsyncStorage.setItem("token", token);

      const meResponse = await fetch(
        "https://devticket.uchilefau.cl/api/mobile/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const meData = await meResponse.json();

      onLogin({
        requiresTenantSelection: false,
        token,
        user: meData,
        tenant_id: meData?.tenant_id,
      });

    } catch (e: any) {
      console.log(e);

      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;

      setError("Error login Google");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Icon name="home" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>ayuda.uchile.cl</Text>
          <Text style={styles.subtitle}>
            Sistema de gestión institucional
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingreso a la plataforma</Text>

          <Text style={styles.label}>RUT chileno</Text>
          <RutInput
            value={rut}
            onChange={(v, valid) => {
              setRut(v);
              setRutValid(valid);
              setError("");
            }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Icon name="chrome" size={18} color="#000" />
            <Text style={styles.googleText}>
              Continuar con Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onForgotPassword}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onRegister}>
            <Text style={styles.link}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Sistema de gestión · Universidad de Chile
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  scrollContainer: { padding: 16, alignItems: "center" },

  logoContainer: { alignItems: "center", marginBottom: 20 },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: "#007aff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  title: { fontSize: 22, fontWeight: "600" },
  subtitle: { fontSize: 12, color: "#666" },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },

  cardTitle: { fontSize: 18, marginBottom: 10 },

  label: { marginTop: 10 },

  googleButton: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    marginTop: 15,
  },

  googleText: { color: "#000", marginLeft: 8 },

  link: {
    textAlign: "center",
    marginTop: 10,
    color: "#007aff",
  },

  error: { color: "red", marginTop: 10 },

  footer: { marginTop: 20, fontSize: 10, color: "#999" },
});