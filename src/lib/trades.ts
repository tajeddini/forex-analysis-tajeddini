export type Direction = "buy" | "sell";

export const SESSIONS = ["سیدنی", "توکیو", "لندن", "نیویورک"] as const;
export type Session = (typeof SESSIONS)[number];

export const EMOTIONS = ["آرام", "مطمئن", "بی‌حوصله", "ترس", "طمع", "انتقام‌جویی"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "GBP/JPY",
  "AUD/USD",
  "USD/CAD",
  "USD/CHF",
  "XAU/USD",
  "BTC/USD",
] as const;

export type Trade = {
  id: string;
  externalId?: string; // شماره پوزیشن متاتریدر برای جلوگیری از ورود تکراری
  date: string; // yyyy-mm-dd
  pair: string;
  direction: Direction;
  lot: number;
  entry: number;
  exit: number;
  stop?: number;
  pnl: number; // USD, signed
  session: Session;
  strategy: string;
  emotion: Emotion;
  followedPlan: boolean;
  notes?: string;
};

export const STORAGE_KEY = "fx-journal:trades:v1";
export const CAPITAL_KEY = "fx-journal:capital:v1";

/* ---------------- storage ---------------- */

export function loadTrades(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Trade[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrades(trades: Trade[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  window.dispatchEvent(new Event("fx-journal:changed"));
}

export function loadCapital(): number {
  if (typeof window === "undefined") return 10000;
  const raw = window.localStorage.getItem(CAPITAL_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 10000;
}

export function saveCapital(value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CAPITAL_KEY, String(value));
  window.dispatchEvent(new Event("fx-journal:changed"));
}

/* ---------------- helpers ---------------- */

export function riskOf(t: Trade): number | null {
  if (!t.stop || !t.entry) return null;
  const perUnit = Math.abs(t.entry - t.stop);
  if (perUnit <= 0) return null;
  const reward = Math.abs(t.exit - t.entry);
  const ratio = reward / perUnit;
  return t.pnl >= 0 ? ratio : -ratio;
}

export function rMultiple(t: Trade): number {
  const r = riskOf(t);
  if (r !== null) return r;
  // fallback: normalize pnl against average risk assumption of 1% of trade pnl magnitude
  return t.pnl >= 0 ? 1 : -1;
}

export const WEEKDAYS = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
];

export function weekdayOf(date: string): string {
  const d = new Date(date + "T00:00:00");
  return WEEKDAYS[d.getDay()] ?? "—";
}

export function fmtUsd(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtDate(date: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      day: "numeric",
      month: "short",
    }).format(new Date(date + "T00:00:00"));
  } catch {
    return date;
  }
}

/* ---------------- analytics ---------------- */

export type Stats = {
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  netPnl: number;
  avgR: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdownPct: number;
  maxWinStreak: number;
  maxLossStreak: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  planAdherence: number;
};

export function computeStats(trades: Trade[], capital: number): Stats {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  const wins = sorted.filter((t) => t.pnl > 0);
  const losses = sorted.filter((t) => t.pnl < 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = grossProfit - grossLoss;

  let equity = capital;
  let peak = capital;
  let maxDd = 0;
  let ws = 0;
  let ls = 0;
  let maxWs = 0;
  let maxLs = 0;
  for (const t of sorted) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    maxDd = Math.max(maxDd, peak > 0 ? ((peak - equity) / peak) * 100 : 0);
    if (t.pnl >= 0) {
      ws += 1;
      ls = 0;
    } else {
      ls += 1;
      ws = 0;
    }
    maxWs = Math.max(maxWs, ws);
    maxLs = Math.max(maxLs, ls);
  }

  const rs = sorted.map(rMultiple);
  const avgR = rs.length ? rs.reduce((s, r) => s + r, 0) / rs.length : 0;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = sorted.length ? (wins.length / sorted.length) * 100 : 0;

  return {
    count: sorted.length,
    wins: wins.length,
    losses: losses.length,
    winRate,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    netPnl,
    avgR,
    expectancy: (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss,
    avgWin,
    avgLoss,
    maxDrawdownPct: maxDd,
    maxWinStreak: maxWs,
    maxLossStreak: maxLs,
    bestTrade: sorted.reduce<Trade | null>(
      (best, t) => (!best || t.pnl > best.pnl ? t : best),
      null,
    ),
    worstTrade: sorted.reduce<Trade | null>(
      (worst, t) => (!worst || t.pnl < worst.pnl ? t : worst),
      null,
    ),
    planAdherence: sorted.length
      ? (sorted.filter((t) => t.followedPlan).length / sorted.length) * 100
      : 0,
  };
}

export function equityCurve(trades: Trade[], capital: number) {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let equity = capital;
  const points = [{ label: "شروع", equity: capital, index: 0 }];
  sorted.forEach((t, i) => {
    equity += t.pnl;
    points.push({ label: fmtDate(t.date), equity, index: i + 1 });
  });
  return points;
}

export type Bucket = {
  key: string;
  count: number;
  netPnl: number;
  winRate: number;
  avgR: number;
};

export function groupBy(trades: Trade[], selector: (t: Trade) => string): Bucket[] {
  const map = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = selector(t) || "—";
    map.set(k, [...(map.get(k) ?? []), t]);
  }
  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      count: list.length,
      netPnl: list.reduce((s, t) => s + t.pnl, 0),
      winRate: (list.filter((t) => t.pnl > 0).length / list.length) * 100,
      avgR: list.reduce((s, t) => s + rMultiple(t), 0) / list.length,
    }))
    .sort((a, b) => b.netPnl - a.netPnl);
}

