// app/auth/login.tsx
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ShieldAlert, Clock } from "lucide-react-native";
import { useState } from "react";
import InputSeguro from "../../components/InputSeguro";
import CaptchaVisual from "../../components/CaptchaVisual";
import { supabase } from "../../lib/supabase";
import {
  validarEmail,
  validarPassword,
  registrarIntento,
  resetearIntentos,
  formatearTiempoBloqueo,
  sanitizar,
} from "../../lib/seguridad";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [cargando, setCargando]   = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [msBloqueo, setMsBloqueo] = useState(0);

  // Errores de campo
  const errEmail    = validarEmail(email);
  const errPassword = validarPassword(password);
  const formularioValido = !errEmail && !errPassword && captchaOk;

  const handleLogin = async () => {
    if (!formularioValido || cargando || bloqueado) return;

    // Rate limiting en cliente
    const resultado = registrarIntento("login");
    if (resultado.bloqueado) {
      setBloqueado(true);
      setMsBloqueo(resultado.msRestantes);
      return;
    }

    setCargando(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizar(email).toLowerCase(),
        password, // la contraseña NO se sanitiza — Supabase la hashea
      });
      if (error) throw error;

      resetearIntentos("login");
      router.replace("/perfil");
    } catch (err: any) {
      // Mensaje genérico para no filtrar info sobre si el email existe
      Alert.alert(
        "Error al iniciar sesión",
        "Correo o contraseña incorrectos.",
        [{ text: "Entendido" }]
      );

      if (resultado.intentosRestantes <= 1) {
        Alert.alert(
          "Demasiados intentos",
          `Tu acceso será bloqueado temporalmente si seguís fallando.`
        );
      }
    } finally {
      setCargando(false);
    }
  };

  if (bloqueado) {
    return (
      <View style={styles.container}>
        <View style={styles.bloqueadoCard}>
          <ShieldAlert size={48} color="#EF4444" />
          <Text style={styles.bloqueadoTitle}>Acceso bloqueado</Text>
          <Text style={styles.bloqueadoText}>
            Demasiados intentos fallidos. Esperá{" "}
            <Text style={{ fontWeight: "700" }}>
              {formatearTiempoBloqueo(msBloqueo)}
            </Text>{" "}
            antes de intentar de nuevo.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setBloqueado(false);
              setCaptchaOk(false);
            }}
          >
            <Text style={styles.buttonText}>Volver a intentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#7C3AED" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Ingresar</Text>

          <InputSeguro
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            error={errEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <InputSeguro
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            error={errPassword}
            esPassword
            placeholder="Tu contraseña"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* Captcha visual + TODO hCaptcha */}
          <CaptchaVisual
            verificado={captchaOk}
            onVerificado={setCaptchaOk}
          />

          <TouchableOpacity
            style={[
              styles.button,
              (!formularioValido || cargando) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!formularioValido || cargando}
            activeOpacity={0.82}
          >
            <Text style={styles.buttonText}>
              {cargando ? "Ingresando…" : "Ingresar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/auth/recuperar")}>
            <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={() => router.push("/auth/registro")}>
            <Text style={styles.link}>
              ¿No tenés cuenta?{" "}
              <Text style={styles.linkBold}>Registrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B6C3F2",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  back: {
    alignSelf: "flex-start",
    marginBottom: 16,
    padding: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    gap: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1a2e",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#C4B5FD",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  linkBold: {
    color: "#7C3AED",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
  },
  bloqueadoCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  bloqueadoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  bloqueadoText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
});
