export type Strategy = {
  id: string;
  name: string;
  description?: string;
};

export const STRATEGY_KEY = "fx-journal:strategies:v1";

export const DEFAULT_STRATEGIES: Strategy[] = [
  { id: "default-breakout", name: "شکست سطح", description: "ورود پس از شکست سطح کلیدی" },
  { id: "default-pullback", name: "پولبک", description: "ورود در بازگشت به سطح شکسته‌شده" },
];

export function loadStrategies(): Strategy[] {
  if (typeof window === "undefined") return DEFAULT_STRATEGIES;
  try {
    const raw = window.localStorage.getItem(STRATEGY_KEY);
    if (!raw) return DEFAULT_STRATEGIES;
    const parsed = JSON.parse(raw) as Strategy[];
    return Array.isArray(parsed) ? parsed : DEFAULT_STRATEGIES;
  } catch {
    return DEFAULT_STRATEGIES;
  }
}

export function saveStrategies(list: Strategy[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STRATEGY_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("fx-journal:changed"));
}
