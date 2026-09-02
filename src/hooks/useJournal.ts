import { useCallback, useEffect, useState } from "react";
import {
  loadCapital,
  loadTrades,
  saveCapital,
  saveTrades,
  type Trade,
} from "@/lib/trades";

export function useJournal() {
  const [ready, setReady] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [capital, setCapital] = useState(10000);

  const refresh = useCallback(() => {
    setTrades(loadTrades());
    setCapital(loadCapital());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener("fx-journal:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("fx-journal:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const addTrade = useCallback((trade: Trade) => {
    saveTrades([...loadTrades(), trade]);
  }, []);

  const removeTrade = useCallback((id: string) => {
    saveTrades(loadTrades().filter((t) => t.id !== id));
  }, []);

  const replaceAll = useCallback((next: Trade[]) => {
    saveTrades(next);
  }, []);

  const updateCapital = useCallback((value: number) => {
    saveCapital(value);
  }, []);

  return { ready, trades, capital, addTrade, removeTrade, replaceAll, updateCapital };
}
