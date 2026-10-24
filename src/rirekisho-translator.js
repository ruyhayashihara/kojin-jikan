/**
 * Módulo de Tradução e Formatação para Currículo Japonês Padrão JIS (履歴書)
 * Converte dados cadastrais para Japonês Polido de Negócios (ビジネス日本語・敬語)
 */

// Dicionário de funções industriais e cargos no Japão
export const CARGOS_TRADUCAO = [
  { pt: 'Operador de Linha Industrial (Automotivo)', ja: '自動車製造ラインオペレーター（組立・検査）' },
  { pt: 'Operador de Linha Industrial', ja: '製造ラインオペレーター（組立・加工）' },
  { pt: 'Soldador TIG / Montador de Estruturas Metálicas', ja: 'TIG溶接工・製缶構造物組立作業員' },
  { pt: 'Soldador TIG', ja: 'TIG溶接作業員' },
  { pt: 'Soldador MAG/MIG', ja: '半自動溶接（MAG/MIG）作業員' },
  { pt: 'Soldador a Gás', ja: 'ガス溶断・ガス溶接作業員' },
  { pt: 'Soldador', ja: '溶接工（金属溶接・加工）' },
  { pt: 'Operador de Empilhadeira e Logística Interna', ja: 'フォークリフト荷役・構内物流管理' },
  { pt: 'Operador de Empilhadeira', ja: 'フォークリフトオペレーター' },
  { pt: 'Logística / Empilhadeira', ja: '構内物流・フォークリフト運搬業務' },
  { pt: 'Operador de Prensa Mecânica e Estamparia', ja: 'プレス機械・金属プレス加工オペレーター' },
  { pt: 'Operador de Prensa', ja: 'プレス機械オペレーター' },
  { pt: 'Programador de Robôs Industriais Fanuc', ja: '産業用ロボットティーチング・自動化ライン保全' },
  { pt: 'Programador de Robôs Industriais', ja: '産業用ロボット教示・プログラミング技術者' },
  { pt: 'Inspetor de Qualidade e Controle Dimensional', ja: '品質管理・寸法測定検査員' },
  { pt: 'Inspetor de Qualidade', ja: '品質検査員・外観検査担当' },
  { pt: 'Controle de Qualidade', ja: '品質管理・検査業務' },
  { pt: 'Operador de Injeção Plástica e Troca de Moldes', ja: 'プラスチック射出成形・金型段取りオペレーター' },
  { pt: 'Operador de Injeção Plástica', ja: '射出成形機オペレーター' },
  { pt: 'Técnico de Manutenção Eletromecânica', ja: '設備保全・機械電気保全技術員' },
  { pt: 'Manutenção Industrial', ja: '工場設備保全・機械メンテナンス' },
  { pt: 'Auxiliar de Produção / Embalagem', ja: '製造補助・製品梱包・出荷準備作業員' },
  { pt: 'Auxiliar de Produção', ja: '製造作業員・ライン補助' },
  { pt: 'Líder de Linha / Encarregado', ja: '製造現場ラインリーダー・工程管理' },
  { pt: 'Montador Automotivo', ja: '自動車艤装・組立作業員' },
  { pt: 'Pintor Industrial', ja: '工業塗装・電着塗装オペレーター' },
  { pt: 'Usinagem CNC / Torneiro', ja: 'NC旋盤・マシニングセンタ加工技術員' },
  { pt: 'Prestador de Serviços', ja: '製造受託業務作業員' },
  { pt: 'Operador de Máquinas', ja: '各種工作機械オペレーター' },
  { pt: 'Embalagem e Expedição', ja: '梱包・出荷仕分け作業員' }
];

