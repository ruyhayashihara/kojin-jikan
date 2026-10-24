/**
 * Dados fictícios de 10 funcionários no Japão (padrão 履歴書 / 労働者名簿)
 * e gerador de 1 ano de horas trabalhadas (~250h/mês).
 */

export const MOCK_TRABALHADORES = [
  {
    codigo_trabalhador: 'TR-001',
    nome_alfabeto: 'Carlos Silva',
    nome_kanji: 'シルバ カルロス',
    nome_kana: 'シルバ カルロス',
    data_nascimento: '1988-04-12',
    genero: 'Masculino',
    cep: '471-0826',
    provincia: '愛知県 (Aichi)',
    cidade_bairro: '豊田市トヨタ町1番地',
    endereco_numero: 'メゾン豊田 203号室',
    telefone: '090-1234-5678',
    email: 'carlos.silva@example.com',
    tipo_visto: '永住者 (Permanente)',
    numero_zairyu: '123456789012',
    validade_zairyu: '2028-09-30',
    nacionalidade: 'Brasil',
    my_number: '123456789012',
    numero_invoice: 'T1234567890123',
    tipo_contrato: '業務委託',
    cargo_funcao: 'Operador de Linha Industrial (Automotivo)',
    data_admissao: '2023-04-01',
    tipo_calculo: 'por_hora',
    valor_hora: 1650,
    valor_diario: 0,
    banco_nome: '三菱UFJ銀行',
    banco_agencia: '名古屋支店 (001)',
    banco_tipo_conta: '普通',
    banco_conta: '1234567',
    banco_titular: 'シルバ カルロス',
    contato_emergencia_nome: 'Maria Silva',
    contato_emergencia_parentesco: 'Esposa',
    contato_emergencia_telefone: '080-9876-5432',
    observacoes: 'Experiência em estamparia e prensas pesadas.',
    qualificacoes_licencas: [
      { id: 'lic-001-1', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: '玉掛け技能講習 (1t以上)', nome_pt: 'Tamagake (1t ou mais)', data_obtencao: '2020-03-15', numero_registro: '愛知第105822号', orgao_emissor: '愛知労働局長登録教習機関 (コマツ)', validade: '' },
      { id: 'lic-001-2', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: '床上操作式クレーン運転技能講習 (5t以上)', nome_pt: 'Ponte Rolante / Kuren (5t ou mais)', data_obtencao: '2020-05-20', numero_registro: '愛知第204911号', orgao_emissor: 'キャタピラー教習所 愛知', validade: '' },
      { id: 'lic-001-3', categoria_id: 'fabrica_seguranca', categoria_nome: 'Fábrica & Segurança', categoria_icon: '🏭', nome_ja: 'プレス機械作業主任者 / 金型取扱特別教育', nome_pt: 'Prensa Mecânica e Troca de Molde', data_obtencao: '2021-08-10', numero_registro: '名安第44102号', orgao_emissor: '中央労働災害防止協会', validade: '' },
      { id: 'lic-001-4', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (MT)', nome_pt: 'Carteira de Motorista - Carro Comum (MT)', data_obtencao: '2018-09-01', numero_registro: '第541800291032号', orgao_emissor: '愛知県公安委員会', validade: '2027-04-12' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-002',
    nome_alfabeto: 'Mariana Tanaka',
    nome_kanji: '田中 真里奈',
    nome_kana: 'タナカ マリアナ',
    data_nascimento: '1993-08-25',
    genero: 'Feminino',
    cep: '430-0929',
    provincia: '静岡県 (Shizuoka)',
    cidade_bairro: '浜松市中区中央1-2-3',
    endereco_numero: 'サニーハイツ 105号室',
    telefone: '080-2345-6789',
    email: 'mariana.tanaka@example.com',
    tipo_visto: '定住者 (Residente Longa Permanência)',
    numero_zairyu: '234567890123',
    validade_zairyu: '2027-04-15',
    nacionalidade: 'Brasil',
    my_number: '234567890123',
    numero_invoice: 'T2345678901234',
    tipo_contrato: '派遣社員',
    cargo_funcao: 'Inspetora de Controle de Qualidade',
    data_admissao: '2023-06-15',
    tipo_calculo: 'por_hora',
    valor_hora: 1500,
    valor_diario: 0,
    banco_nome: '三井住友銀行',
    banco_agencia: '浜松支店 (210)',
    banco_tipo_conta: '普通',
    banco_conta: '2345678',
    banco_titular: 'タナカ マリアナ',
    contato_emergencia_nome: 'Kenji Tanaka',
    contato_emergencia_parentesco: 'Pai',
    contato_emergencia_telefone: '090-8765-4321',
    observacoes: 'Certificação em microscopia e medição dimensional.',
    qualificacoes_licencas: [
      { id: 'lic-002-1', categoria_id: 'fabrica_seguranca', categoria_nome: 'Fábrica & Segurança', categoria_icon: '🏭', nome_ja: '第一種・第二種 衛生管理者', nome_pt: 'Gestor de Higiene e Segurança Ocupacional', data_obtencao: '2021-11-15', numero_registro: '静衛第12049号', orgao_emissor: '静岡労働局', validade: '' },
      { id: 'lic-002-2', categoria_id: 'idiomas_gestao', categoria_nome: 'Idiomas & Gestão', categoria_icon: '📚', nome_ja: '日本語能力試験 (JLPT N1)', nome_pt: 'Proficiência em Japonês N1 (Avançado/Fluente)', data_obtencao: '2022-07-03', numero_registro: 'JLPT-2022-N1-8910', orgao_emissor: '国際交流基金 / 日本国際教育支援協会', validade: '' },
      { id: 'lic-002-3', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (AT限定)', nome_pt: 'Carteira de Motorista - Carro Comum (AT)', data_obtencao: '2019-10-18', numero_registro: '第491900382910号', orgao_emissor: '静岡県公安委員会', validade: '2028-08-25' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-003',
    nome_alfabeto: 'Rodrigo Sato',
    nome_kanji: '佐藤 ロドリゴ',
    nome_kana: 'サトウ ロドリゴ',
    data_nascimento: '1985-11-03',
    genero: 'Masculino',
    cep: '513-0824',
    provincia: '三重県 (Mie)',
    cidade_bairro: '鈴鹿市道伯町2150',
    endereco_numero: 'グリーンコーポ 302号室',
    telefone: '070-3456-7890',
    email: 'rodrigo.sato@example.com',
    tipo_visto: '日本人の配偶者等 (Cônjuge de Japonês)',
    numero_zairyu: '345678901234',
    validade_zairyu: '2026-11-15', // Alerta: vence nos próximos 30 dias!
    nacionalidade: 'Brasil',
    my_number: '345678901234',
    numero_invoice: 'T3456789012345',
    tipo_contrato: '正社員',
    cargo_funcao: 'Líder de Montagem Mecânica',
    data_admissao: '2022-09-01',
    tipo_calculo: 'por_hora',
    valor_hora: 1850,
    valor_diario: 0,
    banco_nome: 'ゆうちょ銀行',
    banco_agencia: '二二八支店 (228)',
    banco_tipo_conta: '普通',
    banco_conta: '3456789',
    banco_titular: 'サトウ ロドリゴ',
    contato_emergencia_nome: 'Yoko Sato',
    contato_emergencia_parentesco: 'Esposa',
    contato_emergencia_telefone: '090-7654-3210',
    observacoes: 'Fluente em japonês (JLPT N2). Visto em processo de renovação.',
    qualificacoes_licencas: [
      { id: 'lic-003-1', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: 'フォークリフト運転技能講習 (1t以上)', nome_pt: 'Empilhadeira / Forklift (1t ou mais)', data_obtencao: '2017-06-22', numero_registro: '三重第084920号', orgao_emissor: 'トヨタL&F三重教習センター', validade: '' },
      { id: 'lic-003-2', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: '玉掛け技能講習 (1t以上)', nome_pt: 'Tamagake (1t ou mais)', data_obtencao: '2018-04-10', numero_registro: '三重第099412号', orgao_emissor: 'コマツ教習所', validade: '' },
      { id: 'lic-003-3', categoria_id: 'solda', categoria_nome: 'Soldagem no Japão', categoria_icon: '⚡', nome_ja: 'ガス溶接技能講習', nome_pt: 'Solda a Gás (Gas Welding)', data_obtencao: '2019-02-14', numero_registro: '三ガ第38102号', orgao_emissor: '三重労働局長登録教習機関', validade: '' },
      { id: 'lic-003-4', categoria_id: 'solda', categoria_nome: 'Soldagem no Japão', categoria_icon: '⚡', nome_ja: 'アーク溶接等の業務に係る特別教育', nome_pt: 'Solda Elétrica / Arco Manual', data_obtencao: '2019-03-01', numero_registro: '三特第55210号', orgao_emissor: '日本溶接協会認定校', validade: '' },
      { id: 'lic-003-5', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '準中型自動車運転免許 (5t限定解除)', nome_pt: 'Caminhão Leve 3.5t a 7.5t (Jun-Chugata)', data_obtencao: '2016-11-20', numero_registro: '第531600192837号', orgao_emissor: '三重県公安委員会', validade: '2026-11-03' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-004',
    nome_alfabeto: 'Beatriz Nakamura',
    nome_kanji: '中村 ベアトリス',
    nome_kana: 'ナカムラ ベアトリス',
    data_nascimento: '1996-02-18',
    genero: 'Feminino',
    cep: '370-0532',
    provincia: '群馬県 (Gunma)',
    cidade_bairro: '邑楽郡大泉町坂田1-1-1',
    endereco_numero: 'コーポ大泉 102号室',
    telefone: '090-4567-8901',
    email: 'beatriz.nakamura@example.com',
    tipo_visto: '特定技能 (Habilidades Específicas)',
    numero_zairyu: '456789012345',
    validade_zairyu: '2027-02-28',
    nacionalidade: 'Brasil',
    my_number: '456789012345',
    numero_invoice: 'T4567890123456',
    tipo_contrato: '契約社員',
    cargo_funcao: 'Montadora de Chicotes Elétricos',
    data_admissao: '2024-01-10',
    tipo_calculo: 'por_hora',
    valor_hora: 1450,
    valor_diario: 0,
    banco_nome: '群馬銀行',
    banco_agencia: '大泉支店 (502)',
    banco_tipo_conta: '普通',
    banco_conta: '4567890',
    banco_titular: 'ナカムラ ベアトリス',
    contato_emergencia_nome: 'Paulo Nakamura',
    contato_emergencia_parentesco: 'Irmão',
    contato_emergencia_telefone: '080-6543-2109',
    observacoes: 'Excelente pontualidade e assiduidade.',
    qualificacoes_licencas: [
      { id: 'lic-004-1', categoria_id: 'idiomas_gestao', categoria_nome: 'Idiomas & Gestão', categoria_icon: '📚', nome_ja: '日本語能力試験 (JLPT N2)', nome_pt: 'Proficiência em Japonês N2 (Intermediário Avançado)', data_obtencao: '2021-12-05', numero_registro: 'JLPT-2021-N2-3321', orgao_emissor: '国際交流基金', validade: '' },
      { id: 'lic-004-2', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (AT限定)', nome_pt: 'Carteira de Motorista - Carro Comum (AT)', data_obtencao: '2020-04-11', numero_registro: '第422000492810号', orgao_emissor: '群馬県公安委員会', validade: '2027-01-14' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-005',
    nome_alfabeto: 'Fernando Yamamoto',
    nome_kanji: '山本 フェルナンド',
    nome_kana: 'ヤマモト フェルナンド',
    data_nascimento: '1982-07-30',
    genero: 'Masculino',
    cep: '243-0018',
    provincia: '神奈川県 (Kanagawa)',
    cidade_bairro: '厚木市中町2-8-1',
    endereco_numero: 'パセオ本厚木 401号室',
    telefone: '080-5678-9012',
    email: 'fernando.yamamoto@example.com',
    tipo_visto: '永住者 (Permanente)',
    numero_zairyu: '567890123456',
    validade_zairyu: '2029-12-31',
    nacionalidade: 'Brasil',
    my_number: '567890123456',
    numero_invoice: 'T5678901234567',
    tipo_contrato: '業務委託',
    cargo_funcao: 'Soldador Especializado TIG/MIG',
    data_admissao: '2022-05-20',
    tipo_calculo: 'por_hora',
    valor_hora: 2100,
    valor_diario: 0,
    banco_nome: '横浜銀行',
    banco_agencia: '厚木支店 (301)',
    banco_tipo_conta: '普通',
    banco_conta: '5678901',
    banco_titular: 'ヤマモト フェルナンド',
    contato_emergencia_nome: 'Camila Yamamoto',
    contato_emergencia_parentesco: 'Esposa',
    contato_emergencia_telefone: '090-5432-1098',
    observacoes: 'Soldagem certificada JIS Z 3801.',
    qualificacoes_licencas: [
      { id: 'lic-005-1', categoria_id: 'solda', categoria_nome: 'Soldagem no Japão', categoria_icon: '⚡', nome_ja: 'TIG溶接 (アルゴン溶接 - ステンレス・アルミ)', nome_pt: 'Solda TIG / Argônio (Inox e Alumínio)', complemento: 'JIS TN-P', data_obtencao: '2018-03-25', numero_registro: 'JWES-TIG-40192', orgao_emissor: '一般社団法人 日本溶接協会 (JWES)', validade: '2027-03-24' },
      { id: 'lic-005-2', categoria_id: 'solda', categoria_nome: 'Soldagem no Japão', categoria_icon: '⚡', nome_ja: '半自動溶接 (MAG / MIG / CO2溶接)', nome_pt: 'Solda Semi-automática MAG/MIG/CO2', complemento: 'JIS SA-3F', data_obtencao: '2017-09-12', numero_registro: 'JWES-MAG-28104', orgao_emissor: '日本溶接協会 神奈川支部', validade: '2026-09-11' },
      { id: 'lic-005-3', categoria_id: 'solda', categoria_nome: 'Soldagem no Japão', categoria_icon: '⚡', nome_ja: 'JIS溶接技能者資格 (JIS Z 3801 / 3841 基本級・専門級)', nome_pt: 'Certificação JIS de Soldador Oficial', complemento: '専門級 (SA-2V)', data_obtencao: '2019-11-20', numero_registro: 'JIS-WELD-99201', orgao_emissor: '日本規格協会 / JWES', validade: '2028-11-19' },
      { id: 'lic-005-4', categoria_id: 'solda', categoria_nome: 'Soldagem no Japão', categoria_icon: '⚡', nome_ja: 'ガス溶接技能講習', nome_pt: 'Solda a Gás (Gas Welding)', complemento: '', data_obtencao: '2016-05-18', numero_registro: '神ガ第20194号', orgao_emissor: '神奈川労働局長登録教習機関', validade: '' },
      { id: 'lic-005-5', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: '玉掛け技能講習 (1t以上)', nome_pt: 'Tamagake (1t ou mais)', complemento: '', data_obtencao: '2017-02-10', numero_registro: '神玉第88210号', orgao_emissor: 'コベルコ教習所', validade: '' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-006',
    nome_alfabeto: 'Juliana Takahashi',
    nome_kanji: '高橋 ジュリアナ',
    nome_kana: 'タカハシ ジュリアナ',
    data_nascimento: '1991-10-14',
    genero: 'Feminino',
    cep: '350-1123',
    provincia: '埼玉県 (Saitama)',
    cidade_bairro: '川越市脇田本町15-1',
    endereco_numero: '川越セントラル 305号室',
    telefone: '070-6789-0123',
    email: 'juliana.takahashi@example.com',
    tipo_visto: '定住者 (Residente Longa Permanência)',
    numero_zairyu: '678901234567',
    validade_zairyu: '2027-08-31',
    nacionalidade: 'Brasil',
    my_number: '678901234567',
    numero_invoice: 'T6789012345678',
    tipo_contrato: '派遣社員',
    cargo_funcao: 'Embalagem e Expedição Logística',
    data_admissao: '2023-11-01',
    tipo_calculo: 'por_hora',
    valor_hora: 1400,
    valor_diario: 0,
    banco_nome: 'みずほ銀行',
    banco_agencia: '川越支店 (412)',
    banco_tipo_conta: '普通',
    banco_conta: '6789012',
    banco_titular: 'タカハシ ジュリアナ',
    contato_emergencia_nome: 'Lucas Takahashi',
    contato_emergencia_parentesco: 'Esposo',
    contato_emergencia_telefone: '080-4321-0987',
    observacoes: 'Operadora de leitor de código de barras e empilhadeira elétrica.',
    qualificacoes_licencas: [
      { id: 'lic-006-1', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: 'フォークリフト運転技能講習 (1t以上)', nome_pt: 'Empilhadeira / Forklift (1t ou mais)', data_obtencao: '2020-09-14', numero_registro: '埼第501920号', orgao_emissor: 'コマツ教習所 埼玉センタ', validade: '' },
      { id: 'lic-006-2', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (AT限定)', nome_pt: 'Carteira de Motorista - Carro Comum (AT)', data_obtencao: '2019-06-20', numero_registro: '第431900291040号', orgao_emissor: '埼玉県公安委員会', validade: '2027-10-14' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-007',
    nome_alfabeto: 'Lucas Watanabe',
    nome_kanji: '渡辺 ルーカス',
    nome_kana: 'ワタナベ ルーカス',
    data_nascimento: '1998-05-09',
    genero: 'Masculino',
    cep: '321-0953',
    provincia: '栃木県 (Tochigi)',
    cidade_bairro: '宇都宮市東宿郷2-4-1',
    endereco_numero: '宇都宮スカイハイツ 502号室',
    telefone: '090-7890-1234',
    email: 'lucas.watanabe@example.com',
    tipo_visto: '技術・人文知識・国際業務',
    numero_zairyu: '789012345678',
    validade_zairyu: '2027-05-15',
    nacionalidade: 'Brasil',
    my_number: '789012345678',
    numero_invoice: 'T7890123456789',
    tipo_contrato: '正社員',
    cargo_funcao: 'Programador de Robôs Industriais Fanuc',
    data_admissao: '2023-02-15',
    tipo_calculo: 'por_hora',
    valor_hora: 2300,
    valor_diario: 0,
    banco_nome: '足利銀行',
    banco_agencia: '宇都宮支店 (101)',
    banco_tipo_conta: '普通',
    banco_conta: '7890123',
    banco_titular: 'ワタナベ ルーカス',
    contato_emergencia_nome: 'Ana Watanabe',
    contato_emergencia_parentesco: 'Mãe',
    contato_emergencia_telefone: '090-3210-9876',
    observacoes: 'Engenheiro de automação, programa CLP e braços robóticos.',
    qualificacoes_licencas: [
      { id: 'lic-007-1', categoria_id: 'fabrica_seguranca', categoria_nome: 'Fábrica & Segurança', categoria_icon: '🏭', nome_ja: '産業用ロボット教示等特別教育', nome_pt: 'Operação e Programação de Robôs Industriais', data_obtencao: '2021-04-15', numero_registro: '栃特第40192号', orgao_emissor: 'ファナック株式会社 研修センタ', validade: '' },
      { id: 'lic-007-2', categoria_id: 'idiomas_gestao', categoria_nome: 'Idiomas & Gestão', categoria_icon: '📚', nome_ja: 'ITパスポート試験 / ITPEC', nome_pt: 'Certificação em Tecnologia da Informação (TI Japão)', data_obtencao: '2022-09-10', numero_registro: 'IP-2022-09-8812', orgao_emissor: '情報処理推進機構 (IPA)', validade: '' },
      { id: 'lic-007-3', categoria_id: 'idiomas_gestao', categoria_nome: 'Idiomas & Gestão', categoria_icon: '📚', nome_ja: '日本語能力試験 (JLPT N1)', nome_pt: 'Proficiência em Japonês N1', data_obtencao: '2020-12-06', numero_registro: 'JLPT-2020-N1-1049', orgao_emissor: '国際交流基金', validade: '' },
      { id: 'lic-007-4', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (MT)', nome_pt: 'Carteira de Motorista - Carro Comum (MT)', data_obtencao: '2017-08-20', numero_registro: '第411700291040号', orgao_emissor: '栃木県公安委員会', validade: '2027-05-09' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-008',
    nome_alfabeto: 'Amanda Suzuki',
    nome_kanji: '鈴木 アマンダ',
    nome_kana: 'スズキ アマンダ',
    data_nascimento: '1994-12-01',
    genero: 'Feminino',
    cep: '509-0203',
    provincia: '岐阜県 (Gifu)',
    cidade_bairro: '可児市下恵土1-1',
    endereco_numero: 'エクセル可児 201号室',
    telefone: '080-8901-2345',
    email: 'amanda.suzuki@example.com',
    tipo_visto: '日本人の配偶者等 (Cônjuge de Japonês)',
    numero_zairyu: '890123456789',
    validade_zairyu: '2026-11-28', // Alerta: vence nos próximos 35 dias!
    nacionalidade: 'Brasil',
    my_number: '890123456789',
    numero_invoice: 'T8901234567890',
    tipo_contrato: '業務委託',
    cargo_funcao: 'Controle de Estoque e Almoxarifado',
    data_admissao: '2023-08-01',
    tipo_calculo: 'por_hora',
    valor_hora: 1550,
    valor_diario: 0,
    banco_nome: '十六銀行',
    banco_agencia: '可児支店 (610)',
    banco_tipo_conta: '普通',
    banco_conta: '8901234',
    banco_titular: 'スズキ アマンダ',
    contato_emergencia_nome: 'Roberto Suzuki',
    contato_emergencia_parentesco: 'Esposo',
    contato_emergencia_telefone: '070-2109-8765',
    observacoes: 'Responsável pelo recebimento fiscal e inventário periódico.',
    qualificacoes_licencas: [
      { id: 'lic-008-1', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: 'フォークリフト運転技能講習 (1t以上)', nome_pt: 'Empilhadeira / Forklift (1t ou mais)', data_obtencao: '2020-08-12', numero_registro: '岐第491029号', orgao_emissor: 'トヨタL&F岐阜', validade: '' },
      { id: 'lic-008-2', categoria_id: 'idiomas_gestao', categoria_nome: 'Idiomas & Gestão', categoria_icon: '📚', nome_ja: '運行管理者 (貨物) / 運行管理補助者', nome_pt: 'Gestor de Operações de Transporte / Logística', data_obtencao: '2022-04-18', numero_registro: '国交運第88102号', orgao_emissor: '運行管理者試験センター', validade: '' },
      { id: 'lic-008-3', categoria_id: 'idiomas_gestao', categoria_nome: 'Idiomas & Gestão', categoria_icon: '📚', nome_ja: '日本語能力試験 (JLPT N2)', nome_pt: 'Proficiência em Japonês N2', data_obtencao: '2019-12-01', numero_registro: 'JLPT-2019-N2-5502', orgao_emissor: '国際交流基金', validade: '' },
      { id: 'lic-008-4', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (AT限定)', nome_pt: 'Carteira de Motorista - Carro Comum (AT)', data_obtencao: '2017-09-15', numero_registro: '第511700382910号', orgao_emissor: '岐阜県公安委員会', validade: '2027-12-01' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-009',
    nome_alfabeto: 'Marcelo Kobayashi',
    nome_kanji: '小林 マルセロ',
    nome_kana: 'コバヤシ マルセロ',
    data_nascimento: '1980-03-22',
    genero: 'Masculino',
    cep: '577-0012',
    provincia: '大阪府 (Osaka)',
    cidade_bairro: '東大阪市長田東2-1-1',
    endereco_numero: '東大阪レジデンス 603号室',
    telefone: '070-9012-3456',
    email: 'marcelo.kobayashi@example.com',
    tipo_visto: '永住者 (Permanente)',
    numero_zairyu: '901234567890',
    validade_zairyu: '2030-01-31',
    nacionalidade: 'Brasil',
    my_number: '901234567890',
    numero_invoice: 'T9012345678901',
    tipo_contrato: '業務委託',
    cargo_funcao: 'Operador e Preparador de Torno CNC',
    data_admissao: '2021-10-10',
    tipo_calculo: 'por_hora',
    valor_hora: 1950,
    valor_diario: 0,
    banco_nome: 'りそな銀行',
    banco_agencia: '東大阪支店 (551)',
    banco_tipo_conta: '普通',
    banco_conta: '9012345',
    banco_titular: 'コバヤシ マルセロ',
    contato_emergencia_nome: 'Sonia Kobayashi',
    contato_emergencia_parentesco: 'Esposa',
    contato_emergencia_telefone: '090-1098-7654',
    observacoes: 'Mais de 15 anos de usinagem de precisão em metais ferrosos.',
    qualificacoes_licencas: [
      { id: 'lic-009-1', categoria_id: 'fabrica_seguranca', categoria_nome: 'Fábrica & Segurança', categoria_icon: '🏭', nome_ja: '産業用ロボット教示等特別教育', nome_pt: 'Operação e Programação de Robôs Industriais', data_obtencao: '2019-06-25', numero_registro: '阪特第30192号', orgao_emissor: '大阪労働基準連合会 / 安川電機研修センタ', validade: '' },
      { id: 'lic-009-2', categoria_id: 'fabrica_seguranca', categoria_nome: 'Fábrica & Segurança', categoria_icon: '🏭', nome_ja: '研削といし取替え等特別教育 (自由研削・機械研削)', nome_pt: 'Esmeril e Troca de Rebolo', data_obtencao: '2018-09-10', numero_registro: '阪特第18402号', orgao_emissor: '大阪労働災害防止協会', validade: '' },
      { id: 'lic-009-3', categoria_id: 'fabrica_seguranca', categoria_nome: 'Fábrica & Segurança', categoria_icon: '🏭', nome_ja: 'ボイラー取扱技能講習 / ボイラー技士', nome_pt: 'Operador de Caldeira (Boiler)', data_obtencao: '2016-03-20', numero_registro: '阪ボ第09412号', orgao_emissor: '日本ボイラ協会 大阪支部', validade: '' },
      { id: 'lic-009-4', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (MT)', nome_pt: 'Carteira de Motorista - Carro Comum (MT)', data_obtencao: '2012-04-15', numero_registro: '第621200192830号', orgao_emissor: '大阪府公安委員会', validade: '2028-03-22' }
    ],
    ativo: true
  },
  {
    codigo_trabalhador: 'TR-010',
    nome_alfabeto: 'Patricia Aoki',
    nome_kanji: '青木 パトリシア',
    nome_kana: 'アオキ パトリシア',
    data_nascimento: '1992-09-17',
    genero: 'Feminino',
    cep: '390-0811',
    provincia: '長野県 (Nagano)',
    cidade_bairro: '松本市中央1-10-1',
    endereco_numero: 'アルプス松本 204号室',
    telefone: '090-0123-4567',
    email: 'patricia.aoki@example.com',
    tipo_visto: '定住者 (Residente Longa Permanência)',
    numero_zairyu: '012345678901',
    validade_zairyu: '2027-10-31',
    nacionalidade: 'Brasil',
    my_number: '012345678901',
    numero_invoice: 'T0123456789012',
    tipo_contrato: '契約社員',
    cargo_funcao: 'Operadora de Injeção Plástica',
    data_admissao: '2023-05-01',
    tipo_calculo: 'por_hora',
    valor_hora: 1600,
    valor_diario: 0,
    banco_nome: '八十二銀行',
    banco_agencia: '松本支店 (701)',
    banco_tipo_conta: '普通',
    banco_conta: '0123456',
    banco_titular: 'アオキ パトリシア',
    contato_emergencia_nome: 'Daniel Aoki',
    contato_emergencia_parentesco: 'Irmão',
    contato_emergencia_telefone: '080-0987-6543',
    observacoes: 'Troca rápida de moldes e controle de parâmetros de temperatura.',
    qualificacoes_licencas: [
      { id: 'lic-010-1', categoria_id: 'cargas', categoria_nome: 'Cargas & Guindastes', categoria_icon: '🏗️', nome_ja: '高所作業車運転技能講習 (10m以上)', nome_pt: 'Plataforma Elevatória (10m ou mais)', data_obtencao: '2021-05-18', numero_registro: '長高第19402号', orgao_emissor: 'コマツ教習所 長野センタ', validade: '' },
      { id: 'lic-010-2', categoria_id: 'construcao_maquinas', categoria_nome: 'Construção Civil & Terraplanagem', categoria_icon: '🚜', nome_ja: 'フルハーネス型墜落制止用器具特別教育', nome_pt: 'Cinto Tipo Paraquedista (Full Harness)', data_obtencao: '2021-06-02', numero_registro: '長特第08492号', orgao_emissor: '長野労働基準協会連合会', validade: '' },
      { id: 'lic-010-3', categoria_id: 'veiculos', categoria_nome: 'Veículos & Condução', categoria_icon: '🚗', nome_ja: '普通自動車第一種運転免許 (AT限定)', nome_pt: 'Carteira de Motorista - Carro Comum (AT)', data_obtencao: '2018-11-20', numero_registro: '第481800492811号', orgao_emissor: '長野県公安委員会', validade: '2027-09-17' }
    ],
    ativo: true
  }
];

/**
 * Gera registros diários para 1 ano (12 meses) para um trabalhador específico,
 * calibrado para somar ~250 horas por mês.
 *
 * Média de trabalho no Japão para ~250h/mês:
 * ~22 dias trabalhados no mês × ~11.4h/dia = 250.8 horas/mês.
 * (8h normais + ~3.4h extras diárias, com adicionais da lei japonesa)
 */
export function generateYearRecordsForWorker(workerId, userId, startYear = 2025, startMonth = 11, totalMonths = 12) {
  const records = [];

  let curY = startYear;
  let curM = startMonth;

  for (let m = 0; m < totalMonths; m++) {
    const daysInMonth = new Date(curY, curM, 0).getDate();

    // Determina os dias da semana
    const workDays = [];
    const saturdayWorkDays = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(curY, curM - 1, d);
      const dow = dateObj.getDay(); // 0 = Dom, 6 = Sáb
      if (dow >= 1 && dow <= 5) {
        workDays.push(d); // Seg a Sex
      } else if (dow === 6) {
        saturdayWorkDays.push(d); // Sábados disponíveis para hora extra
      }
    }

    // Trabalha todos os dias de semana (aprox 20-22) + 1 ou 2 sábados conforme necessário para atingir ~250h
    const targetDays = workDays.slice();
    // Adiciona 1 ou 2 sábados
    if (saturdayWorkDays.length > 0) targetDays.push(saturdayWorkDays[0]);
    if (saturdayWorkDays.length > 2 && targetDays.length < 22) targetDays.push(saturdayWorkDays[1]);

    const numDays = targetDays.length; // ~21-23 dias
    const targetMonthlyHours = 248 + Math.floor(Math.random() * 6); // Entre 248h e 253h (~250h)
    const avgHoursPerDay = targetMonthlyHours / numDays; // ~11.0h - 11.5h por dia

    let accumulatedHours = 0;

    targetDays.sort((a, b) => a - b).forEach((d, idx) => {
      const isLast = idx === numDays - 1;
      let dayHours;

      if (isLast) {
        // Ajusta exatamente para a meta do mês
        dayHours = Math.max(8.0, Math.round((targetMonthlyHours - accumulatedHours) * 10) / 10);
      } else {
        // Variação suave entre 10.5h e 12.0h
        const variation = (Math.random() * 1.5) - 0.75;
        dayHours = Math.round((avgHoursPerDay + variation) * 10) / 10;
        dayHours = Math.min(12.5, Math.max(9.0, dayHours));
      }
      accumulatedHours += dayHours;

      // Monta horários realistas
      // Intervalo padrão de 60min
      const intervaloMin = 60;
      const intervaloStr = '01:00';

      // Turno habitual: Entrada às 08:00
      const startMin = 8 * 60; // 08:00
      const totalElapsedMin = Math.round((dayHours * 60) + intervaloMin);
      const endMin = startMin + totalElapsedMin;

      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;

      const horaEntrada = '08:00';
      const horaSaida = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Calcula horas extras (>8h)
      const horasExtras = dayHours > 8 ? Math.round((dayHours - 8) * 100) / 100 : 0;

      // Adicional Noturno: após as 22:00
      let horasNoturnas = 0;
      if (endH >= 22) {
        const nightMinutes = (endH - 22) * 60 + endM;
        horasNoturnas = Math.round((nightMinutes / 60) * 100) / 100;
      }

      const dateStr = `${curY}-${String(curM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      records.push({
        usuario_id: userId,
        trabalhador_id: workerId,
        data: dateStr,
        hora_entrada: horaEntrada,
        hora_saida: horaSaida,
        intervalo: intervaloStr,
        total_horas: dayHours,
        horas_extras: horasExtras,
        adicional_noturno: horasNoturnas,
        adicional_fim_de_semana: 0,
        tipo_calculo: 'por_hora',
        observacao: horasExtras > 3 ? 'Linha contínua + Horas Extras (残業)' : 'Turno Regular'
      });
    });

    // Avança para o próximo mês
    curM++;
    if (curM > 12) {
      curM = 1;
      curY++;
    }
  }

  return records;
}

/**
 * Gera o próximo ID sequencial numérico de 4 dígitos (0001, 0002, 0003...)
 * baseado no maior número existente na lista de trabalhadores.
 */
export function gerarProximoIdTrabalhador(listaTrabalhadores = []) {
  if (!Array.isArray(listaTrabalhadores) || listaTrabalhadores.length === 0) {
    return '0001';
  }

  let maiorNumero = 0;

  listaTrabalhadores.forEach(t => {
    if (!t) return;
    const codigo = String(t.codigo_trabalhador || t.id || '');
    // Extrai os dígitos do código (ex: "0001" -> 1, "TR-005" -> 5)
    const matches = codigo.match(/\d+/g);
    if (matches) {
      const num = parseInt(matches.join(''), 10);
      if (!isNaN(num) && num > maiorNumero) {
        maiorNumero = num;
      }
    }
  });

  const proximo = maiorNumero + 1;
  return String(proximo).padStart(4, '0');
}

/**
 * Retorna a chave de armazenamento isolada por usuário para trabalhadores
 */
export function getWorkerStorageKey(userId) {
  return userId ? `keiro_trabalhadores_${userId}` : 'keiro_trabalhadores_guest';
}

/**
 * Retorna a chave de armazenamento isolada por usuário para registros de horas
 */
export function getRecordStorageKey(userId) {
  return userId ? `keiro_registros_${userId}` : 'keiro_registros_guest';
}

// Remove chaves legadas globais para evitar contaminação entre contas
try {
  localStorage.removeItem('keiro_mock_trabalhadores');
  localStorage.removeItem('keiro_mock_registros');
} catch (e) { }

/**
 * Inicializa ou carrega a lista de trabalhadores em memória / localStorage para o usuário específico
 */
export function getStoredTrabalhadores(userId) {
  try {
    const key = getWorkerStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw !== null && raw !== '') return JSON.parse(raw);
  } catch (e) { }
  return null;
}

/**
 * Salva trabalhadores no cache local do usuário específico
 */
export function setStoredTrabalhadores(list, userId) {
  try {
    const key = getWorkerStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(list || []));
  } catch (e) { }
}

/**
 * Inicializa ou carrega os registros de horas em memória / localStorage para o usuário específico
 */
export function getStoredRegistros(userId) {
  try {
    const key = getRecordStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw !== null && raw !== '') return JSON.parse(raw);
  } catch (e) { }
  return null;
}

/**
 * Salva registros no cache local do usuário específico
 */
export function setStoredRegistros(records, userId) {
  try {
    const key = getRecordStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(records || {}));
  } catch (e) { }
}

/**
 * Inicializa ou carrega a lista de trabalhadores para um gestor específico.
 * Para novas contas, NUNCA injeta dados fictícios ou de outras contas (inicia 100% limpo).
 */
export async function loadOrInitTrabalhadores(userId, supabase) {
  if (!userId) {
    return { trabalhadores: [], source: 'local' };
  }

  // 1. Tenta buscar do Supabase para este gestor específico
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('trabalhador')
        .select('*')
        .eq('gestor_id', userId)
        .order('codigo_trabalhador', { ascending: true });

      // Se a consulta teve sucesso, salva no cache exclusivo deste usuário e retorna os registros
      if (!error && Array.isArray(data)) {
        setStoredTrabalhadores(data, userId);
        return { trabalhadores: data, source: 'supabase' };
      }
    }
  } catch (e) { }

  // 2. Verifica se temos no cache local exclusivo deste usuário
  const cached = getStoredTrabalhadores(userId);
  if (cached !== null && Array.isArray(cached)) {
    return { trabalhadores: cached, source: 'local' };
  }

  // 3. Primeira execução para este novo usuário: inicializa lista vazia (SEM DADOS DE OUTRAS CONTAS)
  setStoredTrabalhadores([], userId);
  return { trabalhadores: [], source: 'local' };
}

/**
 * Gera registros para trabalhadores do gestor especificado (sob demanda exclusiva)
 */
export function initMockYearRecordsForAll(workers, userId) {
  let allRecords = getStoredRegistros(userId) || {};
  (workers || []).forEach(w => {
    const recs = generateYearRecordsForWorker(w.id, userId, 2025, 11, 12);
    recs.forEach(r => {
      const key = `${r.trabalhador_id}_${r.data}`;
      allRecords[key] = r;
    });
  });
  setStoredRegistros(allRecords, userId);
  return allRecords;
}

/**
 * Carrega registros diários de um trabalhador para o mês e ano especificados
 */
export async function getRegistrosForWorkerMonth(workerId, userId, year, month, supabase) {
  if (!workerId) return [];

  // 1. Tenta Supabase filtrado por trabalhador
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('registro_diario')
        .select('*')
        .eq('trabalhador_id', workerId)
        .eq('ano', year)
        .eq('mes', month);
      if (!error && data && data.length > 0) {
        return data;
      }
    }
  } catch (e) { }

  // 2. Busca local no cache exclusivo deste usuário
  const allRecords = getStoredRegistros(userId) || {};
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const matched = [];
  Object.values(allRecords).forEach(r => {
    if (r.trabalhador_id === workerId && r.data && r.data.startsWith(prefix)) {
      matched.push(r);
    }
  });

  return matched;
}

/**
 * Carrega todos os registros do mês para a equipe do gestor.
 * Se o gestor não tiver trabalhadores cadastrados, retorna imediatamente uma lista vazia.
 */
export async function getAllRegistrosForMonthEquipe(userId, year, month, supabase, workerIds = []) {
  // Se o usuário não tem trabalhadores cadastrados, NUNCA pode ter registros de equipe
  if (!workerIds || workerIds.length === 0) {
    return [];
  }

  // 1. Tenta Supabase com filtro estrito pelos IDs dos trabalhadores deste gestor
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('registro_diario')
        .select('*')
        .in('trabalhador_id', workerIds)
        .eq('ano', year)
        .eq('mes', month);
      if (!error && Array.isArray(data)) {
        return data;
      }
    }
  } catch (e) { }

  // 2. Busca no cache local exclusivo deste gestor
  const allRecords = getStoredRegistros(userId) || {};
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const workerSet = new Set(workerIds);
  const matched = [];
  Object.values(allRecords).forEach(r => {
    if (r.trabalhador_id && workerSet.has(r.trabalhador_id) && r.data && r.data.startsWith(prefix)) {
      matched.push(r);
    }
  });
  return matched;
}

/**
 * Força a regeneração / reset dos funcionários e horas exclusivamente para o gestor solicitante
 */
export function resetAndRegenerateMockData(userId) {
  const novosTrabalhadores = MOCK_TRABALHADORES.map((t, i) => ({
    ...t,
    id: `mock-worker-${i + 1}`,
    gestor_id: userId,
    created_at: new Date().toISOString()
  }));
  setStoredTrabalhadores(novosTrabalhadores, userId);
  const allRecords = {};
  novosTrabalhadores.forEach(w => {
    const recs = generateYearRecordsForWorker(w.id, userId, 2025, 11, 12);
    recs.forEach(r => {
      const key = `${r.trabalhador_id}_${r.data}`;
      allRecords[key] = r;
    });
  });
  setStoredRegistros(allRecords, userId);
  return { trabalhadores: novosTrabalhadores, recordsCount: Object.keys(allRecords).length };
}

/**
 * Exclui um trabalhador e seus registros associados (cache local e Supabase)
 */
export async function excluirTrabalhador(workerId, userId, supabase) {
  if (!workerId) return false;

  // 1. Remove do cache local do gestor
  try {
    const list = getStoredTrabalhadores(userId) || [];
    const updated = list.filter(t => t.id !== workerId);
    setStoredTrabalhadores(updated, userId);

    // Remove registros de horas associados a este trabalhador
    const records = getStoredRegistros(userId);
    if (records) {
      Object.keys(records).forEach(k => {
        if (k.startsWith(workerId + '_') || records[k]?.trabalhador_id === workerId) {
          delete records[k];
        }
      });
      // Se não sobrou nenhum trabalhador, limpa os registros completamente
      if (updated.length === 0) {
        setStoredRegistros({}, userId);
      } else {
        setStoredRegistros(records, userId);
      }
    }
  } catch (e) {
    console.warn('Erro ao excluir do cache local:', e);
  }

  // 2. Se Supabase estiver conectado, remove do banco
  if (supabase) {
    try {
      await supabase.from('registro_diario').delete().eq('trabalhador_id', workerId);
      await supabase.from('trabalhador').delete().eq('id', workerId);
    } catch (e) {
      console.warn('Erro ao excluir do Supabase:', e);
    }
  }

  return true;
}

/**
 * Exclui todos os trabalhadores cadastrados e todas as folhas de ponto/horas associadas do gestor
 */
export async function limparTodosTrabalhadores(userId, supabase) {
  // 1. Limpa o cache local do usuário
  try {
    setStoredTrabalhadores([], userId);
    setStoredRegistros({}, userId);
  } catch (e) {
    console.warn('Erro ao limpar cache local:', e);
  }

  // 2. Se Supabase estiver conectado, exclui todos os registros do gestor
  if (supabase && userId) {
    try {
      const { data: trabs } = await supabase
        .from('trabalhador')
        .select('id')
        .eq('gestor_id', userId);

      if (Array.isArray(trabs) && trabs.length > 0) {
        const ids = trabs.map(t => t.id);
        await supabase.from('registro_diario').delete().in('trabalhador_id', ids);
      }
      await supabase.from('trabalhador').delete().eq('gestor_id', userId);
    } catch (e) {
      console.warn('Erro ao excluir todos os trabalhadores do Supabase:', e);
    }
  }

  return true;
}

