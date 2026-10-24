-- ============================================================
-- マイ個人 — Limpeza Definitiva de Todas as Contas de Teste
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Exclui todos os usuários de teste registrados em auth.users
DELETE FROM auth.users;

-- 2. Limpa dados operacionais de todas as tabelas públicas
DELETE FROM public.perfil_usuario;
DELETE FROM public.registro_diario;
DELETE FROM public.resumo_mensal;
DELETE FROM public.despesa;
DELETE FROM public.recibo;
DELETE FROM public.desconto_mensal;

-- 3. Limpa trabalhadores se a tabela existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trabalhador') THEN
    DELETE FROM public.trabalhador;
  END IF;
END $$;
