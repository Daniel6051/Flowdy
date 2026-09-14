import Constants from "expo-constants";
import { supabase } from "./supabase";

export type Recordatorio = {
  id: string;
  titulo: string;
  nota: string;
  hora: string; // HH:mm
  activo: boolean;
  notificationId?: string;
};

// Cambiado de "recordatorios" a "recordatorios-v2": el canal original quedó
// creado a medio armar (sin importance HIGH) porque el "sound: default" tiraba
// error antes de terminar de configurarlo. Los canales de Android son
// inmutables una vez creados, así que hace falta un ID nuevo para que tome
// la config correcta.
const CANAL = "recordatorios-v2";

export function avisosDelSistemaDisponibles() {
  return Constants.appOwnership !== "expo";
}

async function obtenerUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function obtenerRecordatorios(
  anio: number,
  mes: number,
  dia: number,
): Promise<Recordatorio[]> {
  const userId = await obtenerUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("recordatorios")
    .select("id, titulo, nota, hora, activo, notification_id")
    .eq("user_id", userId)
    .eq("anio", anio)
    .eq("mes", mes)
    .eq("dia", dia);

  if (error || !data) return [];

  return data.map(r => ({
    id: r.id,
    titulo: r.titulo,
    nota: r.nota ?? "",
    hora: r.hora,
    activo: r.activo,
    notificationId: r.notification_id ?? undefined,
  }));
}

export async function guardarRecordatorios(
  anio: number,
  mes: number,
  dia: number,
  lista: Recordatorio[],
) {
  const userId = await obtenerUserId();
  if (!userId) return;

  // Trae qué ids ya existen en la base para ese día, para saber qué borrar
  const { data: existentes } = await supabase
    .from("recordatorios")
    .select("id")
    .eq("user_id", userId)
    .eq("anio", anio)
    .eq("mes", mes)
    .eq("dia", dia);

  const idsActuales = new Set(lista.map(r => r.id));
  const idsABorrar = (existentes ?? [])
    .map(e => e.id)
    .filter(id => !idsActuales.has(id));

  if (idsABorrar.length > 0) {
    await supabase.from("recordatorios").delete().in("id", idsABorrar);
  }

  if (lista.length > 0) {
    await supabase.from("recordatorios").upsert(
      lista.map(r => ({
        id: r.id,
        user_id: userId,
        anio,
        mes,
        dia,
        titulo: r.titulo,
        nota: r.nota,
        hora: r.hora,
        activo: r.activo,
        notification_id: r.notificationId ?? null,
      }))
    );
  }
}

export function fechaDelRecordatorio(
  anio: number,
  mes: number,
  dia: number,
  hora: string,
): Date {
  const [h, m] = hora.split(":").map(Number);
  return new Date(anio, mes, dia, h, m, 0, 0);
}

async function cargarNotificaciones() {
  if (!avisosDelSistemaDisponibles()) return null;
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    const pedido = await Notifications.requestPermissionsAsync();
    return pedido.granted;
  } catch {
    return false;
  }
}

export async function programarRecordatorio(
  titulo: string,
  nota: string,
  cuando: Date,
): Promise<string | null> {
  if (cuando.getTime() <= Date.now()) return null;
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return null;
  try {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: "Recordatorios",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      // sin "sound" acá: sin un asset de sonido declarado en el plugin de
      // app.json, "default" tira "Custom sound 'default' not found in native
      // app" y aborta antes de terminar de crear el canal. Con importance
      // HIGH alcanza para que Android reproduzca su sonido de notificación
      // normal.
    });
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: nota || "Recordatorio de Flowdy",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: cuando,
        channelId: CANAL,
      },
    });
  } catch (e) {
    console.log("Error al programar notificación:", e);
    return null;
  }
}

export async function cancelarNotificacion(notificationId?: string) {
  if (!notificationId) return;
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ya se disparó o no existía
  }
}
