📋 CONTEXTO COMPLETO — FLOWDY (actualizado 12 sept 2026 — sesión Auth+Supabase)

🎯 La app

Flowdy — app mobile de productividad para estudiantes: Pomodoro configurable, notas con dictado por voz (pendiente), grabadora de audio, calendario + Plan del Día, tareas diarias con avisos, recordatorios, perfil/configuración/auth.

🛠️ Stack

| Item | Detalle |
|---|---|
| Framework | React Native + Expo SDK 57 |
| Navegación | expo-router |
| Lenguaje | TypeScript |
| Base de datos | Supabase — **Auth conectado y funcionando**. Resto de las tablas (plan del día, tareas, notas, grabaciones, recordatorios) todavía en AsyncStorage, pendiente migrar |
| Persistencia local actual | AsyncStorage (Plan del Día, Tareas, Notas, Grabaciones, Recordatorios) |
| Auth | Supabase Auth — email/password real. Sesión persistida con AsyncStorage vía `lib/AuthContext.tsx` |
| Envío de mails (Auth) | Resend, conectado como SMTP custom de Supabase. Usando dominio de pruebas `onboarding@resend.dev` (solo entrega a la casilla del dueño de la cuenta Resend: celedondaniel21@gmail.com). **Falta comprar y verificar un dominio propio antes de producción** |
| Audio | expo-audio (SDK 57). **No usar expo-av**: en Expo Go falta el nativo `ExponentAV` |
| Notificaciones | expo-notifications instalado. **En Expo Go Android no se puede usar**: crashea por push remoto (sacado en SDK 53). Los avisos de sistema quedan para EAS / dev client |
| Animaciones | react-native-reanimated 4.5.1 + react-native-worklets |
| Íconos | lucide-react-native |
| Transcripción futura | Whisper API (OpenAI) — pendiente |
| Emails transaccionales futuros | Resend (mismo proveedor que ya conectamos para Auth — reutilizable) — pendiente para otras notificaciones |
| Backend futuro | Node.js + Apollo + Railway |
| Editor | Cursor |
| Repo | Daniel6051/Flowdy |
| Corriendo con | Expo Go en Android Studio (Pixel 6, SDK 57) — no dev client propio |

💻 Entorno

- Ubicación: `C:\Users\celed\Desktop\Flowdy`
- Correr: `cd C:\Users\celed\Desktop\Flowdy` → `$env:NODE_TLS_REJECT_UNAUTHORIZED=0; npx expo start --clear` → tecla `a`
- Instalar siempre con `--legacy-peer-deps`
- `.env` con keys de Supabase — nunca subir a GitHub
- "Flowdy2" en el Desktop es proyecto de prueba, ignorar
- Proyecto de Supabase: "Flowdy" (plan Free), región São Paulo (sa-east-1)
- Cuenta de Resend: registrada con celedondaniel21@gmail.com

🎨 Colores

Primary `#7C3AED` · Background `#B6C3F2` · White `#FFFFFF`

📁 Estructura actual

```
Flowdy/
├── app/
│   ├── _layout.tsx (Slot envuelto en AuthProvider) ✅
│   ├── plan-del-dia.tsx ✅
│   ├── recordatorios.tsx ✅ (tareas del día + avisos extra)
│   ├── notas.tsx ✅
│   ├── grabadora.tsx ✅ (lista + reproducción)
│   ├── grabadora-activa.tsx ✅ (grabar / pausar / guardar)
│   ├── configuracion.tsx ✅
│   ├── perfil.tsx ✅ CONECTADO a Supabase (nombre/email reales vía useAuth(), botón Cerrar sesión funcional, Eliminar cuenta con TODO documentado — requiere Edge Function)
│   ├── nota/
│   │   └── [id].tsx ✅
│   ├── auth/
│   │   ├── login.tsx ✅ CONECTADO — signInWithPassword real
│   │   ├── registro.tsx ✅ CONECTADO — signUp real, guarda nombre en user_metadata
│   │   └── recuperar.tsx ✅ CONECTADO — flujo OTP de 6-10 dígitos (resetPasswordForEmail + verifyOtp + updateUser)
│   └── (tabs)/
│       ├── _layout.tsx (4 tabs)
│       ├── index.tsx ✅ Pomodoro (Nota → /notas, Grabar audio → /grabadora)
│       ├── calendario.tsx ✅ (Recordatorios y Agregar audios conectados)
│       ├── tareas.tsx ✅
│       └── cuenta.tsx ✅
├── lib/
│   ├── supabase.ts ✅ (cliente inicializado, persistSession con AsyncStorage)
│   ├── AuthContext.tsx ✅ NUEVO — contexto global de sesión (useAuth), envuelve toda la app desde _layout.tsx
│   ├── planDelDia.ts ✅ (AsyncStorage, pendiente migrar a Supabase)
│   ├── tareas.tsx ✅ (incluye avisar, horaAviso, notificationId — AsyncStorage, pendiente migrar)
│   ├── notas.ts ✅ (AsyncStorage, pendiente migrar)
│   ├── grabaciones.ts ✅ (AsyncStorage, pendiente migrar)
│   ├── recordatorios.ts ✅ (no importar expo-notifications en Expo Go — AsyncStorage, pendiente migrar)
│   └── seguridad.ts ✅ (incluye validarCodigo para el OTP de recuperar contraseña)
├── components/
│   ├── InputSeguro.tsx ✅
│   ├── FortalezaPassword.tsx ✅
│   └── CaptchaVisual.tsx ✅ (matemático ahora, TODO hCaptcha en EAS Build)
└── .env
```

