/**
 * Serviço de Gerenciamento de Licenças, Chaves Anti-Fraude e Controle de Cotas
 * Suporta Supabase com fallback transparente para localStorage.
 */

import { supabase } from './supabaseClient.js';

const STORAGE_CHAVES_KEY = 'keiro_chaves_licenca';
const STORAGE_USER_LICENCAS_KEY = 'keiro_user_licencas';
const STORAGE_ADMIN_CONFIG_KEY = 'keiro_admin_config';

// Chaves demo pré-configuradas para testes imediatos
const CHAVES_DEMO_INICIAIS = [
  {
    id: 'chave-demo-ges-001',
    codigo: 'KEIRO-GES-9A21-7F40-PRO1',
    tipo_plano: 'gestor_ilimitado',
    nome_plano: 'Gestor Ilimitado (管理者 無制限)',
    limite_trabalhadores: null, // null = sem limite
    status: 'disponivel', // 'disponivel' | 'utilizada' | 'revogada'
    nota_cliente: 'Chave Demo Inicial (Gestor)',
    criado_em: new Date(Date.now() - 86400000 * 2).toISOString(),
    criado_por: 'sistema',
    utilizada_por: null,
    utilizada_por_email: null,
    utilizada_em: null
  },
  {
    id: 'chave-demo-ges-002',
    codigo: 'KEIRO-GES-3B88-11EC-PRO2',
    tipo_plano: 'gestor_ilimitado',
    nome_plano: 'Gestor Ilimitado (管理者 無制限)',
    limite_trabalhadores: null,
    status: 'disponivel',
    nota_cliente: 'Chave Reserva - Empreiteira Tanaka',
    criado_em: new Date(Date.now() - 86400000 * 1).toISOString(),
    criado_por: 'sistema',
    utilizada_por: null,
    utilizada_por_email: null,
    utilizada_em: null
  },
  {
    id: 'chave-demo-ind-001',
    codigo: 'KEIRO-IND-4C92-00FA-PRO1',
    tipo_plano: 'individual_pro',
    nome_plano: 'Individual PRO (個人 PRO)',
    limite_trabalhadores: null,
    status: 'disponivel',
    nota_cliente: 'Chave Demo Inicial (Individual)',
    criado_em: new Date(Date.now() - 86400000 * 3).toISOString(),
    criado_por: 'sistema',
    utilizada_por: null,
    utilizada_por_email: null,
    utilizada_em: null
  }
];

/**
 * Inicializa a lista de chaves em memória/localStorage
 */
export function getStoredChaves() {
  try {
    const raw = localStorage.getItem(STORAGE_CHAVES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Erro ao carregar chaves do cache local:', e);
  }
  // Se não existir, salva as chaves demo iniciais
  try {
    localStorage.setItem(STORAGE_CHAVES_KEY, JSON.stringify(CHAVES_DEMO_INICIAIS));
  } catch (e) { }
  return CHAVES_DEMO_INICIAIS;
}

/**
 * Salva a lista de chaves no localStorage
 */
export function setStoredChaves(chaves) {
  try {
    localStorage.setItem(STORAGE_CHAVES_KEY, JSON.stringify(chaves));
  } catch (e) {
    console.warn('Erro ao salvar chaves no cache local:', e);
  }
}

/**
 * Retorna as licenças ativadas por cada usuário (userId -> licença)
 */
export function getStoredUserLicencas() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_LICENCAS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { }
  return {};
}

/**
 * Salva a licença de um usuário no localStorage
 */
export function saveUserLicencaLocal(userId, licenca) {
  try {
    const current = getStoredUserLicencas();
    current[userId] = licenca;
    localStorage.setItem(STORAGE_USER_LICENCAS_KEY, JSON.stringify(current));
  } catch (e) { }
}

/**
 * Gera um código human-friendly e seguro no padrão KEIRO-[TIPO]-XXXX-XXXX-XXXX
 */
