import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';
import { classifyDesconto } from '../classify-desconto.js';
import { exportarMesPDF } from '../pdf-export.js';

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

function formatHours(dec) {
  if (dec === null || dec === undefined || isNaN(dec) || dec <= 0) return '0h';
  const num = parseFloat(Number(dec).toFixed(2));
  return `${num}h`;
}

function formatHoursVal(dec) {
  if (dec === null || dec === undefined || isNaN(dec) || dec <= 0) return '0';
  return String(parseFloat(Number(dec).toFixed(2)));
}

function calcTotal(entrada, saida, intervalo) {
  if (!entrada || !saida) return 0;
  let start = timeToDecimal(entrada);
  let end = timeToDecimal(saida);
  if (end < start) end += 24; // Turno que cruza a meia-noite
  let diff = end - start;
  if (intervalo) diff -= timeToDecimal(intervalo);
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

/**
 * Regras Trabalhistas do Japão (労働基準法第32条 - 法定労働時間)
 * Jornada padrão estatutária = 8h diárias.
 * Horas trabalhadas que excedem 8h líquidas no dia = horas extras (残業).
 * Adicional legal = +25% (割増率 25%).
 */
function calcHorasExtras(totalHorasTrabalhadas) {
  if (!totalHorasTrabalhadas || totalHorasTrabalhadas <= 8) return 0;
  return Math.round((totalHorasTrabalhadas - 8) * 100) / 100;
}

/**
 * Regras Trabalhistas do Japão (労働基準法第37条第4項 - 深夜労働)
 * Faixa noturna estatutária: das 22:00 às 05:00 (深夜割増時間帯).
 * Adicional legal = +25% (深夜割増率 25%).
 */
function calcHorasNoturnas(entrada, saida, intervaloMinutos = 0) {
  if (!entrada || !saida) return 0;
  let start = timeToDecimal(entrada);
  let end = timeToDecimal(saida);
  if (end < start) end += 24;

  // Janelas noturnas: 00:00-05:00, 22:00-24:00 e 24:00-29:00 (00:00-05:00 do dia seguinte)
  const o1 = Math.max(0, Math.min(end, 5) - Math.max(start, 0));
  const o2 = Math.max(0, Math.min(end, 24) - Math.max(start, 22));
  const o3 = Math.max(0, Math.min(end, 29) - Math.max(start, 24));
  const grossNight = o1 + o2 + o3;

  if (grossNight <= 0) return 0;

  const totalGross = end - start;
  const breakHours = (intervaloMinutos || 0) / 60;
  const dayGross = totalGross - grossNight;

  // Desconta intervalo das horas noturnas apenas se o intervalo exceder as horas diurnas
  let nightDeduction = 0;
  if (breakHours > dayGross) {
    nightDeduction = breakHours - dayGross;
  }
  const netNight = Math.max(0, grossNight - nightDeduction);
  return Math.round(netNight * 100) / 100;
}

/**
 * Calcula valores detalhados de um dia de trabalho segundo as regras do Japão:
 * - Base = Horas normais × Taxa horária (ou diária fixa)
 * - Horas extras (>8h) = Horas extras × Taxa horária × 0.25 (+25%)
 * - Adicional Noturno (22h-5h) = Horas noturnas × Taxa horária × 0.25 (+25%)
 * - Subtotal = Base + Adicional Extra + Adicional Noturno
 */
function calcDiaValores(record, valorHoraPadrao) {
  if (!record) {
    return {
      total: 0,
      horasExtras: 0,
      horasNoturnas: 0,
      taxaHoraria: valorHoraPadrao,
      baseValor: 0,
      adicionalExtra: 0,
      adicionalNoturno: 0,
      subtotal: 0
    };
  }

  const e = record.hora_entrada?.slice(0, 5);
  const s = record.hora_saida?.slice(0, 5);
  const i = record.intervalo ? record.intervalo.slice(0, 5) : '';
  const total = (e && s) ? calcTotal(e, s, i) : 0;

  let horasExtras = 0;
  if (record.horas_extras !== null && record.horas_extras !== undefined) {
    horasExtras = parseFloat(record.horas_extras) || 0;
  } else if (total > 0) {
    horasExtras = calcHorasExtras(total);
  }

  let horasNoturnas = 0;
  if (record.adicional_noturno !== null && record.adicional_noturno !== undefined) {
    horasNoturnas = parseFloat(record.adicional_noturno) || 0;
  } else if (e && s) {
    let intMin = 0;
    if (i) {
      const [ih, im] = i.split(':');
      intMin = parseInt(ih) * 60 + parseInt(im);
    }
    horasNoturnas = calcHorasNoturnas(e, s, intMin);
  }

  const tipoCalculo = record.tipo_calculo || 'por_hora';
  let baseValor = 0;
  let taxaHoraria = valorHoraPadrao;

  if (tipoCalculo === 'fixo') {
    baseValor = parseFloat(record.valor_diario) || 0;
    taxaHoraria = valorHoraPadrao > 0 ? valorHoraPadrao : (baseValor > 0 ? Math.round((baseValor / 8) * 100) / 100 : 0);
  } else {
    taxaHoraria = parseFloat(record.valor_diario) || valorHoraPadrao;
    baseValor = Math.round(total * taxaHoraria * 100) / 100;
  }

  // 25% adicional legal japonês (割増賃金 +25%)
  const adicionalExtra = Math.round(horasExtras * taxaHoraria * 0.25 * 100) / 100;
  const adicionalNoturno = Math.round(horasNoturnas * taxaHoraria * 0.25 * 100) / 100;
  const subtotal = Math.round((baseValor + adicionalExtra + adicionalNoturno) * 100) / 100;

  return {
    total,
    horasExtras,
    horasNoturnas,
    taxaHoraria,
    baseValor,
    adicionalExtra,
    adicionalNoturno,
    subtotal
  };
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

  // Read month/year set by dashboard navigation
  const navMonth = sessionStorage.getItem('keiro_nav_month');
  const navYear = sessionStorage.getItem('keiro_nav_year');
  if (navMonth) { selectedMonth = parseInt(navMonth); sessionStorage.removeItem('keiro_nav_month'); }
  if (navYear) { selectedYear = parseInt(navYear); sessionStorage.removeItem('keiro_nav_year'); }

  // State
  let perfil = null;
  let registros = {}; // key: day number -> record
  let descontos = [];  // array of desconto objects
  let valorHora = 0;
  let perfilValorHora = 0;

  // Load user profile for default valor_hora
  async function loadPerfil() {
    try {
      const { data } = await supabase.from('perfil_usuario').select('*').eq('id', userId).single();
      if (data) {
        perfil = data;
        perfilValorHora = data.valor_hora_padrao || 0;
      }
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

  // Cálculo agregado de horas e valores do mês com adicionais (+25%) da lei japonesa
  function calcTotalsFromRecords() {
    let totalHoras = 0;
    let totalHorasExtras = 0;
    let totalHorasNoturnas = 0;
    let totalAdicionalExtra = 0;
    let totalAdicionalNoturno = 0;
    let subtotalBruto = 0;

    for (const [dayStr, r] of Object.entries(registros)) {
      if (!r) continue;
      const diaVals = calcDiaValores(r, valorHora);
      totalHoras += diaVals.total;
      totalHorasExtras += diaVals.horasExtras;
      totalHorasNoturnas += diaVals.horasNoturnas;
      totalAdicionalExtra += diaVals.adicionalExtra;
      totalAdicionalNoturno += diaVals.adicionalNoturno;
      subtotalBruto += diaVals.subtotal;
    }

    return {
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalHorasExtras: Math.round(totalHorasExtras * 100) / 100,
      totalHorasNoturnas: Math.round(totalHorasNoturnas * 100) / 100,
      totalAdicionalExtra: Math.round(totalAdicionalExtra * 100) / 100,
      totalAdicionalNoturno: Math.round(totalAdicionalNoturno * 100) / 100,
      subtotalBruto: Math.round(subtotalBruto * 100) / 100,
    };
  }

  function calcTotalHorasMes() {
    return calcTotalsFromRecords().totalHoras;
  }

  function calcTotalHorasFromRecords() {
    return calcTotalsFromRecords().totalHoras;
  }

  function calcSubtotalBrutoFromRecords() {
    return calcTotalsFromRecords().subtotalBruto;
  }

  // Save resumo mensal no Supabase (mantém total_horas, valor_hora e adicionais se colunas existirem)
  async function saveResumo() {
    const totals = calcTotalsFromRecords();
    const totalDesc = calcTotalDescontos();

    const basePayload = {
      usuario_id: userId,
      ano: selectedYear,
      mes: selectedMonth,
      total_horas: totals.totalHoras,
      valor_hora: valorHora,
      total_descontos: totalDesc,
    };

    const fullPayload = {
      ...basePayload,
      total_horas_extras: totals.totalHorasExtras,
      total_horas_noturnas: totals.totalHorasNoturnas,
      total_adicional_extra: totals.totalAdicionalExtra,
      total_adicional_noturno: totals.totalAdicionalNoturno,
    };

    const { data: existing } = await supabase
      .from('resumo_mensal')
      .select('id')
      .eq('usuario_id', userId)
      .eq('ano', selectedYear)
      .eq('mes', selectedMonth)
      .maybeSingle();

    try {
      if (existing) {
        const { error } = await supabase.from('resumo_mensal').update(fullPayload).eq('id', existing.id);
        if (error) {
          // Se colunas detalhadas ainda não existirem no Supabase, fallback seguro para payload base
          await supabase.from('resumo_mensal').update(basePayload).eq('id', existing.id);
        }
      } else {
        const { error } = await supabase.from('resumo_mensal').insert(fullPayload);
        if (error) {
          await supabase.from('resumo_mensal').insert(basePayload);
        }
      }
    } catch (e) {
      console.warn('Aviso ao sincronizar resumo_mensal:', e);
    }
  }

  const debouncedSaveResumo = debounce(saveResumo, 800);

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
    const totals = calcTotalsFromRecords();
    const totalDesc = calcTotalDescontos();
    const totalLiquido = Math.round((totals.subtotalBruto - totalDesc) * 100) / 100;

    const elTotalHoras = document.getElementById('calc-total-horas');
    const elHorasExtras = document.getElementById('calc-horas-extras');
    const elHorasNoturnas = document.getElementById('calc-horas-noturnas');
    const elSubtotal = document.getElementById('calc-subtotal');
    const elTotalDesc = document.getElementById('calc-total-descontos');
    const elTotalLiq = document.getElementById('calc-total-liquido');

    if (elTotalHoras) elTotalHoras.textContent = `${formatHours(totals.totalHoras)} (${decimalToHHMM(totals.totalHoras)})`;
    if (elHorasExtras) {
      elHorasExtras.textContent = `${formatHours(totals.totalHorasExtras)} (+¥${Math.round(totals.totalAdicionalExtra).toLocaleString('ja-JP')})`;
    }
    if (elHorasNoturnas) {
      elHorasNoturnas.textContent = `${formatHours(totals.totalHorasNoturnas)} (+¥${Math.round(totals.totalAdicionalNoturno).toLocaleString('ja-JP')})`;
    }
    if (elSubtotal) elSubtotal.textContent = `¥${Math.round(totals.subtotalBruto).toLocaleString('ja-JP')}`;
    if (elTotalDesc) elTotalDesc.textContent = `¥${Math.round(totalDesc).toLocaleString('ja-JP')}`;
    if (elTotalLiq) {
      elTotalLiq.textContent = `¥${Math.round(totalLiquido).toLocaleString('ja-JP')}`;
      elTotalLiq.className = 'calc-highlight ' + (totalLiquido >= 0 ? 'calc-positive' : 'calc-negative');
    }

    debouncedSaveResumo();
  }

  // Save desconto to DB + sync with despesa
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

    let descontoId;
    if (desconto.id) {
      await supabase.from('desconto_mensal').update(payload).eq('id', desconto.id);
      descontos[index] = { ...desconto, ...payload };
      descontoId = desconto.id;
    } else {
      const { data } = await supabase.from('desconto_mensal').insert(payload).select().single();
      if (data) {
        descontos[index] = data;
        descontoId = data.id;
      }
    }

    // Sync with despesa table
    if (descontoId && payload.descricao && payload.valor > 0) {
      await syncDescontoToDespesa(descontoId, payload);
    }

    updateCalculations();
  }

  // Sync desconto → despesa (create or update)
  async function syncDescontoToDespesa(descontoId, descontoPayload) {
    try {
      // Classify the desconto description into an NTA category
      const category = await classifyDesconto(descontoPayload.descricao);

      // Calculate last day of the month for the expense date
      const lastDay = new Date(descontoPayload.ano, descontoPayload.mes, 0).getDate();
      const dateStr = `${descontoPayload.ano}-${String(descontoPayload.mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const despesaPayload = {
        usuario_id: userId,
        desconto_mensal_id: descontoId,
        data_recibo: dateStr,
        descricao: descontoPayload.descricao,
        estabelecimento: 'Desconto salarial',
        valor: descontoPayload.valor,
        valor_dedutivel: descontoPayload.valor,
        categoria_code: category.code,
        categoria_nome: category.nome,
        campo_formulario: category.campo,
        classificacao_automatica: true,
        revisado_usuario: false,
        ano_fiscal: descontoPayload.ano,
        mes: descontoPayload.mes,
      };

      // Check if a despesa already exists for this desconto
      const { data: existing } = await supabase
        .from('despesa')
        .select('id')
        .eq('desconto_mensal_id', descontoId)
        .maybeSingle();

      if (existing) {
        // Update existing despesa
        await supabase.from('despesa').update(despesaPayload).eq('id', existing.id);
        console.log(`[sync] Updated despesa for desconto ${descontoId} → ${category.code} ${category.nome} (${category.method})`);
      } else {
        // Create new despesa
        await supabase.from('despesa').insert(despesaPayload);
        console.log(`[sync] Created despesa for desconto ${descontoId} → ${category.code} ${category.nome} (${category.method})`);
      }
    } catch (e) {
      console.error('[sync] Error syncing desconto to despesa:', e);
    }
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
      const obs = record?.observacao || '';

      const diaVals = calcDiaValores(record, valorHora);
      const total = diaVals.total;

      let rowClass = 'timesheet-row';
      if (dow === 0) rowClass += ' row-weekend is-sunday';
      else if (dow === 6) rowClass += ' row-weekend is-saturday';
      if (diaVals.horasExtras > 0) rowClass += ' row-overtime';

      const hasData = entrada || saida || total > 0 || obs || record?.tipo_calculo === 'fixo';

      const txtEntrada = entrada || '-';
      const txtSaida = saida || '-';
      let txtIntervalo = '-';
      if (intervalo) {
        const [ih, im] = intervalo.split(':');
        txtIntervalo = `${parseInt(ih) * 60 + parseInt(im)} 分`;
      }
      let txtTotal = total > 0 ? `${formatHours(total)}` : '-';
      if (obs) {
        txtTotal += ' *';
      }

      // Horas extras formatadas
      const txtExtra = diaVals.horasExtras > 0
        ? `<span class="badge-extra" title="残業: ${formatHours(diaVals.horasExtras)} (+25%)">${formatHours(diaVals.horasExtras)}</span>`
        : '<span style="color: var(--color-text-muted);">—</span>';

      // Horas noturnas formatadas
      const txtNoturno = diaVals.horasNoturnas > 0
        ? `<span class="badge-noturno" title="深夜 (22h〜5h): ${formatHours(diaVals.horasNoturnas)} (+25%)">${formatHours(diaVals.horasNoturnas)}</span>`
        : '<span style="color: var(--color-text-muted);">—</span>';

      const txtSubtotal = (hasData && diaVals.subtotal > 0)
        ? `¥${Math.round(diaVals.subtotal).toLocaleString('ja-JP')}`
        : '-';

      let actionHtml = '';
      if (hasData) {
        actionHtml = `
          <div class="row-actions" style="display: flex; gap: 0.35rem; justify-content: center; align-items: center;">
            <button class="btn-edit-row" data-day="${d}" title="Editar" style="background: none; border: none; cursor: pointer; color: #3b82f6; display: flex; align-items: center; padding: 2px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-delete-row" data-day="${d}" title="Excluir" style="background: none; border: none; cursor: pointer; color: #ef4444; display: flex; align-items: center; padding: 2px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        `;
      } else {
        actionHtml = `
          <div class="row-actions" style="display: flex; justify-content: center; align-items: center;">
            <span style="color: #3b82f6; font-size: 1.15rem; font-weight: bold; line-height: 1;">+</span>
          </div>
        `;
      }

      const diaNome = DIAS_SEMANA_JA ? DIAS_SEMANA_JA[dow] : DIAS_SEMANA[dow];

      rows += `
        <tr id="row-${d}" class="${rowClass}">
          <td class="col-date" style="line-height: 1.2;">
            ${d}日<br><span style="font-size: 0.82em; color: var(--color-text-muted);">(${diaNome})</span>
          </td>
          <td class="col-time" style="text-align: center;">${txtEntrada}</td>
          <td class="col-time" style="text-align: center;">${txtSaida}</td>
          <td class="col-time" style="text-align: center;">${txtIntervalo}</td>
          <td class="col-total" style="text-align: center;">${txtTotal}</td>
          <td class="col-extra" style="text-align: center;">${txtExtra}</td>
          <td class="col-noturno" style="text-align: center;">${txtNoturno}</td>
          <td class="col-subtotal" style="text-align: center; font-weight: 600;">${txtSubtotal}</td>
          <td class="col-acoes" style="text-align: center; width: 70px;">${actionHtml}</td>
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

            <div class="period-selectors card">
              <div class="selectors-wrapper">
                <div class="selector-group">
                  <label for="sel-year">Ano</label>
                  <select id="sel-year">${yearOptions.join('')}</select>
                </div>
                <div class="selector-group">
                  <label for="sel-month">Mês</label>
                  <select id="sel-month">${monthOptions.join('')}</select>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <div class="period-label">${MESES_NOME[selectedMonth - 1]} ${selectedYear}</div>
                <button type="button" class="btn btn-outline" id="btn-export-pdf-mes" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 500; font-size: 0.85rem; padding: 0.45rem 0.85rem;" title="Exportar folha de ponto em PDF deste mês">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <span>Exportar PDF</span>
                </button>
              </div>
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
                    <th class="col-extra" style="text-align: center;" title="残業時間 (8h超, +25%)">Extra (+25%)</th>
                    <th class="col-noturno" style="text-align: center;" title="深夜労働 (22h〜5h, +25%)">Noturno (+25%)</th>
                    <th class="col-subtotal" style="text-align: center;">¥ Subtotal</th>
                    <th class="col-acoes" style="text-align: center;">Ações</th>
                  </tr>
                </thead>
                <tbody id="timesheet-body">
                  ${buildTimesheetRows()}
                </tbody>
              </table>
            </div>

            <!-- Modal de Lançamento de Horas -->
            <div id="modal-horas" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(2px);">
              <div class="modal-content" style="width: 100%; max-width: 440px; padding: 1.5rem; background: #1e1e1e; border-radius: 1rem; color: #f3f4f6; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                  <h2 id="modal-horas-title" style="font-size: 1.15rem; font-weight: 600; margin: 0;">YYYY-MM-DD の記録</h2>
                  <span style="font-size: 0.72rem; background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 0.2rem 0.6rem; border-radius: 9999px; border: 1px solid rgba(59, 130, 246, 0.3);">労働基準法 +25%</span>
                </div>
                <input type="hidden" id="modal-day" value="" />

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-entrada" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">入室時刻 (Entrada)</label>
                    <input type="time" id="modal-entrada" class="input-time" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-saida" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">退室時刻 (Saída)</label>
                    <input type="time" id="modal-saida" class="input-time" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-intervalo" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">休憩時間 (Intervalo min)</label>
                    <input type="number" id="modal-intervalo" placeholder="60" min="0" step="5" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-total-preview" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">実働時間 (Total Líquido)</label>
                    <input type="text" id="modal-total-preview" readonly style="background: #252525; color: #60a5fa; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%; font-weight: 600;" value="0.0h" />
                  </div>
                </div>

                <!-- Adicionais Japão: Horas Extras (>8h) e Adicional Noturno (22h-5h) com +25% -->
                <div style="background: rgba(255,255,255,0.03); border: 1px solid #374151; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.85rem;">
                  <div style="font-size: 0.75rem; font-weight: 600; color: #d1d5db; margin-bottom: 0.5rem; display: flex; justify-content: space-between;">
                    <span>割増賃金 (Adicionais Japão +25%)</span>
                    <span style="color: #9ca3af; font-size: 0.7rem;">自動計算・手動調整可</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group" style="gap: 0.25rem;">
                      <label for="modal-extra" style="color: #fbbf24; font-size: 0.72rem; font-weight: 500;">残業 (>8h) (+25%)</label>
                      <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <input type="number" id="modal-extra" step="0.01" min="0" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.45rem; width: 100%;" value="0" />
                        <span style="font-size: 0.75rem; color: #9ca3af;">h</span>
                      </div>
                    </div>
                    <div class="form-group" style="gap: 0.25rem;">
                      <label for="modal-adicional-noturno" style="color: #a78bfa; font-size: 0.72rem; font-weight: 500;">深夜 (22h〜5h) (+25%)</label>
                      <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <input type="number" id="modal-adicional-noturno" step="0.01" min="0" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.45rem; width: 100%;" value="0" />
                        <span style="font-size: 0.75rem; color: #9ca3af;">h</span>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" id="modal-adicional-fim-semana" value="0" />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.85rem;">
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-tipo-calculo" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">Tipo de Cálculo</label>
                    <select id="modal-tipo-calculo" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;">
                      <option value="por_hora">Por hora (時給)</option>
                      <option value="fixo">Fixo por dia (日給)</option>
                    </select>
                  </div>
                  <div class="form-group" style="gap: 0.25rem;">
                    <label for="modal-valor-diario" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">Valor (¥)</label>
                    <input type="number" id="modal-valor-diario" step="1" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                  </div>
                </div>

                <div class="form-group" style="margin-bottom: 0.85rem; gap: 0.25rem;">
                  <label for="modal-obs" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">メモ (Observação)</label>
                  <input type="text" id="modal-obs" placeholder="任意のメモ" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" />
                </div>

                <!-- Preview de Subtotal diário com breakdown claro -->
                <div id="modal-breakdown" style="background: #111827; border: 1px solid #1f2937; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 1.25rem; font-size: 0.8rem;">
                  <div style="display: flex; justify-content: space-between; color: #9ca3af; margin-bottom: 0.25rem;">
                    <span>Base:</span>
                    <span id="modal-prev-base">¥0</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #fbbf24; margin-bottom: 0.25rem;">
                    <span>Horas Extras (+25%):</span>
                    <span id="modal-prev-extra">+¥0</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #a78bfa; margin-bottom: 0.25rem;">
                    <span>Adic. Noturno 22h-5h (+25%):</span>
                    <span id="modal-prev-noturno">+¥0</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #fff; font-weight: 600; padding-top: 0.4rem; border-top: 1px solid #374151; font-size: 0.9rem;">
                    <span>Total estimado do dia:</span>
                    <span id="modal-prev-subtotal" style="color: #34d399;">¥0</span>
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
                  <button type="button" id="modal-btn-cancelar" style="background: transparent; border: 1px solid #404040; color: #fff; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">キャンセル (Cancelar)</button>
                  <button type="button" id="modal-btn-salvar" style="background: #2563eb; border: none; color: #fff; padding: 0.5rem 1.25rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer;">保存 (Salvar)</button>
                </div>
              </div>
            </div>

            <div class="calc-footer card">
              <div class="calc-grid">
                <div class="calc-item">
                  <span class="calc-label">Total horas</span>
                  <span class="calc-value" id="calc-total-horas">${formatHours(calcTotalsFromRecords().totalHoras)} (${decimalToHHMM(calcTotalsFromRecords().totalHoras)})</span>
                </div>
                <div class="calc-item">
                  <span class="calc-label" style="color: #d97706;">Horas Extras (+25%)</span>
                  <span class="calc-value" id="calc-horas-extras" style="color: #d97706; font-size: var(--font-size-md);">0h</span>
                </div>
                <div class="calc-item">
                  <span class="calc-label" style="color: #7c3aed;">Adic. Noturno (+25%)</span>
                  <span class="calc-value" id="calc-horas-noturnas" style="color: #7c3aed; font-size: var(--font-size-md);">0h</span>
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
                  <span class="calc-value calc-bold" id="calc-subtotal">¥${Math.round(calcTotalsFromRecords().subtotalBruto).toLocaleString('ja-JP')}</span>
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

    document.getElementById('btn-export-pdf-mes')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-export-pdf-mes');
      if (btn) btn.disabled = true;

      // Abre janela imediatamente no evento de clique para prevenir bloqueador de popups
      let printWin = null;
      try {
        printWin = window.open('about:blank', '_blank');
        if (printWin) {
          printWin.document.write('<!DOCTYPE html><html><head><title>Gerando PDF...</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;"><div style="text-align:center;"><div style="font-size:24px;margin-bottom:12px;">⏳</div><div style="font-size:16px;font-weight:600;margin-bottom:6px;">Gerando Folha de Ponto / 勤務実績表...</div><div style="font-size:13px;color:#94a3b8;">Aguarde um instante enquanto compilamos os dados.</div></div></body></html>');
          printWin.document.close();
        }
      } catch (e) { }

      try {
        await exportarMesPDF({
          ano: selectedYear,
          mes: selectedMonth,
          userId,
          perfil,
          registros,
          descontos,
          valorHora,
          targetWindow: printWin
        });
      } catch (err) {
        if (printWin && !printWin.closed) printWin.close();
        console.error('Erro ao exportar PDF:', err);
        alert('Erro ao exportar PDF: ' + (err.message || err));
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    // Timesheet input events (delegation)




    const modal = document.getElementById('modal-horas');
    const mTitle = document.getElementById('modal-horas-title');
    const mDay = document.getElementById('modal-day');
    const mEnt = document.getElementById('modal-entrada');
    const mSai = document.getElementById('modal-saida');
    const mInt = document.getElementById('modal-intervalo');
    const mTotalPreview = document.getElementById('modal-total-preview');
    const mExtra = document.getElementById('modal-extra');
    const mAdicionalNoturno = document.getElementById('modal-adicional-noturno');
    const mAdicionalFimSemana = document.getElementById('modal-adicional-fim-semana');
    const mObs = document.getElementById('modal-obs');
    const mTipoCalculo = document.getElementById('modal-tipo-calculo');
    const mValorDiario = document.getElementById('modal-valor-diario');

    // Elementos de preview do breakdown do modal
    const mPrevBase = document.getElementById('modal-prev-base');
    const mPrevExtra = document.getElementById('modal-prev-extra');
    const mPrevNoturno = document.getElementById('modal-prev-noturno');
    const mPrevSubtotal = document.getElementById('modal-prev-subtotal');

    function updateModalCalculations(autoUpdateHours = true) {
      const e = mEnt.value;
      const s = mSai.value;
      const intMin = parseInt(mInt.value) || 0;
      const intStr = intMin > 0 ? `0${Math.floor(intMin / 60)}:` + String(intMin % 60).padStart(2, '0') : '';
      const total = (e && s) ? calcTotal(e, s, intStr) : 0;

      if (mTotalPreview) {
        mTotalPreview.value = total > 0 ? formatHours(total) : '0h';
      }

      if (autoUpdateHours) {
        if (e && s) {
          const autoExtra = calcHorasExtras(total);
          const autoNoturno = calcHorasNoturnas(e, s, intMin);
          mExtra.value = autoExtra > 0 ? formatHoursVal(autoExtra) : '0';
          mAdicionalNoturno.value = autoNoturno > 0 ? formatHoursVal(autoNoturno) : '0';
        } else {
          mExtra.value = '0';
          mAdicionalNoturno.value = '0';
        }
      }

      // Atualiza o breakdown em tempo real
      const tipoCalculo = mTipoCalculo.value;
      const valInput = parseFloat(mValorDiario.value) || 0;
      const hExtras = parseFloat(mExtra.value) || 0;
      const hNoturnas = parseFloat(mAdicionalNoturno.value) || 0;

      let taxaHoraria = valorHora;
      let baseValor = 0;

      if (tipoCalculo === 'fixo') {
        baseValor = valInput;
        taxaHoraria = valorHora > 0 ? valorHora : (baseValor > 0 ? Math.round((baseValor / 8) * 100) / 100 : 0);
      } else {
        taxaHoraria = valInput > 0 ? valInput : valorHora;
        baseValor = Math.round(total * taxaHoraria * 100) / 100;
      }

      // Adicionais de 25% da legislação japonesa
      const valorExtra = Math.round(hExtras * taxaHoraria * 0.25 * 100) / 100;
      const valorNoturno = Math.round(hNoturnas * taxaHoraria * 0.25 * 100) / 100;
      const totalEstimado = Math.round((baseValor + valorExtra + valorNoturno) * 100) / 100;

      if (mPrevBase) mPrevBase.textContent = `¥${Math.round(baseValor).toLocaleString('ja-JP')}`;
      if (mPrevExtra) mPrevExtra.textContent = `+¥${Math.round(valorExtra).toLocaleString('ja-JP')} (${formatHours(hExtras)} × 25%)`;
      if (mPrevNoturno) mPrevNoturno.textContent = `+¥${Math.round(valorNoturno).toLocaleString('ja-JP')} (${formatHours(hNoturnas)} × 25%)`;
      if (mPrevSubtotal) mPrevSubtotal.textContent = `¥${Math.round(totalEstimado).toLocaleString('ja-JP')}`;
    }

    // Eventos para recalcular o modal dinamicamente
    mEnt.addEventListener('input', () => updateModalCalculations(true));
    mSai.addEventListener('input', () => updateModalCalculations(true));
    mInt.addEventListener('input', () => updateModalCalculations(true));
    mTipoCalculo.addEventListener('change', () => updateModalCalculations(false));
    mValorDiario.addEventListener('input', () => updateModalCalculations(false));
    mExtra.addEventListener('input', () => updateModalCalculations(false));
    mAdicionalNoturno.addEventListener('input', () => updateModalCalculations(false));

    function openModalForDay(day) {
      const record = registros[day];
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      mTitle.textContent = `${dateStr} の記録`;
      mDay.value = day;

      if (record) {
        // Registro existente
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
        mValorDiario.value = record.valor_diario ?? (record.tipo_calculo === 'fixo' ? '' : valorHora);

        const hasSavedExtras = record.horas_extras !== null && record.horas_extras !== undefined;
        const hasSavedNoturno = record.adicional_noturno !== null && record.adicional_noturno !== undefined;

        if (hasSavedExtras) {
          mExtra.value = record.horas_extras;
        }
        if (hasSavedNoturno) {
          mAdicionalNoturno.value = record.adicional_noturno;
        }

        if (mAdicionalFimSemana) {
          mAdicionalFimSemana.value = record.adicional_fim_de_semana || 0;
        }

        // Se o registro não possuía extras/noturno gravados, calcula automaticamente
        if (!hasSavedExtras && !hasSavedNoturno) {
          updateModalCalculations(true);
        } else {
          updateModalCalculations(false);
        }
      } else {
        // Valores padrão para novo registro
        mEnt.value = '08:00';
        mSai.value = '17:00';
        mInt.value = '60';
        mObs.value = '';
        mTipoCalculo.value = 'por_hora';
        mValorDiario.value = valorHora;
        if (mAdicionalFimSemana) mAdicionalFimSemana.value = 0;
        updateModalCalculations(true);
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
            adicional_noturno: parseFloat(mAdicionalNoturno.value) || 0,
            adicional_fim_de_semana: parseFloat(mAdicionalFimSemana?.value) || 0,
          };

          if (row?.id) {
            const { error: updateErr } = await supabase.from('registro_diario').update(payload).eq('id', row.id);
            if (updateErr) {
              console.warn('Erro ao atualizar com colunas de adicionais, tentando payload básico:', updateErr.message);
              const basicPayload = {
                usuario_id: userId,
                data: dateStr,
                hora_entrada: entrada || null,
                hora_saida: saida || null,
                intervalo: intStr,
                observacao: obs || null,
                tipo_calculo: tipoCalculo,
                valor_diario: valorDiario,
              };
              await supabase.from('registro_diario').update(basicPayload).eq('id', row.id);
            }
            registros[day] = { ...row, ...payload };
          } else {
            let { data: newRow, error: insertErr } = await supabase.from('registro_diario').insert(payload).select().single();
            if (insertErr) {
              console.warn('Erro ao inserir com colunas de adicionais, tentando payload básico:', insertErr.message);
              const basicPayload = {
                usuario_id: userId,
                data: dateStr,
                hora_entrada: entrada || null,
                hora_saida: saida || null,
                intervalo: intStr,
                observacao: obs || null,
                tipo_calculo: tipoCalculo,
                valor_diario: valorDiario,
              };
              const resBasic = await supabase.from('registro_diario').insert(basicPayload).select().single();
              newRow = resBasic.data;
            }
            if (newRow) {
              registros[day] = { ...newRow, ...payload };
            } else {
              registros[day] = payload;
            }
          }
        }

        modal.style.display = 'none';
        mDay.value = '';
        document.getElementById('timesheet-body').innerHTML = buildTimesheetRows();
        updateCalculations();
      } finally {
        btn.disabled = false;
        btn.textContent = '保存 (Salvar)';
      }
    });

    document.getElementById('timesheet-body').addEventListener('click', async (e) => {
      // Exclusão rápida de linha
      const btnDel = e.target.closest('.btn-delete-row');
      if (btnDel) {
        e.stopPropagation();
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
        return;
      }

      // Ao clicar na linha ou no botão de editar, abre o modal de lançamento
      const row = e.target.closest('tr.timesheet-row');
      if (row) {
        const rowId = row.getAttribute('id');
        if (rowId) {
          const day = parseInt(rowId.replace('row-', ''));
          openModalForDay(day);
        }
      }
    });

    // Evento de alteração do valor por hora padrão
    document.getElementById('calc-valor-hora').addEventListener('input', (e) => {
      valorHora = parseFloat(e.target.value) || 0;
      document.getElementById('timesheet-body').innerHTML = buildTimesheetRows();
      updateCalculations();
    });

    // Descontos events
    document.getElementById('btn-add-desconto').addEventListener('click', addDesconto);

    // Render descontos
    renderDescontos();
    updateCalculations();
  }

  await renderPage();
}
