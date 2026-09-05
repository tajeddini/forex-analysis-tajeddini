import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Strategy } from "@/lib/strategies";

export function useStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("strategies")
      .select("id, name, description")
      .order("created_at", { ascending: true });
    setStrategies(
      (data ?? []).map((s) => ({
        id: s.id as string,
        name: s.name as string,
        ...(s.description ? { description: s.description as string } : {}),
      })),
    );
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addStrategy = useCallback(
    async (name: string, description?: string) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      await supabase
        .from("strategies")
        .insert({ user_id: uid, name, description: description ?? null } as never);
      await refresh();
    },
    [refresh],
  );

  const updateStrategy = useCallback(
    async (id: string, name: string, description?: string) => {
      await supabase
        .from("strategies")
        .update({ name, description: description ?? null } as never)
        .eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const removeStrategy = useCallback(
    async (id: string) => {
      await supabase.from("strategies").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return { strategies, addStrategy, updateStrategy, removeStrategy };
}
