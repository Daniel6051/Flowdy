import { Tabs } from "expo-router";
import { Home, Calendar, BarChart2, SlidersHorizontal } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: { backgroundColor: "#FFFFFF" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Pomodoro", tabBarIcon: ({ color }) => <Home color={color} size={24} /> }} />
      <Tabs.Screen name="calendario" options={{ title: "Calendario", tabBarIcon: ({ color }) => <Calendar color={color} size={24} /> }} />
      <Tabs.Screen name="tareas" options={{ title: "Tareas", tabBarIcon: ({ color }) => <BarChart2 color={color} size={24} /> }} />
      <Tabs.Screen name="cuenta" options={{ title: "Cuenta", tabBarIcon: ({ color }) => <SlidersHorizontal color={color} size={24} /> }} />
    </Tabs>
  );
}