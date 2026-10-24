-- ============================================================
-- マイ個人 — Recuperação Imediata de Conta de Usuário Gestor
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Garante que as colunas de tipo_perfil existam em perfil_usuario
ALTER TABLE public.perfil_usuario ADD COLUMN IF NOT EXISTS tipo_perfil TEXT DEFAULT 'individual';
ALTER TABLE public.perfil_usuario ADD COLUMN IF NOT EXISTS nome_empresa TEXT;
ALTER TABLE public.perfil_usuario ADD COLUMN IF NOT EXISTS telefone_corporativo TEXT;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'ruyhayashihara@gmail.com'; -- Altere para o seu e-mail se necessário
  v_senha TEXT := 'MudeSuaSenha123!';         -- Digite a senha que deseja usar para entrar
  v_nome TEXT := 'Ruy Hayashihara';           -- Seu nome
BEGIN
  -- 1. Verifica se o usuário já existe em auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Se já existe, atualiza a senha e confirma o e-mail
    UPDATE auth.users
    SET
      encrypted_password = crypt(v_senha, gen_salt('bf')),
      email_confirmed_at = NOW(),
      raw_user_meta_data = jsonb_build_object('nome', v_nome, 'tipo_perfil', 'gestor'),
      updated_at = NOW()
    WHERE id = v_user_id;

    RAISE NOTICE 'Usuário existente atualizado com sucesso. ID: %', v_user_id;
  ELSE
    -- Se não existe, gera um novo UUID e insere
    v_user_id := gen_random_uuid();

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
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
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
      NOW(),
      '',
      '',
      '',
      ''
    );

    RAISE NOTICE 'Novo usuário inserido com sucesso. ID: %', v_user_id;
  END IF;

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

  RAISE NOTICE 'Conta de gestor recuperada com sucesso! E-mail: %, Senha: %', v_email, v_senha;
END $$;
