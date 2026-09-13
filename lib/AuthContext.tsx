// lib/AuthContext.tsx
// Contexto global de sesión — expone la sesión activa de Supabase
// a toda la app (perfil.tsx, cuenta.tsx, etc.) sin volver a pedirla.
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  session: Session | null;
  cargando: boolean; // true mientras se resuelve la sesión inicial (splash)
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  cargando: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Sesión guardada en AsyncStorage (persistSession: true en supabase.ts)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    // Se dispara en login, logout, refresh de token, y luego de verifyOtp
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

// Uso: const { session, cargando } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