export type Insight = {
  kind: "strength" | "weakness" | "tip";
  title: string;
  body: string;
  metric?: string;
};

export function buildInsights(trades: Trade[], capital: number): Insight[] {
  const out: Insight[] = [];
  if (trades.length < 3) return out;
  const s = computeStats(trades, capital);

  // profit factor
  if (s.profitFactor >= 1.5) {
    out.push({
      kind: "strength",
      title: "ضریب سود سالم",
      metric: Number.isFinite(s.profitFactor) ? fmtNum(s.profitFactor) : "∞",
      body: "سود ناخالص شما به‌طور معناداری بیشتر از زیان ناخالص است؛ لبه‌ی آماری استراتژی فعلی مثبت است.",
    });
  } else if (s.profitFactor < 1) {
    out.push({
      kind: "weakness",
      title: "ضریب سود زیر ۱",
      metric: fmtNum(s.profitFactor),
      body: "در مجموع بیشتر از آنچه به دست می‌آورید از دست می‌دهید. تمرکز روی حذف بدترین دسته‌ی معاملات مهم‌تر از افزایش تعداد ترید است.",
    });
  }

  // reward/risk
  if (s.avgWin > 0 && s.avgLoss > 0) {
    const rr = s.avgWin / s.avgLoss;
    if (rr < 1) {
      out.push({
        kind: "weakness",
        title: "سودها کوچک‌تر از ضررها",
        metric: `${fmtNum(rr)} : 1`,
        body: "میانگین برد شما از میانگین باخت کمتر است. احتمالاً زود از معاملات برنده خارج می‌شوید یا حد ضرر را جابه‌جا می‌کنید.",
      });
    } else if (rr >= 1.8) {
      out.push({
        kind: "strength",
        title: "نسبت ریوارد به ریسک قوی",
        metric: `${fmtNum(rr)} : 1`,
        body: "به بردها اجازه‌ی رشد می‌دهید و ضررها را کوتاه نگه می‌دارید — هسته‌ی سودآوری بلندمدت همین است.",
      });
    }
  }

  // win rate
  if (s.winRate >= 55) {
    out.push({
      kind: "strength",
      title: "نرخ برد بالا",
      metric: `${fmtNum(s.winRate, 0)}٪`,
      body: `از ${s.count} معامله، ${s.wins} مورد سودده بوده است. کیفیت نقاط ورود شما قابل اتکاست.`,
    });
  } else if (s.winRate < 35) {
    out.push({
      kind: "weakness",
      title: "نرخ برد پایین",
      metric: `${fmtNum(s.winRate, 0)}٪`,
      body: "اگر نسبت ریوارد به ریسک بالای ۲ ندارید، این نرخ برد در بلندمدت حساب را فرسوده می‌کند. فیلترهای ورود را سخت‌گیرانه‌تر کنید.",
    });
  }

  // drawdown
  if (s.maxDrawdownPct > 20) {
    out.push({
      kind: "weakness",
      title: "افت سرمایه‌ی سنگین",
      metric: `${fmtNum(s.maxDrawdownPct, 1)}٪`,
      body: "بیشترین افت حساب شما از مرز ۲۰٪ عبور کرده است. حجم هر معامله را کاهش دهید و سقف ضرر روزانه تعیین کنید.",
    });
  } else if (s.maxDrawdownPct < 8 && s.count >= 10) {
    out.push({
      kind: "strength",
      title: "کنترل ریسک منظم",
      metric: `${fmtNum(s.maxDrawdownPct, 1)}٪`,
      body: "بیشترین افت حساب کم است؛ حجم‌دهی و مدیریت سرمایه‌ی شما پایدار عمل می‌کند.",
    });
  }

  // loss streak
  if (s.maxLossStreak >= 4) {
    out.push({
      kind: "weakness",
      title: "زنجیره‌ی باخت طولانی",
      metric: `${s.maxLossStreak} معامله`,
      body: "چند باخت پشت‌سرهم معمولاً نشانه‌ی ترید در شرایط نامساعد بازار یا تلاش برای جبران است. پس از دو باخت متوالی توقف کنید.",
    });
  }

  // sessions
  const bySession = groupBy(trades, (t) => t.session).filter((b) => b.count >= 3);
  if (bySession.length >= 2) {
    const best = bySession[0]!;
    const worst = bySession[bySession.length - 1]!;
    if (best.netPnl > 0)
      out.push({
        kind: "strength",
        title: `بهترین سشن: ${best.key}`,
        metric: `${fmtUsd(best.netPnl)}$`,
        body: `در سشن ${best.key} با ${best.count} معامله، نرخ برد ${fmtNum(best.winRate, 0)}٪ و میانگین ${fmtNum(best.avgR)}R داشته‌اید. سهم بیشتری از سرمایه را به این بازه اختصاص دهید.`,
      });
    if (worst.netPnl < 0)
      out.push({
        kind: "weakness",
        title: `ضعیف‌ترین سشن: ${worst.key}`,
        metric: `${fmtUsd(worst.netPnl)}$`,
        body: `سشن ${worst.key} برای شما زیان‌ده بوده است. یک ماه ترید در این بازه را متوقف کنید و نتیجه را بسنجید.`,
      });
  }

  // pairs
  const byPair = groupBy(trades, (t) => t.pair).filter((b) => b.count >= 3);
  if (byPair.length) {
    const bestPair = byPair[0]!;
    const worstPair = byPair[byPair.length - 1]!;
    if (bestPair.netPnl > 0)
      out.push({
        kind: "strength",
        title: `تخصص شما در ${bestPair.key}`,
        metric: `${fmtUsd(bestPair.netPnl)}$`,
        body: `بیشترین سود خالص شما از ${bestPair.key} آمده است (${bestPair.count} معامله، ${fmtNum(bestPair.winRate, 0)}٪ برد).`,
      });
    if (worstPair.netPnl < 0 && worstPair.key !== bestPair.key)
      out.push({
        kind: "weakness",
        title: `${worstPair.key} برایتان زیان‌ده است`,
        metric: `${fmtUsd(worstPair.netPnl)}$`,
        body: `این جفت‌ارز رفتار متفاوتی با سبک شما دارد. حذف آن از واچ‌لیست، سود خالص شما را ${fmtUsd(-worstPair.netPnl)}$ بهبود می‌داد.`,
      });
  }

  // weekday
  const byDay = groupBy(trades, (t) => weekdayOf(t.date)).filter((b) => b.count >= 3);
  if (byDay.length >= 2) {
    const worstDay = byDay[byDay.length - 1]!;
    if (worstDay.netPnl < 0)
      out.push({
        kind: "tip",
        title: `روزهای ${worstDay.key} مراقب باشید`,
        metric: `${fmtUsd(worstDay.netPnl)}$`,
        body: `عملکرد شما در ${worstDay.key} به‌طور مشخص ضعیف‌تر است؛ در این روز حجم را نصف کنید.`,
      });
  }

  // emotions
  const byEmotion = groupBy(trades, (t) => t.emotion).filter((b) => b.count >= 2);
  const badEmotion = byEmotion.find((b) => b.netPnl < 0 && b.key !== "آرام" && b.key !== "مطمئن");
  if (badEmotion)
    out.push({
      kind: "weakness",
      title: `حالت روانی «${badEmotion.key}»`,
      metric: `${fmtUsd(badEmotion.netPnl)}$`,
      body: `معاملاتی که با حس «${badEmotion.key}» باز کرده‌اید در مجموع زیان‌ده بوده‌اند. ثبت این حالت پیش از ورود می‌تواند جلوی بخش بزرگی از ضررها را بگیرد.`,
    });

  // plan adherence
  const planned = trades.filter((t) => t.followedPlan);
  const unplanned = trades.filter((t) => !t.followedPlan);
  if (planned.length >= 3 && unplanned.length >= 3) {
    const p = planned.reduce((s, t) => s + t.pnl, 0);
    const u = unplanned.reduce((s, t) => s + t.pnl, 0);
    if (p > u)
      out.push({
        kind: "tip",
        title: "پایبندی به پلن جواب می‌دهد",
        metric: `${fmtUsd(p - u)}$ اختلاف`,
        body: `معاملات مطابق پلن ${fmtUsd(p)}$ و معاملات خارج از پلن ${fmtUsd(u)}$ نتیجه داده‌اند. بزرگ‌ترین فرصت بهبود شما انضباط است، نه استراتژی جدید.`,
      });
  }

  // strategies
  const byStrategy = groupBy(trades, (t) => t.strategy).filter((b) => b.count >= 3);
  if (byStrategy.length >= 2) {
    const bestS = byStrategy[0]!;
    if (bestS.netPnl > 0)
      out.push({
        kind: "tip",
        title: `استراتژی برتر: ${bestS.key}`,
        metric: `${fmtNum(bestS.avgR)}R میانگین`,
        body: `بیشترین بازده به ازای ریسک از «${bestS.key}» می‌آید. تمرکز روی همین ستاپ سریع‌ترین مسیر رشد شماست.`,
      });
  }

  return out;
}