export function gerarCodigoChave(tipo = 'gestor_ilimitado') {
  const prefixo = tipo === 'individual_pro' ? 'KEIRO-IND' : 'KEIRO-GES';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem 0, O, 1, I para evitar ambiguidade visual
  const bloco = (len = 4) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };
  return `${prefixo}-${bloco(4)}-${bloco(4)}-${bloco(4)}`;
}

/**
 * Cria uma nova chave de liberação
 */
export async function criarNovaChave({
  tipoPlano = 'gestor_ilimitado',
  clienteNota = '',
  limiteTrabalhadores = null,
  criadoPor = 'admin'
}) {
  const codigo = gerarCodigoChave(tipoPlano);
  const id = 'key-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

  const nomePlano = tipoPlano === 'individual_pro'
    ? 'Individual PRO (個人 PRO)'
    : (limiteTrabalhadores ? `Gestor Cota Personalizada (${limiteTrabalhadores} cadastros)` : 'Gestor Ilimitado (管理者 無制限)');

  const novaChave = {
    id,
    codigo,
    tipo_plano: tipoPlano,
    nome_plano: nomePlano,
    limite_trabalhadores: limiteTrabalhadores ? parseInt(limiteTrabalhadores, 10) : null,
    status: 'disponivel',
    nota_cliente: clienteNota.trim() || 'Sem observações',
    criado_em: new Date().toISOString(),
    criado_por: criadoPor,
    utilizada_por: null,
    utilizada_por_email: null,
    utilizada_em: null
  };

  // 1. Tenta salvar no Supabase se existir a tabela
  try {
    const { data, error } = await supabase
      .from('chaves_licenca')
      .insert([novaChave])
      .select()
      .single();
    if (!error && data) {
      novaChave.id = data.id;
    }
  } catch (err) {
    // Tabela pode ainda não ter sido criada no Supabase; prossegue com fallback
  }

  // 2. Atualiza cache local
  const chaves = getStoredChaves();
  chaves.unshift(novaChave);
  setStoredChaves(chaves);

  return novaChave;
}

/**
 * Lista todas as chaves cadastradas (para auditoria do administrador)
 */
export async function listarTodasChaves() {
  let chaves = [];

  // 1. Tenta buscar do Supabase
  try {
    const { data, error } = await supabase
      .from('chaves_licenca')
      .select('*')
      .order('criado_em', { ascending: false });
    if (!error && data && data.length > 0) {
      chaves = data;
      setStoredChaves(chaves);
      return chaves;
    }
  } catch (e) { }

  // 2. Fallback para cache local
  return getStoredChaves();
}

/**
 * Revoga uma chave existente (bloqueando seu uso ou cancelando acesso)
 */
export async function revogarChave(chaveId) {
  let chaves = getStoredChaves();
  const idx = chaves.findIndex(c => c.id === chaveId || c.codigo === chaveId);
  if (idx !== -1) {
    chaves[idx].status = 'revogada';
    setStoredChaves(chaves);
  }

  try {
    await supabase
      .from('chaves_licenca')
      .update({ status: 'revogada' })
      .or(`id.eq.${chaveId},codigo.eq.${chaveId}`);
  } catch (e) { }

  return true;
}

/**
 * Reativa uma chave revogada
 */
export async function reativarChave(chaveId) {
  let chaves = getStoredChaves();
  const idx = chaves.findIndex(c => c.id === chaveId || c.codigo === chaveId);
  if (idx !== -1) {
    chaves[idx].status = 'disponivel';
    chaves[idx].utilizada_por = null;
    chaves[idx].utilizada_por_email = null;
    chaves[idx].utilizada_em = null;
    setStoredChaves(chaves);
  }

  try {
    await supabase
      .from('chaves_licenca')
      .update({
        status: 'disponivel',
        utilizada_por: null,
        utilizada_por_email: null,
        utilizada_em: null
      })
      .or(`id.eq.${chaveId},codigo.eq.${chaveId}`);
  } catch (e) { }

  return true;
}

/**
 * Exclui uma chave da lista
 */
