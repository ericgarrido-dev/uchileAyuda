import React, { useState, useEffect } from "react";
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
import AntDesign from 'react-native-vector-icons/AntDesign';
import { RutInput } from "./RutInput";
import { GoogleSignin, statusCodes, } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV } from "../config/env";
import api from "../services/api";
import { ErrorBadge } from '../components/ErrorBadge';

interface LoginScreenProps {
  onLogin: (payload: any) => void;
}

export function LoginScreen({
  onLogin,
}: LoginScreenProps) {
  const [rut, setRut] = useState("");
  const [rutValid, setRutValid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: ENV.GOOGLE_CLIENT_ID,
      iosClientId: ENV.IOS_CLIENT_ID,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError("");

      if (!rutValid) {
        setError("RUT inválido");
        return;
      }

      // Limpiar sesión anterior ANTES de todo
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("tenant_id");

      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const result = await GoogleSignin.signIn();

      const idToken = result.idToken;
      console.log("📥 TOKEN1:", idToken);

      if (!idToken) {
        setError("Error autenticación Google");
        return;
      }

      // Realizamos la solicitud a la API con Axios
      const loginResponse = await api.post('/mobile/auth/google', {
        id_token: idToken,
        rut: rut,
      });

      const loginData = loginResponse.data;
      console.log("📥 LOGIN RESPONSE:", loginData);

      // Verificar si hay un error en la respuesta
      if (!loginData) {
        setError("Respuesta inválida del servidor");
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
      const token = loginData?.token ?? loginData?.access_token;

      if (!token) {
        setError("No se recibió token");
        return;
      }

      try {
        await AsyncStorage.setItem("token", token);
      } catch {
        console.warn("No se pudo guardar el token");
      }

      const meResponse = await api.get('/mobile/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const meData = meResponse.data;
      console.log("📥 ME:", meData);

      onLogin({
        requiresTenantSelection: false,
        token,
        user: meData,
        tenant_id: meData?.tenant_id,
      });

    } catch (e: any) {
      console.log(e);

      if (e?.code === statusCodes.SIGN_IN_CANCELLED) return;

      if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else {
        setError("Error login Google");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View >
            <Image
              source={require("../../assets/logo/ic_launcher.png")}
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.title}>Uchile Ayuda</Text>
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
          {error ? <ErrorBadge message={error} /> : null}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <AntDesign name="google" size={20} color="#DB4437" />
            <Text style={styles.googleText}>
              Continuar con Google
            </Text>
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
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0"
  },
  scrollContainer: {
    padding: 16,
    alignItems: "center"
  },
  logoContainer: {
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: "#007aff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600"
  },
  subtitle: {
    fontSize: 12,
    color: "#666"
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10
  },
  label: {
    marginTop: 10
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
  googleText: {
    color: "#000",
    marginLeft: 8
  },
  link: {
    textAlign: "center",
    marginTop: 10,
    color: "#007aff",
  },
  error: {
    color: "red",
    marginTop: 10
  },
  footer: {
    marginTop: 20,
    fontSize: 10,
    color: "#999"
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});