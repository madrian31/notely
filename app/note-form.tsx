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
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage, STORAGE_KEYS } from "./storage";

import * as Sharing from "expo-sharing";

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
  intensity: 1 | 2 | 3;
  color: string;
  valence: number;
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
  journalName?: string;
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

// ─── Emotion data ─────────────────────────────────────────────────────────────

type EmotionDef = {
  valence: number;
  label: string;
  color: string;
  words: [string, string, string];
};

const EMOTIONS: EmotionDef[] = [
  { valence: 1, label: "Very Unpleasant", color: "#ef4444", words: ["Uneasy", "Distressed", "Anguished"] },
  { valence: 2, label: "Unpleasant", color: "#f97316", words: ["Displeased", "Frustrated", "Miserable"] },
  { valence: 3, label: "Neutral", color: "#a3a3a3", words: ["Indifferent", "Neutral", "Numb"] },
  { valence: 4, label: "Pleasant", color: "#34d399", words: ["Content", "Happy", "Joyful"] },
  { valence: 5, label: "Very Pleasant", color: "#3b82f6", words: ["Pleased", "Elated", "Ecstatic"] },
];

const INTENSITY_LABELS = ["Slightly", "Moderately", "Strongly"] as const;

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

// ─── Devotion Card Themes ─────────────────────────────────────────────────────

const CARD_THEMES = [
  {
    id: "midnight",
    label: "Midnight",
    emoji: "🌙",
    bg: "#0d0d1a",
    accent: "#7c5fc4",
    accentLight: "#c084fc",
    verseColor: "#b8aaee",
    titleColor: "#f0f0f0",
    textColor: "#aaa",
    borderColor: "#1e1e35",
    decorColor: "#1a1a2e",
  },
  {
    id: "dawn",
    label: "Dawn",
    emoji: "🌅",
    bg: "#1a0e06",
    accent: "#c2752a",
    accentLight: "#f59e0b",
    verseColor: "#fcd9a0",
    titleColor: "#fff5e6",
    textColor: "#c8a87a",
    borderColor: "#2e1e0a",
    decorColor: "#231509",
  },
  {
    id: "forest",
    label: "Forest",
    emoji: "🌿",
    bg: "#071410",
    accent: "#2d7a5a",
    accentLight: "#4ade80",
    verseColor: "#a7f3d0",
    titleColor: "#ecfdf5",
    textColor: "#86efac",
    borderColor: "#0f2d20",
    decorColor: "#0a1f16",
  },
  {
    id: "ocean",
    label: "Ocean",
    emoji: "🌊",
    bg: "#060e1a",
    accent: "#1d5fa8",
    accentLight: "#60a5fa",
    verseColor: "#bfdbfe",
    titleColor: "#eff6ff",
    textColor: "#93c5fd",
    borderColor: "#0c2040",
    decorColor: "#08162e",
  },
];

// ─── General Note Card Themes ─────────────────────────────────────────────────

const NOTE_THEMES = [
  {
    id: "dark",
    label: "Dark",
    emoji: "🖤",
    bg: "#0d0d0d",
    accent: "",
    titleColor: "#f0f0f0",
    textColor: "#999",
    borderColor: "#1e1e1e",
    tagBg: "#1a1a1a",
    footerColor: "#333",
  },
  {
    id: "slate",
    label: "Slate",
    emoji: "🌫️",
    bg: "#0f1117",
    accent: "",
    titleColor: "#e8eaf0",
    textColor: "#8a8fa8",
    borderColor: "#1c1f2e",
    tagBg: "#171a26",
    footerColor: "#2a2d3a",
  },
  {
    id: "warm",
    label: "Warm",
    emoji: "🕯️",
    bg: "#110e09",
    accent: "",
    titleColor: "#f5ede0",
    textColor: "#9a8870",
    borderColor: "#2a2010",
    tagBg: "#1a1508",
    footerColor: "#2a1f0f",
  },
  {
    id: "cool",
    label: "Cool",
    emoji: "❄️",
    bg: "#08101a",
    accent: "",
    titleColor: "#e0eeff",
    textColor: "#6a8aaa",
    borderColor: "#0f1e30",
    tagBg: "#0a1520",
    footerColor: "#0f1e30",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function asString(val: string | string[] | undefined, fallback = ""): string {
  if (!val) return fallback;
  return Array.isArray(val) ? val[0] : val;
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function canvasWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 999,
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  let lineCount = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      if (lineCount >= maxLines - 1) {
        let truncated = line.trim();
        while (ctx.measureText(truncated + "…").width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated + "…", x, y);
        return y + lineHeight;
      }
      ctx.fillText(line.trim(), x, y);
      line = words[i] + " ";
      y += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, y);
  return y + lineHeight;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── Draw Devotion Card ───────────────────────────────────────────────────────

type DevotionCardData = {
  title: string;
  verseRef: string;
  verseText: string;
  plainText: string;
  date: string;
};

async function drawDevotionCard(
  theme: (typeof CARD_THEMES)[0],
  data: DevotionCardData,
): Promise<string> {
  const W = 720;
  const PAD = 56;

  // ── PASS 1: Measure everything to get true height ─────────────────────────
  const mc = document.createElement("canvas");
  mc.width = W; mc.height = 100;
  const mctx = mc.getContext("2d")!;

  function measureLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    font: string,
    maxWidth: number,
    lineHeight: number,
  ): number {
    ctx.font = font;
    let line = "", totalH = 0;
    for (const word of text.split(" ")) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line !== "") {
        totalH += lineHeight; line = word + " ";
      } else { line = test; }
    }
    if (line.trim()) totalH += lineHeight;
    return totalH;
  }

  // CHROME: accent bar(8) + top padding to date(56) + date height+gap(44)
  const CHROME = 8 + 56 + 44;

  const TITLE_H = data.title
    ? measureLines(mctx, data.title, "bold 44px Georgia, serif", W - PAD * 2, 56) + 20
    : 0;

  let VERSE_H = 0;
  if (data.verseText) {
    const VPAD = 28;
    const verseMaxW = W - PAD * 2 - VPAD * 2;
    const verseClean = data.verseText.replace(/^"|"$/g, "").trim();
    const vTextH = measureLines(mctx, `"${verseClean}"`, "italic 26px Georgia, serif", verseMaxW, 36);
    const verseRefH = data.verseRef ? 32 : 0;
    VERSE_H = VPAD * 2 + vTextH + verseRefH + 8 + 24;
  }

  let BODY_H = 0;
  if (data.plainText) {
    const paragraphs = data.plainText.split("\n").filter((p) => p.trim());
    for (const para of paragraphs) {
      BODY_H += measureLines(mctx, para, "22px Georgia, serif", W - PAD * 2, 34) + 10;
    }
    BODY_H += 8;
  }

  const FOOTER_H = 48 + 32;
  const H = CHROME + TITLE_H + VERSE_H + BODY_H + FOOTER_H + 40;

  // ── PASS 2: Draw ──────────────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  // Top accent bar
  ctx.fillStyle = theme.accent;
  ctx.fillRect(0, 0, W, 8);

  const cx = W / 2;
  // Start date well below the accent bar
  let curY = 64;

  // Date
  const dateStr = new Date(data.date || Date.now()).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  ctx.fillStyle = theme.accent;
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(dateStr.toUpperCase(), cx, curY);
  curY += 44;

  // Title — full text, no maxLines
  if (data.title) {
    ctx.fillStyle = theme.titleColor;
    ctx.font = "bold 44px Georgia, serif";
    ctx.textAlign = "center";
    curY = canvasWrapText(ctx, data.title, cx, curY, W - PAD * 2, 56);
    curY += 20;
  }

  // Verse block — full verse, no maxLines
  if (data.verseText) {
    const verseClean = data.verseText.replace(/^"|"$/g, "").trim();
    const VPAD = 28;
    const verseX = PAD + VPAD;
    const verseMaxW = W - PAD * 2 - VPAD * 2;

    const vTextH = measureLines(mctx, `"${verseClean}"`, "italic 26px Georgia, serif", verseMaxW, 36);
    const verseBlockH = VPAD * 2 + vTextH + (data.verseRef ? 32 : 0) + 8;

    roundRect(ctx, PAD, curY, W - PAD * 2, verseBlockH, 16);
    ctx.fillStyle = theme.decorColor;
    ctx.fill();

    roundRect(ctx, PAD, curY, 4, verseBlockH, 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();

    ctx.fillStyle = theme.verseColor;
    ctx.font = "italic 26px Georgia, serif";
    ctx.textAlign = "left";
    let vY = canvasWrapText(ctx, `"${verseClean}"`, verseX, curY + VPAD + 8, verseMaxW, 36);

    if (data.verseRef) {
      ctx.fillStyle = theme.accentLight;
      ctx.font = "bold 20px system-ui, sans-serif";
      ctx.fillText(`— ${data.verseRef}`, verseX, vY + 4);
    }

    curY += verseBlockH + 24;
  }

  // Body text — full reflection, paragraph-aware, no maxLines
  if (data.plainText) {
    ctx.fillStyle = theme.textColor;
    ctx.font = "22px Georgia, serif";
    ctx.textAlign = "left";
    const paragraphs = data.plainText.split("\n").filter((p) => p.trim());
    for (const para of paragraphs) {
      curY = canvasWrapText(ctx, para, PAD, curY, W - PAD * 2, 34);
      curY += 10;
    }
    curY += 8;
  }

  // Footer
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, curY + 8); ctx.lineTo(W - PAD, curY + 8); ctx.stroke();
  curY += 32;

  ctx.fillStyle = theme.accent;
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("✦ Notely", PAD, curY);

  ctx.fillStyle = theme.accent + "88";
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Daily Devotion", W - PAD, curY);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Canvas capture failed")); return; }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.96,
    );
  });
}

