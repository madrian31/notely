import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage, STORAGE_KEYS } from "./storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type Verse = {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type BibleChapter = {
  reference: string;
  verses: Verse[];
};

type Journal = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

// ─── Bible Books List ─────────────────────────────────────────────────────────

const BIBLE_BOOKS: { name: string; chapters: number }[] = [
  { name: "Genesis", chapters: 50 },
  { name: "Exodus", chapters: 40 },
  { name: "Leviticus", chapters: 27 },
  { name: "Numbers", chapters: 36 },
  { name: "Deuteronomy", chapters: 34 },
  { name: "Joshua", chapters: 24 },
  { name: "Judges", chapters: 21 },
  { name: "Ruth", chapters: 4 },
  { name: "1 Samuel", chapters: 31 },
  { name: "2 Samuel", chapters: 24 },
  { name: "1 Kings", chapters: 22 },
  { name: "2 Kings", chapters: 25 },
  { name: "1 Chronicles", chapters: 29 },
  { name: "2 Chronicles", chapters: 36 },
  { name: "Ezra", chapters: 10 },
  { name: "Nehemiah", chapters: 13 },
  { name: "Esther", chapters: 10 },
  { name: "Job", chapters: 42 },
  { name: "Psalms", chapters: 150 },
  { name: "Proverbs", chapters: 31 },
  { name: "Ecclesiastes", chapters: 12 },
  { name: "Song of Solomon", chapters: 8 },
  { name: "Isaiah", chapters: 66 },
  { name: "Jeremiah", chapters: 52 },
  { name: "Lamentations", chapters: 5 },
  { name: "Ezekiel", chapters: 48 },
  { name: "Daniel", chapters: 12 },
  { name: "Hosea", chapters: 14 },
  { name: "Joel", chapters: 3 },
  { name: "Amos", chapters: 9 },
  { name: "Obadiah", chapters: 1 },
  { name: "Jonah", chapters: 4 },
  { name: "Micah", chapters: 7 },
  { name: "Nahum", chapters: 3 },
  { name: "Habakkuk", chapters: 3 },
  { name: "Zephaniah", chapters: 3 },
  { name: "Haggai", chapters: 2 },
  { name: "Zechariah", chapters: 14 },
  { name: "Malachi", chapters: 4 },
  { name: "Matthew", chapters: 28 },
  { name: "Mark", chapters: 16 },
  { name: "Luke", chapters: 24 },
  { name: "John", chapters: 21 },
  { name: "Acts", chapters: 28 },
  { name: "Romans", chapters: 16 },
  { name: "1 Corinthians", chapters: 16 },
  { name: "2 Corinthians", chapters: 13 },
  { name: "Galatians", chapters: 6 },
  { name: "Ephesians", chapters: 6 },
  { name: "Philippians", chapters: 4 },
  { name: "Colossians", chapters: 4 },
  { name: "1 Thessalonians", chapters: 5 },
  { name: "2 Thessalonians", chapters: 3 },
  { name: "1 Timothy", chapters: 6 },
  { name: "2 Timothy", chapters: 4 },
  { name: "Titus", chapters: 3 },
  { name: "Philemon", chapters: 1 },
  { name: "Hebrews", chapters: 13 },
  { name: "James", chapters: 5 },
  { name: "1 Peter", chapters: 5 },
  { name: "2 Peter", chapters: 3 },
  { name: "1 John", chapters: 5 },
  { name: "2 John", chapters: 1 },
  { name: "3 John", chapters: 1 },
  { name: "Jude", chapters: 1 },
  { name: "Revelation", chapters: 22 },
];

function asString(val: string | string[] | undefined, fallback = ""): string {
  if (!val) return fallback;
  return Array.isArray(val) ? val[0] : val;
}

// ─── Fetch chapter from Bible API ─────────────────────────────────────────────

