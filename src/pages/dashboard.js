import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export async function renderDashboard(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login'); return; }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  // Check 確定申告 period (Jan 1 – Mar 17)
  const showKakuteiAlert = (currentMonth === 1) || (currentMonth === 2) || (currentMonth === 3 && now.getDate() <= 17);

  // Load all resumos for the current year
  let resumos = [];
  try {
    const { data } = await supabase
      .from('resumo_mensal')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('ano', currentYear)
      .order('mes', { ascending: true });
    resumos = data || [];
  } catch (e) { }

  // Build monthly data map
  const monthData = {};
  for (let m = 1; m <= 12; m++) {
    monthData[m] = { total_horas: 0, valor_hora: 0, subtotal_bruto: 0, total_descontos: 0, total_liquido: 0 };
  }
  resumos.forEach(r => {
    const bruto = (r.total_horas || 0) * (r.valor_hora || 0);
    const liq = bruto - (r.total_descontos || 0);
    monthData[r.mes] = {
      total_horas: r.total_horas || 0,
      valor_hora: r.valor_hora || 0,
      subtotal_bruto: Math.round(bruto * 100) / 100,
      total_descontos: r.total_descontos || 0,
      total_liquido: Math.round(liq * 100) / 100,
    };
  });

  // Current month stats
  const cm = monthData[currentMonth];

  // Chart data – find max absolute value for scaling
  const chartValues = Object.values(monthData).map(d => d.total_liquido);
  const maxAbsValue = Math.max(Math.abs(Math.max(...chartValues)), Math.abs(Math.min(...chartValues)), 1);

  // Build chart bars
  const chartBars = MESES_CURTO.map((label, i) => {
    const val = monthData[i + 1].total_liquido;
    const heightPct = Math.abs(val) / maxAbsValue * 100;
    const isNeg = val < 0;
    return `
      <div class="chart-bar-group">
        <div class="chart-bar-container">
          <div class="chart-bar ${isNeg ? 'chart-bar-negative' : ''}" style="height: ${Math.max(heightPct, 2)}%" title="¥${val.toLocaleString('ja-JP')}">
            ${val !== 0 ? `<span class="chart-bar-value">${val >= 1000 ? '¥' + Math.round(val / 1000) + 'k' : '¥' + val}</span>` : ''}
          </div>
        </div>
        <span class="chart-label">${label}</span>
      </div>
    `;
  }).join('');

  // Build summary table rows
  const tableRows = MESES_CURTO.map((name, i) => {
    const m = i + 1;
    const d = monthData[m];
    const isCurrentMonth = m === currentMonth;
    const hasData = d.total_horas > 0 || d.total_descontos > 0;
    return `
      <tr class="summary-row ${isCurrentMonth ? 'summary-row-current' : ''} ${hasData ? 'summary-row-clickable' : ''}" data-month="${m}">
        <td class="col-month">${name}</td>
        <td class="col-num">${d.total_horas > 0 ? d.total_horas.toFixed(1) + 'h' : '—'}</td>
        <td class="col-num">¥${d.subtotal_bruto > 0 ? d.subtotal_bruto.toLocaleString('ja-JP') : '0'}</td>
        <td class="col-num col-discount">¥${d.total_descontos > 0 ? d.total_descontos.toLocaleString('ja-JP') : '0'}</td>
        <td class="col-num ${d.total_liquido >= 0 ? 'col-positive' : 'col-negative'}">¥${d.total_liquido !== 0 ? d.total_liquido.toLocaleString('ja-JP') : '0'}</td>
      </tr>
    `;
  }).join('');

  // Annual totals
  const annualHoras = Object.values(monthData).reduce((s, d) => s + d.total_horas, 0);
  const annualBruto = Object.values(monthData).reduce((s, d) => s + d.subtotal_bruto, 0);
  const annualDescontos = Object.values(monthData).reduce((s, d) => s + d.total_descontos, 0);
  const annualLiquido = Object.values(monthData).reduce((s, d) => s + d.total_liquido, 0);

  app.innerHTML = `
    ${renderSidebar('dashboard')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container page-wide">

          ${showKakuteiAlert ? `
          <div class="kakutei-alert">
            <span class="kakutei-icon">⚠️</span>
            <span>Período de <strong>確定申告</strong> em andamento. Prazo: até <strong>17 de março</strong>.</span>
          </div>
          ` : ''}

          <div class="page-header">
            <h1>Dashboard</h1>
            <p>${MESES_NOME[currentMonth - 1]} ${currentYear} — ダッシュボード</p>
          </div>

          <div class="bento-grid">
            <div class="bento-card">
              <div class="bento-icon bento-icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div class="bento-label">Horas Trabalhadas</div>
              <div class="bento-value">${cm.total_horas > 0 ? cm.total_horas.toFixed(1) + 'h' : '0h'}</div>
              <div class="bento-sub">${MESES_NOME[currentMonth - 1]}</div>
            </div>
            <div class="bento-card">
              <div class="bento-icon bento-icon-indigo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div class="bento-label">Valor Bruto</div>
              <div class="bento-value">¥${cm.subtotal_bruto > 0 ? cm.subtotal_bruto.toLocaleString('ja-JP') : '0'}</div>
              <div class="bento-sub">Mês atual</div>
            </div>
            <div class="bento-card bento-card-red">
              <div class="bento-icon bento-icon-red">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
              </div>
              <div class="bento-label">Descontos</div>
              <div class="bento-value">¥${cm.total_descontos > 0 ? cm.total_descontos.toLocaleString('ja-JP') : '0'}</div>
              <div class="bento-sub">Mês atual</div>
            </div>
            <div class="bento-card bento-card-green bento-card-highlight">
              <div class="bento-icon bento-icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div class="bento-label">Valor Líquido</div>
              <div class="bento-value">¥${cm.total_liquido !== 0 ? cm.total_liquido.toLocaleString('ja-JP') : '0'}</div>
              <div class="bento-sub">Mês atual</div>
            </div>
          </div>

          <div class="chart-section card">
            <h2 class="section-title">Ganhos Líquidos — Ano ${currentYear}</h2>
            <div class="chart-container">
              ${chartBars}
            </div>
          </div>

          <div class="annual-table card">
            <h2 class="section-title">Resumo Anual ${currentYear}</h2>
            <table class="summary-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Hs</th>
                  <th>Bruto</th>
                  <th>Desc.</th>
                  <th>Líq.</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
              <tfoot>
                <tr class="summary-total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>${annualHoras > 0 ? annualHoras.toFixed(1) + 'h' : '—'}</strong></td>
                  <td><strong>¥${annualBruto > 0 ? annualBruto.toLocaleString('ja-JP') : '0'}</strong></td>
                  <td><strong>¥${annualDescontos > 0 ? annualDescontos.toLocaleString('ja-JP') : '0'}</strong></td>
                  <td class="${annualLiquido >= 0 ? 'col-positive' : 'col-negative'}"><strong>¥${annualLiquido !== 0 ? annualLiquido.toLocaleString('ja-JP') : '0'}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="quick-actions">
            <h2 class="section-title">Atalhos Rápidos</h2>
            <div class="quick-actions-grid">
              <a href="#/registro-horas" class="quick-btn">
                <div class="quick-btn-icon quick-btn-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span>Registrar Horas</span>
              </a>
              <a href="#/recibos" class="quick-btn">
                <div class="quick-btn-icon quick-btn-amber">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <span>Fotografar Recibo</span>
              </a>
              <a href="#/despesas" class="quick-btn">
                <div class="quick-btn-icon quick-btn-emerald">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <span>Ver Despesas</span>
              </a>
              <a href="#/declaracao" class="quick-btn">
                <div class="quick-btn-icon quick-btn-rose">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <span>Declaração Fiscal</span>
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  `;

  bindSidebarEvents();

  // Event: clickable summary rows → navigate to registro-horas with month
  document.querySelectorAll('.summary-row').forEach(row => {
    row.addEventListener('click', () => {
      const m = row.dataset.month;
      // Store selected month in sessionStorage for registro-horas to pick up
      sessionStorage.setItem('keiro_nav_month', m);
      sessionStorage.setItem('keiro_nav_year', String(currentYear));
      navigate('/registro-horas');
    });
  });
}
