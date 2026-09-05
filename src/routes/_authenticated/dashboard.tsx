import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, StatCard } from "@/components/AppShell";
import { useJournal } from "@/hooks/useJournal";
import { SAMPLE_TRADES } from "@/lib/sample-trades";
import {
  buildInsights,
  computeStats,
  equityCurve,
  fmtDate,
  fmtNum,
  fmtUsd,
  rMultiple,
} from "@/lib/trades";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "داشبورد عملکرد | سِجِل — دفتر معاملاتی فارکس" },
      {
        name: "description",
        content:
          "ثبت معاملات فارکس و تحلیل حرفه‌ای نرخ برد، ضریب سود، میانگین R و افت سرمایه برای شناسایی نقاط قوت و ضعف.",
      },
      { property: "og:title", content: "داشبورد عملکرد | سِجِل" },
      {
        property: "og:description",
        content: "تحلیل کامل معاملات فارکس شما در یک داشبورد فارسی و حرفه‌ای.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { ready, trades, capital, replaceAll } = useJournal();
  const stats = computeStats(trades, capital);
  const curve = equityCurve(trades, capital);
  const insights = buildInsights(trades, capital).slice(0, 3);
  const recent = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">
          داشبورد عملکرد
        </div>
        <h1 className="max-w-[20ch] text-4xl font-extrabold leading-none tracking-tight text-balance sm:text-5xl">
          پایش دقیق تریدها
        </h1>
      </div>

      {ready && trades.length === 0 ? (
        <div className="rounded-lg bg-panel p-8 text-center ring-1 ring-line">
          <div className="text-lg font-semibold">هنوز معامله‌ای ثبت نکرده‌اید</div>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute">
            با ثبت هر معامله، سِجِل به‌صورت خودکار نرخ برد، ضریب سود، میانگین R، افت سرمایه و
            الگوهای رفتاری شما را محاسبه می‌کند.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/new"
              className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110"
            >
              ثبت اولین معامله
            </Link>
            <button
              onClick={() => replaceAll(SAMPLE_TRADES)}
              className="rounded-md bg-panel2 px-4 py-2 text-sm text-foreground ring-1 ring-line transition hover:bg-line/40"
            >
              بارگذاری داده نمونه
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="نرخ برد"
              value={`${fmtNum(stats.winRate, 0)}%`}
              hint={`${stats.wins} برد از ${stats.count}`}
            />
            <StatCard
              label="ضریب سود"
              value={Number.isFinite(stats.profitFactor) ? fmtNum(stats.profitFactor) : "∞"}
              hint="سود ناخالص ÷ زیان"
              tone={stats.profitFactor >= 1 ? "gain" : "loss"}
            />
            <StatCard
              label="میانگین R"
              value={`${stats.avgR >= 0 ? "+" : ""}${fmtNum(stats.avgR, 1)}`}
              hint="به ازای هر ترید"
            />
            <StatCard
              label="بیشترین افت"
              value={`-${fmtNum(stats.maxDrawdownPct, 1)}%`}
              hint={`${stats.maxLossStreak} باخت متوالی`}
              tone="loss"
            />
            <StatCard
              label="سود خالص"
              value={fmtUsd(stats.netPnl)}
              hint={`USD · ${stats.count} ترید`}
              tone={stats.netPnl >= 0 ? "gain" : "loss"}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-lg bg-panel p-5 ring-1 ring-line xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">منحنی سرمایه</div>
                  <div className="text-[11px] text-mute">
                    از {capital.toLocaleString("en-US")} دلار سرمایه‌ی اولیه
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-mute">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-gold" />
                    حساب
                  </span>
                </div>
              </div>
              <div className="h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={curve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--mute)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fill: "var(--mute)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--panel2)",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--foreground)",
                      }}
                      labelStyle={{ color: "var(--mute)" }}
                      formatter={(v: number) => [`$${Math.round(v).toLocaleString("en-US")}`, "سرمایه"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="var(--gold)"
                      strokeWidth={2}
                      fill="url(#eq)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg bg-panel p-5 ring-1 ring-line">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">نقاط قوت و ضعف</div>
                <Link to="/insights" className="text-[11px] text-gold hover:underline">
                  تحلیل کامل
                </Link>
              </div>
              <div className="space-y-3">
                {insights.length === 0 ? (
                  <p className="text-sm leading-relaxed text-mute">
                    برای تولید تحلیل رفتاری حداقل ۳ معامله لازم است.
                  </p>
                ) : (
                  insights.map((ins, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 ring-1 ${
                        ins.kind === "strength"
                          ? "bg-gain/10 ring-gain/20"
                          : ins.kind === "weakness"
                            ? "bg-loss/10 ring-loss/20"
                            : "bg-gold/10 ring-gold/20"
                      }`}
                    >
                      <div
                        className={`mb-1 text-[11px] font-semibold ${
                          ins.kind === "strength"
                            ? "text-gain"
                            : ins.kind === "weakness"
                              ? "text-loss"
                              : "text-gold"
                        }`}
                      >
                        {ins.title}
                      </div>
                      <div className="text-sm leading-relaxed text-pretty text-foreground/90">
                        {ins.body}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-panel ring-1 ring-line">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="text-sm font-semibold">تریدهای اخیر</div>
              <Link to="/trades" className="text-[11px] text-gold hover:underline">
                مشاهده همه
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] text-mute">
                    <th className="px-5 py-3 text-right font-medium">تاریخ</th>
                    <th className="px-3 py-3 text-right font-medium">جفت</th>
                    <th className="px-3 py-3 text-right font-medium">جهت</th>
                    <th className="px-3 py-3 text-right font-medium">لوت</th>
                    <th className="px-3 py-3 text-right font-medium">سود (USD)</th>
                    <th className="px-3 py-3 text-right font-medium">R</th>
                    <th className="px-5 py-3 text-right font-medium">استراتژی</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {recent.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-line/60 transition-colors last:border-0 hover:bg-panel2/60"
                    >
                      <td className="px-5 py-3 text-mute">{fmtDate(t.date)}</td>
                      <td className="px-3 py-3 font-medium">{t.pair}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] ${
                            t.direction === "buy"
                              ? "bg-gain/15 text-gain"
                              : "bg-loss/15 text-loss"
                          }`}
                        >
                          {t.direction === "buy" ? "خرید" : "فروش"}
                        </span>
                      </td>
                      <td className="px-3 py-3">{t.lot}</td>
                      <td className={`px-3 py-3 ${t.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                        {fmtUsd(t.pnl)}
                      </td>
                      <td className="px-3 py-3">{fmtNum(rMultiple(t), 1)}</td>
                      <td className="px-5 py-3 text-mute">{t.strategy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
