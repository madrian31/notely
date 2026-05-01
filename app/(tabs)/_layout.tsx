import { Tabs } from "expo-router";
import Svg, { Circle, Line, Polyline, Rect } from "react-native-svg";

function TabIconJournals({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 22 22">
      <Rect x="4" y="6" width="14" height="13" rx="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="6" y="3" width="12" height="13" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
      <Line x1="7" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="7" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function TabIconToday({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 22 22">
      <Rect x="3" y="5" width="16" height="15" rx="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="7" y1="3" x2="7" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="15" y1="3" x2="15" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.3" />
      <Circle cx="11" cy="15" r="2" fill={color} opacity={0.7} />
    </Svg>
  );
}

function TabIconInsights({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 22 22">
      <Polyline points="3,18 7,11 11,14 15,7 19,10" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="3" y1="18" x2="19" y2="18" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
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
          tabBarIcon: ({ color }) => <TabIconJournals color={color} />,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color }) => <TabIconToday color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => <TabIconInsights color={color} />,
        }}
      />
      {/* Hidden screens — hindi lalabas sa tab bar */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="storage" options={{ href: null }} />
      <Tabs.Screen name="prayer-list" options={{ href: null }} />
    </Tabs>
  );
}