import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert, ScrollView } from "react-native";
import Animated, { FadeInRight, FadeInLeft, ZoomIn, FadeIn } from "react-native-reanimated";
import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Bell, ListChecks, Mic, Check } from "lucide-react-native";
import { Evento, obtenerEventos } from "../../lib/planDelDia";
import { Tarea, obtenerTareasDelMes, COLORES_PRIORIDAD } from "../../lib/tareas";
import {
  Grabacion, getGrabaciones, obtenerGrabacionesVinculadasDelMes,
  vincularAudioADia, diaISODesde, formatearDuracion,
} from "../../lib/grabaciones";

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CalendarioScreen() {
  const router = useRouter();
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate());
  const [direccion, setDireccion] = useState<"izq" | "der">("der");
  const [eventosDelDia, setEventosDelDia] = useState<Evento[]>([]);
  const [tareasPorDia, setTareasPorDia] = useState<Record<number, Tarea[]>>({});

  // Audios vinculados a días de este mes (para el puntito y la vista previa)
  const [audiosPorDia, setAudiosPorDia] = useState<Record<number, Grabacion[]>>({});

  // Modal "Agregar audios": lista completa de grabaciones para elegir cuáles vincular
  const [modalAudiosVisible, setModalAudiosVisible] = useState(false);
  const [todasLasGrabaciones, setTodasLasGrabaciones] = useState<Grabacion[]>([]);
  const [cargandoModal, setCargandoModal] = useState(false);

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = primerDia === 0 ? 6 : primerDia - 1;
  const celdas = Array.from({ length: offset + diasEnMes }, (_, i) => (i < offset ? null : i - offset + 1));

  // Agrupa las celdas en semanas de 7 para poder insertar la tarjeta de tareas debajo de la semana correcta
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));

  const mesAnterior = () => {
    setDireccion("izq");
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };

  const mesSiguiente = () => {
    setDireccion("der");
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const irAHoy = () => {
    const vaHaciaAdelante = anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth());
    setDireccion(vaHaciaAdelante ? "der" : "izq");
    setMes(hoy.getMonth());
    setAnio(hoy.getFullYear());
    setDiaSeleccionado(hoy.getDate());
  };

  const fechaSeleccionadaTexto = new Date(anio, mes, diaSeleccionado).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const diaISOSeleccionado = diaISODesde(anio, mes, diaSeleccionado);

  // Vista previa del Plan del Día para el día seleccionado
  useFocusEffect(
    useCallback(() => {
      obtenerEventos(anio, mes, diaSeleccionado).then(setEventosDelDia);
    }, [anio, mes, diaSeleccionado])
  );

  // Carga las tareas de TODOS los días del mes visible, para poder marcar el puntito
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const cargarMes = async () => {
        const mapa = await obtenerTareasDelMes(anio, mes);
        if (!activo) return;
        setTareasPorDia(mapa);
      };
      cargarMes();
      return () => { activo = false; };
    }, [anio, mes])
  );

  // Carga los audios VINCULADOS a días del mes visible (puntito celeste + vista previa)
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const cargarAudiosDelMes = async () => {
        const mapa = await obtenerGrabacionesVinculadasDelMes(anio, mes);
        if (!activo) return;
        setAudiosPorDia(mapa);
      };
      cargarAudiosDelMes();
      return () => { activo = false; };
    }, [anio, mes])
  );

  // Cuando se abre el modal, traemos TODAS las grabaciones para elegir cuáles vincular a este día
  useEffect(() => {
    if (!modalAudiosVisible) return;
    let activo = true;
    setCargandoModal(true);
    getGrabaciones().then((lista) => {
      if (!activo) return;
      setTodasLasGrabaciones(lista);
      setCargandoModal(false);
    });
    return () => { activo = false; };
  }, [modalAudiosVisible]);

  // Vincula o desvincula un audio del día seleccionado (toggle), con actualización optimista
  const alternarVinculo = async (audio: Grabacion) => {
    const yaVinculada = audio.diaVinculado === diaISOSeleccionado;
    const nuevoValor = yaVinculada ? null : diaISOSeleccionado;

    setTodasLasGrabaciones((prev) =>
      prev.map((g) => (g.id === audio.id ? { ...g, diaVinculado: nuevoValor } : g))
    );

    setAudiosPorDia((prev) => {
      const copia: Record<number, Grabacion[]> = {};
      Object.keys(prev).forEach((k) => {
        const num = Number(k);
        copia[num] = prev[num].filter((g) => g.id !== audio.id);
      });
      if (nuevoValor) {
        copia[diaSeleccionado] = [...(copia[diaSeleccionado] ?? []), { ...audio, diaVinculado: nuevoValor }];
      }
      return copia;
    });

    try {
      await vincularAudioADia(audio.id, nuevoValor);
    } catch {
      Alert.alert("Error", "No se pudo vincular el audio con este día.");
    }
  };

  const audiosDelDiaSeleccionado = audiosPorDia[diaSeleccionado] ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2" }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1a1a1a" }}>Calendario</Text>
        <TouchableOpacity onPress={irAHoy}>
          <Text style={{ fontSize: 13, color: "#7C3AED", fontWeight: "bold" }}>Hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Navegación mes */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <TouchableOpacity onPress={mesAnterior} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#7C3AED" />
        </TouchableOpacity>
        <Animated.Text
          key={`${mes}-${anio}`}
          entering={direccion === "der" ? FadeInRight.duration(200) : FadeInLeft.duration(200)}
          style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a" }}
        >
          {MESES[mes]} {anio}
        </Animated.Text>
        <TouchableOpacity onPress={mesSiguiente} style={{ padding: 6 }}>
          <ChevronRight size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Días de la semana */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 12 }}>
        {DIAS.map((d, i) => (
          <Text key={i} style={{ color: "#9CA3AF", fontWeight: "bold", width: 32, textAlign: "center" }}>{d}</Text>
        ))}
      </View>

      {/* Grid del calendario, semana por semana */}
      <Animated.View
        key={`grid-${mes}-${anio}`}
        entering={direccion === "der" ? FadeInRight.duration(220) : FadeInLeft.duration(220)}
        style={{ marginTop: 8 }}
      >
        {semanas.map((semana, si) => {
          const tareasDelSeleccionado = tareasPorDia[diaSeleccionado];
          const semanaTieneSeleccionado = semana.includes(diaSeleccionado);

          return (
            <Fragment key={si}>
              <View style={{ flexDirection: "row" }}>
                {semana.map((dia, i) => {
                  const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();
                  const seleccionado = dia === diaSeleccionado;
                  const tieneTareas = !!dia && !!tareasPorDia[dia]?.length;
                  const tieneAudios = !!dia && !!audiosPorDia[dia]?.length;
                  return (
                    <TouchableOpacity
                      key={i}
                      disabled={!dia}
                      onPress={() => dia && setDiaSeleccionado(dia)}
                      activeOpacity={0.6}
                      style={{ width: `${100 / 7}%`, alignItems: "center", paddingVertical: 6 }}
                    >
                      <Animated.View
                        entering={seleccionado ? ZoomIn.duration(150) : undefined}
                        style={{
                          width: 32, height: 32, borderRadius: 16,
                          backgroundColor: seleccionado ? "#7C3AED" : esHoy ? "#E9D5FF" : "transparent",
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Text style={{
                          color: seleccionado ? "#FFFFFF" : "#1a1a1a",
                          fontWeight: esHoy || seleccionado ? "bold" : "normal",
                        }}>
                          {dia || ""}
                        </Text>
                      </Animated.View>
                      <View style={{ flexDirection: "row", gap: 3, marginTop: 3, height: 5 }}>
                        <View style={{
                          width: 5, height: 5, borderRadius: 2.5,
                          backgroundColor: tieneTareas ? "#7C3AED" : "transparent",
                        }} />
                        <View style={{
                          width: 5, height: 5, borderRadius: 2.5,
                          backgroundColor: tieneAudios ? "#38BDF8" : "transparent",
                        }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tarjeta de tareas del día seleccionado, debajo de su semana */}
              {semanaTieneSeleccionado && tareasDelSeleccionado?.length > 0 && (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, marginBottom: 6 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: "#9CA3AF", marginBottom: 4 }}>
                    Tareas de este día
                  </Text>
                  {tareasDelSeleccionado.map(t => (
                    <View key={t.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                      <View style={{
                        width: 6, height: 6, borderRadius: 3, marginRight: 6,
                        backgroundColor: COLORES_PRIORIDAD[t.prioridad],
                      }} />
                      <Text style={{
                        fontSize: 12, color: "#1a1a1a",
                        textDecorationLine: t.completada ? "line-through" : "none",
                      }}>
                        {t.titulo}
                      </Text>
                    </View>
                  ))}
                </Animated.View>
              )}
            </Fragment>
          );
        })}
      </Animated.View>

      {/* Fecha seleccionada, en texto */}
      <Text style={{ marginTop: 10, color: "#4B5563", fontSize: 13, textTransform: "capitalize" }}>
        {fechaSeleccionadaTexto}
      </Text>

      {/* Botones */}
      <View style={{ gap: 12, marginTop: 16 }}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/recordatorios", params: { dia: diaSeleccionado, mes, anio } })}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#7C3AED", borderRadius: 12, padding: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Bell size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>Recordatorios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push({ pathname: "/plan-del-dia", params: { dia: diaSeleccionado, mes, anio } })}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#7C3AED", borderRadius: 12, padding: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <ListChecks size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>Plan del día</Text>
        </TouchableOpacity>

        {/* Vista previa de los eventos del Plan del Día */}
        {eventosDelDia.length > 0 && (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12 }}>
            {eventosDelDia
              .slice()
              .sort((a, b) => a.hora.localeCompare(b.hora))
              .map(ev => (
                <View key={ev.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ev.color, marginRight: 8 }} />
                  <Text style={{ color: "#1a1a1a", fontSize: 13 }}>{ev.hora} · {ev.titulo}</Text>
                </View>
              ))}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setModalAudiosVisible(true)}
          activeOpacity={0.8}
          style={{
            backgroundColor: "#7C3AED", borderRadius: 12, padding: 16,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Mic size={18} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>Agregar audios</Text>
        </TouchableOpacity>

        {/* Vista previa de los audios ya vinculados a este día — tocar para reproducir */}
        {audiosDelDiaSeleccionado.length > 0 && (
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12 }}>
            {audiosDelDiaSeleccionado.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => router.push({ pathname: "/grabadora", params: { id: a.id } })}
                activeOpacity={0.7}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}
              >
                <Mic size={14} color="#7C3AED" style={{ marginRight: 8 }} />
                <Text style={{ color: "#1a1a1a", fontSize: 13, flex: 1 }} numberOfLines={1}>
                  {a.nombre}
                </Text>
                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                  {formatearDuracion(a.duracion)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>

      {/* Modal: elegir qué audios existentes vincular a este día */}
      <Modal
        visible={modalAudiosVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAudiosVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 20, paddingBottom: 32, maxHeight: "75%",
          }}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1a1a1a", marginBottom: 4 }}>
              Agregar audios
            </Text>
            <Text style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 14, textTransform: "capitalize" }}>
              Elegí cuáles vincular al {fechaSeleccionadaTexto}
            </Text>

            {cargandoModal ? (
              <ActivityIndicator color="#7C3AED" style={{ marginBottom: 18 }} />
            ) : todasLasGrabaciones.length === 0 ? (
              <Text style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 18 }}>
                Todavía no tenés grabaciones. Grabá una desde Grabadora primero.
              </Text>
            ) : (
              <View style={{ marginBottom: 18, gap: 8 }}>
                {todasLasGrabaciones.map((g) => {
                  const vinculadaHoy = g.diaVinculado === diaISOSeleccionado;
                  const vinculadaOtroDia = !!g.diaVinculado && !vinculadaHoy;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      onPress={() => alternarVinculo(g)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row", alignItems: "center",
                        backgroundColor: vinculadaHoy ? "#EDE9FE" : "#F5F3FF",
                        borderRadius: 10, padding: 10, gap: 10,
                        borderWidth: vinculadaHoy ? 1.5 : 0, borderColor: "#7C3AED",
                      }}
                    >
                      <View style={{
                        width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#7C3AED",
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: vinculadaHoy ? "#7C3AED" : "transparent",
                      }}>
                        {vinculadaHoy && <Check size={12} color="#FFFFFF" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#1a1a1a", fontSize: 13 }} numberOfLines={1}>{g.nombre}</Text>
                        {vinculadaOtroDia && (
                          <Text style={{ color: "#9CA3AF", fontSize: 11 }}>
                            Ya vinculada a {g.diaVinculado}
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: "#9CA3AF", fontSize: 12 }}>{formatearDuracion(g.duracion)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              onPress={() => { setModalAudiosVisible(false); router.push("/grabadora-activa"); }}
              activeOpacity={0.85}
              style={{
                backgroundColor: "#7C3AED", borderRadius: 12, padding: 14,
                alignItems: "center", marginBottom: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 }}>
                Grabar nuevo audio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalAudiosVisible(false)} style={{ alignItems: "center", padding: 8 }}>
              <Text style={{ color: "#9CA3AF", fontSize: 13 }}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
