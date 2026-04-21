import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

export default function App() {
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem('notes');
      setNotes(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.log('Load error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    await AsyncStorage.setItem('notes', JSON.stringify(updated));
  };

  const groupByMonth = (data: Note[]) => {
    if (!data) return {};

    return data.reduce((acc: Record<string, Note[]>, item) => {
      const month = new Date(item.date).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });

      if (!acc[month]) acc[month] = [];
      acc[month].push(item);

      return acc;
    }, {});
  };

  const groupedNotes = groupByMonth(notes || []);
  const monthKeys = Object.keys(groupedNotes);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>

      {/* HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: '#fff', fontSize: 20 }}>My Notes</Text>

        <Pressable onPress={() => router.push('/note-form')}>
          <Text style={{ color: '#fff', fontSize: 26 }}>＋</Text>
        </Pressable>
      </View>

      {/* EMPTY STATE */}
      {notes.length === 0 && (
        <View style={{ marginTop: 50, alignItems: 'center' }}>
          <Text style={{ color: '#555' }}>No notes yet. Create one ✍️</Text>
        </View>
      )}

      {/* LIST */}
      <FlatList
        data={monthKeys}
        keyExtractor={item => item}
        renderItem={({ item: month }) => (
          <View>
            <Text style={{ color: '#aaa', marginTop: 20, fontSize: 16 }}>
              {month}
            </Text>

            {groupedNotes[month].map(noteItem => (
              <View
                key={noteItem.id}
                style={{
                  backgroundColor: '#1c1c1c',
                  padding: 12,
                  borderRadius: 10,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => {
                    router.push({
                      pathname: '/note-form',
                      params: { id: noteItem.id },
                    });
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {noteItem.title}
                  </Text>
                  <Text style={{ color: '#aaa', marginTop: 4 }}>
                    {noteItem.text}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setSelectedNote(noteItem);
                    setMenuVisible(true);
                  }}
                  style={{ paddingHorizontal: 10 }}
                >
                  <Text style={{ color: '#fff', fontSize: 18 }}>⋯</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      />

      {/* MODAL */}
      <Modal transparent visible={menuVisible} animationType="fade">

        {/* BACKDROP — closes modal on outside tap */}
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setMenuVisible(false)}
        >

          {/* ✅ FIX: Pressable wrapper stops tap events from bubbling to the backdrop */}
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={{
              backgroundColor: '#222',
              borderRadius: 12,
              width: 240,
              overflow: 'hidden',
            }}>

              {/* HEADER */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#333',
              }}>
                <Text style={{ color: '#fff' }}>Options</Text>
                <Pressable onPress={() => setMenuVisible(false)}>
                  <Text style={{ color: '#fff' }}>✕</Text>
                </Pressable>
              </View>

              {/* EDIT */}
              <Pressable
                onPress={() => {
                  if (selectedNote) {
                    router.push({
                      pathname: '/note-form',
                      params: { id: selectedNote.id },
                    });
                  }
                  setMenuVisible(false);
                }}
                style={{ padding: 14 }}
              >
                <Text style={{ color: '#fff' }}>Edit</Text>
              </Pressable>

              {/* DELETE */}
              <Pressable
                onPress={() => {
                  if (selectedNote) handleDelete(selectedNote.id);
                  setMenuVisible(false);
                }}
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