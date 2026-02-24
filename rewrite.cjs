const fs = require('fs');
const content = fs.readFileSync('src/pages/registro-horas.js', 'utf8');

// The new parts we will inject
const modalHtml = `
            <!-- Modal de Lançamento de Horas -->
            <div id="modal-horas" class="modal-overlay" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
              <div class="modal-content card" style="width: 100%; max-width: 400px; padding: 2rem;">
                <h2 id="modal-horas-title" style="margin-bottom: 1.5rem;">Adicionar Horas</h2>
                <input type="hidden" id="modal-day" value="" />
                
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label for="modal-entrada">Entrada</label>
                  <input type="time" id="modal-entrada" class="input-time" />
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label for="modal-saida">Saída</label>
                  <input type="time" id="modal-saida" class="input-time" />
                </div>
                
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label for="modal-intervalo">Intervalo (Horas/Minutos)</label>
                  <input type="time" id="modal-intervalo" class="input-time" />
                </div>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                  <label for="modal-obs">Observação</label>
                  <input type="text" id="modal-obs" placeholder="Opcional" />
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                  <button id="modal-btn-cancelar" class="btn btn-outline" style="width: 100px;">Cancelar</button>
                  <button id="modal-btn-salvar" class="btn btn-primary" style="width: 100px;">Salvar</button>
                </div>
              </div>
            </div>
`;

let newContent = content.replace(
  /<table class="timesheet-table">([\s\S]*?)<\/table>/,
  `<table class="timesheet-table">
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
                  \${buildTimesheetRows()}
                </tbody>
              </table>
              ${modalHtml.replace(/\$/g, '$$')}`
);

// We need to replace buildTimesheetRows function entirely
const startBuildRows = newContent.indexOf('function buildTimesheetRows() {');
const endBuildRows = newContent.indexOf('// Full render');
const newBuildRows = `function buildTimesheetRows() {
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
      const subtotal = total > 0 ? (Math.round(total * valorHora * 100) / 100) : 0;
      const obs = record?.observacao || '';
      
      let rowClass = 'timesheet-row';
      if (isWeekend) rowClass += ' row-weekend';
      if (total > 9) rowClass += ' row-overtime';

      const hasData = entrada || saida || total > 0 || obs;

      const txtEntrada = entrada || '-';
      const txtSaida = saida || '-';
      let txtIntervalo = '-';
      if (intervalo) {
        const [ih, im] = intervalo.split(':');
        txtIntervalo = \`\${parseInt(ih)*60 + parseInt(im)} 分\`;
      }
      const txtTotal = total > 0 ? \`\${total.toFixed(1)}h\` : '-';
      const txtSubtotal = subtotal > 0 ? \`¥\${subtotal.toLocaleString('ja-JP')}\` : '-';

      let actionHtml = '';
      if (hasData) {
        actionHtml = \`
          <div class="row-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
            <button class="btn-icon btn-edit-row" data-day="\${d}" title="Editar (編集)" style="background: none; border: none; cursor: pointer; color: #3b82f6; display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; line-height: 1;">
              <span>編集</span>
              <span>Edit</span>
            </button>
            <button class="btn-icon btn-delete-row" data-day="\${d}" title="Excluir" style="background: none; border: none; cursor: pointer; color: #ef4444; margin-left: 0.5rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
        \`;
      } else {
        actionHtml = \`
          <div class="row-actions" style="display: flex; justify-content: flex-end;">
            <button class="btn-icon btn-add-row" data-day="\${d}" title="Adicionar" style="background: none; border: none; cursor: pointer; color: #3b82f6; font-size: 1.5rem; font-weight: bold; padding: 0;">+</button>
          </div>
        \`;
      }

      const diaNome = DIAS_SEMANA_JA ? DIAS_SEMANA_JA[dow] : DIAS_SEMANA[dow];

      rows += \`
        <tr id="row-\${d}" class="\${rowClass}">
          <td class="col-date" style="line-height: 1.2;">
            \${d}日<br><span style="font-size: 0.85em; color: var(--color-text-muted);">(\${diaNome})</span>
          </td>
          <td class="col-time" style="text-align: center;">\${txtEntrada}</td>
          <td class="col-time" style="text-align: center;">\${txtSaida}</td>
          <td class="col-time" style="text-align: center;">\${txtIntervalo}</td>
          <td class="col-total" style="text-align: center; color: var(--color-text-muted);">\${txtTotal}</td>
          <td class="col-subtotal" style="text-align: center;">\${txtSubtotal}</td>
          <td class="col-acoes" style="text-align: right; padding-right: 1rem; width: 80px;">\${actionHtml}</td>
        </tr>
      \`;
    }
    return rows;
  }

  `;
if (startBuildRows !== -1 && endBuildRows !== -1) {
  newContent = newContent.substring(0, startBuildRows) + newBuildRows + newContent.substring(endBuildRows);
}

