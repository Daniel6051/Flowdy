import "dotenv/config";

export default {
  expo: {
    name: "Flowdy",
    slug: "Flowdy",
    version: "1.0.0",
    scheme: "flowdy",   // ← NUEVO
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      ],
      package: "com.danielceledon.Flowdy",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-audio",
        {
          microphonePermission: "Flowdy necesita el micrófono para grabar audios.",
        },
      ],
      "@react-native-community/datetimepicker",
      [
        "expo-speech-recognition",
        {
          microphonePermission: "Flowdy necesita el micrófono para el dictado por voz.",
          speechRecognitionPermission: "Flowdy necesita reconocimiento de voz para el dictado.",
        },
      ],
    ],
    extra: {
      groqApiKey: process.env.GROQ_API_KEY,
      router: {},
      eas: {
        projectId: "066c9089-baf6-4219-b51b-43c5f49c8b4f",
      },
    },
  },
};