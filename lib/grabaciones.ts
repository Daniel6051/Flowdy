import AsyncStorage from "@react-native-async-storage/async-storage";

export type Grabacion = {
  id: string;
  nombre: string;
  uri: string;
  duracion: number; // en segundos
  fecha: string;    // ISO
  transcripcion?: string;
};

const KEY = "flowdy_grabaciones";

export async function getGrabaciones(): Promise<Grabacion[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function guardarGrabacion(g: Grabacion): Promise<void> {
  const lista = await getGrabaciones();
  await AsyncStorage.setItem(KEY, JSON.stringify([g, ...lista]));
}

export async function eliminarGrabacion(id: string): Promise<void> {
  const lista = await getGrabaciones();
  await AsyncStorage.setItem(KEY, JSON.stringify(lista.filter((g) => g.id !== id)));
}

export async function actualizarTranscripcion(id: string, transcripcion: string): Promise<void> {
  const lista = await getGrabaciones();
  const nueva = lista.map((g) => (g.id === id ? { ...g, transcripcion } : g));
  await AsyncStorage.setItem(KEY, JSON.stringify(nueva));
}

export function formatearDuracion(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}