import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardEvent,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage, STORAGE_KEYS } from "./storage";

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
  heading?: "title" | "h1" | "h2" | "h3";
  align?: "left" | "center" | "right";
};

type EmotionEntry = {
  label: string;
  intensity: 1 | 2 | 3; // 1=mild, 2=moderate, 3=strong
  color: string;
  valence: number; // 1-5 (1=very unpleasant, 5=very pleasant)
};

type Note = {
  id: string;
  title: string;
  text: string;
  segments: Segment[];
  date: string;
  emotion?: EmotionEntry;
  activities?: string[];
  tags?: string[];
  verseRef?: string;
  verseText?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const FONT_COLORS = [
  { label: "White", value: "#f0f0f0" },
  { label: "Red", value: "#f87171" },
  { label: "Orange", value: "#fb923c" },
  { label: "Yellow", value: "#fbbf24" },
  { label: "Green", value: "#4ade80" },
  { label: "Blue", value: "#60a5fa" },
  { label: "Purple", value: "#c084fc" },
  { label: "Pink", value: "#f472b6" },
  { label: "Gray", value: "#9ca3af" },
  { label: "Black", value: "#111111" },
];

const HIGHLIGHT_COLORS = [
  { label: "🟡 Yellow", value: "#fef08a" },
  { label: "🟢 Green", value: "#bbf7d0" },
  { label: "🔵 Blue", value: "#bfdbfe" },
  { label: "🩷 Pink", value: "#fce7f3" },
  { label: "🟠 Orange", value: "#fed7aa" },
  { label: "✕ None", value: "" },
];

const HEADINGS = [
  { label: "Title", value: "title" as const, size: 28, weight: "800" as const },
  { label: "H1", value: "h1" as const, size: 24, weight: "700" as const },
  { label: "H2", value: "h2" as const, size: 20, weight: "600" as const },
  { label: "H3", value: "h3" as const, size: 18, weight: "600" as const },
  { label: "Body", value: undefined, size: 16, weight: "400" as const },
];

const ALIGNS: { label: string; value: "left" | "center" | "right" }[] = [
  { label: "⬅  Left", value: "left" },
  { label: "↔  Center", value: "center" },
  { label: "➡  Right", value: "right" },
];

const HEADING_SIZE: Record<string, number> = {
  title: 28,
  h1: 24,
  h2: 20,
  h3: 18,
};
const HEADING_WEIGHT: Record<string, any> = {
  title: "800",
  h1: "700",
  h2: "600",
  h3: "600",
};

// ─── Emotion wheel data ───────────────────────────────────────────────────────

type EmotionDef = {
  valence: number;
  label: string;
  color: string;
  words: [string, string, string]; // mild, moderate, strong
};

const EMOTIONS: EmotionDef[] = [
  {
    valence: 1,
    label: "Very Unpleasant",
    color: "#ef4444",
    words: ["Uneasy", "Distressed", "Anguished"],
  },
  {
    valence: 2,
    label: "Unpleasant",
    color: "#f97316",
    words: ["Displeased", "Frustrated", "Miserable"],
  },
  {
    valence: 3,
    label: "Neutral",
    color: "#a3a3a3",
    words: ["Indifferent", "Neutral", "Numb"],
  },
  {
    valence: 4,
    label: "Pleasant",
    color: "#34d399",
    words: ["Content", "Happy", "Joyful"],
  },
  {
    valence: 5,
    label: "Very Pleasant",
    color: "#3b82f6",
    words: ["Pleased", "Elated", "Ecstatic"],
  },
];

const INTENSITY_LABELS = ["Slightly", "Moderately", "Strongly"] as const;

// ─── Activity data ────────────────────────────────────────────────────────────

const ACTIVITIES = [
  { id: "stationary", label: "Stationary", emoji: "🪑" },
  { id: "eating", label: "Eating", emoji: "🍽️" },
  { id: "walking", label: "Walking", emoji: "🚶" },
  { id: "running", label: "Running", emoji: "🏃" },
  { id: "biking", label: "Biking", emoji: "🚴" },
  { id: "automotive", label: "Automotive", emoji: "🚗" },
  { id: "flying", label: "Flying", emoji: "✈️" },
  { id: "none", label: "None", emoji: "—" },
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultSegment(overrides?: Partial<Segment>): Segment {
  return {
    id: makeId(),
    text: "",
    fontSize: 16,
    color: "#f0f0f0",
    align: "left",
    ...overrides,
  };
}

function segmentsToPlain(segs: Segment[]) {
  return segs.map((s) => s.text).join("\n");
}

// Helper: safely convert string | string[] → string
function asString(val: string | string[] | undefined, fallback = ""): string {
  if (!val) return fallback;
  return Array.isArray(val) ? val[0] : val;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NoteForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Safely extract all params
  const noteId = asString(params.id);
  const journalId = asString(params.journalId);
  const journalColor = asString(params.journalColor, "#c084fc");
  const initialTitle = asString(params.initialTitle, "");
  const paramVerseRef = asString(params.verseRef, "");
  const paramVerseText = asString(params.verseText, "");

  // Each journal has its own storage key
  const storageKey = STORAGE_KEYS.notes(journalId);

  const [title, setTitle] = useState(initialTitle);
  const [verseRef, setVerseRef] = useState(paramVerseRef);
  const [verseText, setVerseText] = useState(paramVerseText);
  const verseRefRef = useRef(paramVerseRef);
  const verseTextRef = useRef(paramVerseText);
  const [segments, setSegments] = useState<Segment[]>([defaultSegment()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fmt, setFmt] = useState<Partial<Segment>>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 16,
    color: "#f0f0f0",
    highlight: "",
    heading: undefined,
    align: "left",
  });
  const [picker, setPicker] = useState<
    "fontSize" | "color" | "highlight" | "heading" | "align" | "mood" | null
  >(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [isSavingUI, setIsSavingUI] = useState(false);
  const [emotion, setEmotion] = useState<EmotionEntry | undefined>(undefined);
  const [activities, setActivities] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  // Emotion picker sub-state
  const [selectedValence, setSelectedValence] = useState<number | null>(null);

  const [segHeights, setSegHeights] = useState<Record<string, number>>({});

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(noteId || null);
  const hasChanges = useRef(false);
  const isSaving = useRef(false);
  const latestRef = useRef({ title: initialTitle, segments: [defaultSegment()] });
  const emotionRef = useRef<EmotionEntry | undefined>(undefined);
  const activitiesRef = useRef<string[]>([]);
  const tagsRef = useRef<string[]>([]);
  const segsRef = useRef<Segment[]>([defaultSegment()]);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  // Keyboard tracking
  useEffect(() => {
    const onShow = (e: KeyboardEvent) => setKbHeight(e.endCoordinates.height);
    const onHide = () => setKbHeight(0);
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  useEffect(() => {
    if (noteId) loadNote();
    return () => {
      // Cancel any pending auto-save timer on unmount
      // (actual save is handled by handleBack before navigation)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Sync toolbar to active segment
  useEffect(() => {
    const seg = segments[activeIdx];
    if (!seg) return;
    setFmt({
      bold: seg.bold ?? false,
      italic: seg.italic ?? false,
      underline: seg.underline ?? false,
      strikethrough: seg.strikethrough ?? false,
      fontSize: seg.fontSize ?? 16,
      color: seg.color ?? "#f0f0f0",
      highlight: seg.highlight ?? "",
      heading: seg.heading,
      align: seg.align ?? "left",
    });
  }, [activeIdx, segments]);

  // Load note from THIS journal's storage key
  const loadNote = async () => {
    try {
      const stored = await Storage.getItem(storageKey);
      const parsed: Note[] = stored ? JSON.parse(stored) : [];
      const existing = parsed.find((n) => n.id === noteId);
      if (!existing) return;
      setTitle(existing.title);
      const segs = existing.segments?.length
        ? existing.segments
        : [defaultSegment({ text: existing.text })];
      setSegments(segs);
      segsRef.current = segs;
      latestRef.current = { title: existing.title, segments: segs };
      if (existing.emotion) {
        setEmotion(existing.emotion);
        setSelectedValence(existing.emotion.valence);
      }
      if (existing.activities) setActivities(existing.activities);
      if (existing.tags) setTags(existing.tags);
      if (existing.verseRef) { setVerseRef(existing.verseRef); verseRefRef.current = existing.verseRef; }
      if (existing.verseText) { setVerseText(existing.verseText); verseTextRef.current = existing.verseText; }
    } catch (err) {
      console.log("loadNote error:", err);
    }
  };

  // Save to THIS journal's storage key
  const saveNow = async () => {
    // Deduplicate concurrent saves — but don't silently skip if changes exist
    if (isSaving.current) {
      // Wait for the in-flight save to finish, then save again to capture latest changes
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (!isSaving.current) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }
    isSaving.current = true;
    const { title, segments } = latestRef.current;
    const cleanTitle = title.trim();
    const plainText = segmentsToPlain(segments).trim();
    if (!cleanTitle && !plainText) {
      isSaving.current = false;
      return;
    }

    try {
      const stored = await Storage.getItem(storageKey);
      const parsed: Note[] = stored ? JSON.parse(stored) : [];
      let updated: Note[];

      if (noteIdRef.current) {
        updated = parsed.map((n) =>
          n.id === noteIdRef.current
            ? {
              ...n,
              title: cleanTitle,
              text: plainText,
              segments,
              emotion: emotionRef.current,
              activities: activitiesRef.current,
              tags: tagsRef.current,
              verseRef: verseRefRef.current || n.verseRef,
              verseText: verseTextRef.current || n.verseText,
            }
            : n,
        );
      } else {
        const newId = Date.now().toString();
        noteIdRef.current = newId;
        updated = [
          {
            id: newId,
            title: cleanTitle,
            text: plainText,
            segments,
            date: new Date().toISOString(),
            emotion: emotionRef.current,
            activities: activitiesRef.current,
            tags: tagsRef.current,
            verseRef: verseRefRef.current || undefined,
            verseText: verseTextRef.current || undefined,
          },
          ...parsed,
        ];
      }
      await Storage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.log("saveNow error:", err);
    }

    hasChanges.current = false;
    isSaving.current = false;
  };

  // Always await save before navigating back — back button IS the save button
  const handleBack = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const hasContent =
      latestRef.current.title.trim() ||
      segmentsToPlain(latestRef.current.segments).trim();
    if (hasChanges.current || hasContent) {
      setIsSavingUI(true);
      isSaving.current = false; // reset so saveNow doesn't get stuck
      await saveNow();
      setIsSavingUI(false);
    }
    router.back();
  };

  const triggerSave = () => {
    hasChanges.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(saveNow, 1000);
  };

  const pushSegments = (next: Segment[]) => {
    segsRef.current = next;
    latestRef.current.segments = next;
    setSegments(next);
    triggerSave();
  };

  const patchSeg = (idx: number, patch: Partial<Segment>) => {
    const next = segsRef.current.map((s, i) =>
      i === idx ? { ...s, ...patch } : s,
    );
    pushSegments(next);
  };

  const handleChange = (idx: number, newText: string) => {
    if (!newText.includes("\n")) {
      patchSeg(idx, { text: newText });
      return;
    }
    const parts = newText.split("\n");
    const cur = segsRef.current[idx];
    const before = segsRef.current.slice(0, idx);
    const after = segsRef.current.slice(idx + 1);
    const newSegs: Segment[] = [
      ...before,
      { ...cur, text: parts[0] },
      ...parts.slice(1).map((p) =>
        defaultSegment({
          text: p,
          fontSize: cur.fontSize,
          color: cur.color,
          align: cur.align,
        }),
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

  const handleEnter = (idx: number) => {
    const cur = segsRef.current[idx];
    const before = segsRef.current.slice(0, idx + 1);
    const after = segsRef.current.slice(idx + 1);
    const newSeg = defaultSegment({
      fontSize: cur.fontSize,
      color: cur.color,
      align: cur.align,
    });
    const newSegs = [...before, newSeg, ...after];
    pushSegments(newSegs);
    setTimeout(() => {
      setActiveIdx(idx + 1);
      inputRefs.current[newSeg.id]?.focus();
    }, 30);
  };

  const handleKeyPress = (idx: number, e: any) => {
    if (e.nativeEvent.key !== "Backspace") return;
    const cur = segsRef.current[idx];
    if (cur.text.length > 0 || idx === 0) return;
    const prev = segsRef.current[idx - 1];
    const newSegs = segsRef.current.filter((_, i) => i !== idx);
    pushSegments(newSegs);
    setTimeout(() => {
      setActiveIdx(idx - 1);
      inputRefs.current[prev?.id]?.focus();
    }, 30);
  };

  const applyFmt = (patch: Partial<Segment>) => {
    patchSeg(activeIdx, patch);
    setFmt((prev) => ({ ...prev, ...patch }));
  };

  const toggleFmt = (
    key: "bold" | "italic" | "underline" | "strikethrough",
  ) => {
    applyFmt({ [key]: !fmt[key] });
  };

  // Emotion helpers
  const setEmotionEntry = (entry: EmotionEntry | undefined) => {
    emotionRef.current = entry;
    setEmotion(entry);
    triggerSave();
  };

  const confirmEmotion = (valence: number, intensity: 1 | 2 | 3) => {
    const def = EMOTIONS.find((e) => e.valence === valence)!;
    setEmotionEntry({
      valence,
      intensity,
      label: def.words[intensity - 1],
      color: def.color,
    });
    setPicker(null);
  };

  // Activity helpers
  const toggleActivity = (id: string) => {
    const next = activitiesRef.current.includes(id)
      ? activitiesRef.current.filter((a) => a !== id)
      : [...activitiesRef.current, id];
    activitiesRef.current = next;
    setActivities(next);
    triggerSave();
  };

  // Tag helpers
  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, "");
    if (!tag || tagsRef.current.includes(tag)) return;
    const next = [...tagsRef.current, tag];
    tagsRef.current = next;
    setTags(next);
    setTagInput("");
    triggerSave();
  };

  const removeTag = (tag: string) => {
    const next = tagsRef.current.filter((t) => t !== tag);
    tagsRef.current = next;
    setTags(next);
    triggerSave();
  };

  const toolbarBottom = kbHeight > 0 ? kbHeight : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: "#161616" }}>
      {/* Back button row */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={s.backBtn}
          disabled={isSavingUI}
        >
          <Text
            style={[s.backText, { color: isSavingUI ? "#555" : journalColor }]}
          >
            {isSavingUI ? "Saving..." : "‹ Back"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title input */}
      <TextInput
        style={s.titleInput}
        placeholder="Title"
        placeholderTextColor="#444"
        value={title}
        onChangeText={(t) => {
          setTitle(t);
          latestRef.current.title = t;
          triggerSave();
        }}
        selectionColor={journalColor}
      />

      {/* Bible Verse Card — read-only, visible lang kapag galing sa Bible tap */}
      {verseText ? (
        <View style={s.verseCard}>
          <Text style={s.verseCardRef}>📖 {verseRef}</Text>
          <Text style={s.verseCardText}>{verseText.replace(/^"|"$/g, "").trim()}</Text>
        </View>
      ) : null}

      {/* Editor */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          s.editorContent,
          { paddingBottom: kbHeight + 60 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {segments.map((seg, idx) => {
          const headingSize = seg.heading
            ? HEADING_SIZE[seg.heading]
            : (seg.fontSize ?? 16);
          const headingWeight = seg.heading
            ? HEADING_WEIGHT[seg.heading]
            : "400";
          return (

            <TextInput
              key={seg.id}
              ref={(r) => { inputRefs.current[seg.id] = r; }}
              placeholder={idx === 0 ? "Write your reflection here..." : ""}
              placeholderTextColor={journalColor + "55"}
              style={[
                s.segInput,
                {
                  fontSize: headingSize,
                  fontWeight: headingWeight,
                  color: seg.color ?? "#f0f0f0",
                  fontStyle: seg.italic ? "italic" : "normal",
                  textDecorationLine:
                    seg.underline && seg.strikethrough
                      ? "underline line-through"
                      : seg.underline
                        ? "underline"
                        : seg.strikethrough
                          ? "line-through"
                          : "none",
                  textAlign: seg.align ?? "left",
                  backgroundColor: seg.highlight || "transparent",
                  // ✅ Dynamic height — grows with content
                  height: Math.max(32, segHeights[seg.id] ?? 32),
                  minHeight: 32,
                },
              ]}
              value={seg.text}
              onChangeText={(t) => handleChange(idx, t)}
              onKeyPress={(e) => handleKeyPress(idx, e)}
              onFocus={() => setActiveIdx(idx)}
              onSubmitEditing={() => handleEnter(idx)}
              // ✅ Ito ang key — i-track ang actual rendered height
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                setSegHeights(prev => ({ ...prev, [seg.id]: h }));
              }}
              multiline
              // ✅ Huwag nang scrollEnabled — ang ScrollView parent ang bahala
              scrollEnabled={false}
              selectionColor={journalColor}
              blurOnSubmit={false}
            />

          );
        })}
      </ScrollView>

      {/* Formatting toolbar */}
      <View style={[s.toolbarWrap, { bottom: toolbarBottom }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.toolbarContent}
        >
          <ToolBtn
            label="B"
            active={!!fmt.bold}
            onPress={() => toggleFmt("bold")}
            bold
          />
          <ToolBtn
            label="I"
            active={!!fmt.italic}
            onPress={() => toggleFmt("italic")}
            italic
          />
          <ToolBtn
            label="U"
            active={!!fmt.underline}
            onPress={() => toggleFmt("underline")}
            underline
          />
          <ToolBtn
            label="S"
            active={!!fmt.strikethrough}
            onPress={() => toggleFmt("strikethrough")}
            strike
          />
          <Divider />
          <ToolBtn
            label="¶"
            active={!!fmt.heading}
            onPress={() => setPicker("heading")}
          />
          <ToolBtn
            label={`${fmt.fontSize ?? 16}`}
            onPress={() => setPicker("fontSize")}
          />
          <Divider />
          <TouchableOpacity
            onPress={() => setPicker("color")}
            style={[
              s.toolBtn,
              {
                borderBottomWidth: 3,
                borderBottomColor: fmt.color ?? journalColor,
              },
            ]}
          >
            <Text style={s.toolBtnTxt}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPicker("highlight")}
            style={[
              s.toolBtn,
              fmt.highlight ? { backgroundColor: fmt.highlight } : null,
            ]}
          >
            <Text
              style={[s.toolBtnTxt, fmt.highlight ? { color: "#111" } : null]}
            >
              🖍
            </Text>
          </TouchableOpacity>
          <Divider />
          <ToolBtn
            label={
              fmt.align === "center" ? "↔" : fmt.align === "right" ? "➡" : "⬅"
            }
            onPress={() => setPicker("align")}
          />
          <Divider />
          <TouchableOpacity
            onPress={() => setPicker("mood")}
            style={[
              s.toolBtn,
              emotion
                ? { borderBottomWidth: 3, borderBottomColor: emotion.color }
                : null,
            ]}
          >
            <Text style={s.toolBtnTxt}>{emotion ? "😊" : "😶"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom sheets */}
      <BottomSheet
        visible={picker === "heading"}
        title="Heading Style"
        onClose={() => setPicker(null)}
      >
        {HEADINGS.map((h) => (
          <ModalRow
            key={h.label}
            label={h.label}
            active={fmt.heading === h.value}
            onPress={() => {
              applyFmt({ heading: h.value, fontSize: h.size });
              setPicker(null);
            }}
            accentColor={journalColor}
            extra={
              <Text
                style={{
                  color: "#555",
                  fontSize: Math.max(10, h.size * 0.7),
                  fontWeight: h.weight,
                }}
              >
                {h.label}
              </Text>
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={picker === "fontSize"}
        title="Font Size"
        onClose={() => setPicker(null)}
      >
        {FONT_SIZES.map((sz) => (
          <ModalRow
            key={sz}
            label={`${sz}px`}
            active={fmt.fontSize === sz}
            onPress={() => {
              applyFmt({ fontSize: sz });
              setPicker(null);
            }}
            accentColor={journalColor}
            extra={
              <Text
                style={{ color: "#555", fontSize: Math.max(10, sz * 0.65) }}
              >
                Preview
              </Text>
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={picker === "color"}
        title="Font Color"
        onClose={() => setPicker(null)}
      >
        <View style={s.swatchGrid}>
          {FONT_COLORS.map((c) => (
            <TouchableOpacity
              key={c.value}
              onPress={() => {
                applyFmt({ color: c.value });
                setPicker(null);
              }}
              style={[
                s.swatch,
                { backgroundColor: c.value },
                fmt.color === c.value && s.swatchActive,
                c.value === "#f0f0f0" && { borderColor: "#555" },
              ]}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={picker === "highlight"}
        title="Highlight"
        onClose={() => setPicker(null)}
      >
        {HIGHLIGHT_COLORS.map((h) => (
          <ModalRow
            key={h.label}
            label={h.label}
            active={fmt.highlight === h.value}
            onPress={() => {
              applyFmt({ highlight: h.value });
              setPicker(null);
            }}
            accentColor={journalColor}
            extra={
              h.value ? (
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    backgroundColor: h.value,
                  }}
                />
              ) : null
            }
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={picker === "align"}
        title="Text Alignment"
        onClose={() => setPicker(null)}
      >
        {ALIGNS.map((a) => (
          <ModalRow
            key={a.value}
            label={a.label}
            active={fmt.align === a.value}
            onPress={() => {
              applyFmt({ align: a.value });
              setPicker(null);
            }}
            accentColor={journalColor}
          />
        ))}
      </BottomSheet>
      {/* Tags row above toolbar (only shown when tags exist or user is typing) */}
      {(tags.length > 0 || tagInput.length > 0) && (
        <View style={[s.tagsRow, { bottom: toolbarBottom + 50 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, alignItems: "center" }}
          >
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => removeTag(tag)}
                style={s.tagPill}
              >
                <Text style={s.tagPillText}>#{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Mood + Activity + Tags modal */}
      <Modal
        transparent
        visible={picker === "mood"}
        animationType="slide"
        onRequestClose={() => setPicker(null)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setPicker(null)}
        >
          <TouchableOpacity activeOpacity={1} style={s.moodSheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>How are you feeling?</Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Emotion wheel */}
              <Text style={s.moodSectionLabel}>MOOD</Text>
              <View style={s.emotionRow}>
                {EMOTIONS.map((e) => (
                  <TouchableOpacity
                    key={e.valence}
                    onPress={() =>
                      setSelectedValence(
                        selectedValence === e.valence ? null : e.valence,
                      )
                    }
                    style={[
                      s.emotionBtn,
                      { borderColor: e.color },
                      selectedValence === e.valence && {
                        backgroundColor: e.color + "33",
                      },
                    ]}
                  >
                    <View
                      style={[s.emotionDot, { backgroundColor: e.color }]}
                    />
                    <Text
                      style={[
                        s.emotionBtnLabel,
                        {
                          color:
                            selectedValence === e.valence ? e.color : "#666",
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Intensity selector */}
              {selectedValence !== null && (
                <View style={s.intensitySection}>
                  <Text style={s.moodSectionLabel}>INTENSITY</Text>
                  {([1, 2, 3] as const).map((i) => {
                    const def = EMOTIONS.find(
                      (e) => e.valence === selectedValence,
                    )!;
                    const isActive =
                      emotion?.valence === selectedValence &&
                      emotion?.intensity === i;
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => confirmEmotion(selectedValence, i)}
                        style={[
                          s.intensityRow,
                          isActive && { backgroundColor: def.color + "22" },
                        ]}
                      >
                        <View
                          style={[
                            s.intensityDot,
                            {
                              backgroundColor: def.color,
                              opacity: 0.3 + i * 0.23,
                            },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              s.intensityLabel,
                              isActive && { color: def.color },
                            ]}
                          >
                            {INTENSITY_LABELS[i - 1]} — {def.words[i - 1]}
                          </Text>
                        </View>
                        {isActive && (
                          <Text style={{ color: def.color }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  {emotion?.valence === selectedValence && (
                    <TouchableOpacity
                      onPress={() => {
                        setEmotionEntry(undefined);
                        setSelectedValence(null);
                      }}
                      style={s.clearEmotion}
                    >
                      <Text style={s.clearEmotionText}>Clear mood</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Activities */}
              <Text style={[s.moodSectionLabel, { marginTop: 20 }]}>
                ACTIVITY
              </Text>
              <View style={s.activityGrid}>
                {ACTIVITIES.map((act) => {
                  const active = activities.includes(act.id);
                  return (
                    <TouchableOpacity
                      key={act.id}
                      onPress={() => toggleActivity(act.id)}
                      style={[
                        s.activityBtn,
                        active && {
                          backgroundColor: journalColor + "33",
                          borderColor: journalColor,
                        },
                      ]}
                    >
                      <Text style={s.activityEmoji}>{act.emoji}</Text>
                      <Text
                        style={[
                          s.activityLabel,
                          active && { color: journalColor },
                        ]}
                      >
                        {act.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tags */}
              <Text style={[s.moodSectionLabel, { marginTop: 20 }]}>TAGS</Text>
              <View style={s.tagInputRow}>
                <TextInput
                  style={s.tagTextInput}
                  placeholder="Add tag..."
                  placeholderTextColor="#444"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={() => addTag(tagInput)}
                  returnKeyType="done"
                  selectionColor={journalColor}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => addTag(tagInput)}
                  style={[s.tagAddBtn, { backgroundColor: journalColor }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={s.tagPillsWrap}>
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => removeTag(tag)}
                      style={s.tagPill}
                    >
                      <Text style={s.tagPillText}>#{tag} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────

function ToolBtn({
  label,
  active,
  onPress,
  bold,
  italic,
  underline,
  strike,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.toolBtn, active && s.toolBtnActive]}
    >
      <Text
        style={[
          s.toolBtnTxt,
          active && s.toolBtnTxtActive,
          bold && { fontWeight: "700" },
          italic && { fontStyle: "italic" },
          underline && { textDecorationLine: "underline" },
          strike && { textDecorationLine: "line-through" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.sheetClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 340 }}>{children}</ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ModalRow({
  label,
  active,
  onPress,
  extra,
  accentColor,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  extra?: React.ReactNode;
  accentColor?: string;
}) {
  const accent = accentColor ?? "#c084fc";
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.sheetRow, active && { backgroundColor: accent + "22" }]}
    >
      <Text style={[s.sheetRowTxt, active && { color: accent }]}>{label}</Text>
      {extra}
      {active && <Text style={{ color: accent, marginLeft: "auto" }}>✓</Text>}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: "#161616",
  },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontWeight: "500" },
  titleInput: {
    backgroundColor: "#161616",
    color: "#f0f0f0",
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  verseCard: {
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "#0e0e1a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e1e35",
  },
  verseCardRef: {
    color: "#7c5fc4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  verseCardText: {
    color: "#b8aaee",
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  editorContent: { paddingHorizontal: 18, paddingTop: 14 },
  segInput: {
    width: "100%",
    color: "#f0f0f0",
    paddingVertical: 2,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    marginVertical: 1,
    ...(Platform.OS === "android" && {
      underlineColorAndroid: "transparent",
      textAlignVertical: "top",
    }),
  },
  toolbarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#222",
    zIndex: 100,
  },
  toolbarContent: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    alignItems: "center",
    gap: 4,
  },
  toolBtn: {
    minWidth: 36,
    height: 34,
    borderRadius: 7,
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  toolBtnActive: { backgroundColor: "#2d1f3f" },
  toolBtnTxt: { color: "#888", fontSize: 13, fontWeight: "500" },
  toolBtnTxtActive: { color: "#c084fc" },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: "#282828",
    marginHorizontal: 3,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 8,
    paddingBottom: 16,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: { borderColor: "#c084fc", transform: [{ scale: 1.15 }] },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f1f",
  },
  sheetTitle: { color: "#e0e0e0", fontSize: 15, fontWeight: "600" },
  sheetClose: { color: "#555", fontSize: 18, paddingHorizontal: 4 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  sheetRowTxt: { color: "#bbb", fontSize: 15, flex: 1 },
  // Mood sheet
  moodSheet: {
    backgroundColor: "#141414",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "85%",
  },
  moodSectionLabel: {
    color: "#444",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 10,
  },
  emotionRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    gap: 8,
  },
  emotionBtn: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  emotionDot: { width: 12, height: 12, borderRadius: 6 },
  emotionBtnLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  intensitySection: { marginTop: 12 },
  intensityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  intensityDot: { width: 10, height: 10, borderRadius: 5 },
  intensityLabel: { color: "#bbb", fontSize: 15 },
  clearEmotion: { paddingHorizontal: 18, paddingTop: 10 },
  clearEmotionText: { color: "#555", fontSize: 13 },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 8,
  },
  activityBtn: {
    width: "22%",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2a2a2a",
    paddingVertical: 10,
    gap: 4,
  },
  activityEmoji: { fontSize: 22 },
  activityLabel: { fontSize: 10, color: "#555", fontWeight: "600" },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    gap: 8,
  },
  tagTextInput: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    color: "#f0f0f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
  },
  tagAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tagPillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 18,
    marginTop: 10,
    gap: 6,
  },
  tagPill: {
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagPillText: { color: "#888", fontSize: 12 },
  tagsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#111",
  },
});