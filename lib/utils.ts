export const today = () => new Date().toISOString().slice(0, 10);

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createDateOptions = (startYear = 2018, endYear = new Date().getFullYear() + 2) => ({
  years: ["-"].concat(
    Array.from({ length: endYear - startYear + 1 }, (_, index) => String(startYear + index)),
  ),
  months: ["-"].concat(
    Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")),
  ),
  days: ["-"].concat(
    Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0")),
  ),
});

export const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const buildDateFromParts = (year: string, month: string, day: string) => {
  if ([year, month, day].some((value) => !value || value === "-")) return "";
  return `${year}-${month}-${day}`;
};

export const splitDate = (value: string) => {
  if (!value) return { year: "-", month: "-", day: "-" };
  const [year = "-", month = "-", day = "-"] = value.split("-");
  return { year, month, day };
};

export const formatGeneration = ({
  primary,
  secondary,
  count,
}: {
  primary: string;
  secondary: string;
  count: string;
}) => {
  const head = secondary !== "-" ? secondary : primary;
  if (head === "-") return "-";
  return `${head}${count || ""}`;
};

export const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const daysBetween = (start: string, end: string) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  return Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000);
};

export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  wait: number
) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}
