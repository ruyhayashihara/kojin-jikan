import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { NTA_CATEGORIAS } from '../ai-receipt.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export async function renderDeclaracao(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login'); return; }

  const currentYear = new Date().getFullYear();
  let selectedYear = currentYear;
  let perfil = {};
  let resumos = [];
  let despesas = [];
  let categoryOverrides = {}; // code -> overridden value
  let checklist = JSON.parse(localStorage.getItem(`keiro_checklist_${selectedYear}`) || '{}');

  // --- Checklist items ---
  const CHECKLIST_ITEMS = [
    { key: 'recibos', label: 'Recibos de todas as despesas lançadas', jp: '領収書' },
    { key: 'kokumin_hoken', label: 'Comprovantes de pagamento do 国民健康保険', jp: '国民健康保険' },
    { key: 'kokumin_nenkin', label: 'Comprovantes de pagamento do 国民年金', jp: '国民年金' },
    { key: 'rousai', label: 'Comprovantes de pagamento do 労災保険 (Rousai)', jp: '労災保険' },
    { key: 'extrato', label: 'Extrato bancário do ano fiscal', jp: '銀行明細' },
    { key: 'gensen', label: 'Comprovante de renda (源泉徴収票 se aplicável)', jp: '源泉徴収票' },
    { key: 'aoiro', label: 'Formulário de registro 青色申告 (se regime azul)', jp: '青色申告承認申請書' },
    { key: 'invoice', label: 'Número de registro Invoice (se registrado)', jp: '適格請求書登録番号' },
    { key: 'deprec', label: 'Documentos de depreciação de equipamentos (se aplicável)', jp: '減価償却明細' },
  ];

  // --- Load data ---
  async function loadAll() {
    // Profile
    try {
      const { data } = await supabase.from('perfil_usuario').select('*').eq('id', user.id).single();
      if (data) perfil = data;
    } catch (e) { }

    // Resumos mensais
    try {
      const { data } = await supabase.from('resumo_mensal').select('*').eq('usuario_id', user.id).eq('ano', selectedYear);
      resumos = data || [];
    } catch (e) { }

    // Despesas
    try {
      const { data } = await supabase.from('despesa').select('*').eq('usuario_id', user.id).eq('ano_fiscal', selectedYear);
      despesas = data || [];
    } catch (e) { }

    checklist = JSON.parse(localStorage.getItem(`keiro_checklist_${selectedYear}`) || '{}');
  }

  // --- Calculations ---
  function calcReceitas() {
    const totalHoras = resumos.reduce((s, r) => s + (r.total_horas || 0), 0);
    const totalDescontos = resumos.reduce((s, r) => s + (r.total_descontos || 0), 0);
    const avgValorHora = resumos.length > 0
      ? resumos.reduce((s, r) => s + (r.valor_hora || 0), 0) / resumos.filter(r => r.valor_hora > 0).length || 0
      : 0;
    const receitaBruta = resumos.reduce((s, r) => s + ((r.total_horas || 0) * (r.valor_hora || 0)), 0);
    const receitaLiquida = receitaBruta - totalDescontos;
    return {
      totalHoras: Math.round(totalHoras * 10) / 10,
      avgValorHora: Math.round(avgValorHora),
      receitaBruta: Math.round(receitaBruta),
      totalDescontos: Math.round(totalDescontos),
      receitaLiquida: Math.round(receitaLiquida),
    };
  }

  function calcCategoryExpenses() {
    const cats = NTA_CATEGORIAS.map(c => {
      const items = despesas.filter(d => d.categoria_code === c.code);
      const total = items.reduce((s, d) => s + (d.valor_dedutivel || d.valor || 0), 0);
      const overridden = categoryOverrides[c.code];
      return {
        ...c,
        total: Math.round(total),
        adjusted: overridden !== undefined ? overridden : Math.round(total),
        count: items.length,
      };
    });
    const totalDedutivel = cats.reduce((s, c) => s + c.adjusted, 0);
    return { cats, totalDedutivel };
  }

  // --- Exports ---
  function generateCSV() {
    const { cats, totalDedutivel } = calcCategoryExpenses();
    let csv = 'Código,Categoria (JP),Categoria (PT),Qtd Recibos,Total (¥)\n';
    cats.forEach(c => {
      csv += `${c.code},"${c.nome}","${c.descricao}",${c.count},${c.adjusted}\n`;
    });
    csv += `\n,,TOTAL DEDUTÍVEL,,${totalDedutivel}\n`;

    // Add individual expenses
    csv += '\n\nDATA,ESTABELECIMENTO,DESCRIÇÃO,CATEGORIA,VALOR (¥),DEDUTÍVEL (¥),STATUS\n';
    despesas.forEach(d => {
      csv += `${d.data_recibo || ''},"${(d.estabelecimento || '').replace(/"/g, '""')}","${(d.descricao || '').replace(/"/g, '""')}",${d.categoria_code} ${d.categoria_nome || ''},${d.valor || 0},${d.valor_dedutivel || 0},${d.revisado_usuario ? 'Revisado' : 'Pendente'}\n`;
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keiro_despesas_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📊 CSV exportado com sucesso!');
  }

  function generatePDF() {
    const rec = calcReceitas();
    const { cats, totalDedutivel } = calcCategoryExpenses();
    const lucro = rec.receitaLiquida - totalDedutivel;
    const regime = perfil.regime_declaracao === 'azul' ? '青色申告 (Azul)' : '白色申告 (Branco)';

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaração Fiscal ${selectedYear} — マイ個人</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:40px;color:#1e293b;font-size:14px}
    h1{font-size:22px;margin-bottom:4px}h2{font-size:16px;margin:24px 0 12px;color:#3730a3;border-bottom:2px solid #e0e7ff;padding-bottom:6px}
    h3{font-size:13px;margin:16px 0 8px}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}th,td{padding:6px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
    th{font-size:11px;text-transform:uppercase;color:#64748b;background:#f8fafc}
    .right{text-align:right}.bold{font-weight:700}.highlight{background:#eef2ff;font-weight:700}
    .total-row{background:#e0e7ff;font-weight:700}.meta{color:#64748b;font-size:12px}
    .note{background:#fef9c3;border:1px solid #fbbf24;padding:10px;border-radius:6px;font-size:12px;margin-top:16px;color:#92400e}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600}
    .badge-blue{background:#dbeafe;color:#2563eb}.badge-green{background:#dcfce7;color:#16a34a}</style></head><body>
    <h1>Declaração Fiscal ${selectedYear} — 確定申告</h1>
    <p class="meta">Gerado por マイ個人 em ${new Date().toLocaleDateString('pt-BR')} · Regime: <span class="badge ${perfil.regime_declaracao === 'azul' ? 'badge-blue' : 'badge-green'}">${regime}</span></p>
    <h2>1. Resumo de Receitas</h2>
    <table><tr><td>Total de horas trabalhadas</td><td class="right bold">${rec.totalHoras}h</td></tr>
    <tr><td>Valor por hora médio</td><td class="right">¥${rec.avgValorHora.toLocaleString('ja-JP')}</td></tr>
    <tr><td>Receita bruta anual</td><td class="right bold">¥${rec.receitaBruta.toLocaleString('ja-JP')}</td></tr>
    <tr><td>Total de descontos anuais</td><td class="right" style="color:#dc2626">−¥${rec.totalDescontos.toLocaleString('ja-JP')}</td></tr>
    <tr class="highlight"><td>Receita líquida do trabalho</td><td class="right">¥${rec.receitaLiquida.toLocaleString('ja-JP')}</td></tr></table>
    <h2>2. Despesas Dedutíveis por Categoria</h2>
    <table><thead><tr><th>Cód</th><th>Categoria</th><th>Recibos</th><th class="right">Total (¥)</th></tr></thead><tbody>
    ${cats.map(c => `<tr><td>${c.code}</td><td>${c.nome} — ${c.descricao}</td><td>${c.count}</td><td class="right">¥${c.adjusted.toLocaleString('ja-JP')}</td></tr>`).join('')}
    </tbody><tfoot><tr class="total-row"><td colspan="3">Total de Despesas Dedutíveis</td><td class="right">¥${totalDedutivel.toLocaleString('ja-JP')}</td></tr></tfoot></table>
    <h2>3. Resultado Fiscal Estimado</h2>
    <table><tr><td>Receita líquida</td><td class="right">¥${rec.receitaLiquida.toLocaleString('ja-JP')}</td></tr>
    <tr><td>Despesas dedutíveis</td><td class="right" style="color:#dc2626">−¥${totalDedutivel.toLocaleString('ja-JP')}</td></tr>
    <tr class="highlight"><td>Lucro tributável estimado</td><td class="right">¥${lucro.toLocaleString('ja-JP')}</td></tr></table>
    <div class="note">⚠️ Este é um cálculo estimado. Consulte um contador (税理士) para a declaração oficial.</div>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
    showToast('📄 PDF aberto para impressão');
  }

  function copySummary() {
    const rec = calcReceitas();
    const { totalDedutivel } = calcCategoryExpenses();
    const lucro = rec.receitaLiquida - totalDedutivel;
    const regime = perfil.regime_declaracao === 'azul' ? '青色申告' : '白色申告';
    const text = [
      `確定申告 ${selectedYear} — マイ個人`,
      `Regime: ${regime}`,
      ``,
      `Horas trabalhadas: ${rec.totalHoras}h`,
      `Valor/hora médio: ¥${rec.avgValorHora.toLocaleString('ja-JP')}`,
      `Receita bruta: ¥${rec.receitaBruta.toLocaleString('ja-JP')}`,
      `Descontos: ¥${rec.totalDescontos.toLocaleString('ja-JP')}`,
      `Receita líquida: ¥${rec.receitaLiquida.toLocaleString('ja-JP')}`,
      ``,
      `Despesas dedutíveis: ¥${totalDedutivel.toLocaleString('ja-JP')}`,
      `Lucro tributável estimado: ¥${lucro.toLocaleString('ja-JP')}`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => showToast('📋 Resumo copiado!'));
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast toast-success';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-show'), 10);
    setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 300); }, 3000);
  }

  // --- Render ---
  async function renderPage() {
    await loadAll();
    const rec = calcReceitas();
    const { cats, totalDedutivel } = calcCategoryExpenses();
    const lucro = rec.receitaLiquida - totalDedutivel;
    const regime = perfil.regime_declaracao || 'branco';
    const regimeLabel = regime === 'azul' ? '青色申告 (Azul)' : '白色申告 (Branco)';
    const regimeClass = regime === 'azul' ? 'regime-blue' : 'regime-white';

    const yearOpts = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      yearOpts.push(`<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`);
    }

    const checkedCount = CHECKLIST_ITEMS.filter(it => checklist[it.key]).length;
    const checkPct = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);

    app.innerHTML = `
      ${renderSidebar('declaracao')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container page-wide">

          <div class="page-header-row">
            <div class="page-header">
              <h1>Declaração Fiscal — 確定申告</h1>
              <p>Preparação da declaração de imposto de renda</p>
            </div>
            <div class="page-header-actions">
              <div class="selector-group">
                <label for="sel-year-decl">Ano fiscal</label>
                <select id="sel-year-decl">${yearOpts.join('')}</select>
              </div>
              <span class="regime-badge ${regimeClass}">${regimeLabel}</span>
            </div>
          </div>

          <!-- Seção 1: Resumo de Receitas -->
          <div class="card decl-section">
            <h2 class="decl-section-title">
              <span class="decl-num">1</span>
              Resumo de Receitas
            </h2>
            <div class="decl-stats-grid">
              <div class="decl-stat">
                <span class="decl-stat-label">Total de horas trabalhadas</span>
                <span class="decl-stat-value">${rec.totalHoras}h</span>
              </div>
              <div class="decl-stat">
                <span class="decl-stat-label">Valor por hora médio</span>
                <span class="decl-stat-value">¥${rec.avgValorHora.toLocaleString('ja-JP')}</span>
              </div>
              <div class="decl-stat">
                <span class="decl-stat-label">Receita bruta anual</span>
                <span class="decl-stat-value decl-val-primary">¥${rec.receitaBruta.toLocaleString('ja-JP')}</span>
              </div>
              <div class="decl-stat">
                <span class="decl-stat-label">Total de descontos anuais</span>
                <span class="decl-stat-value decl-val-red">−¥${rec.totalDescontos.toLocaleString('ja-JP')}</span>
              </div>
              <div class="decl-stat decl-stat-highlight">
                <span class="decl-stat-label">Receita líquida do trabalho</span>
                <span class="decl-stat-value decl-val-bold">¥${rec.receitaLiquida.toLocaleString('ja-JP')}</span>
              </div>
            </div>
          </div>

          <!-- Seção 2: Despesas Dedutíveis -->
          <div class="card decl-section">
            <h2 class="decl-section-title">
              <span class="decl-num">2</span>
              Despesas Dedutíveis por Categoria
            </h2>
            <div class="decl-cat-table-wrap">
              <table class="decl-cat-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th class="col-num">Recibos</th>
                    <th class="col-num">Total Calculado (¥)</th>
                    <th class="col-num">Valor Ajustado (¥)</th>
                  </tr>
                </thead>
                <tbody>
                  ${cats.map(c => `
                      <tr class="decl-cat-row ${c.count > 0 ? '' : 'decl-cat-empty'}">
                        <td><span class="cat-badge">${c.code}</span></td>
                        <td>
                          <span class="decl-cat-jp">${c.nome}</span>
                          <span class="decl-cat-pt">${c.descricao}</span>
                        </td>
                        <td class="col-num">
                          ${c.count > 0 ? `<span class="receipt-count">${c.count}</span>` : '—'}
                        </td>
                        <td class="col-num decl-cat-total">¥${c.total.toLocaleString('ja-JP')}</td>
                        <td class="col-num">
                          <input type="number" class="decl-cat-input" data-code="${c.code}" value="${c.adjusted}" step="1" />
                        </td>
                      </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                  <tr class="decl-cat-total-row">
                    <td colspan="3"><strong>Total Geral de Despesas Dedutíveis</strong></td>
                    <td class="col-num"><strong>¥${cats.reduce((s, c) => s + c.total, 0).toLocaleString('ja-JP')}</strong></td>
                    <td class="col-num"><strong id="total-dedutivel">¥${totalDedutivel.toLocaleString('ja-JP')}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Seção 3: Resultado Fiscal -->
          <div class="card decl-section">
            <h2 class="decl-section-title">
              <span class="decl-num">3</span>
              Resultado Fiscal Estimado
            </h2>
            <div class="fiscal-result">
              <div class="fiscal-line">
                <span>Receita líquida do trabalho</span>
                <span class="fiscal-amount">¥${rec.receitaLiquida.toLocaleString('ja-JP')}</span>
              </div>
              <div class="fiscal-line fiscal-line-minus">
                <span>Total de despesas dedutíveis</span>
                <span class="fiscal-amount fiscal-red">−¥<span id="fiscal-desp">${totalDedutivel.toLocaleString('ja-JP')}</span></span>
              </div>
              <div class="fiscal-line fiscal-line-result ${lucro >= 0 ? 'fiscal-result-positive' : 'fiscal-result-negative'}">
                <span>= Lucro tributável estimado</span>
                <span class="fiscal-amount fiscal-result-value" id="fiscal-lucro">¥${lucro.toLocaleString('ja-JP')}</span>
              </div>
            </div>
            <div class="fiscal-note">
              <span class="fiscal-note-icon">⚠️</span>
              <span>Este é um cálculo estimado. Consulte um contador (<strong>税理士</strong>) para a declaração oficial.</span>
            </div>
          </div>

          <!-- Seção: Status Invoice -->
          ${(() => {
        const withInvoice = despesas.filter(d => d.numero_invoice);
        const withoutInvoice = despesas.filter(d => !d.numero_invoice);
        const totalWithInvoice = withInvoice.reduce((s, d) => s + (d.valor_dedutivel || d.valor || 0), 0);
        const totalWithoutInvoice = withoutInvoice.reduce((s, d) => s + (d.valor_dedutivel || d.valor || 0), 0);
        const verifiedCount = withInvoice.filter(d => d.invoice_verificado).length;
        return `
            <div class="card decl-section">
              <h2 class="decl-section-title">
                <span class="decl-num">📋</span>
                Status Invoice — インボイス制度
              </h2>
              <div class="invoice-status-grid">
                <div class="invoice-status-card invoice-status-green">
                  <span class="invoice-status-icon">✅</span>
                  <div class="invoice-status-info">
                    <span class="invoice-status-label">Com Invoice</span>
                    <span class="invoice-status-value">¥${Math.round(totalWithInvoice).toLocaleString('ja-JP')}</span>
                    <span class="invoice-status-sub">${withInvoice.length} despesas (${verifiedCount} verificadas)</span>
                  </div>
                </div>
                <div class="invoice-status-card invoice-status-red">
                  <span class="invoice-status-icon">❌</span>
                  <div class="invoice-status-info">
                    <span class="invoice-status-label">Sem Invoice</span>
                    <span class="invoice-status-value">¥${Math.round(totalWithoutInvoice).toLocaleString('ja-JP')}</span>
                    <span class="invoice-status-sub">${withoutInvoice.length} despesas</span>
                  </div>
                </div>
              </div>
              ${withoutInvoice.length > 0 ? `
              <div class="invoice-warning">
                <span class="fiscal-note-icon">⚠️</span>
                <span>Despesas sem Invoice válido podem não ser aceitas como dedutíveis conforme o <strong>インボイス制度</strong> vigente desde outubro de 2023.</span>
              </div>` : ''}
            </div>`;
      })()}

          <!-- Seção 4: Checklist -->
          <div class="card decl-section">
            <h2 class="decl-section-title">
              <span class="decl-num">4</span>
              Checklist de Documentos
            </h2>
            <div class="checklist-progress">
              <div class="review-progress-bar">
                <div class="review-progress-fill" style="width:${checkPct}%"></div>
              </div>
              <span class="review-progress-label">${checkedCount}/${CHECKLIST_ITEMS.length} reunidos (${checkPct}%)</span>
            </div>
            <div class="checklist-list">
              ${CHECKLIST_ITEMS.map(it => `
                  <label class="checklist-item ${checklist[it.key] ? 'checklist-item-done' : ''}">
                    <input type="checkbox" class="checklist-check" data-key="${it.key}" ${checklist[it.key] ? 'checked' : ''} />
                    <span class="checklist-text">
                      <span class="checklist-label">${it.label}</span>
                      <span class="checklist-jp">${it.jp}</span>
                    </span>
                  </label>
                `).join('')}
            </div>
          </div>

          <!-- Export Buttons -->
          <div class="export-bar">
            <button class="btn btn-primary btn-lg" id="btn-export-pdf">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              Exportar PDF
            </button>
            <button class="btn btn-outline btn-lg" id="btn-export-csv">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
              Exportar CSV
            </button>
            <button class="btn btn-outline btn-lg" id="btn-copy-summary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
              Copiar Resumo
            </button>
          </div>

        </div>
      </main>
    </div>
    `;

    // --- Events ---
    bindSidebarEvents();

    document.getElementById('sel-year-decl')?.addEventListener('change', (e) => {
      selectedYear = parseInt(e.target.value);
      renderPage();
    });

    // Category value overrides
    document.querySelectorAll('.decl-cat-input').forEach(input => {
      input.addEventListener('input', () => {
        const code = input.dataset.code;
        categoryOverrides[code] = parseFloat(input.value) || 0;
        // Recalculate totals
        const newTotal = NTA_CATEGORIAS.reduce((s, c) => {
          return s + (categoryOverrides[c.code] !== undefined ? categoryOverrides[c.code] : (cats.find(x => x.code === c.code)?.total || 0));
        }, 0);
        const newLucro = rec.receitaLiquida - newTotal;
        document.getElementById('total-dedutivel').textContent = `¥${newTotal.toLocaleString('ja-JP')} `;
        document.getElementById('fiscal-desp').textContent = newTotal.toLocaleString('ja-JP');
        const lucroEl = document.getElementById('fiscal-lucro');
        lucroEl.textContent = `¥${newLucro.toLocaleString('ja-JP')} `;
        const resultLine = lucroEl.closest('.fiscal-line');
        resultLine.className = `fiscal - line fiscal - line - result ${newLucro >= 0 ? 'fiscal-result-positive' : 'fiscal-result-negative'} `;
      });
    });

    // Checklist
    document.querySelectorAll('.checklist-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        checklist[key] = cb.checked;
        localStorage.setItem(`keiro_checklist_${selectedYear} `, JSON.stringify(checklist));
        const item = cb.closest('.checklist-item');
        item.classList.toggle('checklist-item-done', cb.checked);
        // Update progress
        const count = CHECKLIST_ITEMS.filter(it => checklist[it.key]).length;
        const pct = Math.round((count / CHECKLIST_ITEMS.length) * 100);
        const fill = document.querySelector('.checklist-progress .review-progress-fill');
        const label = document.querySelector('.checklist-progress .review-progress-label');
        if (fill) fill.style.width = `${pct}% `;
        if (label) label.textContent = `${count}/${CHECKLIST_ITEMS.length} reunidos (${pct}%)`;
      });
    });

    // Exports
    document.getElementById('btn-export-pdf')?.addEventListener('click', generatePDF);
    document.getElementById('btn-export-csv')?.addEventListener('click', generateCSV);
    document.getElementById('btn-copy-summary')?.addEventListener('click', copySummary);
  }

  await renderPage();
}
