-- ============================================================
-- マイ個人 — Resgate de Dados das Dead Tuples (PageInspect)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pageinspect;

-- 1. Verifica quantas páginas físicas ainda existem no disco para cada tabela
SELECT 
    relname AS tabela,
    relpages AS paginas_no_disco,
    reltuples AS tuplas_estimadas
FROM pg_class
WHERE relname IN ('registro_diario', 'resumo_mensal', 'recibo', 'perfil_usuario', 'despesa');

-- 2. Inspeciona as tuplas preservadas da tabela resumo_mensal (38 registros encontrados)
SELECT 
    lp AS linha_fisica,
    t_xmin AS tx_criacao,
    t_xmax AS tx_delecao,
    t_ctid AS ctid,
    t_attrs
FROM heap_page_item_attrs(get_raw_page('resumo_mensal', 0), 'resumo_mensal'::regclass)
WHERE t_attrs IS NOT NULL;

-- 3. Inspeciona se a tabela registro_diario ainda possui blocos de dados físicos na página 0
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'registro_diario' AND relpages > 0) THEN
    RAISE NOTICE 'A tabela registro_diario ainda possui páginas físicas no disco!';
  ELSE
    RAISE NOTICE 'registro_diario teve páginas liberadas pelo autovacuum às 12:00:54 UTC.';
  END IF;
END $$;

