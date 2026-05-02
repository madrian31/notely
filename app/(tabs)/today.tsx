import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";
import { JournalIcon } from "../../components/create-journal-modal";
import { Storage, STORAGE_KEYS } from "../storage";
import type { Journal } from "./index";

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconList({ color = "#c084fc" }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Line x1="5" y1="4" x2="14" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="5" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="2.5" cy="4" r="1.2" fill={color} />
      <Circle cx="2.5" cy="8" r="1.2" fill={color} />
      <Circle cx="2.5" cy="12" r="1.2" fill={color} />
    </Svg>
  );
}

function IconGrid({ color = "#c084fc" }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Rect x="1" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Rect x="9" y="1" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Rect x="1" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Rect x="9" y="9" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.4" fill="none" />
    </Svg>
  );
}

function IconPlus({ color = "#fff" }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      <Line x1="8" y1="3" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="8" x2="13" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IconPraying({ size = 32, color = "#444" }: { size?: number; color?: string }) {
  // Bootstrap: hand-index-thumb — folded hands / pray gesture
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M6.75 1a.75.75 0 0 1 .75.75V8a.5.5 0 0 0 1 0V5.467l.086-.004c.317-.012.637.008.816.1.134.068.319.224.422.41.038.073.6.336.86 1.579C11.61 7.97 11.822 9.39 12 10c.34 1.28.56 2.5.436 3.367C12.296 14.605 11.36 15 10 15H8.077a.75.75 0 0 1-.545-.232L5.7 12.817l.002-.002.002-.003a.5.5 0 0 0-.706-.707l-.002.002L3.25 13.857A.75.75 0 0 1 2 13.27V11a.75.75 0 0 1 .22-.53l2.53-2.53A.5.5 0 0 0 5 7.5V1.75A.75.75 0 0 1 5.75 1zm1.5 0a.75.75 0 0 1 .75.75v4.5a.5.5 0 0 0 1 0v-4.5a.75.75 0 0 1 1.5 0V8.5a.5.5 0 0 0 1 0V4.75a.75.75 0 0 1 1.5 0V11a.75.75 0 0 1-.22.53l-2.53 2.53A.5.5 0 0 0 11 14.5v.25a.75.75 0 0 1-1.5 0V14a.5.5 0 0 0-.5-.5H8.5a.5.5 0 0 0-.5.5v.75a.75.75 0 0 1-1.5 0V1.75A.75.75 0 0 1 8.25 1z"
        fill={color}
        opacity={0.8}
      />
    </Svg>
  );
}

// Bootstrap check-circle-fill
function IconCheckCircleFill({ color = "#4ade80", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" fill={color} />
    </Svg>
  );
}

// Bootstrap archive
function IconArchiveFill({ color = "#888", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M12.643 15C13.979 15 15 13.845 15 12.5V7H1v5.5C1 13.845 2.021 15 3.357 15zM15 3h-1v-1a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM6 10h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1" fill={color} />
    </Svg>
  );
}

// Bootstrap chevron-right
function IconChevronRight({ color = "#333", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" fill={color} />
    </Svg>
  );
}

// Bootstrap send (arrow-right-circle-fill) for update send button
function IconSend({ color = "#fff", size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M0 8a8 8 0 1 0 16 0A8 8 0 0 0 0 8m4.5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5a.5.5 0 0 1 0-1" fill={color} />
    </Svg>
  );
}

// Helper to render status icon from emoji key
function renderStatusIcon(emoji: string, color: string, size = 14): React.ReactNode {
  if (emoji === "pray") return <IconPraying color={color} size={size} />;
  if (emoji === "check") return <IconCheckCircleFill color={color} size={size} />;
  if (emoji === "archive") return <IconArchiveFill color={color} size={size} />;
  return null;
}

// ─── Aliased / Extra Bootstrap Icons ─────────────────────────────────────────

/** Alias: same as IconPraying */
function IconPray({ color = "#c084fc", size = 22 }: { color?: string; size?: number }) {
  return <IconPraying color={color} size={size} />;
}

/** Alias: same as IconCheckCircleFill */
function IconCheckCircle({ color = "#4ade80", size = 16 }: { color?: string; size?: number }) {
  return <IconCheckCircleFill color={color} size={size} />;
}

/** Alias: same as IconArchiveFill */
function IconArchive({ color = "#555", size = 16 }: { color?: string; size?: number }) {
  return <IconArchiveFill color={color} size={size} />;
}

/** Bootstrap: lock-fill */
function IconLock({ color = "#555", size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" fill={color} />
    </Svg>
  );
}

/** Bootstrap: x-lg */
function IconClose({ color = "#555", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" fill={color} />
    </Svg>
  );
}

/** Bootstrap: pencil-square */
function IconEdit({ color = "#e0e0e0", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" fill={color} />
      <Path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" fill={color} />
    </Svg>
  );
}

