-- ============================================================
-- マイ個人 — Recuperação Imediata de Conta de Usuário Gestor
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'ruyhayashihara@gmail.com'; -- Altere para seu e-mail de acesso se necessário
  v_senha TEXT := 'MudeSuaSenha123!';         -- Digite a senha que deseja usar para entrar
  v_nome TEXT := 'Ruy Hayashihara';           -- Seu nome
BEGIN
  -- 1. Insere o usuário de volta no Auth com e-mail já confirmado
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_senha, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('nome', v_nome, 'tipo_perfil', 'gestor'),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    encrypted_password = crypt(v_senha, gen_salt('bf')),
    email_confirmed_at = NOW();

  -- 2. Restaura o perfil correspondente na tabela pública perfil_usuario
  INSERT INTO public.perfil_usuario (
    id,
    nome,
    tipo_perfil,
    moeda,
    ano_fiscal_atual
  ) VALUES (
    v_user_id,
    v_nome,
    'gestor',
    '¥',
    EXTRACT(YEAR FROM NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    tipo_perfil = 'gestor',
    nome = v_nome;

  RAISE NOTICE 'Conta de gestor restaurada com sucesso! E-mail: %, Senha provisória: %', v_email, v_senha;
END $$;
