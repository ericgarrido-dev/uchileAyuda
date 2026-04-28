import React, { useState, useEffect } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { formatRut, validateAndFormat, RutValidationResult } from "../lib/rutValidator";
import { ErrorBadge, ValidBadge } from "../components/ErrorBadge";

interface RutInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  showValidation?: boolean;
}

export function RutInput({
  value,
  onChange,
  onBlur,
  placeholder = "12.345.678-9",
  disabled = false,
  showValidation = true,
}: RutInputProps) {
  const [touched, setTouched] = useState(false);
  const [validation, setValidation] = useState<RutValidationResult>({ isValid: false });

  useEffect(() => {
    if (value) {
      const result = validateAndFormat(value);
      setValidation(result);
    } else {
      setValidation({ isValid: false });
    }
  }, [value]);

  const handleChangeText = (text: string) => {
    const formatted = formatRut(text);
    const result = validateAndFormat(formatted);

    onChange(formatted, result.isValid);
    setValidation(result);
  };

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const getValidationIcon = () => {
    if (!showValidation || !touched || !value) return null;

    if (validation.isValid) {
      return <Icon name="check-circle" size={20} color="#16a34a" />;
    }

    if (value.length > 0 && value.length < 8) {
      return <Icon name="alert-circle" size={20} color="#f59e0b" />;
    }

    return <Icon name="x-circle" size={20} color="#dc2626" />;
  };

  const getBorderColor = () => {
    if (!showValidation || !touched || !value) return "#ccc";

    if (validation.isValid) return "#16a34a";
    if (value.length > 0 && value.length < 8) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <View style={{ width: "100%" }}>
      <View style={[styles.inputWrapper, { borderColor: getBorderColor() }]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          placeholder={placeholder}
          editable={!disabled}
          maxLength={12}
        />
        {showValidation && <View style={styles.iconWrapper}>{getValidationIcon()}</View>}
      </View>

      {showValidation && (
        <View style={{ marginTop: 4 }}>
          {!touched && !value && (
            <Text style={styles.hintText}>Ingresa tu RUT con formato chileno</Text>
          )}

          {touched && value && !validation.isValid && validation.message && (
            <ErrorBadge message={validation.message} />
          )}

          {touched && validation.isValid && (
            <ValidBadge />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
  },
  input: { flex: 1, height: "100%" },
  iconWrapper: { marginLeft: 8 },
  hintText: { fontSize: 12, color: "#6b7280" },
  errorText: { fontSize: 12, color: "#dc2626", marginLeft: 4 },
  successText: { fontSize: 12, color: "#16a34a", marginLeft: 4 },
  validationRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
});