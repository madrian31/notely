import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    FlatList,
    Keyboard,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Storage } from "../storage";

// ─── Types ────────────────────────────────────────────────────────────────────

type PrayerStatus = "pending" | "answered" | "archived";

type PrayerUpdate = {
    id: string;
    text: string;
    date: string;
};

type Prayer = {
    id: string;
    title: string;
    description: string;
    status: PrayerStatus;
    tags: string[];
    emoji: string;
    isPrivate: boolean;
    createdAt: string;
    answeredAt?: string;
    updates: PrayerUpdate[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "prayer_list";

const PRAYER_EMOJIS = [
    "🙏", "✝️", "💛", "❤️", "💙", "💚", "🕊️", "⭐", "🌟", "✨",
    "🌸", "🌿", "🍃", "🌙", "☀️", "🔥", "💧", "🫶", "👐", "🌺",
];

const AVAILABLE_TAGS = [
    "family", "health", "career", "relationships",
    "finances", "peace", "guidance", "protection",
    "gratitude", "healing", "faith", "future",
];

const STATUS_CONFIG: Record<PrayerStatus, { label: string; color: string; emoji: string }> = {
    pending: { label: "Praying", color: "#c084fc", emoji: "🙏" },
    answered: { label: "Answered", color: "#4ade80", emoji: "✅" },
    archived: { label: "Archived", color: "#555", emoji: "📦" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PrayerListScreen() {
    const insets = useSafeAreaInsets();

    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [filterStatus, setFilterStatus] = useState<PrayerStatus | "all">("all");

    // Add / Edit modal
    const [formVisible, setFormVisible] = useState(false);
    const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formEmoji, setFormEmoji] = useState("🙏");
    const [formTags, setFormTags] = useState<string[]>([]);
    const [formPrivate, setFormPrivate] = useState(true);

    // Detail / Update modal
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedPrayer, setSelectedPrayer] = useState<Prayer | null>(null);
    const [updateText, setUpdateText] = useState("");

    // Options menu
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPrayer, setMenuPrayer] = useState<Prayer | null>(null);

    // ── Storage ──

    useFocusEffect(
        useCallback(() => {
            loadPrayers();
        }, []),
    );

    const loadPrayers = async () => {
        try {
            const raw = await Storage.getItem(STORAGE_KEY);
            setPrayers(raw ? JSON.parse(raw) : []);
        } catch (err) {
            console.log("[PrayerList] load error:", err);
        }
    };

    const savePrayers = async (updated: Prayer[]) => {
        setPrayers(updated);
        await Storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    // ── Form helpers ──

    const openAddForm = () => {
        setEditingPrayer(null);
        setFormTitle("");
        setFormDesc("");
        setFormEmoji("🙏");
        setFormTags([]);
        setFormPrivate(true);
        setFormVisible(true);
    };

    const openEditForm = (prayer: Prayer) => {
        setEditingPrayer(prayer);
        setFormTitle(prayer.title);
        setFormDesc(prayer.description);
        setFormEmoji(prayer.emoji);
        setFormTags([...prayer.tags]);
        setFormPrivate(prayer.isPrivate);
        setFormVisible(true);
    };

    const saveForm = async () => {
        const trimTitle = formTitle.trim();
        if (!trimTitle) return;

        if (editingPrayer) {
            const updated = prayers.map((p) =>
                p.id === editingPrayer.id
                    ? { ...p, title: trimTitle, description: formDesc.trim(), emoji: formEmoji, tags: formTags, isPrivate: formPrivate }
                    : p,
            );
            await savePrayers(updated);
        } else {
            const newPrayer: Prayer = {
                id: makeId(),
                title: trimTitle,
                description: formDesc.trim(),
                status: "pending",
                tags: formTags,
                emoji: formEmoji,
                isPrivate: formPrivate,
                createdAt: new Date().toISOString(),
                updates: [],
            };
            await savePrayers([newPrayer, ...prayers]);
        }

        setFormVisible(false);
        Keyboard.dismiss();
    };

    // ── Actions ──

    const markAnswered = async (prayer: Prayer) => {
        const updated = prayers.map((p) =>
            p.id === prayer.id
                ? { ...p, status: "answered" as PrayerStatus, answeredAt: new Date().toISOString() }
                : p,
        );
        await savePrayers(updated);
        if (selectedPrayer?.id === prayer.id) {
            setSelectedPrayer({ ...selectedPrayer, status: "answered", answeredAt: new Date().toISOString() });
        }
        setMenuVisible(false);
    };

    const archivePrayer = async (prayer: Prayer) => {
        const updated = prayers.map((p) =>
            p.id === prayer.id ? { ...p, status: "archived" as PrayerStatus } : p,
        );
        await savePrayers(updated);
        setMenuVisible(false);
    };

    const deletePrayer = async (prayer: Prayer) => {
        await savePrayers(prayers.filter((p) => p.id !== prayer.id));
        setMenuVisible(false);
        if (detailVisible && selectedPrayer?.id === prayer.id) setDetailVisible(false);
    };

    const addUpdate = async () => {
        const text = updateText.trim();
        if (!text || !selectedPrayer) return;
        const update: PrayerUpdate = { id: makeId(), text, date: new Date().toISOString() };
        const updatedPrayer = { ...selectedPrayer, updates: [update, ...selectedPrayer.updates] };
        const updatedList = prayers.map((p) => (p.id === selectedPrayer.id ? updatedPrayer : p));
        await savePrayers(updatedList);
        setSelectedPrayer(updatedPrayer);
        setUpdateText("");
        Keyboard.dismiss();
    };

    // ── Filtered data ──

    const filtered = filterStatus === "all"
        ? prayers
        : prayers.filter((p) => p.status === filterStatus);

    const answeredCount = prayers.filter((p) => p.status === "answered").length;
    const pendingCount = prayers.filter((p) => p.status === "pending").length;

    // ─── Render ──────────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, { paddingTop: insets.top + 16 }]}>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerLabel}>PRAYER LIST</Text>
                    <Text style={styles.headerSub}>
                        {pendingCount} praying · {answeredCount} answered
                    </Text>
                </View>
                <Pressable
                    onPress={openAddForm}
                    style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
                >
                    <Text style={styles.addBtnText}>＋</Text>
                </Pressable>
            </View>

            {/* Filter pills — plain View, no ScrollView to avoid touch interception */}
            <View style={styles.filterRow}>
                {(["all", "pending", "answered", "archived"] as const).map((f) => {
                    const active = filterStatus === f;
                    const label = f === "all" ? "All" : STATUS_CONFIG[f].label;
                    const color = f === "all" ? "#c084fc" : STATUS_CONFIG[f].color;
                    return (
                        <Pressable
                            key={f}
                            onPress={() => setFilterStatus(f)}
                            style={[
                                styles.filterPill,
                                active && { backgroundColor: color + "22", borderColor: color },
                            ]}
                        >
                            <Text style={[styles.filterPillText, active && { color }]}>{label}</Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Empty state — no flex:1 so it doesn't overlap the filter pills */}
            {filtered.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🙏</Text>
                    <Text style={styles.emptyText}>
                        {filterStatus === "all" ? "No prayers yet" : `No ${filterStatus} prayers`}
                    </Text>
                    <Text style={styles.emptySub}>
                        {filterStatus === "all" ? "Tap ＋ to add your first prayer" : "Try a different filter"}
                    </Text>
                </View>
            )}

            {/* Prayer list */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const statusCfg = STATUS_CONFIG[item.status];
                    return (
                        <Pressable
                            style={({ pressed }) => [styles.prayerCard, pressed && { opacity: 0.75 }]}
                            onPress={() => { setSelectedPrayer(item); setDetailVisible(true); }}
                            onLongPress={() => { setMenuPrayer(item); setMenuVisible(true); }}
                            delayLongPress={400}
                        >
                            {/* Left accent */}
                            <View style={[styles.prayerAccent, { backgroundColor: statusCfg.color }]} />

                            {/* Emoji */}
                            <View style={styles.prayerEmojiBg}>
                                <Text style={styles.prayerEmoji}>{item.emoji}</Text>
                            </View>

                            {/* Content */}
                            <View style={{ flex: 1 }}>
                                <Text style={styles.prayerTitle} numberOfLines={1}>{item.title}</Text>
                                {item.description ? (
                                    <Text style={styles.prayerDesc} numberOfLines={1}>{item.description}</Text>
                                ) : null}
                                {/* Tags — inline, no ScrollView inside FlatList */}
                                {item.tags.length > 0 && (
                                    <View style={{ flexDirection: "row", gap: 5, marginTop: 4, flexWrap: "nowrap" }}>
                                        {item.tags.slice(0, 2).map((tag) => (
                                            <View key={tag} style={styles.tagChip}>
                                                <Text style={styles.tagChipText}>{tag}</Text>
                                            </View>
                                        ))}
                                        {item.tags.length > 2 && (
                                            <View style={styles.tagChip}>
                                                <Text style={styles.tagChipText}>+{item.tags.length - 2}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Right side */}
                            <View style={styles.prayerRight}>
                                <Text style={{ fontSize: 14 }}>{statusCfg.emoji}</Text>
                                {item.updates.length > 0 && (
                                    <Text style={styles.updateBadge}>{item.updates.length}</Text>
                                )}
                                {item.isPrivate && <Text style={styles.lockIcon}>🔒</Text>}
                            </View>
                        </Pressable>
                    );
                }}
            />

            {/* ── Add / Edit Form Modal ─────────────────────────────────────── */}
            <Modal
                visible={formVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setFormVisible(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
                        <Pressable
                            onPress={() => setFormVisible(false)}
                            style={styles.modalHeaderBtn}
                            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                        >
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </Pressable>
                        <Text style={styles.modalTitle}>{editingPrayer ? "Edit Prayer" : "New Prayer"}</Text>
                        <Pressable
                            onPress={saveForm}
                            style={styles.modalHeaderBtn}
                            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                        >
                            <Text style={[styles.modalSave, { color: "#c084fc" }]}>Save</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">

                        {/* Emoji picker */}
                        <View>
                            <Text style={styles.fieldLabel}>ICON</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    {PRAYER_EMOJIS.map((e) => (
                                        <Pressable
                                            key={e}
                                            onPress={() => setFormEmoji(e)}
                                            style={[
                                                styles.emojiBtn,
                                                formEmoji === e && { borderColor: "#c084fc", backgroundColor: "#c084fc18" },
                                            ]}
                                        >
                                            <Text style={{ fontSize: 22 }}>{e}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Title */}
                        <View>
                            <Text style={styles.fieldLabel}>PRAYER</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formTitle}
                                onChangeText={setFormTitle}
                                placeholder="What are you praying for?"
                                placeholderTextColor="#444"
                                selectionColor="#c084fc"
                                autoFocus={!editingPrayer}
                                maxLength={80}
                            />
                        </View>

                        {/* Description */}
                        <View>
                            <Text style={styles.fieldLabel}>DETAILS (optional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={formDesc}
                                onChangeText={setFormDesc}
                                placeholder="Add more context or your heart's intention..."
                                placeholderTextColor="#444"
                                selectionColor="#c084fc"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                        </View>

                        {/* Tags */}
                        <View>
                            <Text style={styles.fieldLabel}>TAGS</Text>
                            <View style={styles.tagGrid}>
                                {AVAILABLE_TAGS.map((tag) => {
                                    const active = formTags.includes(tag);
                                    return (
                                        <Pressable
                                            key={tag}
                                            onPress={() =>
                                                setFormTags(
                                                    active ? formTags.filter((t) => t !== tag) : [...formTags, tag],
                                                )
                                            }
                                            style={[styles.tagPill, active && styles.tagPillActive]}
                                        >
                                            <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                                                {tag}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                    </ScrollView>
                </View>
            </Modal>

            {/* ── Detail / Updates Modal ───────────────────────────────────────── */}
            <Modal
                visible={detailVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setDetailVisible(false)}
            >
                {selectedPrayer && (() => {
                    const statusCfg = STATUS_CONFIG[selectedPrayer.status];
                    return (
                        <View style={styles.modalContainer}>
                            <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
                                <Pressable onPress={() => setDetailVisible(false)} style={styles.modalHeaderBtn}>
                                    <Text style={styles.modalCancel}>Close</Text>
                                </Pressable>
                                <Text style={styles.modalTitle}>Prayer</Text>
                                <Pressable
                                    onPress={() => { openEditForm(selectedPrayer); setDetailVisible(false); }}
                                    style={styles.modalHeaderBtn}
                                >
                                    <Text style={[styles.modalSave, { color: "#c084fc" }]}>Edit</Text>
                                </Pressable>
                            </View>

                            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

                                {/* Prayer header */}
                                <View style={styles.detailHead}>
                                    <View style={[styles.detailEmojiBg, { backgroundColor: statusCfg.color + "20" }]}>
                                        <Text style={{ fontSize: 36 }}>{selectedPrayer.emoji}</Text>
                                    </View>
                                    <Text style={styles.detailTitle}>{selectedPrayer.title}</Text>

                                    {/* Status badge */}
                                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + "20", borderColor: statusCfg.color + "50" }]}>
                                        <Text style={{ fontSize: 12 }}>{statusCfg.emoji}</Text>
                                        <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                                    </View>

                                    {selectedPrayer.description ? (
                                        <Text style={styles.detailDesc}>{selectedPrayer.description}</Text>
                                    ) : null}

                                    {/* Tags */}
                                    {selectedPrayer.tags.length > 0 && (
                                        <View style={styles.detailTags}>
                                            {selectedPrayer.tags.map((t) => (
                                                <View key={t} style={styles.tagChip}>
                                                    <Text style={styles.tagChipText}>{t}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Date */}
                                    <Text style={styles.detailDate}>
                                        Started {new Date(selectedPrayer.createdAt).toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
                                    </Text>
                                    {selectedPrayer.answeredAt && (
                                        <Text style={[styles.detailDate, { color: "#4ade80" }]}>
                                            ✅ Answered {new Date(selectedPrayer.answeredAt).toLocaleDateString("default", { month: "long", day: "numeric", year: "numeric" })}
                                        </Text>
                                    )}
                                </View>

                                {/* Mark as answered (if still pending) */}
                                {selectedPrayer.status === "pending" && (
                                    <Pressable
                                        onPress={() => markAnswered(selectedPrayer)}
                                        style={({ pressed }) => [styles.answeredBtn, pressed && { opacity: 0.75 }]}
                                    >
                                        <Text style={styles.answeredBtnText}>✅  Mark as Answered</Text>
                                    </Pressable>
                                )}

                                {/* Add update */}
                                <View style={styles.updateSection}>
                                    <Text style={styles.fieldLabel}>PRAYER UPDATES</Text>
                                    <View style={styles.updateInputRow}>
                                        <TextInput
                                            style={styles.updateInput}
                                            value={updateText}
                                            onChangeText={setUpdateText}
                                            placeholder="Add a note or update..."
                                            placeholderTextColor="#444"
                                            selectionColor="#c084fc"
                                            multiline
                                        />
                                        <Pressable
                                            onPress={addUpdate}
                                            style={({ pressed }) => [styles.updateSendBtn, pressed && { opacity: 0.7 }]}
                                        >
                                            <Text style={styles.updateSendText}>→</Text>
                                        </Pressable>
                                    </View>

                                    {selectedPrayer.updates.length === 0 && (
                                        <Text style={styles.noUpdates}>No updates yet. You can journal your prayer journey here.</Text>
                                    )}

                                    {selectedPrayer.updates.map((u) => (
                                        <View key={u.id} style={styles.updateCard}>
                                            <View style={styles.updateDot} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.updateText}>{u.text}</Text>
                                                <Text style={styles.updateDate}>
                                                    {new Date(u.date).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    );
                })()}
            </Modal>

            {/* ── Options Menu ─────────────────────────────────────────────────── */}
            <Modal
                transparent
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
                    <Pressable onPress={(e) => e.stopPropagation()}>
                        <View style={styles.menuBox}>
                            <View style={styles.menuHeader}>
                                <Text style={styles.menuTitle} numberOfLines={1}>
                                    {menuPrayer?.title || "Options"}
                                </Text>
                                <Pressable onPress={() => setMenuVisible(false)} style={styles.menuClose}>
                                    <Text style={styles.menuCloseText}>✕</Text>
                                </Pressable>
                            </View>

                            {menuPrayer?.status === "pending" && (
                                <>
                                    <Pressable
                                        onPress={() => menuPrayer && markAnswered(menuPrayer)}
                                        style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: "#1a1a1a" }]}
                                    >
                                        <Text style={styles.menuRowIcon}>✅</Text>
                                        <Text style={styles.menuRowText}>Mark as Answered</Text>
                                    </Pressable>
                                    <View style={styles.menuDivider} />
                                </>
                            )}

                            <Pressable
                                onPress={() => { if (menuPrayer) { openEditForm(menuPrayer); setMenuVisible(false); } }}
                                style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: "#1a1a1a" }]}
                            >
                                <Text style={styles.menuRowIcon}>✏️</Text>
                                <Text style={styles.menuRowText}>Edit</Text>
                            </Pressable>
                            <View style={styles.menuDivider} />

                            {menuPrayer?.status !== "archived" && (
                                <>
                                    <Pressable
                                        onPress={() => menuPrayer && archivePrayer(menuPrayer)}
                                        style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: "#1a1a1a" }]}
                                    >
                                        <Text style={styles.menuRowIcon}>📦</Text>
                                        <Text style={styles.menuRowText}>Archive</Text>
                                    </Pressable>
                                    <View style={styles.menuDivider} />
                                </>
                            )}

                            <Pressable
                                onPress={() => menuPrayer && deletePrayer(menuPrayer)}
                                style={({ pressed }) => [styles.menuRow, pressed && { backgroundColor: "#1a1a1a" }]}
                            >
                                <Text style={styles.menuRowIcon}>🗑️</Text>
                                <Text style={[styles.menuRowText, { color: "#f87171" }]}>Delete</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000", paddingHorizontal: 20 },

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    headerLabel: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    headerSub: { color: "#555", fontSize: 13, marginTop: 2 },
    addBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#c084fc",
        alignItems: "center",
        justifyContent: "center",
    },
    addBtnText: { color: "#fff", fontSize: 22, lineHeight: 26 },

    // Filter — plain row, no ScrollView
    filterRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },
    filterPill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#222",
        backgroundColor: "#111",
    },
    filterPillText: { color: "#555", fontSize: 13, fontWeight: "600" },

    // Empty state — NO flex:1 so it doesn't cover the filter pills
    emptyState: { alignItems: "center", justifyContent: "center", marginTop: 80 },
    emptyIcon: { fontSize: 44, marginBottom: 12 },
    emptyText: { color: "#fff", fontSize: 17, fontWeight: "600", marginBottom: 6 },
    emptySub: { color: "#444", fontSize: 13 },

    // Prayer card
    prayerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 12,
        marginBottom: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#1e1e1e",
        paddingVertical: 8,
        paddingRight: 12,
    },
    prayerAccent: { width: 3, alignSelf: "stretch" },
    prayerEmojiBg: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 8,
        backgroundColor: "#1a1a1a",
        borderWidth: 1,
        borderColor: "#2a2a2a",
    },
    prayerEmoji: { fontSize: 18 },
    prayerTitle: { color: "#f0f0f0", fontSize: 14, fontWeight: "600" },
    prayerDesc: { color: "#555", fontSize: 12, marginTop: 1 },
    prayerRight: { alignItems: "center", gap: 4 },
    updateBadge: {
        color: "#c084fc",
        fontSize: 11,
        fontWeight: "700",
        backgroundColor: "#c084fc22",
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        overflow: "hidden",
    },
    lockIcon: { fontSize: 11 },

    // Tags
    tagChip: {
        backgroundColor: "#1e1e1e",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    tagChipText: { color: "#666", fontSize: 11, fontWeight: "500" },
    tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    tagPill: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#222",
        backgroundColor: "#111",
    },
    tagPillActive: { borderColor: "#c084fc", backgroundColor: "#c084fc18" },
    tagPillText: { color: "#555", fontSize: 13 },
    tagPillTextActive: { color: "#c084fc", fontWeight: "600" },

    // Modal shared
    modalContainer: { flex: 1, backgroundColor: "#161616" },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: "#161616",
        borderBottomWidth: 1,
        borderBottomColor: "#1e1e1e",
    },
    modalHeaderBtn: { width: 70, paddingVertical: 8 },
    modalTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
    modalCancel: { color: "#555", fontSize: 15 },
    modalSave: { fontSize: 15, fontWeight: "600", textAlign: "right" },

    // Form
    fieldLabel: {
        color: "#444",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    textInput: {
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        color: "#f0f0f0",
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: "#252525",
    },
    textArea: { height: 110, paddingTop: 14 },
    emojiBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },

    // Private toggle
    privateRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#252525",
    },
    privateLabel: { color: "#e0e0e0", fontSize: 15, fontWeight: "500" },
    privateSub: { color: "#555", fontSize: 12, marginTop: 2 },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#333",
        padding: 3,
        justifyContent: "center",
    },
    toggleOn: { backgroundColor: "#c084fc40" },
    toggleThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "#555",
    },
    toggleThumbOn: {
        backgroundColor: "#c084fc",
        alignSelf: "flex-end",
    },

    // Detail modal
    detailHead: { alignItems: "center", paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#1a1a1a", marginBottom: 20 },
    detailEmojiBg: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    detailTitle: { color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10 },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 12,
    },
    statusBadgeText: { fontSize: 13, fontWeight: "600" },
    detailDesc: { color: "#888", fontSize: 15, textAlign: "center", lineHeight: 22, marginBottom: 12 },
    detailTags: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 12 },
    detailDate: { color: "#3a3a3a", fontSize: 12, fontWeight: "500" },

    // Answered button
    answeredBtn: {
        backgroundColor: "#4ade8018",
        borderWidth: 1,
        borderColor: "#4ade8040",
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
    },
    answeredBtnText: { color: "#4ade80", fontSize: 15, fontWeight: "600" },

    // Updates
    updateSection: { marginBottom: 20 },
    updateInputRow: { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 16 },
    updateInput: {
        flex: 1,
        backgroundColor: "#1a1a1a",
        borderRadius: 12,
        color: "#f0f0f0",
        fontSize: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#252525",
        maxHeight: 80,
    },
    updateSendBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: "#c084fc",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-end",
    },
    updateSendText: { color: "#fff", fontSize: 20, fontWeight: "700" },
    noUpdates: { color: "#333", fontSize: 13, textAlign: "center", paddingVertical: 16 },
    updateCard: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 14,
    },
    updateDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#c084fc",
        marginTop: 6,
    },
    updateText: { color: "#ccc", fontSize: 14, lineHeight: 20 },
    updateDate: { color: "#3a3a3a", fontSize: 11, marginTop: 4 },

    // Options menu
    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    menuBox: {
        backgroundColor: "#161616",
        borderRadius: 16,
        width: 270,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#242424",
    },
    menuHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#222",
    },
    menuTitle: { color: "#888", fontSize: 13, flex: 1, marginRight: 8 },
    menuClose: { padding: 2 },
    menuCloseText: { color: "#555", fontSize: 15 },
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
    },
    menuRowIcon: { fontSize: 16 },
    menuRowText: { color: "#e0e0e0", fontSize: 15, fontWeight: "500" },
    menuDivider: { height: 1, backgroundColor: "#1e1e1e", marginHorizontal: 14 },
});