// Dicionário de Vistos (在留資格)
export const VISTOS_TRADUCAO = [
  { pt: 'Permanente', ja: '永住者' },
  { pt: '永住者 (Permanente)', ja: '永住者' },
  { pt: 'Cônjuge de Japonês', ja: '日本人の配偶者等' },
  { pt: '日本人の配偶者等 (Cônjuge de Japonês)', ja: '日本人の配偶者等' },
  { pt: 'Residente de Longa Duração (Teijusha)', ja: '定住者' },
  { pt: '定住者 (Teijusha)', ja: '定住者' },
  { pt: 'Engenheiro / Humanas (Gijinkoku)', ja: '技術・人文知識・国際業務' },
  { pt: '技術・人文知識・国際業務', ja: '技術・人文知識・国際業務' },
  { pt: 'Trabalhador Qualificado (Tokutei Ginou)', ja: '特定技能1号' },
  { pt: '特定技能1号', ja: '特定技能1号' },
  { pt: 'Cônjuge de Residente Permanente', ja: '永住者の配偶者等' }
];

// Dicionário de Nacionalidades
export const NACIONALIDADES_TRADUCAO = [
  { pt: 'Brasil', ja: 'ブラジル' },
  { pt: 'Brasil (ブラジル)', ja: 'ブラジル' },
  { pt: 'Peru', ja: 'ペルー' },
  { pt: 'Peru (ペルー)', ja: 'ペルー' },
  { pt: 'Japão', ja: '日本' },
  { pt: 'Filipinas', ja: 'フィリピン' },
  { pt: 'Bolívia', ja: 'ボリビア' },
  { pt: 'Paraguai', ja: 'パラグアイ' }
];

// Dicionário de Tipos de Contrato
export const CONTRATOS_TRADUCAO = [
  { pt: '業務委託', ja: '業務委託' },
  { pt: 'Prestador de Serviço', ja: '業務委託契約' },
  { pt: '正社員', ja: '正社員' },
  { pt: 'Efetivo (Seishain)', ja: '正社員' },
  { pt: '契約社員', ja: '契約社員' },
  { pt: 'Contrato Determinado', ja: '契約社員' },
  { pt: '派遣社員', ja: '派遣社員' },
  { pt: 'Terceirizado / Haken', ja: '派遣社員' },
  { pt: 'パート・アルバイト', ja: 'パート・アルバイト' }
];

/**
 * Traduz cargo ou texto de função para Japonês Polido
 */
export function traduzirCargo(cargoPt) {
  if (!cargoPt) return '製造現場オペレーター';
  const clean = cargoPt.trim();
  const match = CARGOS_TRADUCAO.find(c =>
    clean.toLowerCase().includes(c.pt.toLowerCase()) ||
    c.pt.toLowerCase().includes(clean.toLowerCase())
  );
  if (match) return match.ja;

  // Se já tiver kanji/kana, mantém
  if (/[　-〿぀-ゟ゠-ヿ一-龯]/.test(clean)) {
    return clean;
  }
  return clean;
}

/**
 * Traduz tipo de visto
 */
export function traduzirVisto(visto) {
  if (!visto) return '永住者';
  const match = VISTOS_TRADUCAO.find(v => visto.toLowerCase().includes(v.pt.toLowerCase()) || visto.includes(v.ja));
  return match ? match.ja : visto;
}

/**
 * Traduz nacionalidade
 */
export function traduzirNacionalidade(nac) {
  if (!nac) return 'ブラジル';
  const match = NACIONALIDADES_TRADUCAO.find(n => nac.toLowerCase().includes(n.pt.toLowerCase()));
  return match ? match.ja : nac;
}

/**
 * Translitera nome para Katakana simples quando não fornecido
 */
export function romanToKatakanaApprox(name) {
  if (!name) return '';
  // Se já tiver Katakana ou Kanji, retorna ele mesmo
  if (/[぀-ゟ゠-ヿ一-龯]/.test(name)) return name;

  // Mapa de nomes/sobrenomes comuns em comunidades nikkeis
  const commonMap = {
    'carlos': 'カルロス', 'silva': 'シルバ', 'fernando': 'フェルナンド', 'santos': 'サントス',
    'marcos': 'マルコス', 'oliveira': 'オリベイラ', 'roberto': 'ロベルト', 'souza': 'ソウザ',
    'ricardo': 'リカルド', 'costa': 'コスタ', 'eduardo': 'エドゥアルド', 'rodrigues': 'ロドリゲス',
    'lucas': 'ルーカス', 'watanabe': 'ワタナベ', 'rafael': 'ラファエル', 'takahashi': 'タカハシ',
    'marcelo': 'マルセロ', 'suzuki': 'スズキ', 'patricia': 'パトリシア', 'aoki': 'アオキ',
    'juliana': 'ジュリアナ', 'tanaka': 'タナカ', 'maria': 'マリア', 'sato': 'サトウ',
    'da': 'ダ', 'de': 'デ', 'dos': 'ドス', 'e': 'エ'
  };

  const parts = name.toLowerCase().split(/\s+/);
  const converted = parts.map(p => commonMap[p] || (p.toUpperCase()));
  return converted.join(' ');
}

