import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal } from "react-native";
import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from "lucide-react-native";
import { Tarea, Prioridad, obtenerTareas, guardarTareas, COLORES_PRIORIDAD } from "../../lib/tareas";


const ETIQUETAS_PRIORIDAD: Record<Prioridad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export default function TareasScreen() {
  const [fecha, setFecha] = useState(new Date());
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const dia = fecha.getDate();

  const fechaTexto = fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const saltarGuardado = useRef(true);

  // Carga las tareas de este día cada vez que cambia la fecha o volvés a la pantalla.
  // Vaciamos la lista al instante para que no se vea la del día anterior.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      saltarGuardado.current = true;
      setTareas([]);
      setCargando(true);
      setErrorRed(null);
      obtenerTareas(anio, mes, dia).then(t => {
        if (!activo) return;
        saltarGuardado.current = true;
        setTareas(t);
        setCargando(false);
      });
      return () => { activo = false; };
    }, [anio, mes, dia])
  );

  // Guarda cada vez que la lista cambia (después de la carga inicial)
  useEffect(() => {
    if (cargando) return;
    if (saltarGuardado.current) {
      saltarGuardado.current = false;
      return;
    }
    guardarTareas(anio, mes, dia, tareas).then(ok => {
      setErrorRed(ok ? null : "No se pudieron guardar las tareas en Supabase. Revisá Data API (PGRST002).");
    });
  }, [tareas, cargando, anio, mes, dia]);

  const diaAnterior = () => setFecha(f => new Date(f.getFullYear(), f.getMonth(), f.getDate() - 1));
  const diaSiguiente = () => setFecha(f => new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1));
  const irAHoy = () => setFecha(new Date());

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaPrioridad, setNuevaPrioridad] = useState<Prioridad>("media");

  const abrirModal = () => {
    setNuevoTitulo("");
    setNuevaPrioridad("media");
    setMostrarModal(true);
  };

  const agregarTarea = () => {
    if (!nuevoTitulo.trim()) return;
    setTareas(t => [...t, {
      id: Date.now().toString(),
      titulo: nuevoTitulo.trim(),
      completada: false,
      prioridad: nuevaPrioridad,
    }]);
    setMostrarModal(false);
  };

  const toggleCompletada = (id: string) => {
    setTareas(t => t.map(tt => tt.id === id ? { ...tt, completada: !tt.completada } : tt));
  };

  const eliminarTarea = (id: string) => {
    setTareas(t => t.filter(tt => tt.id !== id));
  };

  const orden = { alta: 0, media: 1, baja: 2 };
  const tareasOrdenadas = [...tareas].sort((a, b) => {
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    return orden[a.prioridad] - orden[b.prioridad];
  });

  const completadas = tareas.filter(t => t.completada).length;

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1a1a1a" }}>Tareas</Text>
        <TouchableOpacity onPress={abrirModal}>
          <Plus size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Navegación de día */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <TouchableOpacity onPress={diaAnterior} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#7C3AED" />
        </TouchableOpacity>
        <TouchableOpacity onPress={irAHoy}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#1a1a1a", textTransform: "capitalize" }}>
            {fechaTexto}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={diaSiguiente} style={{ padding: 6 }}>
          <ChevronRight size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {errorRed && (
        <Text style={{ marginTop: 8, color: "#7C3AED", fontSize: 12, textAlign: "center" }}>
          {errorRed}
        </Text>
      )}

      {tareas.length > 0 && (
        <Text style={{ marginTop: 8, color: "#4B5563", fontSize: 13, textAlign: "center" }}>
          {completadas} de {tareas.length} completadas
        </Text>
      )}

      {/* Lista de tareas */}
      <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
        {tareasOrdenadas.length === 0 ? (
          <Text style={{ color: "#374151", textAlign: "center", marginTop: 40 }}>
            No hay tareas para este día. Tocá + para agregar una.
          </Text>
        ) : (
          tareasOrdenadas.map(t => (
            <View key={t.id} style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 10,
              opacity: t.completada ? 0.6 : 1,
            }}>
              <TouchableOpacity
                onPress={() => toggleCompletada(t.id)}
                style={{
                  width: 24, height: 24, borderRadius: 12, marginRight: 12,
                  borderWidth: 2, borderColor: "#7C3AED",
                  backgroundColor: t.completada ? "#7C3AED" : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                {t.completada && <Check size={14} color="#FFFFFF" />}
              </TouchableOpacity>

              <View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: COLORES_PRIORIDAD[t.prioridad], marginRight: 10,
              }} />

              <Text style={{
                flex: 1, color: "#1a1a1a", fontSize: 15,
                textDecorationLine: t.completada ? "line-through" : "none",
              }}>
                {t.titulo}
              </Text>

              <TouchableOpacity onPress={() => eliminarTarea(t.id)} style={{ padding: 4 }}>
                <Trash2 size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal para agregar tarea */}
      <Modal visible={mostrarModal} transparent animationType="fade" onRequestClose={() => setMostrarModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12 }}>
              Nueva tarea
            </Text>

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Título</Text>
            <TextInput
              value={nuevoTitulo}
              onChangeText={setNuevoTitulo}
              placeholder="Ej: Terminar TP de Sistemas Inteligentes"
              style={{ backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12, marginBottom: 14 }}
            />

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Prioridad</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
              {(Object.keys(ETIQUETAS_PRIORIDAD) as Prioridad[]).map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setNuevaPrioridad(p)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                    backgroundColor: nuevaPrioridad === p ? COLORES_PRIORIDAD[p] : "#F3F4F6",
                  }}
                >
                  <Text style={{ color: nuevaPrioridad === p ? "#FFFFFF" : "#374151", fontWeight: "bold" }}>
                    {ETIQUETAS_PRIORIDAD[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setMostrarModal(false)} style={{ flex: 1, alignItems: "center", padding: 12 }}>
                <Text style={{ color: "#9CA3AF", fontWeight: "bold" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={agregarTarea} style={{ flex: 1, backgroundColor: "#7C3AED", borderRadius: 10, alignItems: "center", padding: 12 }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}