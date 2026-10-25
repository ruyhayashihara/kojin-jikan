-- ============================================================
-- マイ個人 — Restaurar UUID Original do Usuário (9e3119e8-...)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================================

DO $$
DECLARE
  v_old_uuid UUID := '9e3119e8-a0f9-4536-af47-c09d37553c53'; -- Seu UUID original recuperado do cache
  v_email TEXT := 'ruyhayashihara@gmail.com';
  v_current_id UUID;
BEGIN
  -- Verifica se existe um usuário com esse e-mail
  SELECT id INTO v_current_id FROM auth.users WHERE email = v_email;

  IF v_current_id IS NOT NULL AND v_current_id != v_old_uuid THEN
    -- Desvincula perfil temporário
    DELETE FROM public.perfil_usuario WHERE id = v_current_id;
    -- Remove usuário com UUID incorreto
    DELETE FROM auth.users WHERE id = v_current_id;
  END IF;

  -- Insere ou garante o usuário com o UUID EXATO original
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_old_uuid) THEN
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
      v_old_uuid,
      'authenticated',
      'authenticated',
      v_email,
      crypt('MudeSuaSenha123!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome', 'Ruy Hayashihara', 'tipo_perfil', 'gestor'),
      '2026-03-30 12:20:23+00'::timestamptz,
      NOW()
    );
    RAISE NOTICE 'Usuário restaurado com o UUID ORIGINAL: %', v_old_uuid;
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('MudeSuaSenha123!', gen_salt('bf')),
        email_confirmed_at = NOW()
    WHERE id = v_old_uuid;
    RAISE NOTICE 'Usuário com UUID ORIGINAL atualizado: %', v_old_uuid;
  END IF;

  -- Garante perfil com o UUID original
  INSERT INTO public.perfil_usuario (
    id,
    nome,
    tipo_perfil,
    moeda,
    ano_fiscal_atual
  ) VALUES (
    v_old_uuid,
    'Ruy Hayashihara',
    'gestor',
    '¥',
    EXTRACT(YEAR FROM NOW())
  )
  ON CONFLICT (id) DO UPDATE SET
    tipo_perfil = 'gestor',
    nome = 'Ruy Hayashihara';

  RAISE NOTICE 'SUCESSO: Conta vinculada de volta ao seu UUID histórico!';
END $$;
