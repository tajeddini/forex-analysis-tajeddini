import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, StatCard } from "@/components/AppShell";
import { useJournal } from "@/hooks/useJournal";
import {
  buildInsights,
  computeStats,
  fmtNum,
  fmtUsd,
  groupBy,
  weekdayOf,
  type Bucket,
} from "@/lib/trades";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "تحلیل و بینش | سِجِل" },
      {
        name: "description",
        content:
          "تحلیل حرفه‌ای نقاط قوت و ضعف معاملات: تفکیک بر اساس جفت‌ارز، سشن، روز هفته، استراتژی و حالت روانی.",
      },
      { property: "og:title", content: "تحلیل و بینش | سِجِل" },
      {
        property: "og:description",
        content: "کشف الگوهای سودده و زیان‌ده در معاملات فارکس شما.",
      },
    ],
  }),
  component: InsightsPage,
});

function BreakdownChart({ title, data }: { title: string; data: Bucket[] }) {
  if (!data.length) return null;
  return (
    <div className="rounded-lg bg-panel p-5 ring-1 ring-line">
      <div className="mb-4 text-sm font-semibold">{title}</div>
      <div className="h-56" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="key"
              tick={{ fill: "var(--mute)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--mute)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip
              cursor={{ fill: "var(--panel2)" }}
              contentStyle={{
                background: "var(--panel2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--foreground)",
              }}
              formatter={(v: number) => [`$${Math.round(v).toLocaleString("en-US")}`, "سود خالص"]}
            />
            <Bar dataKey="netPnl" radius={[4, 4, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.key} fill={d.netPnl >= 0 ? "var(--gain)" : "var(--loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-[11px] text-mute">
            <th className="py-2 text-right font-medium">دسته</th>
            <th className="py-2 text-right font-medium">تعداد</th>
            <th className="py-2 text-right font-medium">نرخ برد</th>
            <th className="py-2 text-right font-medium">میانگین R</th>
            <th className="py-2 text-right font-medium">خالص</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.map((d) => (
            <tr key={d.key} className="border-b border-line/50 last:border-0">
              <td className="py-2">{d.key}</td>
              <td className="py-2 text-mute">{d.count}</td>
              <td className="py-2 text-mute">{fmtNum(d.winRate, 0)}٪</td>
              <td className="py-2 text-mute">{fmtNum(d.avgR, 1)}</td>
              <td className={`py-2 ${d.netPnl >= 0 ? "text-gain" : "text-loss"}`}>
                {fmtUsd(d.netPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightsPage() {
  const { trades, capital } = useJournal();
  const stats = computeStats(trades, capital);
  const insights = buildInsights(trades, capital);

  const strengths = insights.filter((i) => i.kind === "strength");
  const weaknesses = insights.filter((i) => i.kind === "weakness");
  const tips = insights.filter((i) => i.kind === "tip");

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">
          گزارش تحلیلی
        </div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">نقاط قوت و ضعف</h1>
        <p className="mt-2 text-sm text-mute">
          بر پایه‌ی {stats.count} معامله‌ی ثبت‌شده در دفتر شما.
        </p>
      </div>

      {trades.length < 3 ? (
        <div className="rounded-lg bg-panel p-8 text-center ring-1 ring-line">
          <div className="text-lg font-semibold">داده کافی نیست</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-mute">
            برای تولید تحلیل معنادار حداقل ۳ معامله لازم است.
          </p>
          <Link
            to="/new"
            className="mt-5 inline-block rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background"
          >
            ثبت معامله
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="انتظار ریاضی هر ترید"
              value={`${fmtUsd(stats.expectancy)}$`}
              hint="میانگین بازده مورد انتظار"
              tone={stats.expectancy >= 0 ? "gain" : "loss"}
            />
            <StatCard
              label="میانگین برد"
              value={`${fmtUsd(stats.avgWin)}$`}
              hint={`${stats.wins} معامله`}
              tone="gain"
            />
            <StatCard
              label="میانگین باخت"
              value={`-${Math.round(stats.avgLoss).toLocaleString("en-US")}`}
              hint={`${stats.losses} معامله`}
              tone="loss"
            />
            <StatCard
              label="بیشترین برد متوالی"
              value={String(stats.maxWinStreak)}
              hint={`بیشترین باخت متوالی: ${stats.maxLossStreak}`}
              tone="gold"
            />
            <StatCard
              label="پایبندی به پلن"
              value={`${fmtNum(stats.planAdherence, 0)}%`}
              hint="معاملات مطابق برنامه"
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg bg-panel p-5 ring-1 ring-line">
              <div className="mb-4 text-sm font-semibold text-gain">نقاط قوت شما</div>
              <div className="space-y-3">
                {strengths.length === 0 ? (
                  <p className="text-sm text-mute">هنوز الگوی قوی پایداری شناسایی نشده است.</p>
                ) : (
                  strengths.map((i, k) => (
                    <div key={k} className="rounded-lg bg-gain/10 p-3 ring-1 ring-gain/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{i.title}</span>
                        <span className="text-[11px] tabular-nums text-gain">{i.metric}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-pretty text-foreground/85">
                        {i.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg bg-panel p-5 ring-1 ring-line">
              <div className="mb-4 text-sm font-semibold text-loss">نقاط ضعف شما</div>
              <div className="space-y-3">
                {weaknesses.length === 0 ? (
                  <p className="text-sm text-mute">ضعف ساختاری مشخصی در داده‌ها دیده نمی‌شود.</p>
                ) : (
                  weaknesses.map((i, k) => (
                    <div key={k} className="rounded-lg bg-loss/10 p-3 ring-1 ring-loss/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{i.title}</span>
                        <span className="text-[11px] tabular-nums text-loss">{i.metric}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-pretty text-foreground/85">
                        {i.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {tips.length > 0 && (
            <div className="mb-6 rounded-lg bg-panel p-5 ring-1 ring-line">
              <div className="mb-4 text-sm font-semibold text-gold">پیشنهادهای بهبود</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tips.map((i, k) => (
                  <div key={k} className="rounded-lg bg-gold/10 p-3 ring-1 ring-gold/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{i.title}</span>
                      <span className="text-[11px] tabular-nums text-gold">{i.metric}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-pretty text-foreground/85">
                      {i.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BreakdownChart title="عملکرد بر اساس جفت‌ارز" data={groupBy(trades, (t) => t.pair)} />
            <BreakdownChart title="عملکرد بر اساس سشن" data={groupBy(trades, (t) => t.session)} />
            <BreakdownChart
              title="عملکرد بر اساس روز هفته"
              data={groupBy(trades, (t) => weekdayOf(t.date))}
            />
            <BreakdownChart
              title="عملکرد بر اساس استراتژی"
              data={groupBy(trades, (t) => t.strategy)}
            />
            <BreakdownChart
              title="عملکرد بر اساس حالت روانی"
              data={groupBy(trades, (t) => t.emotion)}
            />
            <BreakdownChart
              title="پایبندی به پلن"
              data={groupBy(trades, (t) => (t.followedPlan ? "مطابق پلن" : "خارج از پلن"))}
            />
          </div>
        </>
      )}
    </AppShell>
  );
}
