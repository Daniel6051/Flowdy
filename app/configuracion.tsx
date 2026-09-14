import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Linking,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  Bell,
  Timer,
  Globe,
  Music2,
  ChevronRight,
  Check,
} from "lucide-react-native";
import { useIdioma, Idioma } from "../lib/idioma";

type OpcionConfig = {
  icono: React.ReactNode;
  label: string;
  ruta?: string;
  accion?: () => void;
  descripcion?: string;
};

export default function ConfiguracionScreen() {
  const router = useRouter();
  const { idioma, cambiarIdioma, t } = useIdioma();
  const [modalIdiomaVisible, setModalIdiomaVisible] = useState(false);

  const opciones: OpcionConfig[] = [
    {
      icono: <User size={20} color="#7C3AED" />,
      label: t("mi_cuenta"),
      ruta: "/perfil",
      descripcion: t("mi_cuenta_desc"),
    },
    {
      icono: <Bell size={20} color="#7C3AED" />,
      label: t("permisos"),
      // Abre directo la pantalla de ajustes de la app en el sistema (Android/iOS),
      // donde el usuario activa o desactiva cada permiso (mic, notificaciones, etc.)
      accion: () => Linking.openSettings(),
      descripcion: t("permisos_desc"),
    },
    {
      icono: <Timer size={20} color="#7C3AED" />,
      label: t("pomodoro_config"),
      descripcion: t("pomodoro_config_desc"),
    },
    {
      icono: <Globe size={20} color="#7C3AED" />,
      label: t("idioma"),
      accion: () => setModalIdiomaVisible(true),
      descripcion: idioma === "es" ? t("espanol") : t("ingles"),
    },
    {
      icono: <Music2 size={20} color="#7C3AED" />,
      label: t("conectar_musica"),
      descripcion: t("conectar_musica_desc"),
    },
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <ArrowLeft size={30} color="#7C3AED" />
      </TouchableOpacity>

      <Text style={styles.title}>{t("configuracion")}</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {opciones.map((op, i) => {
            const esAccionable = !!op.ruta || !!op.accion;
            return (
              <View key={op.label}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    if (op.ruta) router.push(op.ruta as any);
                    else if (op.accion) op.accion();
                  }}
                  activeOpacity={esAccionable ? 0.6 : 1}
                >
                  <View style={styles.rowIcon}>{op.icono}</View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowLabel}>{op.label}</Text>
                    {op.descripcion && (
                      <Text style={styles.rowDesc}>{op.descripcion}</Text>
                    )}
                  </View>
                  {esAccionable && <ChevronRight size={18} color="#CCC" />}
                </TouchableOpacity>
                {i < opciones.length - 1 && <View style={styles.separator} />}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Selector de idioma */}
      <Modal
        visible={modalIdiomaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalIdiomaVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalCaja}>
            <Text style={styles.modalTitulo}>{t("elegir_idioma")}</Text>

            {(["es", "en"] as Idioma[]).map((cod) => (
              <TouchableOpacity
                key={cod}
                onPress={() => {
                  cambiarIdioma(cod);
                  setModalIdiomaVisible(false);
                }}
                style={styles.opcionIdioma}
                activeOpacity={0.7}
              >
                <Text style={styles.opcionIdiomaTexto}>
                  {cod === "es" ? t("espanol") : t("ingles")}
                </Text>
                {idioma === cod && <Check size={18} color="#7C3AED" />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setModalIdiomaVisible(false)}
              style={styles.modalCerrar}
            >
              <Text style={styles.modalCerrarTexto}>{t("listo")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalCaja: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  opcionIdioma: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  opcionIdiomaTexto: {
    fontSize: 15,
    color: "#1a1a2e",
  },
  modalCerrar: {
    marginTop: 8,
    alignItems: "center",
    padding: 10,
  },
  modalCerrarTexto: {
    color: "#9CA3AF",
    fontWeight: "700",
  },
});
