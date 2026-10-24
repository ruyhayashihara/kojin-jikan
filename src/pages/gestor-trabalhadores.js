import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';
import { escapeHtml } from '../security.js';
import {
  loadOrInitTrabalhadores,
  resetAndRegenerateMockData,
  getStoredTrabalhadores,
  setStoredTrabalhadores,
  excluirTrabalhador,
  limparTodosTrabalhadores,
  gerarProximoIdTrabalhador
} from '../mock-data.js';
import { prepararDadosRirekisho, traduzirCargo, gerarMotivacaoPolida, traduzirComGemini, romanToKatakanaApprox } from '../rirekisho-translator.js';
import { imprimirRirekisho } from '../rirekisho-pdf.js';
import { obterStatusPlano, isUsuarioAdmin } from '../licencas-service.js';
import { openModalAtivacao } from '../modal-ativacao.js';

// Lista das 47 províncias do Japão (都道府県)
const PROVINCIAS_JAPAO = [
  '愛知県 (Aichi)', '静岡県 (Shizuoka)', '三重県 (Mie)', '岐阜県 (Gifu)', '群馬県 (Gunma)',
  '神奈川県 (Kanagawa)', '埼玉県 (Saitama)', '栃木県 (Tochigi)', '大阪府 (Osaka)', '東京都 (Tokyo)',
  '長野県 (Nagano)', '滋賀県 (Shiga)', '兵庫県 (Hyogo)', '茨城県 (Ibaraki)', '千葉県 (Chiba)',
  '京都府 (Kyoto)', '広島県 (Hiroshima)', '福岡県 (Fukuoka)', '北海道 (Hokkaido)', '青森県 (Aomori)',
  '岩手県 (Iwate)', '宮城県 (Miyagi)', '秋田県 (Akita)', '山形県 (Yamagata)', '福島県 (Fukushima)',
  '新潟県 (Niigata)', '富山県 (Toyama)', '石川県 (Ishikawa)', '福井県 (Fukui)', '山梨県 (Yamanashi)',
  '奈良県 (Nara)', '和歌山県 (Wakayama)', '鳥取県 (Tottori)', '島根県 (Shimane)', '岡山県 (Okayama)',
  '山口県 (Yamaguchi)', '徳島県 (Tokushima)', '香川県 (Kagawa)', '愛媛県 (Ehime)', '高知県 (Kochi)',
  '佐賀県 (Saga)', '長崎県 (Nagasaki)', '熊本県 (Kumamoto)', '大分県 (Oita)', '宮崎県 (Miyazaki)',
  '鹿児島県 (Kagoshima)', '沖縄県 (Okinawa)'
];

const TIPOS_VISTO = [
  '永住者 (Visto Permanente)',
  '定住者 (Visto de Longo Prazo / Teijusha)',
  '日本人の配偶者等 (Cônjuge de Japonês)',
  '永住者の配偶者等 (Cônjuge de Permanente)',
  '特定技能1号 (Habilidades Específicas 1)',
  '特定技能2号 (Habilidades Específicas 2)',
  '技術・人文知識・国際業務 (Engenharia / Especialista)',
  '技能 (Habilidades Técnicas / Chef)',
  '技能実習 (Estágio Técnico)',
  '家族滞在 (Dependente Familiar - 28h/sem)',
  '留学 (Estudante - 28h/sem)',
  '特別永住者 (Residente Permanente Especial)',
  'Outro (その他)'
];

// Categorias e Licenças / Certificações Oficiais exigidas pelas indústrias no Japão (免許・資格・特別教育)
export const CATEGORIAS_LICENCAS = [
  {
    id: 'cargas',
    nome: 'Cargas, Guindastes & Elevação (玉掛け・クレーン・フォークリフト)',
    icon: '🏗️',
    licencas: [
      { id: 'tamagake_ginou', nome_ja: '玉掛け技能講習 (1t以上)', nome_pt: 'Tamagake (Lingamento de Cargas 1t ou mais)' },
      { id: 'tamagake_toku', nome_ja: '玉掛け特別教育 (1t未満)', nome_pt: 'Tamagake Leve (Lingamento de Cargas até 1t)' },
      { id: 'kuren_yukajou', nome_ja: '床上操作式クレーン運転技能講習 (5t以上)', nome_pt: 'Ponte Rolante / Kuren de Chão (5t ou mais)' },
      { id: 'kuren_kogata', nome_ja: '小型移動式クレーン運転技能講習 (1t〜5t未満)', nome_pt: 'Guindaste Móvel / Kuren Leve (1t a 5t)' },
      { id: 'kuren_menkyo', nome_ja: 'クレーン・デリック運転士免許 (限定なし / 各種)', nome_pt: 'Licença Oficial de Operador de Guindaste/Derrick' },
      { id: 'forklift_ginou', nome_ja: 'フォークリフト運転技能講習 (1t以上)', nome_pt: 'Empilhadeira / Forklift (1t ou mais)' },
      { id: 'forklift_toku', nome_ja: 'フォークリフト特別教育 (1t未満)', nome_pt: 'Empilhadeira Leve (até 1t)' },
      { id: 'kousho_ginou', nome_ja: '高所作業車運転技能講習 (10m以上)', nome_pt: 'Plataforma Elevatória (10m ou mais)' },
      { id: 'kousho_toku', nome_ja: '高所作業車特別教育 (10m未満)', nome_pt: 'Plataforma Elevatória (até 10m)' }
    ]
  },
  {
    id: 'solda',
    nome: 'Soldagem no Japão (溶接資格・JWES / JIS / 特別教育)',
    icon: '⚡',
    licencas: [
      { id: 'gas_yosetsu', nome_ja: 'ガス溶接技能講習', nome_pt: 'Solda a Gás (Gas Welding)' },
      { id: 'arc_yosetsu', nome_ja: 'アーク溶接等の業務に係る特別教育', nome_pt: 'Solda Elétrica / Arco Manual (Arc Welding)' },
      { id: 'hanjido_yosetsu', nome_ja: '半自動溶接 (MAG / MIG / CO2溶接)', nome_pt: 'Solda Semi-automática MAG/MIG/CO2' },
      { id: 'tig_yosetsu', nome_ja: 'TIG溶接 (アルゴン溶接 - ステンレス・アルミ)', nome_pt: 'Solda TIG / Argônio (Inox e Alumínio)' },
      { id: 'jis_yosetsu', nome_ja: 'JIS溶接技能者資格 (JIS Z 3801 / 3841 基本級・専門級)', nome_pt: 'Certificação JIS de Soldador Oficial' },
      { id: 'gas_setsudan', nome_ja: 'ガス切断作業特別教育', nome_pt: 'Corte a Gás (Gas Cutting)' },
      { id: 'spot_yosetsu', nome_ja: 'スポット溶接・抵抗溶接特別教育', nome_pt: 'Solda a Ponto / Resistência' }
    ]
  },
  {
    id: 'veiculos',
    nome: 'Habilitação de Veículos & Trânsito (自動車運転免許・二輪)',
    icon: '🚗',
    licencas: [
      { id: 'cnh_futsu_at', nome_ja: '普通自動車第一種運転免許 (AT限定)', nome_pt: 'Habilitação Carro Passeio Automático (AT)' },
      { id: 'cnh_futsu_mt', nome_ja: '普通自動車第一種運転免許 (MT)', nome_pt: 'Habilitação Carro Passeio Manual (MT)' },
      { id: 'cnh_junchugata', nome_ja: '準中型自動車免許 (準中型 7.5t未満)', nome_pt: 'Caminhão Leve (até 7.5t)' },
      { id: 'cnh_chugata', nome_ja: '中型自動車免許 (中型 / 中型8t限定)', nome_pt: 'Caminhão Médio (até 11t)' },
      { id: 'cnh_ogata', nome_ja: '大型自動車免許 (大型)', nome_pt: 'Caminhão Pesado / Carreta' },
      { id: 'cnh_daitoku', nome_ja: '大型特殊自動車免許 (大特 - ショベル等)', nome_pt: 'Veículos Especiais / Pá Carregadeira' },
      { id: 'cnh_kenin', nome_ja: '牽引自動車免許 (けん引)', nome_pt: 'Reboque / Trailer (Ken-in)' },
      { id: 'cnh_moto_futsu', nome_ja: '普通自動二輪車免許 (400cc以下)', nome_pt: 'Moto até 400cc' },
      { id: 'cnh_moto_ogata', nome_ja: '大型自動二輪車免許 (400cc超)', nome_pt: 'Moto Grande (Acima de 400cc)' },
      { id: 'cnh_gentsuki', nome_ja: '原動機付自転車免許 (原付 50cc)', nome_pt: 'Ciclomotor 50cc' }
    ]
  },
  {
    id: 'construcao_maquinas',
    nome: 'Construção Civil & Terraplanagem (建設機械・重機・足場)',
    icon: '🚜',
    licencas: [
      { id: 'sharyou_seichi', nome_ja: '車両系建設機械 (整地・運搬・積込・掘削用 - ユンボ)', nome_pt: 'Escavadeira Hidráulica / Yumbo / Pá' },
      { id: 'sharyou_kaitai', nome_ja: '車両系建設機械 (解体用 - ブレーカー等)', nome_pt: 'Máquinas Pesadas de Demolição' },
      { id: 'ashiba_toku', nome_ja: '足場の組立て等特別教育', nome_pt: 'Montagem e Desmontagem de Andaimes' },
      { id: 'full_harness', nome_ja: 'フルハーネス型墜落制止用器具特別教育', nome_pt: 'Cinto de Segurança Tipo Paraquedista (Full Harness)' },
      { id: 'roller_toku', nome_ja: 'ローラー運転業務特別教育', nome_pt: 'Rolo Compactador' },
      { id: 'marunoko_toku', nome_ja: '丸のこ等取扱い特別教育', nome_pt: 'Serra Circular e Disco de Corte' }
    ]
  },
  {
    id: 'fabrica_seguranca',
    nome: 'Fábrica, Indústria & Segurança do Trabalho (製造・機械・安全衛生)',
    icon: '🏭',
    licencas: [
      { id: 'press_kanagata', nome_ja: 'プレス機械作業主任者 / 金型取扱特別教育', nome_pt: 'Prensa Mecânica e Troca de Molde' },
      { id: 'kensaku_toishi', nome_ja: '研削といし取替え等特別教育 (自由研削・機械研削)', nome_pt: 'Esmeril e Troca de Rebolo' },
      { id: 'sangyou_robot', nome_ja: '産業用ロボット教示等特別教育', nome_pt: 'Operação e Programação de Robôs Industriais' },
      { id: 'tokutei_kagaku', nome_ja: '特定化学物質作業主任者', nome_pt: 'Substâncias Químicas Especiais' },
      { id: 'yuuki_youzai', nome_ja: '有機溶剤作業主任者', nome_pt: 'Manipulação de Solventes Orgânicos' },
      { id: 'sanketsu', nome_ja: '酸素欠乏・硫化水素危険作業主任者', nome_pt: 'Trabalho em Locais Confinados / Asfixia' },
      { id: 'boiler_toriatsukai', nome_ja: 'ボイラー取扱技能講習 / ボイラー技士', nome_pt: 'Operador de Caldeira (Boiler)' },
      { id: 'eisei_kanrisha', nome_ja: '第一種・第二種 衛生管理者', nome_pt: 'Gestor de Higiene e Segurança Ocupacional' }
    ]
  },
  {
    id: 'idiomas_gestao',
    nome: 'Idiomas & Gestão (語学・IT・管理)',
    icon: '📚',
    licencas: [
      { id: 'jlpt_n1', nome_ja: '日本語能力試験 N1 (JLPT N1)', nome_pt: 'Proficiência em Língua Japonesa N1' },
      { id: 'jlpt_n2', nome_ja: '日本語能力試験 N2 (JLPT N2)', nome_pt: 'Proficiência em Língua Japonesa N2' },
      { id: 'jlpt_n3', nome_ja: '日本語能力試験 N3 (JLPT N3)', nome_pt: 'Proficiência em Língua Japonesa N3' },
      { id: 'jlpt_n4', nome_ja: '日本語能力試験 N4 (JLPT N4)', nome_pt: 'Proficiência em Língua Japonesa N4' },
      { id: 'bousai_kanrisha', nome_ja: '防火・防災管理者', nome_pt: 'Gestor de Prevenção e Combate a Incêndios' }
    ]
  }
];

