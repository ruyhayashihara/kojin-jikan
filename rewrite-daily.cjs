const fs = require('fs');
let content = fs.readFileSync('src/pages/registro-horas.js', 'utf8');

// 1. ADD NEW FIELDS TO HTML
const oldHtmlSnippet = `
                <div class="form-group" style="margin-bottom: 1.5rem; gap: 0.25rem;">
                  <label for="modal-obs" style="color: #9ca3af; font-size: 0.75rem; font-weight: 500;">メモ</label>
                  <input type="text" id="modal-obs" placeholder="任意のメモ" style="background: #2d2d2d; color: #fff; border: 1px solid #404040; border-radius: 0.5rem; padding: 0.75rem; width: 100%;" />
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">`;

const newHtmlSnippet = `
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
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">`;

content = content.replace(oldHtmlSnippet, newHtmlSnippet);


// 2. UPDATE TABLE ROWS LOGIC (buildTimesheetRows)
const oldTableRowLogic = `
      let txtIntervalo = '-';
      if (intervalo) {
        const [ih, im] = intervalo.split(':');
        txtIntervalo = \`\${parseInt(ih)*60 + parseInt(im)} 分\`;
      }
      const txtTotal = total > 0 ? \`\${total.toFixed(1)}h\` : '-';
      const txtSubtotal = subtotal > 0 ? \`¥\${subtotal.toLocaleString('ja-JP')}\` : '-';`;

const newTableRowLogic = `
      let txtIntervalo = '-';
      if (intervalo) {
        const [ih, im] = intervalo.split(':');
        txtIntervalo = \`\${parseInt(ih)*60 + parseInt(im)} 分\`;
      }
      const txtTotal = total > 0 ? \`\${total.toFixed(1)}h\` : '-';
      
      let finalSubtotal = 0;
      if (record?.tipo_calculo === 'fixo') {
        finalSubtotal = parseFloat(record.valor_diario) || 0;
      } else {
        const rowRate = parseFloat(record?.valor_diario) || valorHora;
        finalSubtotal = Math.round(total * rowRate * 100) / 100;
      }
      const txtSubtotal = finalSubtotal > 0 ? \`¥\${finalSubtotal.toLocaleString('ja-JP')}\` : '-';`;

content = content.replace(oldTableRowLogic, newTableRowLogic);

// Notice: we need to replace subtotal logic everywhere inside buildTimesheetRows instead of using the old "subtotal" constant
const obsoleteSubtotalLine = "const subtotal = total > 0 ? (Math.round(total * valorHora * 100) / 100) : 0;";
content = content.replace(obsoleteSubtotalLine, "// subtotal calculated dynamically");


// 3. JS EVENTS & STATE UPDATES (openModalForDay and Save)

const jsDefin = `    const mExtra = document.getElementById('modal-extra');
    const mObs = document.getElementById('modal-obs');`;
    
const newJsDefin = `    const mExtra = document.getElementById('modal-extra');
    const mObs = document.getElementById('modal-obs');
    const mTipoCalculo = document.getElementById('modal-tipo-calculo');
    const mValorDiario = document.getElementById('modal-valor-diario');`;

content = content.replace(jsDefin, newJsDefin);

const jsOpenFill = `mInt.value = intMin || '';
        mObs.value = record.observacao || '';
      } else {
        // Pre-fill default values
        mEnt.value = '08:00';
        mSai.value = '17:00';
        mInt.value = '60';
        mObs.value = '';
      }`;

const newJsOpenFill = `mInt.value = intMin || '';
        mObs.value = record.observacao || '';
        mTipoCalculo.value = record.tipo_calculo || 'por_hora';
        mValorDiario.value = record.valor_diario || valorHora;
      } else {
        // Pre-fill default values
        mEnt.value = '08:00';
        mSai.value = '17:00';
        mInt.value = '60';
        mObs.value = '';
        mTipoCalculo.value = 'por_hora';
        mValorDiario.value = valorHora;
      }`;
      
content = content.replace(jsOpenFill, newJsOpenFill);


