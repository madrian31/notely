import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import { Storage, STORAGE_KEYS } from "../storage";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconCalendar({ color = "#888", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Rect x="2" y="3" width="14" height="13" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="5" y1="2" x2="5" y2="4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="13" y1="2" x2="13" y2="4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="2" y1="7" x2="16" y2="7" stroke={color} strokeWidth="1.2" />
      <Circle cx="9" cy="12" r="1.5" fill={color} opacity={0.7} />
    </Svg>
  );
}

function IconClock({ color = "#888", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx="9" cy="9" r="7" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="9" y1="5" x2="9" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="9" y1="9" x2="12" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconPen({ color = "#888", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M3 15 L4.5 10 L13 2 L16 5 L7.5 13.5 Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="11" y1="3.5" x2="14.5" y2="7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="3" y1="15" x2="7" y2="15" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconFire({ color = "#ef4444", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M9 2c0 3.5-3.5 4-3.5 7.5A4.5 4.5 0 0014 9.5c0-5-3.5-5-3-9.5C9.5 1 7 4.5 6.5 6.5 6 4.5 5 3 5 3c0 3.5 2 4.5 2 7a2.5 2.5 0 005 0c0-3.5-2-4.5-2-8z" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconTrendUp({ color = "#34d399", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Polyline points="2,14 6,9 10,11 16,4" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="12,4 16,4 16,8" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconTrendDown({ color = "#f97316", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Polyline points="2,4 6,9 10,7 16,14" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="12,14 16,14 16,10" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconChat({ color = "#818cf8", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M2 3a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H6l-4 3V3z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="5" y1="6" x2="13" y2="6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="5" y1="9" x2="10" y2="9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function IconMedal({ color = "#fbbf24", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Circle cx="9" cy="11" r="5" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M6 6.5 L5 2 L9 4 L13 2 L12 6.5" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconTag({ color = "#818cf8", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M2 2h6l8 8-6 6-8-8V2z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Circle cx="6" cy="6" r="1.5" fill={color} />
    </Svg>
  );
}

function IconChartBar({ color = "#818cf8", size = 40 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="4" y="20" width="7" height="14" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="16" y="12" width="7" height="22" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="28" y="6" width="7" height="28" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="2" y1="34" x2="38" y2="34" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

const MOOD_ICONS = [
  (s: number) => (
    <Svg width={s} height={s} viewBox="0 0 12 12">
      <Circle cx="6" cy="6" r="5" stroke="#818cf8" strokeWidth="1.2" fill="none" />
      <Circle cx="4" cy="5" r="0.8" fill="#818cf8" />
      <Circle cx="8" cy="5" r="0.8" fill="#818cf8" />
      <Path d="M3.5 7.5 Q6 9.5 8.5 7.5" stroke="#818cf8" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </Svg>
  ),
  (s: number) => (
    <Svg width={s} height={s} viewBox="0 0 12 12">
      <Circle cx="6" cy="6" r="5" stroke="#34d399" strokeWidth="1.2" fill="none" />
      <Circle cx="4" cy="5" r="0.8" fill="#34d399" />
      <Circle cx="8" cy="5" r="0.8" fill="#34d399" />
      <Path d="M4 7.5 Q6 9 8 7.5" stroke="#34d399" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </Svg>
  ),
  (s: number) => (
    <Svg width={s} height={s} viewBox="0 0 12 12">
      <Circle cx="6" cy="6" r="5" stroke="#a3a3a3" strokeWidth="1.2" fill="none" />
      <Circle cx="4" cy="5" r="0.8" fill="#a3a3a3" />
      <Circle cx="8" cy="5" r="0.8" fill="#a3a3a3" />
      <Line x1="4" y1="8" x2="8" y2="8" stroke="#a3a3a3" strokeWidth="1.1" strokeLinecap="round" />
    </Svg>
  ),
  (s: number) => (
    <Svg width={s} height={s} viewBox="0 0 12 12">
      <Circle cx="6" cy="6" r="5" stroke="#f97316" strokeWidth="1.2" fill="none" />
      <Circle cx="4" cy="5" r="0.8" fill="#f97316" />
      <Circle cx="8" cy="5" r="0.8" fill="#f97316" />
      <Path d="M4 9 Q6 7 8 9" stroke="#f97316" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </Svg>
  ),
  (s: number) => (
    <Svg width={s} height={s} viewBox="0 0 12 12">
      <Circle cx="6" cy="6" r="5" stroke="#ef4444" strokeWidth="1.2" fill="none" />
      <Circle cx="4" cy="5" r="0.8" fill="#ef4444" />
      <Circle cx="8" cy="5" r="0.8" fill="#ef4444" />
      <Path d="M3.5 9.5 Q6 7 8.5 9.5" stroke="#ef4444" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </Svg>
  ),
];

function MilestoneIcon({ id, size = 28, unlocked }: { id: string; size?: number; unlocked: boolean }) {
  const color = unlocked ? "#818cf8" : "#333";
  switch (id) {

    // 🌱 Sprout — universally "beginning / first step"
    case "first": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* stem */}
        <Line x1="14" y1="22" x2="14" y2="13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
        {/* ground line */}
        <Line x1="9" y1="22" x2="19" y2="22" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        {/* left leaf */}
        <Path d="M14 16 Q9 14 8 9 Q12 8 14 13" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* right leaf */}
        <Path d="M14 14 Q19 12 20 7 Q16 8 14 13" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );

    // 🔥 Flame — "streak / fire / momentum"
    case "week": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* outer flame */}
        <Path
          d="M14 4 C14 4 20 10 20 16 C20 20.4 17.3 24 14 24 C10.7 24 8 20.4 8 16 C8 13 9.5 10.5 11 9 C11 12 12.5 13.5 14 14 C14 11 13 7.5 14 4Z"
          stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"
        />
        {/* inner core */}
        <Path
          d="M14 15 C14 15 16.5 17 16.5 19.5 C16.5 21.4 15.4 23 14 23 C12.6 23 11.5 21.4 11.5 19.5 C11.5 17 14 15 14 15Z"
          stroke={color} strokeWidth="1.2" fill="none"
        />
      </Svg>
    );

    // 📅 Calendar with check — "30-day calendar streak"
    case "month": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Rect x="3" y="5" width="22" height="19" rx="3" stroke={color} strokeWidth="1.4" fill="none" />
        <Line x1="3" y1="11" x2="25" y2="11" stroke={color} strokeWidth="1.2" />
        <Line x1="9" y1="3" x2="9" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Line x1="19" y1="3" x2="19" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* big checkmark */}
        <Path d="M9 18 L13 22 L20 14" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );

    // 📄 Stacked notes — "10 entries / you've written entries"
    case "ten": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* back page */}
        <Rect x="8" y="4" width="14" height="18" rx="2" stroke={color} strokeWidth="1.2" fill="none" opacity={0.4} />
        {/* middle page */}
        <Rect x="6" y="6" width="14" height="18" rx="2" stroke={color} strokeWidth="1.2" fill="none" opacity={0.65} />
        {/* front page */}
        <Rect x="4" y="8" width="14" height="18" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
        <Line x1="7" y1="13" x2="15" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        <Line x1="7" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      </Svg>
    );

    // 🏆 Trophy cup — "50 entries / committed journaler"
    case "fifty": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* cup body */}
        <Path d="M8 5 H20 L18 16 Q14 19 10 16 Z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        {/* handles */}
        <Path d="M8 7 Q4 7 4 11 Q4 14 8 14" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <Path d="M20 7 Q24 7 24 11 Q24 14 20 14" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        {/* stem */}
        <Line x1="14" y1="19" x2="14" y2="23" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        {/* base */}
        <Line x1="9" y1="23" x2="19" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );

    // 🥇 Medal — "100 entries / century milestone"
    case "hundred": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* ribbon left */}
        <Path d="M11 4 L9 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.7} />
        {/* ribbon right */}
        <Path d="M17 4 L19 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.7} />
        {/* medal circle */}
        <Circle cx="14" cy="18" r="8" stroke={color} strokeWidth="1.5" fill="none" />
        {/* star inside */}
        <Polygon points="14,12 15.5,16.5 20,16.5 16.5,19 17.8,23.5 14,21 10.2,23.5 11.5,19 8,16.5 12.5,16.5"
          stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
      </Svg>
    );

    // ✒️ Quill / feather pen — "wordsmith / 10k words written"
    case "wordsmith": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* feather body */}
        <Path d="M22 4 C22 4 12 8 8 18 L10 20 C16 12 22 8 24 4 Z"
          stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
        {/* spine */}
        <Line x1="22" y1="4" x2="8" y2="22" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        {/* nib tip */}
        <Path d="M8 22 L6 24 L9 23 Z" stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        {/* barbs left */}
        <Line x1="18" y1="8" x2="14" y2="14" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        <Line x1="15" y1="11" x2="11" y2="17" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
      </Svg>
    );

    // 📖 Open book — "novelist / 50k words"
    case "novelist": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* left page */}
        <Path d="M14 8 Q10 6 4 7 L4 22 Q10 21 14 23 Z"
          stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        {/* right page */}
        <Path d="M14 8 Q18 6 24 7 L24 22 Q18 21 14 23 Z"
          stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        {/* spine */}
        <Line x1="14" y1="8" x2="14" y2="23" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* left lines */}
        <Line x1="7" y1="12" x2="12" y2="11.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        <Line x1="7" y1="15" x2="12" y2="14.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        {/* right lines */}
        <Line x1="21" y1="12" x2="16" y2="11.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        <Line x1="21" y1="15" x2="16" y2="14.5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity={0.6} />
      </Svg>
    );

    // 🎯 Bullseye / target — "consistent / journaled 25 days"
    case "consistent": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        <Circle cx="14" cy="14" r="11" stroke={color} strokeWidth="1.4" fill="none" />
        <Circle cx="14" cy="14" r="7" stroke={color} strokeWidth="1.4" fill="none" />
        <Circle cx="14" cy="14" r="3" stroke={color} strokeWidth="1.4" fill="none" />
        <Circle cx="14" cy="14" r="1.5" fill={color} />
      </Svg>
    );

    // 💡 Lightbulb — "deep thinker / 500+ word entry"
    case "deep": return (
      <Svg width={size} height={size} viewBox="0 0 28 28">
        {/* bulb */}
        <Path d="M9 13 Q9 7 14 7 Q19 7 19 13 Q19 17 16 19 L12 19 Q9 17 9 13 Z"
          stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
        {/* base bands */}
        <Line x1="12" y1="20" x2="16" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        <Line x1="12" y1="22" x2="16" y2="22" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        {/* tip */}
        <Line x1="13" y1="24" x2="15" y2="24" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        {/* filament */}
        <Path d="M12 15 Q14 12 16 15" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        {/* rays */}
        <Line x1="14" y1="4" x2="14" y2="5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        <Line x1="7" y1="7" x2="8" y2="8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
        <Line x1="21" y1="7" x2="20" y2="8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      </Svg>
    );

    default: return <IconPen color={color} size={size} />;
  }
}

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

