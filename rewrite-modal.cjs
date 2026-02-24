const fs = require('fs');
let content = fs.readFileSync('src/pages/registro-horas.js', 'utf8');

const newModalHtml = `
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
                    <input type="number" id="modal-extra" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.5rem; width: 100%;" readonly value="0" />
                  </div>
                </div>
                
                <div class="form-group" style="margin-bottom: 1.5rem; gap: 0.25rem;">
                  <label for="modal-obs" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">メモ</label>
                  <input type="text" id="modal-obs" placeholder="任意のメモ" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.75rem; width: 100%;" />
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <button id="modal-btn-cancelar" style="background: transparent; color: #f3f4f6; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.75rem; font-weight: 600; cursor: pointer;">キャンセル</button>
                  <button id="modal-btn-salvar" style="background: #2563eb; color: #ffffff; border: none; border-radius: 0.5rem; padding: 0.75rem; font-weight: 600; cursor: pointer;">保存</button>
                </div>
              </div>
            </div>
`;

// Replace the old modal html (we used <!-- Modal de Lançamento de Horas --> to mark it)
content = content.replace(/<!-- Modal de Lançamento de Horas -->[\s\S]*?<\/div>\s*<\/div>/, newModalHtml.trim());


// Now we replace the openModalForDay and related events to handle pre-filled data and Intervalo logic (60)
const oldEventsRegex = /const modal = document\.getElementById\('modal-horas'\);[\s\S]*?updateCalculations\(\);\n          \}\n        \}\n      \}\n    \}\);\n/g;

const newEventsStr = `
    const modal = document.getElementById('modal-horas');
    const mTitle = document.getElementById('modal-horas-title');
    const mDay = document.getElementById('modal-day');
    const mEnt = document.getElementById('modal-entrada');
    const mSai = document.getElementById('modal-saida');
    const mInt = document.getElementById('modal-intervalo');
    const mExtra = document.getElementById('modal-extra');
    const mObs = document.getElementById('modal-obs');
    
    function updateExtraHours() {
      const e = mEnt.value;
      const s = mSai.value;
      const i = parseInt(mInt.value) || 0;
      if (e && s) {
        // Interval is in minutes for UI, need to convert to hours for calc
        const intStr = \`0\${Math.floor(i/60)}:\` + String(i%60).padStart(2, '0');
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
      const dateStr = \`\${selectedYear}-\${String(selectedMonth).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
      mTitle.textContent = \`\${dateStr} の記録\`;
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
      } else {
        // Pre-fill default values
        mEnt.value = '08:00';
        mSai.value = '17:00';
        mInt.value = '60';
        mObs.value = '';
      }
      
      updateExtraHours();
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
        
        const intStr = intMin > 0 ? \`0\${Math.floor(intMin/60)}:\` + String(intMin%60).padStart(2, '0') : null;
        
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
            intervalo: intStr,
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

content = content.replace(oldEventsRegex, newEventsStr);
fs.writeFileSync('src/pages/registro-horas.js', content);
console.log("Rewrote Modal in JS file");
