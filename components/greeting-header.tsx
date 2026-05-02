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
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Storage, STORAGE_KEYS } from "../app/storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeGreeting(): { text: string; iconName: string; iconColor: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: "Good morning", iconName: "sun", iconColor: "#f59e0b" };
  if (h >= 12 && h < 17) return { text: "Good afternoon", iconName: "cloud-sun", iconColor: "#f59e0b" };
  if (h >= 17 && h < 21) return { text: "Good evening", iconName: "moon", iconColor: "#a78bfa" };
  return { text: "Good night", iconName: "star", iconColor: "#fbbf24" };
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
              <FontAwesome6 name="hand" size={22} color="#c084fc" iconStyle="regular" />
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
  const { text: timeText, iconName, iconColor } = getTimeGreeting();

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
            <FontAwesome6 name={iconName} size={14} color={iconColor} />
          </View>
          <View style={styles.mainLineRow}>
            <Text style={styles.mainLine} numberOfLines={1} adjustsFontSizeToFit>
              {bottomLine}
            </Text>
            {hasName && <View style={styles.waveIcon}><FontAwesome6 name="hand" size={18} color="#c084fc" iconStyle="regular" /></View>}
          </View>
        </View>

        {/* Avatar when name is set */}
        {hasName && <Avatar name={username} />}

        {/* Subtle pencil icon when no name — tappable hint */}
        {!hasName && (
          <View style={styles.editHint}>
            <FontAwesome6 name="pencil" size={13} color="#888" />
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