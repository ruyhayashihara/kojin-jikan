import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

const MESES_CURTO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const LINE_COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export async function renderHistorico(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login'); return; }

  const currentYear = new Date().getFullYear();
  let yearFrom = currentYear - 2;
  let yearTo = currentYear;
  let selectedCompareMonth = 0; // 0-indexed
  let allResumos = [];
  let allDespesas = [];

  async function loadAll() {
    try {
      const { data } = await supabase
        .from('resumo_mensal')
        .select('*')
        .eq('usuario_id', user.id)
        .gte('ano', yearFrom)
        .lte('ano', yearTo)
        .order('ano', { ascending: true })
        .order('mes', { ascending: true });
      allResumos = data || [];
    } catch (e) { }

    try {
      const { data } = await supabase
        .from('despesa')
        .select('valor_dedutivel, ano_fiscal')
        .eq('usuario_id', user.id)
        .gte('ano_fiscal', yearFrom)
        .lte('ano_fiscal', yearTo);
      allDespesas = data || [];
    } catch (e) { }
  }

  // Build year data
  function buildYearlyData() {
    const years = [];
    for (let y = yearFrom; y <= yearTo; y++) {
      const resumos = allResumos.filter(r => r.ano === y);
      const monthData = [];
      for (let m = 1; m <= 12; m++) {
        const r = resumos.find(x => x.mes === m);
        const bruto = r ? (r.total_horas || 0) * (r.valor_hora || 0) : 0;
        const liq = bruto - (r?.total_descontos || 0);
        monthData.push({
          mes: m,
          horas: r?.total_horas || 0,
          valorHora: r?.valor_hora || 0,
          bruto: Math.round(bruto),
          descontos: Math.round(r?.total_descontos || 0),
          liquido: Math.round(liq),
        });
      }
      const despYearly = allDespesas.filter(d => d.ano_fiscal === y);
      const totalDesp = despYearly.reduce((s, d) => s + (d.valor_dedutivel || 0), 0);
      const totalHoras = monthData.reduce((s, m) => s + m.horas, 0);
      const totalBruto = monthData.reduce((s, m) => s + m.bruto, 0);
      const totalDescontos = monthData.reduce((s, m) => s + m.descontos, 0);
      const totalLiquido = monthData.reduce((s, m) => s + m.liquido, 0);

      years.push({
        year: y,
        months: monthData,
        totalHoras: Math.round(totalHoras * 10) / 10,
        totalBruto: Math.round(totalBruto),
        totalDescontos: Math.round(totalDescontos),
        totalDesp: Math.round(totalDesp),
        totalLiquido: Math.round(totalLiquido),
      });
    }
    return years;
  }

  // SVG Line Chart
  function buildLineChart(yearlyData) {
    const W = 800, H = 300, PL = 60, PR = 20, PT = 20, PB = 40;
    const cw = W - PL - PR, ch = H - PT - PB;

    // Gather all values
    let allVals = [];
    yearlyData.forEach(yd => yd.months.forEach(m => allVals.push(m.liquido)));
    const maxVal = Math.max(...allVals, 1);
    const minVal = Math.min(...allVals, 0);
    const range = (maxVal - minVal) || 1;

    const xStep = cw / 11;
    const toX = i => PL + i * xStep;
    const toY = v => PT + ch - ((v - minVal) / range) * ch;

    // Grid lines
    const gridCount = 5;
    let gridLines = '';
    for (let i = 0; i <= gridCount; i++) {
      const val = minVal + (range / gridCount) * i;
      const y = toY(val);
      gridLines += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>`;
      const label = val >= 1000 ? `¥${Math.round(val / 1000)}k` : `¥${Math.round(val)}`;
      gridLines += `<text x="${PL - 8}" y="${y + 4}" text-anchor="end" fill="#94a3b8" font-size="10" font-family="Inter,sans-serif">${label}</text>`;
    }

    // X labels
    let xLabels = '';
    MESES_CURTO.forEach((label, i) => {
      xLabels += `<text x="${toX(i)}" y="${H - 10}" text-anchor="middle" fill="#94a3b8" font-size="10" font-family="Inter,sans-serif">${label}</text>`;
    });

    // Lines per year
    let lines = '';
    yearlyData.forEach((yd, yi) => {
      const color = LINE_COLORS[yi % LINE_COLORS.length];
      const points = yd.months.map((m, i) => `${toX(i)},${toY(m.liquido)}`).join(' ');
      lines += `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`;
      // Dots
      yd.months.forEach((m, i) => {
        if (m.liquido !== 0) {
          lines += `<circle cx="${toX(i)}" cy="${toY(m.liquido)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.5"/>`;
        }
      });
    });

    // Legend
    let legend = '';
    yearlyData.forEach((yd, yi) => {
      const color = LINE_COLORS[yi % LINE_COLORS.length];
      const lx = PL + yi * 80;
      legend += `<rect x="${lx}" y="${H - 2}" width="12" height="3" rx="1.5" fill="${color}"/>`;
      legend += `<text x="${lx + 16}" y="${H + 2}" fill="#64748b" font-size="11" font-weight="600" font-family="Inter,sans-serif">${yd.year}</text>`;
    });

    // Zero line
    let zeroLine = '';
    if (minVal < 0) {
      const zy = toY(0);
      zeroLine = `<line x1="${PL}" y1="${zy}" x2="${W - PR}" y2="${zy}" stroke="#94a3b8" stroke-width="1"/>`;
    }

    return `<svg viewBox="0 0 ${W} ${H + 10}" class="line-chart-svg" xmlns="http://www.w3.org/2000/svg">
      ${gridLines}${zeroLine}${xLabels}${lines}${legend}
    </svg>`;
  }

  // Monthly comparison bar chart
  function buildMonthlyBarChart(yearlyData) {
    const m = selectedCompareMonth;
    const data = yearlyData.map(yd => ({ year: yd.year, value: yd.months[m].liquido }));
    const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 1);

    return data.map(d => {
      const pct = Math.abs(d.value) / maxVal * 100;
      const isNeg = d.value < 0;
      return `
        <div class="compare-bar-row">
          <span class="compare-bar-year">${d.year}</span>
          <div class="compare-bar-track">
            <div class="compare-bar-fill ${isNeg ? 'compare-bar-neg' : ''}" style="width:${Math.max(pct, 3)}%"></div>
          </div>
          <span class="compare-bar-value ${isNeg ? 'compare-val-neg' : ''}">¥${d.value.toLocaleString('ja-JP')}</span>
        </div>
      `;
    }).join('');
  }

  // Highlights
  function calcHighlights(yearlyData) {
    let bestMonth = { val: -Infinity, label: '' };
    let worstMonth = { val: Infinity, label: '' };
    let bestYear = { val: -Infinity, year: 0 };
    let totalHoras = 0, totalMonths = 0;

    yearlyData.forEach(yd => {
      if (yd.totalBruto > bestYear.val) bestYear = { val: yd.totalBruto, year: yd.year };
      yd.months.forEach(m => {
        if (m.horas > 0 || m.liquido !== 0) {
          totalHoras += m.horas;
          totalMonths++;
        }
        if (m.liquido > bestMonth.val) bestMonth = { val: m.liquido, label: `${MESES_CURTO[m.mes - 1]} ${yd.year}` };
        if (m.liquido < worstMonth.val && (m.horas > 0 || m.liquido !== 0)) worstMonth = { val: m.liquido, label: `${MESES_CURTO[m.mes - 1]} ${yd.year}` };
      });
    });

    const avgHoras = totalMonths > 0 ? Math.round((totalHoras / totalMonths) * 10) / 10 : 0;
    return { bestMonth, worstMonth, bestYear, avgHoras };
  }

  // Export CSV
  function exportCSV(yearlyData) {
    let csv = 'Ano,Mês,Horas,Valor/Hora (¥),Bruto (¥),Descontos (¥),Líquido (¥)\n';
    yearlyData.forEach(yd => {
      yd.months.forEach(m => {
        csv += `${yd.year},${MESES_NOME[m.mes - 1]},${m.horas},${m.valorHora},${m.bruto},${m.descontos},${m.liquido}\n`;
      });
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keiro_historico_${yearFrom}-${yearTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📊 Histórico exportado com sucesso!');
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast toast-success';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-show'), 10);
    setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  async function renderPage() {
    await loadAll();
    const yearlyData = buildYearlyData();
    const hl = calcHighlights(yearlyData);

    const yearOpts = [];
    for (let y = currentYear - 10; y <= currentYear; y++) {
      yearOpts.push(y);
    }

    const monthOpts = MESES_NOME.map((n, i) =>
      `<option value="${i}" ${i === selectedCompareMonth ? 'selected' : ''}>${n}</option>`
    ).join('');

    // Annual totals
    const grandHoras = yearlyData.reduce((s, y) => s + y.totalHoras, 0);
    const grandBruto = yearlyData.reduce((s, y) => s + y.totalBruto, 0);
    const grandDesp = yearlyData.reduce((s, y) => s + y.totalDesp, 0);
    const grandDescontos = yearlyData.reduce((s, y) => s + y.totalDescontos, 0);
    const grandLiquido = yearlyData.reduce((s, y) => s + y.totalLiquido, 0);
    const numYears = yearlyData.length || 1;

    app.innerHTML = `
      ${renderSidebar('historico')}
      <div class="app-content-wrapper">
        <main class="main-content">
          <div class="page-container page-wide">
            <div class="page-header">
              <h1>Histórico</h1>
              <p>Análise multi-anual de ganhos — 年間履歴</p>
            </div>

            <!-- Period Selector -->
            <div class="hist-period card">
              <div class="hist-period-row">
                <div class="selector-group">
                  <label for="hist-from">De</label>
                  <select id="hist-from">
                    ${yearOpts.map(y => `<option value="${y}" ${y === yearFrom ? 'selected' : ''}>${y}</option>`).join('')}
                  </select>
                </div>
                <span class="hist-period-sep">→</span>
                <div class="selector-group">
                  <label for="hist-to">Até</label>
                  <select id="hist-to">
                    ${yearOpts.map(y => `<option value="${y}" ${y === yearTo ? 'selected' : ''}>${y}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>

            <!-- Line Chart -->
            <div class="card hist-chart-card">
              <h2 class="section-title">Evolução dos Ganhos Líquidos</h2>
              <div class="line-chart-wrap">
                ${buildLineChart(yearlyData)}
              </div>
            </div>

            <!-- Annual Comparative Table -->
            <div class="card">
              <h2 class="section-title">Comparativo Anual</h2>
              <div class="despesas-table-wrap">
                <table class="despesas-table">
                  <thead>
                    <tr>
                      <th>Ano</th>
                      <th class="col-num">Total Horas</th>
                      <th class="col-num">Receita Bruta (¥)</th>
                      <th class="col-num">Despesas Dedutíveis (¥)</th>
                      <th class="col-num">Descontos (¥)</th>
                      <th class="col-num">Lucro Líquido (¥)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${yearlyData.map(yd => `
                      <tr class="despesa-row">
                        <td class="col-date-sm"><strong>${yd.year}</strong></td>
                        <td class="col-num">${yd.totalHoras > 0 ? yd.totalHoras + 'h' : '—'}</td>
                        <td class="col-num">¥${yd.totalBruto.toLocaleString('ja-JP')}</td>
                        <td class="col-num">¥${yd.totalDesp.toLocaleString('ja-JP')}</td>
                        <td class="col-num">¥${yd.totalDescontos.toLocaleString('ja-JP')}</td>
                        <td class="col-num col-valor ${yd.totalLiquido >= 0 ? 'col-positive' : 'col-negative'}">¥${yd.totalLiquido.toLocaleString('ja-JP')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr class="despesas-subtotal-row">
                      <td><strong>Total</strong></td>
                      <td class="col-num"><strong>${grandHoras > 0 ? Math.round(grandHoras * 10) / 10 + 'h' : '—'}</strong></td>
                      <td class="col-num"><strong>¥${grandBruto.toLocaleString('ja-JP')}</strong></td>
                      <td class="col-num"><strong>¥${Math.round(grandDesp).toLocaleString('ja-JP')}</strong></td>
                      <td class="col-num"><strong>¥${grandDescontos.toLocaleString('ja-JP')}</strong></td>
                      <td class="col-num"><strong>¥${grandLiquido.toLocaleString('ja-JP')}</strong></td>
                    </tr>
                    <tr class="hist-avg-row">
                      <td>Média/ano</td>
                      <td class="col-num">${grandHoras > 0 ? Math.round((grandHoras / numYears) * 10) / 10 + 'h' : '—'}</td>
                      <td class="col-num">¥${Math.round(grandBruto / numYears).toLocaleString('ja-JP')}</td>
                      <td class="col-num">¥${Math.round(grandDesp / numYears).toLocaleString('ja-JP')}</td>
                      <td class="col-num">¥${Math.round(grandDescontos / numYears).toLocaleString('ja-JP')}</td>
                      <td class="col-num">¥${Math.round(grandLiquido / numYears).toLocaleString('ja-JP')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Monthly Comparison -->
            <div class="card hist-compare-card">
              <div class="hist-compare-header">
                <h2 class="section-title" style="margin-bottom:0">Comparativo Mensal entre Anos</h2>
                <select id="hist-compare-month">${monthOpts}</select>
              </div>
              <div class="hist-compare-bars" id="compare-bars">
                ${buildMonthlyBarChart(yearlyData)}
              </div>
            </div>

            <!-- Highlight Cards -->
            <div class="hist-highlights">
              <div class="hist-hl-card hist-hl-green">
                <div class="hist-hl-icon">🏆</div>
                <div class="hist-hl-content">
                  <span class="hist-hl-label">Maior Ganho Líquido</span>
                  <span class="hist-hl-value">¥${hl.bestMonth.val > -Infinity ? hl.bestMonth.val.toLocaleString('ja-JP') : '0'}</span>
                  <span class="hist-hl-sub">${hl.bestMonth.label || '—'}</span>
                </div>
              </div>
              <div class="hist-hl-card hist-hl-red">
                <div class="hist-hl-icon">📉</div>
                <div class="hist-hl-content">
                  <span class="hist-hl-label">Menor Ganho Líquido</span>
                  <span class="hist-hl-value">¥${hl.worstMonth.val < Infinity ? hl.worstMonth.val.toLocaleString('ja-JP') : '0'}</span>
                  <span class="hist-hl-sub">${hl.worstMonth.label || '—'}</span>
                </div>
              </div>
              <div class="hist-hl-card hist-hl-indigo">
                <div class="hist-hl-icon">⭐</div>
                <div class="hist-hl-content">
                  <span class="hist-hl-label">Ano com Maior Receita</span>
                  <span class="hist-hl-value">${hl.bestYear.year || '—'}</span>
                  <span class="hist-hl-sub">¥${hl.bestYear.val > -Infinity ? hl.bestYear.val.toLocaleString('ja-JP') : '0'}</span>
                </div>
              </div>
              <div class="hist-hl-card hist-hl-cyan">
                <div class="hist-hl-icon">⏱️</div>
                <div class="hist-hl-content">
                  <span class="hist-hl-label">Média Mensal de Horas</span>
                  <span class="hist-hl-value">${hl.avgHoras}h</span>
                  <span class="hist-hl-sub">por mês trabalhado</span>
                </div>
              </div>
            </div>

            <!-- Export -->
            <div class="export-bar">
              <button class="btn btn-primary btn-lg" id="btn-export-hist">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                Exportar Histórico Completo
              </button>
            </div>
          </div>
        </main>
      </div>
    `;

    // Events
    bindSidebarEvents();

    document.getElementById('hist-from')?.addEventListener('change', (e) => {
      yearFrom = parseInt(e.target.value);
      if (yearFrom > yearTo) yearTo = yearFrom;
      renderPage();
    });
    document.getElementById('hist-to')?.addEventListener('change', (e) => {
      yearTo = parseInt(e.target.value);
      if (yearTo < yearFrom) yearFrom = yearTo;
      renderPage();
    });

    document.getElementById('hist-compare-month')?.addEventListener('change', (e) => {
      selectedCompareMonth = parseInt(e.target.value);
      document.getElementById('compare-bars').innerHTML = buildMonthlyBarChart(yearlyData);
    });

    document.getElementById('btn-export-hist')?.addEventListener('click', () => exportCSV(yearlyData));
  }

  await renderPage();
}