// Add map for Japanese days just under DIAS_SEMANA
newContent = newContent.replace("const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];", "const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];\nconst DIAS_SEMANA_JA = ['日', '月', '火', '水', '木', '金', '土'];");

// Event listeners modifications
// Remove old saveRegistro declaration
newContent = newContent.replace(/const saveRegistro = debounce\(async \(day\)([\s\S]*?)updateCalculations\(\);\n  \}, 500\);/g, '');

// Remove updateRowVisual (no longer needed, we'll re-render table)
newContent = newContent.replace(/function updateRowVisual\(day, totalHoras\)([\s\S]*?)\}/g, '');

// Replace old event bindings for inputs in timesheet body
const oldEvt1 = `    document.getElementById('timesheet-body').addEventListener('input', (e) => {
      // Auto-insert colon after 2 digits for time fields
      if (e.target.classList.contains('input-time')) {
        let v = e.target.value.replace(/[^\\d:]/g, '');
        if (v.length === 2 && !v.includes(':') && e.inputType !== 'deleteContentBackward') {
          e.target.value = v + ':';
          return;
        }
      }

      const day = parseInt(e.target.dataset.day);
      if (!day) return;
      const entrada = document.getElementById(\`entrada-\${day}\`)?.value;
      const saida = document.getElementById(\`saida-\${day}\`)?.value;
      const total = calcTotal(entrada, saida);
      updateRowVisual(day, total);
      updateCalculations();
    });`;

const oldEvt2 = `    document.getElementById('timesheet-body').addEventListener('change', (e) => {
      // Auto-format on blur: "0800" -> "08:00"
      if (e.target.classList.contains('input-time')) {
        let v = e.target.value.replace(/[^\\d]/g, '');
        if (v.length === 4) {
          e.target.value = v.slice(0, 2) + ':' + v.slice(2);
        } else if (v.length === 3) {
          e.target.value = '0' + v[0] + ':' + v.slice(1);
        }
      }

      const day = parseInt(e.target.dataset.day);
      if (!day) return;
      saveRegistro(day);
    });`;

// We inject our new events here:
const newEvents = `
    const modal = document.getElementById('modal-horas');
    const mTitle = document.getElementById('modal-horas-title');
    const mDay = document.getElementById('modal-day');
    const mEnt = document.getElementById('modal-entrada');
    const mSai = document.getElementById('modal-saida');
    const mInt = document.getElementById('modal-intervalo');
    const mObs = document.getElementById('modal-obs');
    
    function openModalForDay(day) {
      const record = registros[day];
      mTitle.textContent = \`Adicionar Horas - Registro do dia \${day}\`;
      mDay.value = day;
      mEnt.value = record?.hora_entrada?.slice(0, 5) || '';
      mSai.value = record?.hora_saida?.slice(0, 5) || '';
      mInt.value = record?.intervalo?.slice(0, 5) || '';
      mObs.value = record?.observacao || '';
      modal.style.display = 'flex';
      mEnt.focus();
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
      btn.textContent = 'Salvando...';
      
      try {
        const entrada = mEnt.value;
        const saida = mSai.value;
        const intervalo = mInt.value;
        const obs = mObs.value;
        
        const dateStr = \`\${selectedYear}-\${String(selectedMonth).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
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
        }
        
        modal.style.display = 'none';
        mDay.value = '';
        document.getElementById('timesheet-body').innerHTML = buildTimesheetRows();
        updateCalculations();
      } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar';
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
        if (confirm(\`Apagar os dados do dia \${day} (\${diaNome})?\`)) {
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
`;

newContent = newContent.replace(oldEvt1, '');
newContent = newContent.replace(oldEvt2, newEvents);

// Also remove calcTotalHorasMes dependency on inputs and use registros directly like calcTotalHorasFromRecords
const calcTotalHorasMesStr = `  // Calculate total hours for month
  function calcTotalHorasMes() {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    let total = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const entrada = document.getElementById(\`entrada-\${d}\`)?.value;
      const saida = document.getElementById(\`saida-\${d}\`)?.value;
      const intervalo = document.getElementById(\`intervalo-\${d}\`)?.value;
      total += calcTotal(entrada, saida, intervalo);
    }
    return Math.round(total * 100) / 100;
  }`;

const newCalcTotalHorasMesStr = `  // Calculate total hours for month
  function calcTotalHorasMes() {
    let total = 0;
    for (const [day, r] of Object.entries(registros)) {
      if (r.hora_entrada && r.hora_saida) {
        total += calcTotal(r.hora_entrada.slice(0, 5), r.hora_saida.slice(0, 5), r.intervalo ? r.intervalo.slice(0, 5) : '');
      }
    }
    return Math.round(total * 100) / 100;
  }`;

newContent = newContent.replace(calcTotalHorasMesStr, newCalcTotalHorasMesStr);

fs.writeFileSync('src/pages/registro-horas.js', newContent);
console.log("Rewrote src/pages/registro-horas.js");
