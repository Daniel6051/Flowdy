import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Linking, Alert } from "react-native";
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Flag, Music2, Plus, ExternalLink, Trash2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OPCIONES_MINUTOS = [5, 10, 15, 20, 25, 30, 45, 60];
const OPCIONES_POMODOROS = [1, 2, 3, 4, 5, 6, 7, 8];

type Plataforma = "spotify" | "youtube";

type Playlist = {
  id: string;
  nombre: string;
  url: string;
  esCustom?: boolean;
};

const PLAYLISTS_DEFAULT: Record<Plataforma, Playlist[]> = {
  spotify: [
    {
      id: "sp1",
      nombre: "🍊 Lofi Fruits Music",
      url: "https://open.spotify.com/playlist/3LFIBdP7eZXJKqf3guepZ1",
    },
    {
      id: "sp2",
      nombre: "📖 Lofi Study Beats",
      url: "https://open.spotify.com/playlist/1JLw7Y5YvlsA10XjaKHTxE",
    },
    {
      id: "sp3",
      nombre: "🎧 Lofi Hip Hop / Chillhop",
      url: "https://open.spotify.com/playlist/32hJXySZtt9YvnwcYINGZ0",
    },
  ],
  youtube: [
    {
      id: "yt1",
      nombre: "📚 Lofi Girl — Study Radio",
      url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    },
    {
      id: "yt2",
      nombre: "🎷 Chillhop Music",
      url: "https://www.youtube.com/@ChillhopMusic",
    },
    {
      id: "yt3",
      nombre: "☕ The Jazz Hop Café",
      url: "https://www.youtube.com/@jazzhopcafe",
    },
  ],
};

const KEY_CUSTOM = "flowdy_playlists_custom";

