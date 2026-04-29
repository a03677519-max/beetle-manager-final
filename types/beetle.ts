export const ENTRY_TYPES = ["成虫", "幼虫", "産卵セット"] as const;
export const STAGES = ["卵", "幼虫", "蛹", "成虫"] as const;
export const GENDERS = ["不明", "オス", "メス"] as const;
export const EMERGENCE_TYPES = ["羽化", "掘り出し"] as const;
export const COHABITATION_OPTIONS = ["あり", "なし"] as const;
export const PRESSURE_LEVELS = [1, 2, 3, 4, 5] as const;
export const MOISTURE_LEVELS = [1, 2, 3, 4, 5] as const;
export const LOG_STAGES = ["L1", "L2", "L3"] as const;
export const GENERATION_PRIMARY = ["-", "WD", "CB", "WF", "CBF"] as const;
export const GENERATION_SECONDARY = ["-", "WF", "CBF"] as const;
export const COUNT_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);
export const GENERATION_COUNT_OPTIONS = Array.from({ length: 30 }, (_, index) =>
  String(index + 1),
);

export type EntryType = (typeof ENTRY_TYPES)[number];
export type BeetleStage = (typeof STAGES)[number];
export type Gender = (typeof GENDERS)[number];
export type EmergenceType = (typeof EMERGENCE_TYPES)[number];
export type CohabitationOption = (typeof COHABITATION_OPTIONS)[number];
export type LogStage = (typeof LOG_STAGES)[number];

export type GenerationValue = {
  primary: (typeof GENERATION_PRIMARY)[number];
  secondary: (typeof GENERATION_SECONDARY)[number];
  count: string;
};

export type LarvaLog = {
  id: string;
  date: string;
  substrate: string;
  pressure: number;
  moisture: number;
  bottleSize: string;
  stage: LogStage;
  weight: string;
  gender: Gender;
  temperature: string;
};

export type AdultBeetle = {
  id: string;
  type: "成虫";
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: GenerationValue;
  emergenceDate: string;
  feedingDate: string;
  deathDate: string;
  larvaMemo: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  gender: Gender;
  linkedEntryId?: string;
};

export type LarvaBeetle = {
  id: string;
  type: "幼虫";
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: GenerationValue;
  logs: LarvaLog[];
  plannedEmergenceDate: string;
  actualEmergenceDate: string;
  emergenceType: EmergenceType;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  linkedEntryId?: string;
};

export type SpawnSet = {
  id: string;
  type: "産卵セット";
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: GenerationValue;
  emergenceDate: string;
  feedingDate: string;
  setDate: string;
  substrate: string;
  containerSize: string;
  pressure: number;
  moisture: number;
  temperature: string;
  cohabitation: CohabitationOption;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  linkedEntryId?: string;
};

export type BeetleEntry = AdultBeetle | LarvaBeetle | SpawnSet;

export type AdultFormValues = Omit<AdultBeetle, "id" | "photos" | "createdAt" | "updatedAt">;
export type LarvaFormValues = Omit<LarvaBeetle, "id" | "photos" | "createdAt" | "updatedAt">;
export type SpawnSetFormValues = Omit<SpawnSet, "id" | "photos" | "createdAt" | "updatedAt">;

export type SwitchBotSettings = {
  token: string;
  secret: string;
  deviceId: string;
  deviceName: string;
};
