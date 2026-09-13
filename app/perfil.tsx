import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, User, Flame, Star, Trash2, LogOut } from "lucide-react-native";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export default function PerfilScreen() {
  const router = useRouter();
  const { session, cargando } = useAuth();

  // Si no hay sesión activa (ej: alguien entra directo a /perfil sin loguearse),
  // no tiene sentido mostrar esta pantalla — lo mandamos a login.
  useEffect(() => {
    if (!cargando && !session) {
      router.replace("/auth/login");
    }
  }, [cargando, session]);

  // Racha y plan todavía no existen en el backend — quedan fijos por ahora,
  // se conectan cuando implementemos esa parte del roadmap.
  const usuario = {
    nombre: session?.user?.user_metadata?.nombre ?? "Sin nombre",
    email: session?.user?.email ?? "",
    racha: 7,
    planilla: "Gratuito",
  };

  const handleCerrarSesion = () => {
    Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleEliminarCuenta = () => {
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // TODO: eliminar cuenta en Supabase
            // El cliente NO puede borrar el propio usuario de auth.users
            // (supabase.auth.admin.* requiere la service role key, que
            // nunca debe estar en la app). Hace falta una Edge Function
            // en Supabase que reciba el pedido autenticado del usuario
            // y ahí sí, del lado del servidor, llame a
            // supabase.auth.admin.deleteUser(uid) con la service role key.
            // Cuando esa función exista, acá se llama así:
            // await supabase.functions.invoke("eliminar-cuenta");
            console.log("Cuenta eliminada (pendiente: Edge Function)");
          },
        },
      ]
    );
  };

  if (cargando || !session) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft size={22} color="#7C3AED" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <User size={48} color="#7C3AED" />
          </View>
          <Text style={styles.nombre}>{usuario.nombre}</Text>
          <Text style={styles.email}>{usuario.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <Flame size={20} color="#7C3AED" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Racha de tareas completadas</Text>
              <Text style={styles.statValue}>{usuario.racha} días seguidos 🔥</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.statRow}>
            <View style={styles.statIcon}>
              <Star size={20} color="#7C3AED" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statLabel}>Plan actual</Text>
              <Text style={styles.statValue}>{usuario.planilla}</Text>
            </View>
          </View>
        </View>

        {/* Planilla/Premium */}
        <TouchableOpacity style={styles.premiumButton}>
          <Text style={styles.premiumText}>✨ Conocer Flowdy Premium</Text>
        </TouchableOpacity>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleCerrarSesion}
        >
          <LogOut size={16} color="#7C3AED" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Eliminar cuenta */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleEliminarCuenta}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={styles.deleteText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B6C3F2",
    padding: 24,
    paddingTop: 56,
  },
  back: {
    alignSelf: "flex-start",
    marginBottom: 8,
    padding: 4,
  },
  centrado: {
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    gap: 16,
    paddingBottom: 32,
  },
  avatarWrapper: {
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  nombre: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a2e",
    letterSpacing: -0.4,
  },
  email: {
    fontSize: 14,
    color: "#555",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  statInfo: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  premiumButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  premiumText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  deleteText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
  },
  logoutText: {
    color: "#7C3AED",
    fontSize: 15,
    fontWeight: "600",
  },
});
