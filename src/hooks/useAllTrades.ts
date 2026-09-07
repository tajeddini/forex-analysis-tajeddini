import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/trades";

type Row = Record<string, unknown>;

function toTrade(r: Row): Trade {
  return {
    id: String(r["id"]),
    ...(r["external_id"] ? { externalId: String(r["external_id"]) } : {}),
    date: String(r["date"]),
    pair: String(r["pair"]),
    direction: r["direction"] as Trade["direction"],
    lot: Number(r["lot"]),
    entry: Number(r["entry"]),
    exit: Number(r["exit"]),
    ...(r["stop"] !== null && r["stop"] !== undefined ? { stop: Number(r["stop"]) } : {}),
    pnl: Number(r["pnl"]),
    session: r["session"] as Trade["session"],
    strategy: String(r["strategy"]),
    emotion: r["emotion"] as Trade["emotion"],
    followedPlan: Boolean(r["followed_plan"]),
    ...(r["notes"] ? { notes: String(r["notes"]) } : {}),
  };
}

export type AccountSlice = {
  id: string;
  name: string;
  capital: number;
  trades: Trade[];
};

/** همه‌ی معاملات کاربر در تمام حساب‌ها (برای تحلیل تجمیعی) */
export function useAllTrades() {
  const [ready, setReady] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [capital, setCapital] = useState(0);
  const [accounts, setAccounts] = useState<AccountSlice[]>([]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [{ data: accs }, { data: rows }] = await Promise.all([
        supabase.from("accounts").select("id, name, capital").order("created_at"),
        supabase.from("trades").select("*").order("date", { ascending: true }),
      ]);
      if (!alive) return;
      const all = ((rows ?? []) as Row[]).map(toTrade);
      const list = (accs ?? []).map((a) => {
        const id = a.id as string;
        return {
          id,
          name: a.name as string,
          capital: Number(a.capital),
          trades: ((rows ?? []) as Row[]).filter((r) => r["account_id"] === id).map(toTrade),
        };
      });
      setTrades(all);
      setAccounts(list);
      setCapital(list.reduce((s, a) => s + a.capital, 0));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { ready, trades, capital, accounts };
}
