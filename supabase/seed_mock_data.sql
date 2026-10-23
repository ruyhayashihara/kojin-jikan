-- ============================================================
-- マイ個人 — Seed de Demonstração com 10 Funcionários no Japão
-- e 1 Ano de Horas Trabalhadas (~250h/mês por trabalhador)
-- ============================================================
-- Execute este script no SQL Editor do Supabase após rodar migration.sql

DO $$
DECLARE
  v_gestor_id UUID;
  v_worker_id UUID;
  rec_w RECORD;
  v_date DATE;
  v_dow INTEGER;
  v_hora_entrada TIME;
  v_hora_saida TIME;
  v_intervalo TIME := '01:00:00';
  v_horas_extras NUMERIC;
  v_horas_noturnas NUMERIC;
  v_total_horas NUMERIC;
BEGIN
  -- 1. Identifica o usuário gestor (usa o usuário autenticado ou o primeiro usuário cadastrado)
  SELECT id INTO v_gestor_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_gestor_id IS NULL THEN
    RAISE NOTICE 'Nenhum usuário encontrado em auth.users. Crie uma conta no app antes de rodar o seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Inserindo dados de demonstração para o gestor ID: %', v_gestor_id;

  -- Garante perfil de gestor
  UPDATE perfil_usuario SET tipo_perfil = 'gestor' WHERE id = v_gestor_id;

  -- 2. Insere os 10 Trabalhadores com dados completos (履歴書 / 労働者名簿)
  INSERT INTO trabalhador (
    gestor_id, codigo_trabalhador, nome_alfabeto, nome_kanji, nome_kana,
    data_nascimento, genero, cep, provincia, cidade_bairro, endereco_numero,
    telefone, email, tipo_visto, numero_zairyu, validade_zairyu, nacionalidade,
    my_number, numero_invoice, tipo_contrato, cargo_funcao, data_admissao,
    tipo_calculo, valor_hora, banco_nome, banco_agencia, banco_tipo_conta,
    banco_conta, banco_titular, contato_emergencia_nome, contato_emergencia_parentesco,
    contato_emergencia_telefone, observacoes, ativo
  ) VALUES
  (
    v_gestor_id, 'TR-001', 'Carlos Silva', 'シルバ カルロス', 'シルバ カルロス',
    '1988-04-12', 'Masculino', '471-0826', '愛知県 (Aichi)', '豊田市トヨタ町1番地', 'メゾン豊田 203号室',
    '090-1234-5678', 'carlos.silva@example.com', '永住者 (Permanente)', '123456789012', '2028-09-30', 'Brasil',
    '123456789012', 'T1234567890123', '業務委託', 'Operador de Linha Industrial (Automotivo)', '2023-04-01',
    'por_hora', 1650, '三菱UFJ銀行', '名古屋支店 (001)', '普通', '1234567', 'シルバ カルロス',
    'Maria Silva', 'Esposa', '080-9876-5432', 'Operador experiente em prensas e estamparia pesada.', TRUE
  ),
  (
    v_gestor_id, 'TR-002', 'Mariana Tanaka', '田中 真里奈', 'タナカ マリアナ',
    '1993-08-25', 'Feminino', '430-0929', '静岡県 (Shizuoka)', '浜松市中区中央1-2-3', 'サニーハイツ 105号室',
    '080-2345-6789', 'mariana.tanaka@example.com', '定住者 (Residente Longa Permanência)', '234567890123', '2027-04-15', 'Brasil',
    '234567890123', 'T2345678901234', '派遣社員', 'Inspetora de Controle de Qualidade', '2023-06-15',
    'por_hora', 1500, '三井住友銀行', '浜松支店 (210)', '普通', '2345678', 'タナカ マリアナ',
    'Kenji Tanaka', 'Pai', '090-8765-4321', 'Certificação em medição dimensional.', TRUE
  ),
  (
    v_gestor_id, 'TR-003', 'Rodrigo Sato', '佐藤 ロドリゴ', 'サトウ ロドリゴ',
    '1985-11-03', 'Masculino', '513-0824', '三重県 (Mie)', '鈴鹿市道伯町2150', 'グリーンコーポ 302号室',
    '070-3456-7890', 'rodrigo.sato@example.com', '日本人の配偶者等 (Cônjuge de Japonês)', '345678901234', '2026-11-15', 'Brasil',
    '345678901234', 'T3456789012345', '正社員', 'Líder de Montagem Mecânica', '2022-09-01',
    'por_hora', 1850, 'ゆうちょ銀行', '二二八支店 (228)', '普通', '3456789', 'サトウ ロドリゴ',
    'Yoko Sato', 'Esposa', '090-7654-3210', 'Atenção: Validade do Zairyu Card nos próximos 30 dias.', TRUE
  ),
  (
    v_gestor_id, 'TR-004', 'Beatriz Nakamura', '中村 ベアトリス', 'ナカムラ ベアトリス',
    '1996-02-18', 'Feminino', '370-0532', '群馬県 (Gunma)', '邑楽郡大泉町坂田1-1-1', 'コーポ大泉 102号室',
    '090-4567-8901', 'beatriz.nakamura@example.com', '特定技能 (Habilidades Específicas)', '456789012345', '2027-02-28', 'Brasil',
    '456789012345', 'T4567890123456', '契約社員', 'Montadora de Chicotes Elétricos', '2024-01-10',
    'por_hora', 1450, '群馬銀行', '大泉支店 (502)', '普通', '4567890', 'ナカムラ ベアトリス',
    'Paulo Nakamura', 'Irmão', '080-6543-2109', 'Excelente assiduidade e precisão.', TRUE
  ),
  (
    v_gestor_id, 'TR-005', 'Fernando Yamamoto', '山本 フェルナンド', 'ヤマモト フェルナンド',
    '1982-07-30', 'Masculino', '243-0018', '神奈川県 (Kanagawa)', '厚木市中町2-8-1', 'パセオ本厚木 401号室',
    '080-5678-9012', 'fernando.yamamoto@example.com', '永住者 (Permanente)', '567890123456', '2029-12-31', 'Brasil',
    '567890123456', 'T5678901234567', '業務委託', 'Soldador Especializado TIG/MIG', '2022-05-20',
    'por_hora', 2100, '横浜銀行', '厚木支店 (301)', '普通', '5678901', 'ヤマモト フェルナンド',
    'Camila Yamamoto', 'Esposa', '090-5432-1098', 'Qualificação técnica JIS Z 3801.', TRUE
  ),
  (
    v_gestor_id, 'TR-006', 'Juliana Takahashi', '高橋 ジュリアナ', 'タカハシ ジュリアナ',
    '1991-10-14', 'Feminino', '350-1123', '埼玉県 (Saitama)', '川越市脇田本町15-1', '川越セントラル 305号室',
    '070-6789-0123', 'juliana.takahashi@example.com', '定住者 (Residente Longa Permanência)', '678901234567', '2027-08-31', 'Brasil',
    '678901234567', 'T6789012345678', '派遣社員', 'Embalagem e Expedição Logística', '2023-11-01',
    'por_hora', 1400, 'みずほ銀行', '川越支店 (412)', '普通', '6789012', 'タカハシ ジュリアナ',
    'Lucas Takahashi', 'Esposo', '080-4321-0987', 'Operadora certificada de empilhadeira.', TRUE
  ),
  (
    v_gestor_id, 'TR-007', 'Lucas Watanabe', '渡辺 ルーカス', 'ワタナベ ルーカス',
    '1998-05-09', 'Masculino', '321-0953', '栃木県 (Tochigi)', '宇都宮市東宿郷2-4-1', '宇都宮スカイハイツ 502号室',
    '090-7890-1234', 'lucas.watanabe@example.com', '技術・人文知識・国際業務', '789012345678', '2027-05-15', 'Brasil',
    '789012345678', 'T7890123456789', '正社員', 'Programador de Robôs Fanuc', '2023-02-15',
    'por_hora', 2300, '足利銀行', '宇都宮支店 (101)', '普通', '7890123', 'ワタナベ ルーカス',
    'Ana Watanabe', 'Mãe', '090-3210-9876', 'Engenheiro mecatrônico.', TRUE
  ),
  (
    v_gestor_id, 'TR-008', 'Amanda Suzuki', '鈴木 アマンダ', 'スズキ アマンダ',
    '1994-12-01', 'Feminino', '509-0203', '岐阜県 (Gifu)', '可児市下恵土1-1', 'エクセル可児 201号室',
    '080-8901-2345', 'amanda.suzuki@example.com', '日本人の配偶者等 (Cônjuge de Japonês)', '890123456789', '2026-11-28', 'Brasil',
    '890123456789', 'T8901234567890', '業務委託', 'Controle de Estoque e Almoxarifado', '2023-08-01',
    'por_hora', 1550, '十六銀行', '可児支店 (610)', '普通', '8901234', 'スズキ アマンダ',
    'Roberto Suzuki', 'Esposo', '070-2109-8765', 'Atenção: Validade do Zairyu Card nos próximos 35 dias.', TRUE
  ),
  (
    v_gestor_id, 'TR-009', 'Marcelo Kobayashi', '小林 マルセロ', 'コバヤシ マルセロ',
    '1980-03-22', 'Masculino', '577-0012', '大阪府 (Osaka)', '東大阪市長田東2-1-1', '東大阪レジデンス 603号室',
    '070-9012-3456', 'marcelo.kobayashi@example.com', '永住者 (Permanente)', '901234567890', '2030-01-31', 'Brasil',
    '901234567890', 'T9012345678901', '業務委託', 'Operador de Torno CNC', '2021-10-10',
    'por_hora', 1950, 'りそな銀行', '東大阪支店 (551)', '普通', '9012345', 'コバヤシ マルセロ',
    'Sonia Kobayashi', 'Esposa', '090-1098-7654', 'Especialista em usinagem pesada.', TRUE
  ),
  (
    v_gestor_id, 'TR-010', 'Patricia Aoki', '青木 パトリシア', 'アオキ パトリシア',
    '1992-09-17', 'Feminino', '390-0811', '長野県 (Nagano)', '松本市中央1-10-1', 'アルプス松本 204号室',
    '090-0123-4567', 'patricia.aoki@example.com', '定住者 (Residente Longa Permanência)', '012345678901', '2027-10-31', 'Brasil',
    '012345678901', 'T0123456789012', '契約社員', 'Operadora de Injeção Plástica', '2023-05-01',
    'por_hora', 1600, '八十二銀行', '松本支店 (701)', '普通', '0123456', 'アオキ パトリシア',
    'Daniel Aoki', 'Irmão', '080-0987-6543', 'Operação e manutenção autônoma.', TRUE
  )
  ON CONFLICT (gestor_id, codigo_trabalhador) DO UPDATE SET
    nome_alfabeto = EXCLUDED.nome_alfabeto,
    valor_hora = EXCLUDED.valor_hora,
    validade_zairyu = EXCLUDED.validade_zairyu;

  -- 3. Gera 1 ano (12 meses) de registros com média de ~250 horas por mês para todos os 10 trabalhadores
  FOR rec_w IN SELECT id, codigo_trabalhador FROM trabalhador WHERE gestor_id = v_gestor_id LOOP
    -- Limpa registros existentes deste trabalhador para não duplicar
    DELETE FROM registro_diario WHERE trabalhador_id = rec_w.id;

    -- Gera dias de 2025-11-01 a 2026-10-31
    FOR v_date IN SELECT d::DATE FROM generate_series('2025-11-01'::DATE, '2026-10-31'::DATE, '1 day'::INTERVAL) d LOOP
      v_dow := EXTRACT(DOW FROM v_date);

      -- Trabalha Seg-Sex (1-5) e o primeiro sábado do mês (6)
      IF v_dow IN (1, 2, 3, 4, 5) OR (v_dow = 6 AND EXTRACT(DAY FROM v_date) <= 7) THEN
        v_hora_entrada := '08:00:00';
        -- 11.5h diárias com 1h intervalo: Saída às 20:30 (8h normais + 3.5h extras)
        v_hora_saida := '20:30:00';
        v_horas_extras := 3.5;
        v_horas_noturnas := 0;

        -- Sextas-feiras ou sábados com um pouco mais de overtime para manter média de ~250h/mês
        IF v_dow = 5 THEN
          v_hora_saida := '21:00:00';
          v_horas_extras := 4.0;
        END IF;

        INSERT INTO registro_diario (
          usuario_id, trabalhador_id, data, hora_entrada, hora_saida, intervalo,
          horas_extras, adicional_noturno, adicional_fim_de_semana, tipo_calculo, observacao
        ) VALUES (
          v_gestor_id, rec_w.id, v_date, v_hora_entrada, v_hora_saida, v_intervalo,
          v_horas_extras, v_horas_noturnas, 0, 'por_hora',
          CASE WHEN v_horas_extras > 3 THEN 'Linha industrial + Horas Extras (残業)' ELSE 'Turno Regular' END
        );
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed concluído com sucesso! 10 trabalhadores e 1 ano de horas (~250h/mês) criados.';
END $$;
