// app/auth/registro.tsx
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
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import InputSeguro from "../../components/InputSeguro";
import FortalezaPassword from "../../components/FortalezaPassword";
import CaptchaVisual from "../../components/CaptchaVisual";
import { supabase } from "../../lib/supabase";
import {
  validarEmail,
  validarPassword,
  validarPasswordMatch,
  validarNombre,
  sanitizar,
} from "../../lib/seguridad";

export default function RegistroScreen() {
  const router = useRouter();

  const [email, setEmail]               = useState("");
  const [nombre, setNombre]             = useState("");
  const [password, setPassword]         = useState("");
  const [repetir, setRepetir]           = useState("");
  const [captchaOk, setCaptchaOk]       = useState(false);
  const [cargando, setCargando]         = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const errEmail    = validarEmail(email);
  const errNombre   = validarNombre(nombre);
  const errPassword = validarPassword(password);
  const errRepetir  = validarPasswordMatch(password, repetir);

  const formularioValido =
    !errEmail &&
    !errNombre &&
    !errPassword &&
    !errRepetir &&
    captchaOk &&
    aceptaTerminos;

  const handleRegistro = async () => {
    if (!formularioValido || cargando) return;
    setCargando(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: sanitizar(email).toLowerCase(),
        password,
        options: {
          data: { nombre: sanitizar(nombre) },
        },
      });
      if (error) throw error;

      Alert.alert(
        "¡Cuenta creada!",
        "Te enviamos un correo para confirmar tu cuenta.",
        [{ text: "Entendido", onPress: () => router.replace("/auth/login") }]
      );
    } catch (err: any) {
      // Acá sí mostramos el motivo real (ej: "User already registered"):
      // a diferencia del login, en un alta no hay nada que ocultar por enumeración
      // que Supabase no exponga ya por su cuenta.
      Alert.alert(
        "Error al registrarse",
        err?.message === "User already registered"
          ? "Ese correo ya tiene una cuenta. Probá iniciar sesión."
          : "Intentá de nuevo en unos momentos.",
        [{ text: "Entendido" }]
      );
    } finally {
      setCargando(false);
    }
  };

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
          <Text style={styles.title}>Registrarme</Text>

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
            label="Nombre y Apellido"
            value={nombre}
            onChangeText={setNombre}
            error={errNombre}
            placeholder="Juan Pérez"
            autoCapitalize="words"
            returnKeyType="next"
            hint="Solo letras, entre 2 y 60 caracteres"
          />

          <InputSeguro
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            error={errPassword}
            esPassword
            placeholder="Mínimo 8 caracteres"
            returnKeyType="next"
          />

          {/* Barra de fortaleza */}
          <FortalezaPassword password={password} />

          <InputSeguro
            label="Repetir contraseña"
            value={repetir}
            onChangeText={setRepetir}
            error={errRepetir}
            esPassword
            placeholder="Repetí la contraseña"
            returnKeyType="done"
          />

          {/* Términos y condiciones */}
          <TouchableOpacity
            style={styles.terminosRow}
            onPress={() => setAceptaTerminos((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, aceptaTerminos && styles.checkboxActivo]}>
              {aceptaTerminos && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.terminosText}>
              Acepto los{" "}
              <Text style={styles.terminosLink}>términos y condiciones</Text>
              {" "}y la{" "}
              <Text style={styles.terminosLink}>política de privacidad</Text>
            </Text>
          </TouchableOpacity>

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
            onPress={handleRegistro}
            disabled={!formularioValido || cargando}
            activeOpacity={0.82}
          >
            <Text style={styles.buttonText}>
              {cargando ? "Creando cuenta…" : "Crear cuenta"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={styles.link}>
              ¿Ya tenés cuenta?{" "}
              <Text style={styles.linkBold}>Iniciá sesión</Text>
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
  terminosRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#DDD",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxActivo: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  terminosText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  terminosLink: {
    color: "#7C3AED",
    fontWeight: "600",
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
});