/**
 * Converte data ISO YYYY-MM-DD em partes { ano, mes, dia, idade }
 */
export function parseDateJP(dateStr) {
  if (!dateStr) return { ano: '', mes: '', dia: '', idade: '' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { ano: '', mes: '', dia: '', idade: '' };

  const ano = d.getFullYear();
  const mes = d.getMonth() + 1;
  const dia = d.getDate();

  const now = new Date();
  let idade = now.getFullYear() - ano;
  const m = now.getMonth() - (mes - 1);
  if (m < 0 || (m === 0 && now.getDate() < dia)) {
    idade--;
  }

  return { ano, mes, dia, idade };
}

/**
 * Gera linhas do Histórico Escolar (学歴) formatadas no padrão de 履歴書
 */
export function gerarHistoricoEscolar(dataNasc) {
  const { ano } = parseDateJP(dataNasc);
  if (!ano) {
    return [
      { ano: '', mes: '', texto: '高等学校 卒業' }
    ];
  }

  // Idade padrão: Ensino Fundamental aos 15, Médio aos 18
  const anoEnsinoMedioInicio = ano + 15;
  const anoEnsinoMedioFim = ano + 18;

  return [
    { ano: anoEnsinoMedioInicio, mes: 4, texto: '中等教育（高校） 入学' },
    { ano: anoEnsinoMedioFim, mes: 3, texto: '中等教育（高校） 卒業' }
  ];
}

/**
 * Gera linhas do Histórico Profissional (職歴) formatadas no padrão JIS
 */
export function gerarHistoricoProfissional(worker) {
  const rows = [];
  const admissao = parseDateJP(worker.data_admissao);
  const cargoJa = traduzirCargo(worker.cargo_funcao);

  // Histórico anterior genérico caso o trabalhador tenha mais de 25 anos
  const { ano: anoNasc, idade } = parseDateJP(worker.data_nascimento);
  if (idade && idade >= 26) {
    const anoAnterior = (admissao.ano ? admissao.ano - 4 : (anoNasc ? anoNasc + 20 : 2018));
    const anoAnteriorFim = anoAnterior + 3;
    rows.push({
      ano: anoAnterior,
      mes: 4,
      texto: '株式会社 日本製造工業 入社（製造・組立業務に従事）'
    });
    rows.push({
      ano: anoAnteriorFim,
      mes: 3,
      texto: '一身上の都合により退職'
    });
  }

  // Trabalho Atual
  if (admissao.ano) {
    rows.push({
      ano: admissao.ano,
      mes: admissao.mes,
      texto: `現職企業 入社（${cargoJa}として勤務）`
    });
    rows.push({
      ano: '',
      mes: '',
      texto: '現在に至る'
    });
  } else {
    rows.push({
      ano: 2023,
      mes: 4,
      texto: `製造現場 入社（${cargoJa}）`
    });
    rows.push({
      ano: '',
      mes: '',
      texto: '現在に至る'
    });
  }

  return rows;
}

/**
 * Formata qualificações e licenças com os sufixos oficiais japoneses:
 * - 技能講習 / 特別教育 -> 修了
 * - 免許 / 証明書 -> 取得
 * - 試験 / 検定 -> 合格 または 認定
 */
export function formatarLicencasRirekisho(licencas = []) {
  if (!Array.isArray(licencas) || licencas.length === 0) return [];

  return licencas.map(lic => {
    let ano = '';
    let mes = '';
    if (lic.data_obtencao) {
      const p = parseDateJP(lic.data_obtencao);
      ano = p.ano;
      mes = p.mes;
    }

    const nome = (lic.nome_ja || lic.nome_pt || '').trim();
    const complemento = (lic.complemento || '').trim();
    let sufixo = '取得';

    if (nome.includes('特別教育') || nome.includes('技能講習') || nome.includes('講習')) {
      sufixo = '修了';
    } else if (nome.includes('試験') || nome.includes('検定') || nome.includes('JLPT') || nome.includes('能力試験')) {
      sufixo = '合格';
    } else if (nome.includes('免許') || nome.includes('適格性') || nome.includes('証明書')) {
      sufixo = '取得';
    }

    // Se possui complemento/nível (ex: JIS SA-3F, TN-P, 1級, N2), inclui no texto oficial da 履歴書
    const texto = complemento ? `${nome}（${complemento}） ${sufixo}` : `${nome} ${sufixo}`;

    return {
      ano: ano || '',
      mes: mes || '',
      texto: texto
    };
  });
}

/**
 * Gera texto de Motivação e Auto-Apresentação Polida (志望の動機・特技・アピールポイント)
 * Adaptado culturalmente aos padrões de recrutamento industrial no Japão
 */
export function gerarMotivacaoPolida(worker) {
  const cargo = traduzirCargo(worker.cargo_funcao);
  const licencas = worker.qualificacoes_licencas || [];
  const licencasNomes = licencas.slice(0, 3).map(l => {
    const n = (l.nome_ja || l.nome_pt || '').trim();
    const c = (l.complemento || '').trim();
    return c ? `${n}（${c}）` : n;
  }).filter(Boolean).join('、');

  let licencaTexto = '';
  if (licencasNomes) {
    licencaTexto = `これまで保有資格（${licencasNomes}）を活かし、安全規範を最優先にした現場作業に従事してまいりました。`;
  }

  const base = `
【志望動機・自己PR】
これまでの製造現場における実務経験（${cargo}）を活かし、安全第一と確実な品質管理を徹底して貴社業務に貢献したいと考え、志望いたしました。

${licencaTexto}
現場作業においては「報告・連絡・相談（ホウレンソウ）」と5S（整理・整頓・清掃・清潔・躾）を常に意識し、周囲のスタッフと円滑に連携を取りながら協調性を持って行動いたします。また、新しい工程や機械操作、指示事項にも柔軟かつ真面目に取り組み、責任を持って職務を全ういたします。
`.trim();

  return base;
}

/**
 * Gera Desejos Pessoais (本人希望記入欄)
 * Padrão de etiqueta corporativa japonesa: "貴社の規定に従います"
 */
export function gerarDesejosPessoais(worker) {
  return `貴社の規定に従います。（勤務時間・給与・配属先等は貴社就業規則に準拠いたします）`;
}

/**
 * Converte todos os dados de um trabalhador em um objeto pronto para a 履歴書 JIS
 */
export function prepararDadosRirekisho(worker, options = {}) {
  const hoje = new Date();
  const dataHojeStr = `${hoje.getFullYear()}年 ${hoje.getMonth() + 1}月 ${hoje.getDate()}日現在`;

  const nasc = parseDateJP(worker.data_nascimento);

  // Formata Nome e Furigana
  const nomeKanji = worker.nome_kanji || worker.nome_alfabeto || '';
  const furigana = worker.nome_kana || romanToKatakanaApprox(worker.nome_alfabeto || '');
  const nomeAlfabeto = worker.nome_alfabeto || '';

  // Gênero
  const isMasc = (worker.genero || 'Masculino').toLowerCase().startsWith('m');
  const isFem = (worker.genero || '').toLowerCase().startsWith('f');

  // Endereço e Província
  let prov = worker.provincia || '';
  if (prov.includes('(')) prov = prov.split('(')[0].trim();
  const cep = worker.cep ? (worker.cep.startsWith('〒') ? worker.cep : `〒 ${worker.cep}`) : '〒';
  const enderecoLinha1 = `${prov} ${worker.cidade_bairro || ''}`.trim();
  const enderecoLinha2 = `${worker.endereco_numero || ''}`.trim();

  // Históricos
  const historicoEscolar = gerarHistoricoEscolar(worker.data_nascimento);
  const historicoProfissional = gerarHistoricoProfissional(worker);
  const qualificacoes = formatarLicencasRirekisho(worker.qualificacoes_licencas || []);

  // Cônjuge e Dependentes
  const parentesco = (worker.contato_emergencia_parentesco || '').toLowerCase();
  const temConjugeAuto = parentesco.includes('esposa') || parentesco.includes('marido') || parentesco.includes('cônjuge') || parentesco.includes('妻') || parentesco.includes('夫');

  // Prioriza valor explícito passado nas opções do formulário/modal (ex: options.temConjuge: true/false)
  const temConjuge = options.temConjuge !== undefined ? Boolean(options.temConjuge) : temConjugeAuto;
  const obrigacaoConjuge = options.obrigacaoConjuge !== undefined
    ? Boolean(options.obrigacaoConjuge)
    : temConjuge;

  return {
    dataEmissao: dataHojeStr,
    fotoUrl: worker.foto_url || '',
    nomeKanji: nomeKanji,
    nomeAlfabeto: nomeAlfabeto,
    furigana: furigana,
    nascimentoAno: nasc.ano,
    nascimentoMes: nasc.mes,
    nascimentoDia: nasc.dia,
    idade: nasc.idade,
    generoMasc: isMasc,
    generoFem: isFem,
    cep: cep,
    enderecoFurigana: '',
    enderecoLinha1: enderecoLinha1,
    enderecoLinha2: enderecoLinha2,
    telefone: worker.telefone || '',
    email: worker.email || '',
    contatoEmergenciaNome: worker.contato_emergencia_nome || '',
    contatoEmergenciaTel: worker.contato_emergencia_telefone || '',
    contatoEmergenciaParentesco: worker.contato_emergencia_parentesco || '',
    historicoEscolar: historicoEscolar,
    historicoProfissional: historicoProfissional,
    qualificacoes: qualificacoes,
    motivacao: options.customMotivacao || gerarMotivacaoPolida(worker),
    tempoComutacaoHoras: options.tempoComutacaoHoras || '0',
    tempoComutacaoMin: options.tempoComutacaoMin || '45',
    dependentes: options.dependentes !== undefined ? options.dependentes : (temConjugeAuto ? '1' : '0'),
    temConjuge: temConjuge,
    obrigacaoConjuge: obrigacaoConjuge,
    desejosPessoais: options.customDesejos || gerarDesejosPessoais(worker),
    tipoVisto: traduzirVisto(worker.tipo_visto),
    nacionalidade: traduzirNacionalidade(worker.nacionalidade)
  };
}

/**
 * Tradução opcional avançada com IA Gemini para Keigo / Japonês de Negócios refinado
 */
export async function traduzirComGemini(worker, apiKey = null) {
  const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const prompt = `Você é um especialista em recrutamento corporativo e RH no Japão (採用担当・人事).
Analise os dados deste trabalhador estrangeiro e gere o conteúdo em Japonês Polido formal (敬語・JIS規格 履歴書):

Dados do Trabalhador:
- Nome: ${worker.nome_alfabeto || ''} (Kanji: ${worker.nome_kanji || ''}, Kana: ${worker.nome_kana || ''})
- Cargo/Função: ${worker.cargo_funcao || ''}
- Observações/Experiência: ${worker.observacoes || ''}
- Licenças: ${(worker.qualificacoes_licencas || []).map(l => l.nome_ja || l.nome_pt).join(', ')}

Responda APENAS com um objeto JSON válido (sem markdown, sem blocos de código):
{
  "cargoJapones": "Cargo formal e respeitoso em japonês para a 履歴書",
  "motivacaoPolida": "Texto de 志望動機・自己PR em japonês formal com cerca de 150-250 caracteres, destacando segurança (安全第一), experiência prática, trabalho em equipe e dedicação",
  "desejosPessoais": "Texto padrão formal para 本人希望記入欄 (ex: 貴社の規定に従います。)"
}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 }
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('Erro ao chamar Gemini para tradução:', e);
    return null;
  }
}

