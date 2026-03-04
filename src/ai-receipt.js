/**
 * Módulo de processamento de recibos com IA (Gemini Flash)
 * Extrai dados de recibos japoneses e classifica em categorias NTA
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Prompt do agente de IA para processamento de recibos
export const AI_RECEIPT_PROMPT = `You are an expert in Japanese tax accounting (確定申告). Given this receipt image, extract the following and respond ONLY with valid JSON (no markdown, no code blocks):

1. "dataRecibo": date on receipt in YYYY-MM-DD format. If unclear, use today's date.
2. "estabelecimento": store/business name exactly as shown on receipt
3. "valorTotal": total amount in yen (number only, no ¥ symbol)
4. "valorConsumotax": consumption tax (消費税) amount if visible (number, 0 if not found)
5. "numeroInvoice": Invoice registration number (適格請求書登録番号, format T + 13 digits) if visible, empty string if not
6. "categoriaCode": classify into one of these NTA categories (2-digit code string):
   01=租税公課, 02=荷造運賃, 03=水道光熱費, 04=旅費交通費, 05=通信費,
   06=広告宣伝費, 07=接待交際費, 08=損害保険料, 09=修繕費, 10=消耗品費,
   11=減価償却費, 12=給料賃金, 13=外注工賃, 14=地代家賃, 15=利子割引料, 16=雑費
7. "categoriaNome": Japanese name of the selected category
8. "confianca": your confidence from 0.0 to 1.0
9. "justificativa": brief explanation in Portuguese of why this category was chosen

Example response:
{"dataRecibo":"2026-03-01","estabelecimento":"セブンイレブン 新宿店","valorTotal":1580,"valorConsumotax":144,"numeroInvoice":"T1234567890123","categoriaCode":"10","categoriaNome":"消耗品費","confianca":0.92,"justificativa":"Compra em loja de conveniência classificada como material de consumo por se tratar de itens de uso diário."}`;

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
 * Extrai o base64 e mimeType de um data URL
 */
function parseDataUrl(dataUrl) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid data URL format');
    return { mimeType: match[1], base64: match[2] };
}

/**
 * Processa a imagem do recibo com Gemini Flash API
 * @param {string} imageDataUrl - Imagem em Base64 data URL
 * @returns {Promise<object>} Dados extraídos do recibo
 */
export async function processReceiptWithAI(imageDataUrl) {
    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY não configurada. Adicione ao arquivo .env.local');
    }

    const { mimeType, base64 } = parseDataUrl(imageDataUrl);

    console.log('[ai-receipt] Calling Gemini Flash API...');

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: AI_RECEIPT_PROMPT },
                    { inline_data: { mime_type: mimeType, data: base64 } }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1024,
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[ai-receipt] Gemini API error:', errorText);
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('[ai-receipt] Raw Gemini response:', text);

    // Parse JSON from response (handle possible markdown wrapping)
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        console.error('[ai-receipt] Could not parse JSON from:', text);
        throw new Error('Não foi possível interpretar a resposta da IA');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and ensure all fields exist
    const validated = {
        dataRecibo: parsed.dataRecibo || new Date().toISOString().split('T')[0],
        estabelecimento: parsed.estabelecimento || 'Desconhecido',
        valorTotal: Number(parsed.valorTotal) || 0,
        valorConsumotax: Number(parsed.valorConsumotax) || 0,
        numeroInvoice: parsed.numeroInvoice || '',
        categoriaCode: String(parsed.categoriaCode || '16').padStart(2, '0'),
        categoriaNome: parsed.categoriaNome || '雑費',
        confianca: Math.min(Math.max(Number(parsed.confianca) || 0.5, 0), 1),
        justificativa: parsed.justificativa || 'Classificação automática por IA.',
    };

    console.log('[ai-receipt] Parsed result:', validated);
    return validated;
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
