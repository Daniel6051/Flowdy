import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { ArrowLeft, Mic, Pause, Square, Play } from "lucide-react-native";
import { guardarGrabacion, formatearDuracion } from "../lib/grabaciones";

const OPCIONES_GRABACION = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: "document" as const,
  isMeteringEnabled: true,
};

function nivelDeVoz(metering?: number) {
  if (metering == null || !Number.isFinite(metering)) return 0;
  if (metering < 0) return Math.max(0, Math.min(1, (metering + 50) / 50));
  if (metering <= 1) return metering;
  return Math.max(0, Math.min(1, metering / 160));
}

export default function GrabadoraActivaScreen() {
  const router = useRouter();
  const recorder = useAudioRecorder(OPCIONES_GRABACION);
  const recorderState = useAudioRecorderState(recorder, 80);
  const nivel = useSharedValue(0);

  const [estado, setEstado] = useState<"idle" | "grabando" | "pausado" | "listo">("idle");
  const [uri, setUri] = useState<string | null>(null);
  const [segundosGuardados, setSegundosGuardados] = useState(0);

  const segundos = estado === "listo"
    ? segundosGuardados
    : Math.floor(recorderState.durationMillis / 1000);

  useEffect(() => {
    let cancelado = false;

    const iniciar = async () => {
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (cancelado) return;
        if (!granted) {
          Alert.alert("Permiso denegado", "Necesitamos acceso al micrófono para grabar.");
          router.back();
          return;
        }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        if (cancelado) return;
        await recorder.prepareToRecordAsync();
        if (cancelado) return;
        recorder.record();
        setEstado("grabando");
      } catch {
        if (cancelado) return;
        Alert.alert("Error", "No se pudo iniciar la grabación.");
        router.back();
      }
    };

    iniciar();
    // expo-audio libera el recorder al desmontar; no hay que llamar stop/pause acá
    return () => {
      cancelado = true;
    };
  }, []);

  const pausar = () => {
    recorder.pause();
    setEstado("pausado");
  };

  const reanudar = () => {
    recorder.record();
    setEstado("grabando");
  };

  const detener = async () => {
    const duracionMs = recorder.getStatus().durationMillis;
    await recorder.stop();
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: "doNotMix",
    });
    setSegundosGuardados(Math.floor(duracionMs / 1000));
    setUri(recorder.uri);
    setEstado("listo");
  };

  const guardar = async () => {
    if (!uri) return;
    const fecha = new Date();
    await guardarGrabacion({
      id: Date.now().toString(),
      nombre: `Grabación ${fecha.toLocaleDateString("es-AR")} ${fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
      uri,
      duracion: segundos,
      fecha: fecha.toISOString(),
    });
    router.back();
  };

  const cancelar = () => {
    Alert.alert("Cancelar grabación", "¿Descartás esta grabación?", [
      { text: "Seguir grabando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const estaGrabando = estado === "grabando";

  useEffect(() => {
    const siguiente = estaGrabando ? nivelDeVoz(recorderState.metering) : 0;
    nivel.value = withTiming(siguiente, { duration: 90 });
  }, [estaGrabando, recorderState.metering]);

  const estiloAnilloChico = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + nivel.value * 0.28 }],
    opacity: 0.18 + nivel.value * 0.45,
  }));
  const estiloAnilloGrande = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + nivel.value * 0.5 }],
    opacity: 0.12 + nivel.value * 0.4,
  }));
  const estiloCirculo = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + nivel.value * 0.06 }],
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={cancelar}>
        <ArrowLeft size={22} color="#7C3AED" />
      </TouchableOpacity>

      <Text style={styles.title}>
        {estado === "idle" && "Iniciando…"}
        {estado === "grabando" && "Grabando"}
        {estado === "pausado" && "En pausa"}
        {estado === "listo" && "Grabación lista"}
      </Text>

      <Text style={styles.timer}>{formatearDuracion(segundos)}</Text>

      <View style={styles.micWrapper}>
        <Animated.View style={[styles.micRing, styles.micRing3, estiloAnilloGrande]} />
        <Animated.View style={[styles.micRing, styles.micRing2, estiloAnilloChico]} />
        <Animated.View style={[styles.micCircle, estaGrabando && styles.micCircleActive, estiloCirculo]}>
          <Mic size={40} color={estaGrabando ? "#FFF" : "#7C3AED"} />
        </Animated.View>
      </View>

      <View style={styles.controles}>
        {(estado === "grabando" || estado === "pausado") && (
          <>
            <TouchableOpacity style={styles.btnSecundario} onPress={cancelar}>
              <Square size={22} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnPrincipal}
              onPress={estado === "grabando" ? pausar : reanudar}
            >
              {estado === "grabando"
                ? <Pause size={28} color="#FFF" />
                : <Play size={28} color="#FFF" />
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecundario} onPress={detener}>
              <Square size={22} color="#7C3AED" fill="#7C3AED" />
            </TouchableOpacity>
          </>
        )}

        {estado === "listo" && (
          <TouchableOpacity style={styles.btnGuardar} onPress={guardar}>
            <Text style={styles.btnGuardarText}>Guardar grabación</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: "#B6C3F2",
    alignItems: "center", paddingTop: 56, paddingHorizontal: 24,
  },
  back: { alignSelf: "flex-start", padding: 4, marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "700", color: "#1a1a2e", letterSpacing: -0.3 },
  timer: {
    fontSize: 56, fontWeight: "700", color: "#1a1a2e",
    letterSpacing: -2, marginVertical: 32, fontVariant: ["tabular-nums"],
  },
  micWrapper: { justifyContent: "center", alignItems: "center", marginBottom: 48 },
  micRing: {
    position: "absolute", borderRadius: 999,
    borderWidth: 2, borderColor: "#7C3AED", opacity: 0.15,
  },
  micRing2: { width: 140, height: 140 },
  micRing3: { width: 180, height: 180 },
  micCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#EDE9FE", justifyContent: "center", alignItems: "center",
  },
  micCircleActive: { backgroundColor: "#7C3AED" },
  controles: { flexDirection: "row", alignItems: "center", gap: 20 },
  btnPrincipal: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#7C3AED", justifyContent: "center", alignItems: "center",
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnSecundario: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#FFF", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  btnGuardar: {
    backgroundColor: "#7C3AED", borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 40,
  },
  btnGuardarText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
