import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
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
  const saveRegistro = debounce(async (day) => {
    const row = registros[day];
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entrada = document.getElementById(`entrada-${day}`)?.value || '';
    const saida = document.getElementById(`saida-${day}`)?.value || '';
    const intervalo = document.getElementById(`intervalo-${day}`)?.value || '';
    const obs = document.getElementById(`obs-${day}`)?.value || '';
    const totalHoras = calcTotal(entrada, saida, intervalo);

    if (!entrada && !saida && !obs) {
      // If row exists with no data and record exists, delete it
      if (row?.id) {
        await supabase.from('registro_diario').delete().eq('id', row.id);
        delete registros[day];
      }
      updateCalculations();
      return;
    }

    const payload = {
      usuario_id: userId,
      data: dateStr,
      hora_entrada: entrada || null,
      hora_saida: saida || null,
      intervalo: intervalo || null,
      observacao: obs || null,
    };

    if (row?.id) {
      await supabase.from('registro_diario').update(payload).eq('id', row.id);
      registros[day] = { ...row, ...payload };
    } else {
      const { data: newRow } = await supabase.from('registro_diario').insert(payload).select().single();
      if (newRow) registros[day] = newRow;
    }

    // Update visual for this row
    updateRowVisual(day, totalHoras);
    updateCalculations();
  }, 500);

  // Save resumo mensal
  async function saveResumo() {
    const totalHoras = calcTotalHorasMes();
    const subtotalBruto = Math.round(totalHoras * valorHora * 100) / 100;
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
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const entrada = document.getElementById(`entrada-${d}`)?.value;
      const saida = document.getElementById(`saida-${d}`)?.value;
      const intervalo = document.getElementById(`intervalo-${d}`)?.value;
      total += calcTotal(entrada, saida, intervalo);
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

  // Update row visual styling
  function updateRowVisual(day, totalHoras) {
    const row = document.getElementById(`row-${day}`);
    if (!row) return;
    const date = new Date(selectedYear, selectedMonth - 1, day);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;

    row.className = 'timesheet-row';
    if (isWeekend) row.classList.add('row-weekend');
    if (totalHoras > 9) row.classList.add('row-overtime');

    const totalEl = document.getElementById(`total-${day}`);
    if (totalEl) totalEl.textContent = totalHoras > 0 ? decimalToHHMM(totalHoras) : '—';
  }

  // Update all footer calculations
  function updateCalculations() {
    const totalHoras = calcTotalHorasMes();
    const subtotalBruto = Math.round(totalHoras * valorHora * 100) / 100;
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
        <button class="btn-icon btn-delete-desconto" data-index="${i}" title="Remover desconto">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.5 2V1.5C4.5 0.948 4.948 0.5 5.5 0.5H10.5C11.052 0.5 11.5 0.948 11.5 1.5V2M1 3.5H15M2.5 3.5V14C2.5 14.552 2.948 15 3.5 15H12.5C13.052 15 13.5 14.552 13.5 14V3.5M6 6.5V12M10 6.5V12" stroke="currentColor" stroke-linecap="round"/></svg>
        </button>
      </div>
    `).join('');

    // Bind events
    container.querySelectorAll('.desconto-desc, .desconto-tipo, .desconto-valor').forEach(el => {
      el.addEventListener('change', () => {
        const row = el.closest('.desconto-row');
        const idx = parseInt(row.dataset.index);
        debouncedSaveDesconto(descontos[idx], idx);
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
      const obs = record?.observacao || '';
      let rowClass = 'timesheet-row';
      if (isWeekend) rowClass += ' row-weekend';
      if (total > 9) rowClass += ' row-overtime';

      rows += `
        <tr id="row-${d}" class="${rowClass}">
          <td class="col-date">${formatDate(selectedYear, selectedMonth, d)}</td>
          <td class="col-dow">${DIAS_SEMANA[dow]}</td>
          <td class="col-time"><input type="text" id="entrada-${d}" value="${entrada}" data-day="${d}" class="input-time input-entrada" maxlength="5" pattern="[0-2][0-9]:[0-5][0-9]" inputmode="numeric" /></td>
          <td class="col-time"><input type="text" id="saida-${d}" value="${saida}" data-day="${d}" class="input-time input-saida" maxlength="5" pattern="[0-2][0-9]:[0-5][0-9]" inputmode="numeric" /></td>
          <td class="col-time"><input type="text" id="intervalo-${d}" value="${intervalo}" data-day="${d}" class="input-time input-intervalo" maxlength="5" pattern="[0-2][0-9]:[0-5][0-9]" inputmode="numeric" /></td>
          <td class="col-total" id="total-${d}">${total > 0 ? decimalToHHMM(total) : '—'}</td>
          <td class="col-obs"><input type="text" id="obs-${d}" value="${obs}" data-day="${d}" class="input-obs" placeholder="Observação" /></td>
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
                    <th class="col-dow">Dia</th>
                    <th class="col-time">Entrada</th>
                    <th class="col-time">Saída</th>
                    <th class="col-time">Intervalo</th>
                    <th class="col-total">Total</th>
                    <th class="col-obs">Observação</th>
                  </tr>
                </thead>
                <tbody id="timesheet-body">
                  ${buildTimesheetRows()}
                </tbody>
              </table>
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
                  <span class="calc-value calc-bold" id="calc-subtotal">¥${(calcTotalHorasFromRecords() * valorHora).toLocaleString('ja-JP')}</span>
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
    document.getElementById('timesheet-body').addEventListener('input', (e) => {
      // Auto-insert colon after 2 digits for time fields
      if (e.target.classList.contains('input-time')) {
        let v = e.target.value.replace(/[^\d:]/g, '');
        if (v.length === 2 && !v.includes(':') && e.inputType !== 'deleteContentBackward') {
          e.target.value = v + ':';
          return;
        }
      }

      const day = parseInt(e.target.dataset.day);
      if (!day) return;
      const entrada = document.getElementById(`entrada-${day}`)?.value;
      const saida = document.getElementById(`saida-${day}`)?.value;
      const total = calcTotal(entrada, saida);
      updateRowVisual(day, total);
      updateCalculations();
    });

    document.getElementById('timesheet-body').addEventListener('change', (e) => {
      // Auto-format on blur: "0800" -> "08:00"
      if (e.target.classList.contains('input-time')) {
        let v = e.target.value.replace(/[^\d]/g, '');
        if (v.length === 4) {
          e.target.value = v.slice(0, 2) + ':' + v.slice(2);
        } else if (v.length === 3) {
          e.target.value = '0' + v[0] + ':' + v.slice(1);
        }
      }

      const day = parseInt(e.target.dataset.day);
      if (!day) return;
      saveRegistro(day);
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
