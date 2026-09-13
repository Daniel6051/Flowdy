# ⚡ Flowdy

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_57-4630EB?style=for-the-badge&logo=expo&logoColor=white" alt="Expo SDK 57" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Resend-Email_SMTP-black?style=for-the-badge&logo=resend&logoColor=white" alt="Resend" />
</p>

> **Flowdy** es una aplicación móvil de productividad y organización pensada por y para estudiantes. Integra técnicas de concentración (Pomodoro), gestión de tareas diarias, planificación horaria, toma de notas rápidas y notas de voz interactivas.

---

## 📱 Capturas / Vista Previa

*(Próximamente capturas de pantalla de la app)*

---

## ✨ Características Principales

- ⏱️ **Temporizador Pomodoro:** Modos de concentración configurables, seguimiento de vueltas, control de estado y accesos directos rápidos hacia notas y grabadora.
- 📅 **Calendario & Plan del Día:** Planificación visual por bloques horarios, selector mensual interactivo y vistas detalladas por fecha.
- ✅ **Gestión de Tareas & Recordatorios:** Checklists diarios con priorización y soporte para programación de avisos por hora.
- 🎙️ **Grabadora de Audio Avanzada:** Captura de audios de clase y apuntes con feedback visual reactivo a los decibelios del micrófono y reproductor integrado.
- 📝 **Bloc de Notas:** Creación y edición ágil con autoguardado para apuntes de estudio.
- 🔐 **Autenticación Robusta:** Registro, inicio de sesión y recuperación de clave vía código OTP por correo electrónico con persistencia global de sesión.
- 🛡️ **Seguridad Integrada:** Sanitización de entradas, limitador de intentos (rate limiting) y captcha visual interactivo.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework Móvil** | [React Native](https://reactnative.dev/) con [Expo](https://expo.dev/) (SDK 57) |
| **Enrutamiento** | [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) |
| **Backend & Base de Datos** | [Supabase](https://supabase.com/) (Autenticación y almacenamiento) |
| **Correos Transaccionales** | [Resend](https://resend.com/) (SMTP Custom integrado en Supabase) |
| **Manejo de Audio** | `expo-audio` (SDK 57) |
| **Animaciones & UI** | `react-native-reanimated` (v4) + `lucide-react-native` |
| **Almacenamiento Local** | `@react-native-async-storage/async-storage` |

---

## 📂 Estructura del Proyecto

```bash
Flowdy/
├── app/
│   ├── (tabs)/              # Navegación principal (Pomodoro, Calendario, Tareas, Cuenta)
│   ├── auth/                # Pantallas de Login, Registro y Recuperación OTP
│   ├── nota/                # Vista y editor individual de notas
│   ├── grabadora-activa.tsx # Captura de audio con visualizador de ondas
│   ├── grabadora.tsx        # Galería y reproductor de audios
│   ├── notas.tsx            # Listado de notas
│   ├── perfil.tsx           # Panel de usuario conectado a Supabase
│   ├── plan-del-dia.tsx     # Timeline de bloques de estudio
│   └── recordatorios.tsx    # Gestión de alarmas y avisos diarios
├── components/              # Componentes reusables (Inputs seguros, Captcha, Indicadores)
├── lib/                     # Clientes API, contextos globales (AuthContext) y utilidades
└── assets/                  # Fuentes, íconos y gráficos
