// ============================================================
// lib/seguridad.ts — Validaciones y seguridad centralizadas
// ============================================================

// ── Expresiones regulares ────────────────────────────────────
const REGEX_EMAIL = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Mínimo 8 chars, al menos 1 mayúscula, 1 minúscula, 1 número, 1 símbolo
const REGEX_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,64}$/;

// Solo letras y espacios (incluye acentos y ñ)
const REGEX_NOMBRE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{2,60}$/;

// ── Validadores individuales ─────────────────────────────────
export function validarEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "El correo es obligatorio.";
  if (!REGEX_EMAIL.test(v)) return "El correo no tiene un formato válido.";
  return null;
}

export function validarPassword(password: string): string | null {
  if (!password) return "La contraseña es obligatoria.";
  if (password.length < 8) return "Mínimo 8 caracteres.";
  if (password.length > 64) return "Máximo 64 caracteres.";
  if (!/[A-Z]/.test(password)) return "Debe incluir al menos una mayúscula.";
  if (!/[a-z]/.test(password)) return "Debe incluir al menos una minúscula.";
  if (!/\d/.test(password)) return "Debe incluir al menos un número.";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    return "Debe incluir al menos un símbolo (!@#$%...).";
  return null;
}

export function validarPasswordMatch(a: string, b: string): string | null {
  if (!b) return "Repetí la contraseña.";
  if (a !== b) return "Las contraseñas no coinciden.";
  return null;
}

export function validarCodigo(codigo: string): string | null {
  const v = codigo.trim();
  if (!v) return "Ingresá el código que te enviamos por correo.";
  if (!/^\d{6,10}$/.test(v)) return "El código no es válido.";
  return null;
}

export function validarNombre(nombre: string): string | null {
  const v = nombre.trim();
  if (!v) return "El nombre es obligatorio.";
  if (!REGEX_NOMBRE.test(v))
    return "Solo letras y espacios, entre 2 y 60 caracteres.";
  return null;
}

// ── Sanitización de inputs ───────────────────────────────────
// Elimina caracteres peligrosos para evitar inyecciones
export function sanitizar(texto: string): string {
  return texto
    .replace(/[<>]/g, "")          // XSS básico
    .replace(/['"`;]/g, "")        // SQL injection básico
    .trim();
}

// ── Fortaleza de contraseña ──────────────────────────────────
export type NivelFortaleza = "vacía" | "débil" | "media" | "fuerte" | "muy fuerte";

export function fortalezaPassword(password: string): {
  nivel: NivelFortaleza;
  porcentaje: number;
  color: string;
} {
  if (!password) return { nivel: "vacía", porcentaje: 0, color: "#DDD" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;

  if (score <= 1) return { nivel: "débil",     porcentaje: 20,  color: "#EF4444" };
  if (score <= 2) return { nivel: "débil",     porcentaje: 35,  color: "#EF4444" };
  if (score <= 3) return { nivel: "media",     porcentaje: 55,  color: "#F59E0B" };
  if (score <= 4) return { nivel: "fuerte",    porcentaje: 75,  color: "#10B981" };
  return           { nivel: "muy fuerte", porcentaje: 100, color: "#7C3AED" };
}

// ── Rate limiting en cliente ─────────────────────────────────
// Previene ataques de fuerza bruta desde la UI
const intentos: Record<string, { count: number; primerIntento: number }> = {};
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000; // 15 minutos
const BLOQUEO_MS = 30 * 60 * 1000; // 30 minutos

export function registrarIntento(clave: string): {
  bloqueado: boolean;
  intentosRestantes: number;
  msRestantes: number;
} {
  const ahora = Date.now();
  if (!intentos[clave]) {
    intentos[clave] = { count: 1, primerIntento: ahora };
    return { bloqueado: false, intentosRestantes: MAX_INTENTOS - 1, msRestantes: 0 };
  }

  const entry = intentos[clave];

  // Reset si pasó la ventana
  if (ahora - entry.primerIntento > VENTANA_MS) {
    intentos[clave] = { count: 1, primerIntento: ahora };
    return { bloqueado: false, intentosRestantes: MAX_INTENTOS - 1, msRestantes: 0 };
  }

  entry.count++;

  if (entry.count > MAX_INTENTOS) {
    const msRestantes = BLOQUEO_MS - (ahora - entry.primerIntento);
    return { bloqueado: true, intentosRestantes: 0, msRestantes: Math.max(0, msRestantes) };
  }

  return {
    bloqueado: false,
    intentosRestantes: MAX_INTENTOS - entry.count,
    msRestantes: 0,
  };
}

export function resetearIntentos(clave: string): void {
  delete intentos[clave];
}

export function formatearTiempoBloqueo(ms: number): string {
  const minutos = Math.ceil(ms / 60000);
  return `${minutos} min`;
}
