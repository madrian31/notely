import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage } from "./storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
  emotion?: {
    label: string;
    color: string;
    valence: number;
    intensity: number;
  };
  activities?: string[];
  tags?: string[];
};

type Journal = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

type InsightData = {
  totalEntries: number;
  totalWords: number;
  avgWordsPerEntry: number;
  currentStreak: number;
  longestStreak: number;
  last7Days: { label: string; count: number; date: string }[];
  last4Weeks: { label: string; count: number }[];
  bestDayOfWeek: string;
  mostActiveHour: number | null;
  topActivities: { id: string; emoji: string; label: string; count: number }[];
  moodDistribution: {
    label: string;
    color: string;
    count: number;
    valence: number;
  }[];
};

const ACTIVITY_META: Record<string, { emoji: string; label: string }> = {
  stationary: { emoji: "🪑", label: "Stationary" },
  eating: { emoji: "🍽️", label: "Eating" },
  walking: { emoji: "🚶", label: "Walking" },
  running: { emoji: "🏃", label: "Running" },
  biking: { emoji: "🚴", label: "Biking" },
  automotive: { emoji: "🚗", label: "Automotive" },
  flying: { emoji: "✈️", label: "Flying" },
  none: { emoji: "—", label: "None" },
};

const EMOTION_META = [
  { valence: 1, label: "Very Unpleasant", color: "#ef4444" },
  { valence: 2, label: "Unpleasant", color: "#f97316" },
  { valence: 3, label: "Neutral", color: "#a3a3a3" },
  { valence: 4, label: "Pleasant", color: "#34d399" },
  { valence: 5, label: "Very Pleasant", color: "#3b82f6" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function computeInsights(allNotes: Note[]): InsightData {
  const totalEntries = allNotes.length;
  const totalWords = allNotes.reduce(
    (acc, n) => acc + (n.text?.trim().split(/\s+/).filter(Boolean).length ?? 0),
    0,
  );
  const avgWordsPerEntry =
    totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

  // Sort notes by date ascending
  const sorted = [...allNotes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Unique days with entries
  const entryDays = new Set(sorted.map((n) => toDateStr(new Date(n.date))));

  // Streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));

  // Walk backwards from today
  let checkDay = entryDays.has(today)
    ? new Date()
    : new Date(Date.now() - 86400000);
  if (entryDays.has(toDateStr(checkDay))) {
    let d = new Date(checkDay);
    while (entryDays.has(toDateStr(d))) {
      currentStreak++;
      d = new Date(d.getTime() - 86400000);
    }
  }

  // Longest streak
  const dayList = Array.from(entryDays).sort();
  streak = 0;
  for (let i = 0; i < dayList.length; i++) {
    if (i === 0) {
      streak = 1;
      continue;
    }
    const prev = new Date(dayList[i - 1]);
    const curr = new Date(dayList[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      streak = 1;
    }
    if (streak > longestStreak) longestStreak = streak;
  }
  if (streak > longestStreak) longestStreak = streak;
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // Last 7 days bar chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = toDateStr(d);
    return {
      label: DAY_NAMES[d.getDay()],
      date: dateStr,
      count: allNotes.filter((n) => toDateStr(new Date(n.date)) === dateStr)
        .length,
    };
  });

  // Last 4 weeks
  const last4Weeks = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    const count = allNotes.filter((n) => {
      const d = new Date(n.date);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { label: `W${4 - i}`, count };
  }).reverse();

  // Best day of week
  const dayCounts = Array(7).fill(0);
  allNotes.forEach((n) => dayCounts[new Date(n.date).getDay()]++);
  const bestDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
  const bestDayOfWeek = DAY_NAMES[bestDayIdx];

  // Most active hour
  const hourCounts = Array(24).fill(0);
  allNotes.forEach((n) => hourCounts[new Date(n.date).getHours()]++);
  const maxHourCount = Math.max(...hourCounts);
  const mostActiveHour =
    maxHourCount > 0 ? hourCounts.indexOf(maxHourCount) : null;

  // Top activities
  const activityCounts: Record<string, number> = {};
  allNotes.forEach((n) => {
    n.activities?.forEach((a) => {
      activityCounts[a] = (activityCounts[a] ?? 0) + 1;
    });
  });
  const topActivities = Object.entries(activityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, count]) => ({
      id,
      emoji: ACTIVITY_META[id]?.emoji ?? "❓",
      label: ACTIVITY_META[id]?.label ?? id,
      count,
    }));

  // Mood distribution
  const moodCounts: Record<number, number> = {};
  allNotes.forEach((n) => {
    if (n.emotion?.valence) {
      moodCounts[n.emotion.valence] = (moodCounts[n.emotion.valence] ?? 0) + 1;
    }
  });
  const moodDistribution = EMOTION_META.map((m) => ({
    ...m,
    count: moodCounts[m.valence] ?? 0,
  })).filter((m) => m.count > 0);

  return {
    totalEntries,
    totalWords,
    avgWordsPerEntry,
    currentStreak,
    longestStreak,
    last7Days,
    last4Weeks,
    bestDayOfWeek,
    mostActiveHour,
    topActivities,
    moodDistribution,
  };
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function BarChart({
  data,
  accent,
}: {
  data: { label: string; count: number; date?: string }[];
  accent: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const today = toDateStr(new Date());

  return (
    <View style={s.barChart}>
      {data.map((d, i) => {
        const isToday = d.date === today;
        const height = Math.max((d.count / max) * 80, d.count > 0 ? 6 : 2);
        return (
          <View key={i} style={s.barCol}>
            {d.count > 0 && <Text style={s.barCount}>{d.count}</Text>}
            <View
              style={[
                s.bar,
                {
                  height,
                  backgroundColor: isToday
                    ? accent
                    : d.count > 0
                      ? accent + "88"
                      : "#1e1e1e",
                },
              ]}
            />
            <Text style={[s.barLabel, isToday && { color: accent }]}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MoodBar({
  item,
  total,
}: {
  item: { label: string; color: string; count: number };
  total: number;
}) {
  const pct = total > 0 ? (item.count / total) * 100 : 0;
  return (
    <View style={s.moodBarRow}>
      <Text style={s.moodBarLabel}>{item.label}</Text>
      <View style={s.moodBarTrack}>
        <View
          style={[
            s.moodBarFill,
            { width: `${pct}%` as any, backgroundColor: item.color },
          ]}
        />
      </View>
      <Text style={[s.moodBarPct, { color: item.color }]}>
        {Math.round(pct)}%
      </Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const stored = await Storage.getItem("journals");
      const journals: Journal[] = stored ? JSON.parse(stored) : [];
      const allNotes: Note[] = [];
      for (const j of journals) {
        const raw = await Storage.getItem(`notes_${j.id}`);
        const notes: Note[] = raw ? JSON.parse(raw) : [];
        allNotes.push(...notes);
      }
      setData(computeInsights(allNotes));
    } catch (e) {
      console.log("insights load error:", e);
    }
    setLoading(false);
  };

  const accent = "#c084fc";

  if (loading) {
    return (
      <View
        style={[
          s.container,
          {
            paddingTop: insets.top + 16,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: "#444", fontSize: 14 }}>Loading insights...</Text>
      </View>
    );
  }

  if (!data || data.totalEntries === 0) {
    return (
      <View
        style={[
          s.container,
          {
            paddingTop: insets.top + 16,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
        <Text
          style={{
            color: "#fff",
            fontSize: 17,
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          No insights yet
        </Text>
        <Text
          style={{
            color: "#444",
            fontSize: 13,
            textAlign: "center",
            paddingHorizontal: 40,
          }}
        >
          Start writing journal entries to see your patterns here.
        </Text>
      </View>
    );
  }

  const moodTotal = data.moodDistribution.reduce((acc, m) => acc + m.count, 0);

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 32,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel}>Insights</Text>
      </View>

      {/* Streak banner */}
      <View style={[s.streakBanner, { borderColor: accent + "44" }]}>
        <View style={s.streakLeft}>
          <Text style={s.streakFire}>🔥</Text>
          <View>
            <Text style={[s.streakCount, { color: accent }]}>
              {data.currentStreak}
            </Text>
            <Text style={s.streakLabel}>day streak</Text>
          </View>
        </View>
        <View style={s.streakDivider} />
        <View style={s.streakRight}>
          <Text style={s.streakBestValue}>{data.longestStreak}</Text>
          <Text style={s.streakBestLabel}>longest streak</Text>
        </View>
      </View>

      {/* Top stats */}
      <View style={s.statsRow}>
        <StatCard icon="📝" value={String(data.totalEntries)} label="Entries" />
        <StatCard
          icon="🔤"
          value={data.totalWords.toLocaleString()}
          label="Words"
        />
        <StatCard
          icon="📏"
          value={String(data.avgWordsPerEntry)}
          label="Avg words"
        />
      </View>

      {/* Last 7 days */}
      <View style={s.card}>
        <SectionTitle title="Last 7 Days" subtitle="Entries per day" />
        <BarChart data={data.last7Days} accent={accent} />
      </View>

      {/* Last 4 weeks */}
      <View style={s.card}>
        <SectionTitle title="Last 4 Weeks" subtitle="Entries per week" />
        <BarChart data={data.last4Weeks} accent={accent} />
      </View>

      {/* Writing patterns */}
      <View style={s.card}>
        <SectionTitle title="Writing Patterns" />
        <View style={s.patternRow}>
          <View style={s.patternItem}>
            <Text style={s.patternIcon}>📅</Text>
            <Text style={s.patternValue}>{data.bestDayOfWeek}</Text>
            <Text style={s.patternLabel}>Best day</Text>
          </View>
          {data.mostActiveHour !== null && (
            <View style={s.patternItem}>
              <Text style={s.patternIcon}>⏰</Text>
              <Text style={s.patternValue}>
                {formatHour(data.mostActiveHour)}
              </Text>
              <Text style={s.patternLabel}>Peak hour</Text>
            </View>
          )}
          <View style={s.patternItem}>
            <Text style={s.patternIcon}>✍️</Text>
            <Text style={s.patternValue}>{data.avgWordsPerEntry}</Text>
            <Text style={s.patternLabel}>Avg length</Text>
          </View>
        </View>
      </View>

      {/* Top activities */}
      {data.topActivities.length > 0 && (
        <View style={s.card}>
          <SectionTitle
            title="Top Activities"
            subtitle="What you do while journaling"
          />
          <View style={s.activityRow}>
            {data.topActivities.map((act) => (
              <View key={act.id} style={s.activityItem}>
                <View
                  style={[s.activityCircle, { borderColor: accent + "55" }]}
                >
                  <Text style={s.activityEmoji}>{act.emoji}</Text>
                </View>
                <Text style={s.activityLabel}>{act.label}</Text>
                <Text style={[s.activityCount, { color: accent }]}>
                  {act.count}x
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Mood distribution */}
      {data.moodDistribution.length > 0 && (
        <View style={s.card}>
          <SectionTitle
            title="Mood Distribution"
            subtitle="Based on your logged emotions"
          />
          {data.moodDistribution
            .sort((a, b) => b.count - a.count)
            .map((m) => (
              <MoodBar key={m.valence} item={m} total={moodTotal} />
            ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { marginBottom: 20 },
  headerLabel: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  // Streak banner
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  streakLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  streakFire: { fontSize: 32 },
  streakCount: { fontSize: 36, fontWeight: "800", lineHeight: 38 },
  streakLabel: { color: "#555", fontSize: 12, fontWeight: "500" },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#222",
    marginHorizontal: 16,
  },
  streakRight: { alignItems: "center" },
  streakBestValue: { color: "#fff", fontSize: 22, fontWeight: "700" },
  streakBestLabel: { color: "#444", fontSize: 11, fontWeight: "500" },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  statIcon: { fontSize: 18 },
  statValue: { color: "#fff", fontSize: 17, fontWeight: "700" },
  statLabel: { color: "#555", fontSize: 10, fontWeight: "500" },

  // Card
  card: {
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: { color: "#f0f0f0", fontSize: 15, fontWeight: "700" },
  sectionSubtitle: { color: "#444", fontSize: 12, marginTop: 2 },

  // Bar chart
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 110,
    paddingTop: 16,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barCount: { color: "#555", fontSize: 9, fontWeight: "600" },
  bar: { width: "60%", borderRadius: 4, minHeight: 2 },
  barLabel: { color: "#444", fontSize: 10, fontWeight: "500" },

  // Patterns
  patternRow: { flexDirection: "row", justifyContent: "space-around" },
  patternItem: { alignItems: "center", gap: 4 },
  patternIcon: { fontSize: 22 },
  patternValue: { color: "#fff", fontSize: 16, fontWeight: "700" },
  patternLabel: { color: "#444", fontSize: 11 },

  // Activities
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 8,
  },
  activityItem: { alignItems: "center", gap: 4, minWidth: 64 },
  activityCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1a1a1a",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  activityEmoji: { fontSize: 22 },
  activityLabel: { color: "#888", fontSize: 10, fontWeight: "500" },
  activityCount: { fontSize: 11, fontWeight: "700" },

  // Mood bars
  moodBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  moodBarLabel: { color: "#888", fontSize: 12, width: 110 },
  moodBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#1e1e1e",
    borderRadius: 3,
    overflow: "hidden",
  },
  moodBarFill: { height: "100%", borderRadius: 3 },
  moodBarPct: {
    fontSize: 11,
    fontWeight: "600",
    width: 32,
    textAlign: "right",
  },
});
