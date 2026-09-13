import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus, Trash2, StickyNote } from "lucide-react-native";
import { Nota, obtenerNotas, eliminarNota } from "../lib/notas";

export default function NotasScreen() {
  const router = useRouter();
  const [notas, setNotas] = useState<Nota[]>([]);

  useFocusEffect(
    useCallback(() => {
      obtenerNotas().then(n => {
        setNotas([...n].sort((a, b) => b.actualizada.localeCompare(a.actualizada)));
      });
    }, [])
  );

  const nuevaNota = () => {
    const id = Date.now().toString();
    router.push(`/nota/${id}`);
  };

  const borrarNota = async (id: string) => {
    await eliminarNota(id);
    setNotas(n => n.filter(nn => nn.id !== id));
  };

  const formatearFecha = (iso: string) => {
    const f = new Date(iso);
    return f.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) + " · " +
      f.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 20, color: "#7C3AED" }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a1a" }}>Notas</Text>
        <TouchableOpacity onPress={nuevaNota}>
          <Plus size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
        {notas.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <StickyNote size={32} color="#7C3AED" />
            <Text style={{ color: "#374151", marginTop: 12, textAlign: "center" }}>
              Todavía no tenés notas.{"\n"}Tocá + para crear la primera.
            </Text>
          </View>
        ) : (
          notas.map(n => (
            <TouchableOpacity
              key={n.id}
              onPress={() => router.push(`/nota/${n.id}`)}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, marginBottom: 10,
                flexDirection: "row", alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: 15 }} numberOfLines={1}>
                  {n.titulo || "Nota sin título"}
                </Text>
                {!!n.contenido && (
                  <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                    {n.contenido}
                  </Text>
                )}
                <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 4 }}>
                  {formatearFecha(n.actualizada)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => borrarNota(n.id)} style={{ padding: 6 }}>
                <Trash2 size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}