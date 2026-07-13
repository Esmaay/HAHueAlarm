/**
 * Transient editing state for the alarm the user is currently creating or
 * editing.
 *
 * Held apart from the persisted `useAlarmStore` so that:
 *   • sub-screens (sound, sunrise, Hue target) can mutate one shared draft
 *     without threading params through navigation, and
 *   • edits are only committed on Save — backing out discards them.
 *
 * Not persisted; it lives for the lifetime of an editing session.
 */

import { create } from 'zustand';

import { createAlarmDraft } from './catalog';
import type { AlarmDraft, SunriseConfig, WakeMission } from './types';

interface EditorState {
  draft: AlarmDraft;
  /** Id of the alarm being edited, or null when creating a new one. */
  editingId: string | null;

  begin: (draft: AlarmDraft, editingId: string | null) => void;
  patch: (partial: Partial<AlarmDraft>) => void;
  patchSunrise: (partial: Partial<SunriseConfig>) => void;
  patchMission: (partial: Partial<WakeMission>) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  draft: createAlarmDraft(),
  editingId: null,

  begin: (draft, editingId) => set({ draft, editingId }),

  patch: (partial) => set((state) => ({ draft: { ...state.draft, ...partial } })),

  patchSunrise: (partial) =>
    set((state) => ({ draft: { ...state.draft, sunrise: { ...state.draft.sunrise, ...partial } } })),

  patchMission: (partial) =>
    set((state) => ({ draft: { ...state.draft, mission: { ...state.draft.mission, ...partial } } })),
}));
