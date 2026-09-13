import { supabase } from "./supabase";

export type Prioridad = "alta" | "media" | "baja";

export type Tarea = {
  id: string;
  titulo: string;
  completada: boolean;
  prioridad: Prioridad;
  avisar?: boolean;
  horaAviso?: string;
  notificationId?: string;
};

// Convierte anio/mes/dia (mes es 0-11, como Date de JS) al formato
// "YYYY-MM-DD" que usa la columna `fecha` (tipo date) en Postgres.
const aFecha = (anio: number, mes: number, dia: number) => {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${anio}-${mm}-${dd}`;
};

// La tabla usa snake_case (hora_aviso, notification_id); la UI espera
// camelCase (horaAviso, notificationId). Convertimos acá para que las
// pantallas no se enteren de este detalle.
function desdeFila(row: any): Tarea {
  return {
    id: row.id,
    titulo: row.titulo,
    completada: row.completada,
    prioridad: row.prioridad,
    avisar: row.avisar ?? undefined,
    horaAviso: row.hora_aviso ?? undefined,
    notificationId: row.notification_id ?? undefined,
  };
}

function logError(contexto: string, error: { code?: string; message: string }) {
  console.log(`${contexto}:`, error.code ?? "sin-código", error.message);
}

export async function obtenerTareas(anio: number, mes: number, dia: number): Promise<Tarea[]> {
  const { data, error } = await supabase
    .from("tareas")
    .select("*")
    .eq("fecha", aFecha(anio, mes, dia))
    .order("created_at", { ascending: true });

  if (error) {
    logError("Error al obtener tareas", error);
    return [];
  }
  return (data ?? []).map(desdeFila);
}

// Una sola query para el grid del calendario (evita 28–31 GETs por mes).
export async function obtenerTareasDelMes(anio: number, mes: number): Promise<Record<number, Tarea[]>> {
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const { data, error } = await supabase
    .from("tareas")
    .select("*")
    .gte("fecha", aFecha(anio, mes, 1))
    .lte("fecha", aFecha(anio, mes, ultimoDia))
    .order("created_at", { ascending: true });

  if (error) {
    logError("Error al obtener tareas del mes", error);
    return {};
  }

  const mapa: Record<number, Tarea[]> = {};
  for (const row of data ?? []) {
    const dia = Number(String(row.fecha).slice(8, 10));
    if (!mapa[dia]) mapa[dia] = [];
    mapa[dia].push(desdeFila(row));
  }
  return mapa;
}

export async function guardarTareas(anio: number, mes: number, dia: number, tareas: Tarea[]): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("Error al guardar tareas: no hay sesión activa");
    return false;
  }

  const fecha = aFecha(anio, mes, dia);

  // La pantalla llama a esta función con el array COMPLETO del día cada vez
  // (agregar, tildar, o borrar una tarea reescribe toda la lista). Para
  // respetar ese comportamiento sin perder datos, hacemos:
  //   1) upsert de todo lo que llega (inserta lo nuevo, actualiza lo existente)
  //   2) borramos en Supabase lo que ya no está en la lista (se eliminó en la UI)

  const { data: existentes, error: errorExistentes } = await supabase
    .from("tareas")
    .select("id")
    .eq("fecha", fecha);

  if (errorExistentes) {
    logError("Error al leer tareas existentes", errorExistentes);
    return false;
  }

  const idsNuevos = tareas.map((t) => t.id);
  const idsABorrar = (existentes ?? [])
    .map((r) => r.id as string)
    .filter((id) => !idsNuevos.includes(id));

  if (idsABorrar.length > 0) {
    const { error: errorDelete } = await supabase.from("tareas").delete().in("id", idsABorrar);
    if (errorDelete) {
      logError("Error al borrar tareas viejas", errorDelete);
      return false;
    }
  }

  if (tareas.length > 0) {
    const filas = tareas.map((t) => ({
      id: t.id,
      user_id: user.id,
      fecha,
      titulo: t.titulo,
      completada: t.completada,
      prioridad: t.prioridad,
      avisar: t.avisar ?? false,
      hora_aviso: t.horaAviso ?? null,
      notification_id: t.notificationId ?? null,
    }));

    const { error: errorUpsert } = await supabase.from("tareas").upsert(filas);
    if (errorUpsert) {
      logError("Error al guardar tareas", errorUpsert);
      return false;
    }
  }

  return true;
}

export const COLORES_PRIORIDAD: Record<Prioridad, string> = {
  alta: "#EF4444",
  media: "#F59E0B",
  baja: "#10B981",
};