const jsSaveData = `        const intMin = parseInt(mInt.value) || 0;
        const obs = mObs.value;
        
        const intStr = intMin > 0 ? \`0\${Math.floor(intMin/60)}:\` + String(intMin%60).padStart(2, '0') : null;
        
        const dateStr = \`\${selectedYear}-\${String(selectedMonth).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
        const row = registros[day];
        
        if (!entrada && !saida && !obs) {`;

const newJsSaveData = `        const intMin = parseInt(mInt.value) || 0;
        const obs = mObs.value;
        const tipoCalculo = mTipoCalculo.value;
        const valorDiario = parseFloat(mValorDiario.value) || 0;
        
        const intStr = intMin > 0 ? \`0\${Math.floor(intMin/60)}:\` + String(intMin%60).padStart(2, '0') : null;
        
        const dateStr = \`\${selectedYear}-\${String(selectedMonth).padStart(2, '0')}-\${String(day).padStart(2, '0')}\`;
        const row = registros[day];
        
        if (!entrada && !saida && !obs) {`;

content = content.replace(jsSaveData, newJsSaveData);


const jsPayload = `
          const payload = {
            usuario_id: userId,
            data: dateStr,
            hora_entrada: entrada || null,
            hora_saida: saida || null,
            intervalo: intStr,
            observacao: obs || null,
          };`;

const newJsPayload = `
          const payload = {
            usuario_id: userId,
            data: dateStr,
            hora_entrada: entrada || null,
            hora_saida: saida || null,
            intervalo: intStr,
            observacao: obs || null,
            tipo_calculo: tipoCalculo,
            valor_diario: valorDiario,
          };`;

content = content.replace(jsPayload, newJsPayload);

// 4. FIX MONTH SUBTOTAL LOGIC - Now it doesn't just multiply totalHours * globalRate !
// We must build a new function: calcSubtotalMensal()

const oldCalcSubtotal = `
    const totalHoras = calcTotalHorasMes();
    const subtotalBruto = Math.round(totalHoras * valorHora * 100) / 100;
    const totalDesc = calcTotalDescontos();
    const totalLiquido = Math.round((subtotalBruto - totalDesc) * 100) / 100;
`;

const newCalcSubtotal = `
    const totalHoras = calcTotalHorasMes();
    
    // NEW LOGIC: Calculate subtotal line by line
    let subtotalBruto = 0;
    for (const [dayStr, r] of Object.entries(registros)) {
      if (!r.hora_entrada || !r.hora_saida) {
        if (r.tipo_calculo === 'fixo') {
           subtotalBruto += parseFloat(r.valor_diario) || 0;
        }
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
`;

// There are TWO places where updateCalculations() and saveResumo() define subtotalBruto
content = content.replace(
  `// Save resumo mensal
  async function saveResumo() {
    const totalHoras = calcTotalHorasMes();
    const subtotalBruto = Math.round(totalHoras * valorHora * 100) / 100;`,
  `// Save resumo mensal
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
    }`
);

content = content.replace(
  `// Update all footer calculations
  function updateCalculations() {
    const totalHoras = calcTotalHorasMes();
    const subtotalBruto = Math.round(totalHoras * valorHora * 100) / 100;`,
  `// Update all footer calculations
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
    }`
);


// One more place: the HTML render calls calcTotalHorasFromRecords() * valorHora!
const oldHtmlRenderSubtotal = `<span class="calc-value calc-bold" id="calc-subtotal">¥\${(calcTotalHorasFromRecords() * valorHora).toLocaleString('ja-JP')}</span>`;

// We fix it by making calcTotalHorasFromRecords calculate the actual subtotal or creating a new one:
const htmlSubHlp = `
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
`;

content = content.replace(
  `// Helper to calc total from loaded records (before DOM is ready)
  function calcTotalHorasFromRecords() {`,
  `${htmlSubHlp}
  // Helper to calc total from loaded records (before DOM is ready)
  function calcTotalHorasFromRecords() {`
);

content = content.replace(
  oldHtmlRenderSubtotal,
  `<span class="calc-value calc-bold" id="calc-subtotal">¥\${calcSubtotalBrutoFromRecords().toLocaleString('ja-JP')}</span>`
);


fs.writeFileSync('src/pages/registro-horas.js', content);
console.log("Rewrote Daily values handling in JS file.");
