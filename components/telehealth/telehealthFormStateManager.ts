import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormState, SavedFormState } from './types';

const STORAGE_PREFIX = 'telehealth_form_state_';
const MAX_AGE_DAYS = 7;
const MAX_STORED_STATES = 5;

export class TelehealthFormStateManager {
  private memberId: string;
  private currentStateKey: string | null = null;

  constructor(memberId: string) {
    this.memberId = memberId;
  }

  private getStorageKey(timestamp?: number): string {
    const ts = timestamp || Date.now();
    return `${STORAGE_PREFIX}${this.memberId}_${ts}`;
  }

  async saveFormState(formState: FormState): Promise<boolean> {
    try {
      const key = this.getStorageKey();
      this.currentStateKey = key;

      const savedState: SavedFormState = {
        key,
        state: {
          ...formState,
          memberId: this.memberId,
          timestamp: Date.now()
        },
        savedAt: Date.now()
      };

      await AsyncStorage.setItem(key, JSON.stringify(savedState));
      await this.cleanupOldStates();

      return true;
    } catch (error) {
      console.error('Error saving form state:', error);
      return false;
    }
  }

  async getLatestFormState(currentUrl?: string): Promise<SavedFormState | null> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const memberKeys = allKeys.filter(key =>
        key.startsWith(`${STORAGE_PREFIX}${this.memberId}_`)
      );

      if (memberKeys.length === 0) return null;

      const states = await Promise.all(
        memberKeys.map(async key => {
          try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
          } catch {
            return null;
          }
        })
      );

      const validStates = states
        .filter((state): state is SavedFormState => state !== null)
        .filter(state => {
          const age = Date.now() - state.savedAt;
          const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
          return age < maxAge;
        })
        .sort((a, b) => b.savedAt - a.savedAt);

      if (validStates.length === 0) return null;

      if (currentUrl) {
        const matchingState = validStates.find(state =>
          state.state.url === currentUrl
        );
        if (matchingState) return matchingState;
      }

      return validStates[0];
    } catch (error) {
      console.error('Error getting form state:', error);
      return null;
    }
  }

  async clearCurrentState(): Promise<boolean> {
    try {
      if (this.currentStateKey) {
        await AsyncStorage.removeItem(this.currentStateKey);
        this.currentStateKey = null;
      }
      return true;
    } catch (error) {
      console.error('Error clearing form state:', error);
      return false;
    }
  }

  async clearAllStates(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const memberKeys = allKeys.filter(key =>
        key.startsWith(`${STORAGE_PREFIX}${this.memberId}_`)
      );

      await AsyncStorage.multiRemove(memberKeys);
      this.currentStateKey = null;

      return true;
    } catch (error) {
      console.error('Error clearing all form states:', error);
      return false;
    }
  }

  private async cleanupOldStates(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const memberKeys = allKeys.filter(key =>
        key.startsWith(`${STORAGE_PREFIX}${this.memberId}_`)
      );

      if (memberKeys.length <= MAX_STORED_STATES) return;

      const states = await Promise.all(
        memberKeys.map(async key => {
          try {
            const data = await AsyncStorage.getItem(key);
            return data ? { key, ...JSON.parse(data) } : null;
          } catch {
            return null;
          }
        })
      );

      const validStates = states
        .filter((state): state is SavedFormState & { key: string } => state !== null)
        .sort((a, b) => b.savedAt - a.savedAt);

      const statesToDelete = validStates.slice(MAX_STORED_STATES);
      const keysToDelete = statesToDelete.map(state => state.key);

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }

      const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const expiredKeys = validStates
        .filter(state => Date.now() - state.savedAt > maxAge)
        .map(state => state.key);

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
      }
    } catch (error) {
      console.error('Error cleaning up old states:', error);
    }
  }

  async hasSavedState(currentUrl?: string): Promise<boolean> {
    const state = await this.getLatestFormState(currentUrl);
    return state !== null;
  }

  async getSavedStateInfo(): Promise<{
    hasSavedState: boolean;
    savedAt?: Date;
    url?: string;
  }> {
    try {
      const state = await this.getLatestFormState();

      if (!state) {
        return { hasSavedState: false };
      }

      return {
        hasSavedState: true,
        savedAt: new Date(state.savedAt),
        url: state.state.url
      };
    } catch {
      return { hasSavedState: false };
    }
  }

  static async cleanupAllExpiredStates(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const telehealthKeys = allKeys.filter(key =>
        key.startsWith(STORAGE_PREFIX)
      );

      const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const keysToDelete: string[] = [];

      await Promise.all(
        telehealthKeys.map(async key => {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              const state = JSON.parse(data);
              if (Date.now() - state.savedAt > maxAge) {
                keysToDelete.push(key);
              }
            }
          } catch {
            keysToDelete.push(key);
          }
        })
      );

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }
    } catch (error) {
      console.error('Error cleaning up expired states:', error);
    }
  }
}