// ─── Draw General Note Card ───────────────────────────────────────────────────

type NoteCardData = {
  title: string;
  plainText: string;
  date: string;
  emotion?: EmotionEntry;
  tags?: string[];
  journalName?: string;
  accentColor: string;
};

async function drawGeneralNoteCard(
  theme: typeof NOTE_THEMES[0],
  data: NoteCardData,
): Promise<string> {
  const W = 720;
  const PAD = 52;
  const accent = data.accentColor;

  const measureCanvas = document.createElement("canvas");
  measureCanvas.width = W;
  measureCanvas.height = 100;
  const mctx = measureCanvas.getContext("2d")!;

  // Title lines
  mctx.font = "bold 40px Georgia, serif";
  const titleWords = (data.title || "Untitled").split(" ");
  let tLine = ""; let titleLines = 0;
  for (const w of titleWords) {
    const t = tLine + w + " ";
    if (mctx.measureText(t).width > W - PAD * 2 && tLine !== "") { titleLines++; tLine = w + " "; }
    else { tLine = t; }
  }
  titleLines++;

  // Body lines
  mctx.font = "22px Georgia, serif";
  const bodyWords = (data.plainText || "").split(" ").filter(Boolean);
  let bLine = ""; let bodyLines = 0;
  for (const w of bodyWords) {
    const t = bLine + w + " ";
    if (mctx.measureText(t).width > W - PAD * 2 && bLine !== "") { bodyLines++; bLine = w + " "; }
    else { bLine = t; }
  }
  if (bLine.trim()) bodyLines++;

  const TOP_CHROME = 8 + 60 + 28 + (titleLines * 52) + 16;
  const BODY_H = bodyLines > 0 ? bodyLines * 34 + 16 : 0;
  const TAGS_H = (data.tags && data.tags.length > 0) ? 48 : 0;
  const MOOD_H = data.emotion ? 44 : 0;
  const FOOTER_H = 64;
  const EXTRA_PAD = 32;

  const H = TOP_CHROME + BODY_H + TAGS_H + MOOD_H + FOOTER_H + EXTRA_PAD;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 8);

  let curY = 8 + 44;

  const dateStr = new Date(data.date || Date.now()).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  ctx.fillStyle = accent;
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(dateStr.toUpperCase(), PAD, curY);
  curY += 30;

  if (data.title) {
    ctx.fillStyle = theme.titleColor;
    ctx.font = "bold 40px Georgia, serif";
    ctx.textAlign = "left";
    curY = canvasWrapText(ctx, data.title, PAD, curY, W - PAD * 2, 52);
    curY += 14;
  }

  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, curY);
  ctx.lineTo(W - PAD, curY);
  ctx.stroke();
  curY += 20;

  if (data.plainText) {
    ctx.fillStyle = theme.textColor;
    ctx.font = "22px Georgia, serif";
    ctx.textAlign = "left";
    const paragraphs = data.plainText.split("\n").filter((p) => p.trim());
    for (const para of paragraphs) {
      curY = canvasWrapText(ctx, para, PAD, curY, W - PAD * 2, 34);
      curY += 10;
    }
    curY += 8;
  }

  if (data.tags && data.tags.length > 0) {
    ctx.font = "bold 18px system-ui, sans-serif";
    let tagX = PAD;
    for (const tag of data.tags) {
      const label = `#${tag}`;
      const tw = ctx.measureText(label).width + 28;
      const tagBg = accent + "22";
      roundRect(ctx, tagX, curY, tw, 30, 15);
      ctx.fillStyle = tagBg;
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, tagX + 14, curY + 15);
      tagX += tw + 10;
    }
    ctx.textBaseline = "alphabetic";
    curY += 46;
  }

  if (data.emotion) {
    const moodLabel = `${data.emotion.label}  ·  ${["Slightly", "Moderately", "Strongly"][data.emotion.intensity - 1]}`;
    ctx.font = "bold 18px system-ui, sans-serif";
    const mw = ctx.measureText(moodLabel).width + 36;
    roundRect(ctx, PAD, curY, mw, 32, 16);
    ctx.fillStyle = data.emotion.color + "22";
    ctx.fill();
    ctx.fillStyle = data.emotion.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(moodLabel, PAD + 18, curY + 16);
    ctx.textBaseline = "alphabetic";
    curY += 48;
  }

  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, curY + 10);
  ctx.lineTo(W - PAD, curY + 10);
  ctx.stroke();
  curY += 32;

  ctx.fillStyle = accent;
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("✦ Notely", PAD, curY);

  ctx.fillStyle = accent + "88";
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(data.journalName || "My Journal", W - PAD, curY);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) { reject(new Error("Canvas capture failed")); return; }
        resolve(URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.96,
    );
  });
}

