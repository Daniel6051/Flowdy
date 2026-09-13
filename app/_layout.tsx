import { Slot } from "expo-router";
import { AuthProvider } from "../lib/AuthContext";

export default function Layout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
