import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Polygon } from "react-native-svg";
import { Storage, STORAGE_KEYS } from "../app/storage";

// ─── Time Icons ───────────────────────────────────────────────────────────────

// ☀️ Sun — round disc + 8 short rays, unmistakably a sun
function IconSun({ color = "#f59e0b" }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      {/* filled disc so it reads as solid sun, not just an outline */}
      <Circle cx="9" cy="9" r="3.2" stroke={color} strokeWidth="1.4" fill={color} opacity={1} />
      {/* cardinal rays */}
      <Line x1="9" y1="1.5" x2="9" y2="3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="9" y1="14.5" x2="9" y2="16.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="1.5" y1="9" x2="3.5" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="14.5" y1="9" x2="16.5" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* diagonal rays */}
      <Line x1="3.6" y1="3.6" x2="5" y2="5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="13" y1="13" x2="14.4" y2="14.4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="14.4" y1="3.6" x2="13" y2="5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="5" y1="13" x2="3.6" y2="14.4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

// 🌤 Sun + cloud — "afternoon" is bright but getting cloudy
function IconSunCloud({ color = "#f59e0b" }: { color?: string }) {
  return (
    <Svg width={20} height={18} viewBox="0 0 20 18">
      {/* small sun peeking top-left */}
      <Circle cx="6" cy="6" r="2.5" fill={color} />
      <Line x1="6" y1="1.5" x2="6" y2="3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="1.5" y1="6" x2="3" y2="6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="3" y1="3" x2="4" y2="4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="9" y1="3" x2="8" y2="4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* cloud body bottom-right */}
      <Path
        d="M7 15 Q7 12 10 12 Q10.5 10 13 10 Q16 10 16 13 Q18.5 13 18.5 15.5 Q18.5 17 16.5 17 L8.5 17 Q7 17 7 15 Z"
        stroke="#93c5fd" strokeWidth="1.3" fill="none" strokeLinejoin="round"
      />
    </Svg>
  );
}

// 🌙 Moon — thick crescent using two overlapping circles (filled region), clearly a crescent
function IconMoon({ color = "#a78bfa" }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      {/*
        Crescent drawn as the outer circle arc minus the inner cutout circle.
        We draw a wide filled-looking crescent by using a thick stroked path
        that traces a proper crescent silhouette.
      */}
      <Path
        d="M13.5 14.5 A7 7 0 1 1 13.5 3.5 A4.5 4.5 0 0 0 13.5 14.5 Z"
        stroke={color}
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ⭐ Star — classic 5-point with filled center so it reads clearly
function IconStar({ color = "#fbbf24" }: { color?: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 17 17">
      <Polygon
        points="8.5,1.5 10.3,6.5 15.5,6.5 11.4,9.6 12.9,14.5 8.5,11.8 4.1,14.5 5.6,9.6 1.5,6.5 6.7,6.5"
        stroke={color}
        strokeWidth="1.2"
        fill={color}
        strokeLinejoin="round"
        opacity={0.9}
      />
    </Svg>
  );
}

// 👋 Waving hand — readable open-palm silhouette at small size
function IconWave({ color = "#c084fc" }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* thumb */}
      <Path
        d="M5 13 Q4 11 5.5 10 Q7 9 8 11"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* index finger */}
      <Path
        d="M8 11 L8 5 Q8 3.5 9.5 3.5 Q11 3.5 11 5 L11 10"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* middle finger */}
      <Path
        d="M11 10 L11 4 Q11 2.5 12.5 2.5 Q14 2.5 14 4 L14 10"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* ring finger */}
      <Path
        d="M14 10 L14 5 Q14 3.5 15.5 3.5 Q17 3.5 17 5 L17 11"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* palm + pinky */}
      <Path
        d="M17 11 Q18 9.5 18.5 11 L18.5 13 Q18.5 18 14 19 Q9 20 7 17 L5 13"
        stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

