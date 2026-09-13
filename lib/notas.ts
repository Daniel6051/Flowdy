import AsyncStorage from "@react-native-async-storage/async-storage";

export type Nota = {
  id: string;
  titulo: string;
  contenido: string;
  actualizada: string; // ISO date string
};

const CLAVE = "notas";

export async function obtenerNotas(): Promise<Nota[]> {
  try {
    const json = await AsyncStorage.getItem(CLAVE);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function guardarNotas(notas: Nota[]) {
  await AsyncStorage.setItem(CLAVE, JSON.stringify(notas));
}

export async function obtenerNota(id: string): Promise<Nota | null> {
  const notas = await obtenerNotas();
  return notas.find(n => n.id === id) ?? null;
}

export async function guardarNota(nota: Nota) {
  const notas = await obtenerNotas();
  const indice = notas.findIndex(n => n.id === nota.id);
  if (indice >= 0) notas[indice] = nota;
  else notas.unshift(nota);
  await guardarNotas(notas);
}

export async function eliminarNota(id: string) {
  const notas = await obtenerNotas();
  await guardarNotas(notas.filter(n => n.id !== id));
}