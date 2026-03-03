/**
 * Módulo de classificação de descontos → categorias NTA
 * Abordagem híbrida: 1) Regras por palavras-chave  2) IA como fallback
 */

import { NTA_CATEGORIAS } from './ai-receipt.js';

// Mapeamento de palavras-chave → código de categoria NTA
const KEYWORD_MAP = [
    // 01 - 租税公課 (Impostos e taxas públicas)
    { keywords: ['所得税', '住民税', '源泉徴収', '固定資産税', '事業税', '印紙税', '消費税', '税金'], code: '01' },

    // 02 - 荷造運賃 (Embalagem e frete)
    { keywords: ['送料', '運賃', '配送', '荷造', '宅配', '郵便'], code: '02' },

    // 03 - 水道光熱費 (Água, luz e gás)
    { keywords: ['電気', '水道', 'ガス', '光熱', '電力', '上下水道'], code: '03' },

    // 04 - 旅費交通費 (Transporte e viagens)
    { keywords: ['交通', '電車', 'バス', 'タクシー', '新幹線', '飛行機', '通勤', '定期', '旅費', 'suica', 'pasmo', 'icoca'], code: '04' },

    // 05 - 通信費 (Comunicação)
    { keywords: ['通信', '電話', 'インターネット', 'WiFi', '携帯', 'スマホ', 'ネット', 'サーバー', 'ドメイン'], code: '05' },

    // 06 - 広告宣伝費 (Publicidade)
    { keywords: ['広告', '宣伝', 'マーケティング', 'PR', '販促', 'チラシ', 'ポスター'], code: '06' },

    // 07 - 接待交際費 (Entretenimento profissional)
    { keywords: ['接待', '交際', '会食', '飲み会', '贈答', 'お中元', 'お歳暮', 'ギフト'], code: '07' },

    // 08 - 損害保険料 (Seguros)
    { keywords: ['保険', '社会保険', '労災保険', '雇用保険', '健康保険', '厚生年金', '国民年金', '国民健康', '生命保険', '損害保険', '火災保険', '賠償保険'], code: '08' },

    // 09 - 修繕費 (Reparos e manutenção)
    { keywords: ['修繕', '修理', 'メンテナンス', '補修', '改修'], code: '09' },

    // 10 - 消耗品費 (Material de consumo)
    { keywords: ['消耗品', '文房具', '事務用品', 'コピー用紙', 'インク', 'トナー', 'USB', 'ケーブル'], code: '10' },

    // 11 - 減価償却費 (Depreciação)
    { keywords: ['減価償却', '償却', 'パソコン購入', 'PC購入', '設備'], code: '11' },

    // 12 - 給料賃金 (Salários pagos)
    { keywords: ['給料', '賃金', '給与', 'アルバイト', 'パート', '人件費'], code: '12' },

    // 13 - 外注工賃 (Serviços terceirizados)
    { keywords: ['外注', '業務委託', '委託費', 'フリーランス', '下請'], code: '13' },

    // 14 - 地代家賃 (Aluguel)
    { keywords: ['家賃', '賃貸', '地代', 'オフィス', '事務所', 'レンタル', 'コワーキング'], code: '14' },

    // 15 - 利子割引料 (Juros financeiros)
    { keywords: ['利子', '利息', '金利', 'ローン', '借入', '割引'], code: '15' },

    // 16 - 雑費 (Despesas diversas) — fallback
    { keywords: ['雑費', 'その他', '雑'], code: '16' },
];

/**
 * Classifica uma descrição de desconto usando palavras-chave
 * @param {string} descricao - Descrição do desconto (ex: "社会保険")
 * @returns {{ code: string, nome: string, descricao: string, campo: string, method: string } | null}
 */
export function classifyByKeywords(descricao) {
    if (!descricao || descricao.trim() === '') return null;

    const text = descricao.toLowerCase().trim();

    for (const rule of KEYWORD_MAP) {
        for (const keyword of rule.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                const cat = NTA_CATEGORIAS.find(c => c.code === rule.code);
                if (cat) {
                    return {
                        ...cat,
                        method: 'keyword',
                        confidence: 0.9,
                    };
                }
            }
        }
    }

    return null;
}

/**
 * Classificação híbrida: regras primeiro, depois IA como fallback
 * @param {string} descricao - Descrição do desconto
 * @returns {Promise<{ code: string, nome: string, descricao: string, campo: string, method: string, confidence: number }>}
 */
export async function classifyDesconto(descricao) {
    // 1) Tentar classificação por palavras-chave (instantâneo, grátis)
    const keywordResult = classifyByKeywords(descricao);
    if (keywordResult) {
        console.log(`[classify] Keyword match: "${descricao}" → ${keywordResult.code} ${keywordResult.nome}`);
        return keywordResult;
    }

    // 2) Fallback: categoria 16 (雑費) — classificação segura como "diversos"
    // TODO: Integrar com Supabase Edge Function + IA para classificações mais precisas
    console.log(`[classify] No keyword match for "${descricao}", defaulting to 16 (雑費)`);
    const fallback = NTA_CATEGORIAS.find(c => c.code === '16');
    return {
        ...fallback,
        method: 'fallback',
        confidence: 0.3,
    };
}