/** Bootstrap: trash3 */
function IconTrash({ color = "#f87171", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" fill={color} />
    </Svg>
  );
}

function IconWrite({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path d="M7 25 L9 17 L22 6 L26 10 L14 23 Z" stroke="#444" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
      <Line x1="19" y1="8" x2="24" y2="13" stroke="#444" strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="7" y1="25" x2="13" y2="25" stroke="#444" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function IconWaveEmoji({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Path d="M7 17 Q8 11 10 9 Q12 8 13 10 L14.5 13 Q15.5 15 14 15.5 Q12.5 16 11.5 14 L11 13 Q10.5 11.5 11.5 11 Q12 10.5 12.5 11 L14.5 15" stroke="#fbbf24" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconFire({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path d="M8 1.5c0 3-3 3.5-3 6.5a4 4 0 008 0c0-4-3-4-2.5-7C9.5 1 7 4 6.5 6.5 6 4.5 5 3.5 5 3.5c0 3 1.5 3.5 1.5 5.5a2 2 0 004 0c0-3-1.5-3.5-1.5-7.5z" stroke="#f97316" strokeWidth="1" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

// Section label decorators — small recognizable shapes per section
function SectionDotVerse() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Polygon points="5,0.5 6.5,3.5 10,4 7.5,6.5 8,10 5,8.5 2,10 2.5,6.5 0,4 3.5,3.5" stroke="#444" strokeWidth="1" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function SectionDotPrayer() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Path d="M4.5 2.5 Q3.5 3.5 3.5 5.5 L3.5 7.5 Q3.5 8.5 4.5 8.5 L5.5 8.5 Q6.5 8.5 6.5 7.5 L6.5 5.5 Q6.5 3.5 5.5 2.5 Q5 2 4.5 2.5z" stroke="#444" strokeWidth="1" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function SectionDotEntries() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Rect x="1" y="1.5" width="8" height="7" rx="1.5" stroke="#444" strokeWidth="1" fill="none" />
      <Line x1="3" y1="1" x2="3" y2="2.5" stroke="#444" strokeWidth="1" strokeLinecap="round" />
      <Line x1="7" y1="1" x2="7" y2="2.5" stroke="#444" strokeWidth="1" strokeLinecap="round" />
      <Line x1="1" y1="4" x2="9" y2="4" stroke="#444" strokeWidth="0.9" />
    </Svg>
  );
}

function SectionDotQuickWrite() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Path d="M2 9 L3 6 L8 2 L9 3 L4 7.5 Z" stroke="#444" strokeWidth="1" fill="none" strokeLinejoin="round" />
      <Line x1="6.5" y1="3" x2="8.5" y2="5" stroke="#444" strokeWidth="1" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DailyVerse = {
  reference: string;
  text: string;
  bookName: string;
  chapter: number;
  verse: number;
};

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

type PrayerStatus = "pending" | "answered" | "archived";

type PrayerUpdate = {
  id: string;
  text: string;
  date: string;
};

type Prayer = {
  id: string;
  title: string;
  description: string;
  status: PrayerStatus;
  tags: string[];
  emoji: string;
  isPrivate: boolean;
  createdAt: string;
  answeredAt?: string;
  updates: PrayerUpdate[];
};

type PrayerViewMode = "list" | "carousel";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRAYER_STORAGE_KEY = "prayer_list";
const PRAYER_VIEW_KEY = "prayer_view_mode";
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = SCREEN_WIDTH - 40 - 32; // container padding + carousel padding

const PRAYER_ICONS = [
  { key: "hands-praying", iconStyle: "solid" },
  { key: "cross", iconStyle: "solid" },
  { key: "heart", iconStyle: "solid" },
  { key: "star", iconStyle: "solid" },
  { key: "dove", iconStyle: "solid" },
  { key: "fire", iconStyle: "solid" },
  { key: "sun", iconStyle: "solid" },
  { key: "moon", iconStyle: "solid" },
  { key: "droplet", iconStyle: "solid" },
  { key: "seedling", iconStyle: "solid" },
  { key: "leaf", iconStyle: "solid" },
  { key: "hand-holding-heart", iconStyle: "solid" },
  { key: "shield-halved", iconStyle: "solid" },
  { key: "church", iconStyle: "solid" },
  { key: "book-bible", iconStyle: "solid" },
  { key: "circle-nodes", iconStyle: "solid" },
  { key: "bolt", iconStyle: "solid" },
  { key: "rainbow", iconStyle: "solid" },
  { key: "infinity", iconStyle: "solid" },
  { key: "peace", iconStyle: "solid" },
];

const AVAILABLE_TAGS = [
  "family", "health", "career", "relationships",
  "finances", "peace", "guidance", "protection",
  "gratitude", "healing", "faith", "future",
];

const STATUS_CONFIG: Record<PrayerStatus, { label: string; color: string; emoji: string }> = {
  pending: { label: "Praying", color: "#c084fc", emoji: "pray" },
  answered: { label: "Answered", color: "#4ade80", emoji: "check" },
  archived: { label: "Archived", color: "#555", emoji: "archive" },
};

// ─── Bible helpers ────────────────────────────────────────────────────────────

const BIBLE_BOOKS = [
  { name: "Genesis", chapters: 50 },
  { name: "Psalms", chapters: 150 },
  { name: "Proverbs", chapters: 31 },
  { name: "John", chapters: 21 },
  { name: "Romans", chapters: 16 },
  { name: "Matthew", chapters: 28 },
  { name: "Isaiah", chapters: 66 },
  { name: "Philippians", chapters: 4 },
  { name: "James", chapters: 5 },
  { name: "1 Corinthians", chapters: 16 },
];

function getDailyVerseRef() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const book = BIBLE_BOOKS[dayOfYear % BIBLE_BOOKS.length];
  return { book: book.name, chapter: (dayOfYear % book.chapters) + 1, verse: (dayOfYear % 20) + 1 };
}

async function fetchDailyVerse(): Promise<DailyVerse | null> {
  try {
    const { book, chapter, verse } = getDailyVerseRef();
    const res = await fetch(`https://bible-api.com/${encodeURIComponent(book)}+${chapter}:${verse}`);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return { reference: data.reference, text: data.text?.trim().replace(/\n/g, " ") ?? "", bookName: book, chapter, verse };
  } catch {
    return { reference: "Philippians 4:13", text: "I can do all things through Christ who strengthens me.", bookName: "Philippians", chapter: 4, verse: 13 };
  }
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date) {
  return date.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" });
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const carouselRef = useRef<FlatList>(null);

  // — Existing state —
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [todayNotes, setTodayNotes] = useState<{ note: Note; journal: Journal }[]>([]);
  const [username, setUsername] = useState("");
  const [streak, setStreak] = useState(0);

  // — Prayer state —
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [prayerView, setPrayerView] = useState<PrayerViewMode>("list");
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Add form modal
  const [formVisible, setFormVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEmoji, setFormEmoji] = useState("hands-praying");
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formPrivate, setFormPrivate] = useState(true);

  // Detail modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
  const [updateText, setUpdateText] = useState("");

  // ── Load ──

  useEffect(() => {
    fetchDailyVerse().then((v) => { setVerse(v); setVerseLoading(false); });
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const name = await Storage.getItem(STORAGE_KEYS.username);
      setUsername(name ?? "");

      const stored = await Storage.getItem(STORAGE_KEYS.journals);
      const list: Journal[] = stored ? JSON.parse(stored) : [];
      setJournals(list);

      const today = new Date().toDateString();
      const todayEntries: { note: Note; journal: Journal }[] = [];
      const allDates = new Set<string>();

      for (const j of list) {
        const notesRaw = await Storage.getItem(STORAGE_KEYS.notes(j.id));
        const notes: Note[] = notesRaw ? JSON.parse(notesRaw) : [];
        for (const n of notes) {
          allDates.add(new Date(n.date).toDateString());
          if (new Date(n.date).toDateString() === today) todayEntries.push({ note: n, journal: j });
        }
      }
      setTodayNotes(todayEntries);

      let s = 0;
      const check = new Date();
      while (allDates.has(check.toDateString())) { s++; check.setDate(check.getDate() - 1); }
      setStreak(s);

      // Load prayers
      const pRaw = await Storage.getItem(PRAYER_STORAGE_KEY);
      setPrayers(pRaw ? JSON.parse(pRaw) : []);

      // Load saved view preference
      const savedView = await Storage.getItem(PRAYER_VIEW_KEY);
      if (savedView === "carousel" || savedView === "list") setPrayerView(savedView);
    } catch (err) {
      console.log("TodayScreen loadData error:", err);
    }
  };

  // ── Prayer helpers ──

  const savePrayers = async (updated: Prayer[]) => {
    setPrayers(updated);
    await Storage.setItem(PRAYER_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleView = async (mode: PrayerViewMode) => {
    setPrayerView(mode);
    await Storage.setItem(PRAYER_VIEW_KEY, mode);
  };

  const openAddForm = () => {
    setFormTitle(""); setFormDesc(""); setFormEmoji("hands-praying"); setFormTags([]); setFormPrivate(true);
    setFormVisible(true);
  };

  const saveForm = async () => {
    const trimTitle = formTitle.trim();
    if (!trimTitle) return;
    const newPrayer: Prayer = {
      id: makeId(), title: trimTitle, description: formDesc.trim(),
      status: "pending", tags: formTags, emoji: formEmoji,
      isPrivate: formPrivate, createdAt: new Date().toISOString(), updates: [],
    };
    await savePrayers([newPrayer, ...prayers]);
    setFormVisible(false);
    Keyboard.dismiss();
  };

  const markAnswered = async (prayer: Prayer) => {
    const updated = prayers.map((p) =>
      p.id === prayer.id ? { ...p, status: "answered" as PrayerStatus, answeredAt: new Date().toISOString() } : p
    );
    await savePrayers(updated);
    if (selectedPrayer?.id === prayer.id) setSelectedPrayer({ ...prayer, status: "answered" });
  };

  const addUpdate = async () => {
    const text = updateText.trim();
    if (!text || !selectedPrayer) return;
    const update: PrayerUpdate = { id: makeId(), text, date: new Date().toISOString() };
    const updatedPrayer = { ...selectedPrayer, updates: [update, ...selectedPrayer.updates] };
    await savePrayers(prayers.map((p) => (p.id === selectedPrayer.id ? updatedPrayer : p)));
    setSelectedPrayer(updatedPrayer);
    setUpdateText("");
    Keyboard.dismiss();
  };

  // Only show pending prayers in Today's section
  const pendingPrayers = prayers.filter((p) => p.status === "pending");

  const displayName = username ? username.split(" ")[0] : null;

  // ── Navigation ──

  const goToNoteForm = (journalId: string, journalColor: string) =>
    router.push(`../note-form?journalId=${journalId}&journalColor=${encodeURIComponent(journalColor)}` as any);

  const goToNoteList = (journal: Journal) =>
    router.push(`../note-list?journalId=${journal.id}&journalName=${encodeURIComponent(journal.name)}&journalColor=${encodeURIComponent(journal.color)}` as any);

  const goToPrayerList = () =>
    router.push("../prayer-list" as any);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Today</Text>
      </View>

      <View style={styles.greetingRow}>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Text style={styles.greetingText}>
              {getGreeting()}{displayName ? `, ${displayName}` : ""}
            </Text>
            <IconWaveEmoji size={20} />
          </View>
          <Text style={styles.dateText}>{formatDate(new Date())}</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <IconFire size={16} />
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        )}
      </View>

      {/* ── Daily Verse ── */}
      <View style={styles.sectionLabel}>
        <SectionDotVerse />
        <Text style={styles.sectionLabelText}>VERSE OF THE DAY</Text>
      </View>
      <View style={styles.verseCard}>
        {verseLoading ? (
          <ActivityIndicator color="#c084fc" style={{ padding: 20 }} />
        ) : verse ? (
          <>
            <Text style={styles.verseText}>"{verse.text}"</Text>
            <View style={styles.verseFooter}>
              <Text style={styles.verseRef}>— {verse.reference}</Text>
              <Pressable
                onPress={() => router.push(`../bible-reader?book=${encodeURIComponent(verse.bookName)}&chapter=${verse.chapter}` as any)}
                style={styles.readMoreBtn}
              >
                <Text style={styles.readMoreText}>Read chapter ›</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      {/* ── Prayer Section ── */}
      <View style={[styles.sectionLabel, { marginTop: 8 }]}>
        {/* Left: label + count */}
        <SectionDotPrayer />
        <Text style={styles.sectionLabelText}>MY PRAYERS</Text>
        {pendingPrayers.length > 0 && (
          <Text style={styles.sectionCount}>{pendingPrayers.length}</Text>
        )}

        {/* Right: view toggle + add */}
        <View style={styles.prayerHeaderActions}>
          {/* List/Carousel toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => toggleView("list")}
              style={[styles.viewToggleBtn, prayerView === "list" && styles.viewToggleBtnActive]}
            >
              <IconList color={prayerView === "list" ? "#c084fc" : "#444"} />
            </Pressable>
            <Pressable
              onPress={() => toggleView("carousel")}
              style={[styles.viewToggleBtn, prayerView === "carousel" && styles.viewToggleBtnActive]}
            >
              <IconGrid color={prayerView === "carousel" ? "#c084fc" : "#444"} />
            </Pressable>
          </View>

          {/* Add button */}
          <Pressable
            onPress={openAddForm}
            style={({ pressed }) => [styles.prayerAddBtn, pressed && { opacity: 0.7 }]}
          >
            <IconPlus color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* Empty prayer state */}
      {pendingPrayers.length === 0 && (
        <Pressable onPress={openAddForm} style={styles.prayerEmpty}>
          <View style={{ marginBottom: 10 }}><FontAwesome6 name="hands-praying" size={36} color="#444" /></View>
          <Text style={styles.prayerEmptyText}>No active prayers</Text>
          <Text style={styles.prayerEmptySub}>Tap + to add your first prayer</Text>
        </Pressable>
      )}

      {/* ── LIST VIEW ── */}
      {prayerView === "list" && pendingPrayers.length > 0 && (
        <View style={styles.prayerList}>
          {pendingPrayers.slice(0, 3).map((prayer) => {
            const cfg = STATUS_CONFIG[prayer.status];
            return (
              <Pressable
                key={prayer.id}
                style={({ pressed }) => [styles.prayerListCard, pressed && { opacity: 0.75 }]}
                onPress={() => { setSelectedPrayer(prayer); setDetailVisible(true); }}
              >
                <View style={[styles.prayerListAccent, { backgroundColor: cfg.color }]} />
                <View style={styles.prayerListEmojiBg}>
                  <FontAwesome6 name={prayer.emoji || "hands-praying"} size={16} color="#c084fc" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prayerListTitle} numberOfLines={1}>{prayer.title}</Text>
                  {prayer.description ? (
                    <Text style={styles.prayerListDesc} numberOfLines={1}>{prayer.description}</Text>
                  ) : null}
                  {prayer.tags.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      {prayer.tags.slice(0, 3).map((t) => (
                        <View key={t} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.prayerListRight}>
                  {prayer.updates.length > 0 && (
                    <View style={styles.updateBadge}>
                      <Text style={styles.updateBadgeText}>{prayer.updates.length}</Text>
                    </View>
                  )}
                  <IconChevronRight color="#333" size={16} />
                </View>
              </Pressable>
            );
          })}

          {/* See all */}
          {prayers.length > 0 && (
            <Pressable onPress={goToPrayerList} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>
                See all {prayers.length} prayer{prayers.length !== 1 ? "s" : ""} ›
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── CAROUSEL VIEW ── */}
      {prayerView === "carousel" && pendingPrayers.length > 0 && (
        <View>
          <FlatList
            ref={carouselRef}
            data={pendingPrayers}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            contentContainerStyle={{ gap: 12, paddingRight: 12 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 12));
              setCarouselIndex(idx);
            }}
            renderItem={({ item: prayer }: { item: Prayer }) => {
              const cfg = STATUS_CONFIG[prayer.status as PrayerStatus];
              return (
                <Pressable
                  style={({ pressed }) => [styles.carouselCard, { width: CARD_WIDTH }, pressed && { opacity: 0.85 }]}
                  onPress={() => { setSelectedPrayer(prayer); setDetailVisible(true); }}
                >
                  {/* Emoji top-left */}
                  <View style={styles.carouselEmojiBg}>
                    <FontAwesome6 name={prayer.emoji || "hands-praying"} size={28} color="#c084fc" />
                  </View>

                  {/* Content below */}
                  <Text style={styles.carouselTitle} numberOfLines={2}>{prayer.title}</Text>
                  {prayer.description ? (
                    <Text style={styles.carouselDesc} numberOfLines={2}>{prayer.description}</Text>
                  ) : null}
                  {prayer.tags.length > 0 && (
                    <View style={styles.carouselTags}>
                      {prayer.tags.slice(0, 3).map((t: string) => (
                        <View key={t} style={[styles.tagChip, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "30" }]}>
                          <Text style={[styles.tagChipText, { color: cfg.color }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View style={styles.carouselFooter}>
                    <View style={[styles.carouselStatusDot, { backgroundColor: cfg.color }]} />
                    <Text style={[styles.carouselStatus, { color: cfg.color }]}>{cfg.label}</Text>
                    {prayer.updates.length > 0 && (
                      <View style={[styles.updateBadge, { marginLeft: 4 }]}>
                        <Text style={styles.updateBadgeText}>{prayer.updates.length}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />

          {/* Dots indicator */}
          {pendingPrayers.length > 1 && (
            <View style={styles.dotsRow}>
              {pendingPrayers.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === carouselIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* See all */}
          {prayers.length > 0 && (
            <Pressable onPress={goToPrayerList} style={[styles.seeAllBtn, { marginTop: 4 }]}>
              <Text style={styles.seeAllText}>
                See all {prayers.length} prayer{prayers.length !== 1 ? "s" : ""} ›
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* ── Today's Entries ── */}
      <View style={[styles.sectionLabel, { marginTop: 28 }]}>
        <SectionDotEntries />
        <Text style={styles.sectionLabelText}>TODAY'S ENTRIES</Text>
        <Text style={styles.sectionCount}>{todayNotes.length}</Text>
      </View>

      {todayNotes.length === 0 ? (
        <View style={styles.emptyToday}>
          <View style={{ marginBottom: 8 }}><IconWrite size={32} /></View>
          <Text style={styles.emptyTodayText}>Nothing written yet today</Text>
          <Text style={styles.emptyTodaySubtext}>Reflect on the verse above and write your thoughts</Text>
        </View>
      ) : (
        todayNotes.map(({ note, journal }) => (
          <Pressable
            key={note.id}
            style={({ pressed }) => [styles.todayNoteCard, pressed && { opacity: 0.7 }]}
            onPress={() => goToNoteList(journal)}
          >
            <View style={[styles.noteAccent, { backgroundColor: journal.color }]} />
            <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <JournalIcon iconId={journal.iconId ?? "journals"} color={journal.color} size={12} />
                <Text style={styles.todayNoteJournal}>{journal.name}</Text>
              </View>
              <Text style={styles.todayNoteTitle} numberOfLines={1}>{note.title || "Untitled"}</Text>
              <Text style={styles.todayNotePreview} numberOfLines={2}>{note.text}</Text>
            </View>
          </Pressable>
        ))
      )}

      {/* ── Quick Write ── */}
      <View style={[styles.sectionLabel, { marginTop: 28 }]}>
        <SectionDotQuickWrite />
        <Text style={styles.sectionLabelText}>QUICK WRITE</Text>
      </View>

      {journals.length === 0 ? (
        <View style={styles.noJournalsCard}>
          <Text style={styles.noJournalsText}>Create a journal first to start writing ›</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
          {journals.map((j) => (
            <Pressable
              key={j.id}
              style={({ pressed }) => [styles.quickJournalBtn, { borderColor: j.color + "55" }, pressed && { opacity: 0.7 }]}
              onPress={() => goToNoteForm(j.id, j.color)}
            >
              <View style={[styles.quickJournalIcon, { backgroundColor: j.color + "22" }]}>
                <JournalIcon iconId={j.iconId ?? "journals"} color={j.color} size={24} />
              </View>
              <Text style={styles.quickJournalName} numberOfLines={1}>{j.name}</Text>
              <View style={{ marginTop: 2 }}><IconPlus color={j.color} /></View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════ */}

      {/* ── Add Prayer Modal ── */}
      <Modal
        visible={formVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setFormVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => setFormVisible(false)} style={styles.modalHeaderBtn}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Prayer</Text>
            <Pressable onPress={saveForm} style={styles.modalHeaderBtn}>
              <Text style={[styles.modalSave, { color: "#c084fc" }]}>Save</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            {/* Emoji */}
            <View>
              <Text style={styles.fieldLabel}>ICON</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {PRAYER_ICONS.map((icon) => (
                    <Pressable
                      key={icon.key}
                      onPress={() => setFormEmoji(icon.key)}
                      style={[styles.emojiBtn, formEmoji === icon.key && { borderColor: "#c084fc", backgroundColor: "#c084fc18" }]}
                    >
                      <FontAwesome6 name={icon.key} size={20} color={formEmoji === icon.key ? "#c084fc" : "#666"} />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Title */}
            <View>
              <Text style={styles.fieldLabel}>PRAYER</Text>
              <TextInput
                style={styles.textInput}
                value={formTitle}
                onChangeText={setFormTitle}
                placeholder="What are you praying for?"
                placeholderTextColor="#444"
                selectionColor="#c084fc"
                autoFocus
                maxLength={80}
              />
            </View>

            {/* Description */}
            <View>
              <Text style={styles.fieldLabel}>DETAILS (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formDesc}
                onChangeText={setFormDesc}
                placeholder="Add your heart's intention..."
                placeholderTextColor="#444"
                selectionColor="#c084fc"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {/* Tags */}
            <View>
              <Text style={styles.fieldLabel}>TAGS</Text>
              <View style={styles.tagGrid}>
                {AVAILABLE_TAGS.map((tag) => {
                  const active = formTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => setFormTags(active ? formTags.filter((t) => t !== tag) : [...formTags, tag])}
                      style={[styles.tagPill, active && styles.tagPillActive]}
                    >
                      <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>{tag}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>


          </ScrollView>
        </View>
      </Modal>

      {/* ── Prayer Detail Modal ── */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setDetailVisible(false)}
      >
        {selectedPrayer && (() => {
          const cfg = STATUS_CONFIG[selectedPrayer.status];
          return (
            <View style={styles.modalContainer}>
              <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={() => setDetailVisible(false)} style={styles.modalHeaderBtn}>
                  <Text style={styles.modalCancel}>Close</Text>
                </Pressable>
                <Text style={styles.modalTitle}>Prayer</Text>
                <Pressable onPress={goToPrayerList} style={styles.modalHeaderBtn}>
                  <Text style={[styles.modalSave, { color: "#c084fc" }]}>All ›</Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                {/* Head */}
                <View style={styles.detailHead}>
                  <View style={[styles.detailEmojiBg, { backgroundColor: cfg.color + "20" }]}>
                    <FontAwesome6 name={selectedPrayer.emoji || "hands-praying"} size={32} color="#c084fc" />
                  </View>
                  <Text style={styles.detailTitle}>{selectedPrayer.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color + "20", borderColor: cfg.color + "50" }]}>
                    <View>{renderStatusIcon(cfg.emoji, cfg.color, 13)}</View>
                    <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  {selectedPrayer.description ? (
                    <Text style={styles.detailDesc}>{selectedPrayer.description}</Text>
                  ) : null}
                  {selectedPrayer.tags.length > 0 && (
                    <View style={styles.detailTags}>
                      {selectedPrayer.tags.map((t) => (
                        <View key={t} style={styles.tagChip}><Text style={styles.tagChipText}>{t}</Text></View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.detailDate}>
                    Started {new Date(selectedPrayer.createdAt).toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
                  </Text>
                </View>

                {/* Mark answered */}
                {selectedPrayer.status === "pending" && (
                  <Pressable
                    onPress={() => markAnswered(selectedPrayer)}
                    style={({ pressed }) => [styles.answeredBtn, pressed && { opacity: 0.75 }]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><IconCheckCircleFill color="#4ade80" size={16} /><Text style={styles.answeredBtnText}>Mark as Answered</Text></View>
                  </Pressable>
                )}

                {/* Updates */}
                <View style={styles.updateSection}>
                  <Text style={styles.fieldLabel}>PRAYER UPDATES</Text>
                  <View style={styles.updateInputRow}>
                    <TextInput
                      style={styles.updateInput}
                      value={updateText}
                      onChangeText={setUpdateText}
                      placeholder="Add a note or update..."
                      placeholderTextColor="#444"
                      selectionColor="#c084fc"
                      multiline
                    />
                    <Pressable onPress={addUpdate} style={({ pressed }) => [styles.updateSendBtn, pressed && { opacity: 0.7 }]}>
                      <IconSend color="#fff" size={20} />
                    </Pressable>
                  </View>
                  {selectedPrayer.updates.length === 0 && (
                    <Text style={styles.noUpdates}>No updates yet. Journal your prayer journey here.</Text>
                  )}
                  {selectedPrayer.updates.map((u) => (
                    <View key={u.id} style={styles.updateCard}>
                      <View style={styles.updateDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.updateText}>{u.text}</Text>
                        <Text style={styles.updateDate}>
                          {new Date(u.date).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          );
        })()}
      </Modal>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  headerLabel: { color: "#555", fontSize: 13, fontWeight: "500", letterSpacing: 0.5, textTransform: "uppercase" },

  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28, marginTop: 4 },
  greetingText: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 2 },
  dateText: { color: "#555", fontSize: 13 },
  streakBadge: { backgroundColor: "#1a1a1a", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#2a2a2a" },
  streakFire: { fontSize: 16 },
  streakCount: { color: "#fff", fontSize: 16, fontWeight: "700" },

  sectionLabel: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  sectionLabelText: { color: "#444", fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  sectionCount: { color: "#333", fontSize: 11, fontWeight: "600", flex: 1 },

  // Verse
  verseCard: { backgroundColor: "#0e0e1a", borderRadius: 16, padding: 20, marginBottom: 28, borderWidth: 1, borderColor: "#1e1e35" },
  verseText: { color: "#d4caff", fontSize: 16, fontStyle: "italic", lineHeight: 26, marginBottom: 14 },
  verseFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  verseRef: { color: "#6655aa", fontSize: 13, fontWeight: "600" },
  readMoreBtn: { backgroundColor: "#1a1a2e", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#2a2a45" },
  readMoreText: { color: "#c084fc", fontSize: 12, fontWeight: "600" },

  // Prayer section header actions
  prayerHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: "auto" },
  viewToggle: { flexDirection: "row", backgroundColor: "#1a1a1a", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#252525" },
  viewToggleBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  viewToggleBtnActive: { backgroundColor: "#2a2a2a" },
  viewToggleIcon: { fontSize: 14, color: "#444" },
  viewToggleIconActive: { color: "#c084fc" },
  prayerAddBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#c084fc", alignItems: "center", justifyContent: "center" },
  prayerAddText: { color: "#fff", fontSize: 18, lineHeight: 22 },

  // Prayer empty
  prayerEmpty: { backgroundColor: "#111", borderRadius: 16, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#1e1e1e", borderStyle: "dashed", marginBottom: 4 },
  prayerEmptyIcon: { fontSize: 32, marginBottom: 8 },
  prayerEmptyText: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  prayerEmptySub: { color: "#444", fontSize: 12 },

  // List view
  prayerList: { gap: 8, marginBottom: 4 },
  prayerListCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#1e1e1e", paddingVertical: 10, paddingRight: 12 },
  prayerListAccent: { width: 4, alignSelf: "stretch" },
  prayerListEmojiBg: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", marginHorizontal: 10, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a" },
  prayerListTitle: { color: "#f0f0f0", fontSize: 14, fontWeight: "600" },
  prayerListDesc: { color: "#555", fontSize: 12, marginTop: 2 },
  prayerListRight: { alignItems: "center", gap: 4 },
  chevron: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },

  // Carousel view
  carouselCard: {
    backgroundColor: "#111",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    overflow: "hidden",
  },
  carouselGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 80, borderRadius: 20 },
  carouselEmojiBg: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 16, backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a" },
  carouselEmoji: { fontSize: 32 },
  carouselTitle: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 24, marginBottom: 8 },
  carouselDesc: { color: "#666", fontSize: 13, lineHeight: 20, marginBottom: 12 },
  carouselTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  carouselFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: "auto" },
  carouselStatusDot: { width: 6, height: 6, borderRadius: 3 },
  carouselStatus: { fontSize: 12, fontWeight: "600" },
  carouselLock: { fontSize: 11, marginLeft: "auto" },

  // Dots
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2a2a2a" },
  dotActive: { backgroundColor: "#c084fc", width: 18 },

  // See all
  seeAllBtn: { alignItems: "center", paddingVertical: 12 },
  seeAllText: { color: "#c084fc", fontSize: 13, fontWeight: "600" },

  // Shared chips
  tagChip: { backgroundColor: "#1e1e1e", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "transparent" },
  tagChipText: { color: "#666", fontSize: 11, fontWeight: "500" },
  updateBadge: { backgroundColor: "#c084fc22", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  updateBadgeText: { color: "#c084fc", fontSize: 11, fontWeight: "700" },

  // Today's entries
  emptyToday: { alignItems: "center", paddingVertical: 24, backgroundColor: "#111", borderRadius: 16, borderWidth: 1, borderColor: "#1e1e1e", marginBottom: 4 },
  emptyTodayIcon: { fontSize: 28, marginBottom: 8 },
  emptyTodayText: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  emptyTodaySubtext: { color: "#444", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
  todayNoteCard: { backgroundColor: "#111", borderRadius: 14, marginBottom: 8, flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderColor: "#1e1e1e", overflow: "hidden" },
  noteAccent: { width: 4 },
  todayNoteJournal: { color: "#555", fontSize: 11, marginBottom: 3 },
  todayNoteTitle: { color: "#f0f0f0", fontSize: 15, fontWeight: "600", marginBottom: 3 },
  todayNotePreview: { color: "#555", fontSize: 13, lineHeight: 18 },

  // Quick write
  quickJournalBtn: { backgroundColor: "#111", borderRadius: 14, padding: 14, alignItems: "center", width: 100, borderWidth: 1, gap: 6 },
  quickJournalIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  quickJournalName: { color: "#ccc", fontSize: 11, fontWeight: "500", textAlign: "center" },
  quickJournalPlus: { fontSize: 18, fontWeight: "300" },
  noJournalsCard: { backgroundColor: "#111", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#1e1e1e", alignItems: "center" },
  noJournalsText: { color: "#444", fontSize: 13 },

  // Modal shared
  modalContainer: { flex: 1, backgroundColor: "#161616" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "#161616", borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  modalHeaderBtn: { width: 70 },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  modalCancel: { color: "#555", fontSize: 15 },
  modalSave: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  fieldLabel: { color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  textInput: { backgroundColor: "#1a1a1a", borderRadius: 12, color: "#f0f0f0", fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#252525" },
  textArea: { height: 110, paddingTop: 14 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  tagPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#222", backgroundColor: "#111" },
  tagPillActive: { borderColor: "#c084fc", backgroundColor: "#c084fc18" },
  tagPillText: { color: "#555", fontSize: 13 },
  tagPillTextActive: { color: "#c084fc", fontWeight: "600" },
  privateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1a1a1a", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#252525" },
  privateLabel: { color: "#e0e0e0", fontSize: 15, fontWeight: "500" },
  privateSub: { color: "#555", fontSize: 12, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: "#333", padding: 3, justifyContent: "center" },
  toggleOn: { backgroundColor: "#c084fc40" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#555" },
  toggleThumbOn: { backgroundColor: "#c084fc", alignSelf: "flex-end" },

  // Detail modal
  detailHead: { alignItems: "center", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#1a1a1a", marginBottom: 20 },
  detailEmojiBg: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  detailTitle: { color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  statusBadgeText: { fontSize: 13, fontWeight: "600" },
  detailDesc: { color: "#888", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 12 },
  detailTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 12 },
  detailDate: { color: "#3a3a3a", fontSize: 12, fontWeight: "500" },
  answeredBtn: { backgroundColor: "#4ade8018", borderWidth: 1, borderColor: "#4ade8040", borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 20 },
  answeredBtnText: { color: "#4ade80", fontSize: 15, fontWeight: "600" },
  updateSection: { marginBottom: 20 },
  updateInputRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 16 },
  updateInput: { flex: 1, backgroundColor: "#1a1a1a", borderRadius: 12, color: "#f0f0f0", fontSize: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#252525", maxHeight: 80 },
  updateSendBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: "#c084fc", alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  updateSendText: { color: "#fff" },
  noUpdates: { color: "#333", fontSize: 13, textAlign: "center", paddingVertical: 16 },
  updateCard: { flexDirection: "row", gap: 12, marginBottom: 14 },
  updateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#c084fc", marginTop: 6 },
  updateText: { color: "#ccc", fontSize: 14, lineHeight: 20 },
  updateDate: { color: "#3a3a3a", fontSize: 11, marginTop: 4 },
});