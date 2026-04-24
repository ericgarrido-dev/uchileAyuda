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

interface RegisterScreenProps {
    onRegister: (data: {
        name: string;
        email: string;
        rut: string;
        password: string;
    }) => void;
    onBackToLogin: () => void;
}

export function RegisterScreen({ onRegister, onBackToLogin }: RegisterScreenProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rut: "",
        password: "",
        confirmPassword: "",
    });
    const [rutValid, setRutValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
        else if (formData.name.trim().length < 3)
            newErrors.name = "El nombre debe tener al menos 3 caracteres";

        if (!formData.email.trim()) newErrors.email = "El correo es requerido";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            newErrors.email = "Ingresa un correo válido";

        if (!rutValid) newErrors.rut = "Debes ingresar un RUT válido";

        if (!formData.password) newErrors.password = "La contraseña es requerida";
        else if (formData.password.length < 8)
            newErrors.password = "La contraseña debe tener al menos 8 caracteres";

        if (!formData.confirmPassword)
            newErrors.confirmPassword = "Debes confirmar tu contraseña";
        else if (formData.password !== formData.confirmPassword)
            newErrors.confirmPassword = "Las contraseñas no coinciden";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            onRegister({
                name: formData.name,
                email: formData.email,
                rut: formData.rut,
                password: formData.password,
            });
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.container}>
                {/* Logo / Brand */}
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Icon name="home" size={32} color="#fff" />
                    </View>
                    <Text style={styles.title}>ayuda.uchile.cl</Text>
                    <Text style={styles.subtitle}>
                        Crea tu cuenta para acceder al sistema
                    </Text>
                </View>

                {/* Back */}
                <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
                    <Icon name="arrow-left" size={18} color="#6b7280" />
                    <Text style={styles.backText}>Volver al inicio de sesión</Text>
                </TouchableOpacity>

                {/* Form */}
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Completa los siguientes datos para registrarte</Text>

                {/* Name */}
                <Text style={styles.label}>Nombre completo</Text>
                <View style={styles.inputContainer}>
                    <Icon name="user" size={20} color="#999" style={styles.iconLeft} />
                    <TextInput
                        value={formData.name}
                        onChangeText={(text) => updateField("name", text)}
                        placeholder="Juan Pablo Morales"
                        style={styles.input}
                    />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                {/* Email */}
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputContainer}>
                    <Icon name="mail" size={20} color="#999" style={styles.iconLeft} />
                    <TextInput
                        value={formData.email}
                        onChangeText={(text) => updateField("email", text)}
                        placeholder="correo@uchile.cl"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* RUT */}
                <Text style={styles.label}>RUT chileno</Text>
                <RutInput
                    value={formData.rut}
                    onChange={(value, isValid) => {
                        updateField("rut", value);
                        setRutValid(isValid);
                    }}
                    showValidation={true}
                />
                {errors.rut && <Text style={styles.errorText}>{errors.rut}</Text>}

                {/* Password */}
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputContainer}>
                    <Icon name="lock" size={20} color="#999" style={styles.iconLeft} />
                    <TextInput
                        value={formData.password}
                        onChangeText={(text) => updateField("password", text)}
                        placeholder="Mínimo 8 caracteres"
                        style={styles.input}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                        style={styles.iconRight}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#999" />
                    </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                {/* Confirm Password */}
                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.inputContainer}>
                    <Icon name="lock" size={20} color="#999" style={styles.iconLeft} />
                    <TextInput
                        value={formData.confirmPassword}
                        onChangeText={(text) => updateField("confirmPassword", text)}
                        placeholder="Confirma tu contraseña"
                        style={styles.input}
                        secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                        style={styles.iconRight}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#999" />
                    </TouchableOpacity>
                </View>
                {errors.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}

                {/* Submit */}
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitText}>Crear cuenta</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    Al registrarte aceptas los términos y condiciones de uso
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 50,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    backText: {
        marginLeft: 6,
        color: "#6b7280",
        fontSize: 14,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 8,
        height: 44,
    },
    input: {
        flex: 1,
        height: "100%",
        paddingHorizontal: 8,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        padding: 4,
    },
    errorText: {
        color: "#dc2626",
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
    },
    submitButton: {
        backgroundColor: "#007aff",
        borderRadius: 10,
        paddingVertical: 12,
        marginTop: 16,
    },
    submitText: {
        color: "#fff",
        fontWeight: "600",
        textAlign: "center",
        fontSize: 16,
    },
    footerText: {
        fontSize: 12,
        color: "#6b7280",
        textAlign: "center",
        marginTop: 16,
    },
    // Logo
    logoContainer: {
        alignItems: "center",
        marginBottom: 24
    },

    logo: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: "#007aff",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8
    },
    label: { 
        fontSize: 14, 
        fontWeight: "500", 
        marginTop: 4,
        marginBottom: 4 
    },

});