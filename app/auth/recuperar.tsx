// app/auth/recuperar.tsx
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
import { ArrowLeft, MailCheck } from "lucide-react-native";
import { useState } from "react";
import InputSeguro from "../../components/InputSeguro";
import FortalezaPassword from "../../components/FortalezaPassword";
import CaptchaVisual from "../../components/CaptchaVisual";
import { supabase } from "../../lib/supabase";
import {
  validarEmail,
  validarNombre,
  validarPassword,
  validarPasswordMatch,
  validarCodigo,
  sanitizar,
} from "../../lib/seguridad";

export default function RecuperarScreen() {
  const router = useRouter();

  const [paso, setPaso]           = useState<1 | 2 | 3>(1);
  const [email, setEmail]         = useState("");
  const [nombre, setNombre]       = useState("");
  const [captchaOk, setCaptchaOk] = useState(false);
  const [codigo, setCodigo]       = useState("");
  const [nueva, setNueva]         = useState("");
  const [repetir, setRepetir]     = useState("");
  const [cargando, setCargando]   = useState(false);

  const errEmail  = validarEmail(email);
  const errNombre = validarNombre(nombre);
  const errCodigo = validarCodigo(codigo);
  const errNueva  = validarPassword(nueva);
  const errRepetir = validarPasswordMatch(nueva, repetir);

  const paso1Valido = !errEmail && !errNombre && captchaOk;
  const paso2Valido = !errCodigo && !errNueva && !errRepetir;

  const handlePaso1 = async () => {
    if (!paso1Valido || cargando) return;
    setCargando(true);
    try {
      // No comprobamos el "error" acá a propósito: si el mail no existe,
      // Supabase igual puede devolver éxito o error según config, y en
      // cualquier caso NO queremos que la UI cambie de comportamiento
      // (evita que alguien use este formulario para saber qué mails están
      // registrados). El código de 6 dígitos solo llega si el mail existe.
      await supabase.auth.resetPasswordForEmail(sanitizar(email).toLowerCase());
      setPaso(2);
    } catch {
      // Solo caemos acá ante un error real de red/servicio, no de "mail inexistente"
      Alert.alert(
        "Revisar más tarde",
        "Ocurrió un error. Intentá de nuevo en unos minutos.",
        [{ text: "Entendido" }]
      );
    } finally {
      setCargando(false);
    }
  };

  const handlePaso2 = async () => {
    if (!paso2Valido || cargando) return;
    setCargando(true);
    try {
      // 1) El código de 6 dígitos crea una sesión de recuperación real
      const { error: errorOtp } = await supabase.auth.verifyOtp({
        email: sanitizar(email).toLowerCase(),
        token: codigo.trim(),
        type: "recovery",
      });
      if (errorOtp) throw errorOtp;

      // 2) Con esa sesión activa, ahora sí se puede cambiar la contraseña
      const { error: errorUpdate } = await supabase.auth.updateUser({
        password: nueva,
      });
      if (errorUpdate) throw errorUpdate;

      setPaso(3);
    } catch (err: any) {
      Alert.alert(
        "Código incorrecto o vencido",
        "Revisá el código que te enviamos por correo o solicitá uno nuevo.",
        [{ text: "Entendido" }]
      );
    } finally {
      setCargando(false);
    }
  };

  // ── Paso 3: Éxito ───────────────────────────────────────────
  if (paso === 3) {
    return (
      <View style={styles.container}>
        <View style={styles.exitoCard}>
          <View style={styles.exitoIcon}>
            <MailCheck size={40} color="#10B981" />
          </View>
          <Text style={styles.exitoTitle}>¡Contraseña actualizada!</Text>
          <Text style={styles.exitoText}>
            Tu contraseña fue cambiada con éxito. Podés iniciar sesión ahora.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.buttonText}>Ir al login</Text>
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
        <TouchableOpacity
          style={styles.back}
          onPress={() => (paso === 2 ? setPaso(1) : router.back())}
        >
          <ArrowLeft size={22} color="#7C3AED" />
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Recuperar contraseña</Text>

          {/* Indicador de paso */}
          <View style={styles.pasoRow}>
            {[1, 2].map((n, i) => (
              <View key={n} style={styles.pasoItem}>
                <View
                  style={[
                    styles.pasoDot,
                    paso >= n && styles.pasoDotActivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.pasoDotNum,
                      paso >= n && styles.pasoDotNumActivo,
                    ]}
                  >
                    {n}
                  </Text>
                </View>
                {i < 1 && (
                  <View
                    style={[
                      styles.pasoLinea,
                      paso >= 2 && styles.pasoLineaActiva,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* ── Paso 1: Verificar identidad ─────────────────── */}
          {paso === 1 && (
            <>
              <Text style={styles.subtitle}>
                Ingresá tu correo y nombre para verificar tu identidad.
              </Text>

              <InputSeguro
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                error={errEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputSeguro
                label="Nombre y Apellido"
                value={nombre}
                onChangeText={setNombre}
                error={errNombre}
                placeholder="Juan Pérez"
                autoCapitalize="words"
              />

              <CaptchaVisual
                verificado={captchaOk}
                onVerificado={setCaptchaOk}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🔒 Por seguridad, siempre recibirás la misma respuesta
                  independientemente de si el correo existe.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!paso1Valido || cargando) && styles.buttonDisabled,
                ]}
                onPress={handlePaso1}
                disabled={!paso1Valido || cargando}
              >
                <Text style={styles.buttonText}>
                  {cargando ? "Verificando…" : "Continuar"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Paso 2: Nueva contraseña ────────────────────── */}
          {paso === 2 && (
            <>
              <Text style={styles.subtitle}>
                Te enviamos un código de 6 dígitos a tu correo. Ingresalo junto
                con tu nueva contraseña.
              </Text>

              <InputSeguro
                label="Código de verificación"
                value={codigo}
                onChangeText={(v) => setCodigo(v.replace(/[^0-9]/g, "").slice(0, 10))}
                error={errCodigo}
                placeholder="Código del correo"
                keyboardType="number-pad"
              />

              <InputSeguro
                label="Nueva contraseña"
                value={nueva}
                onChangeText={setNueva}
                error={errNueva}
                esPassword
                placeholder="Mínimo 8 caracteres"
              />

              <FortalezaPassword password={nueva} />

              <InputSeguro
                label="Repetir contraseña"
                value={repetir}
                onChangeText={setRepetir}
                error={errRepetir}
                esPassword
                placeholder="Repetí la contraseña"
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  (!paso2Valido || cargando) && styles.buttonDisabled,
                ]}
                onPress={handlePaso2}
                disabled={!paso2Valido || cargando}
              >
                <Text style={styles.buttonText}>
                  {cargando ? "Guardando…" : "Guardar contraseña"}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },
  pasoRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 0,
    marginVertical: 4,
  },
  pasoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  pasoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  pasoDotActivo: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  pasoDotNum: {
    fontSize: 13,
    fontWeight: "700",
    color: "#CCC",
  },
  pasoDotNumActivo: {
    color: "#FFF",
  },
  pasoLinea: {
    width: 40,
    height: 2,
    backgroundColor: "#DDD",
    marginHorizontal: 4,
  },
  pasoLineaActiva: {
    backgroundColor: "#7C3AED",
  },
  infoBox: {
    backgroundColor: "#F8F7FF",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  infoText: {
    fontSize: 12,
    color: "#555",
    lineHeight: 17,
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
  exitoCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  exitoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  exitoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  exitoText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    lineHeight: 22,
  },
});
