/**
 * Painel Administrativo de Gestão de Chaves e Licenças Anti-Fraude
 * Permite ao administrador gerar novas chaves únicas, auditar ativações e revogar acessos.
 */

import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';
import { escapeHtml } from '../security.js';
import {
  listarTodasChaves,
  criarNovaChave,
  revogarChave,
  reativarChave,
  excluirChave,
  isUsuarioAdmin,
  EMAILS_ADMINISTRADORES,
  SQL_SCHEMA_SUPABASE
} from '../licencas-service.js';

export async function renderAdminLicencas(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigate('/login');
    return;
  }

  // TRAVA DE SEGURANÇA: Apenas administradores autorizados podem acessar este painel
  if (!isUsuarioAdmin(user)) {
    const isGestor = sessionStorage.getItem('keiro_active_role') === 'gestor';
    app.innerHTML = `
      ${renderSidebar(isGestor ? 'gestor-dashboard' : 'dashboard')}
      <div class="app-content-wrapper">
        <main class="main-content">
          <div class="page-container">
            <div class="card" style="text-align: center; padding: 3rem 1.5rem; max-width: 520px; margin: 3rem auto; border: 1px solid var(--color-error); background: var(--color-error-bg); box-shadow: var(--shadow-md);">
              <div style="font-size: 3.5rem; margin-bottom: 1rem;">⛔</div>
              <h2 style="color: var(--color-error); font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">Acesso Não Autorizado</h2>
              <p style="color: var(--color-text-secondary); font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;">
                O painel de <strong>Gestão de Licenças e Chaves Anti-Fraude</strong> é restrito aos administradores do sistema.<br/>
                Sua conta atual (<strong>${escapeHtml(user.email || 'usuário')}</strong>) não possui permissão de administrador.
              </p>
              <a href="${isGestor ? '#/gestor-dashboard' : '#/dashboard'}" class="btn btn-primary" style="padding: 0.6rem 1.5rem;">
                Voltar ao Painel
              </a>
            </div>
          </div>
        </main>
      </div>
    `;
    bindSidebarEvents();
    return;
  }

  // Carrega todas as chaves
  let todasChaves = await listarTodasChaves();

  // Função para renderizar estatísticas
  function calcularMetricas(chaves) {
    const total = chaves.length;
    const disponiveis = chaves.filter(c => c.status === 'disponivel').length;
    const utilizadas = chaves.filter(c => c.status === 'utilizada').length;
    const revogadas = chaves.filter(c => c.status === 'revogada').length;
    return { total, disponiveis, utilizadas, revogadas };
  }

  app.innerHTML = `
    ${renderSidebar('admin-licencas')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container page-wide">

          <!-- Header da Página -->
          <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.35rem;">
                <h1 style="margin: 0; font-size: 1.6rem; display: flex; align-items: center; gap: 0.5rem; color: var(--color-text);">
                  <span>🔑</span>
                  <span>Painel de Licenças & Chaves Anti-Fraude</span>
                </h1>
                <span style="background: var(--color-primary); color: #ffffff; border: 1px solid var(--color-border); font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; letter-spacing: 0.05em;">
                  ADMINISTRADOR
                </span>
              </div>
              <p style="margin: 0; color: var(--color-text-muted); font-size: 0.9rem;">
                Gere chaves exclusivas de uso único, controle cotas de trabalhadores e monitore ativações de clientes em tempo real.
              </p>
              <div style="margin-top: 0.4rem; font-size: 0.78rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.4rem;">
                <span>👤 Administrador Ativo:</span>
                <strong style="color: var(--color-primary); font-weight: 700;">${escapeHtml(user.email || 'Admin Master')}</strong>
                <span style="color: var(--color-border);">•</span>
                <span style="color: var(--color-success); font-weight: 600;">● Acesso Autorizado</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <a href="#/gestor-dashboard" class="btn btn-outline" style="font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                <span>🏢 Voltar ao Painel Gestor</span>
              </a>
            </div>
          </div>

          <!-- Cards de Métricas Rápidas -->
          <div id="admin-kpi-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; margin-bottom: 1.75rem;">
            <!-- Renderizado dinamicamente -->
          </div>

          <!-- Grid: Formulário Gerador + Última Chave Gerada -->
          <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 1.25rem; margin-bottom: 2rem;">

            <!-- Card Gerador de Chaves -->
            <div class="card">
              <div class="admin-card-header">
                <span style="font-size: 1.25rem;">✨</span>
                <div>
                  <h2 class="admin-card-title">Gerar Nova Chave de Acesso Único</h2>
                  <span class="admin-card-subtitle">Cada chave gerada só poderá ser ativada por uma única conta</span>
                </div>
              </div>

              <form id="form-gerar-chave">
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label for="admin-tipo-plano" class="admin-field-label">
                    Tipo de Licença / Plano
                  </label>
                  <select id="admin-tipo-plano" class="admin-field-select">
                    <option value="gestor_ilimitado">👑 Gestor Ilimitado (管理者 無制限) — Cadastros Ilimitados</option>
                    <option value="individual_pro">👤 Individual PRO (個人 PRO) — Acesso Completo</option>
                    <option value="gestor_cota">💼 Gestor com Cota Específica (Definir limite)</option>
                  </select>
                </div>

                <div class="form-group" id="group-cota-custom" style="display: none; margin-bottom: 1rem;">
                  <label for="admin-limite-custom" class="admin-field-label">
                    Cota Máxima de Trabalhadores Permitidos
                  </label>
                  <input type="number" id="admin-limite-custom" min="1" max="5000" placeholder="Ex: 10, 20, 50" class="admin-field-input" />
                </div>

                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label for="admin-cliente-nota" class="admin-field-label">
                    Identificação do Cliente / Empresa / Observação
                  </label>
                  <input type="text" id="admin-cliente-nota" placeholder="Ex: Empreiteira Tanaka - Toyota (Contrato Anual)" class="admin-field-input" />
                  <span class="admin-field-help">
                    Serve para você identificar para quem esta chave foi entregue.
                  </span>
                </div>

                <button type="submit" class="btn btn-primary" id="btn-submit-gerar" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: var(--color-primary); border-color: var(--color-primary); font-weight: 700; font-size: 0.92rem; color: #ffffff;">
                  <span>⚡ Gerar Chave Anti-Fraude</span>
                </button>
              </form>
            </div>

            <!-- Card: Visualizador da Chave Recém Gerada -->
            <div class="card admin-result-box" id="card-resultado-chave">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
                  <span class="admin-result-title">
                    Chave Gerada para Envio
                  </span>
                  <span class="badge" id="res-badge-status" style="background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 12px;">
                    🟢 Pronta para uso
                  </span>
                </div>

                <div class="admin-code-token-box">
                  <div class="admin-code-token-label">CÓDIGO DE ATIVAÇÃO:</div>
                  <div id="res-codigo-chave" class="admin-code-token-value">
                    —
                  </div>
                </div>

                <div style="font-size: 0.85rem; color: var(--color-text); display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.25rem;">
                  <div class="admin-detail-row"><strong>Plano:</strong> <span id="res-tipo-plano" style="font-weight: 600;">Selecione e gere acima</span></div>
                  <div class="admin-detail-row"><strong>Destinatário:</strong> <span id="res-cliente-nota" style="font-weight: 600;">—</span></div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4; margin-top: 0.25rem;">
                    🛡️ <em>Esta chave expira automaticamente após o primeiro uso pela conta do cliente.</em>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                <button type="button" class="btn btn-outline" id="btn-copiar-chave-gerada" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.85rem; border-color: var(--color-primary); color: var(--color-primary); font-weight: 600;" disabled>
                  <span>📋 Copiar Apenas o Código</span>
                </button>
                <button type="button" class="btn btn-primary" id="btn-copiar-msg-whatsapp" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.85rem; background: #059669; border-color: #047857; color: #ffffff; font-weight: 600;" disabled>
                  <span>💬 Copiar Mensagem Completa para WhatsApp</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Auditoria e Tabela de Chaves Cadastradas -->
          <div class="card" style="margin-bottom: 2rem;">
            <div class="admin-card-header" style="justify-content: space-between; flex-wrap: wrap;">
              <div>
                <h2 class="admin-card-title" style="display: flex; align-items: center; gap: 0.5rem;">
                  <span>📋</span>
                  <span>Registro de Chaves & Auditoria de Ativações</span>
                </h2>
                <p class="admin-card-subtitle" style="margin: 3px 0 0 0;">
                  Acompanhe quem ativou cada chave, data/hora e o status de cada licença
                </p>
              </div>

              <!-- Filtros de Status -->
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="filter-status-buttons">
                <button type="button" class="btn btn-filter-status active-filter" data-status="todos">
                  Todas (<span id="count-todos">0</span>)
                </button>
                <button type="button" class="btn btn-filter-status" data-status="disponivel">
                  🟢 Disponíveis (<span id="count-disponiveis">0</span>)
                </button>
                <button type="button" class="btn btn-filter-status" data-status="utilizada">
                  🔵 Ativadas (<span id="count-utilizadas">0</span>)
                </button>
                <button type="button" class="btn btn-filter-status" data-status="revogada">
                  🔴 Revogadas (<span id="count-revogadas">0</span>)
                </button>
              </div>
            </div>

            <!-- Barra de Busca -->
            <div style="margin-bottom: 1rem;">
              <input type="text" id="input-busca-chave" placeholder="🔍 Buscar por código, cliente, observação ou e-mail de quem ativou..." class="admin-field-input" />
            </div>

            <!-- Tabela de Chaves -->
            <div style="overflow-x: auto;">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Código da Chave</th>
                    <th>Plano / Cota</th>
                    <th>Cliente / Nota</th>
                    <th>Criado Em</th>
                    <th>Status / Ativado Por</th>
                    <th style="text-align: right;">Ações</th>
                  </tr>
                </thead>
                <tbody id="tbody-chaves">
                  <!-- Linhas renderizadas dinamicamente -->
                </tbody>
              </table>
            </div>

          </div>

          <!-- Seção de Script SQL para Supabase -->
          <details class="card" style="margin-bottom: 2rem;">
            <summary style="cursor: pointer; font-size: 0.88rem; font-weight: 600; color: var(--color-text); display: flex; align-items: center; justify-content: space-between; list-style: none;">
              <span style="display: flex; align-items: center; gap: 0.5rem;">
                <span>🗄️</span>
                <span>Configuração de Banco de Dados Supabase (SQL Schema Opcional)</span>
              </span>
              <span style="font-size: 0.78rem; color: var(--color-primary); font-weight: 600;">Ver SQL ▼</span>
            </summary>
            <div style="margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 1rem;">
              <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 0.75rem;">
                O sistema funciona automaticamente com persistência local e nuvem. Para persistir as chaves na tabela relacional nativa do seu PostgreSQL no Supabase, copie e execute o script abaixo no seu <strong>Supabase SQL Editor</strong>:
              </p>
              <div style="position: relative;">
                <pre style="background: #0f172a; border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem; color: #38bdf8; font-size: 0.78rem; overflow-x: auto; max-height: 250px; font-family: monospace;"><code>${escapeHtml(SQL_SCHEMA_SUPABASE)}</code></pre>
                <button type="button" class="btn btn-outline" id="btn-copiar-sql-schema" style="position: absolute; top: 10px; right: 10px; font-size: 0.75rem; padding: 4px 10px; background: rgba(15, 23, 42, 0.9); color: #f8fafc; border-color: #475569;">
                  📋 Copiar SQL
                </button>
              </div>
            </div>
          </details>

        </div>
      </main>
    </div>
  `;

  bindSidebarEvents();

  // Estados locais
  let filtroStatusAtivo = 'todos';
  let termoBusca = '';
  let ultimaChaveCriada = todasChaves[0] || null;

  // Renderiza métricas dos KPI cards
  function renderMetricas() {
    const { total, disponiveis, utilizadas, revogadas } = calcularMetricas(todasChaves);

    document.getElementById('count-todos').textContent = total;
    document.getElementById('count-disponiveis').textContent = disponiveis;
    document.getElementById('count-utilizadas').textContent = utilizadas;
    document.getElementById('count-revogadas').textContent = revogadas;

    const kpiContainer = document.getElementById('admin-kpi-cards');
    if (!kpiContainer) return;

    kpiContainer.innerHTML = `
      <div class="admin-kpi-card" style="border-left: 4px solid var(--color-primary);">
        <div class="admin-kpi-label">Total de Chaves</div>
        <div class="admin-kpi-value" style="color: var(--color-text);">${total}</div>
        <div class="admin-kpi-sub">Geradas no sistema</div>
      </div>

      <div class="admin-kpi-card" style="border-left: 4px solid var(--color-success);">
        <div class="admin-kpi-label">Disponíveis para Clientes</div>
        <div class="admin-kpi-value" style="color: var(--color-success);">${disponiveis}</div>
        <div class="admin-kpi-sub">Prontas para envio (Uso Único)</div>
      </div>

      <div class="admin-kpi-card" style="border-left: 4px solid #2563eb;">
        <div class="admin-kpi-label">Chaves Ativadas</div>
        <div class="admin-kpi-value" style="color: #2563eb;">${utilizadas}</div>
        <div class="admin-kpi-sub">Vinculadas a contas ativas</div>
      </div>

      <div class="admin-kpi-card" style="border-left: 4px solid var(--color-error);">
        <div class="admin-kpi-label">Chaves Revogadas</div>
        <div class="admin-kpi-value" style="color: var(--color-error);">${revogadas}</div>
        <div class="admin-kpi-sub">Bloqueadas pelo admin</div>
      </div>
    `;
  }

  // Atualiza painel da chave recém gerada
  function atualizarPainelChaveGerada(chave) {
    if (!chave) return;
    ultimaChaveCriada = chave;

    const elCodigo = document.getElementById('res-codigo-chave');
    const elPlano = document.getElementById('res-tipo-plano');
    const elCliente = document.getElementById('res-cliente-nota');
    const elBadge = document.getElementById('res-badge-status');
    const btnCopiar = document.getElementById('btn-copiar-chave-gerada');
    const btnWhats = document.getElementById('btn-copiar-msg-whatsapp');

    if (elCodigo) elCodigo.textContent = chave.codigo;
    if (elPlano) elPlano.textContent = chave.nome_plano;
    if (elCliente) elCliente.textContent = chave.nota_cliente || 'Sem observações';

    if (elBadge) {
      if (chave.status === 'disponivel') {
        elBadge.style.background = 'rgba(16, 185, 129, 0.15)';
        elBadge.style.color = 'var(--color-success)';
        elBadge.textContent = '🟢 Pronta para uso';
      } else if (chave.status === 'utilizada') {
        elBadge.style.background = 'rgba(59, 130, 246, 0.15)';
        elBadge.style.color = 'var(--color-primary)';
        elBadge.textContent = '🔵 Já ativada';
      } else {
        elBadge.style.background = 'rgba(239, 68, 68, 0.15)';
        elBadge.style.color = 'var(--color-error)';
        elBadge.textContent = '🔴 Revogada';
      }
    }

    if (btnCopiar) btnCopiar.disabled = false;
    if (btnWhats) btnWhats.disabled = false;
  }

  // Renderiza tabela de chaves
  function renderTabela() {
    const tbody = document.getElementById('tbody-chaves');
    if (!tbody) return;

    let lista = [...todasChaves];

    // Aplica filtro de status
    if (filtroStatusAtivo !== 'todos') {
      lista = lista.filter(c => c.status === filtroStatusAtivo);
    }

    // Aplica termo de busca
    if (termoBusca) {
      const q = termoBusca.toLowerCase();
      lista = lista.filter(c =>
        (c.codigo && c.codigo.toLowerCase().includes(q)) ||
        (c.nota_cliente && c.nota_cliente.toLowerCase().includes(q)) ||
        (c.nome_plano && c.nome_plano.toLowerCase().includes(q)) ||
        (c.utilizada_por_email && c.utilizada_por_email.toLowerCase().includes(q))
      );
    }

    if (lista.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 2.5rem; text-align: center; color: var(--color-text-muted);">
            Nenhuma chave encontrada com os critérios informados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = lista.map(c => {
      let badgeStatusHtml = '';
      if (c.status === 'disponivel') {
        badgeStatusHtml = `<span class="admin-badge-status-disponivel">🟢 Disponível</span>`;
      } else if (c.status === 'utilizada') {
        const email = c.utilizada_por_email || 'Usuário Ativo';
        const dataAtiv = c.utilizada_em ? new Date(c.utilizada_em).toLocaleDateString('pt-BR') : 'Data não registrada';
        badgeStatusHtml = `
          <div style="display: flex; flex-direction: column; gap: 3px;">
            <span class="admin-badge-status-utilizada">🔵 Ativada</span>
            <span style="font-size: 0.75rem; color: var(--color-text); font-weight: 600;">👤 ${escapeHtml(email)}</span>
            <span style="font-size: 0.72rem; color: var(--color-text-muted);">📅 ${dataAtiv}</span>
          </div>
        `;
      } else {
        badgeStatusHtml = `<span class="admin-badge-status-revogada">🔴 Revogada</span>`;
      }

      const dataCriacao = c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—';

      return `
        <tr data-chave-id="${c.id || c.codigo}">
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <code class="admin-code-cell">
                ${escapeHtml(c.codigo)}
              </code>
              <button type="button" class="btn-copiar-linha" data-codigo="${escapeHtml(c.codigo)}" title="Copiar chave" style="background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 0.95rem; padding: 2px;">
                📋
              </button>
            </div>
          </td>
          <td>
            <strong style="color: var(--color-text); font-weight: 700; display: block;">${escapeHtml(c.nome_plano || c.tipo_plano)}</strong>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500;">
              ${c.limite_trabalhadores ? `Limite: ${c.limite_trabalhadores} trabalhadores` : 'Ilimitado'}
            </span>
          </td>
          <td>
            <span style="color: var(--color-text); font-weight: 500;">
              ${escapeHtml(c.nota_cliente || '—')}
            </span>
          </td>
          <td>
            <span style="color: var(--color-text-secondary); font-size: 0.78rem;">
              ${dataCriacao}
            </span>
          </td>
          <td>
            ${badgeStatusHtml}
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.35rem;">
              ${c.status === 'disponivel' ? `
                <button type="button" class="btn-action-revogar btn-revogar" data-id="${c.id || c.codigo}" title="Revogar chave">
                  Revogar
                </button>
              ` : c.status === 'revogada' ? `
                <button type="button" class="btn-action-reativar btn-reativar" data-id="${c.id || c.codigo}" title="Reativar chave">
                  Reativar
                </button>
              ` : `
                <button type="button" class="btn-action-revogar btn-revogar" data-id="${c.id || c.codigo}" title="Revogar acesso">
                  Revogar Acesso
                </button>
              `}
              <button type="button" class="btn-action-excluir btn-excluir" data-id="${c.id || c.codigo}" title="Excluir do histórico">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Inicializa visualizações
  renderMetricas();
  renderTabela();
  if (ultimaChaveCriada) {
    atualizarPainelChaveGerada(ultimaChaveCriada);
  }

  // Alterna exibição do input de cota customizada
  const selTipoPlano = document.getElementById('admin-tipo-plano');
  const groupCota = document.getElementById('group-cota-custom');
  selTipoPlano?.addEventListener('change', (e) => {
    if (groupCota) {
      groupCota.style.display = e.target.value === 'gestor_cota' ? 'block' : 'none';
    }
  });

  // Formulário de geração de chave
  const formGerar = document.getElementById('form-gerar-chave');
  formGerar?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tipo = selTipoPlano?.value || 'gestor_ilimitado';
    const nota = document.getElementById('admin-cliente-nota')?.value || '';
    const limiteCustom = tipo === 'gestor_cota' ? document.getElementById('admin-limite-custom')?.value : null;

    const btn = document.getElementById('btn-submit-gerar');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Gerando Chave Única...</span>';
    }

    try {
      const nova = await criarNovaChave({
        tipoPlano: tipo === 'gestor_cota' ? 'gestor_ilimitado' : tipo,
        clienteNota: nota,
        limiteTrabalhadores: limiteCustom,
        criadoPor: user.email || 'admin'
      });

      todasChaves.unshift(nova);
      renderMetricas();
      renderTabela();
      atualizarPainelChaveGerada(nova);

      // Limpa formulário
      document.getElementById('admin-cliente-nota').value = '';
      if (document.getElementById('admin-limite-custom')) {
        document.getElementById('admin-limite-custom').value = '';
      }

      // Scroll suave para o card de resultado
      document.getElementById('card-resultado-chave')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
      alert('Erro ao gerar chave: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡ Gerar Chave Anti-Fraude</span>';
      }
    }
  });

  // Copiar código da chave
  document.getElementById('btn-copiar-chave-gerada')?.addEventListener('click', async () => {
    if (!ultimaChaveCriada) return;
    try {
      await navigator.clipboard.writeText(ultimaChaveCriada.codigo);
      const btn = document.getElementById('btn-copiar-chave-gerada');
      btn.innerHTML = '<span>✅ Código Copiado!</span>';
      setTimeout(() => {
        btn.innerHTML = '<span>📋 Copiar Apenas o Código</span>';
      }, 2000);
    } catch (e) {
      alert('Código: ' + ultimaChaveCriada.codigo);
    }
  });

  // Copiar mensagem para WhatsApp
  document.getElementById('btn-copiar-msg-whatsapp')?.addEventListener('click', async () => {
    if (!ultimaChaveCriada) return;
    const msg = `Olá! Segue sua chave de ativação para liberação do sistema マイ個人 (Keiro Jikan):

🔑 *Chave de Acesso:* \`${ultimaChaveCriada.codigo}\`
📋 *Plano:* ${ultimaChaveCriada.nome_plano}
🏢 *Cliente/Identificação:* ${ultimaChaveCriada.nota_cliente || 'Acesso Autorizado'}

⚠️ *Atenção (Uso Único Anti-Fraude):*
Esta chave é de uso único e será vinculada exclusivamente à sua conta no primeiro uso.

*Como ativar:*
1. Faça login na sua conta no sistema.
2. Acesse o menu "Chave de Acesso / Licença".
3. Cole sua chave acima e clique em "Ativar Acesso Agora".

Qualquer dúvida estamos à disposição!`;

    try {
      await navigator.clipboard.writeText(msg);
      const btn = document.getElementById('btn-copiar-msg-whatsapp');
      btn.innerHTML = '<span>✅ Mensagem Copiada para o WhatsApp!</span>';
      setTimeout(() => {
        btn.innerHTML = '<span>💬 Copiar Mensagem Completa para WhatsApp</span>';
      }, 2000);
    } catch (e) {
      alert('Não foi possível copiar automaticamente.');
    }
  });

  // Copiar chave diretamente da linha da tabela
  document.getElementById('tbody-chaves')?.addEventListener('click', async (e) => {
    const btnCopy = e.target.closest('.btn-copiar-linha');
    if (btnCopy) {
      const cod = btnCopy.dataset.codigo;
      if (cod) {
        try {
          await navigator.clipboard.writeText(cod);
          btnCopy.textContent = '✅';
          setTimeout(() => { btnCopy.textContent = '📋'; }, 1500);
        } catch (err) {
          alert('Chave: ' + cod);
        }
      }
      return;
    }

    // Ação: Revogar
    const btnRevogar = e.target.closest('.btn-revogar');
    if (btnRevogar) {
      const id = btnRevogar.dataset.id;
      if (confirm('Tem certeza que deseja revogar esta chave? O acesso associado a ela será bloqueado.')) {
        await revogarChave(id);
        const item = todasChaves.find(c => c.id === id || c.codigo === id);
        if (item) item.status = 'revogada';
        renderMetricas();
        renderTabela();
        if (ultimaChaveCriada && (ultimaChaveCriada.id === id || ultimaChaveCriada.codigo === id)) {
          atualizarPainelChaveGerada(item);
        }
      }
      return;
    }

    // Ação: Reativar
    const btnReativar = e.target.closest('.btn-reativar');
    if (btnReativar) {
      const id = btnReativar.dataset.id;
      await reativarChave(id);
      const item = todasChaves.find(c => c.id === id || c.codigo === id);
      if (item) item.status = 'disponivel';
      renderMetricas();
      renderTabela();
      if (ultimaChaveCriada && (ultimaChaveCriada.id === id || ultimaChaveCriada.codigo === id)) {
        atualizarPainelChaveGerada(item);
      }
      return;
    }

    // Ação: Excluir
    const btnExcluir = e.target.closest('.btn-excluir');
    if (btnExcluir) {
      const id = btnExcluir.dataset.id;
      if (confirm('Deseja excluir esta chave do histórico?')) {
        await excluirChave(id);
        todasChaves = todasChaves.filter(c => c.id !== id && c.codigo !== id);
        renderMetricas();
        renderTabela();
      }
      return;
    }
  });

  // Filtros de status
  document.getElementById('filter-status-buttons')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-filter-status');
    if (!btn) return;
    document.querySelectorAll('.btn-filter-status').forEach(b => b.classList.remove('active-filter'));
    btn.classList.add('active-filter');
    filtroStatusAtivo = btn.dataset.status;
    renderTabela();
  });

  // Barra de busca
  document.getElementById('input-busca-chave')?.addEventListener('input', (e) => {
    termoBusca = e.target.value.trim();
    renderTabela();
  });

  // Copiar SQL Schema
  document.getElementById('btn-copiar-sql-schema')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCHEMA_SUPABASE);
      const btn = document.getElementById('btn-copiar-sql-schema');
      btn.textContent = '✅ SQL Copiado!';
      setTimeout(() => { btn.textContent = '📋 Copiar SQL'; }, 2000);
    } catch (e) {
      alert('Erro ao copiar SQL.');
    }
  });
}
