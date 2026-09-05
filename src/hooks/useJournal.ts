import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Trade } from "@/lib/trades";

type Row = {
  id: string;
  external_id: string | null;
  date: string;
  pair: string;
  direction: string;
  lot: number | string;
  entry: number | string;
  exit: number | string;
  stop: number | string | null;
  pnl: number | string;
  session: string;
  strategy: string;
  emotion: string;
  followed_plan: boolean;
  notes: string | null;
};

function toTrade(r: Row): Trade {
  return {
    id: r.id,
    ...(r.external_id ? { externalId: r.external_id } : {}),
    date: r.date,
    pair: r.pair,
    direction: r.direction as Trade["direction"],
    lot: Number(r.lot),
    entry: Number(r.entry),
    exit: Number(r.exit),
    ...(r.stop !== null ? { stop: Number(r.stop) } : {}),
    pnl: Number(r.pnl),
    session: r.session as Trade["session"],
    strategy: r.strategy,
    emotion: r.emotion as Trade["emotion"],
    followedPlan: r.followed_plan,
    ...(r.notes ? { notes: r.notes } : {}),
  };
}

function toRow(t: Trade, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    external_id: t.externalId ?? null,
    date: t.date,
    pair: t.pair,
    direction: t.direction,
    lot: t.lot,
    entry: t.entry,
    exit: t.exit,
    stop: t.stop ?? null,
    pnl: t.pnl,
    session: t.session,
    strategy: t.strategy,
    emotion: t.emotion,
    followed_plan: t.followedPlan,
    notes: t.notes ?? null,
  };
}

export function useJournal() {
  const [ready, setReady] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [capital, setCapital] = useState(10000);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setTrades([]);
      setReady(true);
      return;
    }
    const [{ data: rows }, { data: profile }] = await Promise.all([
      supabase.from("trades").select("*").order("date", { ascending: true }),
      supabase.from("profiles").select("capital").eq("id", uid).maybeSingle(),
    ]);
    setTrades(((rows ?? []) as unknown as Row[]).map(toTrade));
    if (profile?.capital != null) setCapital(Number(profile.capital));
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTrade = useCallback(
    async (trade: Trade) => {
      if (!userId) return;
      await supabase.from("trades").insert(toRow(trade, userId) as never);
      await refresh();
    },
    [refresh, userId],
  );

  const addTrades = useCallback(
    async (list: Trade[]) => {
      if (!userId || !list.length) return;
      await supabase.from("trades").insert(list.map((t) => toRow(t, userId)) as never);
      await refresh();
    },
    [refresh, userId],
  );

  const removeTrade = useCallback(
    async (id: string) => {
      await supabase.from("trades").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const updateTrade = useCallback(
    async (id: string, patch: Partial<Trade>) => {
      const current = trades.find((t) => t.id === id);
      if (!current || !userId) return;
      await supabase
        .from("trades")
        .update(toRow({ ...current, ...patch, id }, userId) as never)
        .eq("id", id);
      await refresh();
    },
    [refresh, trades, userId],
  );

  const replaceAll = useCallback(
    async (next: Trade[]) => {
      if (!userId) return;
      await supabase.from("trades").delete().eq("user_id", userId);
      if (next.length) {
        await supabase.from("trades").insert(next.map((t) => toRow(t, userId)) as never);
      }
      await refresh();
    },
    [refresh, userId],
  );

  const updateCapital = useCallback(
    async (value: number) => {
      if (!userId) return;
      setCapital(value);
      await supabase.from("profiles").update({ capital: value } as never).eq("id", userId);
    },
    [userId],
  );

  return {
    ready,
    trades,
    capital,
    addTrade,
    addTrades,
    removeTrade,
    updateTrade,
    replaceAll,
    updateCapital,
  };
}
