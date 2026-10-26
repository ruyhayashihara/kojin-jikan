import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { isUsuarioAdmin } from '../licencas-service.js';

export async function renderLogin(app) {
  // Lê eventual preferência de role passada na URL (#/login?role=gestor)
  const hash = window.location.hash;
  const initialRole = hash.includes('role=gestor') ? 'gestor' : 'individual';

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <img src="/logo.png" alt="Logo" class="logo-icon" />
            <h1>マイ個人</h1>
          </div>
          <p class="auth-subtitle">Gestão de Horas & Fiscal no Japão<br/><span class="jp-text">勤務時間記録・自営業者管理システム</span></p>
        </div>

        <form id="login-form" class="auth-form">
          <!-- Seletor de Perfil Duplo -->
          <div class="role-selector" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; background: #1e293b; padding: 5px; border-radius: 10px; border: 1px solid #334155;">
            <button type="button" class="role-tab ${initialRole === 'individual' ? 'role-tab-active' : ''}" data-role="individual" id="tab-login-individual" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 600; text-align: center; gap: 3px;">
              <span style="font-size: 1.15rem;">👤</span>
              <span>Individual</span>
              <span style="font-size: 0.68rem; opacity: 0.75; font-weight: normal;">個人 (Autônomo)</span>
            </button>
            <button type="button" class="role-tab ${initialRole === 'gestor' ? 'role-tab-active' : ''}" data-role="gestor" id="tab-login-gestor" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 600; text-align: center; gap: 3px;">
              <span style="font-size: 1.15rem;">🏢</span>
              <span>Gestor</span>
              <span style="font-size: 0.68rem; opacity: 0.75; font-weight: normal;">管理者 (Empresa)</span>
            </button>
          </div>

          <div id="role-info-banner" style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 8px; padding: 10px 12px; margin-bottom: 1.25rem; font-size: 0.82rem; color: #cbd5e1; display: flex; align-items: center; gap: 8px;">
            <span id="role-info-icon" style="font-size: 1.2rem;">👤</span>
            <div id="role-info-text">
              <strong>Acesso Individual:</strong> Registre e controle suas próprias horas trabalhadas e despesas fiscais.
            </div>
          </div>

          <h2 id="login-heading">Entrar como Individual</h2>

          <div id="login-error" class="alert alert-error" style="display:none;"></div>
          <div id="login-success" class="alert alert-success" style="display:none;"></div>

          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" placeholder="seu@email.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label for="login-password" style="margin-bottom: 0;">Senha</label>
              <a href="javascript:void(0)" id="btn-abrir-recuperar" style="font-size: 0.8rem; color: #60a5fa; text-decoration: none; cursor: pointer; transition: color 0.2s;">
                Esqueceu a senha?
              </a>
            </div>
            <input type="password" id="login-password" placeholder="Sua senha" required minlength="6" autocomplete="current-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="login-btn">
            Entrar como Individual
          </button>

          <p class="auth-link">
            Não tem conta? <a href="#/cadastro" id="link-create-account">Criar conta</a>
          </p>
        </form>

        <!-- Modal de Recuperação de Senha -->
        <div id="modal-recuperar-senha" style="display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 9999; align-items: center; justify-content: center; padding: 1rem;">
          <div class="card" style="max-width: 420px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="margin: 0; font-size: 1.15rem; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
                <span>🔑</span> Recuperar Senha
              </h3>
              <button type="button" id="btn-fechar-recuperar" style="background: transparent; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; padding: 0 4px; line-height: 1;">&times;</button>
            </div>
            
            <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 1.25rem; line-height: 1.45;">
              Informe o e-mail cadastrado na sua conta. Enviaremos um link seguro para você redefinir sua senha.
            </p>

            <div id="recuperar-error" class="alert alert-error" style="display: none; margin-bottom: 1rem; font-size: 0.85rem;"></div>
            <div id="recuperar-success" class="alert alert-success" style="display: none; margin-bottom: 1rem; font-size: 0.85rem;"></div>

            <form id="form-recuperar-senha">
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label for="recuperar-email" style="font-size: 0.85rem; color: #cbd5e1;">E-mail Cadastrado</label>
                <input type="email" id="recuperar-email" placeholder="seu@email.com" required autocomplete="email" style="width: 100%;" />
              </div>

              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" id="btn-cancelar-recuperar" class="btn btn-outline" style="padding: 0.5rem 1rem;">
                  Cancelar
                </button>
                <button type="submit" id="btn-enviar-recuperar" class="btn btn-primary" style="padding: 0.5rem 1rem;">
                  Enviar Link
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  let currentRole = initialRole;

  function updateRoleUi(role) {
    currentRole = role;
    const tabInd = document.getElementById('tab-login-individual');
    const tabGes = document.getElementById('tab-login-gestor');
    const heading = document.getElementById('login-heading');
    const btn = document.getElementById('login-btn');
    const infoIcon = document.getElementById('role-info-icon');
    const infoText = document.getElementById('role-info-text');
    const linkCreate = document.getElementById('link-create-account');

    if (role === 'gestor') {
      tabInd?.classList.remove('role-tab-active');
      tabGes?.classList.add('role-tab-active');
      if (heading) heading.textContent = 'Entrar como Gestor (管理者)';
      if (btn) btn.textContent = 'Entrar no Painel do Gestor';
      if (infoIcon) infoIcon.textContent = '🏢';
      if (infoText) infoText.innerHTML = '<strong>Acesso de Gestor:</strong> Administre trabalhadores cadastrados por ID, equipes e emita folhas de ponto A4.';
      if (linkCreate) {
        linkCreate.href = '#/cadastro?role=gestor';
        linkCreate.textContent = 'Criar conta de Gestor';
      }
    } else {
      tabGes?.classList.remove('role-tab-active');
      tabInd?.classList.add('role-tab-active');
      if (heading) heading.textContent = 'Entrar como Individual (個人)';
      if (btn) btn.textContent = 'Entrar como Individual';
      if (infoIcon) infoIcon.textContent = '👤';
      if (infoText) infoText.innerHTML = '<strong>Acesso Individual:</strong> Registre e controle suas próprias horas trabalhadas e despesas fiscais.';
      if (linkCreate) {
        linkCreate.href = '#/cadastro?role=individual';
        linkCreate.textContent = 'Criar conta Individual';
      }
    }
    try {
      window.history.replaceState(null, '', `#/login?role=${role}`);
    } catch (e) { }
  }

  // Inicializa visual
  updateRoleUi(initialRole);

  document.getElementById('tab-login-individual')?.addEventListener('click', () => updateRoleUi('individual'));
  document.getElementById('tab-login-gestor')?.addEventListener('click', () => updateRoleUi('gestor'));

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const successDiv = document.getElementById('login-success');
    const btn = document.getElementById('login-btn');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('Não foi possível obter dados do usuário.');

      // Sincroniza a role selecionada com o perfil do usuário
      let finalRole = currentRole;
      try {
        const { data: perfil } = await supabase
          .from('perfil_usuario')
          .select('tipo_perfil')
          .eq('id', user.id)
          .maybeSingle();

        if (perfil) {
          if (perfil.tipo_perfil !== currentRole) {
            await supabase.from('perfil_usuario').update({ tipo_perfil: currentRole }).eq('id', user.id);
          }
        } else {
          await supabase.from('perfil_usuario').upsert({
            id: user.id,
            tipo_perfil: currentRole,
            nome: user.user_metadata?.nome || ''
          });
        }
      } catch (err) {
        console.warn('Erro ao verificar tipo_perfil:', err);
      }

      // Limpa dados residuais e seleção de trabalhador de sessões anteriores
      sessionStorage.removeItem('keiro_gestor_selected_worker');
      try {
        localStorage.removeItem('keiro_mock_trabalhadores');
        localStorage.removeItem('keiro_mock_registros');
        localStorage.removeItem('keiro_gestor_selected_worker');
      } catch (e) { }

      // Armazena a role ativa e permissão de administrador na sessão
      const adminStatus = isUsuarioAdmin(user);
      sessionStorage.setItem('keiro_is_admin', adminStatus ? 'true' : 'false');
      sessionStorage.setItem('keiro_active_role', finalRole);

      successDiv.textContent = 'Login realizado com sucesso! Redirecionando...';
      successDiv.style.display = 'block';

      setTimeout(() => {
        if (finalRole === 'gestor') {
          navigate('/gestor-dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 400);

    } catch (err) {
      let msg = err.message || 'Erro ao fazer login. Verifique seu e-mail e senha.';
      const lower = (msg || '').toLowerCase();

      if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || err.status === 429) {
        msg = 'Limite de tentativas excedido. Por favor, aguarde cerca de 1 hora antes de tentar novamente, ou tente mais tarde.';
      } else if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
        msg = 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
      } else if (lower.includes('email not confirmed')) {
        msg = 'E-mail ainda não confirmado. Verifique sua caixa de entrada para ativar a conta.';
      }

      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = currentRole === 'gestor' ? 'Entrar no Painel do Gestor' : 'Entrar como Individual';
    }
  });

  // Eventos do Modal de Recuperação de Senha
  const modalRecuperar = document.getElementById('modal-recuperar-senha');
  const btnAbrirRecuperar = document.getElementById('btn-abrir-recuperar');
  const btnFecharRecuperar = document.getElementById('btn-fechar-recuperar');
  const btnCancelarRecuperar = document.getElementById('btn-cancelar-recuperar');
  const formRecuperar = document.getElementById('form-recuperar-senha');
  const inputEmailRecuperar = document.getElementById('recuperar-email');
  const errorRecuperar = document.getElementById('recuperar-error');
  const successRecuperar = document.getElementById('recuperar-success');
  const btnEnviarRecuperar = document.getElementById('btn-enviar-recuperar');

  function abrirModalRecuperacao() {
    if (modalRecuperar) {
      modalRecuperar.style.display = 'flex';
      errorRecuperar.style.display = 'none';
      successRecuperar.style.display = 'none';
      const emailAtual = document.getElementById('login-email')?.value?.trim();
      if (emailAtual && inputEmailRecuperar) {
        inputEmailRecuperar.value = emailAtual;
      }
      inputEmailRecuperar?.focus();
    }
  }

  function fecharModalRecuperacao() {
    if (modalRecuperar) {
      modalRecuperar.style.display = 'none';
    }
  }

  btnAbrirRecuperar?.addEventListener('click', abrirModalRecuperacao);
  btnFecharRecuperar?.addEventListener('click', fecharModalRecuperacao);
  btnCancelarRecuperar?.addEventListener('click', fecharModalRecuperacao);
  modalRecuperar?.addEventListener('click', (e) => {
    if (e.target === modalRecuperar) fecharModalRecuperacao();
  });

  formRecuperar?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmailRecuperar?.value?.trim();
    if (!email) return;

    errorRecuperar.style.display = 'none';
    successRecuperar.style.display = 'none';
    btnEnviarRecuperar.disabled = true;
    btnEnviarRecuperar.textContent = 'Enviando link...';

    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;

      successRecuperar.innerHTML = `<strong>E-mail enviado com sucesso!</strong><br/>Enviamos o link de recuperação para <em>${email}</em>. Verifique sua caixa de entrada e pasta de spam.`;
      successRecuperar.style.display = 'block';
      formRecuperar.reset();

      setTimeout(() => {
        fecharModalRecuperacao();
      }, 5000);
    } catch (err) {
      let msg = err.message || 'Erro ao solicitar recuperação de senha.';
      const lower = (msg || '').toLowerCase();
      if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || err.status === 429) {
        msg = 'Muitas solicitações recentes. Por favor, aguarde alguns instantes antes de tentar novamente.';
      }
      errorRecuperar.textContent = msg;
      errorRecuperar.style.display = 'block';
    } finally {
      btnEnviarRecuperar.disabled = false;
      btnEnviarRecuperar.textContent = 'Enviar Link';
    }
  });
}

