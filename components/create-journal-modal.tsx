import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ICON_SIZE = Math.min((SCREEN_WIDTH - 40 - 6 * 8) / 7, 48);

// ─── Color Palette ─────────────────────────────────────────────────────────────
const COLORS = [
  "#9b3a6a", // maroon-pink
  "#e03535", // red
  "#e060a0", // hot pink
  "#e07070", // salmon
  "#c49060", // tan
  "#f0904a", // orange
  "#00c896", // emerald
  "#00bcd4", // cyan
  "#3b5fe0", // blue
  "#607890", // slate
  "#80b0e8", // light blue (default selected)
  "#9060d0", // purple
  "#111111", // black
  "rainbow",  // multicolor
];

// ─── Icon Definitions ──────────────────────────────────────────────────────────
// SF Symbols-style SVG icons — monochrome, clean line style

function IconSmiley({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="8.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="8" cy="9.5" r="1.2" fill={color} />
      <Circle cx="14" cy="9.5" r="1.2" fill={color} />
      <Path d="M7.5 13.5 Q11 16.5 14.5 13.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconJournals({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="4" y="6" width="14" height="13" rx="2.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Rect x="6" y="3" width="12" height="13" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
      <Line x1="7" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="7" y1="14" x2="13" y2="14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconHome({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M3 10.5 L11 3 L19 10.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 9V18a1 1 0 001 1h4v-4h2v4h4a1 1 0 001-1V9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconBed({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M2 17V9a1 1 0 011-1h16a1 1 0 011 1v8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M2 13h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Rect x="5" y="10" width="4" height="3" rx="1" fill={color} opacity={0.4} />
      <Line x1="2" y1="17" x2="2" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="20" y1="17" x2="20" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconStove({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="3" y="4" width="16" height="15" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="8" cy="9" r="2" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="14" cy="9" r="2" stroke={color} strokeWidth="1.3" fill="none" />
      <Line x1="6" y1="14" x2="16" y2="14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="6" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconBooks({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="3" y="6" width="4" height="13" rx="1" stroke={color} strokeWidth="1.4" fill="none" />
      <Rect x="9" y="4" width="4" height="15" rx="1" stroke={color} strokeWidth="1.4" fill="none" />
      <Rect x="15" y="8" width="4" height="11" rx="1" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="2" y1="19" x2="20" y2="19" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconPhone({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M15.5 19.5c-8 0-13-5-13-13 0-1 .7-2 1.7-2.3L6.5 3c.4-.1.8.1 1 .5l2 4.5c.2.4.1.9-.3 1.2L7.5 10.5c1 2 2.5 3.5 4.5 4.5l1.3-1.7c.3-.4.8-.5 1.2-.3l4.5 2c.4.2.6.6.5 1l-1.2 2.3c-.3 1-1.3 1.7-2.3 1.7z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconKey({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="8" cy="9" r="4.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="11.5" y1="12" x2="20" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="16" y1="16" x2="18" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconPuzzle({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M9 3h4v2.5c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5V3h3v4h-2.5c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5H19v9H9v-2.5c0-.8-.7-1.5-1.5-1.5S6 15.2 6 16v2.5H3V9h2.5C6.3 9 7 8.3 7 7.5S6.3 6 5.5 6H3V3h6z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconBalloon({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="9" r="6" stroke={color} strokeWidth="1.5" fill="none" />
      <Line x1="11" y1="15" x2="11" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M9 19 Q11 17 13 19" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconBulb({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M9 17h4M10 20h2M11 3a6 6 0 016 6c0 2.2-1.2 4.2-3 5.3V17H8v-2.7A6 6 0 015 9a6 6 0 016-6z" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconFlower({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="2.5" fill={color} opacity={0.5} />
      <Circle cx="11" cy="5.5" r="2.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="11" cy="16.5" r="2.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="5.5" cy="11" r="2.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="16.5" cy="11" r="2.5" stroke={color} strokeWidth="1.3" fill="none" />
    </Svg>
  );
}

function IconPlane({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M21 11L3 3l3 8-3 8 18-8z" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <Line x1="6" y1="11" x2="14" y2="11" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconMap({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M1 5l6-2 8 4 6-2v14l-6 2-8-4-6 2V5z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="7" y1="3" x2="7" y2="17" stroke={color} strokeWidth="1.3" />
      <Line x1="15" y1="7" x2="15" y2="21" stroke={color} strokeWidth="1.3" />
    </Svg>
  );
}

function IconPin({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="9" r="5" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="11" cy="9" r="1.5" fill={color} />
      <Line x1="11" y1="14" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconGlobe({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="8.5" stroke={color} strokeWidth="1.5" fill="none" />
      <Path d="M11 2.5C11 2.5 7 7 7 11s4 8.5 4 8.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M11 2.5C11 2.5 15 7 15 11s-4 8.5-4 8.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Line x1="2.5" y1="11" x2="19.5" y2="11" stroke={color} strokeWidth="1.3" />
      <Path d="M3.5 7.5h15M3.5 14.5h15" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </Svg>
  );
}

function IconCar({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M5 10l2-5h8l2 5" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Rect x="2" y="10" width="18" height="7" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="6" cy="17" r="2" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="16" cy="17" r="2" stroke={color} strokeWidth="1.4" fill="none" />
    </Svg>
  );
}

function IconBike({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="5.5" cy="14.5" r="4" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="16.5" cy="14.5" r="4" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M5.5 14.5L9 7h4l3 7.5" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="9" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconShip({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M3 16l2-8h12l2 8" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Path d="M11 4v4M8 8h6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M2 19c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconLuggage({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="4" y="7" width="14" height="13" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M8 7V5a2 2 0 014 0v2" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="11" y1="10" x2="11" y2="17" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="7.5" y1="10" x2="14.5" y2="10" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconTent({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M1 19L11 4l10 15H1z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Path d="M11 4L7 19M11 4l4 15" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function IconSignpost({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Line x1="11" y1="2" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M11 5H18l2 3-2 3H11V5z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <Path d="M11 13H5l-2 3 2 3h6v-6z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconCamera({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M2 8a2 2 0 012-2h1l2-2h6l2 2h1a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8z" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="11" cy="12" r="3.5" stroke={color} strokeWidth="1.4" fill="none" />
    </Svg>
  );
}

function IconPalm({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Line x1="11" y1="19" x2="11" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M11 10 Q8 6 4 7 Q7 4 11 7" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M11 10 Q14 6 18 7 Q15 4 11 7" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M11 12 Q7 10 5 12" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M9 19 Q11 17 13 19" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconBus({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="3" y="5" width="16" height="12" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="3" y1="10" x2="19" y2="10" stroke={color} strokeWidth="1.3" />
      <Circle cx="7" cy="18" r="1.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="15" cy="18" r="1.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Line x1="11" y1="5" x2="11" y2="10" stroke={color} strokeWidth="1.2" />
    </Svg>
  );
}

function IconTrain({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="5" y="3" width="12" height="14" rx="3" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="5" y1="10" x2="17" y2="10" stroke={color} strokeWidth="1.3" />
      <Circle cx="8.5" cy="14" r="1.2" fill={color} opacity={0.6} />
      <Circle cx="13.5" cy="14" r="1.2" fill={color} opacity={0.6} />
      <Path d="M7 19l-2 2M15 19l2 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconMoto({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="4.5" cy="15" r="3.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="17.5" cy="15" r="3.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M4.5 15 L8 8 L13 9 L17.5 15" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="13" y1="9" x2="16" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconBackpack({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="5" y="6" width="12" height="14" rx="3" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M8 6V5a3 3 0 016 0v1" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="8" y1="12" x2="14" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconFork({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Line x1="8" y1="3" x2="8" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M5 3v5a3 3 0 006 0V3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Line x1="14" y1="3" x2="14" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M14 8 Q17 10 14 13" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="14" y1="13" x2="14" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconSpoon({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="7" r="4" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="11" y1="11" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconCoffee({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M5 8h10l-1 9H6L5 8z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Path d="M15 10h2a2 2 0 010 4h-2" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M8 5 Q9 3 10 5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconDrink({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M5 4h12l-2 13a2 2 0 01-2 2H9a2 2 0 01-2-2L5 4z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="5" y1="9" x2="17" y2="9" stroke={color} strokeWidth="1.3" />
    </Svg>
  );
}

function IconWine({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M7 3h8l1 6a5 5 0 01-10 0L7 3z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="11" y1="14" x2="11" y2="19" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="7" y1="19" x2="15" y2="19" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconWok({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M4 12a7 7 0 0014 0H4z" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="2" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Line x1="18" y1="10" x2="21" y2="7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconCarrot({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M11 4 Q14 7 13 11 Q12 15 9 17 Q7 19 5 18 Q4 16 5 14 Q7 11 11 10 Q15 9 17 6" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M11 4 Q9 2 10 0" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M11 4 Q13 2 12 0" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconApple({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M16 7c-1.5-1-3-1-4.5-.5-1.5.5-2.5.5-4-.5C9 4 10 2 11 2s2 1 3 .5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M7 9c-3 1-4 5-2 9 1 2 2.5 3 4 2.5s2-1 2-1 .5 1 2 1 3-1 4-3c2-4 1-8-2-9-1-.3-2 0-3 .5C11 9.5 9 9 7 9z" stroke={color} strokeWidth="1.4" fill="none" />
    </Svg>
  );
}

function IconCake({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Rect x="3" y="11" width="16" height="9" rx="2" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="11" y1="3" x2="11" y2="7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M9 9h4v2H9z" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M3 15 Q5.5 13 8 15 Q10.5 17 13 15 Q15.5 13 19 15" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconPopcorn({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M6 9 Q5 6 7 5 Q9 4 9 7" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M13 7 Q13 4 15 5 Q17 6 16 9" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M5 9h12l-2 10H7L5 9z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="5" y1="13" x2="17" y2="13" stroke={color} strokeWidth="1.2" />
    </Svg>
  );
}

function IconBasket({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M7 10l2-5M15 10l-2-5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M2 10h18l-2 9H4L2 10z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Path d="M2 10 Q11 7 20 10" stroke={color} strokeWidth="1.2" fill="none" />
    </Svg>
  );
}

function IconMountain({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M1 19L8 6l5 8 3-4 5 9H1z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Path d="M8 6l2-1 1 1" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconSun({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="4" stroke={color} strokeWidth="1.4" fill="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 11 + 6 * Math.cos(rad);
        const y1 = 11 + 6 * Math.sin(rad);
        const x2 = 11 + 8.5 * Math.cos(rad);
        const y2 = 11 + 8.5 * Math.sin(rad);
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" strokeLinecap="round" />;
      })}
    </Svg>
  );
}

function IconSnow({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Line x1="11" y1="2" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="2" y1="11" x2="20" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="4.5" y1="4.5" x2="17.5" y2="17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="17.5" y1="4.5" x2="4.5" y2="17.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Circle cx="11" cy="11" r="2" fill={color} opacity={0.4} />
    </Svg>
  );
}

function IconBolt({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M13 2L5 13h7l-3 7 10-11h-7l3-7z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconMoon({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M19 13A8 8 0 119 3a6 6 0 0010 10z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconCloud({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M6 15a4 4 0 01-.5-8 5.5 5.5 0 0110.8-1A4 4 0 0117 15H6z" stroke={color} strokeWidth="1.4" fill="none" />
      <Line x1="8" y1="18" x2="8" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="17" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="14" y1="18" x2="14" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconFire({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M12 2c0 4-4 5-4 9a5 5 0 0010 0c0-6-4-6-3-12C13 1 10 5 9 8 8 5 6 4 6 4c0 4 2 5 2 8a3 3 0 006 0c0-4-2-5-2-10z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconRainbow({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M2 17a9 9 0 0118 0" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M5 17a6 6 0 0112 0" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Path d="M8 17a3 3 0 016 0" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconLeaf({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M20 4C12 4 4 8 4 18c4-4 8-5 12-5-1-3 1-6 4-9z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="4" y1="18" x2="10" y2="12" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconTree({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M11 3L4 11h4l-3 5h12l-3-5h4L11 3z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
      <Line x1="11" y1="16" x2="11" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function IconBinoculars({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="6.5" cy="13" r="4.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="15.5" cy="13" r="4.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M6.5 8.5V7a2 2 0 012-2h3a2 2 0 012 2v1.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Line x1="11" y1="13" x2="11" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IconAtom({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="1.5" fill={color} />
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M11 4 Q15 7 15 11 Q15 15 11 18 Q7 15 7 11 Q7 7 11 4z" stroke={color} strokeWidth="1.3" fill="none" />
    </Svg>
  );
}

function IconDog({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M14 3h4l1 3-2 1v3a5 5 0 01-10 0V9L5 7V4l3 1 2-2h4z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <Path d="M7 16v4M15 16v4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M8 8h1M13 8h1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M9 13Q11 15 13 13" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconCat({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M5 5L3 2v5l2 2M17 5l2-3v5l-2 2" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 7a6 6 0 0012 0v3a6 6 0 01-12 0V7z" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M7 16v5M15 16v5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Circle cx="8.5" cy="11" r="1" fill={color} opacity={0.6} />
      <Circle cx="13.5" cy="11" r="1" fill={color} opacity={0.6} />
    </Svg>
  );
}

function IconBird({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M2 8 Q5 5 9 7 Q12 9 14 7 Q18 4 20 6 Q18 10 14 10L12 14H8L7 10 Q4 9 2 8z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <Path d="M8 14l-2 5M12 14l2 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconTurtle({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M11 5a6 6 0 016 8H5a6 6 0 016-8z" stroke={color} strokeWidth="1.3" fill="none" />
      <Rect x="6" y="12" width="10" height="5" rx="2.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M9 17l-1 2M13 17l1 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Path d="M11 12V10" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function IconPerson({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="5.5" r="2.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M5 20v-5a6 6 0 0112 0v5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Line x1="11" y1="15" x2="11" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function IconCouple({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="7.5" cy="5" r="2.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M2 20v-4a5 5 0 0111 0v4" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Circle cx="15.5" cy="5" r="2.5" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M12 20v-4a5 5 0 0110 0v4" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconHandshake({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M2 10l4-4h4l4 4M20 10l-4-4h-4" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <Path d="M10 10l2 2 8-4" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 10l8 8 3-3" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPregnant({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="4.5" r="2.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M8 8h3l2 5c1.5 1 1.5 4 0 5H7c-1-1-1-4 1-5l-1-5z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <Path d="M11 13a2.5 2.5 0 010 5" stroke={color} strokeWidth="1.2" fill="none" />
    </Svg>
  );
}

function IconFamily({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="6" cy="4.5" r="2" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="14" cy="4.5" r="2" stroke={color} strokeWidth="1.3" fill="none" />
      <Circle cx="19.5" cy="6" r="1.5" stroke={color} strokeWidth="1.2" fill="none" />
      <Path d="M2 20v-5a4 4 0 018 0v5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M10 20v-5a4 4 0 018 0v5" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M17 19v-4a2.5 2.5 0 015 0v4" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconElder({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="4.5" r="2.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M7 20v-6a4 4 0 018 0v6" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <Line x1="11" y1="14" x2="11" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M15 14 Q17 16 16 20" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconWheelchair({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="13" cy="3.5" r="2" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M13 6v5H8l-2 5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="8" cy="18" r="3" stroke={color} strokeWidth="1.3" fill="none" />
      <Path d="M13 11h4l1 6" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconWave({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M8 3 Q6 5 7 8 Q8 11 10 10 Q13 9 12 5 Q11 2 13 2 Q15 2 15 6 Q15 11 13 14 Q11 17 9 18 Q6 19 4 17" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconClap({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M9 2l1 3M12 1l1 3M6 4l2 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M7 7l4-3 2 3-4 3M7 7L5 10l5 9c2 2 5 2 7 0l3-5-7-7z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

function IconThumbUp({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M7 10V19H4a2 2 0 01-2-2v-5a2 2 0 012-2h3z" stroke={color} strokeWidth="1.4" fill="none" />
      <Path d="M7 10l4-7a3 3 0 013 3v3h4a2 2 0 012 2l-2 7a2 2 0 01-2 2H7V10z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

function IconHand({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M9 11V5a1.5 1.5 0 013 0v6M12 5V4a1.5 1.5 0 013 0v7M15 6a1.5 1.5 0 013 0v6" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M9 11l-2-1a1.5 1.5 0 00-1 2l3 6a5 5 0 005 2h3a3 3 0 003-3V12a1.5 1.5 0 00-3 0" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconEye({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path d="M1 11s4-7 10-7 10 7 10 7-4 7-10 7S1 11 1 11z" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.4" fill="none" />
    </Svg>
  );
}

function IconFaceSmile({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="8.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="8" cy="9.5" r="1.2" fill={color} />
      <Circle cx="14" cy="9.5" r="1.2" fill={color} />
      <Path d="M7.5 13 Q11 16 14.5 13" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function IconFaceBaby({ color = "#555" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="11" r="8.5" stroke={color} strokeWidth="1.4" fill="none" />
      <Circle cx="8.5" cy="10" r="1" fill={color} />
      <Circle cx="13.5" cy="10" r="1" fill={color} />
      <Path d="M8.5 14 Q11 16 13.5 14" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <Path d="M7 7 Q9 5.5 11 7 Q13 5.5 15 7" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Icon Registry ─────────────────────────────────────────────────────────────

const ICONS: { id: string; component: React.FC<{ color?: string }> }[] = [
  { id: "smiley", component: IconSmiley },
  { id: "journals", component: IconJournals },
  { id: "home", component: IconHome },
  { id: "bed", component: IconBed },
  { id: "stove", component: IconStove },
  { id: "books", component: IconBooks },
  { id: "phone", component: IconPhone },
  { id: "key", component: IconKey },
  { id: "puzzle", component: IconPuzzle },
  { id: "balloon", component: IconBalloon },
  { id: "bulb", component: IconBulb },
  { id: "flower", component: IconFlower },
  { id: "plane", component: IconPlane },
  { id: "map", component: IconMap },
  { id: "pin", component: IconPin },
  { id: "globe", component: IconGlobe },
  { id: "car", component: IconCar },
  { id: "bike", component: IconBike },
  { id: "ship", component: IconShip },
  { id: "luggage", component: IconLuggage },
  { id: "tent", component: IconTent },
  { id: "signpost", component: IconSignpost },
  { id: "camera", component: IconCamera },
  { id: "palm", component: IconPalm },
  { id: "bus", component: IconBus },
  { id: "train", component: IconTrain },
  { id: "moto", component: IconMoto },
  { id: "backpack", component: IconBackpack },
  { id: "fork", component: IconFork },
  { id: "spoon", component: IconSpoon },
  { id: "coffee", component: IconCoffee },
  { id: "drink", component: IconDrink },
  { id: "wine", component: IconWine },
  { id: "wok", component: IconWok },
  { id: "carrot", component: IconCarrot },
  { id: "apple", component: IconApple },
  { id: "cake", component: IconCake },
  { id: "popcorn", component: IconPopcorn },
  { id: "basket", component: IconBasket },
  { id: "mountain", component: IconMountain },
  { id: "sun", component: IconSun },
  { id: "snow", component: IconSnow },
  { id: "bolt", component: IconBolt },
  { id: "moon", component: IconMoon },
  { id: "cloud", component: IconCloud },
  { id: "fire", component: IconFire },
  { id: "rainbow", component: IconRainbow },
  { id: "leaf", component: IconLeaf },
  { id: "tree", component: IconTree },
  { id: "binoculars", component: IconBinoculars },
  { id: "atom", component: IconAtom },
  { id: "dog", component: IconDog },
  { id: "cat", component: IconCat },
  { id: "bird", component: IconBird },
  { id: "turtle", component: IconTurtle },
  { id: "person", component: IconPerson },
  { id: "couple", component: IconCouple },
  { id: "handshake", component: IconHandshake },
  { id: "pregnant", component: IconPregnant },
  { id: "family", component: IconFamily },
  { id: "elder", component: IconElder },
  { id: "wheelchair", component: IconWheelchair },
  { id: "wave", component: IconWave },
  { id: "clap", component: IconClap },
  { id: "thumbup", component: IconThumbUp },
  { id: "hand", component: IconHand },
  { id: "eye", component: IconEye },
  { id: "facesmile", component: IconFaceSmile },
  { id: "facebaby", component: IconFaceBaby },
];

// ─── Rainbow Circle (SVG) ─────────────────────────────────────────────────────
function RainbowCircle({ size = 32, selected = false }: { size?: number; selected?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <defs>
          <linearGradient id="rainbow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="25%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="75%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <Circle
          cx="16" cy="16" r="14"
          fill="url(#rainbow)"
          stroke={selected ? "#fff" : "transparent"}
          strokeWidth={selected ? "2.5" : "0"}
        />
      </Svg>
    </View>
  );
}

// ─── Journal Cover Preview ─────────────────────────────────────────────────────
function JournalCoverPreview({ color }: { color: string }) {
  const bgColor = color === "rainbow" ? "#c084fc" : color + "22";
  const iconColor = color === "rainbow" ? "#fff" : color;

  return (
    <View style={[previewStyles.wrapper, { backgroundColor: bgColor }]}>
      <Svg width={44} height={44} viewBox="0 0 44 44">
        {/* Stack of pages behind */}
        <Rect x="6" y="4" width="32" height="26" rx="4" fill={iconColor} opacity={0.25} />
        <Rect x="4" y="7" width="32" height="26" rx="4" fill={iconColor} opacity={0.35} />
        {/* Main book */}
        <Rect x="2" y="10" width="32" height="26" rx="5" fill={iconColor} opacity={0.9} />
        <Line x1="10" y1="18" x2="26" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
        <Line x1="10" y1="23" x2="22" y2="23" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.6} />
      </Svg>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  wrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Exported JournalIcon — use this in journal cards / menus ─────────────────
export function JournalIcon({
  iconId,
  color = "#888",
  size = 22,
}: {
  iconId: string;
  color?: string;
  size?: number;
}) {
  const entry = ICONS.find((i) => i.id === iconId);
  if (!entry) return null;
  const IconComp = entry.component;
  // Scale the 22x22 viewBox icons to the requested size
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <IconComp color={color} />
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string; iconId: string }) => void;
  initialName?: string;
  initialColor?: string;
  initialIconId?: string;
};

export default function CreateJournalModal({
  visible,
  onClose,
  onSave,
  initialName = "",
  initialColor = "#80b0e8",
  initialIconId = "journals",
}: Props) {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedIconId, setSelectedIconId] = useState(initialIconId);

  const handleSave = () => {
    onSave({ name, color: selectedColor, iconId: selectedIconId });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top buttons */}
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={styles.topBtn} hitSlop={16}>
            <Text style={styles.topBtnText}>✕</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={styles.topBtnRight} hitSlop={16}>
            <Text style={styles.checkText}>✓</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cover preview */}
          <View style={styles.previewRow}>
            <JournalCoverPreview color={selectedColor} />
          </View>

          {/* Name input */}
          <TextInput
            style={styles.nameInput}
            placeholder="Journal Name"
            placeholderTextColor="#444"
            value={name}
            onChangeText={setName}
          />

          {/* Color picker */}
          <View style={styles.colorGrid}>
            {COLORS.map((c) => {
              const isSelected = selectedColor === c;
              if (c === "rainbow") {
                return (
                  <Pressable
                    key="rainbow"
                    onPress={() => setSelectedColor("rainbow")}
                    style={styles.colorBtnWrapper}
                  >
                    <View
                      style={[
                        styles.colorRing,
                        isSelected && { borderColor: "#aaa", borderWidth: 2.5 },
                      ]}
                    >
                      <RainbowCircle size={32} selected={isSelected} />
                    </View>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={styles.colorBtnWrapper}
                >
                  <View
                    style={[
                      styles.colorBtn,
                      { backgroundColor: c },
                      isSelected && styles.colorSelected,
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* Icon grid */}
          <View style={styles.iconGrid}>
            {ICONS.map(({ id, component: IconComp }) => {
              const isSelected = selectedIconId === id;
              const accentColor =
                selectedColor === "rainbow" ? "#c084fc" : selectedColor;
              return (
                <Pressable
                  key={id}
                  onPress={() => setSelectedIconId(id)}
                  style={[
                    styles.iconBtn,
                    {
                      width: ICON_SIZE,
                      height: ICON_SIZE,
                      borderRadius: ICON_SIZE / 2,
                      backgroundColor: isSelected
                        ? accentColor + "18"
                        : "#1e1e1e",
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? accentColor : "transparent",
                    },
                  ]}
                >
                  <IconComp color={isSelected ? accentColor : "#555"} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  topBtnText: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },
  topBtnRight: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#c084fc22",
    borderWidth: 1,
    borderColor: "#c084fc55",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    fontSize: 17,
    color: "#c084fc",
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  previewRow: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  nameInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 20,
    fontSize: 16,
    color: "#f0f0f0",
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "flex-start",
    marginBottom: 28,
  },
  colorBtnWrapper: { padding: 2 },
  colorBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  colorRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  colorSelected: {
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
});