-- ============================================================
-- マイ個人 — Resgate de Dead Tuples (PageInspect)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pageinspect;

-- 1. Verifica quantas páginas físicas existem para cada tabela
SELECT 
    relname AS tabela,
    relpages AS total_paginas_em_disco,
    reltuples AS estimativa_tuplas
FROM pg_class
WHERE relname IN ('resumo_mensal', 'recibo', 'perfil_usuario', 'registro_diario');

-- 2. Inspeciona as tuplas deletadas na tabela resumo_mensal (mostra os IDs e xmax)
SELECT 
    lp AS linha,
    t_xmin AS transacao_criacao,
    t_xmax AS transacao_delecao,
    t_ctid AS posicao_fisica,
    length(t_data) AS bytes_dados
FROM heap_page_items(get_raw_page('resumo_mensal', 0))
WHERE t_data IS NOT NULL;
