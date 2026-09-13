// ============================================================
// components/CaptchaVisual.tsx
// Verificación humana visual para Expo Go.
// TODO (EAS Build): reemplazar por hCaptcha real:
//   import HCaptcha from '@hcaptcha/react-native-hcaptcha';
//   <HCaptcha siteKey="TU_SITE_KEY" onMessage={onCaptchaEvent} />
// ============================================================

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { ShieldCheck, RefreshCw } from "lucide-react-native";

// Operaciones aritméticas simples como desafío cognitivo
function generarDesafio(): { pregunta: string; respuesta: number } {
  const ops = [
    { a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1, op: "+" },
    { a: Math.floor(Math.random() * 9) + 5, b: Math.floor(Math.random() * 4) + 1, op: "-" },
    { a: Math.floor(Math.random() * 5) + 2, b: Math.floor(Math.random() * 4) + 2, op: "×" },
  ];
  const elegido = ops[Math.floor(Math.random() * ops.length)];
  let respuesta: number;
  if (elegido.op === "+") respuesta = elegido.a + elegido.b;
  else if (elegido.op === "-") respuesta = elegido.a - elegido.b;
  else respuesta = elegido.a * elegido.b;

  // Generar opciones de respuesta (correcta + 3 distractores)
  return { pregunta: `¿Cuánto es ${elegido.a} ${elegido.op} ${elegido.b}?`, respuesta };
}

function generarOpciones(correcta: number): number[] {
  const set = new Set<number>([correcta]);
  while (set.size < 4) {
    const offset = Math.floor(Math.random() * 7) - 3;
    const candidato = correcta + offset;
    if (candidato !== correcta && candidato >= 0) set.add(candidato);
  }
  return [...set].sort(() => Math.random() - 0.5);
}

interface Props {
  onVerificado: (ok: boolean) => void;
  verificado: boolean;
}

export default function CaptchaVisual({ onVerificado, verificado }: Props) {
  const [desafio, setDesafio] = useState(generarDesafio());
  const [opciones, setOpciones] = useState<number[]>([]);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const shake = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setOpciones(generarOpciones(desafio.respuesta));
  }, [desafio]);

  const animarError = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleOpcion = (opcion: number) => {
    if (verificado) return;
    setSeleccionada(opcion);
    if (opcion === desafio.respuesta) {
      setError(false);
      onVerificado(true);
    } else {
      setError(true);
      animarError();
      onVerificado(false);
      setTimeout(() => {
        renovar();
      }, 900);
    }
  };

  const renovar = () => {
    const nuevo = generarDesafio();
    setDesafio(nuevo);
    setOpciones(generarOpciones(nuevo.respuesta));
    setSeleccionada(null);
    setError(false);
    onVerificado(false);
  };

  if (verificado) {
    return (
      <View style={styles.verificadoRow}>
        <ShieldCheck size={20} color="#10B981" />
        <Text style={styles.verificadoText}>Verificación completada</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shake }] }]}>
      <View style={styles.header}>
        <Text style={styles.label}>Verificación de seguridad</Text>
        <TouchableOpacity onPress={renovar} style={styles.refresh}>
          <RefreshCw size={14} color="#888" />
        </TouchableOpacity>
      </View>

      <Text style={styles.pregunta}>{desafio.pregunta}</Text>

      <View style={styles.opciones}>
        {opciones.map((op) => {
          const esCorrecta = op === desafio.respuesta;
          const esSeleccionada = op === seleccionada;
          return (
            <TouchableOpacity
              key={op}
              style={[
                styles.opcion,
                esSeleccionada && esCorrecta && styles.opcionCorrecta,
                esSeleccionada && !esCorrecta && styles.opcionIncorrecta,
              ]}
              onPress={() => handleOpcion(op)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.opcionText,
                  esSeleccionada && styles.opcionTextSeleccionada,
                ]}
              >
                {op}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && (
        <Text style={styles.errorText}>Respuesta incorrecta, intentá de nuevo.</Text>
      )}

      {/* TODO (EAS Build): activar hCaptcha real
      <HCaptcha
        siteKey="TU_HCAPTCHA_SITE_KEY"
        baseUrl="https://hcaptcha.com"
        onMessage={(e) => {
          if (e.nativeEvent.data === 'success') onVerificado(true);
        }}
      /> */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F7FF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0D9F7",
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refresh: {
    padding: 4,
  },
  pregunta: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a2e",
    textAlign: "center",
  },
  opciones: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  opcion: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#DDD",
    paddingVertical: 10,
    alignItems: "center",
  },
  opcionCorrecta: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  opcionIncorrecta: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  opcionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
  },
  opcionTextSeleccionada: {
    color: "#1a1a2e",
  },
  verificadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D1FAE5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  verificadoText: {
    color: "#065F46",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    textAlign: "center",
  },
});
