import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const FILE_URI = FileSystem.documentDirectory + 'notes.json';

const isWeb = Platform.OS === 'web';

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }

      console.log('[Storage] getItem - FILE_URI:', FILE_URI);
      const info = await FileSystem.getInfoAsync(FILE_URI);
      console.log('[Storage] getItem - file exists:', info.exists);

      if (!info.exists) return null;
      const content = await FileSystem.readAsStringAsync(FILE_URI);
      console.log('[Storage] getItem - content:', content);

      const parsed = JSON.parse(content);
      return parsed[key] ?? null;
    } catch (err) {
      console.log('[Storage] getItem ERROR:', err);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
        return;
      }

      console.log('[Storage] setItem - key:', key, 'value:', value);

      let existing: Record<string, string> = {};
      const info = await FileSystem.getInfoAsync(FILE_URI);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(FILE_URI);
        existing = JSON.parse(content);
      }
      existing[key] = value;
      await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(existing));
      console.log('[Storage] setItem - saved successfully!');
    } catch (err) {
      console.log('[Storage] setItem ERROR:', err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
        return;
      }

      const info = await FileSystem.getInfoAsync(FILE_URI);
      if (!info.exists) return;
      const content = await FileSystem.readAsStringAsync(FILE_URI);
      const existing = JSON.parse(content);
      delete existing[key];
      await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(existing));
    } catch (err) {
      console.log('[Storage] removeItem ERROR:', err);
    }
  },
};