export async function renderGestorTrabalhadores(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login?role=gestor'); return; }

  sessionStorage.setItem('keiro_active_role', 'gestor');

  // Carrega trabalhadores deste gestor (ou inicializa os 10 fictícios)
  let { trabalhadores } = await loadOrInitTrabalhadores(user.id, supabase);

  // Obtém status da licença e cotas anti-fraude
  const statusPlano = await obterStatusPlano(user, 'gestor', trabalhadores.length);

  // Parâmetros de rota (ex: #/gestor-trabalhadores?editar=UUID ou #/gestor-trabalhadores?novo=1)
  const hashParts = window.location.hash.split('?');
  const urlParams = new URLSearchParams(hashParts[1] || '');
  const editId = urlParams.get('editar') || urlParams.get('id');
  const isNovoDirect = urlParams.get('novo') === '1' || window.location.hash.includes('/gestor-trabalhador-form');

  app.innerHTML = `
    ${renderSidebar('gestor-trabalhadores')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container page-wide">

          <!-- ========================================== -->
          <!-- VISÃO 1: LISTAGEM DE TRABALHADORES         -->
          <!-- ========================================== -->
          <div id="view-lista-trabalhadores" style="${(editId || isNovoDirect) ? 'display: none;' : 'display: block;'}">
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                  <h1>Gestão de Trabalhadores</h1>
                  <span class="badge-role-gestor">労働者名簿</span>
                </div>
                <p>Ficha cadastral completa baseada no padrão de contratação japonês (履歴書・雇用管理)</p>
              </div>
              <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                ${trabalhadores.length > 0 ? `
                  <button type="button" class="btn btn-outline" id="btn-limpar-todos-trabalhadores" style="display: inline-flex; align-items: center; gap: 0.4rem; color: var(--color-danger); border-color: var(--color-danger);" title="Excluir todos os cadastros e registros de horas">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    <span>Excluir Todos (${trabalhadores.length})</span>
                  </button>
                ` : ''}
                <button type="button" class="btn btn-primary" id="btn-novo-trabalhador" style="display: inline-flex; align-items: center; gap: 0.4rem; ${statusPlano.atingiuLimite && !statusPlano.isPro ? 'border-color: #ef4444; background: #dc2626;' : ''}">
                  ${statusPlano.atingiuLimite && !statusPlano.isPro ? '🔒' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
                  <span>Cadastrar Novo Trabalhador (履歴書)</span>
                </button>
              </div>
            </div>

            <!-- Banner de Controle de Cotas e Licença (Padronizado Claro/Escuro) -->
            <div id="quota-banner-gestor" class="plan-status-card ${statusPlano.isAdmin ? 'plan-admin' : (statusPlano.isPro ? 'plan-pro' : (statusPlano.atingiuLimite ? 'plan-limit' : 'plan-free'))}">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem;">${statusPlano.isPro ? '👑' : (statusPlano.atingiuLimite ? '🔒' : '📊')}</span>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span class="plan-card-title">${escapeHtml(statusPlano.nomePlano)}</span>
                    <span class="${statusPlano.isPro ? 'badge-plan-pro' : (statusPlano.atingiuLimite ? 'badge-plan-limit' : 'badge-plan-free')}">
                      ${statusPlano.isAdmin ? '👑 Acesso Total Administrador' : (statusPlano.isPro ? 'Cadastros Ilimitados Liberados' : `${statusPlano.totalCadastrados} de ${statusPlano.limite} cadastros utilizados`)}
                    </span>
                  </div>
                  <div class="plan-card-desc">
                    ${statusPlano.isAdmin
                      ? `<strong style="color: var(--color-primary);">Conta de Administrador do Sistema</strong> — Acesso total e cadastros ilimitados liberados sem necessidade de chave.`
                      : (statusPlano.isPro
                        ? `Chave ativa: <code class="plan-code-badge">${escapeHtml(statusPlano.chaveCodigo || 'PRO-ILIMITADO')}</code> (Uso Único Anti-Fraude Vinculado)`
                        : (statusPlano.atingiuLimite
                          ? `<strong style="color: var(--color-danger);">Limite de 5 trabalhadores atingido!</strong> Para cadastrar mais trabalhadores, ative sua chave de liberação.`
                          : `Você tem <strong>${statusPlano.restantes}</strong> cadastro(s) livre(s) restante(s) na sua conta de gestor.`))}
                  </div>
                </div>
              </div>

              <div>
                ${statusPlano.isPro ? `
                  ${isUsuarioAdmin(user) ? `
                    <a href="#/admin-licencas" class="btn btn-outline" style="font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                      <span>⚙️ Gerenciar Licenças</span>
                    </a>
                  ` : `
                    <span class="badge-plan-pro" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">
                      <span>✓ Acesso PRO Ilimitado</span>
                    </span>
                  `}
                ` : `
                  <button type="button" class="btn ${statusPlano.atingiuLimite ? 'btn-danger' : 'btn-primary'}" id="btn-ativar-chave-banner" style="font-size: 0.82rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                    <span>🔑 Inserir Chave de Liberação</span>
                  </button>
                `}
              </div>
            </div>

            <!-- Filtros de Busca -->
            <div class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
              <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                <div style="flex: 1; min-width: 240px;" class="form-group">
                  <input type="text" id="filtro-busca" placeholder="🔍 Buscar por nome, ID (0001), zairyu card..." style="margin: 0;" />
                </div>
                <div style="width: 200px;" class="form-group">
                  <select id="filtro-status" style="margin: 0;">
                    <option value="todos">Todos os Trabalhadores</option>
                    <option value="ativos">Apenas Ativos</option>
                    <option value="inativos">Inativos</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Tabela de Trabalhadores -->
            <div class="card">
              <div style="overflow-x: auto;">
                <table class="summary-table" style="width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 90px;">ID</th>
                      <th>Nome Completo (氏名)</th>
                      <th>Visto & Validade</th>
                      <th>Regime / Cargo</th>
                      <th class="col-num">Taxa Base</th>
                      <th>Contato</th>
                      <th style="text-align: center; width: 160px;">Ações</th>
                    </tr>
                  </thead>
                  <tbody id="lista-trabalhadores-body">
                    ${renderWorkerRows(trabalhadores)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- ========================================== -->
          <!-- VISÃO 2: FORMULÁRIO DEDICADO EM PÁGINA     -->
          <!-- Cadastrar Novo / Editar Trabalhador        -->
          <!-- ========================================== -->
          <div id="view-form-trabalhador" style="${(editId || isNovoDirect) ? 'display: block;' : 'display: none;'}">

            <!-- Cabeçalho da Ficha -->
            <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
              <div>
                <button type="button" id="btn-voltar-lista" class="btn btn-outline" style="margin-bottom: 0.85rem; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; font-size: 0.85rem;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  <span>← Voltar para Lista de Trabalhadores (労働者名簿)</span>
                </button>
                <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                  <h1 id="form-page-title" style="margin: 0; font-size: 1.5rem;">Cadastrar Novo Trabalhador (履歴書)</h1>
                  <span class="badge-role-gestor" id="form-page-badge">新規登録</span>
                </div>
                <p id="form-page-subtitle" style="margin-top: 0.25rem; color: #94a3b8; font-size: 0.88rem;">
                  Ficha cadastral completa baseada no padrão de contratação japonês (履歴書・雇用管理)
                </p>
              </div>
              <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-outline btn-cancel-action">Cancelar</button>
                <button type="button" class="btn btn-outline" id="btn-export-rirekisho-form" style="display: inline-flex; align-items: center; gap: 0.4rem; border-color: #0284c7; color: #0284c7;" title="Exportar Currículo Japonês (履歴書 JIS A4)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span>Exportar 履歴書 (PDF)</span>
                </button>
                <button type="button" class="btn btn-outline" id="btn-excluir-trabalhador-form-topo" style="display: none; align-items: center; gap: 0.4rem; border-color: #ef4444; color: #ef4444;" title="Excluir este cadastro de trabalhador">
                  <span>🗑️ Excluir</span>
                </button>
                <button type="button" class="btn btn-primary" id="btn-salvar-topo" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  <span>Salvar Ficha Cadastral</span>
                </button>
              </div>
            </div>

            <!-- Avisos e Feedback -->
            <div id="form-error" class="alert alert-error" style="display: none; margin-bottom: 1.25rem;"></div>
            <div id="form-success" class="alert alert-success" style="display: none; margin-bottom: 1.25rem;"></div>

            <!-- Formulário da Ficha (履歴書) -->
            <form id="form-trabalhador" autocomplete="off">
              <input type="hidden" id="trab-id" value="" />

              <!-- SEÇÃO 1: Identificação Pessoal -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>👤</span>
                    <span>1. Identificação Pessoal & Dados Básicos</span>
                    <span class="rirekisho-card-subtitle">(基本情報・本人確認)</span>
                  </h2>
                  <span class="rirekisho-pill">Obrigatório</span>
                </div>

                <div class="form-grid-3" style="margin-bottom: 1rem;">
                  <div class="form-group">
                    <label for="trab-codigo">ID do Trabalhador (Automático) *</label>
                    <input type="text" id="trab-codigo" placeholder="0001" required readonly style="font-family: monospace; font-weight: 700; color: var(--color-primary); background: var(--color-bg); cursor: not-allowed;" title="ID gerado automaticamente em ordem sequencial (0001, 0002...)" />
                  </div>
                  <div class="form-group">
                    <label for="trab-nome-alfabeto">Nome Completo (Romaji / Passaporte) *</label>
                    <input type="text" id="trab-nome-alfabeto" placeholder="Ex: SILVA SANTOS CARLOS" required />
                  </div>
                  <div class="form-group">
                    <label for="trab-nome-kanji">Nome em Kanji (氏名・漢字)</label>
                    <input type="text" id="trab-nome-kanji" placeholder="Ex: シルバ カルロス ou 田中 太郎" />
                  </div>
                </div>

                <div class="form-grid-4">
                  <div class="form-group">
                    <label for="trab-nome-kana">Nome em Katakana (フリガナ)</label>
                    <input type="text" id="trab-nome-kana" placeholder="シルバ サントス カルロス" />
                  </div>
                  <div class="form-group">
                    <label for="trab-nascimento">Nascimento (生年月日)</label>
                    <input type="date" id="trab-nascimento" />
                  </div>
                  <div class="form-group">
                    <label for="trab-genero">Gênero (性別)</label>
                    <select id="trab-genero">
                      <option value="Masculino">Masculino (男)</option>
                      <option value="Feminino">Feminino (女)</option>
                      <option value="Outro">Outro (その他)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="trab-nacionalidade">Nacionalidade (国籍)</label>
                    <input type="text" id="trab-nacionalidade" placeholder="Brasil (ブラジル)" />
                  </div>
                </div>
              </div>

              <!-- SEÇÃO 2: Endereço no Japão -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>🏡</span>
                    <span>2. Endereço no Japão & Contato</span>
                    <span class="rirekisho-card-subtitle">(現住所・連絡先)</span>
                  </h2>
                  <span class="rirekisho-pill">Residência</span>
                </div>

                <div class="form-grid-3" style="margin-bottom: 1rem;">
                  <div class="form-group">
                    <label for="trab-cep">CEP (〒 郵便番号)</label>
                    <input type="text" id="trab-cep" placeholder="〒 460-0001" maxlength="9" />
                  </div>
                  <div class="form-group">
                    <label for="trab-provincia">Província (都道府県)</label>
                    <select id="trab-provincia">
                      <option value="">Selecione a Província</option>
                      ${PROVINCIAS_JAPAO.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="trab-cidade">Cidade e Bairro (市区町村・町名)</label>
                    <input type="text" id="trab-cidade" placeholder="Ex: 豊田市トヨタ町1番地" />
                  </div>
                </div>

                <div class="form-grid-3">
                  <div class="form-group">
                    <label for="trab-endereco">Complemento / Prédio (番地・マンション名・部屋番号)</label>
                    <input type="text" id="trab-endereco" placeholder="Ex: メゾン豊田 203号室" />
                  </div>
                  <div class="form-group">
                    <label for="trab-telefone">Telefone no Japão (電話番号)</label>
                    <input type="tel" id="trab-telefone" placeholder="090-1234-5678" />
                  </div>
                  <div class="form-group">
                    <label for="trab-email">E-mail de Contato (メール)</label>
                    <input type="email" id="trab-email" placeholder="exemplo@email.com" />
                  </div>
                </div>
              </div>

              <!-- SEÇÃO 3: Status de Residência & Documentação Fiscal -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>🪪</span>
                    <span>3. Status de Residência & Documentação Fiscal</span>
                    <span class="rirekisho-card-subtitle">(在留資格・在留カード・マイナンバー・インボイス)</span>
                  </h2>
                  <span class="rirekisho-pill">Conformidade Legal</span>
                </div>

                <div class="form-grid-3" style="margin-bottom: 1rem;">
                  <div class="form-group">
                    <label for="trab-visto">Status de Permanência / Visto (在留資格)</label>
                    <select id="trab-visto">
                      <option value="">Selecione o Visto</option>
                      ${TIPOS_VISTO.map(v => `<option value="${v}">${v}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="trab-zairyu">Nº Zairyu Card (在留カード番号 - 12 dígitos)</label>
                    <input type="text" id="trab-zairyu" placeholder="AB12345678CD" maxlength="12" style="text-transform: uppercase; font-family: monospace;" />
                  </div>
                  <div class="form-group">
                    <label for="trab-validade-zairyu">Validade do Zairyu Card (有効期限)</label>
                    <input type="date" id="trab-validade-zairyu" />
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label for="trab-mynumber">My Number (マイナンバー - 12 dígitos)</label>
                    <input type="text" id="trab-mynumber" placeholder="1234 5678 9012" maxlength="16" style="font-family: monospace;" />
                  </div>
                  <div class="form-group">
                    <label for="trab-invoice">Nº Emissor de Invoice (適格請求書 T+13 dígitos)</label>
                    <input type="text" id="trab-invoice" placeholder="T1234567890123" maxlength="14" style="font-family: monospace;" />
                  </div>
                </div>
              </div>

              <!-- SEÇÃO 4: Licenças, Habilitações & Qualificações no Japão -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>📜</span>
                    <span>4. Licenças, Habilitações & Qualificações no Japão</span>
                    <span class="rirekisho-card-subtitle">(免許・資格・技能講習・特別教育)</span>
                  </h2>
                  <span class="rirekisho-pill" id="badge-contador-licencas">0 qualificações</span>
                </div>

                <p style="font-size: 0.85rem; color: #94a3b8; margin-top: -0.25rem; margin-bottom: 1rem;">
                  Cadastre as habilitações oficiais, cursos especiais (特別教育) e certificados exigidos pelas empresas e indústrias no Japão (玉掛け, クレーン, 溶接, フォークリフト, 運転免許等).
                </p>

                <!-- Box seletor de licenças -->
                <div class="card" style="background: var(--color-bg); border: 1px solid var(--color-border); padding: 1rem; margin-bottom: 1.25rem;">
                  <div style="font-size: 0.82rem; font-weight: 700; color: var(--color-text); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>➕</span>
                    <span>Adicionar Licença ou Qualificação</span>
                  </div>

                  <div class="form-grid-3" style="align-items: flex-end; gap: 0.75rem;">
                    <div class="form-group" style="margin: 0;">
                      <label for="select-categoria-licenca" style="font-size: 0.75rem;">1. Categoria da Licença</label>
                      <select id="select-categoria-licenca">
                        <option value="">Selecione uma Categoria</option>
                        ${CATEGORIAS_LICENCAS.map(c => `<option value="${c.id}">${c.icon} ${c.nome}</option>`).join('')}
                        <option value="personalizado">✏️ Licença Personalizada / Outra (カスタム資格)</option>
                      </select>
                    </div>

                    <div class="form-group" style="margin: 0;" id="wrap-select-licenca">
                      <label for="select-licenca-predefinida" style="font-size: 0.75rem;">2. Qualificação / Curso Pré-determinado</label>
                      <select id="select-licenca-predefinida" disabled>
                        <option value="">Selecione a categoria primeiro</option>
                      </select>
                    </div>

                    <div>
                      <button type="button" class="btn btn-primary" id="btn-adicionar-licenca" style="width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer;">
                        <span>+ Adicionar à Ficha</span>
                      </button>
                    </div>
                  </div>

                  <!-- Painel de Licença Personalizada -->
                  <div id="wrap-licenca-customizada" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #475569;">
                    <div style="font-size: 0.8rem; font-weight: 600; color: #60a5fa; margin-bottom: 0.5rem;">
                      Nova Licença / Qualificação Personalizada (カスタム資格):
                    </div>
                    <div class="form-grid-3" style="align-items: flex-end; gap: 0.75rem;">
                      <div class="form-group" style="margin: 0;">
                        <label for="custom-licenca-nome-ja" style="font-size: 0.75rem;">Nome Oficial em Japonês (資格名) *</label>
                        <input type="text" id="custom-licenca-nome-ja" placeholder="Ex: トヨタ社内認定資格, 旋盤作業" />
                      </div>
                      <div class="form-group" style="margin: 0;">
                        <label for="custom-licenca-nome-pt" style="font-size: 0.75rem;">Descrição em Português</label>
                        <input type="text" id="custom-licenca-nome-pt" placeholder="Ex: Certificação Interna Toyota, Torneiro" />
                      </div>
                      <div>
                        <button type="button" class="btn btn-primary" id="btn-confirmar-custom-licenca" style="width: 100%;">
                          + Inserir Licença
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Container com as licenças do trabalhador -->
                <div id="container-licencas-adicionadas"></div>
              </div>

              <!-- SEÇÃO 5: Contrato & Remuneração -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>💼</span>
                    <span>5. Contrato & Remuneração</span>
                    <span class="rirekisho-card-subtitle">(雇用形態・給与条件)</span>
                  </h2>
                  <span class="rirekisho-pill">Trabalhista</span>
                </div>

                <div class="form-grid-3" style="margin-bottom: 1rem;">
                  <div class="form-group">
                    <label for="trab-contrato">Regime Contratual (雇用形態)</label>
                    <select id="trab-contrato">
                      <option value="業務委託">業務委託 (Prestador PJ / Autônomo)</option>
                      <option value="アルバイト">アルバイト (Arubaito / Horista)</option>
                      <option value="パート">パート (Part-time)</option>
                      <option value="派遣社員">派遣社員 (Trabalhador Haken)</option>
                      <option value="契約社員">契約社員 (Contrato Determinado)</option>
                      <option value="正社員">正社員 (Contrato Efetivo)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="trab-cargo">Função / Posto de Trabalho (職種・配属)</label>
                    <input type="text" id="trab-cargo" placeholder="Ex: Operador de Linha Industrial" />
                  </div>
                  <div class="form-group">
                    <label for="trab-admissao">Data de Início / Admissão (入社日)</label>
                    <input type="date" id="trab-admissao" />
                  </div>
                </div>

                <div class="form-grid-3" style="align-items: flex-end;">
                  <div class="form-group">
                    <label for="trab-tipo-calculo">Modelo de Remuneração</label>
                    <select id="trab-tipo-calculo">
                      <option value="por_hora">Por Hora (時給)</option>
                      <option value="fixo">Fixo por Dia (日給)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="trab-valor-base">Valor Base (¥) *</label>
                    <div class="input-addon-wrapper">
                      <span class="input-addon-prefix">¥</span>
                      <input type="number" id="trab-valor-base" step="1" min="0" placeholder="1500" required style="font-weight: 700; color: var(--color-success);" />
                      <span class="input-addon-suffix" id="label-tipo-taxa">/hora</span>
                    </div>
                  </div>
                  <div class="form-group" style="padding-bottom: 0.5rem;">
                    <label class="checkbox-label">
                      <input type="checkbox" id="trab-ativo" checked />
                      <span style="font-weight: 600; color: var(--color-text);">Trabalhador Ativo na Equipe (在籍中)</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- SEÇÃO 6: Conta Bancária no Japão -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>🏦</span>
                    <span>6. Conta Bancária para Pagamento</span>
                    <span class="rirekisho-card-subtitle">(給与振込先口座情報)</span>
                  </h2>
                  <span class="rirekisho-pill">Financeiro</span>
                </div>

                <div class="form-grid-3" style="margin-bottom: 1rem;">
                  <div class="form-group">
                    <label for="trab-banco-nome">Nome da Instituição (銀行名)</label>
                    <input type="text" id="trab-banco-nome" placeholder="Ex: 三菱UFJ銀行, ゆうちょ銀行" />
                  </div>
                  <div class="form-group">
                    <label for="trab-banco-agencia">Agência / Código (支店名・店番)</label>
                    <input type="text" id="trab-banco-agencia" placeholder="Ex: 名古屋支店 (001)" />
                  </div>
                  <div class="form-group">
                    <label for="trab-banco-tipo">Tipo de Conta (預金種目)</label>
                    <select id="trab-banco-tipo">
                      <option value="普通">普通 (Futsū - Conta Corrente Padrão)</option>
                      <option value="当座">当座 (Tōza - Conta Operacional)</option>
                    </select>
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label for="trab-banco-conta">Número da Conta (口座番号 - 7 dígitos)</label>
                    <input type="text" id="trab-banco-conta" placeholder="1234567" maxlength="8" style="font-family: monospace;" />
                  </div>
                  <div class="form-group">
                    <label for="trab-banco-titular">Nome do Titular em Katakana (口座名義・カタカナ)</label>
                    <input type="text" id="trab-banco-titular" placeholder="シルバ カルロス" />
                  </div>
                </div>
              </div>

              <!-- SEÇÃO 7: Contato de Emergência -->
              <div class="rirekisho-card">
                <div class="rirekisho-card-header">
                  <h2 class="rirekisho-card-title">
                    <span>🚨</span>
                    <span>7. Contato de Emergência no Japão & Observações</span>
                    <span class="rirekisho-card-subtitle">(緊急連絡先・特記事項)</span>
                  </h2>
                  <span class="rirekisho-pill">Segurança</span>
                </div>

                <div class="form-grid-3" style="margin-bottom: 1rem;">
                  <div class="form-group">
                    <label for="trab-emergencia-nome">Nome do Contato (氏名)</label>
                    <input type="text" id="trab-emergencia-nome" placeholder="Nome de cônjuge, parente ou amigo" />
                  </div>
                  <div class="form-group">
                    <label for="trab-emergencia-parentesco">Parentesco (続柄)</label>
                    <input type="text" id="trab-emergencia-parentesco" placeholder="Ex: Esposa, Irmão, Amigo..." />
                  </div>
                  <div class="form-group">
                    <label for="trab-emergencia-telefone">Telefone de Emergência (緊急電話番号)</label>
                    <input type="tel" id="trab-emergencia-telefone" placeholder="090-9999-8888" />
                  </div>
                </div>

                <div class="form-group">
                  <label for="trab-observacoes">Observações Gerais / Experiência Prévia (特記事項・備考)</label>
                  <textarea id="trab-observacoes" rows="3" placeholder="Histórico técnico, certificações industriais, restrições médicas ou anotações internas..."></textarea>
                </div>
              </div>

              <!-- Botões de Ação Inferiores -->
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.85rem; padding-top: 1rem; border-top: 1px solid var(--color-border); margin-bottom: 2rem; flex-wrap: wrap;">
                <div>
                  <button type="button" class="btn btn-outline" id="btn-excluir-trabalhador-form-bottom" style="display: none; align-items: center; gap: 0.45rem; border-color: #ef4444; color: #ef4444;" title="Excluir este cadastro de trabalhador">
                    <span>🗑️ Excluir Trabalhador</span>
                  </button>
                </div>
                <div style="display: flex; gap: 0.85rem; flex-wrap: wrap;">
                  <button type="button" class="btn btn-outline btn-cancel-action" style="min-width: 120px;">Cancelar</button>
                  <button type="button" class="btn btn-outline" id="btn-export-rirekisho-bottom" style="display: inline-flex; align-items: center; gap: 0.45rem; border-color: #0284c7; color: #0284c7;" title="Exportar Currículo Japonês (履歴書 JIS A4)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>Exportar 履歴書 (PDF)</span>
                  </button>
                  <button type="submit" class="btn btn-primary" id="btn-salvar-form" style="min-width: 180px; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span>Salvar Ficha Cadastral</span>
                  </button>
                </div>
              </div>
            </form>

          </div>

          <!-- ======================================================== -->
          <!-- MODAL DE EXPORTAÇÃO DE CURRÍCULO JAPONÊS (履歴書 JIS A4)  -->
          <!-- ======================================================== -->
          <div id="modal-exportar-rirekisho" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(4px); padding: 1rem;">
            <div class="modal-content" style="width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; padding: 1.5rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-xl); color: var(--color-text); box-shadow: var(--shadow-xl);">

              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--color-text);">
                      📄 Exportar Currículo Japonês (履歴書 JIS規格 A4)
                    </h2>
                    <span style="background: var(--color-primary); color: #ffffff; font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; letter-spacing: 0.05em;">2 Páginas A4</span>
                  </div>
                  <p style="font-size: 0.82rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                    Gera o modelo oficial JIS de 2 páginas preenchido com dados cadastrais, licenças industriais e histórico profissional.
                  </p>
                </div>
                <button type="button" id="btn-fechar-modal-rirekisho" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.25rem; cursor: pointer; padding: 0.25rem;">✕</button>
              </div>

              <!-- Opção de Tradução para Japonês Polido -->
              <div style="background: var(--color-primary-50); border: 1.5px solid var(--color-primary-light); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
                <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
                  <input type="checkbox" id="chk-traduzir-japones" checked style="width: 1.15rem; height: 1.15rem; margin-top: 2px; accent-color: var(--color-primary);" />
                  <div>
                    <div style="font-weight: 700; color: var(--color-primary); font-size: 0.95rem;">
                      Traduzir e formatar dados para Japonês Polido (ビジネス日本語・敬語)
                    </div>
                    <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 0.25rem; line-height: 1.45;">
                      Converte termos em português para padrão corporativo japonês: cargos técnicos, sufixos oficiais de licenças (修了/取得/合格), auto-apresentação formal (志望動機・自己PR) e cláusula padrão de desejos (貴社の規定に従います).
                    </div>
                  </div>
                </label>
              </div>

              <!-- Formulário de Revisão e Ajuste Fino -->
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Nome / 氏名</label>
                    <input type="text" id="modal-rir-nome" class="admin-field-input" style="width: 100%; font-size: 0.88rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Furigana / ふりがな</label>
                    <input type="text" id="modal-rir-furigana" class="admin-field-input" style="width: 100%; font-size: 0.88rem;" />
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Cargo / 職種 (Tradução em Japonês)</label>
                    <input type="text" id="modal-rir-cargo" class="admin-field-input" style="width: 100%; font-size: 0.88rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Tempo de Deslocamento (通勤時間)</label>
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                      <input type="number" id="modal-rir-comutacao-horas" value="0" min="0" max="12" class="admin-field-input" style="width: 65px; padding: 0.45rem; text-align: center; font-weight: 600;" />
                      <span style="font-size: 0.82rem; color: var(--color-text-secondary); font-weight: 600;">h</span>
                      <input type="number" id="modal-rir-comutacao-min" value="45" min="0" max="59" class="admin-field-input" style="width: 65px; padding: 0.45rem; text-align: center; font-weight: 600;" />
                      <span style="font-size: 0.82rem; color: var(--color-text-secondary); font-weight: 600;">min</span>
                    </div>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Dependentes (扶養家族数)</label>
                    <input type="number" id="modal-rir-dependentes" value="0" min="0" class="admin-field-input" style="width: 100%; font-size: 0.88rem;" />
                  </div>
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Possui Cônjuge (配偶者)</label>
                    <select id="modal-rir-conjuge" class="admin-field-select" style="width: 100%; font-size: 0.88rem;">
                      <option value="nao">Não (無)</option>
                      <option value="sim">Sim (有)</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">Sustento Cônjuge (扶養義務)</label>
                    <select id="modal-rir-obrigacao" class="admin-field-select" style="width: 100%; font-size: 0.88rem;">
                      <option value="nao">Não (無)</option>
                      <option value="sim">Sim (有)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem;">
                    <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600;">
                      Motivação e Auto-Apresentação (志望の動機、特技、アピールポイントなど)
                    </label>
                    <div style="display: flex; gap: 0.75rem;">
                      <button type="button" id="btn-modal-gemini-ai" style="background: none; border: none; color: var(--color-primary); font-size: 0.78rem; font-weight: 600; cursor: pointer; text-decoration: underline;" title="Refinar com IA Gemini">
                        ✨ Aprimorar com IA Gemini
                      </button>
                      <button type="button" id="btn-modal-regenerar-motivacao" style="background: none; border: none; color: var(--color-text-muted); font-size: 0.78rem; cursor: pointer; text-decoration: underline;">
                        ↺ Restaurar Padrão Polido
                      </button>
                    </div>
                  </div>
                  <textarea id="modal-rir-motivacao" rows="4" class="admin-field-input" style="width: 100%; padding: 0.65rem; font-size: 0.85rem; line-height: 1.45; resize: vertical;"></textarea>
                  <div id="modal-gemini-status" style="display: none; font-size: 0.75rem; color: var(--color-primary); margin-top: 0.25rem; font-weight: 500;"></div>
                </div>

                <div>
                  <label style="font-size: 0.78rem; color: var(--color-text); font-weight: 600; display: block; margin-bottom: 0.3rem;">
                    Desejos Pessoais sobre Trabalho (本人希望記入欄)
                  </label>
                  <input type="text" id="modal-rir-desejos" value="貴社の規定に従います。" class="admin-field-input" style="width: 100%; font-size: 0.88rem;" />
                </div>
              </div>

              <!-- Botões de Ação do Modal -->
              <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
                <button type="button" class="btn btn-outline" id="btn-cancelar-modal-rirekisho">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btn-gerar-pdf-rirekisho" style="display: inline-flex; align-items: center; gap: 0.5rem; background: var(--color-primary); border-color: var(--color-primary); color: #ffffff; font-weight: 600;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  <span>Visualizar & Imprimir / Salvar PDF (A4)</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  `;

  bindSidebarEvents();

  // Helper de renderização das linhas da tabela
  function renderWorkerRows(lista) {
    if (!lista || lista.length === 0) {
      return `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1.5rem; color: var(--color-text-secondary);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem; opacity: 0.85;">📋</div>
            <div style="font-size: 1.05rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.25rem;">Nenhum trabalhador cadastrado</div>
            <div style="font-size: 0.85rem; color: var(--color-text-secondary); max-width: 480px; margin: 0 auto 1.25rem;">
              A lista de funcionários está limpa. Clique abaixo para cadastrar a primeira ficha cadastral oficial (履歴書・労働者名簿).
            </div>
            <button type="button" class="btn btn-primary btn-sm" id="btn-empty-novo-trabalhador" style="display: inline-flex; align-items: center; gap: 0.4rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Cadastrar Primeiro Trabalhador</span>
            </button>
          </td>
        </tr>
      `;
    }

    return lista.map(t => {
      let visaStatus = '';
      if (t.validade_zairyu) {
        const expDate = new Date(t.validade_zairyu);
        const diffDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          visaStatus = `<span style="color: #ef4444; font-weight: 700; font-size: 0.75rem;">⚠️ EXPIRADO (${t.validade_zairyu})</span>`;
        } else if (diffDays <= 60) {
          visaStatus = `<span style="color: #f59e0b; font-weight: 700; font-size: 0.75rem;">⚠️ Vence em ${diffDays}d</span>`;
        } else {
          visaStatus = `<span style="color: #10b981; font-size: 0.75rem;">Até ${t.validade_zairyu}</span>`;
        }
      }

      return `
        <tr class="worker-row-clickable" data-worker-id="${t.id}" title="Clique para abrir a Ficha Cadastral de ${escapeHtml(t.nome_alfabeto)}">
          <td><span class="badge-worker-id">${escapeHtml(t.codigo_trabalhador)}</span></td>
          <td>
            <div style="font-weight: 600; color: var(--color-text);">${escapeHtml(t.nome_alfabeto)}</div>
            ${t.nome_kanji ? `<div style="font-size: 0.75rem; color: var(--color-text-secondary);">${escapeHtml(t.nome_kanji)} ${t.nome_kana ? `(${escapeHtml(t.nome_kana)})` : ''}</div>` : ''}
            ${Array.isArray(t.qualificacoes_licencas) && t.qualificacoes_licencas.length > 0 ? `
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                ${t.qualificacoes_licencas.slice(0, 3).map(l => `<span class="badge-mini-licenca" title="${escapeHtml(l.nome_ja || '')} ${l.nome_pt ? `(${escapeHtml(l.nome_pt)})` : ''}">${escapeHtml((l.nome_ja || l.nome_pt || '').split(' ')[0])}</span>`).join('')}
                ${t.qualificacoes_licencas.length > 3 ? `<span class="badge-mini-licenca" style="opacity: 0.7; background: rgba(148, 163, 184, 0.2); color: var(--color-text-secondary);">+${t.qualificacoes_licencas.length - 3}</span>` : ''}
              </div>
            ` : ''}
          </td>
          <td>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${escapeHtml(t.tipo_visto || 'Não inf.')}</div>
            ${visaStatus}
          </td>
          <td>
            <div style="font-size: 0.8rem; font-weight: 500;">${escapeHtml(t.tipo_contrato || '業務委託')}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-secondary);">${escapeHtml(t.cargo_funcao || '—')}</div>
          </td>
          <td class="col-num">
            ${t.tipo_calculo === 'fixo' ? `¥${(t.valor_diario || 0).toLocaleString('ja-JP')}/dia` : `¥${(t.valor_hora || 0).toLocaleString('ja-JP')}/h`}
          </td>
          <td style="font-size: 0.8rem; color: var(--color-text-secondary);">
            <div>${escapeHtml(t.telefone || '—')}</div>
            <div style="font-size: 0.72rem; color: var(--color-text-light);">${escapeHtml(t.email || '')}</div>
          </td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
              <button type="button" class="btn btn-outline btn-rirekisho-worker" data-id="${t.id}" style="font-size: 0.75rem; padding: 3px 6px; border-color: #0284c7; color: #0284c7;" title="Exportar Currículo Japonês (履歴書 JIS A4)">
                履歴書
              </button>
              <button type="button" class="btn btn-outline btn-edit-worker" data-id="${t.id}" style="font-size: 0.75rem; padding: 3px 6px;" title="Editar Ficha Cadastral">
                Editar
              </button>
              <button type="button" class="btn btn-outline btn-timesheet-worker" data-id="${t.id}" style="font-size: 0.75rem; padding: 3px 6px; border-color: var(--color-primary); color: var(--color-primary);" title="Ver e Apontar Horas">
                Horas
              </button>
              <button type="button" class="btn btn-outline btn-delete-worker" data-id="${t.id}" data-name="${escapeHtml(t.nome_alfabeto)}" style="font-size: 0.75rem; padding: 3px 6px; border-color: #ef4444; color: #ef4444;" title="Excluir Trabalhador (削除)">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Elementos das duas visões
  const viewLista = document.getElementById('view-lista-trabalhadores');
  const viewForm = document.getElementById('view-form-trabalhador');
  const form = document.getElementById('form-trabalhador');
  const formError = document.getElementById('form-error');
  const formSuccess = document.getElementById('form-success');
  const formTitle = document.getElementById('form-page-title');
  const formBadge = document.getElementById('form-page-badge');
  const formSubtitle = document.getElementById('form-page-subtitle');

  // --- GERENCIADOR DE LICENÇAS E QUALIFICAÇÕES NO JAPÃO ---
  let trabalhadorLicencas = [];

  const containerLicencas = document.getElementById('container-licencas-adicionadas');
  const badgeContadorLic = document.getElementById('badge-contador-licencas');
  const selCategoriaLic = document.getElementById('select-categoria-licenca');
  const selPresetLic = document.getElementById('select-licenca-predefinida');
  const btnAddLic = document.getElementById('btn-adicionar-licenca');
  const wrapSelectLic = document.getElementById('wrap-select-licenca');
  const wrapCustomLic = document.getElementById('wrap-licenca-customizada');
  const btnConfirmCustomLic = document.getElementById('btn-confirmar-custom-licenca');

  function renderLicencasAdicionadas() {
    if (badgeContadorLic) {
      badgeContadorLic.textContent = `${trabalhadorLicencas.length} qualificação${trabalhadorLicencas.length === 1 ? '' : 'ões'}`;
    }

    if (!containerLicencas) return;

    if (trabalhadorLicencas.length === 0) {
      containerLicencas.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; background: var(--color-bg); border: 1px dashed var(--color-border); border-radius: 8px; color: var(--color-text-secondary); font-size: 0.85rem;">
          <span style="font-size: 1.3rem; display: block; margin-bottom: 0.25rem;">📋</span>
          Nenhuma qualificação ou licença adicionada ainda. Utilize os seletores acima para adicionar certificações como <strong>Tamagake</strong>, <strong>Kuren</strong>, <strong>Solda</strong>, <strong>Carro/Moto</strong> ou personalizadas.
        </div>
      `;
      return;
    }

    containerLicencas.innerHTML = trabalhadorLicencas.map((lic) => `
      <div class="licenca-item-card" data-lic-id="${lic.id}">
        <div class="licenca-item-header">
          <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
            <span class="${lic.personalizado ? 'badge-licenca-custom' : 'badge-licenca-cat'}">
              ${escapeHtml(lic.categoria_icon || '📜')} ${escapeHtml(lic.categoria_nome || 'Licença')}
            </span>
            <strong style="color: var(--color-text); font-size: 0.92rem;">${escapeHtml(lic.nome_ja || '')}</strong>
            ${lic.nome_pt ? `<span style="color: var(--color-text-muted); font-size: 0.82rem;">(${escapeHtml(lic.nome_pt)})</span>` : ''}
          </div>
          <button type="button" class="btn-remove-licenca" data-lic-id="${lic.id}" title="Remover esta qualificação da ficha">
            ✕ Excluir
          </button>
        </div>

        <div class="form-grid-5" style="margin-top: 0.5rem; gap: 0.65rem;">
          <div class="form-group" style="margin: 0;">
            <label style="color: var(--color-text-secondary); font-weight: 500;">Data de Obtenção (取得年月)</label>
            <input type="date" class="lic-input-data" data-lic-id="${lic.id}" value="${escapeHtml(lic.data_obtencao || '')}" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="color: var(--color-text-secondary); font-weight: 500;">Nº Registro (修了証番号)</label>
            <input type="text" class="lic-input-registro" data-lic-id="${lic.id}" placeholder="Ex: 第123456号" value="${escapeHtml(lic.numero_registro || '')}" style="font-family: monospace;" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="color: var(--color-primary); font-weight: 600;">Complemento / Nível (補足・等級)</label>
            <input type="text" class="lic-input-complemento" data-lic-id="${lic.id}" placeholder="Ex: JIS SA-3F, TN-P, 1級, N2" value="${escapeHtml(lic.complemento || '')}" style="border-color: var(--color-primary);" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="color: var(--color-text-secondary); font-weight: 500;">Órgão Emissor (交付機関)</label>
            <input type="text" class="lic-input-orgao" data-lic-id="${lic.id}" placeholder="Ex: 愛知労働局長登録 / コマツ" value="${escapeHtml(lic.orgao_emissor || '')}" />
          </div>
          <div class="form-group" style="margin: 0;">
            <label style="color: var(--color-text-secondary); font-weight: 500;">Validade (有効期限)</label>
            <input type="date" class="lic-input-validade" data-lic-id="${lic.id}" value="${escapeHtml(lic.validade || '')}" />
          </div>
        </div>
      </div>
    `).join('');
  }

  // Limpa rigorosamente todos os campos do formulário para um novo cadastro
  function limparFormularioTrabalhador() {
    if (form) form.reset();

    const idsParaLimpar = [
      'trab-id',
      'trab-nome-alfabeto',
      'trab-nome-kanji',
      'trab-nome-kana',
      'trab-nascimento',
      'trab-cep',
      'trab-provincia',
      'trab-cidade',
      'trab-endereco',
      'trab-telefone',
      'trab-email',
      'trab-visto',
      'trab-zairyu',
      'trab-validade-zairyu',
      'trab-mynumber',
      'trab-invoice',
      'trab-cargo',
      'trab-admissao',
      'trab-valor-base',
      'trab-banco-nome',
      'trab-banco-agencia',
      'trab-banco-conta',
      'trab-banco-titular',
      'trab-emergencia-nome',
      'trab-emergencia-parentesco',
      'trab-emergencia-telefone',
      'trab-observacoes'
    ];

    idsParaLimpar.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    // Código do próximo trabalhador gerado automaticamente (0001, 0002, 0003...)
    const trabCodigo = document.getElementById('trab-codigo');
    if (trabCodigo) {
      trabCodigo.value = gerarProximoIdTrabalhador(trabalhadores);
      trabCodigo.readOnly = true;
    }

    // Valores padrão mínimos e limpos
    const trabGenero = document.getElementById('trab-genero');
    if (trabGenero) trabGenero.value = 'Masculino';

    const trabNacionalidade = document.getElementById('trab-nacionalidade');
    if (trabNacionalidade) trabNacionalidade.value = 'Brasil';

    const trabContrato = document.getElementById('trab-contrato');
    if (trabContrato) trabContrato.value = '業務委託';

    const trabTipoCalculo = document.getElementById('trab-tipo-calculo');
    if (trabTipoCalculo) trabTipoCalculo.value = 'por_hora';

    const trabBancoTipo = document.getElementById('trab-banco-tipo');
    if (trabBancoTipo) trabBancoTipo.value = '普通';

    const trabAtivo = document.getElementById('trab-ativo');
    if (trabAtivo) trabAtivo.checked = true;

    const lbl = document.getElementById('label-tipo-taxa');
    if (lbl) lbl.textContent = '/hora';

    trabalhadorLicencas = [];
    renderLicencasAdicionadas();
  }

  // Alterna para visualização do formulário
  function openFormView(worker = null) {
    formError.style.display = 'none';
    formSuccess.style.display = 'none';
    limparFormularioTrabalhador();

    const btnDelTopo = document.getElementById('btn-excluir-trabalhador-form-topo');
    const btnDelBottom = document.getElementById('btn-excluir-trabalhador-form-bottom');

    if (worker) {
      if (btnDelTopo) btnDelTopo.style.display = 'inline-flex';
      if (btnDelBottom) btnDelBottom.style.display = 'inline-flex';

      formTitle.textContent = `Editar Trabalhador: ${worker.codigo_trabalhador} — ${worker.nome_alfabeto || ''}`;
      formBadge.textContent = '履歴書編集';
      formBadge.className = 'badge-role-gestor';
      formSubtitle.textContent = `Edição dos dados cadastrais e fiscais no padrão japonês (ID: ${worker.codigo_trabalhador})`;

      document.getElementById('trab-id').value = worker.id || '';
      const trabCod = document.getElementById('trab-codigo');
      if (trabCod) {
        trabCod.value = worker.codigo_trabalhador || '';
        trabCod.readOnly = true;
      }
      document.getElementById('trab-nome-alfabeto').value = worker.nome_alfabeto || '';
      document.getElementById('trab-nome-kanji').value = worker.nome_kanji || '';
      document.getElementById('trab-nome-kana').value = worker.nome_kana || '';
      document.getElementById('trab-nascimento').value = worker.data_nascimento || '';
      document.getElementById('trab-genero').value = worker.genero || 'Masculino';
      document.getElementById('trab-nacionalidade').value = worker.nacionalidade || 'Brasil';

      document.getElementById('trab-cep').value = worker.cep || '';
      document.getElementById('trab-provincia').value = worker.provincia || '';
      document.getElementById('trab-cidade').value = worker.cidade_bairro || '';
      document.getElementById('trab-endereco').value = worker.endereco_numero || '';
      document.getElementById('trab-telefone').value = worker.telefone || '';
      document.getElementById('trab-email').value = worker.email || '';

      document.getElementById('trab-visto').value = worker.tipo_visto || '';
      document.getElementById('trab-zairyu').value = worker.numero_zairyu || '';
      document.getElementById('trab-validade-zairyu').value = worker.validade_zairyu || '';
      document.getElementById('trab-mynumber').value = worker.my_number || '';
      document.getElementById('trab-invoice').value = worker.numero_invoice || '';

      document.getElementById('trab-contrato').value = worker.tipo_contrato || '業務委託';
      document.getElementById('trab-cargo').value = worker.cargo_funcao || '';
      document.getElementById('trab-admissao').value = worker.data_admissao || '';
      document.getElementById('trab-tipo-calculo').value = worker.tipo_calculo || 'por_hora';
      document.getElementById('trab-valor-base').value = worker.tipo_calculo === 'fixo' ? (worker.valor_diario ?? '') : (worker.valor_hora ?? '');
      document.getElementById('trab-ativo').checked = worker.ativo !== false;

      document.getElementById('trab-banco-nome').value = worker.banco_nome || '';
      document.getElementById('trab-banco-agencia').value = worker.banco_agencia || '';
      document.getElementById('trab-banco-tipo').value = worker.banco_tipo_conta || '普通';
      document.getElementById('trab-banco-conta').value = worker.banco_conta || '';
      document.getElementById('trab-banco-titular').value = worker.banco_titular || '';

      document.getElementById('trab-emergencia-nome').value = worker.contato_emergencia_nome || '';
      document.getElementById('trab-emergencia-parentesco').value = worker.contato_emergencia_parentesco || '';
      document.getElementById('trab-emergencia-telefone').value = worker.contato_emergencia_telefone || '';
      document.getElementById('trab-observacoes').value = worker.observacoes || '';

      const lbl = document.getElementById('label-tipo-taxa');
      if (lbl) lbl.textContent = worker.tipo_calculo === 'fixo' ? '/dia' : '/hora';

      trabalhadorLicencas = Array.isArray(worker.qualificacoes_licencas)
        ? JSON.parse(JSON.stringify(worker.qualificacoes_licencas))
        : [];
      renderLicencasAdicionadas();

    } else {
      formTitle.textContent = 'Cadastrar Novo Trabalhador (履歴書)';
      formBadge.textContent = '新規登録';
      formBadge.className = 'badge-role-gestor';
      formSubtitle.textContent = 'Ficha cadastral completa baseada no padrão de contratação japonês (履歴書・雇用管理)';

      if (btnDelTopo) btnDelTopo.style.display = 'none';
      if (btnDelBottom) btnDelBottom.style.display = 'none';

      // Garante que o URL não retenha parâmetros de edição
      window.history.replaceState(null, '', '#/gestor-trabalhadores');
    }

    // Reset dos seletores de licenças
    if (selCategoriaLic) selCategoriaLic.value = '';
    if (selPresetLic) {
      selPresetLic.disabled = true;
      selPresetLic.innerHTML = '<option value="">Selecione a categoria primeiro</option>';
    }
    if (wrapCustomLic) wrapCustomLic.style.display = 'none';
    if (wrapSelectLic) wrapSelectLic.style.display = 'block';
    if (btnAddLic) btnAddLic.style.display = 'inline-block';

    viewLista.style.display = 'none';
    viewForm.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Retorna para a visualização da listagem
  function closeFormView() {
    limparFormularioTrabalhador();
    viewForm.style.display = 'none';
    viewLista.style.display = 'block';
    window.history.replaceState(null, '', '#/gestor-trabalhadores');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Eventos de abertura/fechamento
  document.getElementById('btn-novo-trabalhador')?.addEventListener('click', () => {
    // TRAVA ANTI-FRAUDE: Se atingiu a cota do plano gratuito, bloqueia abertura e exige chave
    if (!statusPlano.isPro && statusPlano.totalCadastrados >= statusPlano.limite) {
      openModalAtivacao({
        motivo: 'limite_atingido',
        onSucesso: () => renderGestorTrabalhadores(app)
      });
      return;
    }
    window.history.replaceState(null, '', '#/gestor-trabalhadores');
    openFormView(null);
  });

  document.getElementById('btn-empty-novo-trabalhador')?.addEventListener('click', () => {
    document.getElementById('btn-novo-trabalhador')?.click();
  });

  document.getElementById('btn-limpar-todos-trabalhadores')?.addEventListener('click', async () => {
    if (confirm(`Atenção: Deseja realmente excluir TODOS os ${trabalhadores.length} trabalhadores cadastrados?\n\nEsta ação apagará permanentemente as fichas cadastrais e todas as folhas de ponto/horas associadas.`)) {
      const btnLimpar = document.getElementById('btn-limpar-todos-trabalhadores');
      if (btnLimpar) {
        btnLimpar.disabled = true;
        btnLimpar.textContent = 'Excluindo todos...';
      }
      await limparTodosTrabalhadores(user.id, supabase);
      renderGestorTrabalhadores(app);
    }
  });

  // Botão de ativar chave no banner
  document.getElementById('btn-ativar-chave-banner')?.addEventListener('click', () => {
    openModalAtivacao({
      motivo: statusPlano.atingiuLimite ? 'limite_atingido' : 'manual',
      onSucesso: () => renderGestorTrabalhadores(app)
    });
  });

  document.getElementById('btn-voltar-lista')?.addEventListener('click', closeFormView);
  document.querySelectorAll('.btn-cancel-action').forEach(btn => {
    btn.addEventListener('click', closeFormView);
  });

  // Salvar no botão de topo dispara o submit do formulário
  document.getElementById('btn-salvar-topo')?.addEventListener('click', () => {
    form.requestSubmit();
  });

  // Alterna label do valor base (por hora ou por dia)
  document.getElementById('trab-tipo-calculo')?.addEventListener('change', (e) => {
    const lbl = document.getElementById('label-tipo-taxa');
    if (lbl) lbl.textContent = e.target.value === 'fixo' ? '/dia' : '/hora';
  });

  // Mudança de categoria no seletor de licenças
  selCategoriaLic?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'personalizado') {
      if (wrapSelectLic) wrapSelectLic.style.display = 'none';
      if (btnAddLic) btnAddLic.style.display = 'none';
      if (wrapCustomLic) wrapCustomLic.style.display = 'block';
    } else if (val) {
      if (wrapCustomLic) wrapCustomLic.style.display = 'none';
      if (wrapSelectLic) wrapSelectLic.style.display = 'block';
      if (btnAddLic) btnAddLic.style.display = 'inline-block';
      const catObj = CATEGORIAS_LICENCAS.find(c => c.id === val);
      if (catObj && catObj.licencas && catObj.licencas.length > 0) {
        selPresetLic.disabled = false;
        selPresetLic.innerHTML = `<option value="">Selecione uma licença (${catObj.licencas.length} opções)</option>` +
          catObj.licencas.map((l, idx) => `<option value="${idx}">${escapeHtml(l.nome_ja)} — ${escapeHtml(l.nome_pt)}</option>`).join('');
      } else {
        selPresetLic.disabled = true;
        selPresetLic.innerHTML = '<option value="">Nenhuma licença nesta categoria</option>';
      }
    } else {
      if (wrapCustomLic) wrapCustomLic.style.display = 'none';
      if (wrapSelectLic) wrapSelectLic.style.display = 'block';
      if (btnAddLic) btnAddLic.style.display = 'inline-block';
      selPresetLic.disabled = true;
      selPresetLic.innerHTML = '<option value="">Selecione a categoria primeiro</option>';
    }
  });

  // Botão Adicionar Licença Pré-definida
  btnAddLic?.addEventListener('click', () => {
    const catVal = selCategoriaLic?.value;
    const licIdx = selPresetLic?.value;

    if (!catVal) {
      alert('Por favor, selecione primeiro a Categoria da Licença (ex: Cargas, Solda, Veículos...).');
      selCategoriaLic?.focus();
      return;
    }

    if (licIdx === '' || licIdx === undefined || isNaN(parseInt(licIdx))) {
      alert('Por favor, selecione a Qualificação / Curso desejado na lista suspensa.');
      selPresetLic?.focus();
      return;
    }

    const catObj = CATEGORIAS_LICENCAS.find(c => c.id === catVal);
    if (!catObj) return;
    const item = catObj.licencas[parseInt(licIdx)];
    if (!item) return;

    // Evita duplicatas da mesma licença
    if (trabalhadorLicencas.some(l => l.nome_ja === item.nome_ja)) {
      alert(`A qualificação "${item.nome_ja}" já foi adicionada para este trabalhador.`);
      return;
    }

    const newLicId = 'lic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    trabalhadorLicencas.push({
      id: newLicId,
      categoria_id: catObj.id,
      categoria_nome: catObj.nome.split(' (')[0] || catObj.nome,
      categoria_icon: catObj.icon,
      nome_ja: item.nome_ja,
      nome_pt: item.nome_pt,
      complemento: '',
      data_obtencao: '',
      numero_registro: '',
      orgao_emissor: '',
      validade: '',
      personalizado: false
    });

    renderLicencasAdicionadas();

    // Limpa a seleção para facilitar próxima escolha
    selPresetLic.value = '';

    // Efeito suave de destaque na licença recém adicionada
    const newCard = containerLicencas?.querySelector(`[data-lic-id="${newLicId}"]`);
    if (newCard) {
      newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      newCard.style.boxShadow = '0 0 0 2px #38bdf8';
      setTimeout(() => { newCard.style.boxShadow = ''; }, 1500);
    }
  });

  // Botão Adicionar Licença Personalizada
  btnConfirmCustomLic?.addEventListener('click', () => {
    const nomeJa = document.getElementById('custom-licenca-nome-ja')?.value.trim();
    const nomePt = document.getElementById('custom-licenca-nome-pt')?.value.trim();

    if (!nomeJa && !nomePt) {
      alert('Informe o nome da qualificação/licença (em japonês ou português).');
      return;
    }

    const newLicId = 'lic_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

    trabalhadorLicencas.push({
      id: newLicId,
      categoria_id: 'personalizado',
      categoria_nome: 'Personalizada',
      categoria_icon: '✏️',
      nome_ja: nomeJa || nomePt,
      nome_pt: nomePt || nomeJa,
      complemento: '',
      data_obtencao: '',
      numero_registro: '',
      orgao_emissor: '',
      validade: '',
      personalizado: true
    });

    document.getElementById('custom-licenca-nome-ja').value = '';
    document.getElementById('custom-licenca-nome-pt').value = '';
    selCategoriaLic.value = '';
    wrapCustomLic.style.display = 'none';
    wrapSelectLic.style.display = 'block';
    if (btnAddLic) btnAddLic.style.display = 'inline-flex';
    selPresetLic.disabled = true;
    selPresetLic.innerHTML = '<option value="">Selecione a categoria primeiro</option>';

    renderLicencasAdicionadas();

    const newCard = containerLicencas?.querySelector(`[data-lic-id="${newLicId}"]`);
    if (newCard) {
      newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      newCard.style.boxShadow = '0 0 0 2px #fbbf24';
      setTimeout(() => { newCard.style.boxShadow = ''; }, 1500);
    }
  });

  // Exclusão de licença da lista
  containerLicencas?.addEventListener('click', (e) => {
    const btnRemove = e.target.closest('.btn-remove-licenca');
    if (btnRemove) {
      const licId = btnRemove.dataset.licId;
      trabalhadorLicencas = trabalhadorLicencas.filter(l => l.id !== licId);
      renderLicencasAdicionadas();
    }
  });

  // Edição de campos de cada licença em tempo real
  containerLicencas?.addEventListener('input', (e) => {
    const target = e.target;
    const licId = target.dataset.licId;
    if (!licId) return;
    const lic = trabalhadorLicencas.find(l => l.id === licId);
    if (!lic) return;

    if (target.classList.contains('lic-input-data')) {
      lic.data_obtencao = target.value;
    } else if (target.classList.contains('lic-input-registro')) {
      lic.numero_registro = target.value.trim();
    } else if (target.classList.contains('lic-input-complemento')) {
      lic.complemento = target.value.trim();
    } else if (target.classList.contains('lic-input-orgao')) {
      lic.orgao_emissor = target.value.trim();
    } else if (target.classList.contains('lic-input-validade')) {
      lic.validade = target.value;
    }
  });

  // Função centralizada para exclusão de trabalhador
  async function executarExclusaoTrabalhador(workerId) {
    try {
      await excluirTrabalhador(workerId, user.id, supabase);
      trabalhadores = trabalhadores.filter(t => t.id !== workerId);
      closeFormView();
      renderGestorTrabalhadores(app);
    } catch (err) {
      alert('Erro ao excluir trabalhador: ' + (err.message || err));
    }
  }

  // Eventos de clique na tabela (delegation - toda a linha é clicável)
  document.getElementById('lista-trabalhadores-body')?.addEventListener('click', async (e) => {
    // Se clicou no botão de Excluir Trabalhador
    const btnDelete = e.target.closest('.btn-delete-worker');
    if (btnDelete) {
      e.stopPropagation();
      const id = btnDelete.dataset.id;
      const worker = trabalhadores.find(t => t.id === id);
      const nome = worker ? worker.nome_alfabeto : (btnDelete.dataset.name || 'este trabalhador');
      if (confirm(`Tem certeza que deseja excluir o cadastro de "${nome}"?\n\nEsta ação removerá a ficha cadastral e todos os registros de horas associados.`)) {
        await executarExclusaoTrabalhador(id);
      }
      return;
    }

    // Se clicou no botão de Exportar Rirekisho
    const btnRirekisho = e.target.closest('.btn-rirekisho-worker');
    if (btnRirekisho) {
      e.stopPropagation();
      const id = btnRirekisho.dataset.id;
      const worker = trabalhadores.find(t => t.id === id);
      if (worker) abrirModalRirekisho(worker);
      return;
    }

    // Se clicou especificamente no botão de Horas, vai para apontamento de horas
    const btnTimesheet = e.target.closest('.btn-timesheet-worker');
    if (btnTimesheet) {
      e.stopPropagation();
      const id = btnTimesheet.dataset.id;
      sessionStorage.setItem('keiro_gestor_selected_worker', id);
      navigate('/registro-horas');
      return;
    }

    // Clique em qualquer outro lugar da linha (ou no botão Editar) abre a Ficha Cadastral
    const row = e.target.closest('tr[data-worker-id]');
    if (row) {
      const id = row.dataset.workerId;
      const worker = trabalhadores.find(t => t.id === id);
      if (worker) openFormView(worker);
    }
  });

  // Objeto do trabalhador atualmente selecionado para a 履歴書
  let activeRirekishoWorker = null;

  function getWorkerFromForm() {
    const id = document.getElementById('trab-id')?.value || '';
    const existing = id ? trabalhadores.find(t => t.id === id) : null;

    return {
      id: id,
      foto_url: existing?.foto_url || '',
      codigo_trabalhador: document.getElementById('trab-codigo')?.value?.trim() || gerarProximoIdTrabalhador(trabalhadores),
      nome_alfabeto: document.getElementById('trab-nome-alfabeto')?.value?.trim() || '',
      nome_kanji: document.getElementById('trab-nome-kanji')?.value?.trim() || '',
      nome_kana: document.getElementById('trab-nome-kana')?.value?.trim() || '',
      data_nascimento: document.getElementById('trab-nascimento')?.value || '',
      genero: document.getElementById('trab-genero')?.value || 'Masculino',
      nacionalidade: document.getElementById('trab-nacionalidade')?.value || 'Brasil',
      cep: document.getElementById('trab-cep')?.value?.trim() || '',
      provincia: document.getElementById('trab-provincia')?.value || '',
      cidade_bairro: document.getElementById('trab-cidade')?.value?.trim() || '',
      endereco_numero: document.getElementById('trab-endereco')?.value?.trim() || '',
      telefone: document.getElementById('trab-telefone')?.value?.trim() || '',
      email: document.getElementById('trab-email')?.value?.trim() || '',
      tipo_visto: document.getElementById('trab-visto')?.value || '',
      tipo_contrato: document.getElementById('trab-contrato')?.value || '業務委託',
      cargo_funcao: document.getElementById('trab-cargo')?.value?.trim() || '',
      data_admissao: document.getElementById('trab-admissao')?.value || '',
      contato_emergencia_nome: document.getElementById('trab-emergencia-nome')?.value?.trim() || '',
      contato_emergencia_parentesco: document.getElementById('trab-emergencia-parentesco')?.value?.trim() || '',
      contato_emergencia_telefone: document.getElementById('trab-emergencia-telefone')?.value?.trim() || '',
      observacoes: document.getElementById('trab-observacoes')?.value?.trim() || '',
      qualificacoes_licencas: Array.isArray(trabalhadorLicencas) ? [...trabalhadorLicencas] : []
    };
  }

  const modalRirekisho = document.getElementById('modal-exportar-rirekisho');
  const chkTraduzirJapones = document.getElementById('chk-traduzir-japones');
  const modalRirNome = document.getElementById('modal-rir-nome');
  const modalRirFurigana = document.getElementById('modal-rir-furigana');
  const modalRirCargo = document.getElementById('modal-rir-cargo');
  const modalRirMotivacao = document.getElementById('modal-rir-motivacao');
  const modalRirDesejos = document.getElementById('modal-rir-desejos');
  const modalRirComutacaoH = document.getElementById('modal-rir-comutacao-horas');
  const modalRirComutacaoM = document.getElementById('modal-rir-comutacao-min');
  const modalRirDependentes = document.getElementById('modal-rir-dependentes');
  const modalRirConjuge = document.getElementById('modal-rir-conjuge');
  const modalRirObrigacao = document.getElementById('modal-rir-obrigacao');
  const modalGeminiStatus = document.getElementById('modal-gemini-status');

  function preencherCamposModal(worker) {
    if (!worker) return;
    const traduzir = chkTraduzirJapones?.checked ?? true;

    modalRirNome.value = worker.nome_kanji || worker.nome_alfabeto || '';
    modalRirFurigana.value = worker.nome_kana || romanToKatakanaApprox(worker.nome_alfabeto);
    modalRirCargo.value = traduzir ? traduzirCargo(worker.cargo_funcao) : (worker.cargo_funcao || '');
    modalRirMotivacao.value = traduzir ? gerarMotivacaoPolida(worker) : (worker.observacoes || '');
    modalRirDesejos.value = '貴社の規定に従います。';
    modalRirComutacaoH.value = '0';
    modalRirComutacaoM.value = '45';

    const parentesco = (worker.contato_emergencia_parentesco || '').toLowerCase();
    const temConj = parentesco.includes('esposa') || parentesco.includes('marido') || parentesco.includes('cônjuge') || parentesco.includes('妻') || parentesco.includes('夫');
    modalRirDependentes.value = temConj ? '1' : '0';
    modalRirConjuge.value = temConj ? 'sim' : 'nao';
    if (modalRirObrigacao) modalRirObrigacao.value = temConj ? 'sim' : 'nao';
  }

  function abrirModalRirekisho(worker) {
    activeRirekishoWorker = worker;
    if (modalGeminiStatus) modalGeminiStatus.style.display = 'none';
    preencherCamposModal(worker);
    if (modalRirekisho) {
      modalRirekisho.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function fecharModalRirekisho() {
    if (modalRirekisho) {
      modalRirekisho.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  document.getElementById('btn-fechar-modal-rirekisho')?.addEventListener('click', fecharModalRirekisho);
  document.getElementById('btn-cancelar-modal-rirekisho')?.addEventListener('click', fecharModalRirekisho);
  modalRirekisho?.addEventListener('click', (e) => {
    if (e.target === modalRirekisho) fecharModalRirekisho();
  });

  document.getElementById('btn-export-rirekisho-form')?.addEventListener('click', () => {
    const worker = getWorkerFromForm();
    abrirModalRirekisho(worker);
  });

  document.getElementById('btn-export-rirekisho-bottom')?.addEventListener('click', () => {
    const worker = getWorkerFromForm();
    abrirModalRirekisho(worker);
  });

  chkTraduzirJapones?.addEventListener('change', () => {
    if (activeRirekishoWorker) {
      preencherCamposModal(activeRirekishoWorker);
    }
  });

  document.getElementById('btn-modal-regenerar-motivacao')?.addEventListener('click', () => {
    if (activeRirekishoWorker) {
      modalRirMotivacao.value = gerarMotivacaoPolida(activeRirekishoWorker);
    }
  });

  document.getElementById('btn-modal-gemini-ai')?.addEventListener('click', async () => {
    if (!activeRirekishoWorker) return;
    if (modalGeminiStatus) {
      modalGeminiStatus.style.display = 'block';
      modalGeminiStatus.textContent = '⏳ Conectando à IA Gemini para refinamento em Keigo (ビジネス敬語)...';
    }
    const res = await traduzirComGemini(activeRirekishoWorker);
    if (res) {
      if (res.cargoJapones) modalRirCargo.value = res.cargoJapones;
      if (res.motivacaoPolida) modalRirMotivacao.value = res.motivacaoPolida;
      if (res.desejosPessoais) modalRirDesejos.value = res.desejosPessoais;
      if (modalGeminiStatus) {
        modalGeminiStatus.textContent = '✨ Texto refinado com sucesso pela IA Gemini!';
        setTimeout(() => { modalGeminiStatus.style.display = 'none'; }, 3000);
      }
    } else {
      if (modalGeminiStatus) {
        modalGeminiStatus.textContent = 'ℹ️ Dicionário padrão de Keigo aplicado com sucesso (sem chave Gemini configurada).';
        setTimeout(() => { modalGeminiStatus.style.display = 'none'; }, 3500);
      }
    }
  });

  modalRirConjuge?.addEventListener('change', () => {
    const isSim = modalRirConjuge.value === 'sim';
    if (modalRirObrigacao) {
      modalRirObrigacao.value = isSim ? 'sim' : 'nao';
    }
  });

  document.getElementById('btn-gerar-pdf-rirekisho')?.addEventListener('click', () => {
    if (!activeRirekishoWorker) return;

    // Abre janela imediatamente no evento de clique para prevenir bloqueador de popups do navegador
    let printWin = null;
    try {
      printWin = window.open('about:blank', '_blank');
      if (printWin) {
        printWin.document.write('<!DOCTYPE html><html><head><title>Carregando 履歴書...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;"><div style="text-align:center;"><div style="font-size:24px;margin-bottom:12px;">⏳</div><div style="font-size:16px;font-weight:600;">Gerando Currículo Japonês (履歴書 JIS)...</div></div></body></html>');
        printWin.document.close();
      }
    } catch (e) { }

    const isTemConjuge = modalRirConjuge?.value === 'sim';
    const isObrigacao = modalRirObrigacao ? (modalRirObrigacao.value === 'sim') : isTemConjuge;

    const options = {
      customMotivacao: modalRirMotivacao?.value?.trim() || '',
      customDesejos: modalRirDesejos?.value?.trim() || '',
      tempoComutacaoHoras: modalRirComutacaoH?.value || '0',
      tempoComutacaoMin: modalRirComutacaoM?.value || '45',
      dependentes: modalRirDependentes?.value || '0',
      temConjuge: isTemConjuge,
      obrigacaoConjuge: isObrigacao
    };

    const workerParaExportar = {
      ...activeRirekishoWorker,
      nome_kanji: modalRirNome?.value?.trim() || activeRirekishoWorker.nome_kanji,
      nome_kana: modalRirFurigana?.value?.trim() || activeRirekishoWorker.nome_kana,
      cargo_funcao: modalRirCargo?.value?.trim() || activeRirekishoWorker.cargo_funcao
    };

    const dadosFinal = prepararDadosRirekisho(workerParaExportar, options);
    imprimirRirekisho(dadosFinal, printWin);
    fecharModalRirekisho();
  });

  // Salvar Ficha Cadastral
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-salvar-form');
    const saveBtnTop = document.getElementById('btn-salvar-topo');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando...'; }
    if (saveBtnTop) { saveBtnTop.disabled = true; saveBtnTop.textContent = 'Salvando...'; }
    formError.style.display = 'none';
    formSuccess.style.display = 'none';

    const id = document.getElementById('trab-id').value;

    // TRAVA ANTI-FRAUDE: Bloqueia novo cadastro no plano gratuito se atingiu a cota de 5 trabalhadores
    if (!id && !statusPlano.isPro && trabalhadores.length >= statusPlano.limite) {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar Ficha Cadastral'; }
      if (saveBtnTop) { saveBtnTop.disabled = false; saveBtnTop.textContent = 'Salvar Ficha Cadastral'; }
      openModalAtivacao({
        motivo: 'limite_atingido',
        onSucesso: () => renderGestorTrabalhadores(app)
      });
      return;
    }

    const tipoCalculo = document.getElementById('trab-tipo-calculo').value;
    const valorBase = parseFloat(document.getElementById('trab-valor-base').value) || 0;

    const codigoInput = document.getElementById('trab-codigo')?.value?.trim() || '';
    const codigoFinal = codigoInput || (id ? (trabalhadores.find(t => t.id === id)?.codigo_trabalhador || '0001') : gerarProximoIdTrabalhador(trabalhadores));

    const payload = {
      gestor_id: user.id,
      codigo_trabalhador: codigoFinal,
      nome_alfabeto: document.getElementById('trab-nome-alfabeto').value.trim(),
      nome_kanji: document.getElementById('trab-nome-kanji').value.trim() || null,
      nome_kana: document.getElementById('trab-nome-kana').value.trim() || null,
      data_nascimento: document.getElementById('trab-nascimento').value || null,
      genero: document.getElementById('trab-genero').value,
      nacionalidade: document.getElementById('trab-nacionalidade').value.trim() || 'Brasil',

      cep: document.getElementById('trab-cep').value.trim() || null,
      provincia: document.getElementById('trab-provincia').value || null,
      cidade_bairro: document.getElementById('trab-cidade').value.trim() || null,
      endereco_numero: document.getElementById('trab-endereco').value.trim() || null,
      telefone: document.getElementById('trab-telefone').value.trim() || null,
      email: document.getElementById('trab-email').value.trim() || null,

      tipo_visto: document.getElementById('trab-visto').value || null,
      numero_zairyu: document.getElementById('trab-zairyu').value.trim().toUpperCase() || null,
      validade_zairyu: document.getElementById('trab-validade-zairyu').value || null,
      my_number: document.getElementById('trab-mynumber').value.trim() || null,
      numero_invoice: document.getElementById('trab-invoice').value.trim().toUpperCase() || null,

      tipo_contrato: document.getElementById('trab-contrato').value || '業務委託',
      cargo_funcao: document.getElementById('trab-cargo').value.trim() || null,
      data_admissao: document.getElementById('trab-admissao').value || null,
      tipo_calculo: tipoCalculo,
      valor_hora: tipoCalculo === 'por_hora' ? valorBase : null,
      valor_diario: tipoCalculo === 'fixo' ? valorBase : null,
      ativo: document.getElementById('trab-ativo').checked,

      banco_nome: document.getElementById('trab-banco-nome').value.trim() || null,
      banco_agencia: document.getElementById('trab-banco-agencia').value.trim() || null,
      banco_tipo_conta: document.getElementById('trab-banco-tipo').value || '普通',
      banco_conta: document.getElementById('trab-banco-conta').value.trim() || null,
      banco_titular: document.getElementById('trab-banco-titular').value.trim() || null,

      contato_emergencia_nome: document.getElementById('trab-emergencia-nome').value.trim() || null,
      contato_emergencia_parentesco: document.getElementById('trab-emergencia-parentesco').value.trim() || null,
      contato_emergencia_telefone: document.getElementById('trab-emergencia-telefone').value.trim() || null,
      observacoes: document.getElementById('trab-observacoes').value.trim() || null,
      qualificacoes_licencas: trabalhadorLicencas
    };

    try {
      if (id) {
        // Atualização no Supabase
        const { error } = await supabase
          .from('trabalhador')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        // Criação no Supabase
        const { error } = await supabase
          .from('trabalhador')
          .insert(payload);
        if (error) throw error;
      }

      formSuccess.textContent = 'Ficha cadastral salva com sucesso!';
      formSuccess.style.display = 'block';

      setTimeout(() => {
        closeFormView();
        renderGestorTrabalhadores(app);
      }, 700);

    } catch (err) {
      console.warn('Erro ao salvar trabalhador no Supabase, mantendo sincronizado localmente:', err);
      // Fallback para cache local
      let list = getStoredTrabalhadores() || trabalhadores;
      if (id) {
        const idx = list.findIndex(t => t.id === id);
        if (idx !== -1) list[idx] = { ...list[idx], ...payload, id };
      } else {
        const newObj = { ...payload, id: `mock-worker-${Date.now()}` };
        list.push(newObj);
      }
      setStoredTrabalhadores(list);

      formSuccess.textContent = 'Ficha cadastral salva com sucesso!';
      formSuccess.style.display = 'block';

      setTimeout(() => {
        closeFormView();
        renderGestorTrabalhadores(app);
      }, 700);
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar Ficha Cadastral'; }
      if (saveBtnTop) { saveBtnTop.disabled = false; saveBtnTop.textContent = 'Salvar Ficha Cadastral'; }
    }
  });

  // Ações de exclusão de cadastro a partir do formulário de edição
  const handleExcluirForm = async () => {
    const id = document.getElementById('trab-id')?.value;
    if (!id) return;
    const worker = trabalhadores.find(t => t.id === id);
    const nome = worker ? worker.nome_alfabeto : 'este trabalhador';
    if (confirm(`Tem certeza que deseja excluir o cadastro de "${nome}"?\n\nEsta ação removerá a ficha cadastral e todos os registros de horas associados.`)) {
      await executarExclusaoTrabalhador(id);
    }
  };
  document.getElementById('btn-excluir-trabalhador-form-topo')?.addEventListener('click', handleExcluirForm);
  document.getElementById('btn-excluir-trabalhador-form-bottom')?.addEventListener('click', handleExcluirForm);

  // Filtro de busca em tempo real
  const inputBusca = document.getElementById('filtro-busca');
  const selStatus = document.getElementById('filtro-status');

  function applyFilters() {
    const q = inputBusca?.value.toLowerCase().trim() || '';
    const st = selStatus?.value || 'todos';

    const filtrados = trabalhadores.filter(t => {
      const matchLic = Array.isArray(t.qualificacoes_licencas) && t.qualificacoes_licencas.some(l =>
        (l.nome_ja || '').toLowerCase().includes(q) ||
        (l.nome_pt || '').toLowerCase().includes(q) ||
        (l.categoria_nome || '').toLowerCase().includes(q)
      );

      const matchText = (t.codigo_trabalhador || '').toLowerCase().includes(q) ||
        (t.nome_alfabeto || '').toLowerCase().includes(q) ||
        (t.nome_kanji || '').toLowerCase().includes(q) ||
        (t.numero_zairyu || '').toLowerCase().includes(q) ||
        (t.tipo_visto || '').toLowerCase().includes(q) ||
        matchLic;

      const matchStatus = st === 'todos' ||
        (st === 'ativos' && t.ativo !== false) ||
        (st === 'inativos' && t.ativo === false);

      return matchText && matchStatus;
    });

    const tbody = document.getElementById('lista-trabalhadores-body');
    if (tbody) tbody.innerHTML = renderWorkerRows(filtrados);
  }

  inputBusca?.addEventListener('input', applyFilters);
  selStatus?.addEventListener('change', applyFilters);

  // Se veio para editar ou criar direto via URL
  if (editId) {
    const worker = trabalhadores.find(t => t.id === editId || t.codigo_trabalhador === editId);
    if (worker) {
      openFormView(worker);
    }
  } else if (isNovoDirect) {
    if (!statusPlano.isPro && statusPlano.totalCadastrados >= statusPlano.limite) {
      openModalAtivacao({
        motivo: 'limite_atingido',
        onSucesso: () => renderGestorTrabalhadores(app)
      });
    } else {
      openFormView(null);
    }
  }
}
