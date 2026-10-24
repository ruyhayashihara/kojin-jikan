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
            <label for="login-password">Senha</label>
            <input type="password" id="login-password" placeholder="Sua senha" required minlength="6" autocomplete="current-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="login-btn">
            Entrar como Individual
          </button>

          <p class="auth-link">
            Não tem conta? <a href="#/cadastro" id="link-create-account">Criar conta</a>
          </p>
        </form>
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
      errorDiv.textContent = err.message || 'Erro ao fazer login. Verifique seu e-mail e senha.';
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = currentRole === 'gestor' ? 'Entrar no Painel do Gestor' : 'Entrar como Individual';
    }
  });
}

