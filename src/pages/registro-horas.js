import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_SEMANA_JA = ['日', '月', '火', '水', '木', '金', '土'];
const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatDate(year, month, day) {
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

function decimalToHHMM(dec) {
  if (!dec || dec <= 0) return '—';
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${h}h${String(m).padStart(2, '0')}`;
}

function calcTotal(entrada, saida, intervalo) {
  if (!entrada || !saida) return 0;
  let diff = timeToDecimal(saida) - timeToDecimal(entrada);
  if (intervalo) diff -= timeToDecimal(intervalo);
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

// Debounce helper
function debounce(fn, ms = 600) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export async function renderRegistroHoras(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login'); return; }
  const userId = user.id;

  const now = new Date();
  let selectedYear = now.getFullYear();
  let selectedMonth = now.getMonth() + 1;

  // State
  let registros = {}; // key: day number -> record
  let descontos = [];  // array of desconto objects
  let valorHora = 0;
  let perfilValorHora = 0;

  // Load user profile for default valor_hora
  async function loadPerfil() {
    try {
      const { data } = await supabase.from('perfil_usuario').select('valor_hora_padrao').eq('id', userId).single();
      if (data) { perfilValorHora = data.valor_hora_padrao || 0; }
    } catch (e) { }
  }

  // Load registros for selected month
  async function loadRegistros() {
    const { data } = await supabase
      .from('registro_diario')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ano', selectedYear)
      .eq('mes', selectedMonth);
    registros = {};
    if (data) {
      data.forEach(r => {
        const day = new Date(r.data).getDate();
        registros[day] = r;
      });
    }
  }

  // Load descontos for selected month
  async function loadDescontos() {
    const { data } = await supabase
      .from('desconto_mensal')
      .select('*')
      .eq('usuario_id', userId)
      .eq('ano', selectedYear)
      .eq('mes', selectedMonth);
    descontos = data || [];
  }

  // Load resumo for valor_hora override
  async function loadResumo() {
    const { data } = await supabase
      .from('resumo_mensal')
      .select('valor_hora')
      .eq('usuario_id', userId)
      .eq('ano', selectedYear)
      .eq('mes', selectedMonth)
      .single();
    if (data && data.valor_hora > 0) {
      valorHora = data.valor_hora;
    } else {
      valorHora = perfilValorHora;
    }
  }

  // Save a single registro diario


  // Save resumo mensal
  async function saveResumo() {
    const totalHoras = calcTotalHorasMes();
    let subtotalBruto = 0;
    for (const [dayStr, r] of Object.entries(registros)) {
      if (!r.hora_entrada || !r.hora_saida) {
        if (r.tipo_calculo === 'fixo') subtotalBruto += parseFloat(r.valor_diario) || 0;
        continue;
      }
      const e = r.hora_entrada.slice(0, 5);
      const s = r.hora_saida.slice(0, 5);
      const i = r.intervalo ? r.intervalo.slice(0, 5) : '';
      const totalDia = calcTotal(e, s, i);
      if (r.tipo_calculo === 'fixo') {
        subtotalBruto += parseFloat(r.valor_diario) || 0;
      } else {
        const rowRate = parseFloat(r.valor_diario) || valorHora;
        subtotalBruto += Math.round(totalDia * rowRate * 100) / 100;
      }
    }
    const totalDesc = calcTotalDescontos();
    const totalLiquido = Math.round((subtotalBruto - totalDesc) * 100) / 100;

    const payload = {
      usuario_id: userId,
      ano: selectedYear,
      mes: selectedMonth,
      total_horas: totalHoras,
      valor_hora: valorHora,
      total_descontos: totalDesc,
    };

    const { data: existing } = await supabase
      .from('resumo_mensal')
      .select('id')
      .eq('usuario_id', userId)
      .eq('ano', selectedYear)
      .eq('mes', selectedMonth)
      .single();

    if (existing) {
      await supabase.from('resumo_mensal').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('resumo_mensal').insert(payload);
    }
  }

  const debouncedSaveResumo = debounce(saveResumo, 800);

  // Calculate total hours for month
  function calcTotalHorasMes() {
    let total = 0;
    for (const [day, r] of Object.entries(registros)) {
      if (r.hora_entrada && r.hora_saida) {
        total += calcTotal(r.hora_entrada.slice(0, 5), r.hora_saida.slice(0, 5), r.intervalo ? r.intervalo.slice(0, 5) : '');
      }
    }
    return Math.round(total * 100) / 100;
  }

  // Calculate total descontos
  function calcTotalDescontos() {
    let total = 0;
    document.querySelectorAll('.desconto-valor').forEach(el => {
      total += parseFloat(el.value) || 0;
    });
    return Math.round(total * 100) / 100;
  }


  // Update all footer calculations
  function updateCalculations() {
    const totalHoras = calcTotalHorasMes();
    let subtotalBruto = 0;
    for (const [dayStr, r] of Object.entries(registros)) {
      if (!r.hora_entrada || !r.hora_saida) {
        if (r.tipo_calculo === 'fixo') subtotalBruto += parseFloat(r.valor_diario) || 0;
        continue;
      }
      const e = r.hora_entrada.slice(0, 5);
      const s = r.hora_saida.slice(0, 5);
      const i = r.intervalo ? r.intervalo.slice(0, 5) : '';
      const totalDia = calcTotal(e, s, i);
      if (r.tipo_calculo === 'fixo') {
        subtotalBruto += parseFloat(r.valor_diario) || 0;
      } else {
        const rowRate = parseFloat(r.valor_diario) || valorHora;
        subtotalBruto += Math.round(totalDia * rowRate * 100) / 100;
      }
    }
    const totalDesc = calcTotalDescontos();
    const totalLiquido = Math.round((subtotalBruto - totalDesc) * 100) / 100;

    const elTotalHoras = document.getElementById('calc-total-horas');
    const elSubtotal = document.getElementById('calc-subtotal');
    const elTotalDesc = document.getElementById('calc-total-descontos');
    const elTotalLiq = document.getElementById('calc-total-liquido');

    if (elTotalHoras) elTotalHoras.textContent = decimalToHHMM(totalHoras);
    if (elSubtotal) elSubtotal.textContent = `¥${subtotalBruto.toLocaleString('ja-JP')}`;
    if (elTotalDesc) elTotalDesc.textContent = `¥${totalDesc.toLocaleString('ja-JP')}`;
    if (elTotalLiq) {
      elTotalLiq.textContent = `¥${totalLiquido.toLocaleString('ja-JP')}`;
      elTotalLiq.className = 'calc-highlight ' + (totalLiquido >= 0 ? 'calc-positive' : 'calc-negative');
    }

    debouncedSaveResumo();
  }

  // Save desconto to DB
  async function saveDesconto(desconto, index) {
    const descEl = document.querySelectorAll('.desconto-desc')[index];
    const tipoEl = document.querySelectorAll('.desconto-tipo')[index];
    const valorEl = document.querySelectorAll('.desconto-valor')[index];
    if (!descEl) return;

    const payload = {
      usuario_id: userId,
      ano: selectedYear,
      mes: selectedMonth,
      descricao: descEl.value || '',
      tipo: tipoEl.value || 'Fixo mensal',
      valor: parseFloat(valorEl.value) || 0,
    };

    if (desconto.id) {
      await supabase.from('desconto_mensal').update(payload).eq('id', desconto.id);
      descontos[index] = { ...desconto, ...payload };
    } else {
      const { data } = await supabase.from('desconto_mensal').insert(payload).select().single();
      if (data) descontos[index] = data;
    }
    updateCalculations();
  }

  const debouncedSaveDesconto = debounce(saveDesconto, 500);

  // Delete desconto
  async function deleteDesconto(index) {
    const desc = descontos[index];
    if (desc?.id) {
      await supabase.from('desconto_mensal').delete().eq('id', desc.id);
    }
    descontos.splice(index, 1);
    renderDescontos();
    updateCalculations();
  }

  // Add new desconto
  function addDesconto() {
    descontos.push({ descricao: '', tipo: 'Fixo mensal', valor: 0 });
    renderDescontos();
  }

  // Render descontos section
  function renderDescontos() {
    const container = document.getElementById('descontos-list');
    if (!container) return;
    container.innerHTML = descontos.map((d, i) => `
      <div class="desconto-row" data-index="${i}">
        <input type="text" class="desconto-desc" placeholder="Descrição do desconto" value="${d.descricao || ''}" />
        <select class="desconto-tipo">
          <option value="Fixo mensal" ${d.tipo === 'Fixo mensal' ? 'selected' : ''}>Fixo mensal</option>
          <option value="Por dia trabalhado" ${d.tipo === 'Por dia trabalhado' ? 'selected' : ''}>Por dia trabalhado</option>
        </select>
        <div class="desconto-valor-wrap">
          <span class="currency-prefix">¥</span>
          <input type="number" class="desconto-valor" placeholder="0" step="0.01" value="${d.valor || ''}" />
        </div>
        <div class="desconto-actions">
          <button class="btn-icon btn-save-desconto" data-index="${i}" title="Salvar desconto">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          </button>
          <button class="btn-icon btn-delete-desconto" data-index="${i}" title="Remover desconto">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.5 2V1.5C4.5 0.948 4.948 0.5 5.5 0.5H10.5C11.052 0.5 11.5 0.948 11.5 1.5V2M1 3.5H15M2.5 3.5V14C2.5 14.552 2.948 15 3.5 15H12.5C13.052 15 13.5 14.552 13.5 14V3.5M6 6.5V12M10 6.5V12" stroke="currentColor" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Bind events
    container.querySelectorAll('.btn-save-desconto').forEach(btn => {
      btn.addEventListener('click', async () => {
        const row = btn.closest('.desconto-row');
        const idx = parseInt(btn.dataset.index);

        btn.innerHTML = '...';
        btn.disabled = true;

        await saveDesconto(descontos[idx], idx);

        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';
      });
    });

    // Optional: Keep blur events but make them non-debounced, direct saves that don't depend on the user clicking save
    container.querySelectorAll('.desconto-desc, .desconto-tipo, .desconto-valor').forEach(el => {
      el.addEventListener('change', () => {
        const row = el.closest('.desconto-row');
        const idx = parseInt(row.dataset.index);
        debouncedSaveDesconto(descontos[idx], idx); // keep auto-save as fallback
      });
    });

    container.querySelectorAll('.btn-delete-desconto').forEach(btn => {
      btn.addEventListener('click', () => deleteDesconto(parseInt(btn.dataset.index)));
    });
  }

  // Build the timesheet rows
  function buildTimesheetRows() {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    let rows = '';
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selectedYear, selectedMonth - 1, d);
      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const record = registros[d];
      const entrada = record?.hora_entrada?.slice(0, 5) || '';
      const saida = record?.hora_saida?.slice(0, 5) || '';
      const intervalo = record?.intervalo?.slice(0, 5) || '';
      const total = calcTotal(entrada, saida, intervalo);
      // subtotal calculated dynamically
      const obs = record?.observacao || '';

      let rowClass = 'timesheet-row';
      if (dow === 0) rowClass += ' row-weekend is-sunday';
      else if (dow === 6) rowClass += ' row-weekend is-saturday';
      if (total > 8) rowClass += ' row-overtime';

      const hasData = entrada || saida || total > 0 || obs;

      const txtEntrada = entrada || '-';
      const txtSaida = saida || '-';
      let txtIntervalo = '-';
      if (intervalo) {
        const [ih, im] = intervalo.split(':');
        txtIntervalo = `${parseInt(ih) * 60 + parseInt(im)} 分`;
      }
      const txtTotal = total > 0 ? `${total.toFixed(1)}h` : '-';
      let finalSubtotal = 0;
      if (record?.tipo_calculo === 'fixo') {
        finalSubtotal = parseFloat(record.valor_diario) || 0;
      } else {
        const rowRate = parseFloat(record?.valor_diario) || valorHora;
        finalSubtotal = Math.round(total * rowRate * 100) / 100;
      }
      const txtSubtotal = finalSubtotal > 0 ? `¥${finalSubtotal.toLocaleString('ja-JP')}` : '-';

      let actionHtml = '';
      if (hasData) {
        actionHtml = `
          <div class="row-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
            <button class="btn-icon btn-edit-row" data-day="${d}" title="Editar (編集)" style="background: none; border: none; cursor: pointer; color: #3b82f6; display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; line-height: 1;">
              <span>編集</span>
              <span>Edit</span>
            </button>
            <button class="btn-icon btn-delete-row" data-day="${d}" title="Excluir" style="background: none; border: none; cursor: pointer; color: #ef4444; margin-left: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        `;
      } else {
        actionHtml = `
          <div class="row-actions" style="display: flex; justify-content: flex-end;">
            <button class="btn-icon btn-add-row" data-day="${d}" title="Adicionar" style="background: none; border: none; cursor: pointer; color: #3b82f6; font-size: 1.5rem; font-weight: bold; padding: 0;">+</button>
          </div>
        `;
      }

      const diaNome = DIAS_SEMANA_JA ? DIAS_SEMANA_JA[dow] : DIAS_SEMANA[dow];

      rows += `
        <tr id="row-${d}" class="${rowClass}">
          <td class="col-date" style="line-height: 1.2;">
            ${d}日<br><span style="font-size: 0.85em; color: var(--color-text-muted);">(${diaNome})</span>
          </td>
          <td class="col-time" style="text-align: center;">${txtEntrada}</td>
          <td class="col-time" style="text-align: center;">${txtSaida}</td>
          <td class="col-time" style="text-align: center;">${txtIntervalo}</td>
          <td class="col-total" style="text-align: center; color: var(--color-text-muted);">${txtTotal}</td>
          <td class="col-subtotal" style="text-align: center;">${txtSubtotal}</td>
          <td class="col-acoes" style="text-align: right; padding-right: 1rem; width: 80px;">${actionHtml}</td>
        </tr>
      `;
    }
    return rows;
  }

  // Full render
  async function renderPage() {
    await Promise.all([loadPerfil(), loadRegistros(), loadDescontos()]);
    await loadResumo();

    const yearOptions = [];
    for (let y = selectedYear - 3; y <= selectedYear + 1; y++) {
      yearOptions.push(`<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`);
    }
    const monthOptions = MESES_NOME.map((name, i) =>
      `<option value="${i + 1}" ${i + 1 === selectedMonth ? 'selected' : ''}>${name}</option>`
    );

    app.innerHTML = `
      ${renderSidebar('registro-horas')}
      <div class="app-content-wrapper">
        <main class="main-content">
          <div class="page-container page-wide">
            <div class="page-header">
              <h1>Registro de Horas</h1>
              <p>Controle de horas trabalhadas — 勤務時間記録</p>
            </div>

            <div class="period-selectors">
              <div class="selector-group">
                <label for="sel-year">Ano</label>
                <select id="sel-year">${yearOptions.join('')}</select>
              </div>
              <div class="selector-group">
                <label for="sel-month">Mês</label>
                <select id="sel-month">${monthOptions.join('')}</select>
              </div>
              <div class="period-label">${MESES_NOME[selectedMonth - 1]} ${selectedYear}</div>
            </div>

            <div class="timesheet-wrapper card">
              <table class="timesheet-table">
                <thead>
                  <tr>
                    <th class="col-date">Data</th>
                    <th class="col-time" style="text-align: center;">Entrada</th>
                    <th class="col-time" style="text-align: center;">Saída</th>
                    <th class="col-time" style="text-align: center;">Intervalo</th>
                    <th class="col-total" style="text-align: center;">Total</th>
                    <th class="col-subtotal" style="text-align: center;">¥ Subtotal</th>
                    <th class="col-acoes" style="text-align: right; padding-right: 1rem;">Ações</th>
                  </tr>
                </thead>
                <tbody id="timesheet-body">
                  ${buildTimesheetRows()}
                </tbody>
              </table>
              
            <!-- Modal de Lançamento de Horas -->
            <div id="modal-horas" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
              <div class="modal-content" style="width: 100%; max-width: 380px; padding: 1.5rem; background: #1e1e1e; border-radius: 1rem; color: #f3f4f6; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <h2 id="modal-horas-title" style="margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600; text-align: left;">YYYY-MM-DD の記録</h2>
                <input type="hidden" id="modal-day" value="" />
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-entrada" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">入室時刻</label>
                    <input type="time" id="modal-entrada" class="input-time" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-saida" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">退室時刻</label>
                    <input type="time" id="modal-saida" class="input-time" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-intervalo" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">休憩時間 (分)</label>
                    <input type="number" id="modal-intervalo" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-extra" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">残業時間 (時間)</label>
                    <input type="number" id="modal-extra" step="0.1" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" value="0" />
                  </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem; gap: 0.25rem;">
                  <label for="modal-obs" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">メモ (Observação)</label>
                  <input type="text" id="modal-obs" placeholder="任意のメモ" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.75rem; width: 100%;" />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid #404040;">
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-tipo-calculo" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">Tipo de Cálculo</label>
                    <select id="modal-tipo-calculo" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%; height: 38px;">
                      <option value="por_hora">Por Hora</option>
                      <option value="fixo">Dia Fixo</option>
                    </select>
                  </div>
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-valor-diario" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">Valor (¥)</label>
                    <input type="number" id="modal-valor-diario" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <button id="modal-btn-cancelar" style="background: transparent; color: #f3f4f6; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.75rem; font-weight: 600; cursor: pointer;">キャンセル</button>
                  <button id="modal-btn-salvar" style="background: #2563eb; color: #ffffff; border: none; border-radius: 0.5rem; padding: 0.75rem; font-weight: 600; cursor: pointer;">保存</button>
                </div>
              </div>
            </div>
            </div>

            </div>

            <div class="calc-footer card">
              <div class="calc-grid">
                <div class="calc-item">
                  <span class="calc-label">Total horas no mês</span>
                  <span class="calc-value" id="calc-total-horas">${decimalToHHMM(calcTotalHorasFromRecords())}</span>
                </div>
                <div class="calc-item">
                  <span class="calc-label">Valor por hora (¥)</span>
                  <div class="calc-input-wrap">
                    <span class="currency-prefix">¥</span>
                    <input type="number" id="calc-valor-hora" value="${valorHora}" step="0.01" class="calc-input" />
                  </div>
                </div>
                <div class="calc-item calc-item-accent">
                  <span class="calc-label">Subtotal bruto</span>
                  <span class="calc-value calc-bold" id="calc-subtotal">¥${calcSubtotalBrutoFromRecords().toLocaleString('ja-JP')}</span>
                </div>
              </div>
            </div>

            <div class="descontos-section card">
              <div class="descontos-header">
                <h2>Descontos do mês</h2>
                <button id="btn-add-desconto" class="btn btn-outline btn-sm">+ Adicionar Desconto</button>
              </div>
              <div id="descontos-list"></div>
              <div class="descontos-footer">
                <div class="calc-item">
                  <span class="calc-label">Total de descontos</span>
                  <span class="calc-value" id="calc-total-descontos">¥0</span>
                </div>
                <div class="calc-item">
                  <span class="calc-label">Total líquido do mês</span>
                  <span class="calc-highlight calc-positive" id="calc-total-liquido">¥0</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    // Bind events
    bindSidebarEvents();

    document.getElementById('sel-year').addEventListener('change', (e) => {
      selectedYear = parseInt(e.target.value);
      renderPage();
    });

    document.getElementById('sel-month').addEventListener('change', (e) => {
      selectedMonth = parseInt(e.target.value);
      renderPage();
    });

    // Timesheet input events (delegation)




    const modal = document.getElementById('modal-horas');
    const mTitle = document.getElementById('modal-horas-title');
    const mDay = document.getElementById('modal-day');
    const mEnt = document.getElementById('modal-entrada');
    const mSai = document.getElementById('modal-saida');
    const mInt = document.getElementById('modal-intervalo');
    const mExtra = document.getElementById('modal-extra');
    const mObs = document.getElementById('modal-obs');
    const mTipoCalculo = document.getElementById('modal-tipo-calculo');
    const mValorDiario = document.getElementById('modal-valor-diario');

    function updateExtraHours() {
      const e = mEnt.value;
      const s = mSai.value;
      const i = parseInt(mInt.value) || 0;
      if (e && s) {
        // Interval is in minutes for UI, need to convert to hours for calc
        const intStr = `0${Math.floor(i / 60)}:` + String(i % 60).padStart(2, '0');
        const t = calcTotal(e, s, intStr);
        mExtra.value = t > 8 ? (t - 8).toFixed(1) : '0';
      } else {
        mExtra.value = '0';
      }
    }

    // Bind change events to recalculate extra hours dynamically
    mEnt.addEventListener('input', updateExtraHours);
    mSai.addEventListener('input', updateExtraHours);
    mInt.addEventListener('input', updateExtraHours);

    function openModalForDay(day) {
      const record = registros[day];
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      mTitle.textContent = `${dateStr} の記録`;
      mDay.value = day;

      if (record) {
        // Existing record
        mEnt.value = record.hora_entrada?.slice(0, 5) || '';
        mSai.value = record.hora_saida?.slice(0, 5) || '';

        let intMin = 0;
        if (record.intervalo) {
          const [h, m] = record.intervalo.split(':');
          intMin = parseInt(h) * 60 + parseInt(m);
        }
        mInt.value = intMin || '';
        mObs.value = record.observacao || '';
        mTipoCalculo.value = record.tipo_calculo || 'por_hora';
        mValorDiario.value = record.valor_diario || valorHora;

        if (record.horas_extras !== null && record.horas_extras !== undefined) {
          mExtra.value = record.horas_extras;
        } else {
          updateExtraHours();
        }
      } else {
        // Pre-fill default values
        mEnt.value = '08:00';
        mSai.value = '17:00';
        mInt.value = '60';
        mObs.value = '';
        mTipoCalculo.value = 'por_hora';
        mValorDiario.value = valorHora;
        updateExtraHours();
      }

      modal.style.display = 'flex';
    }

    document.getElementById('modal-btn-cancelar').addEventListener('click', () => {
      modal.style.display = 'none';
      mDay.value = '';
    });

    document.getElementById('modal-btn-salvar').addEventListener('click', async () => {
      const day = parseInt(mDay.value);
      if (!day) return;

      const btn = document.getElementById('modal-btn-salvar');
      btn.disabled = true;
      btn.textContent = '...';

      try {
        const entrada = mEnt.value;
        const saida = mSai.value;
        const intMin = parseInt(mInt.value) || 0;
        const obs = mObs.value;
        const tipoCalculo = mTipoCalculo.value;
        const valorDiario = parseFloat(mValorDiario.value) || 0;

        const intStr = intMin > 0 ? `0${Math.floor(intMin / 60)}:` + String(intMin % 60).padStart(2, '0') : null;

        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const row = registros[day];

        if (!entrada && !saida && !obs) {
          if (row?.id) {
            await supabase.from('registro_diario').delete().eq('id', row.id);
            delete registros[day];
          }
        } else {
          const payload = {
            usuario_id: userId,
            data: dateStr,
            hora_entrada: entrada || null,
            hora_saida: saida || null,
            intervalo: intStr,
            observacao: obs || null,
            tipo_calculo: tipoCalculo,
            valor_diario: valorDiario,
            horas_extras: parseFloat(mExtra.value) || 0,
          };

          if (row?.id) {
            await supabase.from('registro_diario').update(payload).eq('id', row.id);
            registros[day] = { ...row, ...payload };
          } else {
            const { data: newRow } = await supabase.from('registro_diario').insert(payload).select().single();
            if (newRow) registros[day] = newRow;
          }
        }

        modal.style.display = 'none';
        mDay.value = '';
        document.getElementById('timesheet-body').innerHTML = buildTimesheetRows();
        updateCalculations();
      } finally {
        btn.disabled = false;
        btn.textContent = '保存';
      }
    });

    document.getElementById('timesheet-body').addEventListener('click', async (e) => {
      const btnAdd = e.target.closest('.btn-add-row');
      const btnEdit = e.target.closest('.btn-edit-row');
      const btnDel = e.target.closest('.btn-delete-row');

      if (btnAdd || btnEdit) {
        openModalForDay(parseInt((btnAdd || btnEdit).dataset.day));
      }

      if (btnDel) {
        const day = parseInt(btnDel.dataset.day);
        const diaNome = DIAS_SEMANA_JA ? DIAS_SEMANA_JA[new Date(selectedYear, selectedMonth - 1, day).getDay()] : day;
        if (confirm(`Apagar os dados do dia ${day} (${diaNome})?`)) {
          const row = registros[day];
          if (row?.id) {
            await supabase.from('registro_diario').delete().eq('id', row.id);
            delete registros[day];
            document.getElementById('timesheet-body').innerHTML = buildTimesheetRows();
            updateCalculations();
          }
        }
      }
    });


    // Valor hora events
    document.getElementById('calc-valor-hora').addEventListener('input', (e) => {
      valorHora = parseFloat(e.target.value) || 0;
      updateCalculations();
    });

    // Descontos events
    document.getElementById('btn-add-desconto').addEventListener('click', addDesconto);

    // Render descontos
    renderDescontos();
    updateCalculations();
  }


  function calcSubtotalBrutoFromRecords() {
    let subtotalBruto = 0;
    for (const [dayStr, r] of Object.entries(registros)) {
      if (!r.hora_entrada || !r.hora_saida) {
        if (r.tipo_calculo === 'fixo') subtotalBruto += parseFloat(r.valor_diario) || 0;
        continue;
      }
      const e = r.hora_entrada.slice(0, 5);
      const s = r.hora_saida.slice(0, 5);
      const i = r.intervalo ? r.intervalo.slice(0, 5) : '';
      const totalDia = calcTotal(e, s, i);
      if (r.tipo_calculo === 'fixo') {
        subtotalBruto += parseFloat(r.valor_diario) || 0;
      } else {
        const rowRate = parseFloat(r.valor_diario) || valorHora;
        subtotalBruto += Math.round(totalDia * rowRate * 100) / 100;
      }
    }
    return Math.round(subtotalBruto * 100) / 100;
  }

  // Helper to calc total from loaded records (before DOM is ready)
  function calcTotalHorasFromRecords() {
    let total = 0;
    for (const [day, r] of Object.entries(registros)) {
      if (r.hora_entrada && r.hora_saida) {
        total += calcTotal(r.hora_entrada.slice(0, 5), r.hora_saida.slice(0, 5), r.intervalo ? r.intervalo.slice(0, 5) : '');
      }
    }
    return Math.round(total * 100) / 100;
  }

  await renderPage();
}
