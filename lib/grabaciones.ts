import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import * as Crypto from "expo-crypto";

export type Grabacion = {
  id: string;
  nombre: string;
  uri: string; // URL firmada para reproducir (temporal, se regenera en cada carga)
  duracion: number; // en segundos
  fecha: string;    // ISO, fecha de creación de la grabación
  transcripcion?: string;
  diaVinculado?: string | null; // "YYYY-MM-DD" — día del calendario al que el usuario la asoció manualmente
};

const BUCKET = "grabaciones";
const URL_EXPIRA_SEGUNDOS = 60 * 60; // 1 hora

export function generarIdGrabacion(): string {
  return Crypto.randomUUID();
}

async function obtenerUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

function extensionDesdeUri(uri: string): string {
  const partes = uri.split(".");
  return partes.length > 1 ? partes[partes.length - 1] : "m4a";
}

// Arma el string "YYYY-MM-DD" para un día del calendario (mes en base 0, como Date de JS).
export function diaISODesde(anio: number, mes: number, dia: number): string {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${anio}-${mm}-${dd}`;
}

async function firmarGrabaciones(
  filas: {
    id: string; nombre: string; path: string; duracion: number;
    fecha: string; transcripcion: string | null; dia_vinculado?: string | null;
  }[]
): Promise<Grabacion[]> {
  return Promise.all(
    filas.map(async (g) => {
      const { data: firmada } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(g.path, URL_EXPIRA_SEGUNDOS);
      return {
        id: g.id,
        nombre: g.nombre,
        uri: firmada?.signedUrl ?? "",
        duracion: g.duracion,
        fecha: g.fecha,
        transcripcion: g.transcripcion ?? undefined,
        diaVinculado: g.dia_vinculado ?? null,
      } as Grabacion;
    })
  );
}

// Trae TODAS las grabaciones del usuario (para el selector del modal "Agregar audios").
export async function getGrabaciones(): Promise<Grabacion[]> {
  const userId = await obtenerUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("grabaciones")
    .select("id, nombre, path, duracion, fecha, transcripcion, dia_vinculado")
    .eq("user_id", userId)
    .order("fecha", { ascending: false });

  if (error || !data) return [];

  return firmarGrabaciones(data);
}

// Asocia (o desasocia, pasando null) una grabación existente a un día puntual del calendario.
export async function vincularAudioADia(id: string, diaISO: string | null): Promise<void> {
  const userId = await obtenerUserId();
  if (!userId) return;

  await supabase
    .from("grabaciones")
    .update({ dia_vinculado: diaISO })
    .eq("id", id)
    .eq("user_id", userId);
}

// Trae las grabaciones vinculadas a algún día del mes indicado y las agrupa por día (1-31),
// para marcar el puntito en el calendario y mostrar la vista previa debajo de "Agregar audios".
export async function obtenerGrabacionesVinculadasDelMes(
  anio: number,
  mes: number // 0-11
): Promise<Record<number, Grabacion[]>> {
  const userId = await obtenerUserId();
  if (!userId) return {};

  const prefijo = `${anio}-${String(mes + 1).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("grabaciones")
    .select("id, nombre, path, duracion, fecha, transcripcion, dia_vinculado")
    .eq("user_id", userId)
    .like("dia_vinculado", `${prefijo}-%`)
    .order("fecha", { ascending: false });

  if (error || !data) return {};

  const conUrl = await firmarGrabaciones(data);

  const mapa: Record<number, Grabacion[]> = {};
  conUrl.forEach((g) => {
    if (!g.diaVinculado) return;
    const dia = Number(g.diaVinculado.split("-")[2]);
    if (!mapa[dia]) mapa[dia] = [];
    mapa[dia].push(g);
  });
  return mapa;
}

export async function guardarGrabacion(g: {
  id: string;
  nombre: string;
  uri: string; // uri local del archivo recién grabado
  duracion: number;
  fecha: string;
}): Promise<void> {
  const userId = await obtenerUserId();
  if (!userId) return;

  const ext = extensionDesdeUri(g.uri);
  const path = `${userId}/${g.id}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(g.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error: errorSubida } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), { contentType: "audio/m4a", upsert: true });

  if (errorSubida) throw errorSubida;

  await supabase.from("grabaciones").insert({
    id: g.id,
    user_id: userId,
    nombre: g.nombre,
    path,
    duracion: g.duracion,
    fecha: g.fecha,
  });
}

export async function eliminarGrabacion(id: string): Promise<void> {
  const userId = await obtenerUserId();
  if (!userId) return;

  const { data } = await supabase
    .from("grabaciones")
    .select("path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (data?.path) {
    await supabase.storage.from(BUCKET).remove([data.path]);
  }

  await supabase.from("grabaciones").delete().eq("id", id).eq("user_id", userId);
}

// Cambia el nombre visible de una grabación (edición inline en grabadora.tsx).
export async function renombrarGrabacion(id: string, nuevoNombre: string): Promise<void> {
  const userId = await obtenerUserId();
  if (!userId) return;

  const nombreLimpio = nuevoNombre.trim();
  if (!nombreLimpio) return;

  await supabase
    .from("grabaciones")
    .update({ nombre: nombreLimpio })
    .eq("id", id)
    .eq("user_id", userId);
}

export async function actualizarTranscripcion(id: string, transcripcion: string): Promise<void> {
  const userId = await obtenerUserId();
  if (!userId) return;

  await supabase.from("grabaciones").update({ transcripcion }).eq("id", id).eq("user_id", userId);
}

export async function transcribirAudio(id: string, uriArchivo: string): Promise<string> {
  const Constants = (await import("expo-constants")).default;
  const groqApiKey = Constants.expoConfig?.extra?.groqApiKey;

  if (!groqApiKey) throw new Error("Falta GROQ_API_KEY en el .env");

  // Leemos el archivo como base64
  const base64 = await FileSystem.readAsStringAsync(uriArchivo, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Convertimos base64 a ArrayBuffer usando decode (ya importado)
  const arrayBuffer = decode(base64);

  // Construimos el multipart/form-data manualmente
  const boundary = "----FlowdyBoundary" + Date.now();
  const cabecera =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="audio.m4a"\r\n` +
    `Content-Type: audio/m4a\r\n\r\n`;
  const campos =
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="language"\r\n\r\nes\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="response_format"\r\n\r\ntext\r\n` +
    `--${boundary}--\r\n`;

  // Concatenamos todo en un solo ArrayBuffer
  const encoder = new TextEncoder();
  const cabeceraBytes = encoder.encode(cabecera);
  const camposBytes = encoder.encode(campos);
  const audioBytes = new Uint8Array(arrayBuffer);

  const total = new Uint8Array(cabeceraBytes.length + audioBytes.length + camposBytes.length);
  total.set(cabeceraBytes, 0);
  total.set(audioBytes, cabeceraBytes.length);
  total.set(camposBytes, cabeceraBytes.length + audioBytes.length);

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: total.buffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }

  const texto = await res.text();
  await actualizarTranscripcion(id, texto.trim());
  return texto.trim();
}

export function formatearDuracion(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
