import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

const PRAYER_EMOJIS = [
  "🙏", "✝️", "💛", "❤️", "💙", "💚", "🕊️", "⭐", "🌟", "✨",
  "🌸", "🌿", "🍃", "🌙", "☀️", "🔥", "💧", "🫶", "👐", "🌺",
];

const AVAILABLE_TAGS = [
  "family", "health", "career", "relationships",
  "finances", "peace", "guidance", "protection",
  "gratitude", "healing", "faith", "future",
];

const STATUS_CONFIG: Record<PrayerStatus, { label: string; color: string; emoji: string }> = {
  pending: { label: "Praying", color: "#c084fc", emoji: "🙏" },
  answered: { label: "Answered", color: "#4ade80", emoji: "✅" },
  archived: { label: "Archived", color: "#555", emoji: "📦" },
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
  const [formEmoji, setFormEmoji] = useState("🙏");
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
    setFormTitle(""); setFormDesc(""); setFormEmoji("🙏"); setFormTags([]); setFormPrivate(true);
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

      {/* ── Daily Verse ── */}
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
        <Text style={styles.sectionLabelText}>✦ MY PRAYERS</Text>
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
              <Text style={[styles.viewToggleIcon, prayerView === "list" && styles.viewToggleIconActive]}>
                ☰
              </Text>
            </Pressable>
            <Pressable
              onPress={() => toggleView("carousel")}
              style={[styles.viewToggleBtn, prayerView === "carousel" && styles.viewToggleBtnActive]}
            >
              <Text style={[styles.viewToggleIcon, prayerView === "carousel" && styles.viewToggleIconActive]}>
                ⊞
              </Text>
            </Pressable>
          </View>

          {/* Add button */}
          <Pressable
            onPress={openAddForm}
            style={({ pressed }) => [styles.prayerAddBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.prayerAddText}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* Empty prayer state */}
      {pendingPrayers.length === 0 && (
        <Pressable onPress={openAddForm} style={styles.prayerEmpty}>
          <Text style={styles.prayerEmptyIcon}>🙏</Text>
          <Text style={styles.prayerEmptyText}>No active prayers</Text>
          <Text style={styles.prayerEmptySub}>Tap ＋ to add your first prayer</Text>
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
                  <Text style={{ fontSize: 18 }}>{prayer.emoji}</Text>
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
                  <Text style={styles.chevron}>›</Text>
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
                    <Text style={styles.carouselEmoji}>{prayer.emoji}</Text>
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
        <Text style={styles.sectionLabelText}>✦ TODAY'S ENTRIES</Text>
        <Text style={styles.sectionCount}>{todayNotes.length}</Text>
      </View>

      {todayNotes.length === 0 ? (
        <View style={styles.emptyToday}>
          <Text style={styles.emptyTodayIcon}>✍️</Text>
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
              <Text style={styles.todayNoteJournal}>{journal.emoji} {journal.name}</Text>
              <Text style={styles.todayNoteTitle} numberOfLines={1}>{note.title || "Untitled"}</Text>
              <Text style={styles.todayNotePreview} numberOfLines={2}>{note.text}</Text>
            </View>
          </Pressable>
        ))
      )}

      {/* ── Quick Write ── */}
      <View style={[styles.sectionLabel, { marginTop: 28 }]}>
        <Text style={styles.sectionLabelText}>✦ QUICK WRITE</Text>
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
                <Text style={{ fontSize: 20 }}>{j.emoji}</Text>
              </View>
              <Text style={styles.quickJournalName} numberOfLines={1}>{j.name}</Text>
              <Text style={[styles.quickJournalPlus, { color: j.color }]}>＋</Text>
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
                  {PRAYER_EMOJIS.map((e) => (
                    <Pressable
                      key={e}
                      onPress={() => setFormEmoji(e)}
                      style={[styles.emojiBtn, formEmoji === e && { borderColor: "#c084fc", backgroundColor: "#c084fc18" }]}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
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
                    <Text style={{ fontSize: 36 }}>{selectedPrayer.emoji}</Text>
                  </View>
                  <Text style={styles.detailTitle}>{selectedPrayer.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color + "20", borderColor: cfg.color + "50" }]}>
                    <Text style={{ fontSize: 12 }}>{cfg.emoji}</Text>
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
                    <Text style={styles.answeredBtnText}>✅  Mark as Answered</Text>
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
                      <Text style={styles.updateSendText}>→</Text>
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
  chevron: { color: "#333", fontSize: 20 },

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
  updateSendText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  noUpdates: { color: "#333", fontSize: 13, textAlign: "center", paddingVertical: 16 },
  updateCard: { flexDirection: "row", gap: 12, marginBottom: 14 },
  updateDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#c084fc", marginTop: 6 },
  updateText: { color: "#ccc", fontSize: 14, lineHeight: 20 },
  updateDate: { color: "#3a3a3a", fontSize: 11, marginTop: 4 },
});