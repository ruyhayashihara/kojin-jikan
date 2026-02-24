import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { verifyInvoiceNumber, renderInvoiceVerifyResult } from '../invoice-api.js';
import { renderSidebar, bindSidebarEvents } from '../sidebar.js';

export async function renderConfiguracoes(app) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // Tenta buscar perfil existente
  let perfil = null;
  try {
    const { data } = await supabase
      .from('perfil_usuario')
      .select('*')
      .eq('id', userId)
      .single();
    perfil = data;
  } catch (e) {
    // Perfil ainda não existe
  }

  const currentYear = new Date().getFullYear();

  app.innerHTML = `
    ${renderSidebar('configuracoes')}
    <div class="app-content-wrapper">
      <main class="main-content">
        <div class="page-container">
          <div class="page-header">
            <h1>Configurações</h1>
            <p>Edite seu perfil de usuário — ユーザープロフィール</p>
          </div>

          <form id="config-form" class="config-form card">
            <div id="config-error" class="alert alert-error" style="display:none;"></div>
            <div id="config-success" class="alert alert-success" style="display:none;"></div>

            <div class="form-grid">
              <div class="form-group">
                <label for="cfg-nome">Nome</label>
                <input type="text" id="cfg-nome" placeholder="Seu nome completo" value="${perfil?.nome || ''}" />
              </div>

              <div class="form-group">
                <label for="cfg-moeda">Moeda</label>
                <input type="text" id="cfg-moeda" placeholder="¥" value="${perfil?.moeda || '¥'}" />
              </div>

              <div class="form-group">
                <label for="cfg-valor-hora">Valor Hora Padrão</label>
                <input type="number" id="cfg-valor-hora" placeholder="0" step="0.01" value="${perfil?.valor_hora_padrao || ''}" />
              </div>

              <div class="form-group">
                <label for="cfg-regime">Regime de Declaração</label>
                <select id="cfg-regime">
                  <option value="">Selecione...</option>
                  <option value="青色 Azul" ${perfil?.regime_declaracao === '青色 Azul' ? 'selected' : ''}>青色 Azul</option>
                  <option value="白色 Branco" ${perfil?.regime_declaracao === '白色 Branco' ? 'selected' : ''}>白色 Branco</option>
                </select>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="cfg-invoice" ${perfil?.registrado_invoice ? 'checked' : ''} />
                  <span>Registrado no sistema Invoice</span>
                </label>
              </div>

              <div class="form-group">
                <label for="cfg-numero-invoice">Número Invoice</label>
                <div class="invoice-field-row">
                  <input type="text" id="cfg-numero-invoice" placeholder="T0000000000000" value="${perfil?.numero_invoice || ''}" />
                  <button type="button" class="btn btn-outline btn-sm" id="btn-verify-invoice-cfg">🔍 Verificar</button>
                </div>
                <div id="invoice-verify-result-cfg"></div>
              </div>

              <div class="form-group">
                <label for="cfg-my-number">
                  My Number
                  <span class="warning-badge">⚠ Dado sensível — armazene com cuidado.</span>
                </label>
                <input type="text" id="cfg-my-number" placeholder="マイナンバー" value="${perfil?.my_number || ''}" />
              </div>

              <div class="form-group">
                <label for="cfg-ano-fiscal">Ano Fiscal Atual</label>
                <input type="number" id="cfg-ano-fiscal" placeholder="${currentYear}" value="${perfil?.ano_fiscal_atual || currentYear}" />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="config-save-btn">
                Salvar Configurações
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  `;

  bindSidebarEvents();

  // Invoice verification
  document.getElementById('btn-verify-invoice-cfg')?.addEventListener('click', async () => {
    const num = document.getElementById('cfg-numero-invoice')?.value;
    const container = document.getElementById('invoice-verify-result-cfg');
    if (!container) return;
    container.innerHTML = renderInvoiceVerifyResult({ loading: true });
    const result = await verifyInvoiceNumber(num);
    container.innerHTML = renderInvoiceVerifyResult(result);
  });

  const form = document.getElementById('config-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorDiv = document.getElementById('config-error');
    const successDiv = document.getElementById('config-success');
    const btn = document.getElementById('config-save-btn');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    const payload = {
      id: userId,
      nome: document.getElementById('cfg-nome').value.trim(),
      moeda: document.getElementById('cfg-moeda').value.trim() || '¥',
      valor_hora_padrao: parseFloat(document.getElementById('cfg-valor-hora').value) || 0,
      regime_declaracao: document.getElementById('cfg-regime').value,
      registrado_invoice: document.getElementById('cfg-invoice').checked,
      numero_invoice: document.getElementById('cfg-numero-invoice').value.trim(),
      my_number: document.getElementById('cfg-my-number').value.trim(),
      ano_fiscal_atual: parseInt(document.getElementById('cfg-ano-fiscal').value) || currentYear,
    };

    try {
      const { error } = await supabase
        .from('perfil_usuario')
        .upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      successDiv.textContent = 'Configurações salvas com sucesso!';
      successDiv.style.display = 'block';
    } catch (err) {
      errorDiv.textContent = err.message || 'Erro ao salvar configurações.';
      errorDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar Configurações';
    }
  });
}
