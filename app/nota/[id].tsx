import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Trash2, Mic, Square } from "lucide-react-native";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { obtenerNota, guardarNota, eliminarNota } from "../../lib/notas";

export default function NotaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [creada, setCreada] = useState<string>(new Date().toISOString());
  const [escuchando, setEscuchando] = useState(false);
  const cargada = useRef(false);

  // refs para poder leer el valor MAS RECIENTE dentro de guardarYSalir
  // sin depender de closures viejas del useEffect
  const tituloRef = useRef("");
  const contenidoRef = useRef("");
  tituloRef.current = titulo;
  contenidoRef.current = contenido;

  // Texto ya "cerrado": lo que había antes de dictar + cada segmento que el
  // reconocedor ya dio por final. Se va actualizando con cada resultado final,
  // así una pausa entre frases no borra lo dicho antes de la pausa.
  const textoAcumulado = useRef("");

  useEffect(() => {
    obtenerNota(id!).then(n => {
      if (n) {
        setTitulo(n.titulo);
        setContenido(n.contenido);
        setCreada(n.actualizada);
      }
      cargada.current = true;
    });
  }, [id]);

  // --- Dictado por voz ---

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    const separador = textoAcumulado.current.trim().length > 0 ? " " : "";
    const combinado = textoAcumulado.current + separador + transcript;
    setContenido(combinado);
    // Solo cuando el segmento actual está confirmado (isFinal) lo sumamos de
    // forma permanente al acumulado. Así, si después hay una pausa y arranca
    // un segmento nuevo, no se pisa lo que ya se dijo antes de la pausa.
    if (event.isFinal) {
      textoAcumulado.current = combinado;
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setEscuchando(false);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.log("Error de reconocimiento de voz:", event.error, event.message);
    setEscuchando(false);
  });

  const alternarDictado = async () => {
    if (escuchando) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    const permiso = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permiso.granted) {
      console.log("Permiso de reconocimiento de voz denegado");
      return;
    }

    textoAcumulado.current = contenidoRef.current;
    setEscuchando(true);
    ExpoSpeechRecognitionModule.start({
      lang: "es-AR",
      interimResults: true,
      continuous: true,
    });
  };

  // --- Guardar / eliminar ---

  const guardarYSalir = useCallback(async () => {
    if (escuchando) ExpoSpeechRecognitionModule.stop();
    if (!cargada.current) {
      router.back();
      return;
    }
    const t = tituloRef.current;
    const c = contenidoRef.current;

    if (!t.trim() && !c.trim()) {
      await eliminarNota(id!);
    } else {
      await guardarNota({
        id: id!,
        titulo: t.trim() || c.trim().slice(0, 30),
        contenido: c,
        actualizada: new Date().toISOString(),
      });
    }
    router.back();
  }, [id, escuchando]);

  const eliminar = async () => {
    if (escuchando) ExpoSpeechRecognitionModule.stop();
    await eliminarNota(id!);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          <TouchableOpacity onPress={guardarYSalir}>
            <Text style={{ fontSize: 20, color: "#7C3AED" }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: "#4B5563" }}>
            {new Date(creada).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
          <TouchableOpacity onPress={eliminar}>
            <Trash2 size={20} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        <TextInput
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Título"
          placeholderTextColor="#6B7280"
          style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a1a", marginTop: 16 }}
        />

        <TextInput
          value={contenido}
          onChangeText={setContenido}
          placeholder="Escribí algo..."
          placeholderTextColor="#6B7280"
          multiline
          style={{ flex: 1, fontSize: 15, color: "#1a1a1a", marginTop: 12, textAlignVertical: "top" }}
        />

        {escuchando && (
          <Text style={{ color: "#7C3AED", fontSize: 12, marginBottom: 8, textAlign: "right" }}>
            Escuchando...
          </Text>
        )}

        <TouchableOpacity
          onPress={alternarDictado}
          style={{
            alignSelf: "flex-end", width: 44, height: 44, borderRadius: 22,
            backgroundColor: escuchando ? "#7C3AED" : "#EDE9FE",
            alignItems: "center", justifyContent: "center",
          }}
        >
          {escuchando
            ? <Square size={18} color="#FFFFFF" />
            : <Mic size={20} color="#7C3AED" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
