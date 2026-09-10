import { View, Text, TouchableOpacity } from "react-native";
import { useState, useEffect, useRef } from "react";

export default function PomodoroScreen() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [vueltas, setVueltas] = useState<{ vuelta: number; hora: string; total: string }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const format = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `00:${m}:${ss}`;
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 0) { setRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handlePlayPause = () => {
    if (!running) startTimeRef.current = Date.now();
    setRunning(!running);
  };

  const handleStop = () => {
    setRunning(false);
    if (vueltas.length < 10) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setVueltas(v => [...v, {
        vuelta: v.length + 1,
        hora: format(elapsed),
        total: format(elapsed),
      }]);
    }
    setSeconds(25 * 60);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#B6C3F2", padding: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1a1a1a" }}>Pomodoro</Text>
        <TouchableOpacity>
          <Text style={{ fontSize: 24, color: "#7C3AED" }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Timer circular */}
      <View style={{ alignItems: "center", marginTop: 40 }}>
        <View style={{
          width: 200, height: 200, borderRadius: 100,
          borderWidth: 6, borderColor: "#7C3AED",
          backgroundColor: "#FFFFFF",
          alignItems: "center", justifyContent: "center"
        }}>
          <Text style={{ fontSize: 36, fontWeight: "bold", color: "#1a1a1a" }}>{format(seconds)}</Text>
        </View>

        {/* Botones pausa/stop */}
        <View style={{ flexDirection: "row", gap: 20, marginTop: 20 }}>
          <TouchableOpacity onPress={handlePlayPause} style={{
            width: 50, height: 50, borderRadius: 25,
            borderWidth: 2, borderColor: "#7C3AED",
            alignItems: "center", justifyContent: "center"
          }}>
            <Text style={{ fontSize: 20 }}>{running ? "⏸" : "▶"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStop} style={{
            width: 50, height: 50, borderRadius: 25,
            borderWidth: 2, borderColor: "#7C3AED",
            alignItems: "center", justifyContent: "center"
          }}>
            <Text style={{ fontSize: 20 }}>⏹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabla de vueltas */}
      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginTop: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontWeight: "bold", color: "#9CA3AF", flex: 1 }}>vuelta</Text>
          <Text style={{ fontWeight: "bold", color: "#9CA3AF", flex: 1, textAlign: "center" }}>Hora</Text>
          <Text style={{ fontWeight: "bold", color: "#9CA3AF", flex: 1, textAlign: "right" }}>Total</Text>
        </View>
        {vueltas.map(v => (
          <View key={v.vuelta} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
            <Text style={{ flex: 1, color: "#1a1a1a" }}>{v.vuelta}</Text>
            <Text style={{ flex: 1, textAlign: "center", color: "#1a1a1a" }}>{v.hora}</Text>
            <Text style={{ flex: 1, textAlign: "right", color: "#1a1a1a" }}>{v.total}</Text>
          </View>
        ))}
      </View>

      {/* Botón Play */}
      <TouchableOpacity onPress={handlePlayPause} style={{
        backgroundColor: "#7C3AED", borderRadius: 12,
        padding: 16, alignItems: "center", marginTop: 16
      }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }}>▶ Play</Text>
      </TouchableOpacity>

      {/* Botones Nota y Grabar */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
        <TouchableOpacity style={{
          flex: 1, backgroundColor: "#7C3AED", borderRadius: 12,
          padding: 14, alignItems: "center"
        }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Nota</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{
          flex: 1, backgroundColor: "#7C3AED", borderRadius: 12,
          padding: 14, alignItems: "center"
        }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Grabar audio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}