import { supabase } from "./supabase";

export type Evento = {
  id: string;
  hora: string;
  titulo: string;
  descripcion: string;
  color: string;
};

const aFecha = (anio: number, mes: number, dia: number) => {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${anio}-${mm}-${dd}`;
};

function desdeFila(row: any): Evento {
  return {
    id: row.id,
    hora: row.hora,
    titulo: row.titulo,
    descripcion: row.descripcion ?? "",
    color: row.color,
  };
}

function logError(contexto: string, error: { code?: string; message: string }) {
  console.log(`${contexto}:`, error.code ?? "sin-código", error.message);
}

export async function obtenerEventos(anio: number, mes: number, dia: number): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("plan_del_dia")
    .select("*")
    .eq("fecha", aFecha(anio, mes, dia))
    .order("hora", { ascending: true });

  if (error) {
    logError("Error al obtener plan del día", error);
    return [];
  }
  return (data ?? []).map(desdeFila);
}

export async function guardarEventos(
  anio: number,
  mes: number,
  dia: number,
  eventos: Evento[],
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("Error al guardar plan del día: no hay sesión activa");
    return false;
  }

  const fecha = aFecha(anio, mes, dia);

  const { data: existentes, error: errorExistentes } = await supabase
    .from("plan_del_dia")
    .select("id")
    .eq("fecha", fecha);

  if (errorExistentes) {
    logError("Error al leer eventos existentes", errorExistentes);
    return false;
  }

  const idsNuevos = eventos.map((e) => e.id);
  const idsABorrar = (existentes ?? [])
    .map((r) => r.id as string)
    .filter((id) => !idsNuevos.includes(id));

  if (idsABorrar.length > 0) {
    const { error: errorDelete } = await supabase.from("plan_del_dia").delete().in("id", idsABorrar);
    if (errorDelete) {
      logError("Error al borrar eventos viejos", errorDelete);
      return false;
    }
  }

  if (eventos.length > 0) {
    const filas = eventos.map((e) => ({
      id: e.id,
      user_id: user.id,
      fecha,
      hora: e.hora,
      titulo: e.titulo,
      descripcion: e.descripcion ?? "",
      color: e.color,
    }));

    const { error: errorUpsert } = await supabase.from("plan_del_dia").upsert(filas);
    if (errorUpsert) {
      logError("Error al guardar plan del día", errorUpsert);
      return false;
    }
  }

  return true;
}
