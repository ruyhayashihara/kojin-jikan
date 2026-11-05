-- ==============================================================================
-- CRIAÇÃO DA TABELA TRABALHADOR & POLÍTICAS RLS NO SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.trabalhador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gestor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo_trabalhador TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Identificação Pessoal (履歴書基本情報)
  nome_alfabeto TEXT NOT NULL,
  nome_kanji TEXT,
  nome_kana TEXT,
  data_nascimento DATE,
  genero TEXT DEFAULT 'Não informado',
  foto_url TEXT,

  -- Endereço no Japão (現住所)
  cep TEXT,
  provincia TEXT,
  cidade_bairro TEXT,
  endereco_numero TEXT,
  telefone TEXT,
  email TEXT,

  -- Visto e Documentos Legais (在留資格・本人確認)
  tipo_visto TEXT,
  numero_zairyu TEXT,
  validade_zairyu DATE,
  nacionalidade TEXT DEFAULT 'Brasil',
  my_number TEXT,
  numero_invoice TEXT,

  -- Contrato de Trabalho e Salário (雇用・契約情報)
  tipo_contrato TEXT DEFAULT '業務委託',
  cargo_funcao TEXT,
  data_admissao DATE,
  tipo_calculo TEXT DEFAULT 'por_hora' CHECK (tipo_calculo IN ('por_hora', 'fixo')),
  valor_hora NUMERIC(10,2) DEFAULT 0,
  valor_diario NUMERIC(10,2) DEFAULT 0,

  -- Dados Bancários para Pagamento (給与振込先口座)
  banco_nome TEXT,
  banco_agencia TEXT,
  banco_tipo_conta TEXT DEFAULT '普通',
  banco_conta TEXT,
  banco_titular TEXT,

  -- Contato de Emergência (緊急連絡先)
  contato_emergencia_nome TEXT,
  contato_emergencia_parentesco TEXT,
  contato_emergencia_telefone TEXT,

  -- Licenças e Qualificações no Japão (免許・資格・特別教育)
  qualificacoes_licencas JSONB DEFAULT '[]'::jsonb,

  -- Histórico Escolar e Profissional no Japão (学歴・職歴)
  historico_escolar JSONB DEFAULT '[]'::jsonb,
  historico_profissional JSONB DEFAULT '[]'::jsonb,

  -- Status e Controle
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(gestor_id, codigo_trabalhador)
);

-- Ativar RLS
ALTER TABLE public.trabalhador ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Gestor gerencia próprios trabalhadores" ON public.trabalhador;
CREATE POLICY "Gestor gerencia próprios trabalhadores"
  ON public.trabalhador FOR ALL
  USING (auth.uid() = gestor_id)
  WITH CHECK (auth.uid() = gestor_id);

DROP POLICY IF EXISTS "Trabalhador visualiza próprio registro" ON public.trabalhador;
CREATE POLICY "Trabalhador visualiza próprio registro"
  ON public.trabalhador FOR SELECT
  USING (auth.uid() = usuario_id);

-- Permissões para usuários autenticados
GRANT ALL ON public.trabalhador TO authenticated;
GRANT ALL ON public.trabalhador TO service_role;

-- Garantir colunas de histórico escolar e profissional caso a tabela já exista
ALTER TABLE public.trabalhador ADD COLUMN IF NOT EXISTS historico_escolar JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.trabalhador ADD COLUMN IF NOT EXISTS historico_profissional JSONB DEFAULT '[]'::jsonb;

-- Recarregar cache de esquemas da API
NOTIFY pgrst, 'reload schema';
