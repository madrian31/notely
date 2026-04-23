import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Storage Key Constants ─────────────────────────────────────────────────────
// Centralized para walang typo sa buong codebase.
// Gamitin lagi ito imbes na raw strings.

export const STORAGE_KEYS = {
  journals: "journals",
  notes: (journalId: string) => `notes_${journalId}`,
  username: "username",
  seenNamePrompt: "seen_name_prompt", // set to "1" once user has seen the onboarding popup
};

// ─── Size Guard ────────────────────────────────────────────────────────────────
// Ang AsyncStorage ay may 6MB limit sa Android.
// Bago mag-save, chine-check natin kung hindi pa lalampas.

const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB — may buffer pa para sa 6MB limit

async function getTotalStorageSize(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stores = await AsyncStorage.multiGet(keys as string[]);
    return stores.reduce((total, [, value]) => {
      return total + (value ? new Blob([value]).size : 0);
    }, 0);
  } catch {
    return 0;
  }
}

// ─── Storage API ──────────────────────────────────────────────────────────────

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.log("[Storage] getItem ERROR:", err);
      return null;
    }
  },

  async setItem(
    key: string,
    value: string,
  ): Promise<{ ok: boolean; reason?: string }> {
    try {
      // Size guard — check kung hindi pa lalampas ng limit
      const incomingSize = new Blob([value]).size;
      const currentSize = await getTotalStorageSize();

      if (currentSize + incomingSize > MAX_STORAGE_BYTES) {
        const usedMB = (currentSize / 1024 / 1024).toFixed(1);
        console.warn(`[Storage] Size limit warning: ${usedMB}MB used`);
        return {
          ok: false,
          reason: `Storage is almost full (${usedMB}MB used). Please delete some entries to continue saving.`,
        };
      }

      await AsyncStorage.setItem(key, value);
      return { ok: true };
    } catch (err) {
      console.log("[Storage] setItem ERROR:", err);
      return { ok: false, reason: "Failed to save. Please try again." };
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.log("[Storage] removeItem ERROR:", err);
    }
  },

  // Utility: makita kung gaano na kalaki ang ginamit na storage
  async getStorageInfo(): Promise<{
    usedMB: string;
    usedBytes: number;
    limitMB: number;
  }> {
    const usedBytes = await getTotalStorageSize();
    return {
      usedBytes,
      usedMB: (usedBytes / 1024 / 1024).toFixed(2),
      limitMB: MAX_STORAGE_BYTES / 1024 / 1024,
    };
  },
};
