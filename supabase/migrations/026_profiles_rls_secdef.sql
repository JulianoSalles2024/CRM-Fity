-- Permite que funções SECURITY DEFINER (postgres) leiam profiles sem RLS
-- Necessário para resolve_or_create_lead buscar o owner padrão da empresa

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: postgres (SECURITY DEFINER functions) pode ler todos os profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'postgres_secdef_read'
  ) THEN
    EXECUTE 'CREATE POLICY postgres_secdef_read ON profiles FOR SELECT TO postgres USING (true)';
  END IF;
END $$;
