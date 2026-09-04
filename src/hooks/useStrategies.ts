import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STRATEGIES,
  loadStrategies,
  saveStrategies,
  type Strategy,
} from "@/lib/strategies";

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>(DEFAULT_STRATEGIES);

  const refresh = useCallback(() => setStrategies(loadStrategies()), []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("fx-journal:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("fx-journal:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const addStrategy = useCallback((name: string, description?: string) => {
    const list = loadStrategies();
    const item: Strategy = {
      id: crypto.randomUUID(),
      name,
      ...(description ? { description } : {}),
    };
    saveStrategies([...list, item]);
  }, []);

  const updateStrategy = useCallback((id: string, name: string, description?: string) => {
    saveStrategies(
      loadStrategies().map((s) =>
        s.id === id ? { id, name, ...(description ? { description } : {}) } : s,
      ),
    );
  }, []);

  const removeStrategy = useCallback((id: string) => {
    saveStrategies(loadStrategies().filter((s) => s.id !== id));
  }, []);

  return { strategies, addStrategy, updateStrategy, removeStrategy };
}