export default function PomodoroScreen() {
  const [duracionMin, setDuracionMin] = useState(25);
  const DURACION_POMODORO = duracionMin * 60;
  const [seconds, setSeconds] = useState(DURACION_POMODORO);
  const [running, setRunning] = useState(false);
  const [totalPomodoros, setTotalPomodoros] = useState(4);
  const [currentRound, setCurrentRound] = useState(1);
  const [vueltas, setVueltas] = useState<{ vuelta: number; hora: string; total: string }[]>([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [mostrarSelectorCantidad, setMostrarSelectorCantidad] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // — Música —
  const [mostrarMusica, setMostrarMusica] = useState(false);
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [playlistSeleccionada, setPlaylistSeleccionada] = useState<Playlist | null>(null);
  const [customPlaylists, setCustomPlaylists] = useState<Record<Plataforma, Playlist[]>>({ spotify: [], youtube: [] });
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [nuevaNombre, setNuevaNombre] = useState("");
  const [nuevaUrl, setNuevaUrl] = useState("");

  useEffect(() => {
    cargarCustom();
  }, []);

  const cargarCustom = async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY_CUSTOM);
      if (raw) setCustomPlaylists(JSON.parse(raw));
    } catch {}
  };

  const guardarCustom = async (data: Record<Plataforma, Playlist[]>) => {
    await AsyncStorage.setItem(KEY_CUSTOM, JSON.stringify(data));
  };

  const playlists = plataforma
    ? [...PLAYLISTS_DEFAULT[plataforma], ...customPlaylists[plataforma]]
    : [];

  const handleAgregarPlaylist = async () => {
    if (!nuevaNombre.trim() || !nuevaUrl.trim() || !plataforma) return;
    const nueva: Playlist = {
      id: Date.now().toString(),
      nombre: nuevaNombre.trim(),
      url: nuevaUrl.trim(),
      esCustom: true,
    };
    const actualizado = {
      ...customPlaylists,
      [plataforma]: [...customPlaylists[plataforma], nueva],
    };
    setCustomPlaylists(actualizado);
    await guardarCustom(actualizado);
    setNuevaNombre("");
    setNuevaUrl("");
    setMostrarAgregar(false);
  };

  const handleEliminarCustom = async (id: string) => {
    if (!plataforma) return;
    const actualizado = {
      ...customPlaylists,
      [plataforma]: customPlaylists[plataforma].filter((p) => p.id !== id),
    };
    setCustomPlaylists(actualizado);
    await guardarCustom(actualizado);
    if (playlistSeleccionada?.id === id) setPlaylistSeleccionada(null);
  };

  const handlePlay = async () => {
    if (!playlistSeleccionada) return;
    try {
      await Linking.openURL(playlistSeleccionada.url);
    } catch {
      Alert.alert("Error", "No se pudo abrir la URL.");
    }
    setMostrarMusica(false);
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `00:${m}:${ss}`;
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
      setVueltas((v) => {
        const total = (v.length + 1) * DURACION_POMODORO;
        return [...v, { vuelta: currentRound, hora: format(DURACION_POMODORO), total: format(total) }];
      });
      setSeconds(DURACION_POMODORO);
      setCurrentRound((r) => (r < totalPomodoros ? r + 1 : 1));
    }
  }, [seconds]);

  const handlePlayPause = () => setRunning((r) => !r);

  const handleReset = () => {
    setRunning(false);
    setSeconds(DURACION_POMODORO);
  };

  const handleAbrirSelectorPomodoros = () => {
    if (running) return;
    setMostrarSelectorCantidad(true);
  };

  const handleElegirCantidad = (n: number) => {
    setTotalPomodoros(n);
    setCurrentRound((r) => (r > n ? 1 : r));
    setMostrarSelectorCantidad(false);
  };

  const handleAbrirSelector = () => {
    if (running) return;
    setMostrarSelector(true);
  };

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
        <TouchableOpacity
          onPress={handleAbrirSelector}
          activeOpacity={running ? 1 : 0.7}
          style={{
            width: 200, height: 200, borderRadius: 100,
            borderWidth: 6, borderColor: "#7C3AED",
            backgroundColor: "#FFFFFF",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 36, fontWeight: "bold", color: "#1a1a1a" }}>{format(seconds)}</Text>
        </TouchableOpacity>

        <Text style={{ marginTop: 10, color: "#6B7280", fontSize: 13 }}>
          Pomodoro {currentRound} de {totalPomodoros}
        </Text>

        {/* Controles chicos */}
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10, alignItems: "center" }}>
          <TouchableOpacity
            onPress={handleReset}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" }}
          >
            <RotateCcw size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAbrirSelectorPomodoros}
            disabled={running}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center", opacity: running ? 0.5 : 1 }}
          >
            <Flag size={16} color="#7C3AED" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { setPlataforma(null); setPlaylistSeleccionada(null); setMostrarMusica(true); }}
            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: playlistSeleccionada ? "#7C3AED" : "#EDE9FE", alignItems: "center", justifyContent: "center" }}
          >
            <Music2 size={16} color={playlistSeleccionada ? "#FFFFFF" : "#7C3AED"} />
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

      {/* Play / Pausa */}
      <TouchableOpacity
        onPress={handlePlayPause}
        style={{ backgroundColor: "#7C3AED", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16, flexDirection: "row", justifyContent: "center", gap: 8 }}
      >
        {running ? <Pause size={18} color="#FFFFFF" /> : <Play size={18} color="#FFFFFF" />}
        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>{running ? "Pausa" : "Play"}</Text>
      </TouchableOpacity>

      {/* Nota y Grabar */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => router.push("/notas")}
          style={{ flex: 1, backgroundColor: "#7C3AED", borderRadius: 12, padding: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Nota</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/grabadora")}
          style={{ flex: 1, backgroundColor: "#7C3AED", borderRadius: 12, padding: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Grabar audio</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL MÚSICA ── */}
      <Modal visible={mostrarMusica} transparent animationType="slide" onRequestClose={() => setMostrarMusica(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" }}>

            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1a1a2e", marginBottom: 16, textAlign: "center" }}>
              🎵 Música para estudiar
            </Text>

            {/* Selector de plataforma */}
            {!plataforma ? (
              <View style={{ gap: 12 }}>
                <Text style={{ color: "#888", textAlign: "center", marginBottom: 4 }}>¿Dónde querés escuchar?</Text>
                <TouchableOpacity
                  onPress={() => setPlataforma("spotify")}
                  style={{ backgroundColor: "#1DB954", borderRadius: 14, padding: 16, alignItems: "center" }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>🎧 Spotify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPlataforma("youtube")}
                  style={{ backgroundColor: "#FF0000", borderRadius: 14, padding: 16, alignItems: "center" }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>▶️ YouTube Music</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMostrarMusica(false)} style={{ marginTop: 4, alignItems: "center", padding: 10 }}>
                  <Text style={{ color: "#9CA3AF", fontWeight: "600" }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Volver a elegir plataforma */}
                <TouchableOpacity onPress={() => { setPlataforma(null); setPlaylistSeleccionada(null); }} style={{ marginBottom: 12 }}>
                  <Text style={{ color: "#7C3AED", fontWeight: "600" }}>← Cambiar plataforma</Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                  {playlists.map((p) => (
                    <View key={p.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={() => setPlaylistSeleccionada(p)}
                        style={{
                          flex: 1,
                          backgroundColor: playlistSeleccionada?.id === p.id ? "#7C3AED" : "#EDE9FE",
                          borderRadius: 12, padding: 14,
                        }}
                      >
                        <Text style={{ color: playlistSeleccionada?.id === p.id ? "#FFF" : "#1a1a2e", fontWeight: "600" }}>
                          {p.nombre}
                        </Text>
                      </TouchableOpacity>
                      {p.esCustom && (
                        <TouchableOpacity onPress={() => handleEliminarCustom(p.id)} style={{ padding: 10, marginLeft: 4 }}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {/* Agregar playlist */}
                  {mostrarAgregar ? (
                    <View style={{ backgroundColor: "#F5F3FF", borderRadius: 12, padding: 14, gap: 8, marginBottom: 8 }}>
                      <TextInput
                        placeholder="Nombre de la playlist"
                        placeholderTextColor="#aaa"
                        value={nuevaNombre}
                        onChangeText={setNuevaNombre}
                        style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 10, color: "#1a1a2e" }}
                      />
                      <TextInput
                        placeholder="URL (Spotify o YouTube)"
                        placeholderTextColor="#aaa"
                        value={nuevaUrl}
                        onChangeText={setNuevaUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                        style={{ borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 10, color: "#1a1a2e" }}
                      />
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => { setMostrarAgregar(false); setNuevaNombre(""); setNuevaUrl(""); }}
                          style={{ flex: 1, borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#EDE9FE" }}
                        >
                          <Text style={{ color: "#7C3AED", fontWeight: "600" }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleAgregarPlaylist}
                          disabled={!nuevaNombre.trim() || !nuevaUrl.trim()}
                          style={{ flex: 1, borderRadius: 8, padding: 10, alignItems: "center", backgroundColor: "#7C3AED", opacity: (!nuevaNombre.trim() || !nuevaUrl.trim()) ? 0.5 : 1 }}
                        >
                          <Text style={{ color: "#FFF", fontWeight: "600" }}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setMostrarAgregar(true)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#7C3AED", borderStyle: "dashed", marginBottom: 8 }}
                    >
                      <Plus size={16} color="#7C3AED" />
                      <Text style={{ color: "#7C3AED", fontWeight: "600" }}>Agregar playlist</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                {/* Botón Play */}
                <TouchableOpacity
                  onPress={handlePlay}
                  disabled={!playlistSeleccionada}
                  style={{ backgroundColor: "#7C3AED", borderRadius: 14, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 12, opacity: !playlistSeleccionada ? 0.4 : 1 }}
                >
                  <ExternalLink size={18} color="#FFF" />
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Abrir y escuchar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMostrarMusica(false)} style={{ marginTop: 10, alignItems: "center", padding: 8 }}>
                  <Text style={{ color: "#9CA3AF", fontWeight: "600" }}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Selector de duración */}
      <Modal visible={mostrarSelector} transparent animationType="fade" onRequestClose={() => setMostrarSelector(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 30 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "100%", maxHeight: "60%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12, textAlign: "center" }}>
              Elegí la duración
            </Text>
            <ScrollView>
              {OPCIONES_MINUTOS.map((min) => (
                <TouchableOpacity
                  key={min}
                  onPress={() => handleElegirDuracion(min)}
                  style={{ paddingVertical: 12, borderRadius: 10, marginBottom: 6, backgroundColor: min === duracionMin ? "#7C3AED" : "#EDE9FE", alignItems: "center" }}
                >
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

      {/* Selector de cantidad de pomodoros */}
      <Modal visible={mostrarSelectorCantidad} transparent animationType="fade" onRequestClose={() => setMostrarSelectorCantidad(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 30 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, width: "100%", maxHeight: "60%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12, textAlign: "center" }}>
              ¿Cuántos pomodoros vas a hacer?
            </Text>
            <ScrollView>
              {OPCIONES_POMODOROS.map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => handleElegirCantidad(n)}
                  style={{ paddingVertical: 12, borderRadius: 10, marginBottom: 6, backgroundColor: n === totalPomodoros ? "#7C3AED" : "#EDE9FE", alignItems: "center" }}
                >
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
