import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Trash2, Mic } from "lucide-react-native";
import { obtenerNota, guardarNota, eliminarNota } from "../../lib/notas";

export default function NotaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [creada, setCreada] = useState<string>(new Date().toISOString());
  const cargada = useRef(false);

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

  // Guarda automáticamente al salir de la pantalla (si quedó vacía, la borra)
  useEffect(() => {
    return () => {
      if (!cargada.current) return;
      if (!titulo.trim() && !contenido.trim()) {
        eliminarNota(id!);
        return;
      }
      guardarNota({
        id: id!,
        titulo: titulo.trim() || contenido.trim().slice(0, 30),
        contenido,
        actualizada: new Date().toISOString(),
      });
    };
  }, [id, titulo, contenido]);

  const eliminar = async () => {
    await eliminarNota(id!);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          <TouchableOpacity onPress={() => router.back()}>
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

        {/* TODO: dictado por voz — pendiente de armar el dev client (expo-speech-recognition no anda en Expo Go) */}
        <TouchableOpacity
          disabled
          style={{
            alignSelf: "flex-end", width: 44, height: 44, borderRadius: 22,
            backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center", opacity: 0.6,
          }}
        >
          <Mic size={20} color="#7C3AED" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}