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
            <div class="card" style="text-align: center; padding: 3rem 1.5rem; max-width: 520px; margin: 3rem auto; border: 1px solid #ef4444; background: rgba(239, 68, 68, 0.05); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);">
              <div style="font-size: 3.5rem; margin-bottom: 1rem;">⛔</div>
              <h2 style="color: #ef4444; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">Acesso Não Autorizado</h2>
              <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; margin-bottom: 1.5rem;">
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
                <h1 style="margin: 0; font-size: 1.6rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span>🔑</span>
                  <span>Painel de Licenças & Chaves Anti-Fraude</span>
                </h1>
                <span class="badge-role-gestor" style="background: #4338ca; color: #e0e7ff; border: 1px solid #6366f1;">
                  ADMINISTRADOR
                </span>
              </div>
              <p style="margin: 0; color: var(--color-text-muted); font-size: 0.9rem;">
                Gere chaves exclusivas de uso único, controle cotas de trabalhadores e monitore ativações de clientes em tempo real.
              </p>
              <div style="margin-top: 0.4rem; font-size: 0.76rem; color: #94a3b8; display: flex; align-items: center; gap: 0.4rem;">
                <span>👤 Administrador Ativo:</span>
                <strong style="color: #38bdf8;">${escapeHtml(user.email || 'Admin Master')}</strong>
                <span style="color: #64748b;">•</span>
                <span style="color: #10b981;">● Acesso Autorizado</span>
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
            <div class="card" style="border: 1px solid #334155;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.85rem;">
                <span style="font-size: 1.25rem;">✨</span>
                <div>
                  <h2 style="font-size: 1.05rem; font-weight: 700; margin: 0; color: #f8fafc;">Gerar Nova Chave de Acesso Único</h2>
                  <span style="font-size: 0.76rem; color: #94a3b8;">Cada chave gerada só poderá ser ativada por uma única conta</span>
                </div>
              </div>

              <form id="form-gerar-chave">
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label for="admin-tipo-plano" style="font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.35rem; display: block;">
                    Tipo de Licença / Plano
                  </label>
                  <select id="admin-tipo-plano" style="width: 100%; padding: 0.6rem 0.8rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 0.85rem;">
                    <option value="gestor_ilimitado">👑 Gestor Ilimitado (管理者 無制限) — Cadastros Ilimitados</option>
                    <option value="individual_pro">👤 Individual PRO (個人 PRO) — Acesso Completo</option>
                    <option value="gestor_cota">💼 Gestor com Cota Específica (Definir limite)</option>
                  </select>
                </div>

                <div class="form-group" id="group-cota-custom" style="display: none; margin-bottom: 1rem;">
                  <label for="admin-limite-custom" style="font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.35rem; display: block;">
                    Cota Máxima de Trabalhadores Permitidos
                  </label>
                  <input type="number" id="admin-limite-custom" min="1" max="5000" placeholder="Ex: 10, 20, 50" style="width: 100%; padding: 0.6rem 0.8rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 0.85rem;" />
                </div>

                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label for="admin-cliente-nota" style="font-size: 0.82rem; font-weight: 600; color: #cbd5e1; margin-bottom: 0.35rem; display: block;">
                    Identificação do Cliente / Empresa / Observação
                  </label>
                  <input type="text" id="admin-cliente-nota" placeholder="Ex: Empreiteira Tanaka - Toyota (Contrato Anual)" style="width: 100%; padding: 0.6rem 0.8rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #f8fafc; font-size: 0.85rem;" />
                  <span style="font-size: 0.72rem; color: #64748b; margin-top: 0.25rem; display: block;">
                    Serve para você identificar para quem esta chave foi entregue.
                  </span>
                </div>

                <button type="submit" class="btn btn-primary" id="btn-submit-gerar" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%); border: none; font-weight: 600; font-size: 0.9rem;">
                  <span>⚡ Gerar Chave Anti-Fraude</span>
                </button>
              </form>
            </div>

            <!-- Card: Visualizador da Chave Recém Gerada -->
            <div class="card" id="card-resultado-chave" style="border: 1px solid #3b82f6; background: rgba(30, 41, 59, 0.5); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid #334155; padding-bottom: 0.75rem;">
                  <span style="font-size: 0.85rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em;">
                    Chave Gerada para Envio
                  </span>
                  <span class="badge" id="res-badge-status" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.7rem; padding: 2px 8px; border-radius: 12px;">
                    🟢 Pronta para uso
                  </span>
                </div>

                <div style="background: #020617; border: 1.5px dashed #3b82f6; border-radius: 8px; padding: 1rem; text-align: center; margin-bottom: 1rem;">
                  <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.3rem;">CÓDIGO DE ATIVAÇÃO:</div>
                  <div id="res-codigo-chave" style="font-family: monospace; font-size: 1.25rem; font-weight: 800; color: #38bdf8; letter-spacing: 0.08em; word-break: break-all;">
                    —
                  </div>
                </div>

                <div style="font-size: 0.8rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem;">
                  <div><strong style="color: #94a3b8;">Plano:</strong> <span id="res-tipo-plano">Selecione e gere acima</span></div>
                  <div><strong style="color: #94a3b8;">Destinatário:</strong> <span id="res-cliente-nota">—</span></div>
                  <div style="font-size: 0.72rem; color: #64748b; line-height: 1.35;">
                    🛡️ <em>Esta chave expira automaticamente após o primeiro uso pela conta do cliente.</em>
                  </div>
                </div>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <button type="button" class="btn btn-outline" id="btn-copiar-chave-gerada" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.82rem; border-color: #3b82f6; color: #93c5fd;" disabled>
                  <span>📋 Copiar Apenas o Código</span>
                </button>
                <button type="button" class="btn btn-primary" id="btn-copiar-msg-whatsapp" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.82rem; background: #059669; border-color: #10b981;" disabled>
                  <span>💬 Copiar Mensagem Completa para WhatsApp</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Auditoria e Tabela de Chaves Cadastradas -->
          <div class="card" style="border: 1px solid #334155; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem;">
              <div>
                <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0; color: #f8fafc; display: flex; align-items: center; gap: 0.5rem;">
                  <span>📋</span>
                  <span>Registro de Chaves & Auditoria de Ativações</span>
                </h2>
                <p style="font-size: 0.78rem; color: #94a3b8; margin: 2px 0 0 0;">
                  Acompanhe quem ativou cada chave, data/hora e o status de cada licença
                </p>
              </div>

              <!-- Filtros de Status -->
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="filter-status-buttons">
                <button type="button" class="btn btn-outline btn-filter-status active-filter" data-status="todos" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
                  Todas (<span id="count-todos">0</span>)
                </button>
                <button type="button" class="btn btn-outline btn-filter-status" data-status="disponivel" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; border-color: #10b981; color: #6ee7b7;">
                  🟢 Disponíveis (<span id="count-disponiveis">0</span>)
                </button>
                <button type="button" class="btn btn-outline btn-filter-status" data-status="utilizada" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; border-color: #3b82f6; color: #93c5fd;">
                  🔵 Ativadas (<span id="count-utilizadas">0</span>)
                </button>
                <button type="button" class="btn btn-outline btn-filter-status" data-status="revogada" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; border-color: #ef4444; color: #fca5a5;">
                  🔴 Revogadas (<span id="count-revogadas">0</span>)
                </button>
              </div>
            </div>

            <!-- Barra de Busca -->
            <div style="margin-bottom: 1rem;">
              <input type="text" id="input-busca-chave" placeholder="🔍 Buscar por código, cliente, observação ou e-mail de quem ativou..." style="width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #f8fafc; font-size: 0.85rem;" />
            </div>

            <!-- Tabela de Chaves -->
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left;">
                <thead>
                  <tr style="border-bottom: 2px solid #334155; color: #94a3b8; font-size: 0.74rem; text-transform: uppercase;">
                    <th style="padding: 0.75rem 0.5rem;">Código da Chave</th>
                    <th style="padding: 0.75rem 0.5rem;">Plano / Cota</th>
                    <th style="padding: 0.75rem 0.5rem;">Cliente / Nota</th>
                    <th style="padding: 0.75rem 0.5rem;">Criado Em</th>
                    <th style="padding: 0.75rem 0.5rem;">Status / Ativado Por</th>
                    <th style="padding: 0.75rem 0.5rem; text-align: right;">Ações</th>
                  </tr>
                </thead>
                <tbody id="tbody-chaves">
                  <!-- Linhas renderizadas dinamicamente -->
                </tbody>
              </table>
            </div>

          </div>

          <!-- Seção de Script SQL para Supabase -->
          <details class="card" style="border: 1px solid #334155; background: #0b1120;">
            <summary style="cursor: pointer; font-size: 0.88rem; font-weight: 600; color: #cbd5e1; display: flex; align-items: center; justify-content: space-between; list-style: none;">
              <span style="display: flex; align-items: center; gap: 0.5rem;">
                <span>🗄️</span>
                <span>Configuração de Banco de Dados Supabase (SQL Schema Opcional)</span>
              </span>
              <span style="font-size: 0.75rem; color: #60a5fa;">Ver SQL ▼</span>
            </summary>
            <div style="margin-top: 1rem; border-top: 1px solid #1e293b; padding-top: 1rem;">
              <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem;">
                O sistema funciona automaticamente com persistência local e nuvem. Para persistir as chaves na tabela relacional nativa do seu PostgreSQL no Supabase, copie e execute o script abaixo no seu <strong>Supabase SQL Editor</strong>:
              </p>
              <div style="position: relative;">
                <pre style="background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 1rem; color: #38bdf8; font-size: 0.75rem; overflow-x: auto; max-height: 250px; font-family: monospace;"><code>${escapeHtml(SQL_SCHEMA_SUPABASE)}</code></pre>
                <button type="button" class="btn btn-outline" id="btn-copiar-sql-schema" style="position: absolute; top: 10px; right: 10px; font-size: 0.72rem; padding: 4px 8px; background: #0f172a;">
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
      <div class="card" style="padding: 1rem; border-left: 4px solid #6366f1;">
        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Total de Chaves</div>
        <div style="font-size: 1.6rem; font-weight: 700; color: #f8fafc; margin-top: 0.2rem;">${total}</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.2rem;">Geradas no sistema</div>
      </div>

      <div class="card" style="padding: 1rem; border-left: 4px solid #10b981;">
        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Disponíveis para Clientes</div>
        <div style="font-size: 1.6rem; font-weight: 700; color: #10b981; margin-top: 0.2rem;">${disponiveis}</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.2rem;">Prontas para envio (Uso Único)</div>
      </div>

      <div class="card" style="padding: 1rem; border-left: 4px solid #3b82f6;">
        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Chaves Ativadas</div>
        <div style="font-size: 1.6rem; font-weight: 700; color: #3b82f6; margin-top: 0.2rem;">${utilizadas}</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.2rem;">Vinculadas a contas ativas</div>
      </div>

      <div class="card" style="padding: 1rem; border-left: 4px solid #ef4444;">
        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase;">Chaves Revogadas</div>
        <div style="font-size: 1.6rem; font-weight: 700; color: #ef4444; margin-top: 0.2rem;">${revogadas}</div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.2rem;">Bloqueadas pelo admin</div>
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
        elBadge.style.background = 'rgba(16, 185, 129, 0.2)';
        elBadge.style.color = '#10b981';
        elBadge.textContent = '🟢 Pronta para uso';
      } else if (chave.status === 'utilizada') {
        elBadge.style.background = 'rgba(59, 130, 246, 0.2)';
        elBadge.style.color = '#38bdf8';
        elBadge.textContent = '🔵 Já ativada';
      } else {
        elBadge.style.background = 'rgba(239, 68, 68, 0.2)';
        elBadge.style.color = '#ef4444';
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
        badgeStatusHtml = `<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 0.72rem;">🟢 Disponível</span>`;
      } else if (c.status === 'utilizada') {
        const email = c.utilizada_por_email || 'Usuário Ativo';
        const dataAtiv = c.utilizada_em ? new Date(c.utilizada_em).toLocaleDateString('pt-BR') : 'Data não registrada';
        badgeStatusHtml = `
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 2px 7px; border-radius: 6px; font-weight: 600; font-size: 0.72rem; display: inline-block; width: fit-content;">🔵 Ativada</span>
            <span style="font-size: 0.72rem; color: #cbd5e1;">👤 ${escapeHtml(email)}</span>
            <span style="font-size: 0.68rem; color: #64748b;">📅 ${dataAtiv}</span>
          </div>
        `;
      } else {
        badgeStatusHtml = `<span style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 0.72rem;">🔴 Revogada</span>`;
      }

      const dataCriacao = c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—';

      return `
        <tr style="border-bottom: 1px solid #1e293b;" data-chave-id="${c.id || c.codigo}">
          <td style="padding: 0.85rem 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <code style="font-family: monospace; font-size: 0.88rem; font-weight: 700; color: #38bdf8; background: #020617; padding: 3px 6px; border-radius: 4px; border: 1px solid #334155;">
                ${escapeHtml(c.codigo)}
              </code>
              <button type="button" class="btn-copiar-linha" data-codigo="${escapeHtml(c.codigo)}" title="Copiar chave" style="background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px;">
                📋
              </button>
            </div>
          </td>
          <td style="padding: 0.85rem 0.5rem;">
            <strong style="color: #f1f5f9; display: block;">${escapeHtml(c.nome_plano || c.tipo_plano)}</strong>
            <span style="font-size: 0.7rem; color: #94a3b8;">
              ${c.limite_trabalhadores ? `Limite: ${c.limite_trabalhadores} trabalhadores` : 'Ilimitado'}
            </span>
          </td>
          <td style="padding: 0.85rem 0.5rem; color: #cbd5e1;">
            ${escapeHtml(c.nota_cliente || '—')}
          </td>
          <td style="padding: 0.85rem 0.5rem; color: #94a3b8; font-size: 0.75rem;">
            ${dataCriacao}
          </td>
          <td style="padding: 0.85rem 0.5rem;">
            ${badgeStatusHtml}
          </td>
          <td style="padding: 0.85rem 0.5rem; text-align: right;">
            <div style="display: inline-flex; gap: 0.3rem;">
              ${c.status === 'disponivel' ? `
                <button type="button" class="btn btn-outline btn-revogar" data-id="${c.id || c.codigo}" style="padding: 3px 8px; font-size: 0.72rem; border-color: #ef4444; color: #fca5a5;" title="Revogar chave">
                  Revogar
                </button>
              ` : c.status === 'revogada' ? `
                <button type="button" class="btn btn-outline btn-reativar" data-id="${c.id || c.codigo}" style="padding: 3px 8px; font-size: 0.72rem; border-color: #10b981; color: #6ee7b7;" title="Reativar chave">
                  Reativar
                </button>
              ` : `
                <button type="button" class="btn btn-outline btn-revogar" data-id="${c.id || c.codigo}" style="padding: 3px 8px; font-size: 0.72rem; border-color: #ef4444; color: #fca5a5;" title="Revogar acesso">
                  Revogar Acesso
                </button>
              `}
              <button type="button" class="btn btn-outline btn-excluir" data-id="${c.id || c.codigo}" style="padding: 3px 6px; font-size: 0.72rem; border-color: #475569; color: #94a3b8;" title="Excluir do histórico">
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
