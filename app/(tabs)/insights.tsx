import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
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
  longestWeeklyStreak: number;
  daysJournaled: number;
  entriesThisYear: number;
  last7Days: { label: string; count: number; date: string }[];
  calendarYear: { date: string; count: number }[];
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
const MONTH_NAMES = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];
const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

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

  const sorted = [...allNotes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const entryDays = new Set(sorted.map((n) => toDateStr(new Date(n.date))));
  const daysJournaled = entryDays.size;

  // Entries this year
  const thisYear = new Date().getFullYear();
  const entriesThisYear = allNotes.filter(
    (n) => new Date(n.date).getFullYear() === thisYear,
  ).length;

  // Streak calculation
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = toDateStr(new Date());

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

  // Longest weekly streak
  let longestWeeklyStreak = 0;
  let weekStreak = 0;
  const weekSet = new Set<string>();
  allNotes.forEach((n) => {
    const d = new Date(n.date);
    const week = `${d.getFullYear()}-W${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    weekSet.add(week);
  });
  longestWeeklyStreak = weekSet.size;

  // Last 7 days
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

  // Calendar for this year — entries per month
  const calendarYear = Array.from({ length: 12 }, (_, m) => {
    const count = allNotes.filter(
      (n) =>
        new Date(n.date).getFullYear() === thisYear &&
        new Date(n.date).getMonth() === m,
    ).length;
    return { date: `${thisYear}-${String(m + 1).padStart(2, "0")}`, count };
  });

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
    longestWeeklyStreak,
    daysJournaled,
    entriesThisYear,
    last7Days,
    calendarYear,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Calendar Strip (year overview, month bars like Apple Journal) ────────────
function YearCalendarStrip({
  data,
  accent,
}: {
  data: { date: string; count: number }[];
  accent: string;
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View style={cal.wrap}>
      {data.map((item, i) => {
        const month = parseInt(item.date.split("-")[1]) - 1;
        const height =
          item.count > 0 ? Math.max((item.count / max) * 52, 8) : 4;
        const hasEntries = item.count > 0;
        return (
          <View key={i} style={cal.col}>
            <View style={cal.barWrap}>
              <View
                style={[
                  cal.bar,
                  {
                    height,
                    backgroundColor: hasEntries ? accent : "#2a2a2a",
                    opacity: hasEntries ? 0.5 + (item.count / max) * 0.5 : 1,
                  },
                ]}
              />
            </View>
            {item.count > 0 && (
              <Text style={[cal.barCount, { color: accent }]}>
                {item.count}
              </Text>
            )}
            <Text style={[cal.label, hasEntries && { color: "#888" }]}>
              {MONTH_NAMES[month]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const cal = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 8,
    height: 90,
  },
  col: { flex: 1, alignItems: "center", gap: 3 },
  barWrap: { height: 52, justifyContent: "flex-end" },
  bar: { width: 14, borderRadius: 4, minHeight: 4 },
  barCount: { fontSize: 8, fontWeight: "700" },
  label: { color: "#3a3a3a", fontSize: 9, fontWeight: "600" },
});

// ─── Streak Section (Apple Journal style card) ───────────────────────────────
function StreakCard({
  currentStreak,
  longestStreak,
  longestWeeklyStreak,
  daysJournaled,
  entriesThisYear,
}: {
  currentStreak: number;
  longestStreak: number;
  longestWeeklyStreak: number;
  daysJournaled: number;
  entriesThisYear: number;
}) {
  const hasStreak = currentStreak > 0;

  return (
    <View style={sc.card}>
      {/* Left: current streak big number */}
      <View style={sc.left}>
        <Text style={sc.bigNum}>{currentStreak}</Text>
        <View style={sc.dayStreakRow}>
          <Text style={sc.dayWord}>Days</Text>
          <Text style={sc.streakWord}> Streak</Text>
        </View>
        {!hasStreak && (
          <Text style={sc.hint}>
            Journal at least once{"\n"}a week to build a streak.
          </Text>
        )}
      </View>

      {/* Right: stats */}
      <View style={sc.right}>
        <View style={sc.statRow}>
          <View style={sc.statIconWrap}>
            <Text style={sc.statIconText}>📅</Text>
          </View>
          <View>
            <Text style={sc.statNum}>{entriesThisYear}</Text>
            <Text style={sc.statLabel}>Entries This Year</Text>
          </View>
        </View>
        <View style={sc.divider} />
        <View style={sc.statRow}>
          <View style={sc.statIconWrap}>
            <Text style={sc.statIconText}>🗓️</Text>
          </View>
          <View>
            <Text style={sc.statNum}>{daysJournaled}</Text>
            <Text style={sc.statLabel}>Days Journaled</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: "#3d2d6e",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  left: { flex: 1, paddingRight: 16 },
  bigNum: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "800",
    lineHeight: 68,
    letterSpacing: -2,
  },
  dayStreakRow: { flexDirection: "row", alignItems: "baseline", marginTop: 2 },
  dayWord: { color: "#c084fc", fontSize: 16, fontWeight: "700" },
  streakWord: { color: "#a78abf", fontSize: 16, fontWeight: "400" },
  hint: { color: "#a78abf", fontSize: 11, marginTop: 8, lineHeight: 16 },
  right: { gap: 12 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconText: { fontSize: 16 },
  statNum: { color: "#fff", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#c4aee0", fontSize: 11, marginTop: 1 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
});

// ─── Streaks Detail Card (Longest Daily + Weekly) ─────────────────────────────
function StreakStatsCard({
  longestStreak,
  longestWeeklyStreak,
}: {
  longestStreak: number;
  longestWeeklyStreak: number;
}) {
  return (
    <View style={ss.row}>
      <View style={ss.card}>
        <Text style={ss.label}>Longest{"\n"}Daily Streak</Text>
        <Text style={ss.num}>{longestStreak}</Text>
        <Text style={[ss.unit, { color: "#ef4444" }]}>Days</Text>
      </View>
      <View style={ss.card}>
        <Text style={ss.label}>Longest{"\n"}Weekly Streak</Text>
        <Text style={[ss.num, { color: "#818cf8" }]}>
          {longestWeeklyStreak}
        </Text>
        <Text style={[ss.unit, { color: "#818cf8" }]}>Weeks</Text>
      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    borderRadius: 18,
    padding: 18,
    gap: 4,
  },
  label: { color: "#888", fontSize: 12, lineHeight: 16 },
  num: { color: "#ef4444", fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  unit: { color: "#ef4444", fontSize: 13, fontWeight: "600" },
});

// ─── Stats Card (Entries This Year chart like Apple Journal) ──────────────────
function StatsCard({
  data,
  totalEntries,
  totalWords,
  accent,
}: {
  data: { date: string; count: number }[];
  totalEntries: number;
  totalWords: number;
  accent: string;
}) {
  return (
    <View style={stc.card}>
      <View style={stc.topRow}>
        <View>
          <Text style={stc.bigNum}>{totalEntries}</Text>
          <Text style={stc.label}>Entries{"\n"}This Year</Text>
        </View>
        <View style={stc.rightStats}>
          <Text style={stc.wordCount}>{totalWords.toLocaleString()}</Text>
          <Text style={stc.wordLabel}>Words Written</Text>
        </View>
      </View>
      <YearCalendarStrip data={data} accent={accent} />
    </View>
  );
}

const stc = StyleSheet.create({
  card: {
    backgroundColor: "#1a1f3c",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bigNum: {
    color: "#fff",
    fontSize: 52,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 56,
  },
  label: { color: "#6b7db8", fontSize: 13, lineHeight: 18, marginTop: 4 },
  rightStats: { alignItems: "flex-end", marginTop: 4 },
  wordCount: { color: "#818cf8", fontSize: 28, fontWeight: "700" },
  wordLabel: { color: "#4a5580", fontSize: 11, marginTop: 2 },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return <Text style={sh.title}>{title}</Text>;
}

const sh = StyleSheet.create({
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 10,
    marginTop: 8,
  },
});

// ─── Mini stat chips ──────────────────────────────────────────────────────────
function PatternChips({
  bestDay,
  peakHour,
  avgWords,
}: {
  bestDay: string;
  peakHour: number | null;
  avgWords: number;
}) {
  const chips = [
    { icon: "📅", value: bestDay, label: "Best Day" },
    ...(peakHour !== null
      ? [{ icon: "⏰", value: formatHour(peakHour), label: "Peak Hour" }]
      : []),
    { icon: "✍️", value: String(avgWords), label: "Avg Words" },
  ];
  return (
    <View style={pc.row}>
      {chips.map((c, i) => (
        <View key={i} style={pc.chip}>
          <Text style={pc.icon}>{c.icon}</Text>
          <Text style={pc.value}>{c.value}</Text>
          <Text style={pc.label}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

const pc = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginBottom: 12 },
  chip: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  icon: { fontSize: 20 },
  value: { color: "#fff", fontSize: 15, fontWeight: "700" },
  label: { color: "#555", fontSize: 10, fontWeight: "500" },
});

// ─── Mood bars ────────────────────────────────────────────────────────────────
function MoodSection({
  data,
}: {
  data: { label: string; color: string; count: number }[];
}) {
  const total = data.reduce((a, d) => a + d.count, 0);
  return (
    <View style={ms.card}>
      <SectionHeader title="Mood" />
      {data
        .sort((a, b) => b.count - a.count)
        .map((m, i) => {
          const pct = total > 0 ? (m.count / total) * 100 : 0;
          return (
            <View key={i} style={ms.row}>
              <Text style={ms.label}>{m.label}</Text>
              <View style={ms.track}>
                <View
                  style={[
                    ms.fill,
                    { width: `${pct}%` as any, backgroundColor: m.color },
                  ]}
                />
              </View>
              <Text style={[ms.pct, { color: m.color }]}>
                {Math.round(pct)}%
              </Text>
            </View>
          );
        })}
    </View>
  );
}

const ms = StyleSheet.create({
  card: {
    backgroundColor: "#1c1c1e",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  label: { color: "#888", fontSize: 12, width: 110 },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: "700", width: 34, textAlign: "right" },
});

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

  const accent = "#818cf8";

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

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={s.pageTitle}>Insights</Text>

      {/* Streaks section */}
      <SectionHeader title="Streaks" />

      {/* Main streak card — Apple Journal purple card */}
      <StreakCard
        currentStreak={data.currentStreak}
        longestStreak={data.longestStreak}
        longestWeeklyStreak={data.longestWeeklyStreak}
        daysJournaled={data.daysJournaled}
        entriesThisYear={data.entriesThisYear}
      />

      {/* Longest daily + weekly */}
      <StreakStatsCard
        longestStreak={data.longestStreak}
        longestWeeklyStreak={data.longestWeeklyStreak}
      />

      {/* Stats section */}
      <SectionHeader title="Stats" />

      {/* Entries this year + word count + month chart */}
      <StatsCard
        data={data.calendarYear}
        totalEntries={data.entriesThisYear}
        totalWords={data.totalWords}
        accent={accent}
      />

      {/* Journaled days + avg words row */}
      <View style={s.twoCol}>
        <View style={[s.miniCard, { backgroundColor: "#3d1f1f" }]}>
          <Text style={[s.miniNum, { color: "#f87171" }]}>
            {data.daysJournaled}
          </Text>
          <Text style={s.miniLabel}>Days{"\n"}Journaled</Text>
        </View>
        <View style={[s.miniCard, { backgroundColor: "#1f2d3d" }]}>
          <Text style={[s.miniNum, { color: "#60a5fa" }]}>
            {data.totalWords.toLocaleString()}
          </Text>
          <Text style={s.miniLabel}>Words{"\n"}Written</Text>
        </View>
      </View>

      {/* Writing patterns */}
      <SectionHeader title="Writing Patterns" />
      <PatternChips
        bestDay={data.bestDayOfWeek}
        peakHour={data.mostActiveHour}
        avgWords={data.avgWordsPerEntry}
      />

      {/* Activities */}
      {data.topActivities.length > 0 && (
        <>
          <SectionHeader title="Top Activities" />
          <View style={s.activitiesRow}>
            {data.topActivities.map((act) => (
              <View key={act.id} style={s.actCard}>
                <View style={[s.actCircle, { borderColor: accent + "55" }]}>
                  <Text style={{ fontSize: 22 }}>{act.emoji}</Text>
                </View>
                <Text style={s.actLabel}>{act.label}</Text>
                <Text style={[s.actCount, { color: accent }]}>
                  {act.count}x
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Mood */}
      {data.moodDistribution.length > 0 && (
        <>
          <MoodSection data={data.moodDistribution} />
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  pageTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 20,
  },
  twoCol: { flexDirection: "row", gap: 12, marginBottom: 12 },
  miniCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    gap: 4,
  },
  miniNum: { fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  miniLabel: { color: "#888", fontSize: 12, lineHeight: 17 },
  activitiesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  actCard: { alignItems: "center", gap: 6, minWidth: 70 },
  actCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1a1a1a",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  actLabel: { color: "#888", fontSize: 10, fontWeight: "500" },
  actCount: { fontSize: 11, fontWeight: "700" },
});
