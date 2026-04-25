import { Tabs } from "expo-router";
import { Text } from "react-native";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a0a",
          borderTopColor: "#1a1a1a",
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#c084fc",
        tabBarInactiveTintColor: "#444",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Journals",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌤️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      {/* Hidden screens — hindi lalabas sa tab bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="storage" options={{ href: null }} />
      <Tabs.Screen name="prayer-list" options={{ href: null }} />
    </Tabs>
  );
}