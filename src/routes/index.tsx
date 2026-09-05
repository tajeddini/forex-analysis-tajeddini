import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سِجِل — ژورنال و تحلیل حرفه‌ای معاملات فارکس" },
      {
        name: "description",
        content:
          "معاملات فارکس خود را ثبت کنید و تحلیل حرفه‌ای از نقاط قوت و ضعف عملکردتان بگیرید؛ همگام روی همه دستگاه‌ها.",
      },
      { property: "og:title", content: "سِجِل — ژورنال و تحلیل حرفه‌ای معاملات فارکس" },
      {
        property: "og:description",
        content:
          "معاملات فارکس خود را ثبت کنید و تحلیل حرفه‌ای از نقاط قوت و ضعف عملکردتان بگیرید؛ همگام روی همه دستگاه‌ها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
      else setChecked(true);
    });
  }, [navigate]);

  if (!checked) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div dir="rtl" lang="fa" className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-gold/15 ring-1 ring-gold/30">
            <span className="text-xl text-gold">◆</span>
          </div>
          <div>
            <div className="text-xl font-semibold leading-none">سِجِل</div>
            <div className="text-[11px] text-mute">دفتر معاملاتی فارکس</div>
          </div>
        </div>

        <h1 className="text-3xl font-semibold leading-snug sm:text-4xl">
          معاملاتت را ثبت کن، نقاط قوت و ضعفت را ببین
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-mute">
          ثبت دستی یا ورود مستقیم گزارش متاتریدر ۵، محاسبه‌ی نرخ برد، ضریب سود، افت سرمایه و تحلیل
          عملکرد بر اساس جفت‌ارز، سشن، استراتژی و حالت روانی. با ساخت حساب کاربری، همه‌ی داده‌هایت
          روی موبایل و کامپیوتر همگام می‌ماند.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-gold/90 px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            ساخت حساب یا ورود
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            { t: "تحلیل حرفه‌ای", d: "ضریب سود، انتظار ریاضی، افت سرمایه و زنجیره‌ی برد و باخت" },
            { t: "ورود از متاتریدر", d: "فایل اکسل گزارش MT5 را بارگذاری کن تا خودکار ثبت شود" },
            { t: "همگام‌سازی امن", d: "داده‌ها در حساب شخصی تو ذخیره می‌شود، روی هر دستگاهی" },
          ].map((f) => (
            <div key={f.t} className="rounded-lg bg-panel p-4 ring-1 ring-line">
              <div className="mb-1 text-sm font-medium text-gold">{f.t}</div>
              <div className="text-[12px] leading-6 text-mute">{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