// ─── Share helper ─────────────────────────────────────────────────────────────

async function shareOrDownloadBlobUrl(blobUrl: string, filename: string) {
  if (Platform.OS === "web") {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } else {
    const resp = await fetch(blobUrl);
    const blob = await resp.blob();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const FileSystem = require("expo-file-system");
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64.split(",")[1], {
          encoding: FileSystem.EncodingType.Base64,
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "image/jpeg",
            dialogTitle: "Share Note Card",
          });
        }
      } catch {
        await Sharing.shareAsync(base64);
      }
      URL.revokeObjectURL(blobUrl);
    };
    reader.readAsDataURL(blob);
  }
}

// ─── Devotion Card Preview (React Native view) ────────────────────────────────

function DevotionCardPreview({
  title, verseRef, verseText, segments, date, theme,
}: {
  title: string;
  verseRef: string;
  verseText: string;
  segments: Segment[];
  date: string;
  theme: (typeof CARD_THEMES)[0];
}) {
  const plainText = segmentsToPlain(segments).trim();
  const preview = plainText.length > 200 ? plainText.slice(0, 200).trimEnd() + "…" : plainText;
  const dateStr = new Date(date || Date.now()).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <View style={[dc.card, { backgroundColor: theme.bg, borderColor: theme.borderColor }]}>
      <View style={[dc.topBar, { backgroundColor: theme.accent }]} />
      <Text style={[dc.dateText, { color: theme.accent }]}>{dateStr.toUpperCase()}</Text>
      {title ? (
        <Text style={[dc.titleText, { color: theme.titleColor }]} numberOfLines={2}>{title}</Text>
      ) : null}
      {verseText ? (
        <View style={[dc.verseBlock, { backgroundColor: theme.decorColor, borderLeftColor: theme.accent }]}>
          <Text style={[dc.verseText, { color: theme.verseColor }]} numberOfLines={4}>
            "{verseText.replace(/^"|"$/g, "").trim()}"
          </Text>
          {verseRef ? (
            <Text style={[dc.verseRef, { color: theme.accentLight }]}>— {verseRef}</Text>
          ) : null}
        </View>
      ) : null}
      {preview ? (
        <Text style={[dc.bodyText, { color: theme.textColor }]} numberOfLines={4}>{preview}</Text>
      ) : null}
      <View style={[dc.footerDivider, { backgroundColor: theme.borderColor }]} />
      <View style={dc.footer}>
        <Text style={[dc.footerBrand, { color: theme.accent }]}>✦ Notely</Text>
        <Text style={[dc.footerSub, { color: theme.accent + "88" }]}>Daily Devotion</Text>
      </View>
    </View>
  );
}

// ─── General Note Card Preview (React Native view) ────────────────────────────

function NoteCardPreview({
  title, segments, date, emotion, tags, journalName, accentColor, theme,
}: {
  title: string;
  segments: Segment[];
  date: string;
  emotion?: EmotionEntry;
  tags?: string[];
  journalName?: string;
  accentColor: string;
  theme: typeof NOTE_THEMES[0];
}) {
  const plainText = segmentsToPlain(segments).trim();
  const dateStr = new Date(date || Date.now()).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <View style={[nc.card, { backgroundColor: theme.bg, borderColor: theme.borderColor }]}>
      <View style={[nc.topBar, { backgroundColor: accentColor }]} />
      <View style={nc.header}>
        <Text style={[nc.dateText, { color: accentColor }]}>{dateStr.toUpperCase()}</Text>
        {title ? (
          <Text style={[nc.titleText, { color: theme.titleColor }]} numberOfLines={2}>{title}</Text>
        ) : null}
      </View>
      <View style={[nc.divider, { backgroundColor: theme.borderColor }]} />
      {plainText ? (
        <Text style={[nc.bodyText, { color: theme.textColor }]} numberOfLines={6}>{plainText}</Text>
      ) : null}
      {tags && tags.length > 0 ? (
        <View style={nc.tagsRow}>
          {tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[nc.tagPill, { backgroundColor: accentColor + "22" }]}>
              <Text style={[nc.tagText, { color: accentColor }]}>#{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {emotion ? (
        <View style={[nc.moodPill, { backgroundColor: emotion.color + "22" }]}>
          <Text style={[nc.moodText, { color: emotion.color }]}>
            {emotion.label} · {["Slightly", "Moderately", "Strongly"][emotion.intensity - 1]}
          </Text>
        </View>
      ) : null}
      <View style={[nc.footerDivider, { backgroundColor: theme.borderColor }]} />
      <View style={nc.footer}>
        <Text style={[nc.footerBrand, { color: accentColor }]}>✦ Notely</Text>
        <Text style={[nc.footerSub, { color: accentColor + "88" }]}>{journalName || "My Journal"}</Text>
      </View>
    </View>
  );
}

const dc = StyleSheet.create({
  card: { width: 320, borderRadius: 20, borderWidth: 1, overflow: "hidden", paddingBottom: 20 },
  topBar: { height: 5, width: "100%" },
  dateText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.2, textAlign: "center", marginTop: 16, marginBottom: 10, paddingHorizontal: 24 },
  titleText: { fontSize: 18, fontWeight: "800", textAlign: "center", paddingHorizontal: 24, marginBottom: 14, lineHeight: 24 },
  verseBlock: { marginHorizontal: 16, marginBottom: 14, padding: 12, borderRadius: 10, borderLeftWidth: 3 },
  verseText: { fontSize: 12, fontStyle: "italic", lineHeight: 18, marginBottom: 6 },
  verseRef: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  bodyText: { fontSize: 12, lineHeight: 18, paddingHorizontal: 24, marginBottom: 14 },
  footerDivider: { height: 1, marginHorizontal: 24, marginBottom: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24 },
  footerBrand: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  footerSub: { fontSize: 10, letterSpacing: 0.2 },
});

