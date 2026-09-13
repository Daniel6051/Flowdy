import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  Bell,
  Timer,
  Globe,
  Music2,
  ChevronRight,
} from "lucide-react-native";

type OpcionConfig = {
  icono: React.ReactNode;
  label: string;
  ruta?: string;
  descripcion?: string;
};

export default function ConfiguracionScreen() {
  const router = useRouter();

  const opciones: OpcionConfig[] = [
    {
      icono: <User size={20} color="#7C3AED" />,
      label: "Mi cuenta",
      ruta: "/perfil",
      descripcion: "Perfil y datos personales",
    },
    {
      icono: <Bell size={20} color="#7C3AED" />,
      label: "Permisos",
      descripcion: "Notificaciones y accesos",
    },
    {
      icono: <Timer size={20} color="#7C3AED" />,
      label: "Pomodoro config",
      descripcion: "Tiempos y descansos por defecto",
    },
    {
      icono: <Globe size={20} color="#7C3AED" />,
      label: "Idioma",
      descripcion: "Español",
    },
    {
      icono: <Music2 size={20} color="#7C3AED" />,
      label: "Conectar música",
      descripcion: "Spotify y otras apps",
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft size={22} color="#7C3AED" />
      </TouchableOpacity>

      <Text style={styles.title}>Configuración</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {opciones.map((op, i) => (
            <View key={op.label}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => op.ruta && router.push(op.ruta as any)}
                activeOpacity={op.ruta ? 0.6 : 1}
              >
                <View style={styles.rowIcon}>{op.icono}</View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{op.label}</Text>
                  {op.descripcion && (
                    <Text style={styles.rowDesc}>{op.descripcion}</Text>
                  )}
                </View>
                {op.ruta && (
                  <ChevronRight size={18} color="#CCC" />
                )}
              </TouchableOpacity>
              {i < opciones.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a2e",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  scroll: {
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a2e",
  },
  rowDesc: {
    fontSize: 12,
    color: "#888",
  },
  separator: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginLeft: 74,
  },
});
