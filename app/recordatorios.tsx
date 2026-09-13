import {
  View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Switch, Alert, Platform,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Plus, Trash2, Bell, ListChecks } from "lucide-react-native";
import { sanitizar } from "../lib/seguridad";
import { Tarea, obtenerTareas, guardarTareas, COLORES_PRIORIDAD } from "../lib/tareas";
import {
  Recordatorio,
  obtenerRecordatorios,
  guardarRecordatorios,
  pedirPermisoNotificaciones,
  programarRecordatorio,
  cancelarNotificacion,
  fechaDelRecordatorio,
  avisosDelSistemaDisponibles,
} from "../lib/recordatorios";

const HORAS = Array.from({ length: 36 }, (_, i) => {
  const total = 6 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export default function RecordatoriosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dia?: string; mes?: string; anio?: string }>();

  const hoy = new Date();
  const dia = params.dia ? Number(params.dia) : hoy.getDate();
  const mes = params.mes ? Number(params.mes) : hoy.getMonth();
  const anio = params.anio ? Number(params.anio) : hoy.getFullYear();

  const fecha = new Date(anio, mes, dia);
  const fechaTexto = fecha.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const [lista, setLista] = useState<Recordatorio[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaHora, setNuevaHora] = useState("09:00");
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaNota, setNuevaNota] = useState("");
  const [tareaHoraId, setTareaHoraId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setCargando(true);
      Promise.all([
        obtenerRecordatorios(anio, mes, dia),
        obtenerTareas(anio, mes, dia),
      ]).then(([r, t]) => {
        setLista(r);
        setTareas(t);
        setCargando(false);
      });
    }, [anio, mes, dia])
  );

  useEffect(() => {
    if (!cargando) guardarRecordatorios(anio, mes, dia, lista);
  }, [lista]);

  const ordenados = [...lista].sort((a, b) => a.hora.localeCompare(b.hora));
  const tareasPendientes = tareas.filter(t => !t.completada);
  const tareasHechas = tareas.filter(t => t.completada);

  const abrirModal = () => {
    setNuevaHora("09:00");
    setNuevoTitulo("");
    setNuevaNota("");
    setMostrarModal(true);
  };

  const programarSiSePuede = async (titulo: string, nota: string, hora: string) => {
    if (!avisosDelSistemaDisponibles()) return undefined;
    const cuando = fechaDelRecordatorio(anio, mes, dia, hora);
    if (cuando.getTime() <= Date.now()) return undefined;
    const permiso = await pedirPermisoNotificaciones();
    if (!permiso) return undefined;
    return (await programarRecordatorio(titulo, nota, cuando)) ?? undefined;
  };

  const agregar = async () => {
    const titulo = sanitizar(nuevoTitulo);
    if (!titulo) return;

    const cuando = fechaDelRecordatorio(anio, mes, dia, nuevaHora);
    if (cuando.getTime() <= Date.now()) {
      Alert.alert("Hora pasada", "Elegí una hora posterior a ahora para que te avise.");
      return;
    }

    const notificationId = await programarSiSePuede(titulo, sanitizar(nuevaNota), nuevaHora);
    setLista(r => [...r, {
      id: Date.now().toString(),
      titulo,
      nota: sanitizar(nuevaNota),
      hora: nuevaHora,
      activo: true,
      notificationId,
    }]);
    setMostrarModal(false);
  };

  const guardarTareasDia = async (nuevas: Tarea[]) => {
    setTareas(nuevas);
    await guardarTareas(anio, mes, dia, nuevas);
  };

  const toggleTarea = async (tarea: Tarea) => {
    const avisar = !tarea.avisar;
    const horaAviso = tarea.horaAviso || "09:00";
    if (avisar) {
      const notificationId = await programarSiSePuede(tarea.titulo, "Tarea de Flowdy", horaAviso);
      await guardarTareasDia(tareas.map(t => t.id === tarea.id
        ? { ...t, avisar: true, horaAviso, notificationId }
        : t));
      return;
    }
    await cancelarNotificacion(tarea.notificationId);
    await guardarTareasDia(tareas.map(t => t.id === tarea.id
      ? { ...t, avisar: false, notificationId: undefined }
      : t));
  };

  const cambiarHoraTarea = async (tarea: Tarea, hora: string) => {
    await cancelarNotificacion(tarea.notificationId);
    const notificationId = tarea.avisar
      ? await programarSiSePuede(tarea.titulo, "Tarea de Flowdy", hora)
      : undefined;
    await guardarTareasDia(tareas.map(t => t.id === tarea.id
      ? { ...t, horaAviso: hora, notificationId }
      : t));
    setTareaHoraId(null);
  };

  const toggleActivo = async (item: Recordatorio) => {
    if (!avisosDelSistemaDisponibles()) {
      setLista(r => r.map(rr => rr.id === item.id ? { ...rr, activo: !rr.activo } : rr));
      return;
    }

    if (item.activo) {
      await cancelarNotificacion(item.notificationId);
      setLista(r => r.map(rr => rr.id === item.id
        ? { ...rr, activo: false, notificationId: undefined }
        : rr));
      return;
    }

    const cuando = fechaDelRecordatorio(anio, mes, dia, item.hora);
    if (cuando.getTime() <= Date.now()) {
      Alert.alert("Ya pasó", "Este horario ya quedó atrás. Creá uno nuevo.");
      return;
    }
    const permiso = await pedirPermisoNotificaciones();
    if (!permiso) {
      Alert.alert("Permiso denegado", "Habilitá las notificaciones para activar el aviso.");
      return;
    }
    const notificationId = await programarRecordatorio(item.titulo, item.nota, cuando);
    if (!notificationId) return;
    setLista(r => r.map(rr => rr.id === item.id
      ? { ...rr, activo: true, notificationId }
      : rr));
  };

  const eliminar = async (item: Recordatorio) => {
    await cancelarNotificacion(item.notificationId);
    setLista(r => r.filter(rr => rr.id !== item.id));
  };

  const renderTarea = (tarea: Tarea, hecha: boolean) => (
    <View key={tarea.id} style={{
      backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 10,
      flexDirection: "row", alignItems: "center",
      opacity: hecha ? 0.45 : (tarea.avisar ? 1 : 0.7),
    }}>
      <View style={{
        width: 8, height: 8, borderRadius: 4, marginRight: 10,
        backgroundColor: COLORES_PRIORIDAD[tarea.prioridad],
      }} />
      <View style={{ flex: 1 }}>
        <Text style={{
          fontWeight: "bold", color: "#1a1a1a", fontSize: 15,
          textDecorationLine: hecha ? "line-through" : "none",
        }}>
          {tarea.titulo}
        </Text>
        {!hecha && (
          <TouchableOpacity onPress={() => setTareaHoraId(tarea.id)}>
            <Text style={{ color: "#7C3AED", fontSize: 12, marginTop: 2 }}>
              Aviso {tarea.horaAviso || "09:00"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {!hecha && (
        <Switch
          value={!!tarea.avisar}
          onValueChange={() => toggleTarea(tarea)}
          trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
          thumbColor={tarea.avisar ? "#7C3AED" : "#F3F4F6"}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 20, color: "#7C3AED" }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a1a" }}>Recordatorios</Text>
        <TouchableOpacity onPress={abrirModal}>
          <Plus size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 4, color: "#4B5563", fontSize: 13, textTransform: "capitalize" }}>
        {fechaTexto}
      </Text>

      {!avisosDelSistemaDisponibles() && (
        <View style={{
          backgroundColor: "#EDE9FE", borderRadius: 12, padding: 12, marginTop: 12,
        }}>
          <Text style={{ color: "#5B21B6", fontSize: 12 }}>
            En Expo Go los avisos del sistema no están disponibles. El recordatorio se guarda igual; las notificaciones se activan con un build propio (EAS).
          </Text>
        </View>
      )}

      <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <ListChecks size={16} color="#7C3AED" />
          <Text style={{ fontWeight: "bold", color: "#4B5563", fontSize: 13 }}>Tareas de este día</Text>
        </View>

        {tareas.length === 0 ? (
          <Text style={{ color: "#374151", marginBottom: 20, fontSize: 13 }}>
            No hay tareas para este día. Creálas en la pestaña Tareas y después activá el aviso acá.
          </Text>
        ) : (
          <View style={{ marginBottom: 12 }}>
            {tareasPendientes.map(t => renderTarea(t, false))}
            {tareasHechas.map(t => renderTarea(t, true))}
          </View>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 8 }}>
          <Bell size={16} color="#7C3AED" />
          <Text style={{ fontWeight: "bold", color: "#4B5563", fontSize: 13 }}>Otros avisos</Text>
        </View>

        {ordenados.length === 0 ? (
          <Text style={{ color: "#374151", fontSize: 13, marginBottom: 24 }}>
            No hay avisos extra. Tocá + para agregar uno que no sea una tarea.
          </Text>
        ) : (
          ordenados.map(item => (
            <View key={item.id} style={{
              backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 10,
              flexDirection: "row", alignItems: "center",
              opacity: item.activo ? 1 : 0.55,
            }}>
              <View style={{
                width: 56, alignItems: "center", justifyContent: "center",
                backgroundColor: "#EDE9FE", borderRadius: 10, paddingVertical: 8, marginRight: 12,
              }}>
                <Text style={{ color: "#7C3AED", fontWeight: "bold", fontSize: 13 }}>{item.hora}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: 15 }}>{item.titulo}</Text>
                {!!item.nota && (
                  <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>{item.nota}</Text>
                )}
              </View>
              <Switch
                value={item.activo}
                onValueChange={() => toggleActivo(item)}
                trackColor={{ false: "#E5E7EB", true: "#C4B5FD" }}
                thumbColor={item.activo ? "#7C3AED" : (Platform.OS === "android" ? "#F3F4F6" : "#9CA3AF")}
              />
              <TouchableOpacity onPress={() => eliminar(item)} style={{ padding: 6, marginLeft: 4 }}>
                <Trash2 size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={mostrarModal} transparent animationType="fade" onRequestClose={() => setMostrarModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, maxHeight: "80%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12 }}>
              Nuevo recordatorio
            </Text>

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Hora</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {HORAS.map(h => (
                <TouchableOpacity key={h} onPress={() => setNuevaHora(h)} style={{
                  paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8,
                  backgroundColor: h === nuevaHora ? "#7C3AED" : "#EDE9FE",
                }}>
                  <Text style={{ color: h === nuevaHora ? "#FFFFFF" : "#7C3AED", fontWeight: "bold" }}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Título</Text>
            <TextInput
              value={nuevoTitulo}
              onChangeText={setNuevoTitulo}
              placeholder="Ej: Entregar el TP"
              style={{ backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12, marginBottom: 12 }}
            />

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Nota (opcional)</Text>
            <TextInput
              value={nuevaNota}
              onChangeText={setNuevaNota}
              placeholder="Detalle del aviso"
              style={{ backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12, marginBottom: 18 }}
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setMostrarModal(false)} style={{ flex: 1, alignItems: "center", padding: 12 }}>
                <Text style={{ color: "#9CA3AF", fontWeight: "bold" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={agregar} style={{ flex: 1, backgroundColor: "#7C3AED", borderRadius: 10, alignItems: "center", padding: 12 }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!tareaHoraId} transparent animationType="fade" onRequestClose={() => setTareaHoraId(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12 }}>
              ¿A qué hora te lo recordamos?
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {HORAS.map(h => (
                <TouchableOpacity
                  key={h}
                  onPress={() => {
                    const tarea = tareas.find(t => t.id === tareaHoraId);
                    if (tarea) cambiarHoraTarea(tarea, h);
                  }}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginRight: 8,
                    backgroundColor: "#EDE9FE",
                  }}
                >
                  <Text style={{ color: "#7C3AED", fontWeight: "bold" }}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setTareaHoraId(null)} style={{ marginTop: 14, alignItems: "center" }}>
              <Text style={{ color: "#9CA3AF", fontWeight: "bold" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
