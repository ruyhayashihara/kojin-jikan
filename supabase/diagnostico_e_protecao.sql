-- ============================================================
-- マイ個人 — 1. DIAGNÓSTICO E PROTEÇÃO IMEDIATA (EXECUTE AGORA)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

-- PASSO 1: CONGELA O AUTOVACUUM IMEDIATAMENTE PARA NÃO APAGAR DADOS DO DISCO
ALTER TABLE IF EXISTS public.registro_diario SET (autovacuum_enabled = false);
ALTER TABLE IF EXISTS public.resumo_mensal SET (autovacuum_enabled = false);
ALTER TABLE IF EXISTS public.despesa SET (autovacuum_enabled = false);
ALTER TABLE IF EXISTS public.perfil_usuario SET (autovacuum_enabled = false);
ALTER TABLE IF EXISTS public.recibo SET (autovacuum_enabled = false);
ALTER TABLE IF EXISTS public.desconto_mensal SET (autovacuum_enabled = false);

-- PASSO 2: VERIFICA QUANTIDADE DE REGISTROS VIVOS E MORTOS (DEAD TUPLES)
SELECT 
    relname AS tabela,
    n_live_tup AS registros_ativos,
    n_dead_tup AS registros_deletados_recuperaveis,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE relname IN ('registro_diario', 'resumo_mensal', 'despesa', 'perfil_usuario', 'recibo', 'desconto_mensal', 'trabalhador')
ORDER BY relname;

-- PASSO 3: VERIFICA SE HÁ REGISTROS ÓRFÃOS AINDA GRAVADOS NO BANCO
SELECT 'registro_diario' AS tabela, count(*) AS total_no_disco FROM public.registro_diario
UNION ALL
SELECT 'resumo_mensal', count(*) FROM public.resumo_mensal
UNION ALL
SELECT 'despesa', count(*) FROM public.despesa
UNION ALL
SELECT 'perfil_usuario', count(*) FROM public.perfil_usuario;
