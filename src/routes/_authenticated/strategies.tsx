import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useJournal } from "@/hooks/useJournal";
import { useStrategies } from "@/hooks/useStrategies";
import { computeStats } from "@/lib/trades";

export const Route = createFileRoute("/strategies")({
  head: () => ({
    meta: [
      { title: "مدیریت استراتژی‌ها | سِجِل" },
      {
        name: "description",
        content:
          "افزودن، ویرایش و حذف استراتژی‌های معاملاتی؛ استراتژی‌های ثبت‌شده در فرم ثبت ترید قابل انتخاب هستند.",
      },
      { property: "og:title", content: "مدیریت استراتژی‌ها | سِجِل" },
      {
        property: "og:description",
        content: "کتابخانه‌ی شخصی ستاپ‌ها و استراتژی‌های معاملاتی شما.",
      },
    ],
  }),
  component: StrategiesPage,
});

const fieldClass =
  "w-full rounded-md bg-panel2 px-3 py-2 text-sm text-foreground ring-1 ring-line outline-none transition focus:ring-gold";
const labelClass = "mb-1.5 block text-[11px] text-mute";

function StrategiesPage() {
  const { trades, capital } = useJournal();
  const stats = computeStats(trades, capital);
  const { strategies, addStrategy, updateStrategy, removeStrategy } = useStrategies();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = name.trim();
    if (value.length < 2) {
      toast.error("نام استراتژی حداقل ۲ حرف باشد");
      return;
    }
    if (strategies.some((s) => s.name === value)) {
      toast.error("این استراتژی قبلاً ثبت شده است");
      return;
    }
    addStrategy(value, desc.trim() || undefined);
    setName("");
    setDesc("");
    toast.success("استراتژی اضافه شد");
  }

  function saveEdit(id: string) {
    const value = editName.trim();
    if (value.length < 2) {
      toast.error("نام استراتژی حداقل ۲ حرف باشد");
      return;
    }
    updateStrategy(id, value, editDesc.trim() || undefined);
    setEditingId(null);
    toast.success("استراتژی ویرایش شد");
  }

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">مدیریت</div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">استراتژی‌ها</h1>
        <p className="mt-2 text-sm text-mute">
          استراتژی‌های خود را اینجا بسازید؛ هنگام ثبت ترید از همین فهرست انتخاب می‌شوند.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mb-6 rounded-lg bg-panel p-5 ring-1 ring-line">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="s-name">
              نام استراتژی
            </label>
            <input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="مثلاً شکست سطح"
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="s-desc">
              توضیح (اختیاری)
            </label>
            <input
              id="s-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={140}
              placeholder="شرایط ورود، تایم‌فریم، مدیریت ریسک..."
              className={fieldClass}
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
        >
          افزودن استراتژی
        </button>
      </form>

      <div className="overflow-hidden rounded-lg bg-panel ring-1 ring-line">
        <div className="border-b border-line px-5 py-4 text-sm font-semibold">
          {strategies.length} استراتژی ثبت‌شده
        </div>
        {strategies.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-mute">هنوز استراتژی‌ای اضافه نکرده‌اید.</p>
        ) : (
          <ul>
            {strategies.map((s) => {
              const used = trades.filter((t) => t.strategy === s.name).length;
              return (
                <li key={s.id} className="border-b border-line/60 px-5 py-4 last:border-0">
                  {editingId === s.id ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={40}
                        className={fieldClass}
                      />
                      <input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        maxLength={140}
                        className={`${fieldClass} sm:col-span-2`}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(s.id)}
                          className="rounded-md bg-gold px-4 py-2 text-xs font-semibold text-background"
                        >
                          ذخیره
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-md bg-panel2 px-4 py-2 text-xs text-mute ring-1 ring-line"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="mt-1 text-[11px] text-mute">
                          {s.description ? `${s.description} · ` : ""}
                          {used} ترید با این استراتژی
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            setEditingId(s.id);
                            setEditName(s.name);
                            setEditDesc(s.description ?? "");
                          }}
                          className="rounded border border-line px-2 py-1 text-[11px] text-mute transition hover:border-gold/40 hover:text-gold"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => {
                            removeStrategy(s.id);
                            toast.success("استراتژی حذف شد");
                          }}
                          className="rounded border border-line px-2 py-1 text-[11px] text-mute transition hover:border-loss/40 hover:text-loss"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
