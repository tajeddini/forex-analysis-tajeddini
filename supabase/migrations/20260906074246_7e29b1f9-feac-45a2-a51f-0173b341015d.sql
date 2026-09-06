CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  capital numeric NOT NULL DEFAULT 10000,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own accounts" ON public.accounts FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.trades ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE;

INSERT INTO public.accounts (user_id, name, capital)
SELECT p.id, 'حساب اصلی', COALESCE(p.capital, 10000) FROM public.profiles p;

UPDATE public.trades t
SET account_id = a.id
FROM public.accounts a
WHERE a.user_id = t.user_id AND t.account_id IS NULL;

CREATE INDEX trades_account_id_idx ON public.trades(account_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.accounts (user_id, name, capital)
  VALUES (NEW.id, 'حساب اصلی', 10000);
  INSERT INTO public.strategies (user_id, name, description)
  VALUES (NEW.id, 'شکست سطح', 'ورود پس از شکست سطح کلیدی'),
         (NEW.id, 'پولبک', 'ورود در بازگشت به سطح شکسته‌شده');
  RETURN NEW;
END; $function$;