import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { Slot } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Poppins_700Bold } from "@expo-google-fonts/poppins";
import { AuthProvider } from "../lib/AuthContext";
import { IdiomaProvider } from "../lib/idioma";

SplashScreen.preventAutoHideAsync();

// Nunito queda como tipografía default de TODA la app, una sola vez acá.
// @ts-ignore — defaultProps existe en runtime aunque los tipos de RN no lo declaren
Text.defaultProps = Text.defaultProps || {};
// @ts-ignore
Text.defaultProps.style = [{ fontFamily: "Nunito_400Regular" }, Text.defaultProps.style];
// @ts-ignore
TextInput.defaultProps = TextInput.defaultProps || {};
// @ts-ignore
TextInput.defaultProps.style = [{ fontFamily: "Nunito_400Regular" }, TextInput.defaultProps.style];

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // AuthProvider se monta siempre, aunque las fuentes no hayan cargado todavía:
  // así supabase.auth.getSession() arranca en paralelo con useFonts en vez de
  // esperar a que termine la carga de tipografías (antes eran dos esperas en cadena).
  return (
    <IdiomaProvider>
      <AuthProvider>
        {fontsLoaded ? <Slot /> : null}
      </AuthProvider>
    </IdiomaProvider>
  );
}