import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useJournal } from "@/hooks/useJournal";
import { parseMt5Workbook, toTrade, type ParsedRow } from "@/lib/mt5-import";
import { computeStats, fmtDate, fmtNum, fmtUsd } from "@/lib/trades";

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "ورود معاملات از متاتریدر ۵ | سِجِل" },
      {
        name: "description",
        content:
          "فایل اکسل گزارش تاریخچه متاتریدر ۵ را آپلود کنید تا همه‌ی پوزیشن‌ها با سود، حد ضرر و سشن به ژورنال اضافه شوند.",
      },
      { property: "og:title", content: "ورود معاملات از متاتریدر ۵ | سِجِل" },
      {
        property: "og:description",
        content: "آپلود خروجی اکسل متاتریدر ۵ و افزودن خودکار معاملات به دفتر معاملاتی.",
      },
    ],
  }),
  component: ImportPage,
});

const fieldClass =
  "w-full rounded-md bg-panel2 px-3 py-2 text-sm text-foreground ring-1 ring-line outline-none transition focus:ring-gold";

function ImportPage() {
  const navigate = useNavigate();
  const { trades, capital, addTrades } = useJournal();
  const stats = computeStats(trades, capital);
  const inputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [strategy, setStrategy] = useState("متاتریدر ۵");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = new Set(trades.map((t) => t.externalId).filter(Boolean) as string[]);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const parsed = parseMt5Workbook(await file.arrayBuffer());
      if (parsed.length === 0) {
        setRows([]);
        setError("در این فایل جدول Positions پیدا نشد. گزارش «History» متاتریدر ۵ را در قالب XLSX ذخیره کنید.");
        return;
      }
      setRows(parsed);
      setFileName(file.name);
      setSelected(
        Object.fromEntries(parsed.map((r) => [r.externalId, !existing.has(r.externalId)])),
      );
    } catch {
      setError("خواندن فایل ممکن نشد. مطمئن شوید فایل xlsx سالم است.");
    } finally {
      setBusy(false);
    }
  }

  const chosen = rows.filter((r) => selected[r.externalId]);
  const sum = chosen.reduce((s, r) => s + r.pnl, 0);

  function confirmImport() {
    if (chosen.length === 0) return;
    addTrades(chosen.map((r) => toTrade(r, strategy.trim() || "متاتریدر ۵")));
    toast.success(`${chosen.length} معامله وارد شد`);
    navigate({ to: "/trades" });
  }

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">ورود گروهی</div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">
          ورود از متاتریدر ۵
        </h1>
        <p className="mt-2 text-sm text-mute">
          در متاتریدر ۵ به تب History بروید، راست‌کلیک کنید و «Report → XLSX» بگیرید. سپس همان فایل
          را اینجا آپلود کنید؛ جفت‌ارز، جهت، حجم، ورود، خروج، حد ضرر و سود خالص (شامل کمیسیون و
          سواپ) خودکار خوانده می‌شود.
        </p>
      </div>

      <div className="rounded-lg bg-panel p-5 ring-1 ring-line">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[11px] text-mute" htmlFor="file">
              فایل اکسل گزارش
            </label>
            <input
              id="file"
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className={`${fieldClass} file:ml-3 file:rounded file:border-0 file:bg-gold file:px-3 file:py-1 file:text-background`}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] text-mute" htmlFor="strategy">
              برچسب استراتژی برای این دسته
            </label>
            <input
              id="strategy"
              value={strategy}
              maxLength={40}
              onChange={(e) => setStrategy(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        {busy ? <p className="mt-4 text-sm text-mute">در حال خواندن فایل…</p> : null}
        {error ? <p className="mt-4 text-sm text-loss">{error}</p> : null}
        {fileName && rows.length > 0 ? (
          <p className="mt-4 text-sm text-mute">
            «{fileName}» — {rows.length} پوزیشن پیدا شد.
          </p>
        ) : null}
      </div>

      {rows.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg bg-panel ring-1 ring-line">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="text-sm font-semibold">
              {chosen.length} انتخاب‌شده ·{" "}
              <span className={sum >= 0 ? "text-gain" : "text-loss"}>{fmtUsd(sum)}$</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelected(Object.fromEntries(rows.map((r) => [r.externalId, true])))
                }
                className="rounded-md bg-panel2 px-3 py-1.5 text-[11px] ring-1 ring-line"
              >
                انتخاب همه
              </button>
              <button
                onClick={() => setSelected({})}
                className="rounded-md bg-panel2 px-3 py-1.5 text-[11px] ring-1 ring-line"
              >
                لغو انتخاب
              </button>
              <button
                onClick={confirmImport}
                disabled={chosen.length === 0}
                className="rounded-md bg-gold px-4 py-1.5 text-[11px] font-semibold text-background transition hover:brightness-110 disabled:opacity-40"
              >
                افزودن به ژورنال
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] text-mute">
                  <th className="px-5 py-3 text-right font-medium">✓</th>
                  <th className="px-3 py-3 text-right font-medium">تاریخ</th>
                  <th className="px-3 py-3 text-right font-medium">ساعت</th>
                  <th className="px-3 py-3 text-right font-medium">جفت</th>
                  <th className="px-3 py-3 text-right font-medium">جهت</th>
                  <th className="px-3 py-3 text-right font-medium">لوت</th>
                  <th className="px-3 py-3 text-right font-medium">ورود</th>
                  <th className="px-3 py-3 text-right font-medium">خروج</th>
                  <th className="px-3 py-3 text-right font-medium">حد ضرر</th>
                  <th className="px-3 py-3 text-right font-medium">سشن</th>
                  <th className="px-5 py-3 text-right font-medium">سود خالص</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map((r) => {
                  const dup = existing.has(r.externalId);
                  return (
                    <tr
                      key={r.externalId}
                      className="border-b border-line/60 last:border-0 hover:bg-panel2/60"
                    >
                      <td className="px-5 py-2.5">
                        <input
                          type="checkbox"
                          className="accent-gold"
                          checked={!!selected[r.externalId]}
                          onChange={(e) =>
                            setSelected((s) => ({ ...s, [r.externalId]: e.target.checked }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2.5 text-mute">
                        {fmtDate(r.date)}
                        {dup ? <span className="mr-2 text-[10px] text-gold">تکراری</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-mute" dir="ltr">
                        {r.time}
                      </td>
                      <td className="px-3 py-2.5 font-medium">{r.pair}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] ${
                            r.direction === "buy" ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"
                          }`}
                        >
                          {r.direction === "buy" ? "خرید" : "فروش"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{r.lot}</td>
                      <td className="px-3 py-2.5">{r.entry}</td>
                      <td className="px-3 py-2.5">{r.exit}</td>
                      <td className="px-3 py-2.5 text-mute">{r.stop ?? "—"}</td>
                      <td className="px-3 py-2.5 text-mute">{r.session}</td>
                      <td
                        className={`px-5 py-2.5 font-medium ${r.pnl >= 0 ? "text-gain" : "text-loss"}`}
                      >
                        {fmtNum(r.pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
