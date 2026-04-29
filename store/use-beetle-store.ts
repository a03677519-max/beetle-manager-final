"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createId, today } from "@/lib/utils";
import type {
  AdultFormValues,
  BeetleEntry,
  EntryType,
  LarvaFormValues,
  LarvaLog,
  SpawnSetFormValues,
  SwitchBotSettings,
} from "@/types/beetle";
import { COHABITATION_OPTIONS } from "@/types/beetle";
import { normalizeEntries } from "./beetle-store-utils";

type BeetleState = {
  entries: BeetleEntry[];
  selectedType: EntryType | "すべて";
  editingId: string | null;
  switchBot: SwitchBotSettings;
  setSelectedType: (stage: EntryType | "すべて") => void;
  startEditing: (id: string | null) => void;
  updateSwitchBot: (input: Partial<SwitchBotSettings>) => void;
  addAdult: (input: AdultFormValues) => void;
  updateAdult: (id: string, input: AdultFormValues) => void;
  addLarva: (input: LarvaFormValues) => void;
  updateLarva: (id: string, input: LarvaFormValues) => void;
  addSpawnSet: (input: SpawnSetFormValues) => void;
  updateSpawnSet: (id: string, input: SpawnSetFormValues) => void;
  deleteEntry: (id: string) => void;
  addLarvaLog: (id: string, input: Omit<LarvaLog, "id">) => void;
  updateLarvaLog: (entryId: string, logId: string, input: Omit<LarvaLog, "id">) => void;
  deleteLarvaLog: (entryId: string, logId: string) => void;
  addPhotos: (id: string, photos: string[]) => void;
  deletePhoto: (entryId: string, photoIndex: number) => void;
  importData: (entries: BeetleEntry[]) => void;
};

const emptyGeneration = {
  primary: "-",
  secondary: "-",
  count: "",
} as const;

export const emptyAdultForm: AdultFormValues = {
  type: "成虫",
  japaneseName: "",
  scientificName: "",
  locality: "",
  generation: { ...emptyGeneration },
  emergenceDate: "",
  feedingDate: "",
  deathDate: "",
  larvaMemo: "",
  gender: "不明",
};

export const emptyLarvaForm: LarvaFormValues = {
  type: "幼虫",
  japaneseName: "",
  scientificName: "",
  locality: "",
  generation: { ...emptyGeneration },
  logs: [],
  plannedEmergenceDate: "",
  actualEmergenceDate: "",
  emergenceType: "羽化",
};

export const emptySpawnSetForm: SpawnSetFormValues = {
  type: "産卵セット",
  japaneseName: "",
  scientificName: "",
  locality: "",
  generation: { ...emptyGeneration },
  emergenceDate: "",
  feedingDate: "",
  setDate: "",
  substrate: "",
  containerSize: "",
  pressure: 3,
  moisture: 3,
  temperature: "",
  cohabitation: COHABITATION_OPTIONS[1],
};

export const useBeetleStore = create<BeetleState>()(
  persist(
    (set) => ({
      entries: [],
      selectedType: "すべて",
      editingId: null,
      switchBot: { token: "", secret: "", deviceId: "", deviceName: "" },
      setSelectedType: (selectedType) => set({ selectedType }),
      startEditing: (editingId) => set({ editingId }),
      updateSwitchBot: (input) =>
        set((state) => ({ switchBot: { ...state.switchBot, ...input } })),
      addAdult: (input) =>
        set((state) => ({
          entries: [{ id: createId(), ...input, photos: [], createdAt: today(), updatedAt: today() }, ...state.entries],
          editingId: null,
        })),
      updateAdult: (id, input) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id && entry.type === "成虫" ? { ...entry, ...input, updatedAt: today() } : entry,
          ),
          editingId: null,
        })),
      addLarva: (input) =>
        set((state) => ({
          entries: [{ id: createId(), ...input, photos: [], createdAt: today(), updatedAt: today() }, ...state.entries],
          editingId: null,
        })),
      updateLarva: (id, input) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id && entry.type === "幼虫" ? { ...entry, ...input, updatedAt: today() } : entry,
          ),
          editingId: null,
        })),
      addSpawnSet: (input) =>
        set((state) => ({
          entries: [{ id: createId(), ...input, photos: [], createdAt: today(), updatedAt: today() }, ...state.entries],
          editingId: null,
        })),
      updateSpawnSet: (id, input) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id && entry.type === "産卵セット" ? { ...entry, ...input, updatedAt: today() } : entry,
          ),
          editingId: null,
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
          editingId: state.editingId === id ? null : state.editingId,
        })),
      addLarvaLog: (id, input) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id && entry.type === "幼虫"
              ? {
                  ...entry,
                  logs: [{ id: createId(), ...input }, ...entry.logs],
                  updatedAt: today(),
                }
              : entry,
          ),
        })),
      updateLarvaLog: (entryId, logId, input) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId && entry.type === "幼虫"
              ? {
                  ...entry,
                  logs: entry.logs.map((log) => (log.id === logId ? { id: logId, ...input } : log)),
                  updatedAt: today(),
                }
              : entry,
          ),
        })),
      deleteLarvaLog: (entryId, logId) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId && entry.type === "幼虫"
              ? {
                  ...entry,
                  logs: entry.logs.filter((log) => log.id !== logId),
                  updatedAt: today(),
                }
              : entry,
          ),
        })),
      addPhotos: (id, photos) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, photos: [...entry.photos, ...photos], updatedAt: today() } : entry,
          ),
        })),
      deletePhoto: (entryId, photoIndex) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  photos: entry.photos.filter((_, index) => index !== photoIndex),
                  updatedAt: today(),
                }
              : entry,
          ),
        })),
      importData: (entries) => set({ entries: normalizeEntries(entries), editingId: null }),
    }),
    {
      name: "beetle-manager-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
        selectedType: state.selectedType,
        switchBot: state.switchBot,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<BeetleState> & { beetles?: unknown };
        return {
          ...currentState,
          ...persisted,
          entries: normalizeEntries(persisted.entries ?? persisted.beetles),
          selectedType: persisted.selectedType ?? currentState.selectedType,
          switchBot: persisted.switchBot ?? currentState.switchBot,
        };
      },
    },
  ),
);