const nc = StyleSheet.create({
  card: { width: 320, borderRadius: 20, borderWidth: 1, overflow: "hidden", paddingBottom: 16 },
  topBar: { height: 5, width: "100%" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  dateText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.2, marginBottom: 8 },
  titleText: { fontSize: 18, fontWeight: "700", lineHeight: 24 },
  divider: { height: 1, marginHorizontal: 20, marginBottom: 12 },
  bodyText: { fontSize: 12, lineHeight: 18, paddingHorizontal: 20, marginBottom: 12 },
  tagsRow: { flexDirection: "row", gap: 6, paddingHorizontal: 20, marginBottom: 10, flexWrap: "wrap" },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 10, fontWeight: "700" },
  moodPill: { marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start" },
  moodText: { fontSize: 10, fontWeight: "700" },
  footerDivider: { height: 1, marginHorizontal: 20, marginBottom: 10 },
  footer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 },
  footerBrand: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  footerSub: { fontSize: 10, letterSpacing: 0.2 },
});

// ─── Share Modal — Devotion ───────────────────────────────────────────────────

function ShareDevotionModal({
  visible, onClose, title, verseRef, verseText, segments, date, journalColor,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  verseRef: string;
  verseText: string;
  segments: Segment[];
  date: string;
  journalColor: string;
}) {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState("");

  const plainText = segmentsToPlain(segments).trim();
  const theme = CARD_THEMES[selectedTheme];

  const handleShare = async () => {
    setIsCapturing(true);
    setStatus("Drawing card...");
    try {
      const blobUrl = await drawDevotionCard(theme, { title, verseRef, verseText, plainText, date });
      setStatus("Opening share options...");
      await shareOrDownloadBlobUrl(blobUrl, `devotion-${Date.now()}.jpg`);
      setStatus(Platform.OS === "web" ? "Downloaded! 🎉 Save and share on Messenger." : "");
      if (Platform.OS === "web") setTimeout(() => setStatus(""), 4000);
    } catch (err) {
      console.log("Share error:", err);
      setStatus("Something went wrong. Try again.");
      setTimeout(() => setStatus(""), 3000);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.handle} />
          <View style={sm.header}>
            <View>
              <Text style={sm.headerTitle}>Share Devotion</Text>
              <Text style={sm.headerSub}>Choose a card theme to share</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sm.closeBtn}>
              <Text style={sm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={sm.cardPreviewWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
                <DevotionCardPreview title={title} verseRef={verseRef} verseText={verseText} segments={segments} date={date} theme={theme} />
              </ScrollView>
              <Text style={sm.previewNote}>↑ Preview — buong content kasama sa actual image</Text>
            </View>

            <Text style={sm.sectionLabel}>THEME</Text>
            <View style={sm.themeRow}>
              {CARD_THEMES.map((t, idx) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTheme(idx)}
                  style={[sm.themeBtn, { backgroundColor: t.bg, borderColor: t.borderColor }, selectedTheme === idx && { borderColor: t.accent, borderWidth: 2 }]}
                >
                  <Text style={sm.themeEmoji}>{t.emoji}</Text>
                  <Text style={[sm.themeLabel, { color: t.accentLight }]}>{t.label}</Text>
                  {selectedTheme === idx && (
                    <View style={[sm.themeCheck, { backgroundColor: t.accent }]}>
                      <Text style={sm.themeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {status ? (
              <View style={sm.statusBox}>
                <Text style={[sm.statusText, { color: journalColor }]}>{status}</Text>
              </View>
            ) : (
              <View style={sm.tipBox}>
                <Text style={sm.tipText}>
                  {Platform.OS === "web"
                    ? "💡 In the browser, the image will be downloaded. You can now share it in your Messenger group!"
                    : "💡 Share the image on Messenger, Facebook, or anywhere you like!"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleShare}
              disabled={isCapturing}
              style={[sm.shareBtn, { backgroundColor: journalColor }, isCapturing && { opacity: 0.6 }]}
            >
              <Text style={sm.shareBtnText}>
                {isCapturing ? status || "Working..." : Platform.OS === "web" ? "⬇️  Download as Image" : "📤  Share as Image"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Share Modal — General Note ───────────────────────────────────────────────

function ShareNoteModal({
  visible, onClose, title, segments, date, emotion, tags, journalName, journalColor,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  segments: Segment[];
  date: string;
  emotion?: EmotionEntry;
  tags?: string[];
  journalName?: string;
  journalColor: string;
}) {
  const [selectedTheme, setSelectedTheme] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState("");

  const theme = { ...NOTE_THEMES[selectedTheme], accent: journalColor };

  const handleShare = async () => {
    setIsCapturing(true);
    setStatus("Drawing card...");
    try {
      const plainText = segmentsToPlain(segments).trim();
      const blobUrl = await drawGeneralNoteCard(theme, {
        title, plainText, date, emotion, tags, journalName, accentColor: journalColor,
      });
      setStatus("Opening share options...");
      await shareOrDownloadBlobUrl(blobUrl, `note-${Date.now()}.jpg`);
      setStatus(Platform.OS === "web" ? "Downloaded! 🎉" : "");
      if (Platform.OS === "web") setTimeout(() => setStatus(""), 4000);
    } catch (err) {
      console.log("Share error:", err);
      setStatus("Something went wrong. Try again.");
      setTimeout(() => setStatus(""), 3000);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.handle} />
          <View style={sm.header}>
            <View>
              <Text style={sm.headerTitle}>Share Note</Text>
              <Text style={sm.headerSub}>
                {Platform.OS === "web" ? "Image will be downloaded" : "Saves as image, share anywhere"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={sm.closeBtn}>
              <Text style={sm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            <View style={sm.cardPreviewWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16 }}>
                <NoteCardPreview
                  title={title}
                  segments={segments}
                  date={date}
                  emotion={emotion}
                  tags={tags}
                  journalName={journalName}
                  accentColor={journalColor}
                  theme={theme}
                />
              </ScrollView>
              <Text style={sm.previewNote}>↑ Preview — buong content kasama sa actual image</Text>
            </View>

            <Text style={sm.sectionLabel}>BACKGROUND</Text>
            <View style={sm.themeRow}>
              {NOTE_THEMES.map((t, idx) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTheme(idx)}
                  style={[
                    sm.themeBtn,
                    { backgroundColor: t.bg, borderColor: t.borderColor },
                    selectedTheme === idx && { borderColor: journalColor, borderWidth: 2 },
                  ]}
                >
                  <Text style={sm.themeEmoji}>{t.emoji}</Text>
                  <Text style={[sm.themeLabel, { color: journalColor }]}>{t.label}</Text>
                  {selectedTheme === idx && (
                    <View style={[sm.themeCheck, { backgroundColor: journalColor }]}>
                      <Text style={sm.themeCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {status ? (
              <View style={sm.statusBox}>
                <Text style={[sm.statusText, { color: journalColor }]}>{status}</Text>
              </View>
            ) : (
              <View style={sm.tipBox}>
                <Text style={sm.tipText}>
                  💡 Ang buong laman ng note ay kasama sa image — walang nababawas!
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleShare}
              disabled={isCapturing}
              style={[sm.shareBtn, { backgroundColor: journalColor }, isCapturing && { opacity: 0.6 }]}
            >
              <Text style={sm.shareBtnText}>
                {isCapturing ? status || "Working..." : Platform.OS === "web" ? "⬇️  Download as Image" : "📤  Share as Image"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const sm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  headerTitle: { color: "#f0f0f0", fontSize: 16, fontWeight: "700" },
  headerSub: { color: "#555", fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },
  closeText: { color: "#555", fontSize: 18 },
  cardPreviewWrap: { alignItems: "center", paddingVertical: 20, backgroundColor: "#0a0a0a", borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  previewNote: { color: "#444", fontSize: 11, marginTop: 8, textAlign: "center" },
  sectionLabel: { color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  themeRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10 },
  themeBtn: { flex: 1, alignItems: "center", borderRadius: 14, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 4, gap: 5, position: "relative" },
  themeEmoji: { fontSize: 20 },
  themeLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  themeCheck: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  themeCheckText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  statusBox: { marginHorizontal: 20, marginTop: 18, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 12, alignItems: "center" },
  statusText: { fontSize: 13, fontWeight: "600" },
  tipBox: { marginHorizontal: 20, marginTop: 18, backgroundColor: "#1a1a1a", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#252525" },
  tipText: { color: "#666", fontSize: 12, lineHeight: 18 },
  shareBtn: { marginHorizontal: 20, marginTop: 16, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  shareBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NoteForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const noteId = asString(params.id);
  const journalId = asString(params.journalId);
  const journalColor = asString(params.journalColor, "#c084fc");
  const journalName = asString(params.journalName, "My Journal");
  const initialTitle = asString(params.initialTitle, "");
  const paramVerseRef = asString(params.verseRef, "");
  const paramVerseText = asString(params.verseText, "");

  const storageKey = STORAGE_KEYS.notes(journalId);

  const [title, setTitle] = useState(initialTitle);
  const [verseRef, setVerseRef] = useState(paramVerseRef);
  const [verseText, setVerseText] = useState(paramVerseText);
  const verseRefRef = useRef(paramVerseRef);
  const verseTextRef = useRef(paramVerseText);
  const [segments, setSegments] = useState<Segment[]>([defaultSegment()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [fmt, setFmt] = useState<Partial<Segment>>({
    bold: false, italic: false, underline: false, strikethrough: false,
    fontSize: 16, color: "#f0f0f0", highlight: "", heading: undefined, align: "left",
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
  const [selectedValence, setSelectedValence] = useState<number | null>(null);
  const [segHeights, setSegHeights] = useState<Record<string, number>>({});

  const [showDevotionShareModal, setShowDevotionShareModal] = useState(false);
  const [showNoteShareModal, setShowNoteShareModal] = useState(false);

  const [noteDate, setNoteDate] = useState(new Date().toISOString());
  const [editorFocused, setEditorFocused] = useState(false);
  const hasContent = segments.some((s) => s.text.trim().length > 0);

  const isDevotionNote = !!(verseRef || verseText);

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

  useEffect(() => {
    const onShow = (e: KeyboardEvent) => setKbHeight(e.endCoordinates.height);
    const onHide = () => setKbHeight(0);
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);
    return () => { s1.remove(); s2.remove(); };
  }, []);

  useEffect(() => {
    if (noteId) loadNote();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  useEffect(() => {
    const seg = segments[activeIdx];
    if (!seg) return;
    setFmt({
      bold: seg.bold ?? false, italic: seg.italic ?? false,
      underline: seg.underline ?? false, strikethrough: seg.strikethrough ?? false,
      fontSize: seg.fontSize ?? 16, color: seg.color ?? "#f0f0f0",
      highlight: seg.highlight ?? "", heading: seg.heading, align: seg.align ?? "left",
    });
  }, [activeIdx, segments]);

  const loadNote = async () => {
    try {
      const stored = await Storage.getItem(storageKey);
      const parsed: Note[] = stored ? JSON.parse(stored) : [];
      const existing = parsed.find((n) => n.id === noteId);
      if (!existing) return;
      setTitle(existing.title);
      if (existing.date) setNoteDate(existing.date);
      const segs = existing.segments?.length ? existing.segments : [defaultSegment({ text: existing.text })];
      setSegments(segs);
      segsRef.current = segs;
      latestRef.current = { title: existing.title, segments: segs };
      if (existing.emotion) { setEmotion(existing.emotion); setSelectedValence(existing.emotion.valence); }
      if (existing.activities) setActivities(existing.activities);
      if (existing.tags) setTags(existing.tags);
      if (existing.verseRef) { setVerseRef(existing.verseRef); verseRefRef.current = existing.verseRef; }
      if (existing.verseText) { setVerseText(existing.verseText); verseTextRef.current = existing.verseText; }
    } catch (err) {
      console.log("loadNote error:", err);
    }
  };

  const saveNow = async () => {
    if (isSaving.current) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => { if (!isSaving.current) { clearInterval(interval); resolve(); } }, 50);
      });
    }
    isSaving.current = true;
    const { title, segments } = latestRef.current;
    const cleanTitle = title.trim();
    const plainText = segmentsToPlain(segments).trim();
    if (!cleanTitle && !plainText) { isSaving.current = false; return; }

    try {
      const stored = await Storage.getItem(storageKey);
      const parsed: Note[] = stored ? JSON.parse(stored) : [];
      let updated: Note[];

      if (noteIdRef.current) {
        updated = parsed.map((n) =>
          n.id === noteIdRef.current
            ? {
              ...n, title: cleanTitle, text: plainText, segments,
              emotion: emotionRef.current, activities: activitiesRef.current,
              tags: tagsRef.current,
              verseRef: verseRefRef.current || n.verseRef,
              verseText: verseTextRef.current || n.verseText,
            }
            : n,
        );
      } else {
        const newId = Date.now().toString();
        noteIdRef.current = newId;
        const nowISO = new Date().toISOString();
        setNoteDate(nowISO);
        updated = [
          {
            id: newId, title: cleanTitle, text: plainText, segments, date: nowISO,
            emotion: emotionRef.current, activities: activitiesRef.current,
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

  const handleBack = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const hasContent = latestRef.current.title.trim() || segmentsToPlain(latestRef.current.segments).trim();
    if (hasChanges.current || hasContent) {
      setIsSavingUI(true);
      isSaving.current = false;
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
    const next = segsRef.current.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    pushSegments(next);
  };

  const handleChange = (idx: number, newText: string) => {
    if (!newText.includes("\n")) { patchSeg(idx, { text: newText }); return; }
    const parts = newText.split("\n");
    const cur = segsRef.current[idx];
    const before = segsRef.current.slice(0, idx);
    const after = segsRef.current.slice(idx + 1);
    const newSegs: Segment[] = [
      ...before,
      { ...cur, text: parts[0] },
      ...parts.slice(1).map((p) => defaultSegment({ text: p, fontSize: cur.fontSize, color: cur.color, align: cur.align })),
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
    const newSeg = defaultSegment({ fontSize: cur.fontSize, color: cur.color, align: cur.align });
    const newSegs = [...before, newSeg, ...after];
    pushSegments(newSegs);
    setTimeout(() => { setActiveIdx(idx + 1); inputRefs.current[newSeg.id]?.focus(); }, 30);
  };

  const handleKeyPress = (idx: number, e: any) => {
    if (e.nativeEvent.key !== "Backspace") return;
    const cur = segsRef.current[idx];
    if (cur.text.length > 0 || idx === 0) return;
    const prev = segsRef.current[idx - 1];
    const newSegs = segsRef.current.filter((_, i) => i !== idx);
    pushSegments(newSegs);
    setTimeout(() => { setActiveIdx(idx - 1); inputRefs.current[prev?.id]?.focus(); }, 30);
  };

  const applyFmt = (patch: Partial<Segment>) => {
    patchSeg(activeIdx, patch);
    setFmt((prev) => ({ ...prev, ...patch }));
  };

  const toggleFmt = (key: "bold" | "italic" | "underline" | "strikethrough") => {
    applyFmt({ [key]: !fmt[key] });
  };

  const setEmotionEntry = (entry: EmotionEntry | undefined) => {
    emotionRef.current = entry;
    setEmotion(entry);
    triggerSave();
  };

  const confirmEmotion = (valence: number, intensity: 1 | 2 | 3) => {
    const def = EMOTIONS.find((e) => e.valence === valence)!;
    setEmotionEntry({ valence, intensity, label: def.words[intensity - 1], color: def.color });
    setPicker(null);
  };

  const toggleActivity = (id: string) => {
    const next = activitiesRef.current.includes(id)
      ? activitiesRef.current.filter((a) => a !== id)
      : [...activitiesRef.current, id];
    activitiesRef.current = next;
    setActivities(next);
    triggerSave();
  };

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

  const handleShare = () => {
    if (isDevotionNote) {
      setShowDevotionShareModal(true);
    } else {
      setShowNoteShareModal(true);
    }
  };

  const toolbarBottom = kbHeight > 0 ? kbHeight : insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: "#161616" }}>
      {/* Top bar */}
      <View style={[s.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn} disabled={isSavingUI}>
          <Text style={[s.backText, { color: isSavingUI ? "#555" : journalColor }]}>
            {isSavingUI ? "Saving..." : "‹ Back"}
          </Text>
        </TouchableOpacity>

        {(hasContent || title.trim() || verseText) ? (
          <TouchableOpacity onPress={handleShare} style={[s.shareBtn, { borderColor: journalColor + "55" }]}>
            <Text style={[s.shareBtnText, { color: journalColor }]}>📤 Share</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Title input */}
      <TextInput
        style={s.titleInput}
        placeholder="Title your note..."
        placeholderTextColor="#333"
        value={title}
        onChangeText={(t) => { setTitle(t); latestRef.current.title = t; triggerSave(); }}
        selectionColor={journalColor}
      />

      {/* Bible Verse Card */}
      {verseText ? (
        <View style={s.verseCard}>
          <Text style={s.verseCardRef}>📖 {verseRef}</Text>
          <Text style={s.verseCardText}>{verseText.replace(/^"|"$/g, "").trim()}</Text>
        </View>
      ) : null}

      {/* Editor */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.editorContent, { paddingBottom: kbHeight + 80 }]}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {!hasContent && !editorFocused && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => inputRefs.current[segments[0]?.id]?.focus()}
            style={s.emptyEditorHint}
          >
            <Text style={s.emptyEditorIcon}>✍️</Text>
            <Text style={[s.emptyEditorText, { color: journalColor + "99" }]}>
              Tap here to start writing...
            </Text>
          </TouchableOpacity>
        )}

        {segments.map((seg, idx) => {
          const headingSize = seg.heading ? HEADING_SIZE[seg.heading] : (seg.fontSize ?? 16);
          const headingWeight = seg.heading ? HEADING_WEIGHT[seg.heading] : "400";
          const isActive = idx === activeIdx && editorFocused;

          return (
            <View
              key={seg.id}
              style={[
                s.segWrapper,
                isActive && {
                  borderLeftColor: journalColor,
                  borderLeftWidth: 2,
                  paddingLeft: 10,
                  marginLeft: -12,
                  backgroundColor: journalColor + "08",
                  borderRadius: 4,
                },
              ]}
            >
              <TextInput
                ref={(r) => { inputRefs.current[seg.id] = r; }}
                placeholder={idx === activeIdx ? "Continue writing..." : ""}
                placeholderTextColor={journalColor + "40"}
                style={[
                  s.segInput,
                  {
                    fontSize: headingSize,
                    fontWeight: headingWeight,
                    color: seg.color ?? "#f0f0f0",
                    fontStyle: seg.italic ? "italic" : "normal",
                    textDecorationLine:
                      seg.underline && seg.strikethrough ? "underline line-through"
                        : seg.underline ? "underline"
                          : seg.strikethrough ? "line-through"
                            : "none",
                    textAlign: seg.align ?? "left",
                    backgroundColor: seg.highlight || "transparent",
                    height: Math.max(32, segHeights[seg.id] ?? 32),
                    minHeight: 32,
                  },
                ]}
                value={seg.text}
                onChangeText={(t) => handleChange(idx, t)}
                onKeyPress={(e) => handleKeyPress(idx, e)}
                onFocus={() => { setActiveIdx(idx); setEditorFocused(true); }}
                onBlur={() => setEditorFocused(false)}
                onSubmitEditing={() => handleEnter(idx)}
                onContentSizeChange={(e) => {
                  const h = e.nativeEvent.contentSize.height;
                  setSegHeights((prev) => ({ ...prev, [seg.id]: h }));
                }}
                multiline
                scrollEnabled={false}
                selectionColor={journalColor}
                blurOnSubmit={false}
              />
            </View>
          );
        })}

        {hasContent && (
          <Text style={s.wordCount}>
            {segmentsToPlain(segments).trim().split(/\s+/).filter(Boolean).length} words
          </Text>
        )}
      </ScrollView>

      {/* Formatting toolbar */}
      <View style={[s.toolbarWrap, { bottom: toolbarBottom }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toolbarContent}>
          <ToolBtn label="B" active={!!fmt.bold} onPress={() => toggleFmt("bold")} bold />
          <ToolBtn label="I" active={!!fmt.italic} onPress={() => toggleFmt("italic")} italic />
          <ToolBtn label="U" active={!!fmt.underline} onPress={() => toggleFmt("underline")} underline />
          <ToolBtn label="S" active={!!fmt.strikethrough} onPress={() => toggleFmt("strikethrough")} strike />
          <Divider />
          <ToolBtn label="¶" active={!!fmt.heading} onPress={() => setPicker("heading")} />
          <ToolBtn label={`${fmt.fontSize ?? 16}`} onPress={() => setPicker("fontSize")} />
          <Divider />
          <TouchableOpacity
            onPress={() => setPicker("color")}
            style={[s.toolBtn, { borderBottomWidth: 3, borderBottomColor: fmt.color ?? journalColor }]}
          >
            <Text style={s.toolBtnTxt}>A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPicker("highlight")}
            style={[s.toolBtn, fmt.highlight ? { backgroundColor: fmt.highlight } : null]}
          >
            <Text style={[s.toolBtnTxt, fmt.highlight ? { color: "#111" } : null]}>🖍</Text>
          </TouchableOpacity>
          <Divider />
          <ToolBtn
            label={fmt.align === "center" ? "↔" : fmt.align === "right" ? "➡" : "⬅"}
            onPress={() => setPicker("align")}
          />
          <Divider />
          <TouchableOpacity
            onPress={() => setPicker("mood")}
            style={[s.toolBtn, emotion ? { borderBottomWidth: 3, borderBottomColor: emotion.color } : null]}
          >
            <Text style={s.toolBtnTxt}>{emotion ? "😊" : "😶"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Bottom sheets */}
      <BottomSheet visible={picker === "heading"} title="Heading Style" onClose={() => setPicker(null)}>
        {HEADINGS.map((h) => (
          <ModalRow key={h.label} label={h.label} active={fmt.heading === h.value}
            onPress={() => { applyFmt({ heading: h.value, fontSize: h.size }); setPicker(null); }}
            accentColor={journalColor}
            extra={<Text style={{ color: "#555", fontSize: Math.max(10, h.size * 0.7), fontWeight: h.weight }}>{h.label}</Text>}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={picker === "fontSize"} title="Font Size" onClose={() => setPicker(null)}>
        {FONT_SIZES.map((sz) => (
          <ModalRow key={sz} label={`${sz}px`} active={fmt.fontSize === sz}
            onPress={() => { applyFmt({ fontSize: sz }); setPicker(null); }}
            accentColor={journalColor}
            extra={<Text style={{ color: "#555", fontSize: Math.max(10, sz * 0.65) }}>Preview</Text>}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={picker === "color"} title="Font Color" onClose={() => setPicker(null)}>
        <View style={s.swatchGrid}>
          {FONT_COLORS.map((c) => (
            <TouchableOpacity key={c.value} onPress={() => { applyFmt({ color: c.value }); setPicker(null); }}
              style={[s.swatch, { backgroundColor: c.value }, fmt.color === c.value && s.swatchActive, c.value === "#f0f0f0" && { borderColor: "#555" }]}
            />
          ))}
        </View>
      </BottomSheet>

      <BottomSheet visible={picker === "highlight"} title="Highlight" onClose={() => setPicker(null)}>
        {HIGHLIGHT_COLORS.map((h) => (
          <ModalRow key={h.label} label={h.label} active={fmt.highlight === h.value}
            onPress={() => { applyFmt({ highlight: h.value }); setPicker(null); }}
            accentColor={journalColor}
            extra={h.value ? <View style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: h.value }} /> : null}
          />
        ))}
      </BottomSheet>

      <BottomSheet visible={picker === "align"} title="Text Alignment" onClose={() => setPicker(null)}>
        {ALIGNS.map((a) => (
          <ModalRow key={a.value} label={a.label} active={fmt.align === a.value}
            onPress={() => { applyFmt({ align: a.value }); setPicker(null); }}
            accentColor={journalColor}
          />
        ))}
      </BottomSheet>

      {(tags.length > 0 || tagInput.length > 0) && (
        <View style={[s.tagsRow, { bottom: toolbarBottom + 50 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, alignItems: "center" }}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={s.tagPill}>
                <Text style={s.tagPillText}>#{tag} ✕</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Mood Modal */}
      <Modal transparent visible={picker === "mood"} animationType="slide" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setPicker(null)}>
          <TouchableOpacity activeOpacity={1} style={s.moodSheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>How are you feeling?</Text>
              <TouchableOpacity onPress={() => setPicker(null)}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={s.moodSectionLabel}>MOOD</Text>
              <View style={s.emotionRow}>
                {EMOTIONS.map((e) => (
                  <TouchableOpacity key={e.valence}
                    onPress={() => setSelectedValence(selectedValence === e.valence ? null : e.valence)}
                    style={[s.emotionBtn, { borderColor: e.color }, selectedValence === e.valence && { backgroundColor: e.color + "33" }]}
                  >
                    <View style={[s.emotionDot, { backgroundColor: e.color }]} />
                    <Text style={[s.emotionBtnLabel, { color: selectedValence === e.valence ? e.color : "#666" }]} numberOfLines={2}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedValence !== null && (
                <View style={s.intensitySection}>
                  <Text style={s.moodSectionLabel}>INTENSITY</Text>
                  {([1, 2, 3] as const).map((i) => {
                    const def = EMOTIONS.find((e) => e.valence === selectedValence)!;
                    const isActive = emotion?.valence === selectedValence && emotion?.intensity === i;
                    return (
                      <TouchableOpacity key={i} onPress={() => confirmEmotion(selectedValence, i)}
                        style={[s.intensityRow, isActive && { backgroundColor: def.color + "22" }]}
                      >
                        <View style={[s.intensityDot, { backgroundColor: def.color, opacity: 0.3 + i * 0.23 }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[s.intensityLabel, isActive && { color: def.color }]}>
                            {INTENSITY_LABELS[i - 1]} — {def.words[i - 1]}
                          </Text>
                        </View>
                        {isActive && <Text style={{ color: def.color }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                  {emotion?.valence === selectedValence && (
                    <TouchableOpacity onPress={() => { setEmotionEntry(undefined); setSelectedValence(null); }} style={s.clearEmotion}>
                      <Text style={s.clearEmotionText}>Clear mood</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={[s.moodSectionLabel, { marginTop: 20 }]}>ACTIVITY</Text>
              <View style={s.activityGrid}>
                {ACTIVITIES.map((act) => {
                  const active = activities.includes(act.id);
                  return (
                    <TouchableOpacity key={act.id} onPress={() => toggleActivity(act.id)}
                      style={[s.activityBtn, active && { backgroundColor: journalColor + "33", borderColor: journalColor }]}
                    >
                      <Text style={s.activityEmoji}>{act.emoji}</Text>
                      <Text style={[s.activityLabel, active && { color: journalColor }]}>{act.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

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
                <TouchableOpacity onPress={() => addTag(tagInput)} style={[s.tagAddBtn, { backgroundColor: journalColor }]}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Add</Text>
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={s.tagPillsWrap}>
                  {tags.map((tag) => (
                    <TouchableOpacity key={tag} onPress={() => removeTag(tag)} style={s.tagPill}>
                      <Text style={s.tagPillText}>#{tag} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Devotion Share Modal */}
      <ShareDevotionModal
        visible={showDevotionShareModal}
        onClose={() => setShowDevotionShareModal(false)}
        title={title}
        verseRef={verseRef}
        verseText={verseText}
        segments={segments}
        date={noteDate}
        journalColor={journalColor}
      />

      {/* General Note Share Modal */}
      <ShareNoteModal
        visible={showNoteShareModal}
        onClose={() => setShowNoteShareModal(false)}
        title={title}
        segments={segments}
        date={noteDate}
        emotion={emotion}
        tags={tags}
        journalName={journalName}
        journalColor={journalColor}
      />
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
      <Text style={[s.toolBtnTxt, active && s.toolBtnTxtActive, bold && { fontWeight: "700" }, italic && { fontStyle: "italic" }, underline && { textDecorationLine: "underline" }, strike && { textDecorationLine: "line-through" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={s.divider} />;
}

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

function ModalRow({ label, active, onPress, extra, accentColor }: {
  label: string; active?: boolean; onPress: () => void;
  extra?: React.ReactNode; accentColor?: string;
}) {
  const accent = accentColor ?? "#c084fc";
  return (
    <TouchableOpacity onPress={onPress} style={[s.sheetRow, active && { backgroundColor: accent + "22" }]}>
      <Text style={[s.sheetRowTxt, active && { color: accent }]}>{label}</Text>
      {extra}
      {active && <Text style={{ color: accent, marginLeft: "auto" }}>✓</Text>}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  topBar: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "#161616", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { alignSelf: "flex-start" },
  backText: { fontSize: 16, fontWeight: "500" },
  shareBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  shareBtnText: { fontSize: 13, fontWeight: "600" },
  titleInput: { backgroundColor: "#161616", color: "#f0f0f0", fontSize: 20, fontWeight: "700", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1e1e1e" },
  verseCard: { marginHorizontal: 18, marginTop: 14, marginBottom: 4, backgroundColor: "#0e0e1a", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#1e1e35" },
  verseCardRef: { color: "#7c5fc4", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  verseCardText: { color: "#b8aaee", fontSize: 14, fontStyle: "italic", lineHeight: 22 },
  editorContent: { paddingHorizontal: 18, paddingTop: 14 },
  emptyEditorHint: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyEditorIcon: { fontSize: 32 },
  emptyEditorText: { fontSize: 14, textAlign: "center", fontStyle: "italic", lineHeight: 22, paddingHorizontal: 24 },
  segWrapper: { paddingLeft: 0, marginLeft: 0, marginBottom: 0 },
  segInput: {
    width: "100%", color: "#f0f0f0", paddingVertical: 2, paddingHorizontal: 0,
    backgroundColor: "transparent", marginVertical: 1,
    ...(Platform.OS === "android" && { underlineColorAndroid: "transparent", textAlignVertical: "top" }),
  },
  wordCount: { color: "#2e2e2e", fontSize: 11, textAlign: "right", marginTop: 12, marginRight: 2 },
  toolbarWrap: { position: "absolute", left: 0, right: 0, backgroundColor: "#111", borderTopWidth: 1, borderTopColor: "#222", zIndex: 100 },
  toolbarContent: { paddingHorizontal: 8, paddingVertical: 7, alignItems: "center", gap: 4 },
  toolBtn: { minWidth: 36, height: 34, borderRadius: 7, backgroundColor: "#1c1c1c", alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  toolBtnActive: { backgroundColor: "#2d1f3f" },
  toolBtnTxt: { color: "#888", fontSize: 13, fontWeight: "500" },
  toolBtnTxtActive: { color: "#c084fc" },
  divider: { width: 1, height: 22, backgroundColor: "#282828", marginHorizontal: 3 },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 8, paddingBottom: 16 },
  swatch: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: "#c084fc", transform: [{ scale: 1.15 }] },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#141414", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1f1f1f" },
  sheetTitle: { color: "#e0e0e0", fontSize: 15, fontWeight: "600" },
  sheetClose: { color: "#555", fontSize: 18, paddingHorizontal: 4 },
  sheetRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 13, gap: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  sheetRowTxt: { color: "#bbb", fontSize: 15, flex: 1 },
  moodSheet: { backgroundColor: "#141414", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === "ios" ? 34 : 20, maxHeight: "85%" },
  moodSectionLabel: { color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginHorizontal: 18, marginTop: 16, marginBottom: 10 },
  emotionRow: { flexDirection: "row", paddingHorizontal: 14, gap: 8 },
  emotionBtn: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "#2a2a2a", paddingVertical: 10, paddingHorizontal: 4, gap: 6 },
  emotionDot: { width: 12, height: 12, borderRadius: 6 },
  emotionBtnLabel: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  intensitySection: { marginTop: 12 },
  intensityRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  intensityDot: { width: 10, height: 10, borderRadius: 5 },
  intensityLabel: { color: "#bbb", fontSize: 15 },
  clearEmotion: { paddingHorizontal: 18, paddingTop: 10 },
  clearEmotionText: { color: "#555", fontSize: 13 },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 8 },
  activityBtn: { width: "22%", alignItems: "center", borderRadius: 12, borderWidth: 1.5, borderColor: "#2a2a2a", paddingVertical: 10, gap: 4 },
  activityEmoji: { fontSize: 22 },
  activityLabel: { fontSize: 10, color: "#555", fontWeight: "600" },
  tagInputRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 18, gap: 8 },
  tagTextInput: { flex: 1, backgroundColor: "#1e1e1e", color: "#f0f0f0", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  tagAddBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  tagPillsWrap: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 18, marginTop: 10, gap: 6 },
  tagPill: { backgroundColor: "#1e1e1e", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  tagPillText: { color: "#888", fontSize: 12 },
  tagsRow: { position: "absolute", left: 0, right: 0, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#111" },
});