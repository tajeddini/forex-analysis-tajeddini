import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Account = {
  id: string;
  name: string;
  capital: number;
  note?: string;
};

const SELECTED_KEY = "fx-journal:account:v1";

// tiny shared store so every page/hook sees the same account list + selection
let accountsCache: Account[] = [];
let selectedId: string | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function readStoredSelection(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELECTED_KEY);
}

export function setSelectedAccount(id: string) {
  selectedId = id;
  if (typeof window !== "undefined") window.localStorage.setItem(SELECTED_KEY, id);
  emit();
}

export async function loadAccounts() {
  const { data } = await supabase
    .from("accounts")
    .select("id, name, capital, note")
    .order("created_at", { ascending: true });
  accountsCache = (data ?? []).map((a) => ({
    id: a.id as string,
    name: a.name as string,
    capital: Number(a.capital),
    ...(a.note ? { note: a.note as string } : {}),
  }));
  loaded = true;
  const stored = selectedId ?? readStoredSelection();
  const valid = accountsCache.some((a) => a.id === stored);
  selectedId = valid ? stored : (accountsCache[0]?.id ?? null);
  if (selectedId && typeof window !== "undefined")
    window.localStorage.setItem(SELECTED_KEY, selectedId);
  emit();
  return accountsCache;
}

export function useAccounts() {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    if (!loaded) void loadAccounts();
    return () => {
      listeners.delete(l);
    };
  }, []);

  const addAccount = useCallback(async (name: string, capital: number, note?: string) => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("accounts")
      .insert({ user_id: uid, name, capital, note: note ?? null } as never)
      .select("id")
      .maybeSingle();
    await loadAccounts();
    const newId = (data as { id?: string } | null)?.id;
    if (newId) setSelectedAccount(newId);
  }, []);

  const updateAccount = useCallback(
    async (id: string, name: string, capital: number, note?: string) => {
      await supabase
        .from("accounts")
        .update({ name, capital, note: note ?? null } as never)
        .eq("id", id);
      await loadAccounts();
    },
    [],
  );

  const removeAccount = useCallback(async (id: string) => {
    await supabase.from("accounts").delete().eq("id", id);
    if (selectedId === id) selectedId = null;
    await loadAccounts();
  }, []);

  return {
    accounts: accountsCache,
    accountsReady: loaded,
    selectedId,
    selectAccount: setSelectedAccount,
    selected: accountsCache.find((a) => a.id === selectedId) ?? null,
    addAccount,
    updateAccount,
    removeAccount,
  };
}
