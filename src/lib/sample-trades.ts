import type { Trade } from "./trades";

function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

type Seed = [
  offset: number,
  pair: string,
  dir: "buy" | "sell",
  lot: number,
  entry: number,
  exit: number,
  stop: number,
  pnl: number,
  session: Trade["session"],
  strategy: string,
  emotion: Trade["emotion"],
  followedPlan: boolean,
];

const SEEDS: Seed[] = [
  [42, "EUR/USD", "buy", 0.5, 1.084, 1.0892, 1.0815, 260, "لندن", "شکست سطح", "آرام", true],
  [40, "GBP/USD", "buy", 0.4, 1.264, 1.2712, 1.2612, 288, "لندن", "شکست سطح", "مطمئن", true],
  [38, "USD/JPY", "sell", 0.3, 154.8, 155.35, 155.1, -165, "نیویورک", "بازگشت", "طمع", false],
  [36, "XAU/USD", "buy", 0.15, 2348, 2371, 2338, 345, "لندن", "روند", "آرام", true],
  [34, "GBP/JPY", "sell", 0.3, 191.4, 192.2, 191.9, -240, "نیویورک", "بازگشت", "انتقام‌جویی", false],
  [32, "EUR/USD", "buy", 0.5, 1.0902, 1.0935, 1.0878, 165, "لندن", "روند", "مطمئن", true],
  [30, "USD/CHF", "sell", 0.4, 0.8912, 0.8945, 0.894, -132, "نیویورک", "شکست سطح", "بی‌حوصله", false],
  [28, "XAU/USD", "buy", 0.2, 2362, 2389, 2350, 540, "لندن", "روند", "آرام", true],
  [26, "AUD/USD", "sell", 0.3, 0.6612, 0.6641, 0.6638, -87, "توکیو", "بازگشت", "طمع", false],
  [24, "EUR/USD", "sell", 0.5, 1.0948, 1.0912, 1.0972, 180, "لندن", "شکست سطح", "مطمئن", true],
  [22, "GBP/JPY", "buy", 0.25, 190.8, 192.6, 190.1, 300, "لندن", "روند", "آرام", true],
  [20, "USD/JPY", "buy", 0.4, 155.1, 154.6, 154.7, -200, "نیویورک", "بازگشت", "انتقام‌جویی", false],
  [18, "XAU/USD", "sell", 0.1, 2402, 2381, 2412, 210, "نیویورک", "بازگشت", "مطمئن", true],
  [16, "EUR/USD", "buy", 0.6, 1.0865, 1.0918, 1.0842, 318, "لندن", "شکست سطح", "آرام", true],
  [14, "GBP/USD", "sell", 0.4, 1.2732, 1.2762, 1.276, -120, "نیویورک", "بازگشت", "طمع", false],
  [12, "USD/CAD", "buy", 0.3, 1.3625, 1.3668, 1.3602, 129, "نیویورک", "روند", "مطمئن", true],
  [10, "XAU/USD", "buy", 0.2, 2378, 2352, 2368, -520, "توکیو", "شکست سطح", "بی‌حوصله", false],
  [8, "EUR/USD", "buy", 0.5, 1.0888, 1.0942, 1.0866, 270, "لندن", "روند", "آرام", true],
  [6, "GBP/JPY", "sell", 0.3, 193.2, 192.1, 193.8, 330, "لندن", "شکست سطح", "مطمئن", true],
  [4, "USD/JPY", "sell", 0.4, 156.2, 156.6, 156.55, -160, "نیویورک", "بازگشت", "انتقام‌جویی", false],
  [3, "XAU/USD", "buy", 0.25, 2390, 2425, 2378, 875, "لندن", "روند", "آرام", true],
  [1, "EUR/USD", "buy", 0.5, 1.092, 1.0949, 1.0898, 145, "لندن", "شکست سطح", "مطمئن", true],
];

export const SAMPLE_TRADES: Trade[] = SEEDS.map(
  ([offset, pair, dir, lot, entry, exit, stop, pnl, session, strategy, emotion, followedPlan], i) => ({
    id: `sample-${i}`,
    date: day(offset),
    pair,
    direction: dir,
    lot,
    entry,
    exit,
    stop,
    pnl,
    session,
    strategy,
    emotion,
    followedPlan,
    notes: "",
  }),
);
