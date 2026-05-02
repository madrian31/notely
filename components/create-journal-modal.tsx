import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect
} from "react-native-svg";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ICON_SIZE = Math.min((SCREEN_WIDTH - 40 - 6 * 8) / 7, 48);

// â”€â”€â”€ Color Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ FontAwesome6 Icon Mapping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Maps icon IDs to FontAwesome6 icon names + optional style

type FAIconDef = { name: string; style?: "regular" | "solid" };

const ICON_MAP: Record<string, FAIconDef> = {
  smiley: { name: "face-smile", style: "regular" },
  journals: { name: "book", style: "solid" },
  home: { name: "house", style: "solid" },
  bed: { name: "bed", style: "solid" },
  stove: { name: "fire-burner", style: "solid" },
  books: { name: "book-open", style: "solid" },
  phone: { name: "phone", style: "solid" },
  key: { name: "key", style: "solid" },
  puzzle: { name: "puzzle-piece", style: "solid" },
  balloon: { name: "gift", style: "solid" },
  bulb: { name: "lightbulb", style: "regular" },
  flower: { name: "seedling", style: "solid" },
  plane: { name: "paper-plane", style: "solid" },
  map: { name: "map", style: "regular" },
  pin: { name: "location-dot", style: "solid" },
  globe: { name: "globe", style: "solid" },
  car: { name: "car", style: "solid" },
  bike: { name: "bicycle", style: "solid" },
  ship: { name: "ship", style: "solid" },
  luggage: { name: "suitcase-rolling", style: "solid" },
  tent: { name: "tent", style: "solid" },
  signpost: { name: "signs-post", style: "solid" },
  camera: { name: "camera", style: "solid" },
  palm: { name: "tree", style: "solid" },
  bus: { name: "bus", style: "solid" },
  train: { name: "train", style: "solid" },
  moto: { name: "motorcycle", style: "solid" },
  backpack: { name: "briefcase", style: "solid" },
  fork: { name: "utensils", style: "solid" },
  spoon: { name: "spoon", style: "solid" },
  coffee: { name: "mug-hot", style: "solid" },
  drink: { name: "glass-water", style: "solid" },
  wine: { name: "wine-glass", style: "solid" },
  wok: { name: "bowl-food", style: "solid" },
  carrot: { name: "carrot", style: "solid" },
  apple: { name: "apple-whole", style: "solid" },
  cake: { name: "cake-candles", style: "solid" },
  popcorn: { name: "cookie", style: "solid" },
  basket: { name: "basket-shopping", style: "solid" },
  mountain: { name: "mountain", style: "solid" },
  sun: { name: "sun", style: "solid" },
  snow: { name: "snowflake", style: "regular" },
  bolt: { name: "bolt", style: "solid" },
  moon: { name: "moon", style: "regular" },
  cloud: { name: "cloud-rain", style: "solid" },
  fire: { name: "fire", style: "solid" },
  rainbow: { name: "rainbow", style: "solid" },
  leaf: { name: "leaf", style: "solid" },
  tree: { name: "tree", style: "solid" },
  binoculars: { name: "binoculars", style: "solid" },
  atom: { name: "atom", style: "solid" },
  dog: { name: "dog", style: "solid" },
  cat: { name: "cat", style: "solid" },
  bird: { name: "dove", style: "solid" },
  turtle: { name: "shield-halved", style: "solid" },
  person: { name: "user", style: "solid" },
  couple: { name: "user-group", style: "solid" },
  handshake: { name: "handshake", style: "regular" },
  pregnant: { name: "person-pregnant", style: "solid" },
  family: { name: "people-group", style: "solid" },
  elder: { name: "person-cane", style: "solid" },
  wheelchair: { name: "wheelchair-move", style: "solid" },
  wave: { name: "hand", style: "regular" },
  clap: { name: "hands-clapping", style: "solid" },
  thumbup: { name: "thumbs-up", style: "regular" },
  hand: { name: "hand", style: "solid" },
  eye: { name: "eye", style: "regular" },
  facesmile: { name: "face-smile-beam", style: "regular" },
  facebaby: { name: "baby", style: "solid" },
};

// Icon IDs in display order
const ICON_IDS = Object.keys(ICON_MAP);

// â”€â”€â”€ Icon Registry (backward compatible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FAIconComponent({ color = "#555", iconId }: { color?: string; iconId: string }) {
  const def = ICON_MAP[iconId];
  if (!def) return null;
  return <FontAwesome6 name={def.name} size={20} color={color} iconStyle={def.style ?? "solid"} />;
}

const ICONS: { id: string; component: React.FC<{ color?: string }> }[] = ICON_IDS.map((id) => ({
  id,
  component: ({ color }: { color?: string }) => <FAIconComponent color={color} iconId={id} />,
}));

// â”€â”€â”€ Rainbow Circle (SVG) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Journal Cover Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function JournalCoverPreview({ color }: { color: string }) {
  const bgColor = color === "rainbow" ? "#c084fc" : color + "22";
  const iconColor = color === "rainbow" ? "#fff" : color;

  return (
    <View style={[previewStyles.wrapper, { backgroundColor: bgColor }]}>
      <FontAwesome6 name="book" size={36} color={iconColor} />
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

// â”€â”€â”€ Exported JournalIcon â€” use this in journal cards / menus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function JournalIcon({
  iconId,
  color = "#888",
  size = 22,
}: {
  iconId: string;
  color?: string;
  size?: number;
}) {
  const def = ICON_MAP[iconId];
  if (!def) return null;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <FontAwesome6 name={def.name} size={size * 0.8} color={color} iconStyle={def.style ?? "solid"} />
    </View>
  );
}


// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" fill="#888" />
            </Svg>
          </Pressable>
          <Pressable onPress={handleSave} style={styles.topBtnRight} hitSlop={16}>
            <Svg width={18} height={18} viewBox="0 0 16 16">
              <Path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425z" fill="#c084fc" />
            </Svg>
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

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