type Journal = { id: string; name: string; color: string; emoji: string };

type Milestone = {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  unlocked: boolean;
};

type InsightData = {
  totalEntries: number;
  totalWords: number;
  avgWordsPerEntry: number;
  longestEntry: number;
  currentStreak: number;
  longestStreak: number;
  longestWeeklyStreak: number;
  daysJournaled: number;
  entriesThisYear: number;
  thisMonthEntries: number;
  lastMonthEntries: number;
  calendarYear: { date: string; count: number }[];
  heatmapData: { date: string; count: number }[];
  bestDayOfWeek: string;
  mostActiveHour: number | null;
  topActivities: { id: string; emoji: string; label: string; count: number }[];
  moodDistribution: {
    label: string;
    color: string;
    count: number;
    valence: number;
  }[];
  moodTrend: { week: string; avg: number | null }[];
  smartInsights: { iconType: string; text: string }[];
  milestones: Milestone[];
  topTags: { tag: string; count: number }[];
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
  { valence: 5, label: "Very Pleasant", color: "#818cf8" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
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
const ACCENT = "#818cf8";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ─── computeInsights ──────────────────────────────────────────────────────────

function computeInsights(allNotes: Note[]): InsightData {
  const totalEntries = allNotes.length;
  const totalWords = allNotes.reduce(
    (acc, n) => acc + (n.text?.trim().split(/\s+/).filter(Boolean).length ?? 0),
    0,
  );
  const avgWordsPerEntry =
    totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
  const longestEntry = allNotes.reduce((max, n) => {
    const w = n.text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    return w > max ? w : max;
  }, 0);

  const sorted = [...allNotes].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const entryDays = new Set(sorted.map((n) => toDateStr(new Date(n.date))));
  const daysJournaled = entryDays.size;

  const thisYear = new Date().getFullYear();
  const now = new Date();
  const thisMonth = now.getMonth();

  const entriesThisYear = allNotes.filter(
    (n) => new Date(n.date).getFullYear() === thisYear,
  ).length;
  const thisMonthEntries = allNotes.filter(
    (n) =>
      new Date(n.date).getFullYear() === thisYear &&
      new Date(n.date).getMonth() === thisMonth,
  ).length;
  const lastMonthEntries = allNotes.filter((n) => {
    const d = new Date(n.date);
    const lm = thisMonth === 0 ? 11 : thisMonth - 1;
    const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
    return d.getFullYear() === ly && d.getMonth() === lm;
  }).length;

  // Daily streaks
  let currentStreak = 0,
    longestStreak = 0,
    streak = 0;
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
  for (let i = 0; i < dayList.length; i++) {
    if (i === 0) {
      streak = 1;
      continue;
    }
    const diff =
      (new Date(dayList[i]).getTime() - new Date(dayList[i - 1]).getTime()) /
      86400000;
    streak = diff === 1 ? streak + 1 : 1;
    if (streak > longestStreak) longestStreak = streak;
  }
  if (streak > longestStreak) longestStreak = streak;
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // Weekly streak
  const weekSet = new Set<string>();
  allNotes.forEach((n) => {
    const d = new Date(n.date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((d.getTime() - startOfYear.getTime()) / 86400000 +
        startOfYear.getDay() +
        1) /
      7,
    );
    weekSet.add(`${d.getFullYear()}-W${weekNum}`);
  });
  const longestWeeklyStreak = weekSet.size;

  // Calendar year
  const calendarYear = Array.from({ length: 12 }, (_, m) => ({
    date: `${thisYear}-${String(m + 1).padStart(2, "0")}`,
    count: allNotes.filter(
      (n) =>
        new Date(n.date).getFullYear() === thisYear &&
        new Date(n.date).getMonth() === m,
    ).length,
  }));

  // Heatmap: full year (Jan 1 to today) for calendar navigation
  const heatmapData: { date: string; count: number }[] = [];
  const yearStart = new Date(thisYear, 0, 1);
  const todayForHeatmap = new Date();
  for (
    let hd = new Date(yearStart);
    hd <= todayForHeatmap;
    hd.setDate(hd.getDate() + 1)
  ) {
    const ds = toDateStr(new Date(hd));
    heatmapData.push({
      date: ds,
      count: allNotes.filter((n) => toDateStr(new Date(n.date)) === ds).length,
    });
  }

  // Best day & peak hour
  const dayCounts = Array(7).fill(0);
  allNotes.forEach((n) => dayCounts[new Date(n.date).getDay()]++);
  const bestDayOfWeek = DAY_NAMES[dayCounts.indexOf(Math.max(...dayCounts))];
  const hourCounts = Array(24).fill(0);
  allNotes.forEach((n) => hourCounts[new Date(n.date).getHours()]++);
  const maxHC = Math.max(...hourCounts);
  const mostActiveHour = maxHC > 0 ? hourCounts.indexOf(maxHC) : null;

  // Activities
  const actCounts: Record<string, number> = {};
  allNotes.forEach((n) =>
    n.activities?.forEach((a) => {
      actCounts[a] = (actCounts[a] ?? 0) + 1;
    }),
  );
  const topActivities = Object.entries(actCounts)
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
    if (n.emotion?.valence)
      moodCounts[n.emotion.valence] = (moodCounts[n.emotion.valence] ?? 0) + 1;
  });
  const moodDistribution = EMOTION_META.map((m) => ({
    ...m,
    count: moodCounts[m.valence] ?? 0,
  })).filter((m) => m.count > 0);

  // Mood trend (last 8 weeks)
  const moodTrend = Array.from({ length: 8 }, (_, i) => {
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    const wNotes = allNotes.filter((n) => {
      const d = new Date(n.date);
      return d >= weekStart && d <= weekEnd && n.emotion?.valence;
    });
    const avg =
      wNotes.length > 0
        ? wNotes.reduce((s, n) => s + (n.emotion?.valence ?? 0), 0) /
        wNotes.length
        : null;
    return { week: `W${8 - i}`, avg };
  }).reverse();

  // Tags
  const tagCounts: Record<string, number> = {};
  allNotes.forEach((n) =>
    n.tags?.forEach((t) => {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }),
  );
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  // Smart insights
  const smartInsights: { iconType: string; text: string }[] = [];
  if (bestDayOfWeek)
    smartInsights.push({ iconType: "calendar", text: `You write most on ${bestDayOfWeek}s` });
  if (mostActiveHour !== null) {
    const period =
      mostActiveHour < 12
        ? "morning"
        : mostActiveHour < 18
          ? "afternoon"
          : "evening";
    smartInsights.push({
      iconType: "clock",
      text: `You're a ${period} journaler — usually at ${formatHour(mostActiveHour)}`,
    });
  }
  if (thisMonthEntries > lastMonthEntries && lastMonthEntries > 0)
    smartInsights.push({
      iconType: "trendUp",
      text: `${thisMonthEntries - lastMonthEntries} more entries than last month — great momentum!`,
    });
  else if (thisMonthEntries < lastMonthEntries && lastMonthEntries > 0)
    smartInsights.push({
      iconType: "trendDown",
      text: `${lastMonthEntries - thisMonthEntries} fewer entries than last month — you got this!`,
    });
  if (longestEntry > 0)
    smartInsights.push({ iconType: "pen", text: `Your longest entry was ${longestEntry} words` });
  if (avgWordsPerEntry > 100)
    smartInsights.push({
      iconType: "chat",
      text: `You write detailed entries — avg ${avgWordsPerEntry} words each`,
    });
  if (currentStreak >= 3)
    smartInsights.push({ iconType: "fire", text: `${currentStreak}-day streak! Keep it going!` });
  if (daysJournaled >= 100)
    smartInsights.push({
      iconType: "medal",
      text: `You've journaled ${daysJournaled} days total — incredible!`,
    });
  if (topTags.length > 0)
    smartInsights.push({ iconType: "tag", text: `Your most used tag is #${topTags[0].tag}` });

  // Milestones
  const milestones: Milestone[] = [
    {
      id: "first",
      emoji: "🌱",
      title: "First Entry",
      desc: "You started your journey",
      unlocked: totalEntries >= 1,
    },
    {
      id: "week",
      emoji: "🔥",
      title: "7-Day Streak",
      desc: "7 days in a row",
      unlocked: longestStreak >= 7,
    },
    {
      id: "month",
      emoji: "🗓️",
      title: "30-Day Streak",
      desc: "30 days in a row",
      unlocked: longestStreak >= 30,
    },
    {
      id: "ten",
      emoji: "✍️",
      title: "10 Entries",
      desc: "A growing habit",
      unlocked: totalEntries >= 10,
    },
    {
      id: "fifty",
      emoji: "📚",
      title: "50 Entries",
      desc: "Committed journaler",
      unlocked: totalEntries >= 50,
    },
    {
      id: "hundred",
      emoji: "💯",
      title: "100 Entries",
      desc: "Century milestone!",
      unlocked: totalEntries >= 100,
    },
    {
      id: "wordsmith",
      emoji: "🖊️",
      title: "Wordsmith",
      desc: "Wrote 10,000 words total",
      unlocked: totalWords >= 10000,
    },
    {
      id: "novelist",
      emoji: "📖",
      title: "Novelist",
      desc: "Wrote 50,000 words total",
      unlocked: totalWords >= 50000,
    },
    {
      id: "consistent",
      emoji: "⭐",
      title: "Consistent",
      desc: "Journaled 25 different days",
      unlocked: daysJournaled >= 25,
    },
    {
      id: "deep",
      emoji: "🌊",
      title: "Deep Thinker",
      desc: "Wrote a 500+ word entry",
      unlocked: longestEntry >= 500,
    },
  ];

  return {
    totalEntries,
    totalWords,
    avgWordsPerEntry,
    longestEntry,
    currentStreak,
    longestStreak,
    longestWeeklyStreak,
    daysJournaled,
    entriesThisYear,
    thisMonthEntries,
    lastMonthEntries,
    calendarYear,
    heatmapData,
    bestDayOfWeek,
    mostActiveHour,
    topActivities,
    moodDistribution,
    moodTrend,
    smartInsights,
    milestones,
    topTags,
  };
}

