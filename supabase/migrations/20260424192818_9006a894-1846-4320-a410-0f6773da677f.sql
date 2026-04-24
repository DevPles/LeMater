ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cpf TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_unique_idx
ON public.profiles (cpf)
WHERE cpf IS NOT NULL;