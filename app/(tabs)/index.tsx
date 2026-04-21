import { useState, useCallback } from 'react';
import {
  View, Text, Pressable, FlatList, Modal,
} from 'react-native';
import { Storage } from './storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [totalWords, setTotalWords] = useState(0);
  const [journaledDays, setJournaledDays] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadNotes();
      }, 300);
      return () => clearTimeout(timer);
    }, [])
  );

  const loadNotes = async () => {
    try {
      const stored = await Storage.getItem('notes');
      const parsedNotes = stored ? JSON.parse(stored) : [];
      setNotes(parsedNotes);
      setTotalWords(getTotalWords(parsedNotes));
      setJournaledDays(getJournaledDays(parsedNotes));
    } catch (err) {
      console.log('Load error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await Storage.setItem('notes', JSON.stringify(updated));
  };

  const groupByMonth = (data: Note[]) => {
    return data.reduce((acc: Record<string, Note[]>, item) => {
      const month = new Date(item.date).toLocaleString('default', {
        month: 'long', year: 'numeric',
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(item);
      return acc;
    }, {});
  };

  const getTotalWords = (notes: Note[]) =>
    notes.reduce((total, note) => {
      return total + note.text.trim().split(/\s+/).filter(Boolean).length;
    }, 0);

  const getJournaledDays = (notes: Note[]) =>
    new Set(notes.map(note => note.date.split('T')[0])).size;

  const groupedNotes = groupByMonth(notes || []);
  const monthKeys = Object.keys(groupedNotes);

  return (
    // ← paddingTop para hindi naka-sagad sa taas sa iOS
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20, paddingTop: insets.top + 20 }}>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontSize: 20 }}>My Notes</Text>
        <Pressable onPress={() => router.push('/note-form')}>
          <Text style={{ color: '#fff', fontSize: 26 }}>＋</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1, backgroundColor: '#1c1c1c', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#aaa', fontSize: 12 }}>📝 Total Words</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{totalWords}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#1c1c1c', padding: 12, borderRadius: 10 }}>
          <Text style={{ color: '#aaa', fontSize: 12 }}>📅 Journaled Days</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{journaledDays} days</Text>
        </View>
      </View>

      {notes.length === 0 && (
        <View style={{ marginTop: 50, alignItems: 'center' }}>
          <Text style={{ color: '#555' }}>No notes yet. Create one ✍️</Text>
        </View>
      )}

      <FlatList
        data={monthKeys}
        keyExtractor={item => item}
        renderItem={({ item: month }) => (
          <View>
            <Text style={{ color: '#aaa', marginTop: 20, fontSize: 16 }}>{month}</Text>
            {groupedNotes[month].map(noteItem => (
              <View
                key={noteItem.id}
                style={{
                  backgroundColor: '#1c1c1c', padding: 12, borderRadius: 10,
                  marginTop: 10, flexDirection: 'row', alignItems: 'center',
                }}
              >
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => router.push({ pathname: '/note-form', params: { id: noteItem.id } })}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{noteItem.title}</Text>
                  <Text style={{ color: '#aaa', marginTop: 4 }} numberOfLines={1}>
                    {noteItem.text}
                  </Text>
                </Pressable>
                <Pressable onPress={() => { setSelectedNote(noteItem); setMenuVisible(true); }} style={{ paddingHorizontal: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 18 }}>⋯</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      />

      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={{ backgroundColor: '#222', borderRadius: 12, width: 240, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}>
                <Text style={{ color: '#fff' }}>Options</Text>
                <Pressable onPress={() => setMenuVisible(false)}>
                  <Text style={{ color: '#fff' }}>✕</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  if (selectedNote) router.push({ pathname: '/note-form', params: { id: selectedNote.id } });
                  setMenuVisible(false);
                }}
                style={{ padding: 14 }}
              >
                <Text style={{ color: '#fff' }}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => { if (selectedNote) handleDelete(selectedNote.id); setMenuVisible(false); }}
                style={{ padding: 14 }}
              >
                <Text style={{ color: 'red' }}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}