export async function excluirChave(chaveId) {
  let chaves = getStoredChaves();
  chaves = chaves.filter(c => c.id !== chaveId && c.codigo !== chaveId);
  setStoredChaves(chaves);

  try {
    await supabase
      .from('chaves_licenca')
      .delete()
      .or(`id.eq.${chaveId},codigo.eq.${chaveId}`);
  } catch (e) { }

  return true;
}

/**
 * Valida e Ativa uma Chave para um Usuário (ANTI-FRAUDE: USO ÚNICO)
 */
export async function ativarChaveUsuario({ codigo, user }) {
  if (!codigo || typeof codigo !== 'string') {
    throw new Error('Informe o código da chave de ativação.');
  }

  if (!user || !user.id) {
    throw new Error('Usuário não autenticado.');
  }

  const codigoFormatado = codigo.trim().toUpperCase();

  // 1. Busca chave no Supabase ou Local
  let chaveEncontrada = null;
  let chavesLocais = getStoredChaves();

  try {
    const { data, error } = await supabase
      .from('chaves_licenca')
      .select('*')
      .eq('codigo', codigoFormatado)
      .maybeSingle();
    if (!error && data) {
      chaveEncontrada = data;
    }
  } catch (e) { }

  if (!chaveEncontrada) {
    chaveEncontrada = chavesLocais.find(c => c.codigo.toUpperCase() === codigoFormatado);
  }

  if (!chaveEncontrada) {
    throw new Error('Chave não encontrada. Verifique se digitou os caracteres corretamente.');
  }

  // 2. Validação Anti-Fraude
  if (chaveEncontrada.status === 'revogada') {
    throw new Error('Esta chave de ativação foi revogada pelo administrador e não é válida.');
  }

  if (chaveEncontrada.status === 'utilizada') {
    // Se foi utilizada pelo mesmo usuário, já está ativo
    if (chaveEncontrada.utilizada_por === user.id) {
      return {
        sucesso: true,
        jaAtiva: true,
        chave: chaveEncontrada,
        mensagem: 'Esta chave já está ativa na sua conta.'
      };
    }
    // Tentativa de reutilização por outra pessoa: BLOQUEADO
    throw new Error('Esta chave já foi ativada por outra conta e não pode ser reutilizada (Regra Anti-Fraude de Uso Único). Entre em contato com o administrador.');
  }

  // 3. Atualiza Chave como UTILIZADA
  const agora = new Date().toISOString();
  chaveEncontrada.status = 'utilizada';
  chaveEncontrada.utilizada_por = user.id;
  chaveEncontrada.utilizada_por_email = user.email || 'usuario@keiro.com';
  chaveEncontrada.utilizada_em = agora;

  // Atualiza no cache local
  const localIdx = chavesLocais.findIndex(c => c.codigo.toUpperCase() === codigoFormatado);
  if (localIdx !== -1) {
    chavesLocais[localIdx] = { ...chaveEncontrada };
  } else {
    chavesLocais.unshift({ ...chaveEncontrada });
  }
  setStoredChaves(chavesLocais);

  // Atualiza no Supabase
  try {
    await supabase
      .from('chaves_licenca')
      .update({
        status: 'utilizada',
        utilizada_por: user.id,
        utilizada_por_email: user.email || null,
        utilizada_em: agora
      })
      .eq('codigo', codigoFormatado);
  } catch (e) { }

  // 4. Grava a licença no perfil do usuário
  const dadosLicenca = {
    tipo_plano: chaveEncontrada.tipo_plano,
    nome_plano: chaveEncontrada.nome_plano,
    is_pro: true,
    limite_trabalhadores: chaveEncontrada.limite_trabalhadores || null,
    chave_codigo: chaveEncontrada.codigo,
    ativada_em: agora
  };

  saveUserLicencaLocal(user.id, dadosLicenca);

  try {
    await supabase
      .from('perfil_usuario')
      .update({
        plano: chaveEncontrada.tipo_plano,
        is_pro: true,
        limite_trabalhadores: chaveEncontrada.limite_trabalhadores,
        chave_licenca: chaveEncontrada.codigo,
        licenca_ativada_em: agora
      })
      .eq('id', user.id);
  } catch (e) { }

  return {
    sucesso: true,
    chave: chaveEncontrada,
    mensagem: 'Chave ativada com sucesso! Seu acesso completo foi desbloqueado.'
  };
}

