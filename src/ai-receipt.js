/**
 * Módulo de processamento de recibos com IA
 * Configuração do agente para extração de dados de recibos japoneses
 */

// Prompt do agente de IA para processamento de recibos
export const AI_RECEIPT_PROMPT = `Você é especialista em contabilidade fiscal japonesa. Ao receber a imagem de um recibo, extraia: data, estabelecimento, valor total, valor do consumo tax (消費税), e número de registro Invoice (適格請求書登録番号) se houver. Em seguida classifique a despesa em uma das 16 categorias oficiais da NTA japonesa. Responda sempre em JSON com os campos: dataRecibo, estabelecimento, valorTotal, valorConsumotax, numeroInvoice, categoriaCode, categoriaNome, confianca (0 a 1) e justificativa em português.`;

// 16 categorias oficiais da NTA
export const NTA_CATEGORIAS = [
    { code: '01', nome: '租税公課', descricao: 'Impostos e taxas públicas', campo: 'expenses_01' },
    { code: '02', nome: '荷造運賃', descricao: 'Embalagem e frete', campo: 'expenses_02' },
    { code: '03', nome: '水道光熱費', descricao: 'Água, luz e gás', campo: 'expenses_03' },
    { code: '04', nome: '旅費交通費', descricao: 'Transporte e viagens', campo: 'expenses_04' },
    { code: '05', nome: '通信費', descricao: 'Comunicação', campo: 'expenses_05' },
    { code: '06', nome: '広告宣伝費', descricao: 'Publicidade', campo: 'expenses_06' },
    { code: '07', nome: '接待交際費', descricao: 'Entretenimento profissional', campo: 'expenses_07' },
    { code: '08', nome: '損害保険料', descricao: 'Seguros', campo: 'expenses_08' },
    { code: '09', nome: '修繕費', descricao: 'Reparos e manutenção', campo: 'expenses_09' },
    { code: '10', nome: '消耗品費', descricao: 'Material de consumo', campo: 'expenses_10' },
    { code: '11', nome: '減価償却費', descricao: 'Depreciação', campo: 'expenses_11' },
    { code: '12', nome: '給料賃金', descricao: 'Salários pagos', campo: 'expenses_12' },
    { code: '13', nome: '外注工賃', descricao: 'Serviços terceirizados', campo: 'expenses_13' },
    { code: '14', nome: '地代家賃', descricao: 'Aluguel', campo: 'expenses_14' },
    { code: '15', nome: '利子割引料', descricao: 'Juros financeiros', campo: 'expenses_15' },
    { code: '16', nome: '雑費', descricao: 'Despesas diversas', campo: 'expenses_16' },
];

/**
 * Processa a imagem do recibo com IA
 * @param {string} imageDataUrl - Imagem em Base64 data URL
 * @returns {Promise<object>} Dados extraídos do recibo
 */
export async function processReceiptWithAI(imageDataUrl) {
    // TODO: Integrar com API de IA real (OpenAI Vision, Google Gemini, ou Base44)
    // Por enquanto, simula o processamento para demonstração do fluxo
    //
    // Para integrar com OpenAI:
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     model: 'gpt-4o',
    //     messages: [
    //       { role: 'system', content: AI_RECEIPT_PROMPT },
    //       { role: 'user', content: [{ type: 'image_url', image_url: { url: imageDataUrl } }] }
    //     ]
    //   })
    // });

    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Resposta simulada para demonstração
    return {
        dataRecibo: new Date().toISOString().split('T')[0],
        estabelecimento: 'コンビニ・サンプル',
        valorTotal: 1580,
        valorConsumotax: 144,
        numeroInvoice: 'T1234567890123',
        categoriaCode: '10',
        categoriaNome: '消耗品費',
        confianca: 0.85,
        justificativa: 'Recibo de compra em loja de conveniência. Classificado como material de consumo (消耗品費) por se tratar de itens de uso diário para o trabalho.'
    };
}

/**
 * Retorna a cor do badge de confiança
 */
export function getConfiancaColor(confianca) {
    const pct = confianca * 100;
    if (pct >= 80) return { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', label: 'Alta' };
    if (pct >= 50) return { bg: '#fef9c3', color: '#ca8a04', border: '#fde68a', label: 'Média' };
    return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca', label: 'Baixa' };
}
