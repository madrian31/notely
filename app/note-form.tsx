import { useState, useEffect, useRef } from 'react';
import { View, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

export default function NoteForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title: '', text: '' });

  // ✅ FIX: track the note's ID locally so new notes aren't duplicated on each save
  const noteIdRef = useRef<string | null>(id ?? null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const stored = await AsyncStorage.getItem('notes');
    const parsed: Note[] = stored ? JSON.parse(stored) : [];

    if (id) {
      const existing = parsed.find(n => n.id === id);
      if (existing) {
        setTitle(existing.title);
        setText(existing.text);
        latestRef.current = { title: existing.title, text: existing.text };
      }
    }
  };

  const triggerSave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      const { title, text } = latestRef.current;

      const cleanTitle = title.trim();
      const cleanText = text.trim();

      if (!cleanTitle && !cleanText) return;

      const stored = await AsyncStorage.getItem('notes');
      const parsed: Note[] = stored ? JSON.parse(stored) : [];

      let updated: Note[];

      if (noteIdRef.current) {
        // ✅ Update existing note (covers both param-id and first-save-generated id)
        updated = parsed.map(n =>
          n.id === noteIdRef.current
            ? { ...n, title: cleanTitle, text: cleanText }
            : n
        );
      } else {
        // ✅ First save: generate an ID and remember it for all future saves
        const newId = Date.now().toString();
        noteIdRef.current = newId;

        const newNote: Note = {
          id: newId,
          title: cleanTitle,
          text: cleanText,
          date: new Date().toISOString(),
        };

        updated = [newNote, ...parsed];
      }

      await AsyncStorage.setItem('notes', JSON.stringify(updated));
    }, 1000);
  };

  const handleTitleChange = (t: string) => {
    setTitle(t);
    latestRef.current.title = t;
    triggerSave();
  };

  const handleTextChange = (t: string) => {
    setText(t);
    latestRef.current.text = t;
    triggerSave();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20 }}>
      <TextInput
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Title"
        placeholderTextColor="#888"
        style={{
          backgroundColor: '#222',
          color: '#fff',
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
        }}
      />
      <TextInput
        value={text}
        onChangeText={handleTextChange}
        placeholder="Write note..."
        placeholderTextColor="#888"
        multiline
        style={{
          backgroundColor: '#222',
          color: '#fff',
          padding: 10,
          height: 150,
          borderRadius: 8,
        }}
      />
    </View>
  );
}