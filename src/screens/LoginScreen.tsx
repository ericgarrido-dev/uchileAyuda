import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { RutInput } from "./RutInput";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../config/env";
import api from "../services/api";
import { ErrorBadge } from "../components/ErrorBadge";
import messaging from "@react-native-firebase/messaging";
import ReactNativeBiometrics from "react-native-biometrics";
import Icon from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { APP_VERSION } from "../config/version";

interface LoginScreenProps {
  onLogin: (payload: any) => void;
}

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [rut, setRut] = useState("");
  const [rutValid, setRutValid] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);

  /* ---------------- FOCUS EFFECT ---------------- */
  useFocusEffect(
    React.useCallback(() => {
      GoogleSignin.configure({
        webClientId: ENV.GOOGLE_CLIENT_ID,
        iosClientId: ENV.IOS_CLIENT_ID,
      });
      checkBiometric();
    }, [])
  );

  /* ---------------- BIOMETRÍA ---------------- */
  const checkBiometric = async () => {
    try {
      const result = await rnBiometrics.isSensorAvailable();
      console.log("🔐 Biometría resultado:", JSON.stringify(result));

      const hasBiometric = result.available;

      // Con allowDeviceCredentials, simplePrompt funciona con PIN/patrón
      // aunque isSensorAvailable diga available: false
      setBiometricAvailable(true);
      setBiometryType(result.biometryType ?? null);

      const savedToken = await AsyncStorage.getItem("saved_token");
      const savedTenant = await AsyncStorage.getItem("saved_tenant_id");
      const hasSession = !!(savedToken && savedTenant);
      setHasSavedSession(hasSession);

      //console.log("🔐 Sesión guardada:", hasSession);
      //console.log("🔐 Sensor biométrico:", hasBiometric);

      if (hasSession) {
        handleBiometricLogin();
      }
    } catch (e) {
      console.log("❌ Error verificando biometría:", e);
      setBiometricAvailable(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const { success } = await rnBiometrics.simplePrompt({
        promptMessage: "Desbloquea para iniciar sesión",
        cancelButtonText: "Cancelar",
      });

      if (!success) return;

      setLoading(true);
      setError("");

      const token = await AsyncStorage.getItem("saved_token");
      const tenantId = await AsyncStorage.getItem("saved_tenant_id");
      const userName = await AsyncStorage.getItem("user_name");

      if (!token || !tenantId) {
        setError("Sesión expirada, inicia sesión nuevamente");
        await AsyncStorage.multiRemove(["saved_token", "saved_tenant_id"]);
        setHasSavedSession(false);
        return;
      }

      // Verificar que el token siga válido
      const meResponse = await api.get("/mobile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const meData = meResponse.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("tenant_id", tenantId);

      onLogin({
        requiresTenantSelection: false,
        token,
        user: { ...meData, name: userName },
        tenant_id: tenantId,
      });
    } catch (e: any) {
      console.log("❌ Biometric login falló:", e);

      // Si el dispositivo no tiene ningún bloqueo configurado
      if (
        e?.message?.includes("No enrolled") ||
        e?.message?.includes("no hardware") ||
        e?.message?.includes("No fingerprints") ||
        e?.message?.includes("BIOMETRIC_ERROR")
      ) {
        setBiometricAvailable(false);
        return;
      }

      await AsyncStorage.multiRemove(["saved_token", "saved_tenant_id"]);
      setHasSavedSession(false);
      setError("Sesión expirada, inicia sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOGIN GOOGLE ---------------- */
  const handleGoogleLogin = async () => {
    if (!rutValid) {
      setError("RUT inválido");
      return;
    }

    try {
      setError("");
      setLoading(true);

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("tenant_id");

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const result = await GoogleSignin.signIn();

      const idToken = result.idToken;

      if (!idToken) {
        setError("Error autenticación Google");
        return;
      }

      const loginResponse = await api.post("/mobile/auth/google", {
        id_token: idToken,
        rut,
      });

      const loginData = loginResponse.data;

      if (!loginData) {
        setError("Respuesta inválida del servidor");
        return;
      }

      /* ---------------- MULTI TENANT ---------------- */
      if (loginData.requires_tenant_selection) {
        await AsyncStorage.setItem(
          "user_name",
          loginData.user?.name ?? loginData.user?.email ?? "Usuario"
        );

        onLogin({
          requiresTenantSelection: true,
          loginTicket: loginData.login_ticket,
          tenants: loginData.tenants,
          user: loginData.user,
        });
        return;
      }

      /* ---------------- SINGLE TENANT ---------------- */
      const token = loginData?.token ?? loginData?.access_token;

      if (!token) {
        setError("No se recibió token");
        return;
      }

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem(
        "user_name",
        loginData.user?.name ?? loginData.user?.email ?? "Usuario"
      );

      const meResponse = await api.get("/mobile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const meData = meResponse.data;

      if (meData?.tenant_id) {
        await AsyncStorage.setItem("tenant_id", String(meData.tenant_id));
      }

      // Guardar FCM token
      try {
        const fcmToken = await messaging().getToken();

        await api.post(
          "/mobile/fcm-token",
          {
            token: fcmToken,
            platform: "android",
            tenant_id: meData?.tenant_id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (fcmError) {
        console.log("❌ Error guardando FCM token (single tenant):", fcmError);
      }

      // Guardar credenciales para biometría futura
      await AsyncStorage.setItem("saved_token", token);
      await AsyncStorage.setItem("saved_tenant_id", String(meData?.tenant_id));
      console.log("🔐 GUARDADO para biometría - token:", token ? "✅" : "❌", "tenant:", meData?.tenant_id);

      onLogin({
        requiresTenantSelection: false,
        token,
        user: { ...meData, name: loginData.user?.name },
        tenant_id: meData?.tenant_id,
      });
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;

      if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else {
        setError("Error login Google");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/logo/ic_launcher.png")}
            style={styles.logoImage}
          />
          <Text style={styles.title}>Uchile Ayuda</Text>
          <Text style={styles.subtitle}>Sistema de gestión institucional</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingreso a la plataforma</Text>
          <Text style={styles.label}>RUT</Text>
          <RutInput
            value={rut}
            onChange={(v, valid) => {
              setRut(v);
              setRutValid(valid);
              setError("");
            }}
          />
          {error ? <ErrorBadge message={error} /> : null}

          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Image
              source={require("../../assets/img/google.png")}
              style={{ width: 20, height: 20, resizeMode: "contain" }}
            />
            <Text style={styles.googleText}>
              {loading ? "Iniciando sesión..." : "Continuar con Google"}
            </Text>
          </TouchableOpacity>

          {/* BOTÓN DESBLOQUEO RÁPIDO */}
          {biometricAvailable && hasSavedSession && (
            <TouchableOpacity
              style={[styles.biometricButton, loading && styles.buttonDisabled]}
              onPress={handleBiometricLogin}
              disabled={loading}
            >
              <Icon
                name={
                  biometryType === "FaceID"
                    ? "scan-outline"
                    : biometryType === "Biometrics"
                      ? "finger-print-outline"
                      : "lock-closed-outline"
                }
                size={24}
                color="#007aff"
              />
              <Text style={styles.biometricText}>
                {biometryType === "FaceID"
                  ? "Iniciar con Face ID"
                  : biometryType === "Biometrics"
                    ? "Iniciar con huella"
                    : "Desbloqueo rápido"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footer}>
          Sistema de gestión · Universidad de Chile
        </Text>
        <Text style={styles.version}>
          v{APP_VERSION}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  scrollContainer: {
    flexGrow: 0.5,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
  },
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
  biometricButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007aff",
    marginTop: 12,
  },
  biometricText: {
    color: "#007aff",
    marginLeft: 8,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleText: {
    color: "#000",
    marginLeft: 8,
  },
  footer: {
    marginTop: 40,
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  version: {
    marginTop: 8,
    fontSize: 10,
    color: "#bbb",
    textAlign: "center",
  },
});