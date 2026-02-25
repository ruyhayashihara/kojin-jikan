-- ============================================================
-- マイ個人 — Migração do Banco de Dados
-- Todas as tabelas + Row Level Security
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- 1. PERFIL_USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS perfil_usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  moeda TEXT DEFAULT '¥',
  valor_hora_padrao NUMERIC(10,2) DEFAULT 0,
  regime_declaracao TEXT CHECK (regime_declaracao IN ('青色 Azul', '白色 Branco')),
  registrado_invoice BOOLEAN DEFAULT FALSE,
  numero_invoice TEXT,
  my_number TEXT,
  ano_fiscal_atual INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE perfil_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas próprio perfil"
  ON perfil_usuario FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário insere próprio perfil"
  ON perfil_usuario FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário atualiza próprio perfil"
  ON perfil_usuario FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuário deleta próprio perfil"
  ON perfil_usuario FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- 2. REGISTRO_DIARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS registro_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  dia_semana TEXT GENERATED ALWAYS AS (
    CASE EXTRACT(DOW FROM data)
      WHEN 0 THEN '日曜日 (Domingo)'
      WHEN 1 THEN '月曜日 (Segunda)'
      WHEN 2 THEN '火曜日 (Terça)'
      WHEN 3 THEN '水曜日 (Quarta)'
      WHEN 4 THEN '木曜日 (Quinta)'
      WHEN 5 THEN '金曜日 (Sexta)'
      WHEN 6 THEN '土曜日 (Sábado)'
    END
  ) STORED,
  hora_entrada TIME,
  hora_saida TIME,
  intervalo TIME,
  total_horas NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN hora_entrada IS NOT NULL AND hora_saida IS NOT NULL THEN
      GREATEST(
        (EXTRACT(EPOCH FROM (hora_saida - hora_entrada)) - COALESCE(EXTRACT(EPOCH FROM intervalo), 0)) / 3600.0,
        0
      )
    ELSE 0 END
  ) STORED,
  observacao TEXT,
  mes INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM data)::INTEGER) STORED,
  ano INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM data)::INTEGER) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE registro_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios registros diários"
  ON registro_diario FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprios registros diários"
  ON registro_diario FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprios registros diários"
  ON registro_diario FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprios registros diários"
  ON registro_diario FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- 3. DESCONTO_MENSAL
-- ============================================================
CREATE TABLE IF NOT EXISTS desconto_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Fixo mensal', 'Por dia trabalhado')),
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE desconto_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios descontos"
  ON desconto_mensal FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprios descontos"
  ON desconto_mensal FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprios descontos"
  ON desconto_mensal FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprios descontos"
  ON desconto_mensal FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- 4. RESUMO_MENSAL
-- ============================================================
CREATE TABLE IF NOT EXISTS resumo_mensal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  total_horas NUMERIC(10,2) DEFAULT 0,
  valor_hora NUMERIC(10,2) DEFAULT 0,
  subtotal_bruto NUMERIC(12,2) GENERATED ALWAYS AS (total_horas * valor_hora) STORED,
  total_descontos NUMERIC(12,2) DEFAULT 0,
  total_liquido NUMERIC(12,2) GENERATED ALWAYS AS ((total_horas * valor_hora) - total_descontos) STORED,
  total_despesas_dedutiveis NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, ano, mes)
);

ALTER TABLE resumo_mensal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios resumos"
  ON resumo_mensal FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprios resumos"
  ON resumo_mensal FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprios resumos"
  ON resumo_mensal FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprios resumos"
  ON resumo_mensal FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- 5. RECIBO
-- ============================================================
CREATE TABLE IF NOT EXISTS recibo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imagem_url TEXT,
  texto_ocr TEXT,
  data_recibo DATE,
  estabelecimento TEXT,
  valor_total NUMERIC(12,2) DEFAULT 0,
  valor_consumo_tax NUMERIC(12,2) DEFAULT 0,
  numero_invoice TEXT,
  status_processamento TEXT DEFAULT 'pendente'
    CHECK (status_processamento IN ('pendente', 'processado', 'revisado')),
  confianca_ocr NUMERIC(5,2) DEFAULT 0
    CHECK (confianca_ocr >= 0 AND confianca_ocr <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recibo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprios recibos"
  ON recibo FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprios recibos"
  ON recibo FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprios recibos"
  ON recibo FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprios recibos"
  ON recibo FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- 6. DESPESA
-- ============================================================
CREATE TABLE IF NOT EXISTS despesa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recibo_id UUID REFERENCES recibo(id) ON DELETE SET NULL,
  data_recibo DATE,
  descricao TEXT,
  estabelecimento TEXT,
  valor NUMERIC(12,2) DEFAULT 0,
  valor_dedutivel NUMERIC(12,2) DEFAULT 0,
  categoria_code TEXT,
  categoria_nome TEXT,
  campo_formulario TEXT,
  classificacao_automatica BOOLEAN DEFAULT FALSE,
  revisado_usuario BOOLEAN DEFAULT FALSE,
  ano_fiscal INTEGER,
  mes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE despesa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê próprias despesas"
  ON despesa FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário insere próprias despesas"
  ON despesa FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário atualiza próprias despesas"
  ON despesa FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário deleta próprias despesas"
  ON despesa FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- Trigger para updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER perfil_usuario_updated_at
  BEFORE UPDATE ON perfil_usuario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resumo_mensal_updated_at
  BEFORE UPDATE ON resumo_mensal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
