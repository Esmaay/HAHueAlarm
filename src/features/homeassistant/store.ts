/**
 * Home Assistant connection state.
 *
 * The config (URL + token) is persisted to the device keychain via
 * expo-secure-store — deliberately *not* AsyncStorage — because the token is a
 * credential. Connection status and the fetched light list are runtime-only.
 */

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { fetchLightEntities, friendlyError, normalizeBaseUrl } from './client';
import type { ConnectionStatus, HAConfig, HAEntity } from './types';

const STORAGE_KEY = 'hahue_ha_config_v1';

const secureStorage: StateStorage = {
  getItem: (name) => SecureStore.getItemAsync(name),
  setItem: (name, value) => SecureStore.setItemAsync(name, value),
  removeItem: (name) => SecureStore.deleteItemAsync(name),
};

interface HAConnectionState {
  config: HAConfig | null;
  hydrated: boolean;

  status: ConnectionStatus;
  lights: HAEntity[];
  lightsLoading: boolean;
  lightsError: string | null;

  /** Persist a verified config, then load its lights. */
  saveConfig: (config: HAConfig) => Promise<void>;
  clearConfig: () => void;
  /** (Re)load the light entity list from Home Assistant. */
  refreshLights: () => Promise<void>;
}

export const useHAStore = create<HAConnectionState>()(
  persist(
    (set, get) => ({
      config: null,
      hydrated: false,

      status: 'unconfigured',
      lights: [],
      lightsLoading: false,
      lightsError: null,

      saveConfig: async (config) => {
        set({
          config: { baseUrl: normalizeBaseUrl(config.baseUrl), token: config.token },
          status: 'connected',
        });

        await get().refreshLights();
      },

      clearConfig: () => {
        set({ config: null, status: 'unconfigured', lights: [], lightsError: null });
      },

      refreshLights: async () => {
        const { config } = get();

        if (!config) {
          set({ status: 'unconfigured', lights: [] });

          return;
        }

        set({ lightsLoading: true, lightsError: null });

        try {
          const lights = await fetchLightEntities(config);

          set({ lights, lightsLoading: false, status: 'connected' });
        } catch (error) {
          set({ lightsLoading: false, lightsError: friendlyError(error), status: 'error' });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ config: state.config }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.hydrated = true;
        state.status = state.config ? 'connected' : 'unconfigured';
      },
    },
  ),
);
