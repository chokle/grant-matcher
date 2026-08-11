ALTER TABLE public.funding_programs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS last_verified_at date NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE public.funding_programs
  ADD CONSTRAINT funding_programs_status_check CHECK (status IN ('open','rolling','closed'));

CREATE INDEX IF NOT EXISTS funding_programs_status_idx ON public.funding_programs (status);