// ✏️ Pencil — small edit hint icon
function IconPencilSmall({ color = "#888" }: { color?: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 15 15">
      <Path d="M2 13 L3.5 8.5 L10 2 L13 5 L6.5 11.5 Z" stroke={color} strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      <Line x1="8.5" y1="3.5" x2="11.5" y2="6.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <Line x1="2" y1="13" x2="5" y2="13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Good morning", icon: <IconSun /> };
  if (h >= 12 && h < 17) return { text: "Good afternoon", icon: <IconSunCloud /> };
  if (h >= 17 && h < 21) return { text: "Good evening", icon: <IconMoon /> };
  return { text: "Good night", icon: <IconStar /> };
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const hue =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bg = `hsl(${hue}, 60%, 28%)`;
  const border = `hsl(${hue}, 65%, 48%)`;

  return (
    <View style={[styles.avatar, { backgroundColor: bg, borderColor: border }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Name Modal ───────────────────────────────────────────────────────────────

interface NameModalProps {
  visible: boolean;
  current: string;
  /** isOnboarding = true → show Skip button instead of Cancel */
  isOnboarding?: boolean;
  onSave: (name: string) => void;
  onSkip: () => void;
}

function NameModal({
  visible,
  current,
  isOnboarding = false,
  onSave,
  onSkip,
}: NameModalProps) {
  const [value, setValue] = useState(current);

  useEffect(() => {
    if (visible) setValue(current);
  }, [visible, current]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onSkip}
    >
      {/* Tapping outside = skip/close */}
      <Pressable style={styles.modalOverlay} onPress={onSkip}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalBox}>
            {/* Wave icon */}
            <View style={styles.modalWaveWrap}>
              <IconWave color="#c084fc" />
            </View>

            {/* Title changes based on context */}
            <Text style={styles.modalTitle}>
              {isOnboarding ? "What should we call you?" : "Edit your name"}
            </Text>
            <Text style={styles.modalSub}>
              {isOnboarding
                ? "Totally optional — you can skip this anytime."
                : "This is how your greeting will appear."}
            </Text>

            {/* Input */}
            <TextInput
              style={styles.modalInput}
              value={value}
              onChangeText={setValue}
              placeholder="e.g. Adrian"
              placeholderTextColor="#555"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              maxLength={30}
              selectionColor="#c084fc"
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              {/* Left: Skip (onboarding) or Cancel (edit) */}
              <Pressable
                onPress={onSkip}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnSkip,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.modalBtnSkipText}>
                  {isOnboarding ? "Skip" : "Cancel"}
                </Text>
              </Pressable>

              {/* Right: Save (disabled if empty) */}
              <Pressable
                onPress={handleSave}
                disabled={!value.trim()}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnSave,
                  !value.trim() && styles.modalBtnSaveDisabled,
                  pressed && value.trim() && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.modalBtnSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface GreetingHeaderProps {
  onNameChange?: (name: string) => void;
}

export function GreetingHeader({ onNameChange }: GreetingHeaderProps) {
  const [username, setUsername] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const [stored, seen] = await Promise.all([
        Storage.getItem(STORAGE_KEYS.username),
        Storage.getItem(STORAGE_KEYS.seenNamePrompt),
      ]);

      const name = stored ?? "";
      setUsername(name);
      setLoaded(true);

      // Auto-popup: only if no username AND they haven't seen it before
      if (!name && !seen) {
        // Small delay so the screen renders first — feels more natural
        setTimeout(() => {
          setIsOnboarding(true);
          setModalVisible(true);
        }, 600);
      }
    })();
  }, []);

  // Fade in after loaded
  useEffect(() => {
    if (loaded) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loaded]);

  const saveUsername = async (name: string) => {
    await Storage.setItem(STORAGE_KEYS.username, name);
    await Storage.setItem(STORAGE_KEYS.seenNamePrompt, "1");
    setUsername(name);
    setModalVisible(false);
    setIsOnboarding(false);
    onNameChange?.(name);
  };

  const handleSkip = async () => {
    // Mark as seen so auto-popup won't fire again
    await Storage.setItem(STORAGE_KEYS.seenNamePrompt, "1");
    setModalVisible(false);
    setIsOnboarding(false);
  };

  const openEditModal = () => {
    setIsOnboarding(false);
    setModalVisible(true);
  };

  if (!loaded) return null;

  const hasName = username.trim().length > 0;
  const { text: timeText, icon: timeIcon } = getTimeGreeting();

  // Greeting lines
  const topLine = timeText;
  const bottomLine = hasName ? `Hi, ${username}` : "Hello there";

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Pressable
        onPress={openEditModal}
        style={({ pressed }) => [
          styles.greetingPressable,
          pressed && { opacity: 0.75 },
        ]}
      >
        <View style={styles.textBlock}>
          <View style={styles.topLineRow}>
            <Text style={styles.topLine}>{topLine} </Text>
            {timeIcon}
          </View>
          <View style={styles.mainLineRow}>
            <Text style={styles.mainLine} numberOfLines={1} adjustsFontSizeToFit>
              {bottomLine}
            </Text>
            {hasName && <View style={styles.waveIcon}><IconWave color="#c084fc" /></View>}
          </View>
        </View>

        {/* Avatar when name is set */}
        {hasName && <Avatar name={username} />}

        {/* Subtle pencil icon when no name — tappable hint */}
        {!hasName && (
          <View style={styles.editHint}>
            <IconPencilSmall color="#888" />
          </View>
        )}
      </Pressable>

      <NameModal
        visible={modalVisible}
        current={username}
        isOnboarding={isOnboarding}
        onSave={saveUsername}
        onSkip={handleSkip}
      />
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  greetingPressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  textBlock: {
    flex: 1,
    marginRight: 12,
  },

  topLineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },

  topLine: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  mainLineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  mainLine: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
    flexShrink: 1,
  },

  waveIcon: {
    marginLeft: 2,
  },

  // Avatar
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Edit hint (no name state)
  editHint: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1e1e1e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  editHintIcon: {
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalBox: {
    backgroundColor: "#161616",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
  },
  modalWaveWrap: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#c084fc22",
    borderRadius: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  modalSub: {
    color: "#666",
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: "#222",
    borderRadius: 12,
    color: "#f0f0f0",
    fontSize: 17,
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#333",
    width: "100%",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnSkip: {
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  modalBtnSkipText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  modalBtnSave: {
    backgroundColor: "#c084fc",
  },
  modalBtnSaveDisabled: {
    backgroundColor: "#4a3060",
  },
  modalBtnSaveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});