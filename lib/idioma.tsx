// lib/idioma.tsx
// Contexto global de idioma — traducción básica por diccionario (no traducción
// automática vía API: es instantáneo, gratis, y no depende de conexión).
// Para sumar más pantallas al idioma, agregar las claves acá en "traducciones"
// y usar t("clave") en el componente en vez del texto fijo.
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Idioma = "es" | "en";

const CLAVE_IDIOMA_STORAGE = "@flowdy_idioma";

const traducciones = {
  es: {
    configuracion: "Configuración",
    mi_cuenta: "Mi cuenta",
    mi_cuenta_desc: "Perfil y datos personales",
    permisos: "Permisos",
    permisos_desc: "Notificaciones y accesos",
    pomodoro_config: "Pomodoro config",
    pomodoro_config_desc: "Tiempos y descansos por defecto",
    idioma: "Idioma",
    conectar_musica: "Conectar música",
    conectar_musica_desc: "Spotify y otras apps",
    elegir_idioma: "Elegir idioma",
    espanol: "Español",
    ingles: "Inglés",
    listo: "Listo",
  },
  en: {
    configuracion: "Settings",
    mi_cuenta: "My account",
    mi_cuenta_desc: "Profile and personal data",
    permisos: "Permissions",
    permisos_desc: "Notifications and access",
    pomodoro_config: "Pomodoro settings",
    pomodoro_config_desc: "Default focus and break times",
    idioma: "Language",
    conectar_musica: "Connect music",
    conectar_musica_desc: "Spotify and other apps",
    elegir_idioma: "Choose language",
    espanol: "Spanish",
    ingles: "English",
    listo: "Done",
  },
} as const;

type ClaveTexto = keyof typeof traducciones["es"];

type IdiomaContextType = {
  idioma: Idioma;
  cambiarIdioma: (nuevo: Idioma) => void;
  t: (clave: ClaveTexto) => string;
};

const IdiomaContext = createContext<IdiomaContextType>({
  idioma: "es",
  cambiarIdioma: () => {},
  t: (clave) => traducciones.es[clave],
});

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>("es");

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_IDIOMA_STORAGE).then((guardado) => {
      if (guardado === "es" || guardado === "en") setIdioma(guardado);
    });
  }, []);

  const cambiarIdioma = (nuevo: Idioma) => {
    setIdioma(nuevo);
    AsyncStorage.setItem(CLAVE_IDIOMA_STORAGE, nuevo).catch(() => {});
  };

  const t = (clave: ClaveTexto) => traducciones[idioma][clave];

  return (
    <IdiomaContext.Provider value={{ idioma, cambiarIdioma, t }}>
      {children}
    </IdiomaContext.Provider>
  );
}

// Uso: const { idioma, cambiarIdioma, t } = useIdioma();
export function useIdioma() {
  return useContext(IdiomaContext);
}
