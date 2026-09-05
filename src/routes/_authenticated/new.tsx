import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { TradeForm, type TradeFormSubmitData } from "@/components/TradeForm";
import { useJournal } from "@/hooks/useJournal";
import { computeStats, type Trade } from "@/lib/trades";

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

function NewTrade() {
  const navigate = useNavigate();
  const { addTrade, trades, capital } = useJournal();
  const stats = computeStats(trades, capital);

  function handleSubmit(data: TradeFormSubmitData) {
    const trade: Trade = {
      ...data,
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

      <TradeForm
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/trades" })}
      />
    </AppShell>
  );
}
