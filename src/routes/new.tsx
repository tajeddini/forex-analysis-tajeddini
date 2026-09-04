import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { useJournal } from "@/hooks/useJournal";
import { computeStats, EMOTIONS, PAIRS, SESSIONS, type Trade } from "@/lib/trades";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "ثبت معامله جدید | سِجِل" },
      {
        name: "description",
        content:
          "ثبت جزئیات هر معامله فارکس: جفت‌ارز، جهت، ورود و خروج، حد ضرر، سشن، استراتژی و حالت روانی.",
      },
      { property: "og:title", content: "ثبت معامله جدید | سِجِل" },
      {
        property: "og:description",
        content: "هر معامله را دقیق ثبت کنید تا تحلیل دقیق‌تری از عملکردتان بگیرید.",
      },
    ],
  }),
  component: NewTrade,
});

const schema = z.object({
  date: z.string().min(1, "تاریخ را وارد کنید"),
  pair: z.string().trim().min(2, "جفت‌ارز را وارد کنید").max(20),
  direction: z.enum(["buy", "sell"]),
  lot: z.number().positive("حجم باید بزرگ‌تر از صفر باشد").max(1000),
  entry: z.number().positive("قیمت ورود نامعتبر است"),
  exit: z.number().positive("قیمت خروج نامعتبر است"),
  stop: z.number().nonnegative().optional(),
  pnl: z.number().finite("سود/زیان را وارد کنید"),
  session: z.string().min(1),
  strategy: z.string().trim().min(2, "نام استراتژی را بنویسید").max(40),
  emotion: z.string().min(1),
  followedPlan: z.boolean(),
  notes: z.string().max(500).optional(),
});

const fieldClass =
  "w-full rounded-md bg-panel2 px-3 py-2 text-sm text-foreground ring-1 ring-line outline-none transition focus:ring-gold";
const labelClass = "mb-1.5 block text-[11px] text-mute";

function NewTrade() {
  const navigate = useNavigate();
  const { addTrade, trades, capital } = useJournal();
  const stats = computeStats(trades, capital);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v === null || v === "" ? undefined : Number(v);
    };
    const parsed = schema.safeParse({
      date: String(fd.get("date") ?? ""),
      pair: String(fd.get("pair") ?? ""),
      direction: String(fd.get("direction") ?? "buy"),
      lot: num("lot"),
      entry: num("entry"),
      exit: num("exit"),
      stop: num("stop"),
      pnl: num("pnl"),
      session: String(fd.get("session") ?? ""),
      strategy: String(fd.get("strategy") ?? ""),
      emotion: String(fd.get("emotion") ?? ""),
      followedPlan: fd.get("followedPlan") === "on",
      notes: String(fd.get("notes") ?? ""),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ورودی نامعتبر است");
      return;
    }

    const trade: Trade = {
      ...(parsed.data as Omit<Trade, "id">),
      id: crypto.randomUUID(),
    };
    addTrade(trade);
    toast.success("معامله ثبت شد");
    navigate({ to: "/trades" });
  }

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">ورود اطلاعات</div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">ثبت معامله</h1>
        <p className="mt-2 text-sm text-mute">
          هرچه دقیق‌تر ثبت کنید، تحلیل نقاط قوت و ضعف شما دقیق‌تر می‌شود.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-lg bg-panel p-5 ring-1 ring-line">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="date">
              تاریخ
            </label>
            <input id="date" name="date" type="date" defaultValue={today} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pair">
              جفت‌ارز
            </label>
            <input
              id="pair"
              name="pair"
              list="pairs"
              defaultValue="EUR/USD"
              className={fieldClass}
              dir="ltr"
            />
            <datalist id="pairs">
              {PAIRS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass} htmlFor="direction">
              جهت
            </label>
            <select id="direction" name="direction" className={fieldClass} defaultValue="buy">
              <option value="buy">خرید</option>
              <option value="sell">فروش</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lot">
              حجم (لوت)
            </label>
            <input
              id="lot"
              name="lot"
              type="number"
              step="0.01"
              defaultValue="0.1"
              className={fieldClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="entry">
              قیمت ورود
            </label>
            <input id="entry" name="entry" type="number" step="any" className={fieldClass} dir="ltr" />
          </div>
          <div>
            <label className={labelClass} htmlFor="exit">
              قیمت خروج
            </label>
            <input id="exit" name="exit" type="number" step="any" className={fieldClass} dir="ltr" />
          </div>
          <div>
            <label className={labelClass} htmlFor="stop">
              حد ضرر (اختیاری — برای محاسبه R)
            </label>
            <input id="stop" name="stop" type="number" step="any" className={fieldClass} dir="ltr" />
          </div>
          <div>
            <label className={labelClass} htmlFor="pnl">
              سود / زیان (دلار)
            </label>
            <input
              id="pnl"
              name="pnl"
              type="number"
              step="any"
              placeholder="مثلاً 250 یا 180-"
              className={fieldClass}
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="session">
              سشن
            </label>
            <select id="session" name="session" className={fieldClass} defaultValue="لندن">
              {SESSIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="strategy">
              استراتژی / ستاپ
            </label>
            {strategies.length > 0 ? (
              <select
                id="strategy"
                name="strategy"
                className={fieldClass}
                defaultValue={strategies[0]?.name}
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <input id="strategy" name="strategy" className={fieldClass} maxLength={40} />
            )}
            <Link to="/strategies" className="mt-1.5 block text-[11px] text-gold/80 hover:text-gold">
              مدیریت استراتژی‌ها
            </Link>
          </div>
          <div>
            <label className={labelClass} htmlFor="emotion">
              حالت روانی هنگام ورود
            </label>
            <select id="emotion" name="emotion" className={fieldClass} defaultValue="آرام">
              {EMOTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2 rounded-md bg-panel2 px-3 py-2.5 text-sm ring-1 ring-line">
              <input name="followedPlan" type="checkbox" defaultChecked className="accent-gold" />
              مطابق پلن معاملاتی بود
            </label>
          </div>
          <div className="sm:col-span-2 xl:col-span-3">
            <label className={labelClass} htmlFor="notes">
              یادداشت
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={500}
              placeholder="دلیل ورود، شرایط بازار، اشتباه احتمالی..."
              className={fieldClass}
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-loss">{error}</p> : null}

        <div className="mt-5 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
          >
            ثبت معامله
          </button>
          <button
            type="reset"
            className="rounded-md bg-panel2 px-5 py-2.5 text-sm text-foreground ring-1 ring-line transition hover:bg-line/40"
          >
            پاک کردن فرم
          </button>
        </div>
      </form>
    </AppShell>
  );
}