/**
 * Consulta o status do plano e limites do usuário atual
 */
export async function obterStatusPlano(user, role = 'gestor', totalCadastrados = 0) {
  if (!user || !user.id) {
    return {
      plano: 'free',
      isPro: false,
      isAdmin: false,
      nomePlano: role === 'gestor' ? 'Plano Básico (Gratuito)' : 'Plano Individual (Gratuito)',
      limite: role === 'gestor' ? 5 : 1,
      totalCadastrados,
      restantes: Math.max(0, (role === 'gestor' ? 5 : 1) - totalCadastrados),
      atingiuLimite: totalCadastrados >= (role === 'gestor' ? 5 : 1),
      percentualUso: Math.min(100, Math.round((totalCadastrados / (role === 'gestor' ? 5 : 1)) * 100))
    };
  }

  // 0. USUÁRIO ADMINISTRADOR: Acesso completo e ilimitado irrestrito em todo o sistema (sem necessidade de chave)
  if (isUsuarioAdmin(user)) {
    return {
      plano: 'admin',
      isPro: true,
      isAdmin: true,
      tipoPlano: 'admin_ilimitado',
      nomePlano: 'Administrador (Acesso Total Ilimitado)',
      limite: Infinity,
      isIlimitado: true,
      totalCadastrados,
      restantes: Infinity,
      atingiuLimite: false,
      percentualUso: 0,
      chaveCodigo: 'ACESSO-ADMIN-MASTER',
      ativadaEm: new Date().toISOString()
    };
  }

  // 1. Tenta carregar do cache local
  const userLicencas = getStoredUserLicencas();
  let licenca = userLicencas[user.id] || null;

  // 2. Se não estiver no local, tenta Supabase
  if (!licenca) {
    try {
      const { data } = await supabase
        .from('perfil_usuario')
        .select('plano, is_pro, limite_trabalhadores, chave_licenca, licenca_ativada_em')
        .eq('id', user.id)
        .maybeSingle();
      if (data && data.is_pro) {
        licenca = {
          tipo_plano: data.plano || 'gestor_ilimitado',
          nome_plano: data.plano === 'individual_pro' ? 'Individual PRO' : 'Gestor Ilimitado',
          is_pro: true,
          limite_trabalhadores: data.limite_trabalhadores || null,
          chave_codigo: data.chave_licenca,
          ativada_em: data.licenca_ativada_em
        };
        saveUserLicencaLocal(user.id, licenca);
      }
    } catch (e) { }
  }

  // Se o usuário tem licença PRO ativa
  if (licenca && licenca.is_pro) {
    const limiteCustom = licenca.limite_trabalhadores;
    const isIlimitado = !limiteCustom;
    const limiteNum = isIlimitado ? Infinity : limiteCustom;
    const atingiu = !isIlimitado && totalCadastrados >= limiteNum;
    const restantes = isIlimitado ? Infinity : Math.max(0, limiteNum - totalCadastrados);
    const percentual = isIlimitado ? 0 : Math.min(100, Math.round((totalCadastrados / limiteNum) * 100));

    return {
      plano: 'pro',
      isPro: true,
      tipoPlano: licenca.tipo_plano,
      nomePlano: licenca.nome_plano || (role === 'gestor' ? 'Gestor Ilimitado (PRO)' : 'Individual PRO'),
      limite: limiteNum,
      isIlimitado,
      totalCadastrados,
      restantes,
      atingiuLimite: atingiu,
      percentualUso: percentual,
      chaveCodigo: licenca.chave_codigo,
      ativadaEm: licenca.ativada_em
    };
  }

  // Caso contrário: Plano Free padrão
  // Gestor: 5 trabalhadores
  // Individual: 1 trabalhador
  const limiteFree = role === 'gestor' ? 5 : 1;
  const atingiuLimite = totalCadastrados >= limiteFree;
  const restantes = Math.max(0, limiteFree - totalCadastrados);
  const percentualUso = Math.min(100, Math.round((totalCadastrados / limiteFree) * 100));

  return {
    plano: 'free',
    isPro: false,
    tipoPlano: 'free',
    nomePlano: role === 'gestor' ? 'Plano Básico (Gratuito)' : 'Plano Individual (Gratuito)',
    limite: limiteFree,
    isIlimitado: false,
    totalCadastrados,
    restantes,
    atingiuLimite,
    percentualUso
  };
}

