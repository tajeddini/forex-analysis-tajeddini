import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useJournal } from "@/hooks/useJournal";
import {
  computeStats,
  fmtDate,
  fmtNum,
  fmtUsd,
  rMultiple,
  SESSIONS,
  weekdayOf,
} from "@/lib/trades";

export const Route = createFileRoute("/trades")({
  head: () => ({
    meta: [
      { title: "لیست معاملات | سِجِل" },
      {
        name: "description",
        content: "همه معاملات ثبت‌شده با فیلتر جفت‌ارز، سشن و نتیجه؛ همراه با R و سود هر معامله.",
      },
      { property: "og:title", content: "لیست معاملات | سِجِل" },
      {
        property: "og:description",
        content: "مرور و فیلتر کامل تاریخچه معاملات فارکس شما.",
      },
    ],
  }),
  component: TradesPage,
});

const chip = "rounded-md bg-panel2 px-2.5 py-1.5 text-[11px] text-foreground ring-1 ring-line";

function TradesPage() {
  const { trades, capital, removeTrade } = useJournal();
  const stats = computeStats(trades, capital);
  const [pair, setPair] = useState("all");
  const [session, setSession] = useState("all");
  const [result, setResult] = useState("all");

  const pairs = useMemo(() => [...new Set(trades.map((t) => t.pair))].sort(), [trades]);

  const filtered = useMemo(
    () =>
      [...trades]
        .filter((t) => (pair === "all" ? true : t.pair === pair))
        .filter((t) => (session === "all" ? true : t.session === session))
        .filter((t) =>
          result === "all" ? true : result === "win" ? t.pnl > 0 : t.pnl <= 0,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [trades, pair, session, result],
  );

  const sum = filtered.reduce((s, t) => s + t.pnl, 0);

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">تاریخچه</div>
          <h1 className="text-4xl font-extrabold leading-none tracking-tight">لیست معاملات</h1>
        </div>
        <Link
          to="/new"
          className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110"
        >
          ثبت معامله جدید
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="text-sm font-semibold">
            {filtered.length} معامله ·{" "}
            <span className={sum >= 0 ? "text-gain" : "text-loss"}>{fmtUsd(sum)}$</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select className={chip} value={pair} onChange={(e) => setPair(e.target.value)}>
              <option value="all">همه‌ی جفت‌ها</option>
              {pairs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select className={chip} value={session} onChange={(e) => setSession(e.target.value)}>
              <option value="all">سشن: همه</option>
              {SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select className={chip} value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="all">نتیجه: همه</option>
              <option value="win">برنده</option>
              <option value="loss">بازنده</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-mute">معامله‌ای با این فیلترها نیست.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] text-mute">
                  <th className="px-5 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-3 py-3 text-right font-medium">روز</th>
                  <th className="px-3 py-3 text-right font-medium">جفت</th>
                  <th className="px-3 py-3 text-right font-medium">جهت</th>
                  <th className="px-3 py-3 text-right font-medium">لوت</th>
                  <th className="px-3 py-3 text-right font-medium">ورود</th>
                  <th className="px-3 py-3 text-right font-medium">خروج</th>
                  <th className="px-3 py-3 text-right font-medium">سشن</th>
                  <th className="px-3 py-3 text-right font-medium">استراتژی</th>
                  <th className="px-3 py-3 text-right font-medium">حس</th>
                  <th className="px-3 py-3 text-right font-medium">R</th>
                  <th className="px-3 py-3 text-right font-medium">سود (USD)</th>
                  <th className="px-5 py-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-line/60 transition-colors last:border-0 hover:bg-panel2/60"
                  >
                    <td className="px-5 py-3 text-mute">{fmtDate(t.date)}</td>
                    <td className="px-3 py-3 text-mute">{weekdayOf(t.date)}</td>
                    <td className="px-3 py-3 font-medium">{t.pair}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] ${
                          t.direction === "buy" ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"
                        }`}
                      >
                        {t.direction === "buy" ? "خرید" : "فروش"}
                      </span>
                    </td>
                    <td className="px-3 py-3">{t.lot}</td>
                    <td className="px-3 py-3">{t.entry}</td>
                    <td className="px-3 py-3">{t.exit}</td>
                    <td className="px-3 py-3 text-mute">{t.session}</td>
                    <td className="px-3 py-3 text-mute">{t.strategy}</td>
                    <td className="px-3 py-3 text-mute">
                      {t.emotion}
                      {t.followedPlan ? "" : " ⚠"}
                    </td>
                    <td className="px-3 py-3">{fmtNum(rMultiple(t), 1)}</td>
                    <td className={`px-3 py-3 font-medium ${t.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                      {fmtUsd(t.pnl)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          removeTrade(t.id);
                          toast.success("معامله حذف شد");
                        }}
                        className="text-[11px] text-mute transition hover:text-loss"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
