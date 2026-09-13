import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

export type Recordatorio = {
  id: string;
  titulo: string;
  nota: string;
  hora: string; // HH:mm
  activo: boolean;
  notificationId?: string;
};

const CANAL = "recordatorios";
const clave = (anio: number, mes: number, dia: number) =>
  `recordatorios-${anio}-${mes}-${dia}`;

export function avisosDelSistemaDisponibles() {
  // En Expo Go (Android SDK 53+) el módulo de notificaciones intenta
  // registrar push remoto y crashea. Los avisos de sistema quedan para EAS / dev client.
  return Constants.appOwnership !== "expo";
}

export async function obtenerRecordatorios(
  anio: number,
  mes: number,
  dia: number,
): Promise<Recordatorio[]> {
  try {
    const json = await AsyncStorage.getItem(clave(anio, mes, dia));
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function guardarRecordatorios(
  anio: number,
  mes: number,
  dia: number,
  lista: Recordatorio[],
) {
  await AsyncStorage.setItem(clave(anio, mes, dia), JSON.stringify(lista));
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
      sound: "default",
    }).catch(() => {});
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: titulo,
        body: nota || "Recordatorio de Flowdy",
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: cuando,
        channelId: CANAL,
      },
    });
  } catch {
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