// ─── Apple Journal-style Activity Calendar ────────────────────────────────────

const FULL_MONTH_NAMES = [
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

function ActivityCalendar({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Build a lookup map
  const countMap: Record<string, number> = {};
  data.forEach((d) => {
    countMap[d.date] = d.count;
  });

  // Navigate months
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth =
      viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = toDateStr(today);
  const CELL = Math.floor((SCREEN_WIDTH - 32 - 32) / 7);

  return (
    <View>
      {/* Month navigation */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text
          onPress={prevMonth}
          style={{
            color: ACCENT,
            fontSize: 22,
            paddingHorizontal: 4,
            paddingVertical: 2,
          }}
        >
          ‹
        </Text>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
          {FULL_MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Text
          onPress={nextMonth}
          style={{
            color: isCurrentMonth ? "#333" : ACCENT,
            fontSize: 22,
            paddingHorizontal: 4,
            paddingVertical: 2,
          }}
        >
          ›
        </Text>
      </View>

      {/* Day-of-week headers */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <View key={i} style={{ width: CELL, alignItems: "center" }}>
            <Text style={{ color: "#444", fontSize: 11, fontWeight: "600" }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: "row", marginBottom: 2 }}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) {
              return (
                <View key={col} style={{ width: CELL, height: CELL + 14 }} />
              );
            }
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = countMap[dateStr] ?? 0;
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;

            return (
              <View
                key={col}
                style={{
                  width: CELL,
                  height: CELL + 14,
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: 4,
                  gap: 4,
                }}
              >
                {/* Date number */}
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isToday ? ACCENT : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: isToday
                        ? "#fff"
                        : isFuture
                          ? "#2a2a2a"
                          : count > 0
                            ? "#fff"
                            : "#555",
                      fontSize: 14,
                      fontWeight: isToday ? "700" : "400",
                    }}
                  >
                    {day}
                  </Text>
                </View>

                {/* Entry dot — white if today (over ACCENT bg), ACCENT if normal day */}
                {count > 0 && (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: isToday
                        ? "rgba(255,255,255,0.85)"
                        : ACCENT,
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: ACCENT,
          }}
        />
        <Text style={{ color: "#444", fontSize: 10 }}>Journaled</Text>
      </View>
    </View>
  );
}

// ─── Mood Trend Chart ─────────────────────────────────────────────────────────

function MoodTrendChart({
  data,
}: {
  data: { week: string; avg: number | null }[];
}) {
  const chartW = SCREEN_WIDTH - 32 - 40 - 16;
  const chartH = 80;
  const validData = data.filter((d) => d.avg !== null);

  if (validData.length < 2) {
    return (
      <View
        style={{
          height: chartH + 24,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#444", fontSize: 12 }}>
          Log moods in entries to see your trend
        </Text>
      </View>
    );
  }

  const segW = chartW / (data.length - 1);
  const yScale = (val: number) => chartH - ((val - 1) / 4) * chartH;
  const getMoodColor = (avg: number) => {
    if (avg < 2) return "#ef4444";
    if (avg < 3) return "#f97316";
    if (avg < 4) return "#a3a3a3";
    if (avg < 4.5) return "#34d399";
    return ACCENT;
  };

  const points = data.map((d, i) => ({
    x: i * segW,
    y: d.avg !== null ? yScale(d.avg) : null,
    ...d,
  }));

  return (
    <View style={{ flexDirection: "row" }}>
      <View
        style={{
          width: 36,
          height: chartH,
          justifyContent: "space-between",
          paddingVertical: 2,
        }}
      >
        {MOOD_ICONS.map((IconFn, i) => (
          <View key={i}>{IconFn(10)}</View>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ height: chartH, position: "relative" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: (i / 4) * chartH,
                height: 1,
                backgroundColor: "#1e1e1e",
              }}
            />
          ))}
          {points.map((p, i) => {
            if (i === 0 || p.y === null) return null;
            const prev = points[i - 1];
            if (prev.y === null) return null;
            const dx = p.x - prev.x,
              dy = p.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`line-${i}`}
                style={{
                  position: "absolute",
                  left: prev.x,
                  top: prev.y - 1,
                  width: len,
                  height: 2,
                  backgroundColor: ACCENT + "66",
                  transformOrigin: "0 50%",
                  transform: [{ rotate: `${angle}deg` }],
                }}
              />
            );
          })}
          {points.map((p, i) => {
            if (p.y === null) return null;
            return (
              <View
                key={`dot-${i}`}
                style={{
                  position: "absolute",
                  left: p.x - 5,
                  top: p.y - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: getMoodColor(p.avg!),
                  borderWidth: 2,
                  borderColor: "#000",
                }}
              />
            );
          })}
        </View>
        <View style={{ flexDirection: "row", marginTop: 6 }}>
          {data.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#444", fontSize: 9 }}>{d.week}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Smart Insight Cards ──────────────────────────────────────────────────────

function SmartInsightCards({ insights }: { insights: { iconType: string; text: string }[] }) {
  if (insights.length === 0) return null;

  const renderIcon = (iconType: string) => {
    const size = 16;
    switch (iconType) {
      case "calendar": return <IconCalendar color={ACCENT} size={size} />;
      case "clock": return <IconClock color={ACCENT} size={size} />;
      case "trendUp": return <IconTrendUp size={size} />;
      case "trendDown": return <IconTrendDown size={size} />;
      case "pen": return <IconPen color={ACCENT} size={size} />;
      case "chat": return <IconChat size={size} />;
      case "fire": return <IconFire size={size} />;
      case "medal": return <IconMedal size={size} />;
      case "tag": return <IconTag size={size} />;
      default: return <IconPen color={ACCENT} size={size} />;
    }
  };

  return (
    <View style={{ gap: 8, marginBottom: 12 }}>
      {insights.map((insight, i) => (
        <View
          key={i}
          style={{
            backgroundColor: "#0f1729",
            borderRadius: 14,
            padding: 14,
            borderLeftWidth: 3,
            borderLeftColor: ACCENT,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{ width: 20, alignItems: "center" }}>
            {renderIcon(insight.iconType)}
          </View>
          <Text style={{ color: "#d1d5db", fontSize: 14, lineHeight: 20, flex: 1 }}>
            {insight.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Milestones ───────────────────────────────────────────────────────────────

const CAROUSEL_CARD_W = 140;

function MilestoneBadge({
  m,
  earned,
  width,
}: {
  m: Milestone;
  earned: boolean;
  width?: number;
}) {
  return (
    <View
      style={[
        mil.badge,
        {
          width: width ?? CAROUSEL_CARD_W,
          backgroundColor: earned ? "#1a1f3c" : "#111",
          borderColor: earned ? ACCENT + "44" : "#1e1e1e",
        },
      ]}
    >
      <MilestoneIcon id={m.id} size={28} unlocked={earned} />
      <Text style={[mil.title, !earned && { color: "#444" }]}>{m.title}</Text>
      <Text style={[mil.desc, !earned && { color: "#2e2e2e" }]}>{m.desc}</Text>
    </View>
  );
}

function MilestonesSection({ milestones }: { milestones: Milestone[] }) {
  const unlocked = milestones.filter((m) => m.unlocked);
  const locked = milestones.filter((m) => !m.unlocked);
  const gridBadgeW = (SCREEN_WIDTH - 32 - 10) / 2;
  const useCarouselForEarned = unlocked.length > 4;

  return (
    <View style={{ marginBottom: 12 }}>
      {/* ── Earned ── */}
      {unlocked.length > 0 && (
        <>
          <Text style={mil.subhead}>Earned</Text>

          {useCarouselForEarned ? (
            /* Carousel when 5+ earned */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingRight: 16 }}
              style={{ marginLeft: -16, paddingLeft: 16 }}
            >
              {unlocked.map((m) => (
                <MilestoneBadge key={m.id} m={m} earned />
              ))}
            </ScrollView>
          ) : (
            /* 2-column grid when 4 or fewer */
            <View style={mil.grid}>
              {unlocked.map((m) => (
                <MilestoneBadge key={m.id} m={m} earned width={gridBadgeW} />
              ))}
            </View>
          )}
        </>
      )}

      {/* ── Upcoming — always carousel ── */}
      {locked.length > 0 && (
        <>
          <Text
            style={[mil.subhead, { marginTop: unlocked.length > 0 ? 18 : 0 }]}
          >
            Upcoming
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingRight: 16 }}
            style={{ marginLeft: -16, paddingLeft: 16 }}
          >
            {locked.map((m) => (
              <MilestoneBadge key={m.id} m={m} earned={false} />
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const mil = StyleSheet.create({
  subhead: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  badge: {
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  title: {
    color: "#e0e0e0",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: { color: "#555", fontSize: 11, textAlign: "center" },
});

// ─── Year Month Bars ──────────────────────────────────────────────────────────

function YearCalendarStrip({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingTop: 8,
        height: 90,
      }}
    >
      {data.map((item, i) => {
        const month = parseInt(item.date.split("-")[1]) - 1;
        const height =
          item.count > 0 ? Math.max((item.count / max) * 52, 8) : 4;
        const has = item.count > 0;
        return (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 3 }}>
            <View style={{ height: 52, justifyContent: "flex-end" }}>
              <View
                style={{
                  width: 14,
                  borderRadius: 4,
                  minHeight: 4,
                  height,
                  backgroundColor: has ? ACCENT : "#2a2a2a",
                  opacity: has ? 0.5 + (item.count / max) * 0.5 : 1,
                }}
              />
            </View>
            {item.count > 0 && (
              <Text style={{ fontSize: 8, fontWeight: "700", color: ACCENT }}>
                {item.count}
              </Text>
            )}
            <Text
              style={{
                color: has ? "#888" : "#3a3a3a",
                fontSize: 9,
                fontWeight: "600",
              }}
            >
              {MONTH_NAMES[month]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Tag Cloud ────────────────────────────────────────────────────────────────

function TagCloud({ tags }: { tags: { tag: string; count: number }[] }) {
  if (tags.length === 0) return null;
  const max = tags[0].count;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {tags.map((t, i) => {
        const scale = 0.75 + (t.count / max) * 0.45;
        const opacity = 0.4 + (t.count / max) * 0.6;
        return (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#1a1a1a",
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor:
                ACCENT +
                Math.round(opacity * 120)
                  .toString(16)
                  .padStart(2, "0"),
            }}
          >
            <Text
              style={{
                fontSize: 11 * scale,
                fontWeight: "600",
                color: t.count === max ? ACCENT : "#666",
              }}
            >
              #{t.tag}
            </Text>
            <Text style={{ color: "#444", fontSize: 9 }}>{t.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SH({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: "#fff",
        fontSize: 20,
        fontWeight: "700",
        letterSpacing: -0.3,
        marginBottom: 10,
        marginTop: 8,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
      const stored = await Storage.getItem(STORAGE_KEYS.journals);
      const journals: Journal[] = stored ? JSON.parse(stored) : [];
      const allNotes: Note[] = [];
      for (const j of journals) {
        const raw = await Storage.getItem(STORAGE_KEYS.notes(j.id));
        const notes: Note[] = raw ? JSON.parse(raw) : [];
        allNotes.push(...notes);
      }
      setData(computeInsights(allNotes));
    } catch (e) {
      console.log("insights error:", e);
    }
    setLoading(false);
  };

  if (loading)
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

  if (!data || data.totalEntries === 0)
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
        <View style={{ marginBottom: 12 }}>
          <IconChartBar color={ACCENT} size={40} />
        </View>
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

  const moodTotal = data.moodDistribution.reduce((a, d) => a + d.count, 0);

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
      <Text style={s.pageTitle}>Insights</Text>

      {/* ── STREAKS ─────────────────────────────── */}
      <SH title="Streaks" />

      {/* Apple Journal purple streak card */}
      <View style={s.streakCard}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={s.streakBigNum}>{data.currentStreak}</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              marginTop: 2,
            }}
          >
            <Text style={{ color: "#c084fc", fontSize: 16, fontWeight: "700" }}>
              Days
            </Text>
            <Text style={{ color: "#a78abf", fontSize: 16 }}> Streak</Text>
          </View>
          {data.currentStreak === 0 && (
            <Text
              style={{
                color: "#a78abf",
                fontSize: 11,
                marginTop: 8,
                lineHeight: 16,
              }}
            >
              Journal at least once{"\n"}a week to build a streak.
            </Text>
          )}
        </View>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.streakIconWrap}>
              <IconCalendar color="#c084fc" size={16} />
            </View>
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {data.entriesThisYear}
              </Text>
              <Text style={{ color: "#c4aee0", fontSize: 11, marginTop: 1 }}>
                Entries This Year
              </Text>
            </View>
          </View>
          <View
            style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)" }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={s.streakIconWrap}>
              <IconClock color="#c084fc" size={16} />
            </View>
            <View>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                {data.daysJournaled}
              </Text>
              <Text style={{ color: "#c4aee0", fontSize: 11, marginTop: 1 }}>
                Days Journaled
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Longest streaks */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <View style={[s.miniCard, { backgroundColor: "#1f1010" }]}>
          <Text style={{ color: "#888", fontSize: 12, lineHeight: 16 }}>
            Longest{"\n"}Daily Streak
          </Text>
          <Text
            style={{
              color: "#ef4444",
              fontSize: 40,
              fontWeight: "800",
              letterSpacing: -1,
            }}
          >
            {data.longestStreak}
          </Text>
          <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600" }}>
            Days
          </Text>
        </View>
        <View style={[s.miniCard, { backgroundColor: "#10101f" }]}>
          <Text style={{ color: "#888", fontSize: 12, lineHeight: 16 }}>
            Longest{"\n"}Weekly Streak
          </Text>
          <Text
            style={{
              color: ACCENT,
              fontSize: 40,
              fontWeight: "800",
              letterSpacing: -1,
            }}
          >
            {data.longestWeeklyStreak}
          </Text>
          <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "600" }}>
            Weeks
          </Text>
        </View>
      </View>

      {/* ── STATS ─────────────────────────────────── */}
      <SH title="Stats" />

      <View style={[s.card, { backgroundColor: "#1a1f3c" }]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 4,
          }}
        >
          <View>
            <Text
              style={{
                color: "#fff",
                fontSize: 52,
                fontWeight: "800",
                letterSpacing: -2,
                lineHeight: 56,
              }}
            >
              {data.entriesThisYear}
            </Text>
            <Text
              style={{
                color: "#6b7db8",
                fontSize: 13,
                lineHeight: 18,
                marginTop: 4,
              }}
            >
              Entries{"\n"}This Year
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", marginTop: 4 }}>
            <Text style={{ color: ACCENT, fontSize: 28, fontWeight: "700" }}>
              {data.totalWords.toLocaleString()}
            </Text>
            <Text style={{ color: "#4a5580", fontSize: 11, marginTop: 2 }}>
              Words Written
            </Text>
          </View>
        </View>
        <YearCalendarStrip data={data.calendarYear} />
      </View>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
        <View style={[s.miniCard, { backgroundColor: "#3d1f1f" }]}>
          <Text
            style={{
              color: "#f87171",
              fontSize: 36,
              fontWeight: "800",
              letterSpacing: -1,
            }}
          >
            {data.daysJournaled}
          </Text>
          <Text style={{ color: "#888", fontSize: 12, lineHeight: 17 }}>
            Days{"\n"}Journaled
          </Text>
        </View>
        <View style={[s.miniCard, { backgroundColor: "#1f2d3d" }]}>
          <Text
            style={{
              color: "#60a5fa",
              fontSize: 36,
              fontWeight: "800",
              letterSpacing: -1,
            }}
          >
            {data.totalWords.toLocaleString()}
          </Text>
          <Text style={{ color: "#888", fontSize: 12, lineHeight: 17 }}>
            Words{"\n"}Written
          </Text>
        </View>
      </View>

      {/* ── ACTIVITY CALENDAR ─────────────────────── */}
      <SH title="Activity" />
      <View style={[s.card, { backgroundColor: "#0d0d0d" }]}>
        <ActivityCalendar data={data.heatmapData} />
      </View>

      {/* ── SMART INSIGHTS ────────────────────────── */}
      <SH title="Your Patterns" />
      <SmartInsightCards insights={data.smartInsights} />

      {/* ── MOOD TREND ────────────────────────────── */}
      <SH title="Mood Trend" />
      <View style={[s.card, { backgroundColor: "#0d0d0d" }]}>
        <Text style={{ color: "#555", fontSize: 11, marginBottom: 12 }}>
          Average mood per week — last 8 weeks
        </Text>
        <MoodTrendChart data={data.moodTrend} />
      </View>

      {/* ── MOOD DISTRIBUTION ─────────────────────── */}
      {data.moodDistribution.length > 0 && (
        <>
          <SH title="Mood Distribution" />
          <View style={[s.card, { backgroundColor: "#111" }]}>
            {data.moodDistribution
              .sort((a, b) => b.count - a.count)
              .map((m, i) => {
                const pct = moodTotal > 0 ? (m.count / moodTotal) * 100 : 0;
                return (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "#888", fontSize: 12, width: 110 }}>
                      {m.label}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        height: 6,
                        backgroundColor: "#2a2a2a",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${pct}%` as any,
                          borderRadius: 3,
                          backgroundColor: m.color,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        width: 34,
                        textAlign: "right",
                        color: m.color,
                      }}
                    >
                      {Math.round(pct)}%
                    </Text>
                  </View>
                );
              })}
          </View>
        </>
      )}

      {/* ── MILESTONES ────────────────────────────── */}
      <SH title="Milestones" />
      <MilestonesSection milestones={data.milestones} />

      {/* ── TOP TAGS ──────────────────────────────── */}
      {data.topTags.length > 0 && (
        <>
          <SH title="Top Tags" />
          <View style={[s.card, { backgroundColor: "#0d0d0d" }]}>
            <TagCloud tags={data.topTags} />
          </View>
        </>
      )}

      {/* ── WRITING PATTERNS ──────────────────────── */}
      <SH title="Writing Patterns" />
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
        {[
          { iconEl: <IconCalendar color={ACCENT} size={20} />, value: data.bestDayOfWeek, label: "Best Day" },
          ...(data.mostActiveHour !== null
            ? [
              {
                iconEl: <IconClock color={ACCENT} size={20} />,
                value: formatHour(data.mostActiveHour),
                label: "Peak Hour",
              },
            ]
            : []),
          {
            iconEl: <IconPen color={ACCENT} size={20} />,
            value: String(data.avgWordsPerEntry),
            label: "Avg Words",
          },
        ].map((c, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: "#1c1c1e",
              borderRadius: 16,
              padding: 14,
              alignItems: "center",
              gap: 4,
            }}
          >
            <View style={{ width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
              {c.iconEl}
            </View>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {c.value}
            </Text>
            <Text style={{ color: "#555", fontSize: 10, fontWeight: "500" }}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  pageTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 20,
  },
  card: { borderRadius: 20, padding: 16, marginBottom: 12 },
  miniCard: { flex: 1, borderRadius: 18, padding: 18, gap: 4 },
  streakCard: {
    backgroundColor: "#3d2d6e",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  streakBigNum: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "800",
    lineHeight: 68,
    letterSpacing: -2,
  },
  streakIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});