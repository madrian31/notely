import { useState, useEffect, useRef } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { Storage } from './(tabs)/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Note = {
  id: string;
  title: string;
  text: string;
  date: string;
};

export default function NoteForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ title: '', text: '' });
  const noteIdRef = useRef<string | null>(id ?? null);
  const hasChangesRef = useRef(false);
  const isSavingRef = useRef(false); // ← prevent double save

  useEffect(() => {
    loadNotes();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hasChangesRef.current && !isSavingRef.current) {
        saveNow();
      }
    };
  }, []);

  const loadNotes = async () => {
    const stored = await Storage.getItem('notes');
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

  const saveNow = async () => {
    if (isSavingRef.current) return; // ← prevent double save
    isSavingRef.current = true;

    const { title, text } = latestRef.current;
    const cleanTitle = title.trim();
    const cleanText = text.trim();

    if (!cleanTitle && !cleanText) {
      isSavingRef.current = false;
      return;
    }

    const stored = await Storage.getItem('notes');
    const parsed: Note[] = stored ? JSON.parse(stored) : [];
    let updated: Note[];

    if (noteIdRef.current) {
      updated = parsed.map(n =>
        n.id === noteIdRef.current
          ? { ...n, title: cleanTitle, text: cleanText }
          : n
      );
    } else {
      const newId = Date.now().toString();
      noteIdRef.current = newId;
      updated = [
        { id: newId, title: cleanTitle, text: cleanText, date: new Date().toISOString() },
        ...parsed,
      ];
    }

    await Storage.setItem('notes', JSON.stringify(updated));
    hasChangesRef.current = false;
    isSavingRef.current = false;
  };

  const triggerSave = () => {
    hasChangesRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      await saveNow();
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
    // ← paddingTop para hindi naka-sagad sa taas sa iOS
    <View style={{ flex: 1, backgroundColor: '#000', padding: 20, paddingTop: insets.top + 20 }}>
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