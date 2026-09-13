import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flag, Music2 } from "lucide-react-native";
import { useRouter } from "expo-router";

const OPCIONES_MINUTOS = [5, 10, 15, 20, 25, 30, 45, 60]; // opciones del selector de duración
const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6, 7, 8]; // opciones del selector de cantidad

export default function PomodoroScreen() {
  const [duracionMin, setDuracionMin] = useState(25); // duración de cada vuelta, en minutos
  const DURACION_POMODORO = duracionMin * 60;
  const [seconds, setSeconds] = useState(DURACION_POMODORO);
  const [running, setRunning] = useState(false);
  const [totalPomodoros, setTotalPomodoros] = useState(4);
  const [currentRound, setCurrentRound] = useState(1);
  const [musicaActiva, setMusicaActiva] = useState(false);
  const [vueltas, setVueltas] = useState<{ vuelta: number; hora: string; total: string }[]>([]);
  const [mostrarSelector, setMostrarSelector] = useState(false); // modal de minutos
  const [mostrarSelectorCantidad, setMostrarSelectorCantidad] = useState(false); // modal de cantidad de pomodoros
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const format = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `00:${m}:${ss}`;
  };

  // Cronómetro: baja de a 1 segundo mientras está corriendo
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => (s > 0 ? s - 1 : 0));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  // Cuando el timer llega a 0, se cierra la vuelta y arranca la siguiente
  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      setVueltas(v => {
        const total = (v.length + 1) * DURACION_POMODORO;
        return [...v, { vuelta: currentRound, hora: format(DURACION_POMODORO), total: format(total) }];
      });
      setSeconds(DURACION_POMODORO);
      setCurrentRound(r => (r < totalPomodoros ? r + 1 : 1));
    }
  }, [seconds]);

  // Botón grande: arranca o pausa el cronómetro actual
  const handlePlayPause = () => setRunning(r => !r);

  // Ícono chico (izquierda): resetea SOLO el cronómetro actual, no el historial
  const handleReset = () => {
    setRunning(false);
    setSeconds(DURACION_POMODORO);
  };

  // Ícono de bandera: abre el selector para elegir directamente cuántos pomodoros hacer
  const handleAbrirSelectorPomodoros = () => {
    if (running) return; // no se cambia mientras está corriendo
    setMostrarSelectorCantidad(true);
  };

  // Elegir la cantidad de pomodoros desde el selector
  const handleElegirCantidad = (n: number) => {
    setTotalPomodoros(n);
    setCurrentRound(r => (r > n ? 1 : r));
    setMostrarSelectorCantidad(false);
  };

  // Ícono de música: por ahora solo visual. Falta conectar Spotify / YouTube Music
  const handleMusica = () => {
    // TODO: integrar Spotify / YouTube Music (pendiente en roadmap)
    setMusicaActiva(m => !m);
  };

  // Tocar el círculo abre el selector de minutos (solo si no está corriendo)
  const handleAbrirSelector = () => {
    if (running) return;
    setMostrarSelector(true);
  };

  // Elegir una duración nueva desde el selector
  const handleElegirDuracion = (min: number) => {
    setDuracionMin(min);
    setSeconds(min * 60);
    setMostrarSelector(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1a1a1a" }}>Pomodoro</Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 24, color: "#7C3AED" }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Timer circular */}
      <View style={{ alignItems: "center", marginTop: 30 }}>
        <TouchableOpacity onPress={handleAbrirSelector} activeOpacity={running ? 1 : 0.7} style={{
          width: 200, height: 200, borderRadius: 100,
          borderWidth: 6, borderColor: "#7C3AED",
          backgroundColor: "#FFFFFF",
          alignItems: "center", justifyContent: "center"
        }}>
          <Text style={{ fontSize: 36, fontWeight: "bold", color: "#1a1a1a" }}>{format(seconds)}</Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 10, color: "#6B7280", fontSize: 13 }}>
          Pomodoro {currentRound} de {totalPomodoros}
        </Text>

        {/* Reset / cantidad de pomodoros / música */}
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10, alignItems: "center" }}>
          <TouchableOpacity onPress={handleReset} style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "#7C3AED",
            alignItems: "center", justifyContent: "center"
          }}>
            <RotateCcw size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAbrirSelectorPomodoros} disabled={running} style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: "#EDE9FE",
            alignItems: "center", justifyContent: "center",
            opacity: running ? 0.5 : 1
          }}>
            <Flag size={16} color="#7C3AED" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleMusica} style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: musicaActiva ? "#7C3AED" : "#EDE9FE",
            alignItems: "center", justifyContent: "center"
          }}>
            <Music2 size={16} color={musicaActiva ? "#FFFFFF" : "#7C3AED"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabla de vueltas */}
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginTop: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontWeight: "bold", color: "#9CA3AF", flex: 1 }}>Vuelta</Text>
          <Text style={{ fontWeight: "bold", color: "#9CA3AF", flex: 1, textAlign: "center" }}>Hora</Text>
          <Text style={{ fontWeight: "bold", color: "#9CA3AF", flex: 1, textAlign: "right" }}>Total</Text>
        </View>
        {vueltas.length === 0 ? (
          <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 4 }}>
            Todavía no completaste ninguna vuelta
          </Text>
        ) : (
          vueltas.map((v, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ flex: 1, color: "#1a1a1a" }}>{v.vuelta}</Text>
              <Text style={{ flex: 1, textAlign: "center", color: "#1a1a1a" }}>{v.hora}</Text>
              <Text style={{ flex: 1, textAlign: "right", color: "#1a1a1a" }}>{v.total}</Text>
            </View>
          ))
        )}
      </View>

      {/* Botón Play/Pausa (único control principal) */}
      <TouchableOpacity onPress={handlePlayPause} style={{
        backgroundColor: "#7C3AED", borderRadius: 12,
        padding: 16, alignItems: "center", marginTop: 16,
        flexDirection: "row", justifyContent: "center", gap: 8
      }}>
        {running ? <Pause size={18} color="#FFFFFF" /> : <Play size={18} color="#FFFFFF" />}
        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>{running ? "Pausa" : "Play"}</Text>
      </TouchableOpacity>

      {/* Botones Nota y Grabar */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
      <TouchableOpacity onPress={() => router.push("/notas")} style={{
          flex: 1, backgroundColor: "#7C3AED", borderRadius: 12,
          padding: 14, alignItems: "center"
        }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Nota</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/grabadora")} style={{
          flex: 1, backgroundColor: "#7C3AED", borderRadius: 12,
          padding: 14, alignItems: "center"
        }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Grabar audio</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de duración (se abre tocando el círculo del timer) */}
      <Modal visible={mostrarSelector} transparent animationType="fade" onRequestClose={() => setMostrarSelector(false)}>
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center", justifyContent: "center", padding: 30
        }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "100%", maxHeight: "60%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12, textAlign: "center" }}>
              Elegí la duración
            </Text>
            <ScrollView>
              {OPCIONES_MINUTOS.map(min => (
                <TouchableOpacity key={min} onPress={() => handleElegirDuracion(min)} style={{
                  paddingVertical: 12, borderRadius: 10, marginBottom: 6,
                  backgroundColor: min === duracionMin ? "#7C3AED" : "#EDE9FE",
                  alignItems: "center"
                }}>
                  <Text style={{ color: min === duracionMin ? "#FFFFFF" : "#7C3AED", fontWeight: "bold" }}>
                    {min} minutos
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setMostrarSelector(false)} style={{ marginTop: 8, alignItems: "center", padding: 10 }}>
              <Text style={{ color: "#9CA3AF", fontWeight: "bold" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selector de cantidad de pomodoros (se abre tocando la bandera) */}
      <Modal visible={mostrarSelectorCantidad} transparent animationType="fade" onRequestClose={() => setMostrarSelectorCantidad(false)}>
        <View style={{
          flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center", justifyContent: "center", padding: 30
        }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "100%", maxHeight: "60%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12, textAlign: "center" }}>
              ¿Cuántos pomodoros vas a hacer?
            </Text>
            <ScrollView>
              {OPCIONES_POMODOROS.map(n => (
                <TouchableOpacity key={n} onPress={() => handleElegirCantidad(n)} style={{
                  paddingVertical: 12, borderRadius: 10, marginBottom: 6,
                  backgroundColor: n === totalPomodoros ? "#7C3AED" : "#EDE9FE",
                  alignItems: "center"
                }}>
                  <Text style={{ color: n === totalPomodoros ? "#FFFFFF" : "#7C3AED", fontWeight: "bold" }}>
                    {n} {n === 1 ? "pomodoro" : "pomodoros"}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setMostrarSelectorCantidad(false)} style={{ marginTop: 8, alignItems: "center", padding: 10 }}>
              <Text style={{ color: "#9CA3AF", fontWeight: "bold" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
