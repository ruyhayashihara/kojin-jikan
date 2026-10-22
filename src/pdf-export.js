import { supabase } from './supabaseClient.js';

const MESES_NOME = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA_JP = ['日', '月', '火', '水', '木', '金', '土'];
const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

function decimalToHHMM(dec) {
  if (!dec || dec <= 0) return '0h00';
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${h}h${String(m).padStart(2, '0')}`;
}

function formatHours(dec) {
  if (dec === null || dec === undefined || isNaN(dec) || dec <= 0) return '0h';
  const num = parseFloat(Number(dec).toFixed(2));
  return `${num}h`;
}

function calcTotalHoras(entrada, saida, intervalo) {
  if (!entrada || !saida) return 0;
  let start = timeToDecimal(entrada);
  let end = timeToDecimal(saida);
  if (end < start) end += 24;
  let diff = end - start;
  if (intervalo) diff -= timeToDecimal(intervalo);
  return diff > 0 ? Math.round(diff * 100) / 100 : 0;
}

function calcHorasExtras(total) {
  if (!total || total <= 8) return 0;
  return Math.round((total - 8) * 100) / 100;
}

function calcHorasNoturnas(entrada, saida, intervaloMinutos = 0) {
  if (!entrada || !saida) return 0;
  let start = timeToDecimal(entrada);
  let end = timeToDecimal(saida);
  if (end < start) end += 24;

  const o1 = Math.max(0, Math.min(end, 5) - Math.max(start, 0));
  const o2 = Math.max(0, Math.min(end, 24) - Math.max(start, 22));
  const o3 = Math.max(0, Math.min(end, 29) - Math.max(start, 24));
  const grossNight = o1 + o2 + o3;
  if (grossNight <= 0) return 0;

  const totalGross = end - start;
  const breakHours = (intervaloMinutos || 0) / 60;
  const dayGross = totalGross - grossNight;

  let nightDeduction = 0;
  if (breakHours > dayGross) {
    nightDeduction = breakHours - dayGross;
  }
  const netNight = Math.max(0, grossNight - nightDeduction);
  return Math.round(netNight * 100) / 100;
}

/**
 * Exporta folha de ponto e resumo mensal em formato PDF profissional
 */
export async function exportarMesPDF({ ano, mes, userId = null, perfil = null, registros = null, descontos = null, valorHora = null, targetWindow = null }) {
  let finalUserId = userId;
  if (!finalUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Você precisa estar autenticado para exportar.');
      return;
    }
    finalUserId = user.id;
  }

  // 1. Carrega perfil se necessário
  let finalPerfil = perfil;
  if (!finalPerfil) {
    try {
      const { data } = await supabase.from('perfil_usuario').select('*').eq('id', finalUserId).single();
      finalPerfil = data || {};
    } catch (e) {
      finalPerfil = {};
    }
  }

  // 2. Carrega registros diários se não foram fornecidos
  let mapRegistros = {};
  if (registros && typeof registros === 'object') {
    mapRegistros = registros;
  } else {
    try {
      const { data } = await supabase
        .from('registro_diario')
        .select('*')
        .eq('usuario_id', finalUserId)
        .eq('ano', ano)
        .eq('mes', mes);
      if (data) {
        data.forEach(r => {
          const d = new Date(r.data).getDate();
          mapRegistros[d] = r;
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar registros diários:', e);
    }
  }

  // 3. Carrega descontos mensais se não foram fornecidos
  let listDescontos = [];
  if (Array.isArray(descontos)) {
    listDescontos = descontos;
  } else {
    try {
      const { data } = await supabase
        .from('desconto_mensal')
        .select('*')
        .eq('usuario_id', finalUserId)
        .eq('ano', ano)
        .eq('mes', mes);
      listDescontos = data || [];
    } catch (e) {
      console.warn('Erro ao carregar descontos:', e);
    }
  }

  // 4. Carrega resumo mensal gravado se houver
  let resumoGravado = null;
  try {
    const { data } = await supabase
      .from('resumo_mensal')
      .select('*')
      .eq('usuario_id', finalUserId)
      .eq('ano', ano)
      .eq('mes', mes)
      .maybeSingle();
    resumoGravado = data;
  } catch (e) { }

  const taxaPadrao = valorHora !== null && valorHora !== undefined
    ? Number(valorHora)
    : (resumoGravado?.valor_hora || finalPerfil.valor_hora_padrao || 0);

  const daysInMonth = new Date(ano, mes, 0).getDate();

  // 5. Processamento dos dias
  let totalHorasMes = 0;
  let totalHorasExtrasMes = 0;
  let totalHorasNoturnasMes = 0;
  let subtotalBrutoMes = 0;
  let diasTrabalhados = 0;

  const rowsData = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(ano, mes - 1, d);
    const dow = dateObj.getDay(); // 0 = Dom, 6 = Sáb
    const record = mapRegistros[d];

    let entrada = '';
    let saida = '';
    let intervaloStr = '';
    let intervaloMin = 0;
    let total = 0;
    let horasExtras = 0;
    let horasNoturnas = 0;
    let subtotalDia = 0;
    let obs = '';

    if (record) {
      entrada = record.hora_entrada ? record.hora_entrada.slice(0, 5) : '';
      saida = record.hora_saida ? record.hora_saida.slice(0, 5) : '';
      if (record.intervalo) {
        const [ih, im] = record.intervalo.split(':');
        intervaloMin = parseInt(ih || 0) * 60 + parseInt(im || 0);
        intervaloStr = intervaloMin > 0 ? `${intervaloMin}m` : '—';
      } else {
        intervaloStr = '—';
      }

      const intCalcStr = intervaloMin > 0 ? `0${Math.floor(intervaloMin / 60)}:` + String(intervaloMin % 60).padStart(2, '0') : '';
      total = (entrada && saida) ? calcTotalHoras(entrada, saida, intCalcStr) : (Number(record.total_horas) || 0);

      if (record.horas_extras !== null && record.horas_extras !== undefined) {
        horasExtras = parseFloat(record.horas_extras) || 0;
      } else {
        horasExtras = calcHorasExtras(total);
      }

      if (record.adicional_noturno !== null && record.adicional_noturno !== undefined) {
        horasNoturnas = parseFloat(record.adicional_noturno) || 0;
      } else {
        horasNoturnas = calcHorasNoturnas(entrada, saida, intervaloMin);
      }

      const tipoCalc = record.tipo_calculo || 'por_hora';
      const valDiario = parseFloat(record.valor_diario) || 0;
      let taxa = taxaPadrao;

      if (tipoCalc === 'fixo') {
        subtotalDia = valDiario;
        taxa = taxaPadrao > 0 ? taxaPadrao : (subtotalDia > 0 ? subtotalDia / 8 : 0);
      } else {
        taxa = valDiario > 0 ? valDiario : taxaPadrao;
        subtotalDia = Math.round(total * taxa * 100) / 100;
      }

      // Adicionais de 25% (Legislação Japão)
      const valExtra = Math.round(horasExtras * taxa * 0.25 * 100) / 100;
      const valNoturno = Math.round(horasNoturnas * taxa * 0.25 * 100) / 100;
      subtotalDia = Math.round((subtotalDia + valExtra + valNoturno) * 100) / 100;

      obs = record.observacao || '';

      if (total > 0 || subtotalDia > 0) {
        diasTrabalhados++;
        totalHorasMes += total;
        totalHorasExtrasMes += horasExtras;
        totalHorasNoturnasMes += horasNoturnas;
        subtotalBrutoMes += subtotalDia;
      }
    }

    rowsData.push({
      dia: d,
      dow,
      dowJp: DIAS_SEMANA_JP[dow],
      dowPt: DIAS_SEMANA_PT[dow],
      isWeekend: dow === 0 || dow === 6,
      isSunday: dow === 0,
      isSaturday: dow === 6,
      entrada: entrada || '—',
      saida: saida || '—',
      intervalo: intervaloStr || '—',
      total,
      horasExtras,
      horasNoturnas,
      subtotalDia,
      obs
    });
  }

  // 6. Cálculo de descontos
  let totalDescontos = 0;
  const descontosDetalhados = listDescontos.map(d => {
    let valorFinal = 0;
    if (d.tipo === 'Por dia trabalhado') {
      valorFinal = (d.valor || 0) * diasTrabalhados;
    } else {
      valorFinal = d.valor || 0;
    }
    totalDescontos += valorFinal;
    return {
      descricao: d.descricao || 'Desconto',
      tipo: d.tipo,
      valor: valorFinal
    };
  });

  const totalLiquido = Math.round((subtotalBrutoMes - totalDescontos) * 100) / 100;
  const adicionalExtraYen = Math.round(totalHorasExtrasMes * taxaPadrao * 0.25);
  const adicionalNoturnoYen = Math.round(totalHorasNoturnasMes * taxaPadrao * 0.25);

  const nomeUsuario = finalPerfil.nome || 'Prestador de Serviços';
  const myNumber = finalPerfil.my_number ? `My Number: ***-****-${finalPerfil.my_number.slice(-4)}` : '';
  const numInvoice = finalPerfil.numero_invoice ? `Invoice (T): ${finalPerfil.numero_invoice}` : '';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  // 7. Montagem do HTML para impressão / PDF
  const rowsHtml = rowsData.map(r => {
    let dayClass = '';
    let dayColor = '#334155';
    if (r.isSunday) { dayClass = 'day-sunday'; dayColor = '#dc2626'; }
    else if (r.isSaturday) { dayClass = 'day-saturday'; dayColor = '#2563eb'; }

    return `
      <tr class="${r.total > 0 ? 'row-worked' : 'row-empty'} ${dayClass}">
        <td class="col-center" style="font-weight: 600; color: ${dayColor};">${r.dia} (${r.dowJp})</td>
        <td class="col-center">${r.entrada}</td>
        <td class="col-center">${r.saida}</td>
        <td class="col-center">${r.intervalo}</td>
        <td class="col-center" style="font-weight: 600;">${r.total > 0 ? formatHours(r.total) : '—'}</td>
        <td class="col-center col-extra">${r.horasExtras > 0 ? `+${formatHours(r.horasExtras)}` : '—'}</td>
        <td class="col-center col-noturno">${r.horasNoturnas > 0 ? `+${formatHours(r.horasNoturnas)}` : '—'}</td>
        <td class="col-right" style="font-weight: 600;">${r.subtotalDia > 0 ? `¥${Math.round(r.subtotalDia).toLocaleString('ja-JP')}` : '—'}</td>
        <td class="col-obs">${r.obs ? escapeHtml(r.obs) : ''}</td>
      </tr>
    `;
  }).join('');

  const descontosHtml = descontosDetalhados.length > 0 ? `
    <div class="section-block">
      <div class="section-title">控除明細 (Descontos do Mês)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Descrição (項目)</th>
            <th class="col-center">Tipo</th>
            <th class="col-right">Valor (控除額)</th>
          </tr>
        </thead>
        <tbody>
          ${descontosDetalhados.map(d => `
            <tr>
              <td>${escapeHtml(d.descricao)}</td>
              <td class="col-center">${d.tipo}</td>
              <td class="col-right" style="color: #b91c1c; font-weight: 600;">-¥${Math.round(d.valor).toLocaleString('ja-JP')}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="2"><strong>Total de Descontos (控除額合計)</strong></td>
            <td class="col-right" style="color: #b91c1c;"><strong>-¥${Math.round(totalDescontos).toLocaleString('ja-JP')}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>勤務実績表_${ano}_${String(mes).padStart(2, '0')}_${nomeUsuario}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 8mm 10mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;
      color: #0f172a;
      background: #e2e8f0;
      font-size: 8.5pt;
      line-height: 1.3;
      -webkit-font-smoothing: antialiased;
    }

    .no-print {
      position: sticky;
      top: 0;
      background: #1e293b;
      color: #fff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      z-index: 9999;
    }
    .no-print-btn {
      background: #4f46e5;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .no-print-btn:hover { background: #4338ca; }
    .no-print-btn-secondary {
      background: #475569;
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .report-page {
      width: 210mm;
      box-sizing: border-box;
      margin: 16px auto;
      padding: 8mm 10mm;
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      border-radius: 2px;
    }

    /* Cabeçalho */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .header-table td {
      vertical-align: top;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #1e1b4b;
      line-height: 1.2;
      margin-bottom: 2px;
    }
    .doc-subtitle {
      font-size: 8pt;
      color: #64748b;
      font-weight: 500;
    }
    .meta-box {
      text-align: right;
      font-size: 8pt;
      color: #475569;
      line-height: 1.35;
    }
    .meta-box strong { color: #0f172a; font-size: 8.5pt; }

    /* Cards de Resumo */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      margin-bottom: 6px;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 5px 8px;
      background: #f8fafc;
    }
    .summary-card.highlight {
      background: #eef2ff;
      border-color: #818cf8;
    }
    .summary-card.accent {
      background: #ecfdf5;
      border-color: #34d399;
    }
    .sc-label {
      font-size: 6.8pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .sc-val {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .sc-val.accent { color: #047857; }
    .sc-sub {
      font-size: 6.8pt;
      color: #64748b;
      margin-top: 1px;
    }

    /* Legislação e avisos */
    .law-badge {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 7.2pt;
      color: #92400e;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      line-height: 1.25;
    }

    /* Tabela de Horas */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 8pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #cbd5e1;
      padding: 2.2px 3.5px;
      line-height: 1.2;
    }
    .data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: center;
      font-size: 7.5pt;
    }
    .col-center { text-align: center; }
    .col-right { text-align: right; }
    .col-obs { font-size: 7pt; color: #475569; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .col-extra { color: #b45309; }
    .col-noturno { color: #6d28d9; }

    .day-sunday { background: #fef2f2; }
    .day-saturday { background: #eff6ff; }
    .row-worked { font-weight: 500; }
    .row-empty { color: #94a3b8; }

    .total-row {
      background: #e2e8f0;
      font-weight: 700;
      font-size: 8.2pt;
    }

    .section-block {
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 7.5pt;
      font-weight: 700;
      color: #334155;
      margin-bottom: 2px;
    }

    /* Carimbos / Assinaturas */
    .stamp-table {
      width: 100%;
      margin-top: 6px;
      border-collapse: collapse;
    }
    .stamp-table td {
      border: 1px solid #cbd5e1;
      vertical-align: top;
      padding: 4px 6px;
      width: 50%;
    }
    .stamp-title {
      font-size: 7.5pt;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .stamp-sub {
      font-size: 7pt;
      color: #94a3b8;
      text-align: right;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 10mm 8mm 10mm;
      }
      .no-print { display: none !important; }
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
      }
      .report-page {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-size: 8pt;
      }
      tr { page-break-inside: avoid; }
      .stamp-table { page-break-inside: avoid; }
      .section-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <div style="font-size: 13px;">
      📄 <strong>Folha de Ponto / 勤務実績表:</strong> ${MESES_NOME[mes - 1]} ${ano} — ${escapeHtml(nomeUsuario)}
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="no-print-btn" onclick="window.print();">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Salvar como PDF / Imprimir
      </button>
      <button class="no-print-btn-secondary" onclick="window.close();">✕ Fechar</button>
    </div>
  </div>

  <div class="report-page">
    <table class="header-table">
      <tr>
        <td>
          <div class="doc-title">勤務実績表 (出勤簿)</div>
          <div class="doc-subtitle">Relatório Mensal de Horas Trabalhadas & Pagamento — マイ個人</div>
        </td>
        <td class="meta-box">
          <div><strong>対象期間 (Período):</strong> ${ano}年 ${mes}月 (${MESES_NOME[mes - 1]})</div>
          <div><strong>氏名 (Nome):</strong> ${escapeHtml(nomeUsuario)}</div>
          ${taxaPadrao > 0 ? `<div><strong>基準時給 (Taxa Base):</strong> ¥${taxaPadrao.toLocaleString('ja-JP')}/h</div>` : ''}
          ${numInvoice ? `<div>${escapeHtml(numInvoice)}</div>` : ''}
          ${myNumber ? `<div>${escapeHtml(myNumber)}</div>` : ''}
          <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 2px;">発行日 (Emissão): ${dataHoje}</div>
        </td>
      </tr>
    </table>

    <div class="law-badge">
      <span>⚖️ <strong>労働基準法準拠:</strong> 法定労働時間 8h/日 (残業手当 +25%) ｜ 深夜労働時間帯 22:00〜05:00 (深夜割増 +25%)</span>
      <span>${diasTrabalhados} 日出勤 (Dias Trabalhados)</span>
    </div>

    <!-- Cards de Resumo -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="sc-label">総実働時間 (Total Horas)</div>
        <div class="sc-val">${formatHours(totalHorasMes)}</div>
        <div class="sc-sub">${decimalToHHMM(totalHorasMes)} / ${diasTrabalhados} dias</div>
      </div>
      <div class="summary-card">
        <div class="sc-label">割増時間 (Extras & Noturno)</div>
        <div class="sc-val" style="font-size: 11pt;">
          <span style="color:#b45309;">${formatHours(totalHorasExtrasMes)} Ex</span> /
          <span style="color:#6d28d9;">${formatHours(totalHorasNoturnasMes)} Not</span>
        </div>
        <div class="sc-sub">+¥${(adicionalExtraYen + adicionalNoturnoYen).toLocaleString('ja-JP')} (+25%)</div>
      </div>
      <div class="summary-card highlight">
        <div class="sc-label">総支給額 (Subtotal Bruto)</div>
        <div class="sc-val">¥${Math.round(subtotalBrutoMes).toLocaleString('ja-JP')}</div>
        <div class="sc-sub">Base + Adicionais Legais</div>
      </div>
      <div class="summary-card accent">
        <div class="sc-label">差引支給額 (Total Líquido)</div>
        <div class="sc-val accent">¥${Math.round(totalLiquido).toLocaleString('ja-JP')}</div>
        <div class="sc-sub">Após descontos de ¥${Math.round(totalDescontos).toLocaleString('ja-JP')}</div>
      </div>
    </div>

    <!-- Tabela Diária -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 48px;">日付 (Dia)</th>
          <th style="width: 58px;">出勤 (Entrada)</th>
          <th style="width: 58px;">退勤 (Saída)</th>
          <th style="width: 45px;">休憩 (Int.)</th>
          <th style="width: 55px;">実働 (Horas)</th>
          <th style="width: 55px;">残業 (+25%)</th>
          <th style="width: 55px;">深夜 (+25%)</th>
          <th style="width: 75px;">日当 (Subtotal)</th>
          <th>備考 (Observações)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr class="total-row">
          <td colspan="4" class="col-center"><strong>合計 (TOTAIS)</strong></td>
          <td class="col-center"><strong>${formatHours(totalHorasMes)}</strong></td>
          <td class="col-center col-extra"><strong>${formatHours(totalHorasExtrasMes)}</strong></td>
          <td class="col-center col-noturno"><strong>${formatHours(totalHorasNoturnasMes)}</strong></td>
          <td class="col-right"><strong>¥${Math.round(subtotalBrutoMes).toLocaleString('ja-JP')}</strong></td>
          <td class="col-center" style="font-size: 7.5pt;">${diasTrabalhados} dias trabalhados</td>
        </tr>
      </tbody>
    </table>

    ${descontosHtml}

    <!-- Assinaturas e Carimbos -->
    <table class="stamp-table">
      <tr>
        <td>
          <div class="stamp-title">本人確認 (Assinatura do Prestador / Trabalhador)</div>
          <div class="stamp-sub">署名又は捺印 (Assinatura / Carimbo)</div>
        </td>
        <td>
          <div class="stamp-title">受領・承認印 (Aprovação / Visto da Empresa ou Cliente)</div>
          <div class="stamp-sub">確認日: _____ 年 _____ 月 _____ 日</div>
        </td>
      </tr>
    </table>
  </div>

  <script>
    // Dispara a impressão automaticamente ao carregar a página
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  // 8. Abre uma nova aba e injeta o documento gerado de forma resiliente
  let printWindow = targetWindow;
  if (!printWindow || printWindow.closed) {
    try {
      printWindow = window.open('', '_blank');
    } catch (e) { }
  }

  if (printWindow && !printWindow.closed) {
    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      return;
    } catch (e) { }
  }

  // Fallback 1: Blob URL (evita restrições de cross-origin ou pop-ups bloqueados em navegadores móveis/Safari)
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (win) return;
  } catch (e) { }

  // Fallback 2: Iframe invisível para disparar a janela de impressão diretamente na mesma aba
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(html);
  iframe.contentWindow.document.close();
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 60000);
  }, 400);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