async function fetchChapter(
  book: string,
  chapter: number,
): Promise<BibleChapter | null> {
  try {
    const url = `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?verse_numbers=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    return {
      reference: data.reference,
      verses: data.verses ?? [],
    };
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BibleReaderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialBook = asString(params.book, "John");
  const initialChapter = parseInt(asString(params.chapter, "1"), 10);

  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  // Verse tap — journal picker
  const [tappedVerse, setTappedVerse] = useState<Verse | null>(null);
  const [showJournalPicker, setShowJournalPicker] = useState(false);
  const [journals, setJournals] = useState<Journal[]>([]);

  // Multi-select mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Verse[]>([]);

  const currentBookMeta =
    BIBLE_BOOKS.find((b) => b.name === selectedBook) ?? BIBLE_BOOKS[43]; // John fallback

  useEffect(() => {
    loadChapter();
  }, [selectedBook, currentChapter]);

  useFocusEffect(
    useCallback(() => {
      loadJournals();
    }, []),
  );

  const loadJournals = async () => {
    const stored = await Storage.getItem(STORAGE_KEYS.journals);
    setJournals(stored ? JSON.parse(stored) : []);
  };

  const handleVerseTap = (verse: Verse) => {
    if (selectionMode) {
      // Toggle selection
      const isSelected = selectedVerses.some((v) => v.verse === verse.verse);
      if (isSelected) {
        const next = selectedVerses.filter((v) => v.verse !== verse.verse);
        setSelectedVerses(next);
        if (next.length === 0) setSelectionMode(false);
      } else {
        setSelectedVerses((prev) => [...prev, verse].sort((a, b) => a.verse - b.verse));
      }
    } else {
      // Single tap — open journal picker immediately
      setSelectedVerses([verse]);
      setTappedVerse(verse);
      setShowJournalPicker(true);
    }
  };

  const handleVerseLongPress = (verse: Verse) => {
    setSelectionMode(true);
    setSelectedVerses([verse]);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedVerses([]);
  };

  const openJournalPickerForSelection = () => {
    if (selectedVerses.length === 0) return;
    setShowJournalPicker(true);
  };

  const goToJournal = (journal: Journal) => {
    if (selectedVerses.length === 0) return;
    setShowJournalPicker(false);
    setSelectionMode(false);

    let verseRef: string;
    let verseText: string;

    if (selectedVerses.length === 1) {
      verseRef = `${selectedBook} ${currentChapter}:${selectedVerses[0].verse}`;
      verseText = selectedVerses[0].text.trim();
    } else {
      const first = selectedVerses[0].verse;
      const last = selectedVerses[selectedVerses.length - 1].verse;
      verseRef = `${selectedBook} ${currentChapter}:${first}-${last}`;
      verseText = selectedVerses.map((v) => `[${v.verse}] ${v.text.trim()}`).join("\n");
    }

    router.push(
      `../note-form?journalId=${journal.id}&journalColor=${encodeURIComponent(journal.color)}&initialTitle=${encodeURIComponent(verseRef)}&verseRef=${encodeURIComponent(verseRef)}&verseText=${encodeURIComponent(verseText)}` as any,
    );
    setSelectedVerses([]);
  };

  const loadChapter = async () => {
    setLoading(true);
    setChapterData(null);
    const data = await fetchChapter(selectedBook, currentChapter);
    setChapterData(data);
    setLoading(false);
  };

  const goNextChapter = () => {
    if (currentChapter < currentBookMeta.chapters) {
      setCurrentChapter((c) => c + 1);
    }
  };

  const goPrevChapter = () => {
    if (currentChapter > 1) {
      setCurrentChapter((c) => c - 1);
    }
  };

  const selectBook = (book: string) => {
    setSelectedBook(book);
    setCurrentChapter(1);
    setShowBookPicker(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        {/* Book + Chapter selectors */}
        <View style={styles.navCenter}>
          <Pressable
            onPress={() => setShowBookPicker(true)}
            style={styles.selectorBtn}
          >
            <Text style={styles.selectorText}>{selectedBook}</Text>
            <Text style={styles.selectorArrow}>▾</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowChapterPicker(true)}
            style={[styles.selectorBtn, { minWidth: 60 }]}
          >
            <Text style={styles.selectorText}>{currentChapter}</Text>
            <Text style={styles.selectorArrow}>▾</Text>
          </Pressable>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* ── Verses ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#c084fc" size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : chapterData ? (
        <FlatList
          data={chapterData.verses}
          keyExtractor={(item) => `${item.verse}`}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.chapterTitle}>
              {selectedBook} {currentChapter}
            </Text>
          }
          renderItem={({ item }) => {
            const isSelected = selectedVerses.some((v) => v.verse === item.verse);
            return (
              <Pressable
                onPress={() => handleVerseTap(item)}
                onLongPress={() => handleVerseLongPress(item)}
                delayLongPress={300}
                style={({ pressed }) => [
                  styles.verseRow,
                  pressed && styles.verseRowPressed,
                  isSelected && styles.verseRowSelected,
                ]}
              >
                {isSelected && (
                  <Text style={styles.verseCheckmark}>✓</Text>
                )}
                <Text style={[styles.verseNumber, isSelected && { color: "#e040fb" }]}>
                  {item.verse}
                </Text>
                <Text style={[styles.verseText, isSelected && { color: "#fff" }]}>
                  {item.text.trim()}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Could not load chapter.{"\n"}Check your internet connection.
          </Text>
        </View>
      )}

      {/* ── Selection Mode Bar ── */}
      {selectionMode && (
        <View style={[styles.selectionBar, { bottom: insets.bottom + 72 }]}>
          <Pressable onPress={cancelSelection} style={styles.selectionCancel}>
            <Text style={styles.selectionCancelText}>✕ Cancel</Text>
          </Pressable>
          <Text style={styles.selectionCount}>
            {selectedVerses.length} verse{selectedVerses.length !== 1 ? "s" : ""} selected
          </Text>
          <Pressable
            onPress={openJournalPickerForSelection}
            style={[styles.selectionJournalBtn, { opacity: selectedVerses.length > 0 ? 1 : 0.4 }]}
          >
            <Text style={styles.selectionJournalBtnText}>✍️ Journal</Text>
          </Pressable>
        </View>
      )}

      {/* ── Prev / Next ── */}
      <View
        style={[styles.chapterNav, { paddingBottom: insets.bottom + 16 }]}
      >
        <Pressable
          onPress={goPrevChapter}
          disabled={currentChapter <= 1}
          style={({ pressed }) => [
            styles.navBtn,
            currentChapter <= 1 && styles.navBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={[
              styles.navBtnText,
              currentChapter <= 1 && styles.navBtnTextDisabled,
            ]}
          >
            ‹ Prev
          </Text>
        </Pressable>

        <Text style={styles.navPageText}>
          {currentChapter} / {currentBookMeta.chapters}
        </Text>

        <Pressable
          onPress={goNextChapter}
          disabled={currentChapter >= currentBookMeta.chapters}
          style={({ pressed }) => [
            styles.navBtn,
            currentChapter >= currentBookMeta.chapters && styles.navBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={[
              styles.navBtnText,
              currentChapter >= currentBookMeta.chapters &&
              styles.navBtnTextDisabled,
            ]}
          >
            Next ›
          </Text>
        </Pressable>
      </View>

      {/* ── Book Picker Modal ── */}
      {showBookPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Book</Text>
              <Pressable onPress={() => setShowBookPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </Pressable>
            </View>
            <FlatList
              data={BIBLE_BOOKS}
              keyExtractor={(b) => b.name}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => selectBook(item.name)}
                  style={({ pressed }) => [
                    styles.pickerItem,
                    item.name === selectedBook && styles.pickerItemSelected,
                    pressed && { backgroundColor: "#1a1a1a" },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item.name === selectedBook &&
                      styles.pickerItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      )}

      {/* ── Chapter Picker Modal ── */}
      {showChapterPicker && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerBox, { maxHeight: 400 }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Chapter</Text>
              <Pressable onPress={() => setShowChapterPicker(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </Pressable>
            </View>
            <FlatList
              data={Array.from(
                { length: currentBookMeta.chapters },
                (_, i) => i + 1,
              )}
              keyExtractor={(c) => `${c}`}
              numColumns={5}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 12, gap: 8 }}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item: ch }) => (
                <Pressable
                  onPress={() => {
                    setCurrentChapter(ch);
                    setShowChapterPicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.chapterCell,
                    ch === currentChapter && styles.chapterCellSelected,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.chapterCellText,
                      ch === currentChapter && styles.chapterCellTextSelected,
                    ]}
                  >
                    {ch}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      )}

      {/* ── Journal Picker Modal (shown when user taps a verse) ── */}
      <Modal
        transparent
        visible={showJournalPicker}
        animationType="slide"
        onRequestClose={() => setShowJournalPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowJournalPicker(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.journalPickerBox}>
              {/* Verse preview */}
              {selectedVerses.length > 0 && (
                <View style={styles.versePreview}>
                  <Text style={styles.versePreviewRef}>
                    {selectedVerses.length === 1
                      ? `${selectedBook} ${currentChapter}:${selectedVerses[0].verse}`
                      : `${selectedBook} ${currentChapter}:${selectedVerses[0].verse}-${selectedVerses[selectedVerses.length - 1].verse}`}
                  </Text>
                  <Text style={styles.versePreviewText} numberOfLines={4}>
                    {selectedVerses.length === 1
                      ? `"${selectedVerses[0].text.trim()}"`
                      : selectedVerses.map((v) => `[${v.verse}] ${v.text.trim()}`).join("\n")}
                  </Text>
                </View>
              )}

              <View style={styles.journalPickerHeader}>
                <Text style={styles.journalPickerTitle}>
                  ✍️  Write about this verse
                </Text>
                <Pressable onPress={() => setShowJournalPicker(false)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.journalPickerSub}>
                Choose a journal for this reflection
              </Text>

              {journals.length === 0 ? (
                <View style={styles.noJournals}>
                  <Text style={styles.noJournalsText}>
                    No journals yet. Create one first.
                  </Text>
                </View>
              ) : (
                journals.map((j) => (
                  <Pressable
                    key={j.id}
                    onPress={() => goToJournal(j)}
                    style={({ pressed }) => [
                      styles.journalPickerRow,
                      pressed && { backgroundColor: "#1a1a1a" },
                    ]}
                  >
                    <View
                      style={[
                        styles.journalPickerIcon,
                        { backgroundColor: j.color + "22" },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{j.emoji}</Text>
                    </View>
                    <Text style={styles.journalPickerName}>{j.name}</Text>
                    <Text style={[styles.journalPickerArrow, { color: j.color }]}>
                      ›
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  backBtn: { width: 36, padding: 4 },
  backText: { color: "#c084fc", fontSize: 28, lineHeight: 28 },
  navCenter: { flexDirection: "row", gap: 8, alignItems: "center" },
  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  selectorText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  selectorArrow: { color: "#555", fontSize: 10 },

  chapterTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  verseRow: {
    flexDirection: "row",
    marginBottom: 14,
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  verseRowPressed: {
    backgroundColor: "#1a1a2e",
  },
  verseNumber: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 22,
    marginTop: 3,
  },
  verseText: { color: "#d0d0d0", fontSize: 16, lineHeight: 26, flex: 1 },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#555", fontSize: 14 },
  errorText: { color: "#555", fontSize: 14, textAlign: "center" },

  chapterNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#111",
  },
  navBtn: {
    backgroundColor: "#161616",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: "#c084fc", fontSize: 14, fontWeight: "600" },
  navBtnTextDisabled: { color: "#555" },
  navPageText: { color: "#444", fontSize: 13 },

  // Pickers
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerBox: {
    backgroundColor: "#161616",
    borderRadius: 16,
    width: 300,
    maxHeight: 500,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#242424",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  pickerTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  pickerClose: { color: "#555", fontSize: 16 },
  pickerItem: { paddingHorizontal: 16, paddingVertical: 13 },
  pickerItemSelected: { backgroundColor: "#1a1a2e" },
  pickerItemText: { color: "#ccc", fontSize: 15 },
  pickerItemTextSelected: { color: "#c084fc", fontWeight: "600" },

  chapterCell: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterCellSelected: { backgroundColor: "#2a1a40" },
  chapterCellText: { color: "#aaa", fontSize: 14, fontWeight: "500" },
  chapterCellTextSelected: { color: "#c084fc", fontWeight: "700" },

  // Journal picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  journalPickerBox: {
    backgroundColor: "#161616",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: "#242424",
    overflow: "hidden",
  },
  versePreview: {
    backgroundColor: "#0e0e1a",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e2e",
  },
  versePreviewRef: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  versePreviewText: {
    color: "#9988cc",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
  },
  journalPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  journalPickerTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  journalPickerSub: {
    color: "#444",
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  journalPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  journalPickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  journalPickerName: { color: "#e0e0e0", fontSize: 15, fontWeight: "500", flex: 1 },
  journalPickerArrow: { fontSize: 22, fontWeight: "300" },
  noJournals: { padding: 20, alignItems: "center" },
  noJournalsText: { color: "#444", fontSize: 13 },

  // Selection mode
  verseRowSelected: {
    backgroundColor: "#1a0a2e",
    borderRadius: 8,
  },
  verseCheckmark: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "700",
    marginRight: 2,
    marginTop: 3,
  },
  selectionBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#3d1f6e",
    zIndex: 50,
  },
  selectionCancel: { paddingVertical: 4, paddingRight: 8 },
  selectionCancelText: { color: "#888", fontSize: 13 },
  selectionCount: { color: "#c084fc", fontSize: 13, fontWeight: "600", flex: 1, textAlign: "center" },
  selectionJournalBtn: {
    backgroundColor: "#c084fc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  selectionJournalBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});