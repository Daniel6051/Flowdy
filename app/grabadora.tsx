import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} from "expo-audio";
import { ArrowLeft, Mic, Play, Pause, Trash2, FileText } from "lucide-react-native";
import {
  Grabacion, getGrabaciones, eliminarGrabacion, formatearDuracion,
} from "../lib/grabaciones";

function uriLocal(uri: string) {
  if (uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("http")) return uri;
  return `file://${uri}`;
}

async function modoReproduccion() {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldRouteThroughEarpiece: false,
    interruptionMode: "doNotMix",
  });
  await setIsAudioActiveAsync(true);
}

export default function GrabadoraScreen() {
  const router = useRouter();
  const player = useAudioPlayer(null, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const [grabaciones, setGrabaciones] = useState<Grabacion[]>([]);
  const [idActiva, setIdActiva] = useState<string | null>(null);
  const [esperandoPlay, setEsperandoPlay] = useState(false);

  const detenerAlFinal = () => {
    setEsperandoPlay(false);
    setIdActiva(null);
    try {
      player.loop = false;
      player.pause();
      player.seekTo(0);
    } catch {
      // el player ya se liberó al salir de la pantalla
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargar();
      modoReproduccion().catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (esperandoPlay && status.isLoaded) {
      player.loop = false;
      player.muted = false;
      player.volume = 1;
      player.play();
      setEsperandoPlay(false);
    }
  }, [esperandoPlay, status.isLoaded]);

  useEffect(() => {
    if (status.error) {
      Alert.alert("Error de audio", status.error);
    }
  }, [status.error]);

  useEffect(() => {
    if (status.didJustFinish) detenerAlFinal();
  }, [status.didJustFinish]);

  useEffect(() => {
    if (!status.playing || status.duration <= 0) return;
    if (status.currentTime >= status.duration - 0.08) detenerAlFinal();
  }, [status.currentTime, status.playing, status.duration]);

  const cargar = async () => {
    setGrabaciones(await getGrabaciones());
  };

  const togglePlay = async (g: Grabacion) => {
    try {
      await modoReproduccion();
      player.loop = false;
      player.muted = false;
      player.volume = 1;
      if (idActiva === g.id && status.isLoaded) {
        if (status.playing) player.pause();
        else player.play();
        return;
      }
      setIdActiva(g.id);
      setEsperandoPlay(true);
      player.replace({ uri: uriLocal(g.uri) });
    } catch {
      Alert.alert("Error", "No se pudo reproducir este audio.");
    }
  };

  const handleEliminar = (id: string) => {
    Alert.alert("Eliminar grabación", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar", style: "destructive",
        onPress: async () => {
          if (idActiva === id) {
            try { player.pause(); } catch { /* player ya liberado */ }
            setIdActiva(null);
          }
          await eliminarGrabacion(id);
          cargar();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Grabacion }) => {
    const esActiva = idActiva === item.id;
    const reproduciendo = esActiva && status.playing;
    return (
      <View style={styles.item}>
        <TouchableOpacity
          style={[styles.playBtn, esActiva && styles.playBtnActivo]}
          onPress={() => togglePlay(item)}
        >
          {reproduciendo
            ? <Pause size={18} color="#FFF" />
            : <Play size={18} color={esActiva ? "#FFF" : "#7C3AED"} />
          }
        </TouchableOpacity>

        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre} numberOfLines={1}>{item.nombre}</Text>
          <Text style={styles.itemMeta}>
            {formatearDuracion(item.duracion)} · {new Date(item.fecha).toLocaleDateString("es-AR")}
          </Text>
          {item.transcripcion && (
            <Text style={styles.itemTranscripcion} numberOfLines={1}>
              📝 {item.transcripcion}
            </Text>
          )}
        </View>

        <View style={styles.itemAcciones}>
          <TouchableOpacity
            style={styles.accionBtn}
            onPress={() => Alert.alert("Whisperflow", "Disponible cuando conectemos la Whisper API.")}
          >
            <FileText size={18} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accionBtn}
            onPress={() => handleEliminar(item.id)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#7C3AED" />
        </TouchableOpacity>
        <Text style={styles.title}>Grabaciones</Text>
        <View style={styles.headerSpacer} />
      </View>

      {grabaciones.length === 0 ? (
        <View style={styles.vacio}>
          <Mic size={48} color="#C4B5FD" />
          <Text style={styles.vacioText}>No hay grabaciones todavía.</Text>
          <Text style={styles.vacioSub}>Tocá el botón para grabar.</Text>
        </View>
      ) : (
        <FlatList
          data={grabaciones}
          keyExtractor={(g) => g.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/grabadora-activa")}
        activeOpacity={0.85}
      >
        <Mic size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#B6C3F2", paddingTop: 56, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  headerSpacer: { width: 32 },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a2e", letterSpacing: -0.5 },
  lista: { gap: 10, paddingBottom: 100 },
  item: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  playBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#EDE9FE", justifyContent: "center", alignItems: "center",
  },
  playBtnActivo: { backgroundColor: "#7C3AED" },
  itemInfo: { flex: 1, gap: 2 },
  itemNombre: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  itemMeta: { fontSize: 12, color: "#999" },
  itemTranscripcion: { fontSize: 12, color: "#7C3AED", marginTop: 2 },
  itemAcciones: { flexDirection: "row", gap: 4 },
  accionBtn: { padding: 6 },
  vacio: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  vacioText: { fontSize: 16, fontWeight: "600", color: "#555" },
  vacioSub: { fontSize: 13, color: "#999" },
  fab: {
    position: "absolute", bottom: 32, right: 24,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#7C3AED", justifyContent: "center", alignItems: "center",
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
});
