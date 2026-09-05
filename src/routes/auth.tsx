import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود و ثبت‌نام — سِجِل" },
      {
        name: "description",
        content: "وارد حساب کاربری سِجِل شوید تا ژورنال معاملاتی شما روی همه دستگاه‌ها همگام بماند.",
      },
      { property: "og:title", content: "ورود و ثبت‌نام — سِجِل" },
      {
        property: "og:description",
        content: "وارد حساب کاربری سِجِل شوید تا ژورنال معاملاتی شما روی همه دستگاه‌ها همگام بماند.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/dashboard", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("ایمیل تأیید برای شما ارسال شد.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطایی رخ داد");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("ورود با گوگل انجام نشد.");
      return;
    }
  }

  const input =
    "w-full rounded-md bg-panel2 px-3 py-2.5 text-sm text-foreground ring-1 ring-line outline-none focus:ring-gold/50";

  return (
    <div dir="rtl" lang="fa" className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl bg-panel p-6 ring-1 ring-line">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md bg-gold/15 ring-1 ring-gold/30">
            <span className="text-lg text-gold">◆</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">سِجِل</h1>
            <div className="text-[11px] text-mute">ژورنال معاملاتی فارکس</div>
          </div>
        </div>

        {sent ? (
          <div className="space-y-3 text-sm text-mute">
            <p className="text-foreground">ایمیل تأیید ارسال شد</p>
            <p>
              لینک ارسال‌شده به {email} را باز کنید تا حساب شما فعال شود و بتوانید وارد شوید.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
              className="text-gold hover:underline"
            >
              بازگشت به ورود
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-md bg-panel2 p-1 text-sm ring-1 ring-line">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded px-3 py-1.5 transition-colors ${
                    mode === m ? "bg-gold/15 text-gold" : "text-mute hover:text-foreground"
                  }`}
                >
                  {m === "signin" ? "ورود" : "ثبت‌نام"}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {mode === "signup" ? (
                <div>
                  <label className="mb-1 block text-[11px] text-mute">نام نمایشی</label>
                  <input
                    className={input}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثلاً محمد"
                  />
                </div>
              ) : null}
              <div>
                <label className="mb-1 block text-[11px] text-mute">ایمیل</label>
                <input
                  className={input}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-mute">رمز عبور</label>
                <input
                  className={input}
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-gold/90 px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {mode === "signin" ? "ورود به حساب" : "ساخت حساب"}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-[11px] text-mute">
              <div className="h-px flex-1 bg-line" />
              یا
              <div className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={onGoogle}
              disabled={busy}
              className="w-full rounded-md bg-panel2 px-4 py-2.5 text-sm text-foreground ring-1 ring-line transition-colors hover:bg-panel2/70 disabled:opacity-50"
            >
              ورود با گوگل
            </button>
          </>
        )}

        <div className="mt-6 text-center text-[11px] text-mute">
          <Link to="/" className="hover:text-foreground">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
