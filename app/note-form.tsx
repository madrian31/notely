import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, StyleSheet, Platform, Keyboard, KeyboardEvent,
} from 'react-native';
import { Storage } from './(tabs)/storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Segment = {
  id: string;
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  color?: string;
  highlight?: string;
  heading?: 'title' | 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center' | 'right';
};

type Note = {
  id: string;
  title: string;
  text: string;
  segments: Segment[];
  date: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const FONT_COLORS = [
  { label: 'White',  value: '#f0f0f0' },
  { label: 'Red',    value: '#f87171' },
  { label: 'Orange', value: '#fb923c' },
  { label: 'Yellow', value: '#fbbf24' },
  { label: 'Green',  value: '#4ade80' },
  { label: 'Blue',   value: '#60a5fa' },
  { label: 'Purple', value: '#c084fc' },
  { label: 'Pink',   value: '#f472b6' },
  { label: 'Gray',   value: '#9ca3af' },
  { label: 'Black',  value: '#111111' },
];

const HIGHLIGHT_COLORS = [
  { label: '🟡 Yellow', value: '#fef08a' },
  { label: '🟢 Green',  value: '#bbf7d0' },
  { label: '🔵 Blue',   value: '#bfdbfe' },
  { label: '🩷 Pink',   value: '#fce7f3' },
  { label: '🟠 Orange', value: '#fed7aa' },
  { label: '✕ None',   value: '' },
];

const HEADINGS = [
  { label: 'Title', value: 'title' as const, size: 28, weight: '800' as const },
  { label: 'H1',    value: 'h1'    as const, size: 24, weight: '700' as const },
  { label: 'H2',    value: 'h2'    as const, size: 20, weight: '600' as const },
  { label: 'H3',    value: 'h3'    as const, size: 18, weight: '600' as const },
  { label: 'Body',  value: undefined,         size: 16, weight: '400' as const },
];

const ALIGNS: { label: string; value: 'left' | 'center' | 'right' }[] = [
  { label: '⬅  Left',   value: 'left' },
  { label: '↔  Center', value: 'center' },
  { label: '➡  Right',  value: 'right' },
];

const HEADING_SIZE: Record<string, number> = { title: 28, h1: 24, h2: 20, h3: 18 };
const HEADING_WEIGHT: Record<string, any>  = { title: '800', h1: '700', h2: '600', h3: '600' };

function makeId() { return Math.random().toString(36).slice(2, 10); }

function defaultSegment(overrides?: Partial<Segment>): Segment {
  return { id: makeId(), text: '', fontSize: 16, color: '#f0f0f0', align: 'left', ...overrides };
}

function segmentsToPlain(segs: Segment[]) {
  return segs.map(s => s.text).join('\n');
}

// Helper: safely convert string | string[] → string
function asString(val: string | string[] | undefined, fallback = ''): string {
  if (!val) return fallback;
  return Array.isArray(val) ? val[0] : val;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NoteForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Safely extract all params
  const noteId       = asString(params.id);
  const journalId    = asString(params.journalId);
  const journalColor = asString(params.journalColor, '#c084fc');

  // Each journal has its own storage key
  const storageKey = `notes_${journalId}`;

  const [title,     setTitle]     = useState('');
  const [segments,  setSegments]  = useState<Segment[]>([defaultSegment()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fmt, setFmt] = useState<Partial<Segment>>({
    bold: false, italic: false, underline: false, strikethrough: false,
    fontSize: 16, color: '#f0f0f0', highlight: '', heading: undefined, align: 'left',
  });
  const [picker, setPicker] = useState<'fontSize'|'color'|'highlight'|'heading'|'align'|null>(null);
  const [kbHeight, setKbHeight] = useState(0);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef  = useRef<string | null>(noteId || null);
  const hasChanges = useRef(false);
  const isSaving   = useRef(false);
  const latestRef  = useRef({ title: '', segments: [defaultSegment()] });
  const segsRef    = useRef<Segment[]>([defaultSegment()]);
  const inputRefs  = useRef<Record<string, TextInput | null>>({});

  // Keyboard tracking
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => setKbHeight(e.endCoordinates.height);
    const onHide = () => setKbHeight(0);
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  useEffect(() => {
    if (noteId) loadNote();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hasChanges.current && !isSaving.current) saveNow();
    };
  }, []);

  // Sync toolbar to active segment
  useEffect(() => {
    const seg = segments[activeIdx];
    if (!seg) return;
    setFmt({
      bold:          seg.bold          ?? false,
      italic:        seg.italic        ?? false,
      underline:     seg.underline     ?? false,
      strikethrough: seg.strikethrough ?? false,
      fontSize:      seg.fontSize      ?? 16,
      color:         seg.color         ?? '#f0f0f0',
      highlight:     seg.highlight     ?? '',
      heading:       seg.heading,
      align:         seg.align         ?? 'left',
    });
  }, [activeIdx, segments]);

  // Load note from THIS journal's storage key
  const loadNote = async () => {
    try {
      const stored = await Storage.getItem(storageKey);
      const parsed: Note[] = stored ? JSON.parse(stored) : [];
      const existing = parsed.find(n => n.id === noteId);
      if (!existing) return;
      setTitle(existing.title);
      const segs = existing.segments?.length
        ? existing.segments
        : [defaultSegment({ text: existing.text })];
      setSegments(segs);
      segsRef.current = segs;
      latestRef.current = { title: existing.title, segments: segs };
    } catch (err) {
      console.log('loadNote error:', err);
    }
  };

  // Save to THIS journal's storage key
  const saveNow = async () => {
    if (isSaving.current) return;
    isSaving.current = true;
    const { title, segments } = latestRef.current;
    const cleanTitle = title.trim();
    const plainText  = segmentsToPlain(segments).trim();
    if (!cleanTitle && !plainText) { isSaving.current = false; return; }

    try {
      const stored = await Storage.getItem(storageKey);
      const parsed: Note[] = stored ? JSON.parse(stored) : [];
      let updated: Note[];

      if (noteIdRef.current) {
        updated = parsed.map(n =>
          n.id === noteIdRef.current
            ? { ...n, title: cleanTitle, text: plainText, segments }
            : n
        );
      } else {
        const newId = Date.now().toString();
        noteIdRef.current = newId;
        updated = [
          { id: newId, title: cleanTitle, text: plainText, segments, date: new Date().toISOString() },
          ...parsed,
        ];
      }
      await Storage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.log('saveNow error:', err);
    }

    hasChanges.current = false;
    isSaving.current   = false;
  };

  const triggerSave = () => {
    hasChanges.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(saveNow, 1000);
  };

  const pushSegments = (next: Segment[]) => {
    segsRef.current            = next;
    latestRef.current.segments = next;
    setSegments(next);
    triggerSave();
  };

  const patchSeg = (idx: number, patch: Partial<Segment>) => {
    const next = segsRef.current.map((s, i) => i === idx ? { ...s, ...patch } : s);
    pushSegments(next);
  };

  const handleChange = (idx: number, newText: string) => {
    if (!newText.includes('\n')) { patchSeg(idx, { text: newText }); return; }
    const parts  = newText.split('\n');
    const cur    = segsRef.current[idx];
    const before = segsRef.current.slice(0, idx);
    const after  = segsRef.current.slice(idx + 1);
    const newSegs: Segment[] = [
      ...before,
      { ...cur, text: parts[0] },
      ...parts.slice(1).map(p =>
        defaultSegment({ text: p, fontSize: cur.fontSize, color: cur.color, align: cur.align })
      ),
      ...after,
    ];
    pushSegments(newSegs);
    const insertedCount = parts.length - 1;
    setTimeout(() => {
      const targetIdx = idx + insertedCount;
      setActiveIdx(targetIdx);
      inputRefs.current[newSegs[targetIdx]?.id]?.focus();
    }, 30);
  };

  const handleKeyPress = (idx: number, e: any) => {
    if (e.nativeEvent.key !== 'Backspace') return;
    const cur = segsRef.current[idx];
    if (cur.text.length > 0 || idx === 0) return;
    const prev    = segsRef.current[idx - 1];
    const newSegs = segsRef.current.filter((_, i) => i !== idx);
    pushSegments(newSegs);
    setTimeout(() => {
      setActiveIdx(idx - 1);
      inputRefs.current[prev?.id]?.focus();
    }, 30);
  };

  const applyFmt = (patch: Partial<Segment>) => {
    patchSeg(activeIdx, patch);
    setFmt(prev => ({ ...prev, ...patch }));
  };

  const toggleFmt = (key: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    applyFmt({ [key]: !fmt[key] });
  };

  const toolbarBottom = kbHeight > 0 ? kbHeight : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: '#161616' }}>

      {/* Back button row */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => { saveNow(); router.back(); }} style={s.backBtn}>
          <Text style={[s.backText, { color: journalColor }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      {/* Title input */}
      <TextInput
        style={s.titleInput}
        placeholder="Title"
        placeholderTextColor="#444"
        value={title}
        onChangeText={t => {
          setTitle(t);
          latestRef.current.title = t;
          triggerSave();
        }}
        selectionColor={journalColor}
      />

      {/* Editor */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.editorContent, { paddingBottom: kbHeight + 60 }]}
        keyboardShouldPersistTaps="handled"
      >
        {segments.map((seg, idx) => {
          const headingSize   = seg.heading ? HEADING_SIZE[seg.heading] : (seg.fontSize ?? 16);
          const headingWeight = seg.heading ? HEADING_WEIGHT[seg.heading] : '400';
          return (
            <TextInput
              key={seg.id}
              ref={r => { inputRefs.current[seg.id] = r; }}
              style={[
                s.segInput,
                {
                  fontSize:    headingSize,
                  fontWeight:  headingWeight,
                  color:       seg.color ?? '#f0f0f0',
                  fontStyle:   seg.italic ? 'italic' : 'normal',
                  textDecorationLine:
                    seg.underline && seg.strikethrough ? 'underline line-through'
                    : seg.underline    ? 'underline'
                    : seg.strikethrough ? 'line-through'
                    : 'none',
                  textAlign:        seg.align ?? 'left',
                  backgroundColor:  seg.highlight || 'transparent',
                },
              ]}
              value={seg.text}
              onChangeText={t => handleChange(idx, t)}
              onKeyPress={e => handleKeyPress(idx, e)}
              onFocus={() => setActiveIdx(idx)}
              multiline={false}
              selectionColor={journalColor}
              blurOnSubmit={false}
            />
          );
        })}
      </ScrollView>

      {/* Formatting toolbar */}
      <View style={[s.toolbarWrap, { bottom: toolbarBottom }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toolbarContent}>
          <ToolBtn label="B" active={!!fmt.bold}          onPress={() => toggleFmt('bold')}          bold />
          <ToolBtn label="I" active={!!fmt.italic}        onPress={() => toggleFmt('italic')}        italic />
          <ToolBtn label="U" active={!!fmt.underline}     onPress={() => toggleFmt('underline')}     underline />
          <ToolBtn label="S" active={!!fmt.strikethrough} onPress={() => toggleFmt('strikethrough')} strike />
          <Divider />
          <ToolBtn label="¶" active={!!fmt.heading} onPress={() => setPicker('heading')} />
          <ToolBtn label={`${fmt.fontSize ?? 16}`}  onPress={() => setPicker('fontSize')} />
          <Divider />
          <TouchableOpacity
            onPress={() => setPicker('color')}
            style={[s.toolBtn, { borderBottomWidth: 3, borderBottomColor: fmt.color ?? journalColor }]}
          >
            <Text style={s.toolBtnTxt}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPicker('highlight')}
            style={[s.toolBtn, fmt.highlight ? { backgroundColor: fmt.highlight } : null]}
          >
            <Text style={[s.toolBtnTxt, fmt.highlight ? { color: '#111' } : null]}>🖍</Text>
          </TouchableOpacity>
          <Divider />
          <ToolBtn
            label={fmt.align === 'center' ? '↔' : fmt.align === 'right' ? '➡' : '⬅'}
            onPress={() => setPicker('align')}
          />
        </ScrollView>
      </View>

      {/* Bottom sheets */}
      <BottomSheet visible={picker === 'heading'} title="Heading Style" onClose={() => setPicker(null)}>
        {HEADINGS.map(h => (
          <ModalRow key={h.label} label={h.label} active={fmt.heading === h.value}
            onPress={() => { applyFmt({ heading: h.value, fontSize: h.size }); setPicker(null); }}
            accentColor={journalColor}
            extra={<Text style={{ color: '#555', fontSize: Math.max(10, h.size * 0.7), fontWeight: h.weight }}>{h.label}</Text>}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={picker === 'fontSize'} title="Font Size" onClose={() => setPicker(null)}>
        {FONT_SIZES.map(sz => (
          <ModalRow key={sz} label={`${sz}px`} active={fmt.fontSize === sz}
            onPress={() => { applyFmt({ fontSize: sz }); setPicker(null); }}
            accentColor={journalColor}
            extra={<Text style={{ color: '#555', fontSize: Math.max(10, sz * 0.65) }}>Preview</Text>}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={picker === 'color'} title="Font Color" onClose={() => setPicker(null)}>
        <View style={s.swatchGrid}>
          {FONT_COLORS.map(c => (
            <TouchableOpacity key={c.value}
              onPress={() => { applyFmt({ color: c.value }); setPicker(null); }}
              style={[
                s.swatch, { backgroundColor: c.value },
                fmt.color === c.value && s.swatchActive,
                c.value === '#f0f0f0' && { borderColor: '#555' },
              ]}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={picker === 'highlight'} title="Highlight" onClose={() => setPicker(null)}>
        {HIGHLIGHT_COLORS.map(h => (
          <ModalRow key={h.label} label={h.label} active={fmt.highlight === h.value}
            onPress={() => { applyFmt({ highlight: h.value }); setPicker(null); }}
            accentColor={journalColor}
            extra={h.value
              ? <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: h.value }} />
              : null}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={picker === 'align'} title="Text Alignment" onClose={() => setPicker(null)}>
        {ALIGNS.map(a => (
          <ModalRow key={a.value} label={a.label} active={fmt.align === a.value}
            onPress={() => { applyFmt({ align: a.value }); setPicker(null); }}
            accentColor={journalColor}
          />
        ))}
      </BottomSheet>

    </View>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────

function ToolBtn({ label, active, onPress, bold, italic, underline, strike }: {
  label: string; active?: boolean; onPress: () => void;
  bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.toolBtn, active && s.toolBtnActive]}>
      <Text style={[
        s.toolBtnTxt,
        active    && s.toolBtnTxtActive,
        bold      && { fontWeight: '700' },
        italic    && { fontStyle: 'italic' },
        underline && { textDecorationLine: 'underline' },
        strike    && { textDecorationLine: 'line-through' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() { return <View style={s.divider} />; }

function BottomSheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={s.sheetClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 340 }}>{children}</ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ModalRow({ label, active, onPress, extra, accentColor }: {
  label: string; active?: boolean; onPress: () => void;
  extra?: React.ReactNode; accentColor?: string;
}) {
  const accent = accentColor ?? '#c084fc';
  return (
    <TouchableOpacity onPress={onPress} style={[s.sheetRow, active && { backgroundColor: accent + '22' }]}>
      <Text style={[s.sheetRowTxt, active && { color: accent }]}>{label}</Text>
      {extra}
      {active && <Text style={{ color: accent, marginLeft: 'auto' }}>✓</Text>}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#161616',
  },
  backBtn: { alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '500' },
  titleInput: {
    backgroundColor: '#161616',
    color: '#f0f0f0',
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  editorContent: { paddingHorizontal: 18, paddingTop: 14 },
  segInput: {
    width: '100%', color: '#f0f0f0',
    paddingVertical: 2, paddingHorizontal: 0,
    backgroundColor: 'transparent', marginVertical: 1,
    ...(Platform.OS === 'android' && { underlineColorAndroid: 'transparent' }),
  },
  toolbarWrap: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: '#111',
    borderTopWidth: 1, borderTopColor: '#222', zIndex: 100,
  },
  toolbarContent: {
    paddingHorizontal: 8, paddingVertical: 7,
    alignItems: 'center', gap: 4,
  },
  toolBtn: {
    minWidth: 36, height: 34, borderRadius: 7,
    backgroundColor: '#1c1c1c',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  toolBtnActive:    { backgroundColor: '#2d1f3f' },
  toolBtnTxt:       { color: '#888', fontSize: 13, fontWeight: '500' },
  toolBtnTxtActive: { color: '#c084fc' },
  divider: { width: 1, height: 22, backgroundColor: '#282828', marginHorizontal: 3 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 8, paddingBottom: 16 },
  swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: '#c084fc', transform: [{ scale: 1.15 }] },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#333',
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1f1f1f',
  },
  sheetTitle:        { color: '#e0e0e0', fontSize: 15, fontWeight: '600' },
  sheetClose:        { color: '#555', fontSize: 18, paddingHorizontal: 4 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13,
    gap: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
  },
  sheetRowTxt: { color: '#bbb', fontSize: 15, flex: 1 },
});