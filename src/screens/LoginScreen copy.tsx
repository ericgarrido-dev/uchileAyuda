import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { RutInput } from "./RutInput";

interface LoginScreenProps {
  onLogin: (rut: string, password: string) => void;
  onRegister: () => void;
  onForgotPassword: () => void;
}

export function LoginScreen({ onLogin, onRegister, onForgotPassword }: LoginScreenProps) {
  const [rut, setRut] = useState("");
  const [rutValid, setRutValid] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    if (!rutValid) return setError("Debes ingresar un RUT válido");
    if (!password) return setError("Debes ingresar tu contraseña");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");

    onLogin(rut, password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Logo / Brand */}
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
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Ingreso a la plataforma</Text>
            <Text style={styles.cardSubtitle}>
              El acceso depende de los tenants habilitados para tu cuenta
            </Text>
          </View>

          {/* RUT Input */}
          <Text style={styles.label}>RUT chileno</Text>
          <RutInput
            value={rut}
            onChange={(v, valid) => {
              setRut(v);
              setRutValid(valid);
              setError("");
            }}
          />

          {/* Password Input */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Icon name="lock" size={20} color="#999" style={styles.iconLeft} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError("");
              }}
              placeholder="Ingresa tu contraseña"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconRight}
            >
              <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Forgot Password */}
          <TouchableOpacity onPress={onForgotPassword} style={styles.forgotButton}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Ingresar</Text>
          </TouchableOpacity>

          <View style={styles.forgotTextNot}>
             <Text style={styles.registerText}>¿No tienes una cuenta?</Text>
          </View>

          {/* Register */}
          <View>
            <TouchableOpacity style={styles.registerButton} onPress={onRegister}>
              <Text style={styles.registerButtonText}>Registrarse</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Sistema de gestión multi-tenant · Universidad de Chile
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  scrollContainer: { padding: 16, alignItems: "center" },

  // Logo
  logoContainer: { alignItems: "center", marginBottom: 24 },
  logo: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#007aff", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 2 },
  subtitle: { fontSize: 12, color: "#666", textAlign: "center" },

  // Card
  card: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 24, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: "#666" },

  label: { fontSize: 14, fontWeight: "500", marginTop: 12, marginBottom: 4 },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 12, paddingHorizontal: 8, height: 40 },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  input: { flex: 1, height: "100%" },

  error: { color: "#dc2626", marginBottom: 12 },
  forgotButton: { alignSelf: "flex-end", marginBottom: 16 },
  forgotText: { color: "#007aff", fontSize: 12 },

  forgotTextNot: { alignItems: "center", marginBottom: 16 },

  submitButton: { backgroundColor: "#007aff", paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  submitButtonText: { color: "#fff", fontWeight: "600" },

  registerContainer: { alignItems: "center", marginTop: 16 },
  registerText: { fontSize: 12, marginBottom: 2, alignItems: "center", color: "#292a2b" },
  registerButton: { backgroundColor: "#f1f5f9", paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  registerButtonText: { color: "#000", fontWeight: "600" },

  footer: { textAlign: "center", fontSize: 10, color: "#999", marginTop: 24 }
});