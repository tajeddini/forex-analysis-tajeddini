import { read, utils } from "xlsx";
import type { Session, Trade } from "@/lib/trades";

export type ParsedRow = {
  externalId: string;
  date: string;
  time: string;
  pair: string;
  direction: "buy" | "sell";
  lot: number;
  entry: number;
  exit: number;
  stop?: number;
  pnl: number;
  session: Session;
};

const HEADER_KEYS = ["time", "position", "symbol", "type", "volume", "price"];

function norm(v: unknown): string {
  return String(v ?? "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function toNum(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[\s,]/g, "").replace(/[^\d.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/** "2026.08.13 13:49:34" -> { date: "2026-08-13", time: "13:49" } */
function parseDateTime(v: unknown): { date: string; time: string } | null {
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{4})[.\-/](\d{2})[.\-/](\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
}

export function sessionFromHour(hour: number): Session {
  if (hour >= 8 && hour < 16) return "لندن";
  if (hour >= 16 && hour < 22) return "نیویورک";
  if (hour >= 0 && hour < 3) return "سیدنی";
  return "توکیو";
}

export function prettySymbol(raw: string): string {
  const s = raw.trim().toUpperCase();
  const core = s.replace(/[^A-Z]/g, "");
  if (core.length >= 6 && /^[A-Z]{6}$/.test(core.slice(0, 6))) {
    return `${core.slice(0, 3)}/${core.slice(3, 6)}${s.length > core.length ? "" : ""}`;
  }
  return s;
}

/** Parse an MT5 "Trade History Report" xlsx: reads the Positions table. */
export function parseMt5Workbook(buffer: ArrayBuffer): ParsedRow[] {
  const wb = read(buffer, { type: "array" });
  const out: ParsedRow[] = [];

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: true, raw: true });

    let headerIdx = -1;
    for (let i = 0; i < rows.length; i++) {
      const cells = (rows[i] ?? []).map(norm);
      if (HEADER_KEYS.every((k) => cells.includes(k))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) continue;

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const r = rows[i] ?? [];
      const openAt = parseDateTime(r[0]);
      const symbol = String(r[2] ?? "").trim();
      const type = norm(r[3]);
      // section break (e.g. "Orders", "Deals") or non-position row
      if (!openAt || !symbol) {
        if (out.length && !openAt && String(r[0] ?? "").trim()) break;
        continue;
      }
      if (type !== "buy" && type !== "sell") continue;

      const lot = toNum(r[4]) ?? 0;
      const entry = toNum(r[5]) ?? 0;
      const stop = toNum(r[6]);
      const exit = toNum(r[9]) ?? 0;
      const profit = toNum(r[12]) ?? 0;
      const commission = toNum(r[10]) ?? 0;
      const swap = toNum(r[11]) ?? 0;
      const closeAt = parseDateTime(r[8]);
      const hour = Number((openAt.time.split(":")[0] ?? "0"));

      out.push({
        externalId: String(r[1] ?? `${openAt.date}-${symbol}-${i}`).trim(),
        date: closeAt?.date ?? openAt.date,
        time: openAt.time,
        pair: prettySymbol(symbol),
        direction: type,
        lot,
        entry,
        exit,
        ...(stop && stop > 0 ? { stop } : {}),
        pnl: Number((profit + commission + swap).toFixed(2)),
        session: sessionFromHour(hour),
      });
    }
  }

  return out;
}

export function toTrade(row: ParsedRow, strategy: string): Trade {
  return {
    id: crypto.randomUUID(),
    externalId: row.externalId,
    date: row.date,
    pair: row.pair,
    direction: row.direction,
    lot: row.lot,
    entry: row.entry,
    exit: row.exit,
    ...(row.stop !== undefined ? { stop: row.stop } : {}),
    pnl: row.pnl,
    session: row.session,
    strategy,
    emotion: "آرام",
    followedPlan: true,
    notes: `وارد شده از متاتریدر ۵ · ساعت ورود ${row.time}`,
  };
}
