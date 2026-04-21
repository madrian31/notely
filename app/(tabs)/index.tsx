import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, Modal, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Storage } from './storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Journal = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  createdAt: string;
};

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

const JOURNAL_COLORS = [
  '#c084fc', '#f87171', '#fb923c', '#fbbf24',
  '#4ade80', '#60a5fa', '#f472b6', '#a78bfa',
];

const JOURNAL_EMOJIS = [
  '📓', '📔', '📒', '📕', '📗', '📘', '📙',
  '🙏', '💪', '❤️', '🌙', '☀️', '💭', '✨',
  '🎯', '🌿', '🔥', '💡', '🎵', '✈️', '🏃', '😊',
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [journals, setJournals] = useState<Journal[]>([]);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [totalWords, setTotalWords] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newJournalName, setNewJournalName] = useState('');
  const [selectedColor, setSelectedColor] = useState(JOURNAL_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(JOURNAL_EMOJIS[0]);

  useFocusEffect(
    useCallback(() => {
      loadJournals();
    }, [])
  );

  const loadJournals = async () => {
    try {
      const stored = await Storage.getItem('journals');
      const list: Journal[] = stored ? JSON.parse(stored) : [];
      setJournals(list);

      let wordCount = 0;
      let noteCount = 0;
      const counts: Record<string, number> = {};

      for (const j of list) {
        const notesRaw = await Storage.getItem(`notes_${j.id}`);
        const notes: Note[] = notesRaw ? JSON.parse(notesRaw) : [];
        counts[j.id] = notes.length;
        noteCount += notes.length;
        wordCount += notes.reduce(
          (acc, n) => acc + n.text.trim().split(/\s+/).filter(Boolean).length, 0
        );
      }

      setNoteCounts(counts);
      setTotalNotes(noteCount);
      setTotalWords(wordCount);
    } catch (err) {
      console.log('loadJournals error:', err);
    }
  };

  const openAddModal = () => {
    setNewJournalName('');
    setSelectedColor(JOURNAL_COLORS[Math.floor(Math.random() * JOURNAL_COLORS.length)]);
    setSelectedEmoji(JOURNAL_EMOJIS[Math.floor(Math.random() * 7)]);
    setModalVisible(true);
  };

  const saveNewJournal = async () => {
    const trimmed = newJournalName.trim();
    if (!trimmed) return;
    const newJournal: Journal = {
      id: Date.now().toString(),
      name: trimmed,
      color: selectedColor,
      emoji: selectedEmoji,
      createdAt: new Date().toISOString(),
    };
    const updated = [...journals, newJournal];
    setJournals(updated);
    await Storage.setItem('journals', JSON.stringify(updated));
    setModalVisible(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning ☀️';
    if (h < 18) return 'Good afternoon 🌤';
    return 'Good evening 🌙';
  };

  const goToNoteList = (item: Journal) => {
    router.push(`/note-list?journalId=${item.id}&journalName=${encodeURIComponent(item.name)}&journalColor=${encodeURIComponent(item.color)}` as any);
  };

  const renderJournal = ({ item }: { item: Journal }) => {
    const count = noteCounts[item.id] ?? 0;
    return (
      <Pressable
        style={({ pressed }) => [styles.journalCard, pressed && { opacity: 0.7 }]}
        onPress={() => goToNoteList(item)}
      >
        <View style={[styles.journalAccent, { backgroundColor: item.color }]} />
        <View style={[styles.journalIcon, { backgroundColor: item.color + '22' }]}>
          <Text style={{ fontSize: 22 }}>{item.emoji || '📓'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.journalName}>{item.name}</Text>
          <Text style={styles.journalSub}>
            {new Date(item.createdAt).toLocaleDateString('default', {
              month: 'short', day: 'numeric', year: 'numeric',
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
        <Pressable onPress={openAddModal} style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋</Text>
        </Pressable>
      </View>

      <Text style={styles.greeting}>{getGreeting()}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{journals.length}</Text>
          <Text style={styles.statLabel}>Journals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📝</Text>
          <Text style={styles.statValue}>{totalNotes}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔤</Text>
          <Text style={styles.statValue}>{totalWords.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>My Journals</Text>

      {journals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📔</Text>
          <Text style={styles.emptyText}>No journals yet</Text>
          <Text style={styles.emptySub}>Tap ＋ to create your first journal</Text>
        </View>
      ) : (
        <FlatList
          data={journals}
          keyExtractor={j => j.id}
          renderItem={renderJournal}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        transparent
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />

            {/* Preview */}
            <View style={styles.modalPreview}>
              <View style={[styles.previewIcon, { backgroundColor: selectedColor + '33' }]}>
                <Text style={{ fontSize: 36 }}>{selectedEmoji}</Text>
              </View>
            </View>

            <Text style={styles.modalTitle}>New Journal</Text>
            <Text style={styles.modalSubtitle}>Name, color, and icon</Text>

            <TextInput
              style={styles.modalInput}
              value={newJournalName}
              onChangeText={setNewJournalName}
              placeholder="e.g. My Daily Journal"
              placeholderTextColor="#555"
              autoFocus
              selectionColor="#c084fc"
              returnKeyType="done"
              onSubmitEditing={saveNewJournal}
              maxLength={40}
            />

            {/* Color picker */}
            <Text style={styles.pickerLabel}>Color</Text>
            <View style={styles.colorRow}>
              {JOURNAL_COLORS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotSelected,
                  ]}
                />
              ))}
            </View>

            {/* Emoji picker */}
            <Text style={styles.pickerLabel}>Icon</Text>
            <ScrollView
              horizontal={false}
              style={styles.emojiScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.emojiGrid}>
                {JOURNAL_EMOJIS.map(e => (
                  <Pressable
                    key={e}
                    onPress={() => setSelectedEmoji(e)}
                    style={[
                      styles.emojiBtn,
                      selectedEmoji === e && { backgroundColor: selectedColor + '33', borderColor: selectedColor },
                    ]}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveNewJournal}
                style={[styles.modalBtn, { backgroundColor: selectedColor }]}
              >
                <Text style={styles.modalBtnSaveText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  headerLabel: {
    color: '#555', fontSize: 13, fontWeight: '500',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  addBtn: { padding: 4 },
  addBtnText: { color: '#c084fc', fontSize: 26, fontWeight: '300' },
  greeting: {
    color: '#fff', fontSize: 28, fontWeight: '700',
    marginBottom: 24, letterSpacing: -0.5,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#111', borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#1e1e1e',
  },
  statIcon: { fontSize: 18, marginBottom: 2 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#555', fontSize: 11, fontWeight: '500' },
  sectionLabel: {
    color: '#444', fontSize: 12, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: 10, marginLeft: 4,
  },
  journalCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1e1e1e',
  },
  journalAccent: { width: 4, alignSelf: 'stretch' },
  journalIcon: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 10, marginVertical: 10, marginRight: 10,
  },
  journalName: { color: '#f0f0f0', fontSize: 16, fontWeight: '600' },
  journalSub: { color: '#444', fontSize: 12, marginTop: 2 },
  cardRight: {
    flexDirection: 'row', alignItems: 'center',
    paddingRight: 14, gap: 4,
  },
  noteCount: { fontSize: 13, fontWeight: '600' },
  chevron: { fontSize: 24, fontWeight: '300' },
  emptyState: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', marginTop: -60,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptySub: { color: '#444', fontSize: 13 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    borderWidth: 1, borderColor: '#222', borderBottomWidth: 0,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginBottom: 16,
  },
  modalPreview: { alignItems: 'center', marginBottom: 16 },
  previewIcon: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { color: '#555', fontSize: 13, marginBottom: 16 },
  modalInput: {
    backgroundColor: '#1c1c1c', borderRadius: 12,
    color: '#f0f0f0', fontSize: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a',
  },
  pickerLabel: {
    color: '#555', fontSize: 11, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 8,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotSelected: { borderColor: '#fff', transform: [{ scale: 1.2 }] },
  emojiScroll: { maxHeight: 100, marginBottom: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1c1c1c', borderWidth: 2, borderColor: 'transparent',
  },
  emojiText: { fontSize: 22 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancel: {
    backgroundColor: '#1c1c1c', borderWidth: 1, borderColor: '#2a2a2a',
  },
  modalBtnCancelText: { color: '#888', fontSize: 15, fontWeight: '600' },
  modalBtnSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});