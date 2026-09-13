import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { Evento, obtenerEventos, guardarEventos } from "../lib/planDelDia";

const COLORES = ["#DBEAFE", "#D1FAE5", "#EDE9FE", "#FEF3C7", "#FCE7F3"];
const HORAS = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, "0")}:00`);

export default function PlanDelDiaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dia?: string; mes?: string; anio?: string }>();

  const hoy = new Date();
  const dia = params.dia ? Number(params.dia) : hoy.getDate();
  const mes = params.mes ? Number(params.mes) : hoy.getMonth();
  const anio = params.anio ? Number(params.anio) : hoy.getFullYear();

  const fecha = new Date(anio, mes, dia);
  const fechaTexto = fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const saltarGuardado = useRef(true);

  useEffect(() => {
    let activo = true;
    saltarGuardado.current = true;
    setCargando(true);
    setErrorRed(null);
    obtenerEventos(anio, mes, dia).then(e => {
      if (!activo) return;
      saltarGuardado.current = true;
      setEventos(e);
      setCargando(false);
    });
    return () => { activo = false; };
  }, [anio, mes, dia]);

  useEffect(() => {
    if (cargando) return;
    if (saltarGuardado.current) {
      saltarGuardado.current = false;
      return;
    }
    guardarEventos(anio, mes, dia, eventos).then(ok => {
      setErrorRed(ok ? null : "No se pudieron guardar los eventos. ¿Hay sesión iniciada?");
    });
  }, [eventos, cargando, anio, mes, dia]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevaHora, setNuevaHora] = useState(HORAS[4]);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [nuevoColor, setNuevoColor] = useState(COLORES[0]);

  const eventosOrdenados = [...eventos].sort((a, b) => a.hora.localeCompare(b.hora));

  const abrirModal = () => {
    setNuevaHora(HORAS[4]);
    setNuevoTitulo("");
    setNuevaDescripcion("");
    setNuevoColor(COLORES[0]);
    setMostrarModal(true);
  };

  const agregarEvento = () => {
    if (!nuevoTitulo.trim()) return;
    setEventos(e => [...e, {
      id: Date.now().toString(),
      hora: nuevaHora,
      titulo: nuevoTitulo.trim(),
      descripcion: nuevaDescripcion.trim(),
      color: nuevoColor,
    }]);
    setMostrarModal(false);
  };

  const eliminarEvento = (id: string) => {
    setEventos(e => e.filter(ev => ev.id !== id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 20, color: "#7C3AED" }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a1a" }}>Plan del día</Text>
        <TouchableOpacity onPress={abrirModal}>
          <Plus size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 4, color: "#4B5563", fontSize: 13, textTransform: "capitalize" }}>
        {fechaTexto}
      </Text>

      {errorRed && (
        <Text style={{ marginTop: 8, color: "#7C3AED", fontSize: 12, textAlign: "center" }}>
          {errorRed}
        </Text>
      )}

      <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
        {eventosOrdenados.length === 0 ? (
          <Text style={{ color: "#374151", textAlign: "center", marginTop: 40 }}>
            No hay nada planeado para este día. Tocá + para agregar algo.
          </Text>
        ) : (
          eventosOrdenados.map(ev => (
            <View key={ev.id} style={{ flexDirection: "row", marginBottom: 16 }}>
              <View style={{ width: 56, alignItems: "flex-end", paddingRight: 10, paddingTop: 14 }}>
                <Text style={{ color: "#374151", fontSize: 12, fontWeight: "bold" }}>{ev.hora}</Text>
              </View>
              <View style={{ width: 2, backgroundColor: "#FFFFFF", opacity: 0.6, marginRight: 10 }} />
              <View style={{ flex: 1, backgroundColor: ev.color, borderRadius: 12, padding: 14 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: 14, flex: 1 }}>{ev.titulo}</Text>
                  <TouchableOpacity onPress={() => eliminarEvento(ev.id)} style={{ padding: 2 }}>
                    <Trash2 size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                {!!ev.descripcion && (
                  <Text style={{ color: "#374151", fontSize: 12, marginTop: 4 }}>{ev.descripcion}</Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={mostrarModal} transparent animationType="fade" onRequestClose={() => setMostrarModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, maxHeight: "80%" }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 12 }}>
              Nuevo evento
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
              placeholder="Ej: Entrega de TP"
              style={{ backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12, marginBottom: 12 }}
            />

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Descripción (opcional)</Text>
            <TextInput
              value={nuevaDescripcion}
              onChangeText={setNuevaDescripcion}
              placeholder="Detalle del evento"
              multiline
              style={{ backgroundColor: "#F3F4F6", borderRadius: 10, padding: 12, marginBottom: 12, minHeight: 60, textAlignVertical: "top" }}
            />

            <Text style={{ color: "#6B7280", fontSize: 12, marginBottom: 6 }}>Color</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
              {COLORES.map(c => (
                <TouchableOpacity key={c} onPress={() => setNuevoColor(c)} style={{
                  width: 28, height: 28, borderRadius: 14, backgroundColor: c,
                  borderWidth: nuevoColor === c ? 2 : 0, borderColor: "#7C3AED",
                }} />
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setMostrarModal(false)} style={{ flex: 1, alignItems: "center", padding: 12 }}>
                <Text style={{ color: "#9CA3AF", fontWeight: "bold" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={agregarEvento} style={{ flex: 1, backgroundColor: "#7C3AED", borderRadius: 10, alignItems: "center", padding: 12 }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}