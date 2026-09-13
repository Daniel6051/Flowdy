// ============================================================
// components/FortalezaPassword.tsx
// Barra visual de fortaleza de contraseña en tiempo real.
// ============================================================

import { View, Text, StyleSheet } from "react-native";
import { fortalezaPassword } from "../lib/seguridad";

interface Props {
  password: string;
}

export default function FortalezaPassword({ password }: Props) {
  if (!password) return null;

  const { nivel, porcentaje, color } = fortalezaPassword(password);

  const requisitos = [
    { label: "8 caracteres mínimo",  ok: password.length >= 8 },
    { label: "Una mayúscula",        ok: /[A-Z]/.test(password) },
    { label: "Una minúscula",        ok: /[a-z]/.test(password) },
    { label: "Un número",            ok: /\d/.test(password) },
    { label: "Un símbolo (!@#$...)", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
  ];

  return (
    <View style={styles.container}>
      {/* Barra de fortaleza */}
      <View style={styles.barraFondo}>
        <View
          style={[
            styles.barraRelleno,
            { width: `${porcentaje}%` as any, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={[styles.nivelText, { color }]}>
        Contraseña {nivel}
      </Text>

      {/* Requisitos */}
      <View style={styles.requisitos}>
        {requisitos.map((r) => (
          <View key={r.label} style={styles.requisito}>
            <Text style={[styles.dot, r.ok ? styles.dotOk : styles.dotPendiente]}>
              {r.ok ? "✓" : "○"}
            </Text>
            <Text style={[styles.requisitText, r.ok && styles.requisitOk]}>
              {r.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  barraFondo: {
    height: 5,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },
  barraRelleno: {
    height: "100%",
    borderRadius: 10,
  },
  nivelText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  requisitos: {
    gap: 3,
  },
  requisito: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    fontSize: 12,
    width: 14,
    textAlign: "center",
  },
  dotOk: {
    color: "#10B981",
    fontWeight: "700",
  },
  dotPendiente: {
    color: "#CCC",
  },
  requisitText: {
    fontSize: 12,
    color: "#999",
  },
  requisitOk: {
    color: "#10B981",
  },
});