✅ Lo que ya está (incluye lo de esta etapa)

**Auth conectado a Supabase — COMPLETO:**
- **Login** (`login.tsx`): `signInWithPassword` real. Rate limiting en cliente (5 intentos → bloqueo 30 min) + captcha visual siguen intactos. Redirige a `/perfil` si funciona.
- **Registro** (`registro.tsx`): `signUp` real. El nombre se guarda en `user_metadata.nombre` (no hay tabla `profiles` todavía — no hace falta mientras solo se use dentro de la app). Maneja el caso "email ya registrado" con mensaje específico.
- **Recuperar contraseña** (`recuperar.tsx`): flujo por **código OTP de 6 a 10 dígitos** enviado por mail (no por link, para evitar deep linking en Expo Go). Paso 1: `resetPasswordForEmail` (siempre avanza al paso 2 sin filtrar si el mail existe, por seguridad). Paso 2: nuevo campo "Código de verificación" + `verifyOtp({ type: "recovery" })` + `updateUser({ password })`. Paso 3: pantalla de éxito.
  - ⚠️ El largo del código que manda esta instancia de Supabase resultó ser variable (se vio un caso de 8 dígitos, no los 6 "default" de la documentación) — el validador y el input se ajustaron para aceptar 6-10 dígitos en vez de un largo fijo.
- **`lib/AuthContext.tsx`** (nuevo): expone `useAuth()` → `{ session, cargando }` a toda la app, con `onAuthStateChange` para mantenerse sincronizado. Envuelto en `_layout.tsx`.
- **Perfil** (`perfil.tsx`): nombre y email reales desde la sesión (`session.user.user_metadata.nombre`, `session.user.email`). Redirige a `/auth/login` si no hay sesión. Botón **"Cerrar sesión"** nuevo y funcional (`supabase.auth.signOut()`). Racha y Plan siguen hardcodeados (7 días / Gratuito) — es otra feature, no forma parte de auth. "Eliminar cuenta" tiene el flujo de confirmación pero la eliminación real queda pendiente (ver sección de pendientes, requiere Edge Function).

**Infraestructura de mail (Resend + Supabase SMTP) — COMPLETO para desarrollo:**
- SMTP custom activado en Supabase (Authentication → Emails → SMTP Settings).
- Sender: `onboarding@resend.dev` (dominio de pruebas de Resend, no requiere verificación DNS).
- Host `smtp.resend.com`, puerto `465`, username `resend` (literal), password = API Key de Resend.
- Template de "Reset password" en Supabase editado para incluir `{{ .Token }}` además del link `{{ .ConfirmationURL }}`.
- **Limitación actual:** con el dominio de pruebas, Resend solo entrega mails a la casilla dueña de la cuenta de Resend (celedondaniel21@gmail.com). Para que le llegue a cualquier usuario real de Flowdy hace falta comprar y verificar un dominio propio en Resend (ver pendientes).
- Se intentó usar `flowdy.com` como dominio propio pero no está comprado/registrado por Daniel — quedó descartado por ahora.

**Todo lo demás sigue igual que antes de esta sesión:**

Pomodoro — timer circular, modal duración, reset/bandera/música, tabla vueltas, **Nota** abre `/notas`, **Grabar audio** abre `/grabadora`.

Calendario — grid mensual animado, puntito tareas, preview Plan del Día. Botones: **Recordatorios** → `/recordatorios` con `dia/mes/anio`, **Plan del día** con fecha, **Agregar audios** → `/grabadora`.

Plan del Día — línea de tiempo, modal agregar evento, persiste por fecha (AsyncStorage).

Tareas — título + checkbox + prioridad, persiste por fecha (AsyncStorage). Campos extra para aviso: `avisar`, `horaAviso`, `notificationId`.

Notas — lista + detalle/edición, autoguardado, micrófono deshabilitado (pendiente dictado).

Grabadora — lista de audios, play/pause, no loopea al terminar, botón volver, FAB para grabar nueva. Reproduce con `expo-audio` (modo parlante, espera a que cargue el archivo).

Grabadora activa — permiso de mic, grabar/pausar/detener/guardar, círculos morados se agrandan con el nivel de voz (`isMeteringEnabled`). Audios en directorio `document`.

