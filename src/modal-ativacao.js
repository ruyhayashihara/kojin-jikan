/**
 * Componente Modal Reutilizável de Ativação de Chave de Liberação
 * Permite que o usuário insira e valide sua chave anti-fraude em qualquer tela.
 */

import { ativarChaveUsuario, obterStatusPlano } from './licencas-service.js';
import { supabase } from './supabaseClient.js';

export function openModalAtivacao({ onSucesso, motivo = 'manual' } = {}) {
  // Remove modal anterior se houver
  const existing = document.getElementById('modal-ativacao-chave');
  if (existing) existing.remove();

  const isLimiteAtingido = motivo === 'limite_atingido';

  const modalHtml = `
    <div class="modal-overlay" id="modal-ativacao-chave" style="z-index: 10000; animation: fadeIn 0.2s ease;">
      <div class="modal card" style="max-width: 520px; border: 1px solid var(--color-border); box-shadow: var(--shadow-xl); background: var(--color-surface); padding: 1.5rem; border-radius: 14px;">

        <div class="modal-header" style="border-bottom: 1px solid var(--color-border); padding-bottom: 1rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
              🔑
            </div>
            <div>
              <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-text); margin: 0;">
                ${isLimiteAtingido ? 'Limite de Cadastros Atingido' : 'Ativar Chave de Liberação'}
              </h2>
              <p style="font-size: 0.78rem; color: var(--color-text-muted); margin: 2px 0 0 0;">
                ${isLimiteAtingido ? 'Desbloqueie o acesso completo para continuar cadastrando' : 'Insira sua chave de uso único para liberar recursos PRO'}
              </p>
            </div>
          </div>
          <button type="button" class="btn-close-modal" id="btn-close-modal-ativacao" style="background: transparent; border: none; font-size: 1.25rem; color: var(--color-text-muted); cursor: pointer; padding: 4px;">
            ✕
          </button>
        </div>

        <div class="modal-body" style="margin-bottom: 1.25rem;">
          ${isLimiteAtingido ? `
            <div style="background: var(--color-error-bg); border: 1px solid var(--color-error-border); border-radius: 8px; padding: 0.85rem; margin-bottom: 1.1rem; display: flex; gap: 0.6rem; align-items: flex-start;">
              <span style="font-size: 1.2rem;">⚠️</span>
              <div style="font-size: 0.82rem; color: var(--color-error); line-height: 1.4;">
                <strong>Cota Gratuita Atingida:</strong> Você atingiu a cota máxima de <strong>5 trabalhadores cadastrados</strong> do Plano Gratuito. Para cadastrar novos trabalhadores sem limites, insira sua <strong>Chave de Uso Único</strong>.
              </div>
            </div>
          ` : `
            <div style="background: var(--color-primary-50); border: 1px solid var(--color-primary-light); border-radius: 8px; padding: 0.85rem; margin-bottom: 1.1rem; display: flex; gap: 0.6rem; align-items: flex-start;">
              <span style="font-size: 1.2rem;">🛡️</span>
              <div style="font-size: 0.82rem; color: var(--color-primary); line-height: 1.4;">
                As chaves são de <strong>uso único anti-fraude</strong>. Assim que ativada, a licença é vinculada exclusivamente à sua conta.
              </div>
            </div>
          `}

          <div id="modal-ativacao-alert" style="display: none; padding: 0.75rem; border-radius: 8px; font-size: 0.82rem; margin-bottom: 1rem;"></div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label for="input-codigo-chave" style="display: block; font-size: 0.82rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.4rem;">
              Código da Chave de Acesso (ライセンスキー)
            </label>
            <div style="position: relative;">
              <input
                type="text"
                id="input-codigo-chave"
                placeholder="Ex: KEIRO-GES-XXXX-XXXX-XXXX"
                maxlength="30"
                autocomplete="off"
                spellcheck="false"
                class="admin-field-input"
                style="width: 100%; box-sizing: border-box; padding: 0.65rem 0.85rem; font-family: monospace; font-size: 1.05rem; letter-spacing: 0.05em; font-weight: 700; text-transform: uppercase;"
              />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem;">
              <span style="font-size: 0.72rem; color: var(--color-text-muted);">Formato: KEIRO-GES-XXXX-XXXX-XXXX</span>
              <button type="button" id="btn-colar-chave" style="background: none; border: none; font-size: 0.75rem; color: var(--color-primary); cursor: pointer; text-decoration: underline; padding: 0; font-weight: 600;">
                📋 Colar da área de transferência
              </button>
            </div>
          </div>

          <div style="background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px; padding: 0.75rem; font-size: 0.78rem; color: var(--color-text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--color-text); font-weight: 600;">
              <span>💡 Ainda não possui uma chave de liberação?</span>
            </div>
            <div>
              Entre em contato diretamente com o administrador para solicitar sua chave de liberação ilimitada para sua empresa.
            </div>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.6rem; border-top: 1px solid var(--color-border); padding-top: 1rem;">
          <button type="button" class="btn btn-outline" id="btn-cancelar-modal-ativacao" style="font-size: 0.85rem;">
            Cancelar
          </button>
          <button type="button" class="btn btn-primary" id="btn-confirmar-ativacao" style="font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem; background: var(--color-primary); border-color: var(--color-primary); color: #ffffff; font-weight: 600;">
            <span>🔓 Ativar Acesso Agora</span>
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('modal-ativacao-chave');
  const input = document.getElementById('input-codigo-chave');
  const btnConfirmar = document.getElementById('btn-confirmar-ativacao');
  const btnColar = document.getElementById('btn-colar-chave');
  const btnClose = document.getElementById('btn-close-modal-ativacao');
  const btnCancel = document.getElementById('btn-cancelar-modal-ativacao');
  const alertBox = document.getElementById('modal-ativacao-alert');

  input?.focus();

  // Função para fechar modal
  function fecharModal() {
    modal?.remove();
  }

  btnClose?.addEventListener('click', fecharModal);
  btnCancel?.addEventListener('click', fecharModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
  });

  // Colar da área de transferência
  btnColar?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && input) {
        input.value = text.trim().toUpperCase();
        input.focus();
      }
    } catch (e) {
      alert('Não foi possível acessar a área de transferência automaticamente. Pressione Ctrl+V no campo.');
    }
  });

  // Auto formatação em maiúsculas
  input?.addEventListener('input', () => {
    input.value = input.value.toUpperCase();
    alertBox.style.display = 'none';
  });

  // Confirmação de ativação
  btnConfirmar?.addEventListener('click', async () => {
    const codigo = input?.value?.trim();
    if (!codigo) {
      alertBox.textContent = 'Por favor, digite ou cole a sua chave de ativação.';
      alertBox.style.background = 'var(--color-error-bg)';
      alertBox.style.border = '1px solid var(--color-error-border)';
      alertBox.style.color = 'var(--color-error)';
      alertBox.style.display = 'block';
      return;
    }

    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<span>⏳ Validando chave...</span>';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const res = await ativarChaveUsuario({ codigo, user });

      alertBox.textContent = '🎉 ' + (res.mensagem || 'Chave ativada com sucesso!');
      alertBox.style.background = 'var(--color-success-bg)';
      alertBox.style.border = '1px solid var(--color-success-border)';
      alertBox.style.color = 'var(--color-success)';
      alertBox.style.display = 'block';

      btnConfirmar.innerHTML = '<span>✅ Acesso Liberado!</span>';

      setTimeout(() => {
        fecharModal();
        if (typeof onSucesso === 'function') {
          onSucesso(res);
        } else {
          window.location.reload();
        }
      }, 1000);

    } catch (err) {
      alertBox.textContent = '❌ ' + (err.message || 'Erro ao validar chave.');
      alertBox.style.background = 'var(--color-error-bg)';
      alertBox.style.border = '1px solid var(--color-error-border)';
      alertBox.style.color = 'var(--color-error)';
      alertBox.style.display = 'block';

      btnConfirmar.disabled = false;
      btnConfirmar.innerHTML = '<span>🔓 Tentar Novamente</span>';
    }
  });

  // Enter dispara ativação
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnConfirmar?.click();
    }
  });
}
