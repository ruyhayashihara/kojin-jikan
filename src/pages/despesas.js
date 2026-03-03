import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { NTA_CATEGORIAS } from '../ai-receipt.js';
import { getInvoiceStatusIcon } from '../invoice-api.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export async function renderDespesas(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login'); return; }

  const currentYear = new Date().getFullYear();
  let selectedYear = currentYear;
  let filtroMes = 0; // 0 = Todos
  let filtroCategoria = '';
  let filtroStatus = '';
  let filtroValorMin = '';
  let filtroValorMax = '';
  let despesas = [];
  let editingDespesa = null;

  // --- Load ---
  async function loadDespesas() {
    let query = supabase
      .from('despesa')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('ano_fiscal', selectedYear)
      .order('data_recibo', { ascending: false });

    const { data } = await query;
    despesas = data || [];
  }

  // --- Filter ---
  function getFilteredDespesas() {
    return despesas.filter(d => {
      if (filtroMes > 0 && d.mes !== filtroMes) return false;
      if (filtroCategoria && d.categoria_code !== filtroCategoria) return false;
      if (filtroStatus === 'revisado' && !d.revisado_usuario) return false;
      if (filtroStatus === 'pendente' && d.revisado_usuario) return false;
      if (filtroValorMin !== '' && d.valor < parseFloat(filtroValorMin)) return false;
      if (filtroValorMax !== '' && d.valor > parseFloat(filtroValorMax)) return false;
      return true;
    });
  }

  // --- Calculations ---
  function calcCategoryTotals(filtered) {
    const totals = {};
    NTA_CATEGORIAS.forEach(c => { totals[c.code] = { ...c, total: 0, count: 0 }; });
    filtered.forEach(d => {
      if (totals[d.categoria_code]) {
        totals[d.categoria_code].total += d.valor || 0;
        totals[d.categoria_code].count++;
      }
    });
    return Object.values(totals).filter(t => t.count > 0).sort((a, b) => b.total - a.total);
  }

  function calcStats(filtered) {
    const total = filtered.reduce((s, d) => s + (d.valor_dedutivel || d.valor || 0), 0);
    const revisadas = filtered.filter(d => d.revisado_usuario).length;
    const pendentes = filtered.length - revisadas;
    const pctRevisadas = filtered.length > 0 ? Math.round((revisadas / filtered.length) * 100) : 0;
    return { total: Math.round(total * 100) / 100, revisadas, pendentes, pctRevisadas };
  }

  // --- Delete ---
  async function deleteDespesa(id) {
    console.log('[despesa] deleteDespesa called with id:', id);

    // Custom confirmation modal instead of window.confirm
    const confirmed = await showConfirmModal('Excluir esta despesa?', 'Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    const { error } = await supabase.from('despesa').delete().eq('id', id);
    if (error) {
      console.error('[despesa] Error deleting:', error);
      return;
    }
    console.log('[despesa] Deleted successfully:', id);
    despesas = despesas.filter(d => d.id !== id);
    renderContent();
  }

  // Custom confirm modal (replaces window.confirm)
  function showConfirmModal(title, message) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
      overlay.innerHTML = `
        <div class="card" style="max-width:380px;width:90%;padding:1.5rem;">
          <h3 style="margin:0 0 0.5rem;font-size:1.1rem;">⚠️ ${title}</h3>
          <p style="margin:0 0 1.5rem;color:var(--color-text-muted);font-size:0.9rem;">${message}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <button id="confirm-cancel" class="btn btn-outline">キャンセル</button>
            <button id="confirm-ok" style="background:#ef4444;color:#fff;border:none;border-radius:var(--radius-md);padding:0.6rem;font-weight:600;cursor:pointer;">削除する</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });
      overlay.querySelector('#confirm-ok').addEventListener('click', () => {
        overlay.remove();
        resolve(true);
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { overlay.remove(); resolve(false); }
      });
    });
  }

  // --- Save (edit modal) ---
  async function saveEdit() {
    if (!editingDespesa) return;
    const payload = {
      data_recibo: document.getElementById('edit-data')?.value,
      estabelecimento: document.getElementById('edit-estab')?.value,
      descricao: document.getElementById('edit-desc')?.value,
      categoria_code: document.getElementById('edit-cat')?.value,
      categoria_nome: NTA_CATEGORIAS.find(c => c.code === document.getElementById('edit-cat')?.value)?.nome || '',
      valor: parseFloat(document.getElementById('edit-valor')?.value) || 0,
      valor_dedutivel: parseFloat(document.getElementById('edit-dedutivel')?.value) || 0,
      revisado_usuario: document.getElementById('edit-revisado')?.checked || false,
    };
    await supabase.from('despesa').update(payload).eq('id', editingDespesa.id);
    const idx = despesas.findIndex(d => d.id === editingDespesa.id);
    if (idx >= 0) despesas[idx] = { ...despesas[idx], ...payload };
    editingDespesa = null;
    renderContent();
  }

  // --- New manual expense ---
  async function createManual() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const payload = {
      usuario_id: user.id,
      data_recibo: dateStr,
      descricao: '',
      estabelecimento: '',
      valor: 0,
      valor_dedutivel: 0,
      categoria_code: '16',
      categoria_nome: '雑費',
      campo_formulario: 'expenses_16',
      classificacao_automatica: false,
      revisado_usuario: false,
      ano_fiscal: selectedYear,
      mes: today.getMonth() + 1,
    };
    const { data, error } = await supabase.from('despesa').insert(payload).select().single();
    if (data) {
      despesas.unshift(data);
      editingDespesa = data;
      renderContent();
    } else if (error) {
      // Fallback: add to local state for demo
      const fake = { ...payload, id: 'local-' + Date.now() };
      despesas.unshift(fake);
      editingDespesa = fake;
      renderContent();
    }
  }

  // --- Render content (table + panels) ---
  function renderContent() {
    const filtered = getFilteredDespesas();
    const catTotals = calcCategoryTotals(filtered);
    const stats = calcStats(filtered);
    const subtotalFiltered = filtered.reduce((s, d) => s + (d.valor || 0), 0);
    const maxCatTotal = catTotals.length > 0 ? catTotals[0].total : 1;

    const contentEl = document.getElementById('despesas-content');
    if (!contentEl) return;

    contentEl.innerHTML = `
      <!-- Table -->
      <div class="card despesas-table-card">
        <div class="despesas-table-wrap">
          <table class="despesas-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Estabelecimento</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th class="col-num">Valor (¥)</th>
                <th>Invoice</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length === 0 ? `
                <tr><td colspan="8" class="empty-state">Nenhuma despesa encontrada para os filtros selecionados.</td></tr>
              ` : filtered.map(d => `
                <tr class="despesa-row">
                  <td class="col-date-sm">${d.data_recibo || '—'}</td>
                  <td class="col-estab">${d.estabelecimento || '—'}</td>
                  <td class="col-desc-sm">${(d.descricao || '').substring(0, 50)}${(d.descricao || '').length > 50 ? '…' : ''}</td>
                  <td class="col-cat-sm">
                    <span class="cat-badge">${d.categoria_code || '?'}</span>
                    <span class="cat-name-jp">${d.categoria_nome || ''}</span>
                  </td>
                  <td class="col-num col-valor">¥${(d.valor || 0).toLocaleString('ja-JP')}</td>
                  <td class="col-status">${getInvoiceStatusIcon(d)}</td>
                  <td class="col-status">
                    ${d.revisado_usuario
        ? '<span class="status-icon status-reviewed" title="Revisado">✓</span>'
        : '<span class="status-icon status-pending" title="Pendente">⏳</span>'
      }
                  </td>
                  <td class="col-actions">
                    <button class="btn-icon btn-edit-despesa" data-id="${d.id}" title="Editar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-delete-despesa-item" data-id="${d.id}" title="Excluir">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="despesas-subtotal-row">
                <td colspan="4"><strong>Subtotal filtrado (${filtered.length} despesas)</strong></td>
                <td class="col-num"><strong>¥${Math.round(subtotalFiltered).toLocaleString('ja-JP')}</strong></td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Category Totals Table -->
      ${catTotals.length > 0 ? `
      <div class="card cat-totals-card">
        <h3 class="section-title">Totais por Categoria</h3>
        <table class="cat-totals-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th class="col-num">Qtd</th>
              <th class="col-num">Total (¥)</th>
            </tr>
          </thead>
          <tbody>
            ${catTotals.map(c => `
              <tr>
                <td><span class="cat-badge">${c.code}</span></td>
                <td>${c.nome} — ${c.descricao}</td>
                <td class="col-num">${c.count}</td>
                <td class="col-num"><strong>¥${Math.round(c.total).toLocaleString('ja-JP')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Summary Panel -->
      <div class="despesas-summary">
        <div class="card summary-panel">
          <h3 class="section-title">Resumo do Ano ${selectedYear}</h3>
          <div class="summary-stat summary-stat-highlight">
            <span class="summary-stat-label">Total Despesas Dedutíveis</span>
            <span class="summary-stat-value">¥${Math.round(stats.total).toLocaleString('ja-JP')}</span>
          </div>
          <div class="summary-stat-row">
            <div class="summary-stat">
              <span class="summary-stat-label">Revisadas</span>
              <span class="summary-stat-value summary-green">${stats.revisadas}</span>
            </div>
            <div class="summary-stat">
              <span class="summary-stat-label">Pendentes</span>
              <span class="summary-stat-value summary-amber">${stats.pendentes}</span>
            </div>
          </div>
          <div class="review-progress">
            <div class="review-progress-bar">
              <div class="review-progress-fill" style="width:${stats.pctRevisadas}%"></div>
            </div>
            <span class="review-progress-label">${stats.pctRevisadas}% revisadas</span>
          </div>
        </div>

        ${catTotals.length > 0 ? `
        <div class="card summary-panel">
          <h3 class="section-title">Despesas por Categoria</h3>
          <div class="hbar-chart">
            ${catTotals.map(c => `
              <div class="hbar-row">
                <span class="hbar-label">${c.code} ${c.nome}</span>
                <div class="hbar-track">
                  <div class="hbar-fill" style="width:${Math.max((c.total / maxCatTotal) * 100, 3)}%"></div>
                </div>
                <span class="hbar-value">¥${Math.round(c.total).toLocaleString('ja-JP')}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Edit Modal -->
      ${editingDespesa ? `
      <div class="modal-overlay" id="edit-modal-overlay">
        <div class="modal card">
          <div class="modal-header">
            <h2>Editar Despesa</h2>
            <button class="btn-icon" id="btn-close-modal" title="Fechar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group">
                <label for="edit-data">Data</label>
                <input type="date" id="edit-data" value="${editingDespesa.data_recibo || ''}" />
              </div>
              <div class="form-group">
                <label for="edit-estab">Estabelecimento</label>
                <input type="text" id="edit-estab" value="${editingDespesa.estabelecimento || ''}" />
              </div>
              <div class="form-group form-group-full">
                <label for="edit-desc">Descrição</label>
                <textarea id="edit-desc" rows="2" style="width:100%;padding:var(--space-3) var(--space-4);font-family:var(--font-family);font-size:var(--font-size-sm);border:1px solid var(--color-border);border-radius:var(--radius-md);outline:none;resize:vertical;">${editingDespesa.descricao || ''}</textarea>
              </div>
              <div class="form-group">
                <label for="edit-cat">Categoria</label>
                <select id="edit-cat">
                  ${NTA_CATEGORIAS.map(c => `<option value="${c.code}" ${c.code === editingDespesa.categoria_code ? 'selected' : ''}>${c.code} | ${c.nome} — ${c.descricao}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="edit-valor">Valor (¥)</label>
                <input type="number" id="edit-valor" value="${editingDespesa.valor || 0}" step="0.01" />
              </div>
              <div class="form-group">
                <label for="edit-dedutivel">Valor Dedutível (¥)</label>
                <input type="number" id="edit-dedutivel" value="${editingDespesa.valor_dedutivel || 0}" step="0.01" />
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="edit-revisado" ${editingDespesa.revisado_usuario ? 'checked' : ''} />
                  Marcado como revisado
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="btn-cancel-edit">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-edit">Salvar Alterações</button>
          </div>
        </div>
      </div>
      ` : ''}
    `;

    bindContentEvents();
  }

  function bindContentEvents() {
    document.querySelectorAll('.btn-edit-despesa').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        editingDespesa = despesas.find(d => String(d.id) === id);
        renderContent();
      });
    });
    const deleteButtons = document.querySelectorAll('.btn-delete-despesa-item');
    console.log('[despesa] Found delete buttons:', deleteButtons.length);
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[despesa] Delete button clicked, id:', btn.dataset.id);
        deleteDespesa(btn.dataset.id);
      });
    });
    document.getElementById('btn-close-modal')?.addEventListener('click', () => { editingDespesa = null; renderContent(); });
    document.getElementById('btn-cancel-edit')?.addEventListener('click', () => { editingDespesa = null; renderContent(); });
    document.getElementById('btn-save-edit')?.addEventListener('click', saveEdit);
    document.getElementById('edit-modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'edit-modal-overlay') { editingDespesa = null; renderContent(); }
    });
  }

  // --- Render page shell ---
  async function renderPage() {
    await loadDespesas();

    const yearOpts = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      yearOpts.push(`<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`);
    }

    const monthOpts = [`<option value="0">Todos</option>`]
      .concat(MESES_NOME.map((n, i) => `<option value="${i + 1}" ${filtroMes === i + 1 ? 'selected' : ''}>${n}</option>`));

    const catOpts = [`<option value="">Todas</option>`]
      .concat(NTA_CATEGORIAS.map(c => `<option value="${c.code}" ${filtroCategoria === c.code ? 'selected' : ''}>${c.code} | ${c.nome}</option>`));

    app.innerHTML = `
      ${renderSidebar('despesas')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container page-wide">
          <div class="page-header-row">
            <div class="page-header">
              <h1>Despesas</h1>
              <p>Gestão e classificação de despesas — 経費管理</p>
            </div>
            <div class="page-header-actions">
              <div class="selector-group">
                <label for="sel-year-desp">Ano fiscal</label>
                <select id="sel-year-desp">${yearOpts.join('')}</select>
              </div>
              <button class="btn btn-primary" id="btn-nova-despesa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Nova despesa manual
              </button>
            </div>
          </div>

          <div class="filter-panel card">
            <div class="filter-grid">
              <div class="filter-item">
                <label for="f-mes">Mês</label>
                <select id="f-mes">${monthOpts.join('')}</select>
              </div>
              <div class="filter-item">
                <label for="f-cat">Categoria</label>
                <select id="f-cat">${catOpts.join('')}</select>
              </div>
              <div class="filter-item">
                <label for="f-status">Status</label>
                <select id="f-status">
                  <option value="" ${filtroStatus === '' ? 'selected' : ''}>Todas</option>
                  <option value="revisado" ${filtroStatus === 'revisado' ? 'selected' : ''}>Revisadas</option>
                  <option value="pendente" ${filtroStatus === 'pendente' ? 'selected' : ''}>Pendentes</option>
                </select>
              </div>
              <div class="filter-item">
                <label>Valor (¥)</label>
                <div class="filter-range">
                  <input type="number" id="f-val-min" placeholder="Mín" value="${filtroValorMin}" />
                  <span class="filter-range-sep">—</span>
                  <input type="number" id="f-val-max" placeholder="Máx" value="${filtroValorMax}" />
                </div>
              </div>
            </div>
          </div>

          <div id="despesas-content"></div>
        </div>
      </main>
    </div>
    `;

    // Bind shell events
    bindSidebarEvents();

    document.getElementById('sel-year-desp').addEventListener('change', (e) => {
      selectedYear = parseInt(e.target.value);
      renderPage();
    });

    document.getElementById('btn-nova-despesa').addEventListener('click', createManual);

    // Filters
    const applyFilters = () => {
      filtroMes = parseInt(document.getElementById('f-mes').value);
      filtroCategoria = document.getElementById('f-cat').value;
      filtroStatus = document.getElementById('f-status').value;
      filtroValorMin = document.getElementById('f-val-min').value;
      filtroValorMax = document.getElementById('f-val-max').value;
      renderContent();
    };
    ['f-mes', 'f-cat', 'f-status'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', applyFilters);
    });
    ['f-val-min', 'f-val-max'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', applyFilters);
    });

    renderContent();
  }

  await renderPage();
}
