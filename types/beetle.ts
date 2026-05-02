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

export type BaseBeetle = {
  id: string;
  japaneseName: string;
  scientificName: string;
  locality: string;
  generation: GenerationValue;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  managementName?: string;
  linkedEntryId?: string;
  memo?: string;
  order?: number; // 並べ替え用
};

export type LarvaLog = {
  id: string;
  date: string;
  substrate: string;
  pressure: number;
  moisture: number;
  bottleSize: string;
  stage: LogStage;
  weight: number;
  gender: Gender;
  temperature: string;
};

export type AdultBeetle = BaseBeetle & {
  type: "成虫";
  emergenceDate: string;
  emergenceType: EmergenceType;
  feedingDate: string;
  deathDate: string;
  larvaMemo: string;
  gender: Gender;
  size?: string;
  status?: string;
};

export type LarvaBeetle = BaseBeetle & {
  type: "幼虫";
  logs: LarvaLog[];
  plannedEmergenceDate: string;
  actualEmergenceDate: string;
  emergenceType: EmergenceType;
  hatchDate: string;
  nextExchangeDate?: string;
};

export type SpawnSet = BaseBeetle & {
  type: "産卵セット";
  emergenceDate: string;
  feedingDate: string;
  setDate: string;
  setEndDate?: string;
  substrate: string;
  containerSize: string;
  pressure: string;
  moisture: number;
  temperature: string;
  cohabitation: CohabitationOption;
  eggCount?: number;
  larvaCount?: number;
};

export type BeetleEntry = AdultBeetle | LarvaBeetle | SpawnSet;

export type AdultFormValues = Omit<AdultBeetle, "id" | "photos" | "createdAt" | "updatedAt"> & {
  id?: string;
  photos?: string[];
};
export type LarvaFormValues = Omit<LarvaBeetle, "id" | "photos" | "createdAt" | "updatedAt"> & {
  id?: string;
  photos?: string[];
  hatchDate?: string;
  createdAt?: string;
};
export type SpawnSetFormValues = Omit<SpawnSet, "id" | "photos" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type SwitchBotSettings = {
  token: string;
  secret: string;
  deviceId: string;
  deviceName: string;
};

export type GitHubSettings = {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
};
