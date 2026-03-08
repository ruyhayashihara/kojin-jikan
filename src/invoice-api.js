/**
 * Módulo de verificação de Invoice via API da NTA
 * https://www.invoice-kohyo.nta.go.jp/
 */

const NTA_API_BASE = '/api/nta/company/invoice_name';

/**
 * Verifica um número de registro Invoice na API pública proxyada.
 * @param {string} invoiceNumber - ex: T1234567890123
 * @returns {Promise<{valid: boolean, data?: object, error?: string}>}
 */
export async function verifyInvoiceNumber(invoiceNumber) {
  if (!invoiceNumber || !invoiceNumber.trim()) {
    return { valid: false, error: 'Número Invoice não informado' };
  }

  const num = invoiceNumber.trim().replace(/^T/i, '');
  if (!/^\d{13}$/.test(num)) {
    return { valid: false, error: 'Formato inválido. Use T + 13 dígitos (ex: T1234567890123)' };
  }

  try {
    const res = await fetch(`${NTA_API_BASE}?id=T${num}`);

    if (!res.ok) {
      return { valid: false, error: `Erro na API de verificação (${res.status})` };
    }

    const textResult = await res.text();
    const companyName = textResult.trim();

    if (companyName && !companyName.toUpperCase().includes('ERROR')) {
      return {
        valid: true,
        data: {
          registrationNumber: `T${num}`,
          name: companyName,
          address: '',
          status: 'Ativo',
          updateDate: new Date().toISOString().split('T')[0],
          registrationDate: '',
        },
      };
    } else {
      return { valid: false, error: 'Número não encontrado ou base indisponível' };
    }
  } catch (e) {
    console.error("Erro consultando Invoice:", e);
    return { valid: false, error: 'Não foi possível conectar à API de verificação. Verifique sua conexão.' };
  }
}

/**
 * Renders the verification result card HTML
 */
export function renderInvoiceVerifyResult(result) {
  if (!result) return '';

  if (result.loading) {
    return `
      <div class="invoice-verify-card invoice-verify-loading">
        <div class="invoice-verify-spinner"></div>
        <span>Verificando na base da NTA...</span>
      </div>
    `;
  }

  if (result.valid && result.data) {
    return `
      <div class="invoice-verify-card invoice-verify-valid">
        <div class="invoice-verify-header">
          <span class="invoice-verify-icon invoice-icon-valid">✅</span>
          <span class="invoice-verify-title">Número válido</span>
        </div>
        <div class="invoice-verify-details">
          ${result.data.name ? `<div class="invoice-detail"><span class="invoice-detail-label">Razão Social</span><span class="invoice-detail-value">${result.data.name}</span></div>` : ''}
          ${result.data.address ? `<div class="invoice-detail"><span class="invoice-detail-label">Endereço</span><span class="invoice-detail-value">${result.data.address}</span></div>` : ''}
          <div class="invoice-detail"><span class="invoice-detail-label">Status</span><span class="invoice-detail-value">${result.data.status}</span></div>
          ${result.data.registrationNumber ? `<div class="invoice-detail"><span class="invoice-detail-label">Número</span><span class="invoice-detail-value">${result.data.registrationNumber}</span></div>` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div class="invoice-verify-card invoice-verify-invalid">
      <div class="invoice-verify-header">
        <span class="invoice-verify-icon invoice-icon-invalid">❌</span>
        <span class="invoice-verify-title">${result.error || 'Número não encontrado na base da NTA'}</span>
      </div>
    </div>
  `;
}

/**
 * Returns an invoice status icon for the despesas table
 * @param {object} despesa - the expense object
 * @returns {string} HTML for the status icon
 */
export function getInvoiceStatusIcon(despesa) {
  const num = despesa?.numero_invoice;
  if (!num) {
    return '<span class="invoice-dot invoice-dot-gray" title="Sem número Invoice">●</span>';
  }
  if (despesa?.invoice_verificado) {
    return '<span class="invoice-dot invoice-dot-green" title="Invoice verificado">●</span>';
  }
  return '<span class="invoice-dot invoice-dot-amber" title="Invoice não verificado">●</span>';
}
