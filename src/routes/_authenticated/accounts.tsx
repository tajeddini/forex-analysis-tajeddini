import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAccounts } from "@/hooks/useAccounts";
import { useJournal } from "@/hooks/useJournal";
import { computeStats, fmtNum, fmtUsd } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "حساب‌های معاملاتی | سِجِل" },
      {
        name: "description",
        content:
          "ساخت و مدیریت چند حساب معاملاتی با سرمایه‌ی جداگانه و تحلیل مستقل عملکرد هر حساب.",
      },
      { property: "og:title", content: "حساب‌های معاملاتی | سِجِل" },
      {
        property: "og:description",
        content: "هر حساب سرمایه، معاملات و تحلیل مستقل خودش را دارد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountsPage,
});

const fieldClass =
  "w-full rounded-md bg-panel2 px-3 py-2 text-sm text-foreground ring-1 ring-line outline-none transition focus:ring-gold";
const labelClass = "mb-1.5 block text-[11px] text-mute";

function AccountsPage() {
  const { accounts, selectedId, selectAccount, addAccount, updateAccount, removeAccount } =
    useAccounts();
  const { trades, capital } = useJournal();
  const stats = computeStats(trades, capital);

  const [name, setName] = useState("");
  const [cap, setCap] = useState("10000");
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eCap, setECap] = useState("");
  const [eNote, setENote] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = name.trim();
    const capValue = Number(cap);
    if (value.length < 2) {
      toast.error("نام حساب حداقل ۲ حرف باشد");
      return;
    }
    if (!Number.isFinite(capValue) || capValue <= 0) {
      toast.error("سرمایه را درست وارد کنید");
      return;
    }
    if (accounts.some((a) => a.name === value)) {
      toast.error("این نام قبلاً ثبت شده است");
      return;
    }
    void addAccount(value, capValue, note.trim() || undefined);
    setName("");
    setCap("10000");
    setNote("");
    toast.success("حساب اضافه شد و انتخاب شد");
  }

  function saveEdit(id: string) {
    const value = eName.trim();
    const capValue = Number(eCap);
    if (value.length < 2 || !Number.isFinite(capValue) || capValue <= 0) {
      toast.error("نام یا سرمایه معتبر نیست");
      return;
    }
    void updateAccount(id, value, capValue, eNote.trim() || undefined);
    setEditingId(null);
    toast.success("حساب ویرایش شد");
  }

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">مدیریت</div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">حساب‌های معاملاتی</h1>
        <p className="mt-2 text-sm text-mute">
          برای هر حساب سرمایه‌ی جداگانه تعیین کنید؛ معاملات، آمار و تحلیل هر حساب کاملاً مستقل
          محاسبه می‌شود.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <form onSubmit={onSubmit} className="h-fit rounded-lg bg-panel p-4 ring-1 ring-line">
          <div className="mb-3 text-sm font-semibold">حساب جدید</div>
          <div className="mb-3">
            <label className={labelClass}>نام حساب</label>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً حساب فاندد ۱۰۰K"
            />
          </div>
          <div className="mb-3">
            <label className={labelClass}>سرمایه‌ی اولیه (دلار)</label>
            <input
              className={fieldClass}
              inputMode="decimal"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className={labelClass}>توضیح (اختیاری)</label>
            <input
              className={fieldClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="بروکر، نوع حساب…"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110"
          >
            افزودن حساب
          </button>
        </form>

        <div className="space-y-3">
          {accounts.map((a) => {
            const active = a.id === selectedId;
            return (
              <div
                key={a.id}
                className={`rounded-lg bg-panel p-4 ring-1 ${active ? "ring-gold/40" : "ring-line"}`}
              >
                {editingId === a.id ? (
                  <div className="space-y-3">
                    <input
                      className={fieldClass}
                      value={eName}
                      onChange={(e) => setEName(e.target.value)}
                    />
                    <input
                      className={fieldClass}
                      inputMode="decimal"
                      value={eCap}
                      onChange={(e) => setECap(e.target.value)}
                    />
                    <input
                      className={fieldClass}
                      value={eNote}
                      onChange={(e) => setENote(e.target.value)}
                      placeholder="توضیح"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => saveEdit(a.id)}
                        className="rounded-md bg-gold px-4 py-1.5 text-xs font-semibold text-background"
                      >
                        ذخیره
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-md px-4 py-1.5 text-xs text-mute ring-1 ring-line"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{a.name}</span>
                        {active ? (
                          <span className="rounded bg-gold/15 px-2 py-0.5 text-[10px] text-gold">
                            فعال
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-[11px] text-mute">
                        سرمایه: {fmtNum(a.capital, 0)} دلار{a.note ? ` · ${a.note}` : ""}
                      </div>
                      {active ? (
                        <div className="mt-1 text-[11px] text-mute">
                          {stats.count} معامله · {fmtUsd(stats.netPnl)} · نرخ برد{" "}
                          {fmtNum(stats.winRate, 0)}٪ · پایبندی {fmtNum(stats.planAdherence, 0)}٪
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-4">
                      {!active ? (
                        <button
                          onClick={() => selectAccount(a.id)}
                          className="rounded-md bg-panel2 px-3 py-1.5 text-xs text-foreground ring-1 ring-line"
                        >
                          انتخاب
                        </button>
                      ) : null}
                      <button
                        onClick={() => {
                          setEditingId(a.id);
                          setEName(a.name);
                          setECap(String(a.capital));
                          setENote(a.note ?? "");
                        }}
                        className="rounded-md px-3 py-1.5 text-xs text-mute ring-1 ring-line transition hover:text-foreground"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => {
                          if (accounts.length === 1) {
                            toast.error("حداقل یک حساب باید باقی بماند");
                            return;
                          }
                          void removeAccount(a.id);
                          toast.success("حساب و معاملات آن حذف شد");
                        }}
                        className="rounded-md px-3 py-1.5 text-xs text-loss ring-1 ring-loss/30 transition hover:bg-loss/10"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {accounts.length === 0 ? (
            <div className="rounded-lg bg-panel p-6 text-center text-sm text-mute ring-1 ring-line">
              هنوز حسابی ندارید. از فرم کنار، اولین حساب را بسازید.
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
