import { createId, today } from "@/lib/utils";
import type { BeetleEntry } from "@/types/beetle";

const emptyGeneration = {
  primary: "-",
  secondary: "-",
  count: "",
} as const;

export const normalizeEntries = (entries: unknown): BeetleEntry[] => {
  if (!Array.isArray(entries)) return [];

  return entries.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Record<string, unknown>;

    if (raw.type === "成虫" || raw.type === "幼虫" || raw.type === "産卵セット") {
      return [
        {
          ...raw,
          photos: Array.isArray(raw.photos) ? (raw.photos as string[]) : [],
          createdAt: typeof raw.createdAt === "string" ? raw.createdAt : today(),
          updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : today(),
        } as BeetleEntry,
      ];
    }

    const legacyType =
      raw.stage === "幼虫"
        ? "幼虫"
        : raw.stage === "成虫"
          ? "成虫"
          : typeof raw.stage === "string"
            ? "産卵セット"
            : "幼虫";

    if (legacyType === "成虫") {
      return [
        {
          id: typeof raw.id === "string" ? raw.id : createId(),
          type: "成虫",
          japaneseName: String(raw.name ?? ""),
          scientificName: String(raw.species ?? ""),
          locality: String(raw.locality ?? ""),
          generation: { ...emptyGeneration },
          emergenceDate: "",
          feedingDate: "",
          deathDate: "",
          larvaMemo: "",
          photos: Array.isArray(raw.photos) ? (raw.photos as string[]) : [],
          createdAt: typeof raw.createdAt === "string" ? raw.createdAt : today(),
          updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : today(),
          gender: "不明",
          emergenceType: "羽化",
        },
      ];
    }

    if (legacyType === "産卵セット") {
      return [
        {
          id: typeof raw.id === "string" ? raw.id : createId(),
          type: "産卵セット",
          japaneseName: String(raw.name ?? ""),
          scientificName: String(raw.species ?? ""),
          locality: String(raw.locality ?? ""),
          generation: { ...emptyGeneration },
          emergenceDate: typeof raw.emergenceDate === "string" ? raw.emergenceDate : "",
          feedingDate: typeof raw.feedingDate === "string" ? raw.feedingDate : "",
          setDate: "",
          substrate: "",
          containerSize: "",
          pressure: 3,
          moisture: 3,
          temperature: String(raw.temperature ?? ""),
          cohabitation: "なし",
          photos: Array.isArray(raw.photos) ? (raw.photos as string[]) : [],
          createdAt: typeof raw.createdAt === "string" ? raw.createdAt : today(),
          updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : today(),
        },
      ];
    }

    return [
      {
        id: typeof raw.id === "string" ? raw.id : createId(),
        type: "幼虫",
        japaneseName: String(raw.name ?? ""),
        scientificName: String(raw.species ?? ""),
        locality: String(raw.locality ?? ""),
        generation: { ...emptyGeneration },
        logs: [],
        plannedEmergenceDate: "",
        actualEmergenceDate: "",
        emergenceType: "羽化",
        photos: Array.isArray(raw.photos) ? (raw.photos as string[]) : [],
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : today(),
        updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : today(),
      },
    ];
  });
};
