// app/(tabs)/cuenta.tsx
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LogIn, UserPlus, KeyRound, Settings, User, ChevronRight } from "lucide-react-native";
import { useAuth } from "../../lib/AuthContext";

export default function CuentaScreen() {
  const router = useRouter();
  const { session, cargando } = useAuth();

  // Mientras se resuelve si hay sesión guardada, no mostramos nada
  // todavía para evitar el parpadeo "no logueado" → "logueado".
  if (cargando) {
    return <View style={styles.container} />;
  }

  // ── Con sesión activa: mostramos el perfil, no los botones de login ──
  if (session) {
    const nombre = session.user?.user_metadata?.nombre ?? "Tu cuenta";
    const email = session.user?.email ?? "";

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.perfilRow}
            onPress={() => router.push("/perfil")}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <User size={26} color="#7C3AED" />
            </View>
            <View style={styles.perfilInfo}>
              <Text style={styles.perfilNombre}>{nombre}</Text>
              <Text style={styles.perfilEmail}>{email}</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.configLink}
            onPress={() => router.push("/configuracion")}
          >
            <Settings size={15} color="#999" />
            <Text style={styles.configText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Sin sesión: los botones de siempre ──
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cuenta</Text>
        <Text style={styles.subtitle}>
          Iniciá sesión para sincronizar tu progreso de forma segura.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/login")}
          activeOpacity={0.82}
        >
          <LogIn size={18} color="#FFF" />
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/auth/registro")}
          activeOpacity={0.82}
        >
          <UserPlus size={18} color="#FFF" />
          <Text style={styles.buttonText}>Registrarme</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.push("/auth/recuperar")}
          activeOpacity={0.82}
        >
          <KeyRound size={18} color="#7C3AED" />
          <Text style={styles.buttonTextOutline}>Olvidé mi contraseña</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.configLink}
          onPress={() => router.push("/configuracion")}
        >
          <Settings size={15} color="#999" />
          <Text style={styles.configText}>Configuración</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B6C3F2",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    gap: 14,
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
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    marginBottom: 4,
  },
  button: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  buttonTextOutline: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
  },
  configLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  configText: {
    color: "#999",
    fontSize: 13,
  },
  perfilRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  perfilInfo: {
    flex: 1,
    gap: 2,
  },
  perfilNombre: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  perfilEmail: {
    fontSize: 13,
    color: "#888",
  },
});
