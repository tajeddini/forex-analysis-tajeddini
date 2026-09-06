import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccounts } from "@/hooks/useAccounts";
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

function toRow(t: Trade, userId: string, accountId: string) {
  return {
    id: t.id,
    user_id: userId,
    account_id: accountId,
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
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedId: accountId, selected, accountsReady, updateAccount } = useAccounts();
  const capital = selected?.capital ?? 10000;

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid || !accountId) {
      setTrades([]);
      setReady(accountsReady);
      return;
    }
    const { data: rows } = await supabase
      .from("trades")
      .select("*")
      .eq("account_id", accountId)
      .order("date", { ascending: true });
    setTrades(((rows ?? []) as unknown as Row[]).map(toTrade));
    setReady(true);
  }, [accountId, accountsReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addTrade = useCallback(
    async (trade: Trade) => {
      if (!userId || !accountId) return;
      await supabase.from("trades").insert(toRow(trade, userId, accountId) as never);
      await refresh();
    },
    [accountId, refresh, userId],
  );

  const addTrades = useCallback(
    async (list: Trade[]) => {
      if (!userId || !accountId || !list.length) return;
      await supabase.from("trades").insert(list.map((t) => toRow(t, userId, accountId)) as never);
      await refresh();
    },
    [accountId, refresh, userId],
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
      if (!current || !userId || !accountId) return;
      await supabase
        .from("trades")
        .update(toRow({ ...current, ...patch, id }, userId, accountId) as never)
        .eq("id", id);
      await refresh();
    },
    [accountId, refresh, trades, userId],
  );

  const replaceAll = useCallback(
    async (next: Trade[]) => {
      if (!userId || !accountId) return;
      await supabase.from("trades").delete().eq("account_id", accountId);
      if (next.length) {
        await supabase.from("trades").insert(next.map((t) => toRow(t, userId, accountId)) as never);
      }
      await refresh();
    },
    [accountId, refresh, userId],
  );

  const updateCapital = useCallback(
    async (value: number) => {
      if (!selected) return;
      await updateAccount(selected.id, selected.name, value, selected.note);
      await refresh();
    },
    [refresh, selected, updateAccount],
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
