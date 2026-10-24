/**
 * Gerador de PDF / Impressão de Currículo Japonês Padrão JIS (履歴書)
 * 2 Páginas A4 rigorosamente calibradas de acordo com as especificações oficiais
 */
import { escapeHtml } from './security.js';

export function gerarHTMLRirekisho(dados) {
  const maxLinhasPagina1 = 15;
  const maxLinhasPagina2Topo = 7;
  const maxLinhasPagina2Licencas = 7;

  // Monta as linhas de 学歴・職歴 para a Página 1
  const linhasHistoricoP1 = [];
  linhasHistoricoP1.push({ ano: '', mes: '', texto: '学　歴', isCenter: true });

  (dados.historicoEscolar || []).forEach(h => {
    linhasHistoricoP1.push({ ano: h.ano || '', mes: h.mes || '', texto: h.texto || '', isCenter: false });
  });

  linhasHistoricoP1.push({ ano: '', mes: '', texto: '', isCenter: false }); // Linha em branco separadora
  linhasHistoricoP1.push({ ano: '', mes: '', texto: '職　歴', isCenter: true });

  (dados.historicoProfissional || []).forEach(h => {
    linhasHistoricoP1.push({ ano: h.ano || '', mes: h.mes || '', texto: h.texto || '', isCenter: false });
  });

  linhasHistoricoP1.push({ ano: '', mes: '', texto: '以　上', isRight: true });

  // Preenche até 15 linhas
  while (linhasHistoricoP1.length < maxLinhasPagina1) {
    linhasHistoricoP1.push({ ano: '', mes: '', texto: '', isCenter: false });
  }

  // Monta as linhas de Licenças e Qualificações para a Página 2
  const linhasLicencasP2 = [];
  (dados.qualificacoes || []).forEach(q => {
    linhasLicencasP2.push({ ano: q.ano || '', mes: q.mes || '', texto: q.texto || '', isCenter: false });
  });
  if (linhasLicencasP2.length > 0) {
    linhasLicencasP2.push({ ano: '', mes: '', texto: '以　上', isRight: true });
  }
  while (linhasLicencasP2.length < maxLinhasPagina2Licencas) {
    linhasLicencasP2.push({ ano: '', mes: '', texto: '', isCenter: false });
  }

  // Circula Masculino ou Feminino
  const generoHTML = dados.generoMasc
    ? `<span class="circle-mark">男</span> ・ 女`
    : (dados.generoFem ? `男 ・ <span class="circle-mark">女</span>` : `男 ・ 女`);

  // Circula Cônjuge
  const conjugeHTML = dados.temConjuge
    ? `<span class="circle-mark">有</span> ・ 無`
    : `有 ・ <span class="circle-mark">無</span>`;

  // Circula Obrigação de Sustento do Cônjuge
  const obrigacaoHTML = dados.obrigacaoConjuge
    ? `<span class="circle-mark">有</span> ・ 無`
    : `有 ・ <span class="circle-mark">無</span>`;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>履歴書 (JIS規格) - ${escapeHtml(dados.nomeKanji || dados.nomeAlfabeto || 'Trabalhador')}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #e2e8f0;
      font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", "MS PGothic", "Noto Sans JP", sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
      line-height: 1.25;
      font-size: 9.5pt;
    }

    /* Barra de Navegação no topo */
    .no-print-toolbar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 99999;
      font-size: 14px;
    }
    .no-print-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(37,99,235,0.3);
    }
    .no-print-btn:hover { background: #1d4ed8; }
    .no-print-btn-secondary {
      background: #475569;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    .no-print-btn-secondary:hover { background: #334155; }

    /* Folha JIS A4 (210mm x 297mm) */
    .sheet-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 20px 0;
    }
    .rirekisho-page {
      width: 210mm;
      height: 297mm;
      padding: 12mm 14mm 10mm 14mm;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Título & Data */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 6px;
    }
    .doc-title {
      font-size: 20pt;
      font-weight: 900;
      letter-spacing: 12px;
      color: #000000;
      padding-left: 6px;
    }
    .doc-date {
      font-size: 8.5pt;
      color: #111827;
      margin-bottom: 3px;
    }

    /* Tabelas padrão JIS com borda preta sólida */
    table.jis-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      table-layout: fixed;
    }
    table.jis-table th, table.jis-table td {
      border: 1px solid #000000;
      padding: 2px 6px;
      vertical-align: middle;
      font-size: 8.5pt;
    }

    .cell-label {
      font-size: 7pt;
      color: #222;
      line-height: 1;
      margin-bottom: 2px;
    }
    .cell-sublabel {
      font-size: 6.5pt;
      color: #444;
    }

    /* Círculo para selecionar 男/女 ou 有/無 */
    .circle-mark {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 1.5px solid #000000;
      border-radius: 50%;
      text-align: center;
      line-height: 15px;
      font-weight: 700;
      margin: 0 2px;
    }

    /* Foto Oficial 3:4 */
    .photo-cell {
      width: 32mm;
      height: 42mm;
      border: 1px dashed #475569;
      text-align: center;
      vertical-align: middle;
      padding: 4px;
      background: #fafafa;
    }
    .photo-placeholder {
      font-size: 6.5pt;
      color: #555555;
      line-height: 1.3;
    }
    .photo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Colunas de Histórico */
    .col-year {
      width: 16mm;
      text-align: center;
      font-size: 8.5pt;
    }
    .col-month {
      width: 11mm;
      text-align: center;
      font-size: 8.5pt;
    }
    .col-content {
      text-align: left;
      font-size: 8.5pt;
      padding-left: 10px !important;
    }
    .row-history {
      height: 7.2mm;
    }

    /* Rodapé da Página 1 */
    .footer-note {
      font-size: 6.8pt;
      color: #333333;
      margin-top: 5px;
      line-height: 1.3;
      border-top: 0.5px solid #666;
      padding-top: 3px;
    }

    /* Página 2: Blocos Inferiores */
    .p2-bottom-grid {
      display: flex;
      width: 100%;
      border: 1.5px solid #000000;
      border-top: none;
      height: 52mm;
    }
    .p2-left-box {
      width: 65%;
      border-right: 1px solid #000000;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
    }
    .p2-right-box {
      width: 35%;
      display: flex;
      flex-direction: column;
    }
    .p2-right-row {
      border-bottom: 1px solid #000000;
      padding: 4px 6px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .p2-right-row:last-child {
      border-bottom: none;
    }

    /* Bloco de Desejos Pessoais */
    .p2-desejos-box {
      width: 100%;
      border: 1.5px solid #000000;
      border-top: none;
      height: 38mm;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
    }

    /* Impressão e quebra exata de páginas */
    @media print {
      @page {
        size: A4 portrait;
        margin: 0;
      }
      .no-print {
        display: none !important;
      }
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .sheet-container {
        padding: 0 !important;
        gap: 0 !important;
      }
      .rirekisho-page {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
        padding: 12mm 14mm 10mm 14mm !important;
      }
      .rirekisho-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>

  <!-- Barra Superior de Controle (Oculta na Impressão) -->
  <div class="no-print no-print-toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px;">📄</span>
      <div>
        <strong>履歴書 (Currículo Japonês Oficial - JIS Padrão A4)</strong>
        <div style="font-size: 11px; color: #94a3b8;">
          ${escapeHtml(dados.nomeKanji || dados.nomeAlfabeto)} ｜ ${escapeHtml(dados.tipoVisto || '')} ｜ 2 Páginas
        </div>
      </div>
    </div>
    <div style="display: flex; gap: 10px;">
      <button class="no-print-btn" onclick="window.print();">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Salvar como PDF / Imprimir (A4)
      </button>
      <button class="no-print-btn-secondary" onclick="window.close();">✕ Fechar</button>
    </div>
  </div>

  <div class="sheet-container">

    <!-- ======================================================== -->
    <!-- PÁGINA 1: DADOS PESSOAIS + HISTÓRICO ESCOLAR & PROFISSIONAL -->
    <!-- ======================================================== -->
    <div class="rirekisho-page">
      <div class="doc-header">
        <div class="doc-title">履　歴　書</div>
        <div class="doc-date">${escapeHtml(dados.dataEmissao)}</div>
      </div>

      <!-- Quadro Superior: Informações Pessoais -->
      <table class="jis-table" style="margin-bottom: -1.5px;">
        <colgroup>
          <col style="width: 18mm;">
          <col style="width: 47mm;">
          <col style="width: 47mm;">
          <col style="width: 42mm;">
          <col style="width: 28mm;">
        </colgroup>
        <tbody>
          <!-- Furigana -->
          <tr style="height: 6mm;">
            <td style="border-right: none; font-size: 7pt; color: #333;">ふりがな</td>
            <td colspan="3" style="border-left: none; font-size: 8.5pt;">${escapeHtml(dados.furigana)}</td>
            <td rowspan="4" class="photo-cell" style="vertical-align: middle;">
              ${dados.fotoUrl ? `
                <img src="${escapeHtml(dados.fotoUrl)}" alt="Foto" class="photo-img" />
              ` : `
                <div class="photo-placeholder">
                  写真をはる位置<br>
                  <span style="font-size: 5.5pt; color: #777;">写真をはる必要がある場合</span><br>
                  1. 縦 36～40mm<br>
                     横 24～30mm<br>
                  2. 本人単身胸から上<br>
                  3. 裏面のりづけ
                </div>
              `}
            </td>
          </tr>
          <!-- Nome -->
          <tr style="height: 14mm;">
            <td style="border-right: none; font-size: 8.5pt; font-weight: 700;">氏　名</td>
            <td colspan="3" style="border-left: none;">
              <div style="font-size: 13pt; font-weight: 700; letter-spacing: 1px;">
                ${escapeHtml(dados.nomeKanji || dados.nomeAlfabeto)}
              </div>
              ${(dados.nomeKanji && dados.nomeAlfabeto && dados.nomeKanji !== dados.nomeAlfabeto) ? `
                <div style="font-size: 7.5pt; color: #475569;">(${escapeHtml(dados.nomeAlfabeto)})</div>
              ` : ''}
            </td>
          </tr>
          <!-- Data de Nascimento & Gênero -->
          <tr style="height: 8mm;">
            <td colspan="3" style="font-size: 8.5pt;">
              ${dados.nascimentoAno ? `${dados.nascimentoAno}年 ${dados.nascimentoMes}月 ${dados.nascimentoDia}日生` : '—'}
              <span style="margin-left: 12px; font-size: 8pt;">（満 ${dados.idade !== '' ? dados.idade : '—'} 歳）</span>
            </td>
            <td style="text-align: center; font-size: 8.5pt; white-space: nowrap;">
              ${generoHTML}
            </td>
          </tr>
          <!-- Endereço Atual -->
          <tr style="height: 14mm;">
            <td colspan="3" style="vertical-align: top; padding-top: 3px;">
              <div class="cell-label">ふりがな</div>
              <div style="font-size: 7.5pt; color: #333; margin-bottom: 2px;">${escapeHtml(dados.enderecoFurigana || '')}</div>
              <div style="font-size: 8.5pt; font-weight: 500;">
                <span style="font-size: 7.5pt; margin-right: 4px;">現住所 ${escapeHtml(dados.cep)}</span>
                ${escapeHtml(dados.enderecoLinha1)} ${escapeHtml(dados.enderecoLinha2)}
              </div>
            </td>
            <td style="vertical-align: top; padding-top: 3px; padding-left: 6px; font-size: 7pt; text-align: left;">
              <div class="cell-label">電話</div>
              <div style="font-size: 8.5pt; font-weight: 600; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(dados.telefone || '—')}
              </div>
            </td>
          </tr>
          <!-- Contato Alternativo / Emergência -->
          <tr style="height: 12mm;">
            <td colspan="3" style="vertical-align: top; padding-top: 3px;">
              <div class="cell-label">
                連絡先 <span class="cell-sublabel">（現住所以外に連絡を希望する場合のみ記入）</span>
              </div>
              <div style="font-size: 8pt; margin-top: 2px;">
                ${dados.email ? `E-mail: ${escapeHtml(dados.email)}` : '同上'}
              </div>
            </td>
            <td colspan="2" style="vertical-align: top; padding-top: 3px; padding-left: 6px; font-size: 7pt;">
              <div class="cell-label">電話</div>
              <div style="font-size: 8.5pt; font-weight: 600; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(dados.telefone || '—')}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Tabela de 学歴・職歴 (15 Linhas) -->
      <table class="jis-table" style="flex: 1; border-top: none;">
        <colgroup>
          <col class="col-year">
          <col class="col-month">
          <col class="col-content">
        </colgroup>
        <thead>
          <tr style="height: 6.5mm; background: #fafafa;">
            <th class="col-year" style="font-size: 7.5pt; font-weight: 600;">年</th>
            <th class="col-month" style="font-size: 7.5pt; font-weight: 600;">月</th>
            <th class="col-content" style="font-size: 8pt; font-weight: 600; text-align: center;">学歴・職歴（各別にまとめて書く）</th>
          </tr>
        </thead>
        <tbody>
          ${linhasHistoricoP1.map(r => `
            <tr class="row-history">
              <td class="col-year">${r.ano ? escapeHtml(String(r.ano)) : ''}</td>
              <td class="col-month">${r.mes ? escapeHtml(String(r.mes)) : ''}</td>
              <td class="col-content" style="${r.isCenter ? 'text-align: center; font-weight: 700; letter-spacing: 4px;' : (r.isRight ? 'text-align: right; padding-right: 20px;' : '')}">
                ${escapeHtml(r.texto || '')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer-note">
        記入上の注意 １．鉛筆以外の黒又は青の筆記具で記入。 ２．数字はアラビア数字で、文字はくずさず正確に書く。 ３．※印のところは、該当するものを○で囲む。
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- PÁGINA 2: CONTINUAÇÃO + LICENÇAS + MOTIVAÇÃO & DESEJOS    -->
    <!-- ======================================================== -->
    <div class="rirekisho-page">
      <!-- Tabela Superior de 免許・資格 (7 Linhas) -->
      <table class="jis-table">
        <colgroup>
          <col class="col-year">
          <col class="col-month">
          <col class="col-content">
        </colgroup>
        <thead>
          <tr style="height: 6.5mm; background: #fafafa;">
            <th class="col-year" style="font-size: 7.5pt; font-weight: 600;">年</th>
            <th class="col-month" style="font-size: 7.5pt; font-weight: 600;">月</th>
            <th class="col-content" style="font-size: 8pt; font-weight: 600; text-align: center;">免許・資格</th>
          </tr>
        </thead>
        <tbody>
          ${linhasLicencasP2.map(r => `
            <tr class="row-history">
              <td class="col-year">${r.ano ? escapeHtml(String(r.ano)) : ''}</td>
              <td class="col-month">${r.mes ? escapeHtml(String(r.mes)) : ''}</td>
              <td class="col-content" style="${r.isRight ? 'text-align: right; padding-right: 20px;' : 'font-weight: 500;'}">
                ${escapeHtml(r.texto || '')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Bloco Intermediário: Motivação / Self-PR + Condições (通勤・扶養・配偶者) -->
      <div class="p2-bottom-grid">
        <!-- Lado Esquerdo: 志望の動機、特技、アピールポイントなど -->
        <div class="p2-left-box">
          <div class="cell-label" style="font-size: 7.5pt; font-weight: 600; color: #000; margin-bottom: 4px;">
            志望の動機、特技、好きな学科、アピールポイントなど
          </div>
          <div style="font-size: 8pt; line-height: 1.45; white-space: pre-wrap; color: #111; overflow: hidden; flex: 1;">
            ${escapeHtml(dados.motivacao || '')}
          </div>
        </div>

        <!-- Lado Direito: 通勤時間・扶養・配偶者 -->
        <div class="p2-right-box">
          <div class="p2-right-row">
            <div class="cell-label">通勤時間</div>
            <div style="font-size: 8.5pt; margin-top: 2px;">
              約 <strong>${escapeHtml(dados.tempoComutacaoHoras || '0')}</strong> 時間 <strong>${escapeHtml(dados.tempoComutacaoMin || '45')}</strong> 分
            </div>
          </div>
          <div class="p2-right-row">
            <div class="cell-label">扶養家族数（配偶者を除く）</div>
            <div style="font-size: 8.5pt; margin-top: 2px;">
              <strong>${escapeHtml(String(dados.dependentes !== undefined ? dados.dependentes : '0'))}</strong> 人
            </div>
          </div>
          <div class="p2-right-row">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 4px;">
              <div style="flex: 1;">
                <div class="cell-label">配偶者</div>
                <div style="font-size: 8pt; white-space: nowrap; margin-top: 1px;">
                  ※ ${conjugeHTML}
                </div>
              </div>
              <div style="flex: 1.3; border-left: 1px solid #ccc; padding-left: 6px;">
                <div class="cell-label">配偶者の扶養義務</div>
                <div style="font-size: 8pt; white-space: nowrap; margin-top: 1px;">
                  ※ ${obrigacaoHTML}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bloco Inferior: 本人希望記入欄 -->
      <div class="p2-desejos-box">
        <div class="cell-label" style="font-size: 7.5pt; font-weight: 600; color: #000; margin-bottom: 4px;">
          本人希望記入欄（特に給料・職種・勤務時間・勤務地・その他についての希望などがあれば記入）
        </div>
        <div style="font-size: 8pt; line-height: 1.4; color: #111; padding-top: 2px;">
          ${escapeHtml(dados.desejosPessoais || '貴社の規定に従います。')}
        </div>
      </div>

    </div>

  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch (e) { }
      }, 350);
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Abre a janela de visualização e impressão direta do Currículo Japonês
 */
export function imprimirRirekisho(dados, targetWin = null) {
  const html = gerarHTMLRirekisho(dados);
  let win = targetWin;
  if (!win || win.closed) {
    try {
      win = window.open('', '_blank');
    } catch (e) { }
  }

  if (!win) {
    alert('O navegador bloqueou a abertura da janela de impressão. Por favor, permita pop-ups para este site.');
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}
