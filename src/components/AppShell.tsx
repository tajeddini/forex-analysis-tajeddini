import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReactNode } from "react";
import { fmtUsd } from "@/lib/trades";

const NAV = [
  { to: "/dashboard", label: "داشبورد", glyph: "▦" },
  { to: "/new", label: "ثبت ترید", glyph: "＋" },
  { to: "/import", label: "ورود از متاتریدر", glyph: "⭳" },
  { to: "/trades", label: "لیست تریدها", glyph: "≡" },
  { to: "/insights", label: "تحلیل و بینش", glyph: "◍" },
  { to: "/strategies", label: "استراتژی‌ها", glyph: "✦" },
] as const;

export function AppShell({
  children,
  monthPnl = 0,
  tradeCount = 0,
}: {
  children: ReactNode;
  monthPnl?: number;
  tradeCount?: number;
}) {
  const progress = Math.min(100, Math.abs(monthPnl) / 200);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      setName((profile?.display_name as string) || data.user.email || "");
    });
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div dir="rtl" lang="fa" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-gold/15 ring-1 ring-gold/30">
              <span className="text-lg text-gold">◆</span>
            </div>
            <div>
              <div className="text-lg font-semibold leading-none tracking-tight">سِجِل</div>
              <div className="text-[11px] tracking-wide text-mute">دفتر معاملاتی فارکس</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-mute sm:block">
              {tradeCount} معامله ثبت‌شده
            </span>
            <div className="h-px w-8 bg-line" />
            {name ? (
              <span className="max-w-[9rem] truncate text-[11px] text-foreground">{name}</span>
            ) : null}
            <button
              onClick={handleSignOut}
              className="rounded-md px-2.5 py-1.5 text-[11px] text-mute ring-1 ring-line transition-colors hover:text-foreground"
            >
              خروج
            </button>
          </div>
        </header>

        <div className="flex gap-6">
          <aside className="hidden w-52 shrink-0 lg:block">
            <nav className="space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-mute transition-colors hover:bg-panel hover:text-foreground"
                  activeProps={{
                    className:
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm bg-gold/10 text-gold ring-1 ring-gold/20",
                  }}
                >
                  <span className="grid size-4 place-items-center text-xs">{item.glyph}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 rounded-lg bg-panel p-4 ring-1 ring-line">
              <div className="mb-3 text-[11px] text-mute">سود/زیان کل</div>
              <div className="flex items-end justify-between">
                <span
                  className={`text-2xl font-semibold tabular-nums ${monthPnl >= 0 ? "text-gain" : "text-loss"}`}
                >
                  {fmtUsd(monthPnl)}
                </span>
                <span className="text-[11px] text-mute">USD</span>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full ${monthPnl >= 0 ? "bg-gain/70" : "bg-loss/70"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 pb-16">{children}</main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-panel/95 px-2 py-2 backdrop-blur lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              
              className="rounded-md px-3 py-1.5 text-[11px] text-mute"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-[11px] text-gold bg-gold/10" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "gain" | "loss" | "gold";
}) {
  const toneClass =
    tone === "gain"
      ? "text-gain"
      : tone === "loss"
        ? "text-loss"
        : tone === "gold"
          ? "text-gold"
          : "text-foreground";
  return (
    <div className="rounded-lg bg-panel p-4 ring-1 ring-line">
      <div className="mb-1 text-[11px] text-mute">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-mute">{hint}</div> : null}
    </div>
  );
}
