import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { RutInput } from "./RutInput";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { ENV } from "../config/env";

useEffect(() => {
  GoogleSignin.configure({
    webClientId: ENV.GOOGLE_CLIENT_ID,
  });
}, []);

/* ---------------- TYPES ---------------- */

interface LoginScreenProps {
  onLogin: (rut: string, password: string) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

/* ---------------- COMPONENT ---------------- */

export function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
}: LoginScreenProps) {
  const [rut, setRut] = useState("");
  const [rutValid, setRutValid] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Google flow
  const [showRutModal, setShowRutModal] = useState(false);
  const [googleUserId, setGoogleUserId] = useState<string | null>(null);

  /* ---------------- INIT GOOGLE ---------------- */
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: ENV.GOOGLE_CLIENT_ID,
    });
  }, []);

  /* ---------------- LOGIN NORMAL ---------------- */
  const handleSubmit = () => {
    setError("");

    if (!rutValid) return setError("Debes ingresar un RUT válido");
    if (!password) return setError("Debes ingresar tu contraseña");
    if (password.length < 6)
      return setError("La contraseña debe tener al menos 6 caracteres");

    onLogin(rut, password);
  };

  /* ---------------- LOGIN GOOGLE ---------------- */
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const { email, name, id } = userInfo.user;

      const response = await fetch("https://TU_API/login-google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          google_id: id,
        }),
      });

      const data = await response.json();

      if (data.requires_rut) {
        setGoogleUserId(data.user_id);
        setShowRutModal(true);
      } else {
        console.log("Login OK", data);
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Cancelado");
      } else {
        console.log("Error Google", error);
      }
    }
  };

  /* ---------------- GUARDAR RUT DESDE GOOGLE ---------------- */
  const handleSaveRut = async () => {
    if (!rutValid) {
      setError("Debes ingresar un RUT válido");
      return;
    }

    await fetch("https://TU_API/save-rut", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: googleUserId,
        rut,
      }),
    });

    setShowRutModal(false);
    console.log("RUT guardado, login completo");
  };

  /* ---------------- UI ---------------- */

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Icon name="home" size={32} color="#fff" />
          </View>
          <Text style={styles.title}>ayuda.uchile.cl</Text>
          <Text style={styles.subtitle}>
            Sistema de gestión de solicitudes institucional
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ingreso a la plataforma</Text>

          {/* RUT */}
          <Text style={styles.label}>RUT chileno</Text>
          <RutInput
            value={rut}
            onChange={(v, valid) => {
              setRut(v);
              setRutValid(valid);
              setError("");
            }}
          />

          {/* Password */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock" size={20} color="#999" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? "eye-off" : "eye"} size={20} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Login normal */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Ingresar</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.divider} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <Icon name="chrome" size={18} color="#fff" />
            <Text style={styles.googleText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Otros */}
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

      {/* MODAL RUT GOOGLE */}
      <Modal visible={showRutModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Ingresa tu RUT para continuar
            </Text>

            <RutInput
              value={rut}
              onChange={(v, valid) => {
                setRut(v);
                setRutValid(valid);
              }}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSaveRut}
            >
              <Text style={styles.submitText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  inputWrapper: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },

  input: { flex: 1 },

  submitButton: {
    backgroundColor: "#007aff",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },

  submitText: { color: "#fff", fontWeight: "600" },

  googleButton: {
    backgroundColor: "#db4437",
    flexDirection: "row",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  googleText: { color: "#fff", marginLeft: 8 },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },

  divider: { flex: 1, height: 1, backgroundColor: "#ccc" },

  dividerText: { marginHorizontal: 8 },

  link: { textAlign: "center", marginTop: 10, color: "#007aff" },

  error: { color: "red" },

  footer: { marginTop: 20, fontSize: 10, color: "#999" },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#00000088",
  },

  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },

  modalTitle: { fontSize: 16, marginBottom: 10 },
});