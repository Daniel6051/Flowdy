import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import { ShieldCheck } from "lucide-react-native";

const SITE_KEY = "111e6344-1512-425a-9814-f03c495e53ca";

interface Props {
  onVerificado: (ok: boolean) => void;
  verificado: boolean;
  onToken: (token: string | null) => void;
}

export default function CaptchaHcaptcha({ onVerificado, verificado, onToken }: Props) {
  const captchaRef = useRef<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // dispara la verificación apenas se monta; en modo Passive no suele mostrar nada visible
    captchaRef.current?.show();
  }, []);

  const onMessage = (event: any) => {
    if (!event?.nativeEvent?.data) return;

    if (event.success) {
      const token = event.nativeEvent.data;
      event.markUsed?.();
      captchaRef.current?.hide();
      setCargando(false);
      onToken(token);
      onVerificado(true);
      return;
    }

    if (event.nativeEvent.data === "challenge-closed") {
      captchaRef.current?.hide();
      setCargando(false);
      onVerificado(false);
      onToken(null);
      return;
    }

    // cualquier otro string es un error de hCaptcha (timeout, red, etc.)
    setCargando(false);
    onVerificado(false);
    onToken(null);
  };

  if (verificado) {
    return (
      <View style={styles.verificadoRow}>
        <ShieldCheck size={20} color="#10B981" />
        <Text style={styles.verificadoText}>Verificación completada</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cargando && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text style={styles.loadingText}>Verificando...</Text>
        </View>
      )}
      <ConfirmHcaptcha
        ref={captchaRef}
        siteKey={SITE_KEY}
        baseUrl="https://hcaptcha.com"
        onMessage={onMessage}
        size="invisible"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, justifyContent: "center" },
  loadingText: { color: "#7C3AED", fontSize: 13 },
  verificadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  verificadoText: { color: "#065F46", fontWeight: "600", fontSize: 14 },
});