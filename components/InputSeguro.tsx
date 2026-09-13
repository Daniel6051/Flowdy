// ============================================================
// components/InputSeguro.tsx
// Input con validación en tiempo real, sanitización y manejo
// seguro del teclado (sin autocompletado en campos sensibles).
// ============================================================

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react-native";
import { sanitizar } from "../lib/seguridad";

interface Props extends Omit<TextInputProps, "onChangeText" | "value"> {
  label: string;
  value: string;
  onChangeText: (texto: string) => void;
  error?: string | null;
  esPassword?: boolean;
  validado?: boolean;    // muestra checkmark verde
  hint?: string;         // texto de ayuda debajo
  sanitize?: boolean;    // aplica sanitización (default: true)
}

export default function InputSeguro({
  label,
  value,
  onChangeText,
  error,
  esPassword = false,
  validado = false,
  hint,
  sanitize = true,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const [tocado, setTocado] = useState(false);

  const handleChange = (texto: string) => {
    const procesado = sanitize ? sanitizar(texto) : texto;
    onChangeText(procesado);
  };

  const mostrarError = tocado && !!error;
  const mostrarOk    = tocado && !error && value.length > 0;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          mostrarError && styles.inputError,
          mostrarOk    && styles.inputOk,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          onBlur={() => setTocado(true)}
          secureTextEntry={esPassword && !visible}
          autoCapitalize={esPassword ? "none" : rest.autoCapitalize ?? "none"}
          autoCorrect={false}
          // Deshabilitar autocompletado en campos sensibles
          autoComplete={esPassword ? "off" : rest.autoComplete}
          textContentType={esPassword ? "oneTimeCode" : rest.textContentType}
          placeholderTextColor="#BBB"
          {...rest}
        />

        {esPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setVisible((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {visible ? (
              <EyeOff size={18} color="#999" />
            ) : (
              <Eye size={18} color="#999" />
            )}
          </TouchableOpacity>
        )}

        {!esPassword && mostrarOk && (
          <CheckCircle size={18} color="#10B981" style={styles.iconRight} />
        )}

        {mostrarError && (
          <AlertCircle size={18} color="#EF4444" style={styles.iconRight} />
        )}
      </View>

      {mostrarError && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {hint && !mostrarError && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF8F8",
  },
  inputOk: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1a1a2e",
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 2,
  },
  hintText: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
});