/**
 * Lista oficial de e-mails de administradores com permissão irrestrita
 */
export const EMAILS_ADMINISTRADORES = [
  'ruy.hayashihara@gmail.com',
  'hayashihara.kougyou@gmail.com',
  'ruyhayashihara@icloud.com',
  'ruyhayashihara.jp@gmail.com',
  'ruyhayashihara@gmail.com'
];

/**
 * Verifica se um usuário possui permissão de Administrador
 */
export function isUsuarioAdmin(user) {
  if (!user) return false;

  const emailUsuario = (user.email || '').trim().toLowerCase();
  if (!emailUsuario) return false;

  // 1. Checa lista oficial de e-mails do administrador
  if (EMAILS_ADMINISTRADORES.some(e => e.trim().toLowerCase() === emailUsuario)) {
    return true;
  }

  // 2. Checa metadados do usuário no Supabase Auth
  if (user.user_metadata?.is_admin === true || user.app_metadata?.is_admin === true) {
    return true;
  }

  // 3. Qualquer outro usuário comum NÃO é administrador
  return false;
}

/**
 * Script SQL para o Supabase (para criar as tabelas no PostgreSQL)
 */
export const SQL_SCHEMA_SUPABASE = `-- ========================================================
-- SCRIPT DE CRIAÇÃO DA TABELA DE CHAVES E LICENÇAS NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ========================================================

-- 1. Criação da tabela chaves_licenca
CREATE TABLE IF NOT EXISTS public.chaves_licenca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL UNIQUE,
    tipo_plano VARCHAR(40) NOT NULL DEFAULT 'gestor_ilimitado',
    nome_plano VARCHAR(100) NOT NULL,
    limite_trabalhadores INTEGER DEFAULT NULL, -- NULL significa ilimitado
    status VARCHAR(20) NOT NULL DEFAULT 'disponivel', -- 'disponivel', 'utilizada', 'revogada'
    nota_cliente TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    criado_por VARCHAR(100) DEFAULT 'admin',
    utilizada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    utilizada_por_email VARCHAR(255),
    utilizada_em TIMESTAMPTZ
);

-- 2. Índices para performance e integridade
CREATE INDEX IF NOT EXISTS idx_chaves_codigo ON public.chaves_licenca(codigo);
CREATE INDEX IF NOT EXISTS idx_chaves_status ON public.chaves_licenca(status);
CREATE INDEX IF NOT EXISTS idx_chaves_utilizada_por ON public.chaves_licenca(utilizada_por);

-- 3. Habilita Row Level Security (RLS)
ALTER TABLE public.chaves_licenca ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso (RLS)
-- Leitura pública para validação de chave ou restrita a usuários logados
CREATE POLICY "Usuários autenticados podem consultar chaves"
ON public.chaves_licenca FOR SELECT
TO authenticated
USING (true);

-- Ativação atômica de chave pelo usuário
CREATE POLICY "Usuário pode ativar chave disponível"
ON public.chaves_licenca FOR UPDATE
TO authenticated
USING (status = 'disponivel' OR utilizada_por = auth.uid())
WITH CHECK (utilizada_por = auth.uid());

-- Inserção de chaves (Admins ou Service Role)
CREATE POLICY "Permitir inserção de chaves"
ON public.chaves_licenca FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Atualização da tabela perfil_usuario com colunas de licença
ALTER TABLE public.perfil_usuario
ADD COLUMN IF NOT EXISTS plano VARCHAR(40) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS limite_trabalhadores INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS chave_licenca VARCHAR(60) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS licenca_ativada_em TIMESTAMPTZ DEFAULT NULL;
`;
