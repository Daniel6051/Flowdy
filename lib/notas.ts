import { supabase } from "./supabase";
import * as Crypto from "expo-crypto";

export type Nota = {
  id: string;
  titulo: string;
  contenido: string;
  actualizada: string; // ISO date string
};

export function generarIdNota(): string {
  return Crypto.randomUUID();
}

async function obtenerUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function obtenerNotas(): Promise<Nota[]> {
  const userId = await obtenerUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notas")
    .select("id, titulo, contenido, actualizada")
    .eq("user_id", userId)
    .order("actualizada", { ascending: false });

  if (error || !data) return [];
  return data as Nota[];
}

export async function obtenerNota(id: string): Promise<Nota | null> {
  const userId = await obtenerUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("notas")
    .select("id, titulo, contenido, actualizada")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Nota;
}

export async function guardarNota(nota: Nota) {
  const userId = await obtenerUserId();
  if (!userId) return;

  await supabase.from("notas").upsert({
    id: nota.id,
    user_id: userId,
    titulo: nota.titulo,
    contenido: nota.contenido,
    actualizada: nota.actualizada,
  });
}

export async function eliminarNota(id: string) {
  const userId = await obtenerUserId();
  if (!userId) return;

  await supabase.from("notas").delete().eq("id", id).eq("user_id", userId);
}