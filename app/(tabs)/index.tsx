import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import CreateJournalModal, { JournalIcon } from "../../components/create-journal-modal";
import { GreetingHeader } from "../../components/greeting-header";
import { Storage, STORAGE_KEYS } from "../storage";

// ─── Stat Icons ───────────────────────────────────────────────────────────────
function StatIconJournals({ color = "#888" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="4" y="6" width="14" height="13" rx="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="6" y="3" width="12" height="13" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
      <Line x1="7" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="7" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function StatIconEntries({ color = "#888" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M4 4h14v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="7" y1="9" x2="15" y2="9" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="7" y1="12" x2="15" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="7" y1="15" x2="11" y2="15" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M4 4l7-2 7 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StatIconWords({ color = "#888" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M3 6h16M3 10h16M3 14h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="17" cy="17" r="3.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="19.5" y1="19.5" x2="21" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function EmptyJournalIcon({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Rect x="8" y="12" width="30" height="28" rx="4" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="12" y="8" width="28" height="28" rx="3.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="16" y1="22" x2="32" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="27" x2="28" y2="27" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="32" x2="24" y2="32" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export type Journal = {
  id: string;
  name: string;
  color: string;
  emoji: string;   // kept for backward compat with old data
  iconId: string;  // new SF Symbols-style icon id
  createdAt: string;
};

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

const JOURNAL_COLORS = [
  "#d45f7f", "#e05252", "#d47bb5", "#e08a8a",
  "#c9956e", "#e0994d", "#3ecfb2", "#4db8e8",
  "#3a6ed4", "#89b4d4", "#8f9de0", "#9c7ae0",
  "#ffffff", "#c084fc",
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [totalWords, setTotalWords] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newJournalName, setNewJournalName] = useState("");
  const [selectedColor, setSelectedColor] = useState(JOURNAL_COLORS[0]);
  const [selectedIconId, setSelectedIconId] = useState("journals");

  // Press-hold menu
  const [menuJournal, setMenuJournal] = useState<Journal | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Edit modal (reuses create modal fields)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadJournals();
    }, []),
  );

  const loadJournals = async () => {
    try {
      const stored = await Storage.getItem(STORAGE_KEYS.journals);
      const list: Journal[] = stored ? JSON.parse(stored) : [];
      setJournals(list);

      let wordCount = 0;
      let noteCount = 0;
      const counts: Record<string, number> = {};

      for (const j of list) {
        const notesRaw = await Storage.getItem(STORAGE_KEYS.notes(j.id));
        const notes: Note[] = notesRaw ? JSON.parse(notesRaw) : [];
        counts[j.id] = notes.length;
        noteCount += notes.length;
        wordCount += notes.reduce(
          (acc, n) => acc + n.text.trim().split(/\s+/).filter(Boolean).length,
          0,
        );
      }

      setNoteCounts(counts);
      setTotalNotes(noteCount);
      setTotalWords(wordCount);
    } catch (err) {
      console.log("loadJournals error:", err);
    }
  };

  const openAddModal = () => {
    setNewJournalName("");
    setSelectedColor(
      JOURNAL_COLORS[Math.floor(Math.random() * JOURNAL_COLORS.length)],
    );
    setSelectedIconId("journals");
    setModalVisible(true);
  };

  const saveNewJournal = async (data: { name: string; color: string; iconId: string }) => {
    const trimmed = data.name.trim();
    if (!trimmed) return;
    const newJournal: Journal = {
      id: Date.now().toString(),
      name: trimmed,
      color: data.color,
      emoji: data.iconId, // keep field for compatibility
      iconId: data.iconId,
      createdAt: new Date().toISOString(),
    };
    const updated = [...journals, newJournal];
    setJournals(updated);
    await Storage.setItem(STORAGE_KEYS.journals, JSON.stringify(updated));
    setModalVisible(false);
  };



  const deleteJournal = async (journal: Journal) => {
    const updated = journals.filter((j) => j.id !== journal.id);
    setJournals(updated);
    await Storage.setItem(STORAGE_KEYS.journals, JSON.stringify(updated));
    // Also remove its notes
    await Storage.removeItem(STORAGE_KEYS.notes(journal.id));
    setMenuVisible(false);
    setMenuJournal(null);
  };

  const openEditModal = (journal: Journal) => {
    setEditingJournal(journal);
    setNewJournalName(journal.name);
    setSelectedColor(journal.color);
    setSelectedIconId(journal.iconId ?? "journals");
    setMenuVisible(false);
    setMenuJournal(null);
    setEditModalVisible(true);
  };

  const saveEditedJournal = async (data: { name: string; color: string; iconId: string }) => {
    if (!editingJournal) return;
    const trimmed = data.name.trim();
    if (!trimmed) return;
    const updated = journals.map((j) =>
      j.id === editingJournal.id
        ? { ...j, name: trimmed, color: data.color, emoji: data.iconId, iconId: data.iconId }
        : j,
    );
    setJournals(updated);
    await Storage.setItem(STORAGE_KEYS.journals, JSON.stringify(updated));
    setEditModalVisible(false);
    setEditingJournal(null);
  };

  const goToNoteList = (item: Journal) => {
    router.push(
      `../note-list?journalId=${item.id}&journalName=${encodeURIComponent(item.name)}&journalColor=${encodeURIComponent(item.color)}` as any,
    );
  };

  const renderJournal = ({ item }: { item: Journal }) => {
    const count = noteCounts[item.id] ?? 0;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.journalCard,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => goToNoteList(item)}
        onLongPress={() => {
          setMenuJournal(item);
          setMenuVisible(true);
        }}
        delayLongPress={400}
      >
        <View style={[styles.journalAccent, { backgroundColor: item.color }]} />
        <View
          style={[styles.journalIcon, { backgroundColor: item.color + "22" }]}
        >
          <JournalIcon iconId={item.iconId ?? "journals"} color={item.color} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.journalName}>{item.name}</Text>
          <Text style={styles.journalSub}>
            {new Date(item.createdAt).toLocaleDateString("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.noteCount, { color: item.color }]}>{count}</Text>
          <Text style={[styles.chevron, { color: item.color }]}>›</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Journal</Text>
      </View>

      <GreetingHeader />

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <StatIconJournals color="#c084fc" />
          <Text style={styles.statValue}>{journals.length}</Text>
          <Text style={styles.statLabel}>Journals</Text>
        </View>
        <View style={styles.statCard}>
          <StatIconEntries color="#60a5fa" />
          <Text style={styles.statValue}>{totalNotes}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statCard}>
          <StatIconWords color="#34d399" />
          <Text style={styles.statValue}>{totalWords.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>My Journals</Text>

      {journals.length === 0 ? (
        <View style={styles.emptyState}>
          <EmptyJournalIcon color="#333" />
          <Text style={styles.emptyText}>No journals yet</Text>
          <Text style={styles.emptySub}>
            Tap the + button below to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={(j) => j.id}
          renderItem={renderJournal}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Floating Action Button ── */}
      <Pressable
        onPress={openAddModal}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + 24 },
          pressed && styles.fabPressed,
        ]}
      >
        <View style={styles.fabPlus}>
          <View style={styles.fabPlusH} />
          <View style={styles.fabPlusV} />
        </View>
      </Pressable>

      {/* ── Press-hold Options Menu ── */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuBox}>
              <View style={styles.menuHeader}>
                <View
                  style={[
                    styles.menuJournalIcon,
                    { backgroundColor: (menuJournal?.color ?? "#c084fc") + "22" },
                  ]}
                >
                  <JournalIcon iconId={menuJournal?.iconId ?? "journals"} color={menuJournal?.color ?? "#c084fc"} size={20} />
                </View>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {menuJournal?.name}
                </Text>
                <Pressable
                  onPress={() => setMenuVisible(false)}
                  style={styles.menuClose}
                  hitSlop={8}
                >
                  <Svg width={18} height={18} viewBox="0 0 18 18">
                    <Line x1="4" y1="4" x2="14" y2="14" stroke="#555" strokeWidth="1.8" strokeLinecap="round" />
                    <Line x1="14" y1="4" x2="4" y2="14" stroke="#555" strokeWidth="1.8" strokeLinecap="round" />
                  </Svg>
                </Pressable>
              </View>

              <Pressable
                onPress={() => menuJournal && openEditModal(menuJournal)}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && { backgroundColor: "#1e1e1e" },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 18 18">
                  <Path d="M3 15 L5 10 L13 2 L16 5 L8 13 Z" stroke="#e0e0e0" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                  <Line x1="11" y1="3.5" x2="14.5" y2="7" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round" />
                  <Line x1="3" y1="15" x2="7" y2="15" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round" />
                </Svg>
                <Text style={styles.menuRowText}>Edit Journal</Text>
              </Pressable>

              <View style={styles.menuDivider} />

              <Pressable
                onPress={() => menuJournal && deleteJournal(menuJournal)}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && { backgroundColor: "#1e1e1e" },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 18 18">
                  <Polyline points="3,5 15,5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                  <Path d="M6 5V3h6v2" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M4 5l1 10h8l1-10" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <Line x1="9" y1="8" x2="9" y2="13" stroke="#f87171" strokeWidth="1.3" strokeLinecap="round" />
                </Svg>
                <Text style={[styles.menuRowText, { color: "#f87171" }]}>
                  Delete Journal
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Edit Journal Modal ── */}
      <CreateJournalModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onSave={saveEditedJournal}
        initialName={editingJournal?.name ?? ""}
        initialColor={editingJournal?.color ?? "#80b0e8"}
        initialIconId={editingJournal?.iconId ?? "journals"}
      />

      {/* ── Create Journal Modal ── */}
      <CreateJournalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={saveNewJournal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLabel: {
    color: "#555",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  // ── Floating Action Button ──
  fab: {
    position: "absolute",
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 30,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",

    // Android shadow
    elevation: 10,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
    shadowOpacity: 0.25,
  },
  fabPlus: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fabPlusH: {
    position: "absolute",
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#fff",
  },
  fabPlusV: {
    position: "absolute",
    width: 2,
    height: 18,
    borderRadius: 1,
    backgroundColor: "#fff",
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#555", fontSize: 11, fontWeight: "500" },
  sectionLabel: {
    color: "#444",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginLeft: 4,
  },
  journalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e1e1e",
  },
  journalAccent: { width: 4, alignSelf: "stretch" },
  journalIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    marginVertical: 10,
    marginRight: 10,
  },
  journalName: { color: "#f0f0f0", fontSize: 16, fontWeight: "600" },
  journalSub: { color: "#444", fontSize: 12, marginTop: 2 },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
    gap: 4,
  },
  noteCount: { fontSize: 13, fontWeight: "600" },
  chevron: { fontSize: 24, fontWeight: "300" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -60,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySub: { color: "#444", fontSize: 13 },

  // ── Press-hold menu styles ──
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuBox: {
    backgroundColor: "#161616",
    borderRadius: 16,
    width: 270,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#242424",
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  menuJournalIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: { color: "#aaa", fontSize: 14, fontWeight: "600", flex: 1 },
  menuClose: { padding: 2 },
  menuCloseText: { color: "#555", fontSize: 15 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
  },
  menuRowIcon: { fontSize: 16 },
  menuRowText: { color: "#e0e0e0", fontSize: 15, fontWeight: "500" },
  menuDivider: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 14 },

  // ── Full-screen modal ──
  fsContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  fsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fsHeaderBtn: { padding: 4 },
  fsCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2e2e2e",
    alignItems: "center",
    justifyContent: "center",
  },
  fsCloseText: { color: "#aaa", fontSize: 14, fontWeight: "600" },
  fsSaveCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fsSaveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  fsPreviewWrap: { alignItems: "center", marginTop: 8, marginBottom: 20 },
  fsPreviewOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  fsPreviewEmoji: { fontSize: 48 },

  fsNameInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    color: "#f0f0f0",
    fontSize: 18,
    fontWeight: "500",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },

  fsColorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    justifyContent: "center",
  },
  fsColorDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: "transparent",
  },
  fsColorDotSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },

  fsIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  fsIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2c2c2c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  fsIconEmoji: { fontSize: 24 },
});