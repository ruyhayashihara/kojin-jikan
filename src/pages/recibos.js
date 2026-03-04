import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { NTA_CATEGORIAS, processReceiptWithAI, getConfiancaColor } from '../ai-receipt.js';
import { verifyInvoiceNumber, renderInvoiceVerifyResult } from '../invoice-api.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

export async function renderRecibos(app) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { navigate('/login'); return; }

  let currentStep = 1;
  let imageDataUrl = null;
  let aiResult = null;
  let userGeminiKey = null;

  // Busca o perfil do usuário para pegar a chave do Gemini
  try {
    const { data } = await supabase
      .from('perfil_usuario')
      .select('gemini_api_key')
      .eq('id', user.id)
      .single();
    userGeminiKey = data?.gemini_api_key || null;
  } catch (e) {
    // Ignora erro se perfil não existir
  }


  // Build NTA category select options
  const categoryOptions = NTA_CATEGORIAS.map(c =>
    `<option value="${c.code}">${c.code} | ${c.nome} — ${c.descricao}</option>`
  ).join('');

  function renderStepIndicator() {
    return `
      <div class="wizard-steps">
        <div class="wizard-step ${currentStep >= 1 ? 'wizard-step-active' : ''} ${currentStep > 1 ? 'wizard-step-done' : ''}">
          <div class="wizard-step-num">${currentStep > 1 ? '✓' : '1'}</div>
          <span>Captura</span>
        </div>
        <div class="wizard-line ${currentStep > 1 ? 'wizard-line-done' : ''}"></div>
        <div class="wizard-step ${currentStep >= 2 ? 'wizard-step-active' : ''} ${currentStep > 2 ? 'wizard-step-done' : ''}">
          <div class="wizard-step-num">${currentStep > 2 ? '✓' : '2'}</div>
          <span>Revisão</span>
        </div>
        <div class="wizard-line ${currentStep > 2 ? 'wizard-line-done' : ''}"></div>
        <div class="wizard-step ${currentStep >= 3 ? 'wizard-step-active' : ''}">
          <div class="wizard-step-num">3</div>
          <span>Classificação</span>
        </div>
      </div>
    `;
  }

  function renderStep1() {
    return `
      <div class="wizard-content">
        ${!userGeminiKey ? `
          <div class="alert alert-warning" style="margin-bottom: var(--space-4);">
            <strong>Atenção:</strong> Você precisa configurar sua própria chave de API do Gemini para utilizar a leitura automática de recibos. <br><a href="#/configuracoes" style="text-decoration: underline; color: inherit; font-weight: 500;">Clique aqui para ir às Configurações</a>.
          </div>
        ` : ''}
        ${!imageDataUrl ? `
          <div class="capture-zone">
            <div class="capture-icon">📷</div>
            <h2>Capturar Recibo</h2>
            <p>Fotografe ou faça upload de um recibo para processar</p>
            <div class="capture-actions">
              <label class="btn btn-primary btn-lg capture-btn" for="camera-input">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Fotografar Recibo
              </label>
              <input type="file" id="camera-input" accept="image/*" capture="environment" style="display:none;" />

              <label class="btn btn-outline btn-lg" for="file-input">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Enviar Arquivo
              </label>
              <input type="file" id="file-input" accept="image/jpeg,image/png,application/pdf" style="display:none;" />
            </div>
            <p class="capture-hint">Formatos aceitos: JPG, PNG ou PDF</p>
          </div>
        ` : `
          <div class="preview-zone">
            <h2>Preview do Recibo</h2>
            <div class="preview-image-wrap">
              <img src="${imageDataUrl}" alt="Preview do recibo" class="preview-image" id="preview-img" />
            </div>
            <div class="preview-actions">
              <button class="btn btn-primary btn-lg" id="btn-process" ${!userGeminiKey ? 'disabled title="Configure sua API Key nas Configurações"' : ''}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/></svg>
                Processar com IA
              </button>
              <button class="btn btn-outline btn-lg" id="btn-cancel-capture">Cancelar</button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  function renderStep2() {
    if (!aiResult) return '<div class="wizard-content"><p>Processando...</p></div>';
    const conf = getConfiancaColor(aiResult.confianca);
    const pct = Math.round(aiResult.confianca * 100);

    return `
      <div class="wizard-content">
        <div class="review-layout">
          <div class="review-preview">
            <img src="${imageDataUrl}" alt="Recibo" class="review-thumb" />
          </div>
          <div class="review-fields card">
            <div class="review-header">
              <h2>Dados Extraídos</h2>
              <span class="confidence-badge" style="background:${conf.bg};color:${conf.color};border:1px solid ${conf.border}">
                OCR ${pct}% — ${conf.label}
              </span>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="rev-data">Data do Recibo</label>
                <input type="date" id="rev-data" value="${aiResult.dataRecibo || ''}" />
              </div>
              <div class="form-group">
                <label for="rev-estabelecimento">Estabelecimento</label>
                <input type="text" id="rev-estabelecimento" value="${aiResult.estabelecimento || ''}" />
              </div>
              <div class="form-group">
                <label for="rev-valor">Valor Total (¥)</label>
                <input type="number" id="rev-valor" value="${aiResult.valorTotal || ''}" step="0.01" />
              </div>
              <div class="form-group">
                <label for="rev-tax">消費税 — Consumo Tax (¥)</label>
                <input type="number" id="rev-tax" value="${aiResult.valorConsumotax || ''}" step="0.01" />
              </div>
              <div class="form-group form-group-full">
                <label for="rev-invoice">適格請求書登録番号 — Número Invoice (opcional)</label>
                <div class="invoice-field-row">
                  <input type="text" id="rev-invoice" value="${aiResult.numeroInvoice || ''}" placeholder="T0000000000000" />
                  <button type="button" class="btn btn-outline btn-sm" id="btn-verify-invoice-recibo">🔍 Verificar</button>
                </div>
                <div id="invoice-verify-result-recibo"></div>
              </div>
            </div>

            <div class="review-nav">
              <button class="btn btn-outline" id="btn-back-step1">Voltar</button>
              <button class="btn btn-primary" id="btn-to-step3">Continuar para Classificação</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep3() {
    if (!aiResult) return '';
    const conf = getConfiancaColor(aiResult.confianca);
    const pct = Math.round(aiResult.confianca * 100);
    const selectedCat = NTA_CATEGORIAS.find(c => c.code === aiResult.categoriaCode);

    return `
      <div class="wizard-content">
        <div class="classification-section card">
          <h2>Classificação da Despesa</h2>

          <div class="ai-suggestion">
            <div class="ai-suggestion-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/></svg>
              <span>Sugestão da IA</span>
              <span class="confidence-badge confidence-badge-sm" style="background:${conf.bg};color:${conf.color};border:1px solid ${conf.border}">
                ${pct}%
              </span>
            </div>
            <div class="ai-suggestion-body">
              <div class="ai-category-display">
                <span class="ai-cat-code">${aiResult.categoriaCode}</span>
                <span class="ai-cat-jp">${selectedCat?.nome || aiResult.categoriaNome}</span>
                <span class="ai-cat-pt">${selectedCat?.descricao || ''}</span>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top: var(--space-5);">
            <label for="class-categoria">Categoria (confirme ou altere)</label>
            <select id="class-categoria">
              ${NTA_CATEGORIAS.map(c =>
      `<option value="${c.code}" ${c.code === aiResult.categoriaCode ? 'selected' : ''}>${c.code} | ${c.nome} — ${c.descricao}</option>`
    ).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-top: var(--space-4);">
            <label for="class-justificativa">Justificativa da classificação</label>
            <textarea id="class-justificativa" rows="3" style="width:100%;padding:var(--space-3) var(--space-4);font-family:var(--font-family);font-size:var(--font-size-sm);border:1px solid var(--color-border);border-radius:var(--radius-md);outline:none;resize:vertical;">${aiResult.justificativa || ''}</textarea>
          </div>

          <div class="classification-actions">
            <button class="btn btn-outline" id="btn-back-step2">Voltar</button>
            <div class="classification-save-group">
              <button class="btn btn-outline" id="btn-save-pending">
                💾 Salvar sem revisar
              </button>
              <button class="btn btn-primary btn-lg" id="btn-save-reviewed">
                ✅ Confirmar e Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    app.innerHTML = `
      ${renderSidebar('recibos')}
      <div class="app-content-wrapper">
        <main class="main-content">
          <div class="page-container">
            <div class="page-header">
              <h1>Captura de Recibo</h1>
              <p>Digitalize e classifique seus recibos — レシート撮影</p>
            </div>
            ${renderStepIndicator()}
            ${currentStep === 1 ? renderStep1() : ''}
            ${currentStep === 2 ? renderStep2() : ''}
            ${currentStep === 3 ? renderStep3() : ''}
          </div>
        </main>
      </div>
    `;
    bindEvents();
    bindSidebarEvents();
  }

  function handleImageInput(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      imageDataUrl = e.target.result;
      render();
    };
    reader.readAsDataURL(file);
  }

  async function processImage() {
    // Show loading state
    const btn = document.getElementById('btn-process');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
        Processando com IA...
      `;
    }

    try {
      aiResult = await processReceiptWithAI(imageDataUrl, userGeminiKey);
      currentStep = 2;
      render();
    } catch (err) {
      alert('Erro ao processar recibo: ' + (err.message || 'Erro desconhecido'));
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Processar com IA`;
      }
    }
  }

  async function saveRecibo(status) {
    const dataRecibo = document.getElementById('rev-data')?.value || document.querySelector('#class-categoria')?.closest('.wizard-content')?.querySelector('#rev-data')?.value || aiResult.dataRecibo;
    const estabelecimento = document.getElementById('rev-estabelecimento')?.value || aiResult.estabelecimento;
    const valorTotal = parseFloat(document.getElementById('rev-valor')?.value) || aiResult.valorTotal;
    const valorTax = parseFloat(document.getElementById('rev-tax')?.value) || aiResult.valorConsumotax;
    const numInvoice = document.getElementById('rev-invoice')?.value || aiResult.numeroInvoice;
    const catCode = document.getElementById('class-categoria')?.value || aiResult.categoriaCode;
    const justificativa = document.getElementById('class-justificativa')?.value || aiResult.justificativa;
    const selectedCat = NTA_CATEGORIAS.find(c => c.code === catCode);
    const confianca = Math.round(aiResult.confianca * 100);

    // Save recibo
    const reciboPayload = {
      usuario_id: user.id,
      imagem_url: imageDataUrl?.substring(0, 200) + '...', // Truncate for DB; ideally upload to storage
      texto_ocr: justificativa,
      data_recibo: dataRecibo,
      estabelecimento: estabelecimento,
      valor_total: valorTotal,
      valor_consumo_tax: valorTax,
      numero_invoice: numInvoice,
      status_processamento: status,
      confianca_ocr: confianca,
    };

    let reciboId = null;
    try {
      const { data: recibo, error } = await supabase.from('recibo').insert(reciboPayload).select().single();
      if (error) throw error;
      reciboId = recibo?.id;
    } catch (e) {
      console.error('Erro ao salvar recibo:', e);
    }

    // Save despesa
    const now = new Date(dataRecibo || Date.now());
    const despesaPayload = {
      usuario_id: user.id,
      recibo_id: reciboId,
      data_recibo: dataRecibo,
      descricao: justificativa,
      estabelecimento: estabelecimento,
      valor: valorTotal,
      valor_dedutivel: valorTotal, // Default: fully deductible
      categoria_code: catCode,
      categoria_nome: selectedCat?.nome || aiResult.categoriaNome,
      campo_formulario: selectedCat?.campo || `expenses_${catCode}`,
      classificacao_automatica: true,
      revisado_usuario: status === 'revisado',
      ano_fiscal: now.getFullYear(),
      mes: now.getMonth() + 1,
    };

    try {
      const { error } = await supabase.from('despesa').insert(despesaPayload);
      if (error) throw error;
    } catch (e) {
      console.error('Erro ao salvar despesa:', e);
    }

    // Reset and show success
    currentStep = 1;
    imageDataUrl = null;
    aiResult = null;
    render();

    // Show success toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `✅ Recibo salvo com status: <strong>${status}</strong>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-show'), 10);
    setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function bindEvents() {
    // Step 1: image inputs
    document.getElementById('camera-input')?.addEventListener('change', (e) => handleImageInput(e.target.files[0]));
    document.getElementById('file-input')?.addEventListener('change', (e) => handleImageInput(e.target.files[0]));

    // Step 1: process / cancel
    document.getElementById('btn-process')?.addEventListener('click', processImage);
    document.getElementById('btn-cancel-capture')?.addEventListener('click', () => {
      imageDataUrl = null;
      render();
    });

    // Step 2: back / forward
    document.getElementById('btn-back-step1')?.addEventListener('click', () => { currentStep = 1; render(); });
    document.getElementById('btn-to-step3')?.addEventListener('click', () => {
      // Store edited values back into aiResult before going to step 3
      aiResult.dataRecibo = document.getElementById('rev-data')?.value || aiResult.dataRecibo;
      aiResult.estabelecimento = document.getElementById('rev-estabelecimento')?.value || aiResult.estabelecimento;
      aiResult.valorTotal = parseFloat(document.getElementById('rev-valor')?.value) || aiResult.valorTotal;
      aiResult.valorConsumotax = parseFloat(document.getElementById('rev-tax')?.value) || aiResult.valorConsumotax;
      aiResult.numeroInvoice = document.getElementById('rev-invoice')?.value || aiResult.numeroInvoice;
      currentStep = 3;
      render();
    });

    // Invoice verification
    document.getElementById('btn-verify-invoice-recibo')?.addEventListener('click', async () => {
      const num = document.getElementById('rev-invoice')?.value;
      const container = document.getElementById('invoice-verify-result-recibo');
      if (!container) return;
      container.innerHTML = renderInvoiceVerifyResult({ loading: true });
      const result = await verifyInvoiceNumber(num);
      container.innerHTML = renderInvoiceVerifyResult(result);
    });

    // Step 3: back / save
    document.getElementById('btn-back-step2')?.addEventListener('click', () => { currentStep = 2; render(); });
    document.getElementById('btn-save-reviewed')?.addEventListener('click', () => saveRecibo('revisado'));
    document.getElementById('btn-save-pending')?.addEventListener('click', () => saveRecibo('pendente'));
  }

  render();
}
