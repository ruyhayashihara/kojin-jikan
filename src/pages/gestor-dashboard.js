import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';
import { escapeHtml } from '../security.js';
import { loadOrInitTrabalhadores, getAllRegistrosForMonthEquipe, resetAndRegenerateMockData } from '../mock-data.js';
import { prepararDadosRirekisho } from '../rirekisho-translator.js';
import { imprimirRirekisho } from '../rirekisho-pdf.js';
import { obterStatusPlano, isUsuarioAdmin } from '../licencas-service.js';
import { openModalAtivacao } from '../modal-ativacao.js';

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function formatHours(dec) {
  if (dec === null || dec === undefined || isNaN(dec) || dec <= 0) return '0h';
  const num = parseFloat(Number(dec).toFixed(2));
  return `${num}h`;
}

export async function renderGestorDashboard(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login?role=gestor'); return; }

  // Garante role ativa de gestor
  sessionStorage.setItem('keiro_active_role', 'gestor');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Carrega trabalhadores deste gestor (ou inicializa os 10 fictícios)
  const { trabalhadores } = await loadOrInitTrabalhadores(user.id, supabase);

  // Carrega registros de horas do mês atual para toda a equipe (~250h por trabalhador)
  const registrosMes = await getAllRegistrosForMonthEquipe(currentYear, currentMonth, supabase);

  // Consolida métricas
  const totalTrabalhadores = trabalhadores.length;
  const trabalhadoresAtivos = trabalhadores.filter(t => t.ativo !== false).length;

  // Consulta status do plano e cotas do gestor
  const statusPlano = await obterStatusPlano(user, 'gestor', totalTrabalhadores);

  // Mapeia horas por trabalhador
  const horasPorTrabalhador = {};
  trabalhadores.forEach(t => {
    horasPorTrabalhador[t.id] = 0;
  });

  let totalHorasEquipe = 0;
  let totalFolhaEstimada = 0;

  registrosMes.forEach(r => {
    if (r.trabalhador_id && horasPorTrabalhador[r.trabalhador_id] !== undefined) {
      horasPorTrabalhador[r.trabalhador_id] += (r.total_horas || 0);
      totalHorasEquipe += (r.total_horas || 0);
    }
  });

  // Calcula estimativa da folha bruta
  trabalhadores.forEach(t => {
    const h = horasPorTrabalhador[t.id] || 0;
    const taxa = t.valor_hora || 0;
    totalFolhaEstimada += (h * taxa);
  });

  // Identifica vistos (Zairyu Card) que vencem nos próximos 60 dias
  const alertasVisto = trabalhadores.filter(t => {
    if (!t.validade_zairyu) return false;
    const expDate = new Date(t.validade_zairyu);
    const diffTime = expDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 60; // Menos de 60 dias para vencer ou vencido
  }).map(t => {
    const expDate = new Date(t.validade_zairyu);
    const diffDays = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    return {
      id: t.id,
      codigo: t.codigo_trabalhador,
      nome: t.nome_alfabeto || t.nome_kanji,
      validade: t.validade_zairyu,
      diasRestantes: diffDays,
      vencido: diffDays < 0
    };
  });

  app.innerHTML = `
    ${renderSidebar('gestor-dashboard')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container page-wide">

          <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h1>Painel do Gestor</h1>
                <span class="badge-role-gestor">管理者</span>
              </div>
              <p>${MESES_NOME[currentMonth - 1]} ${currentYear} — Gestão de Equipe & Folha de Ponto (チーム管理)</p>
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-outline" id="btn-seed-mock-data" style="display: inline-flex; align-items: center; gap: 0.4rem; border-color: #6366f1; color: #a5b4fc;" title="Gerar ou resetar 10 funcionários fictícios com 1 ano de horas (~250h/mês)">
                <span>🧪 Gerar 10 Funcionários (~250h/mês)</span>
              </button>
              <button type="button" class="btn btn-primary" id="btn-dash-novo-trabalhador" style="display: inline-flex; align-items: center; gap: 0.4rem; ${statusPlano.atingiuLimite && !statusPlano.isPro ? 'background: #dc2626; border-color: #ef4444;' : ''}">
                ${statusPlano.atingiuLimite && !statusPlano.isPro ? '🔒' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
                <span>Cadastrar Trabalhador</span>
              </button>
              <a href="#/registro-horas" class="btn btn-outline" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Apontar Horas</span>
              </a>
            </div>
          </div>

          <!-- Card de Status do Plano e Chave de Liberação -->
          <div class="card" style="margin-bottom: 1.5rem; border: 1px solid ${statusPlano.isPro ? '#3b82f6' : (statusPlano.atingiuLimite ? '#ef4444' : '#334155')}; background: ${statusPlano.isPro ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)' : (statusPlano.atingiuLimite ? 'rgba(239, 68, 68, 0.08)' : 'rgba(30, 41, 59, 0.6)')}; padding: 1.15rem 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: ${statusPlano.isPro ? 'rgba(59, 130, 246, 0.2)' : (statusPlano.atingiuLimite ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)')}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                  ${statusPlano.isPro ? '👑' : (statusPlano.atingiuLimite ? '🔒' : '💼')}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #f8fafc;">${escapeHtml(statusPlano.nomePlano)}</h3>
                    <span class="badge" style="font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; ${statusPlano.isPro ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);' : (statusPlano.atingiuLimite ? 'background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4);' : 'background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3);')}">
                      ${statusPlano.isPro ? 'Acesso Completo Ativado' : `${statusPlano.totalCadastrados} / ${statusPlano.limite} cadastros utilizados`}
                    </span>
                  </div>
                  <p style="margin: 3px 0 0 0; font-size: 0.8rem; color: #94a3b8;">
                    ${statusPlano.isPro
                      ? `Chave exclusiva anti-fraude vinculada: <code style="color: #38bdf8; font-weight: 700; background: #020617; padding: 2px 6px; border-radius: 4px;">${escapeHtml(statusPlano.chaveCodigo || 'PRO')}</code>`
                      : (statusPlano.atingiuLimite
                        ? `<span style="color: #fca5a5; font-weight: 600;">Limite gratuito de 5 cadastros atingido.</span> Desbloqueie cadastros ilimitados com sua chave única.`
                        : `Plano básico gratuito com cota de até 5 cadastros (${statusPlano.restantes} restante${statusPlano.restantes === 1 ? '' : 's'}).`)}
                  </p>
                </div>
              </div>

              <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${statusPlano.isPro ? `
                  ${isUsuarioAdmin(user) ? `
                    <a href="#/admin-licencas" class="btn btn-outline" style="font-size: 0.82rem; border-color: #3b82f6; color: #93c5fd; display: inline-flex; align-items: center; gap: 0.35rem;">
                      <span>⚙️ Painel de Licenças</span>
                    </a>
                  ` : `
                    <span style="font-size: 0.82rem; color: #34d399; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(16, 185, 129, 0.1); border: 1px solid #059669; padding: 0.35rem 0.75rem; border-radius: 6px;">
                      <span>✓ Plano PRO Ativo</span>
                    </span>
                  `}
                ` : `
                  <button type="button" class="btn btn-primary" id="btn-ativar-plano-dash" style="font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem; background: ${statusPlano.atingiuLimite ? '#dc2626' : '#2563eb'}; border-color: ${statusPlano.atingiuLimite ? '#ef4444' : '#3b82f6'};">
                    <span>🔑 Inserir Chave de Liberação</span>
                  </button>
                `}
              </div>
            </div>

            ${!statusPlano.isPro ? `
              <div style="margin-top: 0.85rem; background: #020617; border-radius: 6px; height: 8px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="width: ${statusPlano.percentualUso}%; height: 100%; background: ${statusPlano.atingiuLimite ? '#ef4444' : (statusPlano.percentualUso > 60 ? '#f59e0b' : '#3b82f6')}; transition: width 0.3s ease;"></div>
              </div>
            ` : ''}
          </div>

          ${alertasVisto.length > 0 ? `
          <div class="card" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem; font-size: 0.95rem;">
              <span>⚠️</span>
              <span>Atenção: Validade de Visto (在留カード期限警告)</span>
            </div>
            <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.75rem;">
              Há trabalhadores com visto de permanência expirado ou com vencimento nos próximos 60 dias:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.6rem;">
              ${alertasVisto.map(a => `
                <div style="background: #1e293b; border: 1px solid ${a.vencido ? '#ef4444' : '#f59e0b'}; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.82rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span class="badge-worker-id">${escapeHtml(a.codigo)}</span>
                  <strong>${escapeHtml(a.nome)}</strong>
                  <span style="color: ${a.vencido ? '#f87171' : '#fbbf24'}; font-weight: 600;">
                    ${a.vencido ? `VENCIDO (${Math.abs(a.diasRestantes)}d)` : `Vence em ${a.diasRestantes} dias (${a.validade})`}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Bento Grid de KPIs da Equipe -->
          <div class="bento-grid">
            <div class="bento-card">
              <div class="bento-icon bento-icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div class="bento-label">Equipe Cadastrada</div>
              <div class="bento-value">${totalTrabalhadores}</div>
              <div class="bento-sub">${trabalhadoresAtivos} ativos no momento</div>
            </div>

            <div class="bento-card">
              <div class="bento-icon bento-icon-indigo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="bento-label">Horas Equipe (Mês)</div>
              <div class="bento-value">${formatHours(totalHorasEquipe)}</div>
              <div class="bento-sub">${MESES_NOME[currentMonth - 1]} ${currentYear}</div>
            </div>

            <div class="bento-card">
              <div class="bento-icon bento-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div class="bento-label">Previsão Folha Bruta</div>
              <div class="bento-value">¥${Math.round(totalFolhaEstimada).toLocaleString('ja-JP')}</div>
              <div class="bento-sub">Estimativa do mês em curso</div>
            </div>

            <div class="bento-card ${alertasVisto.length > 0 ? 'bento-card-red' : ''}">
              <div class="bento-icon ${alertasVisto.length > 0 ? 'bento-icon-red' : 'bento-icon-emerald'}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="12" y2="16"/></svg>
              </div>
              <div class="bento-label">Alertas de Visto</div>
              <div class="bento-value" style="${alertasVisto.length > 0 ? 'color: #ef4444;' : ''}">${alertasVisto.length}</div>
              <div class="bento-sub">${alertasVisto.length > 0 ? 'Requer atenção imediata' : 'Documentação regular'}</div>
            </div>
          </div>

          <!-- Tabela de Visão Rápida dos Trabalhadores -->
          <div class="card" style="margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <h2 class="section-title" style="margin: 0;">Trabalhadores Cadastrados (従業員一覧)</h2>
              <a href="#/gestor-trabalhadores" style="font-size: 0.85rem; color: #3b82f6; text-decoration: none; font-weight: 600;">
                Ver todos os registros →
              </a>
            </div>

            ${trabalhadores.length === 0 ? `
              <div style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8;">
                <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">👥</div>
                <div style="font-size: 1.1rem; font-weight: 600; color: #f8fafc; margin-bottom: 0.5rem;">Nenhum trabalhador cadastrado ainda</div>
                <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 1.5rem auto;">
                  Cadastre prestadores ou funcionários com ID exclusivo e dados da ficha cadastral japonesa (履歴書) para administrar horas e pagamentos.
                </p>
                <a href="#/gestor-trabalhadores" class="btn btn-primary">
                  + Cadastrar Primeiro Trabalhador
                </a>
              </div>
            ` : `
              <div style="overflow-x: auto;">
                <table class="summary-table" style="width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 100px;">ID</th>
                      <th>Nome / 氏名</th>
                      <th>Contrato & Função</th>
                      <th class="col-num">Taxa Base</th>
                      <th class="col-num">Horas (${MESES_NOME[currentMonth - 1].slice(0, 3)})</th>
                      <th>Visto / Zairyu</th>
                      <th style="text-align: center; width: 140px;">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${trabalhadores.slice(0, 10).map(t => {
                      const h = horasPorTrabalhador[t.id] || 0;
                      return `
                        <tr class="worker-row-clickable" data-worker-id="${t.id}" title="Clique para abrir a Ficha Cadastral de ${escapeHtml(t.nome_alfabeto)}">
                          <td><span class="badge-worker-id">${escapeHtml(t.codigo_trabalhador)}</span></td>
                          <td>
                            <strong>${escapeHtml(t.nome_alfabeto)}</strong>
                            ${t.nome_kanji ? `<div style="font-size: 0.75rem; color: #94a3b8;">${escapeHtml(t.nome_kanji)} ${t.nome_kana ? `(${escapeHtml(t.nome_kana)})` : ''}</div>` : ''}
                          </td>
                          <td>
                            <div style="font-size: 0.82rem; font-weight: 500;">${escapeHtml(t.tipo_contrato || '業務委託')}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">${escapeHtml(t.cargo_funcao || 'Prestador de Serviço')}</div>
                          </td>
                          <td class="col-num">¥${(t.valor_hora || 0).toLocaleString('ja-JP')}/h</td>
                          <td class="col-num" style="font-weight: 600;">${formatHours(h)}</td>
                          <td>
                            <span style="font-size: 0.8rem; background: #334155; padding: 2px 6px; border-radius: 4px; color: #e2e8f0;">
                              ${escapeHtml(t.tipo_visto || 'Não inf.')}
                            </span>
                          </td>
                          <td style="text-align: center;">
                            <div style="display: flex; gap: 0.35rem; justify-content: center;">
                              <button type="button" class="btn btn-outline btn-quick-rirekisho" data-id="${t.id}" style="font-size: 0.75rem; padding: 3px 6px; border-color: #0284c7; color: #38bdf8;" title="Exportar Currículo Japonês (履歴書 PDF)">
                                履歴書
                              </button>
                              <a href="#/gestor-trabalhadores?editar=${t.id}" class="btn btn-outline" style="font-size: 0.75rem; padding: 3px 8px;" title="Ver Ficha Cadastral">
                                Ficha
                              </a>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

        </div>
      </main>
    </div>
  `;

  bindSidebarEvents();

  // Exportação rápida de 履歴書 na tabela do dashboard
  document.querySelectorAll('.btn-quick-rirekisho').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      let printWin = null;
      try {
        printWin = window.open('about:blank', '_blank');
        if (printWin) {
          printWin.document.write('<!DOCTYPE html><html><head><title>Carregando 履歴書...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;"><div style="text-align:center;"><div style="font-size:24px;margin-bottom:12px;">⏳</div><div style="font-size:16px;font-weight:600;">Gerando Currículo Japonês (履歴書 JIS)...</div></div></body></html>');
          printWin.document.close();
        }
      } catch (err) { }

      const id = btn.dataset.id;
      const worker = trabalhadores.find(t => t.id === id);
      if (worker) {
        const dados = prepararDadosRirekisho(worker);
        imprimirRirekisho(dados, printWin);
      } else if (printWin) {
        printWin.close();
      }
    });
  });

  // Clique em qualquer lugar da linha abre a ficha cadastral do trabalhador
  document.querySelectorAll('.worker-row-clickable').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const workerId = row.dataset.workerId;
      if (workerId) {
        navigate(`/gestor-trabalhadores?editar=${workerId}`);
      }
    });
  });

  document.getElementById('btn-seed-mock-data')?.addEventListener('click', () => {
    if (confirm('Deseja gerar os 10 funcionários fictícios no Japão com 1 ano completo de horas trabalhadas (~250h/mês)?')) {
      resetAndRegenerateMockData(user.id);
      renderGestorDashboard(app);
    }
  });

  // Botão Cadastrar Trabalhador no Header do Dashboard
  document.getElementById('btn-dash-novo-trabalhador')?.addEventListener('click', () => {
    if (!statusPlano.isPro && statusPlano.totalCadastrados >= statusPlano.limite) {
      openModalAtivacao({
        motivo: 'limite_atingido',
        onSucesso: () => renderGestorDashboard(app)
      });
      return;
    }
    navigate('/gestor-trabalhadores?novo=1');
  });

  // Botão Ativar Chave no Card de Status do Plano
  document.getElementById('btn-ativar-plano-dash')?.addEventListener('click', () => {
    openModalAtivacao({
      motivo: statusPlano.atingiuLimite ? 'limite_atingido' : 'manual',
      onSucesso: () => renderGestorDashboard(app)
    });
  });
}
