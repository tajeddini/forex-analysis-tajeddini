import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TradeForm, type TradeFormSubmitData } from "@/components/TradeForm";
import { useJournal } from "@/hooks/useJournal";
import { computeStats, type Trade } from "@/lib/trades";

export const Route = createFileRoute("/trade/$id")({
  head: () => ({
    meta: [
      { title: "ویرایش معامله | سِجِل" },
      {
        name: "description",
        content: "اصلاح جزئیات یک معامله ثبت‌شده: استراتژی، حالت روانی، پایبندی به پلن و یادداشت.",
      },
      { property: "og:title", content: "ویرایش معامله | سِجِل" },
      {
        property: "og:description",
        content: "جزئیات معامله را اصلاح کنید تا تحلیل عملکرد شما دقیق‌تر شود.",
      },
    ],
  }),
  component: EditTrade,
});

function EditTrade() {
  const { id } = useParams({ from: "/trade/$id" });
  const navigate = useNavigate();
  const { ready, trades, capital, updateTrade, removeTrade } = useJournal();
  const stats = computeStats(trades, capital);
  const trade = trades.find((t) => t.id === id);

  if (!ready) {
    return (
      <AppShell>
        <p className="text-sm text-mute">در حال بارگذاری…</p>
      </AppShell>
    );
  }

  if (!trade) {
    return (
      <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
        <h1 className="text-2xl font-bold">معامله پیدا نشد</h1>
        <button
          onClick={() => navigate({ to: "/trades" })}
          className="mt-4 rounded-md bg-panel2 px-4 py-2 text-sm ring-1 ring-line"
        >
          بازگشت به لیست
        </button>
      </AppShell>
    );
  }

  function handleSubmit(data: TradeFormSubmitData) {
    const patch: Partial<Trade> = { ...data };
    updateTrade(id, patch);
    toast.success("تغییرات ذخیره شد");
    navigate({ to: "/trades" });
  }

  function handleDelete() {
    removeTrade(id);
    toast.success("معامله حذف شد");
    navigate({ to: "/trades" });
  }

  return (
    <AppShell monthPnl={stats.netPnl} tradeCount={stats.count}>
      <div className="mb-6">
        <div className="mb-2 text-[11px] uppercase tracking-[0.25em] text-gold/80">ویرایش</div>
        <h1 className="text-4xl font-extrabold leading-none tracking-tight">
          {trade.pair} · {trade.date}
        </h1>
        <p className="mt-2 text-sm text-mute">
          جزئیات معامله را اصلاح کنید؛ تحلیل‌ها بلافاصله به‌روز می‌شوند.
        </p>
      </div>

      <TradeForm
        key={trade.id}
        mode="edit"
        trade={trade}
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/trades" })}
        onDelete={handleDelete}
      />
    </AppShell>
  );
}