Recordatorios — pantalla del día elegido. Sección **Tareas de este día** con switch por tarea (activar/desactivar aviso) y hora tocable. Sección **Otros avisos** con + para crear uno suelto. En Expo Go se guardan pero **no hay notificación del sistema** (banner violeta).

Cuenta / Configuración — igual que antes. Cuenta actúa como entrypoint a login/registro/recuperar (ya conectados).

🔐 Seguridad implementada

`lib/seguridad.ts`: regex email/password/nombre, sanitización XSS+SQL, rate limiting (5 intentos → bloqueo 30 min), fortaleza de contraseña, **validarCodigo** nuevo (acepta 6-10 dígitos numéricos, para el OTP de recuperar contraseña).

InputSeguro, FortalezaPassword, CaptchaVisual matemático. Mensajes genéricos en auth (login no filtra si el mail existe; recuperar tampoco). Botones deshabilitados hasta formulario válido + captcha OK.

Supabase Auth: **conectado y funcionando end-to-end.**

⚠️ Decisiones técnicas importantes (no romper)

- Audio: **expo-audio**, no expo-av.
- No importar `expo-notifications` en `_layout` ni al arrancar: en Expo Go Android tira *Android Push notifications were removed from Expo Go SDK 53*.
- `lib/recordatorios.ts` solo carga notificaciones si `Constants.appOwnership !== "expo"`.
- `useFocusEffect` sale de `expo-router`, no de `@react-navigation/native`.
- Al desmontar grabadora/player: no llamar `pause/stop` sobre objetos nativos ya liberados.
- Al terminar un audio: `player.loop = false` + pausar; si no, se re-reproduce solo.
- **Nuevo:** el flujo de recuperar contraseña usa OTP por mail, no magic link — decisión tomada para evitar configurar deep linking en Expo Go. Si en algún momento se migra a link, hay que revisar `detectSessionInUrl` en `lib/supabase.ts` (hoy en `false`) y agregar manejo de URL entrante.
- **Nuevo:** el campo "Nombre y Apellido" en `recuperar.tsx` es solo fricción visual — Supabase no lo verifica contra nada real. Si se quiere que sea una verificación real, hace falta tabla `profiles` + función server-side.
- **Nuevo:** "Eliminar cuenta" en `perfil.tsx` NO debe implementarse con `supabase.auth.admin.deleteUser()` desde el cliente — esa función requiere la service role key, que nunca debe estar en la app. Requiere una Edge Function.

🗺️ Qué falta, en orden

1. **Persistir todo en Supabase** — reemplazar AsyncStorage (plan del día, tareas, notas, grabaciones, recordatorios) por tablas reales de Supabase, ahora que hay usuario autenticado real para asociar los datos (`user_id`).
2. **Edge Function para eliminar cuenta** — función server-side con service role key que borre el usuario de `auth.users` cuando el usuario lo pida desde `perfil.tsx` (`supabase.functions.invoke(...)`).
3. **Dominio propio para Resend** — comprar un dominio (ej. algo tipo `flowdyapp.com`, `.io`, `.app` — `flowdy.com` está tomado) y verificarlo en Resend antes de que la app tenga usuarios reales, para que el mail de recuperar contraseña y confirmación de registro les llegue a todos, no solo a la cuenta de Resend.
4. **Avisos de sistema reales** — requieren **EAS Build / dev client**, no Expo Go. Ahí sí usar `expo-notifications` para recordatorios y tareas con `avisar`.
5. **Dictado por voz en Notas** — requiere dev client + `expo-speech-recognition`.
6. **Whisperflow completo** — botón 📝 en grabadora hoy solo muestra Alert. Falta Whisper API + transcripción + prompts.
7. **Música del Pomodoro** — ícono de música es visual; falta Spotify / YouTube Music.
8. **hCaptcha** — reemplazar el captcha matemático en EAS Build.
9. **EAS Build → APK**.

Pendientes menores: Recordatorios del calendario no muestran preview de avisos en el grid; Configuración (permisos, pomodoro, idioma, música) casi todo sin pantalla destino; racha de tareas y plan premium en perfil son UI fija (no hay lógica de streaks ni de suscripciones todavía).

⚠️ Notas de entorno

- `npm install` siempre con `--legacy-peer-deps`
- `NODE_TLS_REJECT_UNAUTHORIZED=0` siempre al correr Expo
- reanimated 4 requiere `react-native-worklets` aparte
- `.env` nunca a GitHub
- Expo Go: cualquier lib nativa nueva chequear compatibilidad **antes**. Audio = `expo-audio`. Notificaciones push/local del sistema = **no en Expo Go Android**.
- Supabase plan Free: templates de mail (Reset password, etc.) **no se pueden guardar sin tener un SMTP custom activo** — ya está resuelto con Resend, pero si en algún momento se desactiva el SMTP custom, los templates dejan de ser editables hasta reactivarlo.
