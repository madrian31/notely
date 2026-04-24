import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage, STORAGE_KEYS } from "../storage";
import type { Journal } from "./index";

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

// ─── Bible Books (66 books, used for random daily verse) ─────────────────────

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

// Deterministic "random" based on day of year — same verse buong araw
function getDailyVerseRef(): { book: string; chapter: number; verse: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const book = BIBLE_BOOKS[dayOfYear % BIBLE_BOOKS.length];
  const chapter = (dayOfYear % book.chapters) + 1;
  const verse = (dayOfYear % 20) + 1;

  return { book: book.name, chapter, verse };
}

// ─── Fetch verse from Bible API ───────────────────────────────────────────────

async function fetchDailyVerse(): Promise<DailyVerse | null> {
  try {
    const { book, chapter, verse } = getDailyVerseRef();
    const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}:${verse}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return {
      reference: data.reference,
      text: data.text?.trim().replace(/\n/g, " ") ?? "",
      bookName: book,
      chapter,
      verse,
    };
  } catch {
    // Fallback verse kung walang internet
    return {
      reference: "Philippians 4:13",
      text: "I can do all things through Christ who strengthens me.",
      bookName: "Philippians",
      chapter: 4,
      verse: 13,
    };
  }
}

// ─── Greeting based on time of day ───────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [todayNotes, setTodayNotes] = useState<
    { note: Note; journal: Journal }[]
  >([]);
  const [username, setUsername] = useState("");
  const [streak, setStreak] = useState(0);

  // Load verse once on mount
  useEffect(() => {
    fetchDailyVerse().then((v) => {
      setVerse(v);
      setVerseLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      // Load username
      const name = await Storage.getItem(STORAGE_KEYS.username);
      setUsername(name ?? "");

      // Load journals
      const stored = await Storage.getItem(STORAGE_KEYS.journals);
      const list: Journal[] = stored ? JSON.parse(stored) : [];
      setJournals(list);

      // Load today's notes across all journals
      const today = new Date().toDateString();
      const todayEntries: { note: Note; journal: Journal }[] = [];
      let journaledToday = false;

      for (const j of list) {
        const notesRaw = await Storage.getItem(STORAGE_KEYS.notes(j.id));
        const notes: Note[] = notesRaw ? JSON.parse(notesRaw) : [];
        for (const n of notes) {
          if (new Date(n.date).toDateString() === today) {
            todayEntries.push({ note: n, journal: j });
            journaledToday = true;
          }
        }
      }

      setTodayNotes(todayEntries);

      // Simple streak: count consecutive days with at least 1 entry
      const allDates = new Set<string>();
      for (const j of list) {
        const notesRaw = await Storage.getItem(STORAGE_KEYS.notes(j.id));
        const notes: Note[] = notesRaw ? JSON.parse(notesRaw) : [];
        notes.forEach((n) => allDates.add(new Date(n.date).toDateString()));
      }

      let s = 0;
      const check = new Date();
      while (allDates.has(check.toDateString())) {
        s++;
        check.setDate(check.getDate() - 1);
      }
      setStreak(s);
    } catch (err) {
      console.log("TodayScreen loadData error:", err);
    }
  };

  const goToNoteForm = (journalId: string, journalColor: string) => {
    router.push(
      `../note-form?journalId=${journalId}&journalColor=${encodeURIComponent(journalColor)}` as any,
    );
  };

  const goToNoteList = (journal: Journal) => {
    router.push(
      `../note-list?journalId=${journal.id}&journalName=${encodeURIComponent(journal.name)}&journalColor=${encodeURIComponent(journal.color)}` as any,
    );
  };

  const displayName = username ? username.split(" ")[0] : null;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Today</Text>
      </View>

      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingText}>
            {getGreeting()}{displayName ? `, ${displayName}` : ""} 👋
          </Text>
          <Text style={styles.dateText}>{formatDate(new Date())}</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{streak}</Text>
          </View>
        )}
      </View>

      {/* ── Daily Verse Card ── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>✦ VERSE OF THE DAY</Text>
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
                onPress={() =>
                  router.push(
                    `../bible-reader?book=${encodeURIComponent(verse.bookName)}&chapter=${verse.chapter}` as any,
                  )
                }
                style={styles.readMoreBtn}
              >
                <Text style={styles.readMoreText}>Read chapter ›</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>

      {/* ── Today's Entries ── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>✦ TODAY'S ENTRIES</Text>
        <Text style={styles.sectionCount}>{todayNotes.length}</Text>
      </View>

      {todayNotes.length === 0 ? (
        <View style={styles.emptyToday}>
          <Text style={styles.emptyTodayIcon}>✍️</Text>
          <Text style={styles.emptyTodayText}>Nothing written yet today</Text>
          <Text style={styles.emptyTodaySubtext}>
            Reflect on the verse above and write your thoughts
          </Text>
        </View>
      ) : (
        todayNotes.map(({ note, journal }) => (
          <Pressable
            key={note.id}
            style={({ pressed }) => [
              styles.todayNoteCard,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => goToNoteList(journal)}
          >
            <View
              style={[styles.noteAccent, { backgroundColor: journal.color }]}
            />
            <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 12 }}>
              <Text style={styles.todayNoteJournal}>
                {journal.emoji} {journal.name}
              </Text>
              <Text style={styles.todayNoteTitle} numberOfLines={1}>
                {note.title || "Untitled"}
              </Text>
              <Text style={styles.todayNotePreview} numberOfLines={2}>
                {note.text}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      {/* ── Quick Write — pick a journal ── */}
      <View style={[styles.sectionLabel, { marginTop: 28 }]}>
        <Text style={styles.sectionLabelText}>✦ QUICK WRITE</Text>
      </View>

      {journals.length === 0 ? (
        <View style={styles.noJournalsCard}>
          <Text style={styles.noJournalsText}>
            Create a journal first to start writing ›
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 4 }}
        >
          {journals.map((j) => (
            <Pressable
              key={j.id}
              style={({ pressed }) => [
                styles.quickJournalBtn,
                { borderColor: j.color + "55" },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => goToNoteForm(j.id, j.color)}
            >
              <View
                style={[
                  styles.quickJournalIcon,
                  { backgroundColor: j.color + "22" },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{j.emoji}</Text>
              </View>
              <Text style={styles.quickJournalName} numberOfLines={1}>
                {j.name}
              </Text>
              <Text style={[styles.quickJournalPlus, { color: j.color }]}>
                ＋
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLabel: {
    color: "#555",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    marginTop: 4,
  },
  greetingText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  dateText: { color: "#555", fontSize: 13 },
  streakBadge: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  streakFire: { fontSize: 16 },
  streakCount: { color: "#fff", fontSize: 16, fontWeight: "700" },

  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionLabelText: {
    color: "#444",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  sectionCount: {
    color: "#333",
    fontSize: 11,
    fontWeight: "600",
  },

  // Verse card
  verseCard: {
    backgroundColor: "#0e0e1a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#1e1e35",
  },
  verseText: {
    color: "#d4caff",
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 26,
    marginBottom: 14,
  },
  verseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verseRef: {
    color: "#6655aa",
    fontSize: 13,
    fontWeight: "600",
  },
  readMoreBtn: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a45",
  },
  readMoreText: { color: "#c084fc", fontSize: 12, fontWeight: "600" },

  // Today's entries
  emptyToday: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    marginBottom: 4,
  },
  emptyTodayIcon: { fontSize: 28, marginBottom: 8 },
  emptyTodayText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  emptyTodaySubtext: {
    color: "#444",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  todayNoteCard: {
    backgroundColor: "#111",
    borderRadius: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#1e1e1e",
    overflow: "hidden",
  },
  noteAccent: { width: 4 },
  todayNoteJournal: { color: "#555", fontSize: 11, marginBottom: 3 },
  todayNoteTitle: {
    color: "#f0f0f0",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  todayNotePreview: { color: "#555", fontSize: 13, lineHeight: 18 },

  // Quick write
  quickJournalBtn: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    width: 100,
    borderWidth: 1,
    gap: 6,
  },
  quickJournalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  quickJournalName: {
    color: "#ccc",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  quickJournalPlus: { fontSize: 18, fontWeight: "300" },

  noJournalsCard: {
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e1e1e",
    alignItems: "center",
  },
  noJournalsText: { color: "#444", fontSize: 13 },
});