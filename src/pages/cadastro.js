import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';
import { clearAllLocalUserData } from '../mock-data.js';

export async function renderCadastro(app) {
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

        <form id="cadastro-form" class="auth-form">
          <!-- Seletor de Perfil Duplo -->
          <div class="role-selector" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 1.5rem; background: #1e293b; padding: 5px; border-radius: 10px; border: 1px solid #334155;">
            <button type="button" class="role-tab ${initialRole === 'individual' ? 'role-tab-active' : ''}" data-role="individual" id="tab-cad-individual" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 600; text-align: center; gap: 3px;">
              <span style="font-size: 1.15rem;">👤</span>
              <span>Individual</span>
              <span style="font-size: 0.68rem; opacity: 0.75; font-weight: normal;">個人 (Autônomo)</span>
            </button>
            <button type="button" class="role-tab ${initialRole === 'gestor' ? 'role-tab-active' : ''}" data-role="gestor" id="tab-cad-gestor" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px 8px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 600; text-align: center; gap: 3px;">
              <span style="font-size: 1.15rem;">🏢</span>
              <span>Gestor</span>
              <span style="font-size: 0.68rem; opacity: 0.75; font-weight: normal;">管理者 (Empresa)</span>
            </button>
          </div>

          <h2 id="cadastro-heading">Criar Conta Individual</h2>

          <div id="cadastro-error" class="alert alert-error" style="display:none;"></div>
          <div id="cadastro-success" class="alert alert-success" style="display:none;"></div>

          <div class="form-group" id="group-empresa" style="display: none;">
            <label for="cadastro-empresa">Nome da Empresa / Escritório (会社名・屋号)</label>
            <input type="text" id="cadastro-empresa" placeholder="Ex: Tanaka Empreiteira / K.K." />
          </div>

          <div class="form-group">
            <label for="cadastro-nome" id="label-nome">Nome Completo</label>
            <input type="text" id="cadastro-nome" placeholder="Seu nome completo" required />
          </div>

          <div class="form-group">
            <label for="cadastro-email">Email</label>
            <input type="email" id="cadastro-email" placeholder="seu@email.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label for="cadastro-password">Senha</label>
            <input type="password" id="cadastro-password" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password" />
          </div>

          <div class="form-group">
            <label for="cadastro-confirm">Confirmar Senha</label>
            <input type="password" id="cadastro-confirm" placeholder="Repita a senha" required minlength="6" autocomplete="new-password" />
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="cadastro-btn">
            Criar Conta Individual
          </button>

          <p class="auth-link">
            Já tem conta? <a href="#/login" id="link-login">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  `;

  let currentRole = initialRole;

  function updateRoleUi(role) {
    currentRole = role;
    const tabInd = document.getElementById('tab-cad-individual');
    const tabGes = document.getElementById('tab-cad-gestor');
    const heading = document.getElementById('cadastro-heading');
    const btn = document.getElementById('cadastro-btn');
    const groupEmpresa = document.getElementById('group-empresa');
    const inputEmpresa = document.getElementById('cadastro-empresa');
    const labelNome = document.getElementById('label-nome');
    const linkLogin = document.getElementById('link-login');

    if (role === 'gestor') {
      tabInd?.classList.remove('role-tab-active');
      tabGes?.classList.add('role-tab-active');
      if (heading) heading.textContent = 'Criar Conta de Gestor (管理者)';
      if (btn) btn.textContent = 'Criar Conta de Gestor';
      if (groupEmpresa) groupEmpresa.style.display = 'block';
      if (inputEmpresa) inputEmpresa.required = true;
      if (labelNome) labelNome.textContent = 'Nome do Administrador / Responsável';
      if (linkLogin) linkLogin.href = '#/login?role=gestor';
    } else {
      tabGes?.classList.remove('role-tab-active');
      tabInd?.classList.add('role-tab-active');
      if (heading) heading.textContent = 'Criar Conta Individual (個人)';
      if (btn) btn.textContent = 'Criar Conta Individual';
      if (groupEmpresa) groupEmpresa.style.display = 'none';
      if (inputEmpresa) inputEmpresa.required = false;
      if (labelNome) labelNome.textContent = 'Nome Completo';
      if (linkLogin) linkLogin.href = '#/login?role=individual';
    }
    try {
      window.history.replaceState(null, '', `#/cadastro?role=${role}`);
    } catch (e) { }
  }

  updateRoleUi(initialRole);

  document.getElementById('tab-cad-individual')?.addEventListener('click', () => updateRoleUi('individual'));
  document.getElementById('tab-cad-gestor')?.addEventListener('click', () => updateRoleUi('gestor'));

  const form = document.getElementById('cadastro-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('cadastro-nome').value.trim();
    const empresa = document.getElementById('cadastro-empresa')?.value.trim() || '';
    const email = document.getElementById('cadastro-email').value.trim();
    const password = document.getElementById('cadastro-password').value;
    const confirm = document.getElementById('cadastro-confirm').value;
    const errorDiv = document.getElementById('cadastro-error');
    const successDiv = document.getElementById('cadastro-success');
    const btn = document.getElementById('cadastro-btn');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (password !== confirm) {
      errorDiv.textContent = 'As senhas não coincidem.';
      errorDiv.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    // Desconecta qualquer sessão anterior existente para não misturar credenciais
    try {
      await supabase.auth.signOut();
    } catch (e) { }
    clearAllLocalUserData();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            nome: nome,
            tipo_perfil: currentRole,
            nome_empresa: currentRole === 'gestor' ? empresa : null
          }
        }
      });
      if (error) throw error;

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('Este e-mail já está cadastrado no sistema. Por favor, acesse a tela de login.');
      }

      // Salva perfil inicial
      if (data?.user) {
        try {
          await supabase.from('perfil_usuario').upsert({
            id: data.user.id,
            nome: nome,
            tipo_perfil: currentRole,
            nome_empresa: currentRole === 'gestor' ? empresa : null
          });
        } catch (e) {
          console.warn('Aviso ao registrar perfil inicial:', e);
        }
      }

      // Limpa dados residuais e inicia sessão limpa
      clearAllLocalUserData();
      sessionStorage.setItem('keiro_active_role', currentRole);

      if (data?.session) {
        successDiv.innerHTML = `Conta de ${currentRole === 'gestor' ? 'Gestor' : 'Individual'} criada com sucesso!<br/>Acessando o sistema...`;
        successDiv.style.display = 'block';
        setTimeout(() => navigate(currentRole === 'gestor' ? '/gestor-dashboard' : '/dashboard'), 1200);
      } else {
        successDiv.innerHTML = `Conta de ${currentRole === 'gestor' ? 'Gestor' : 'Individual'} criada com sucesso!<br/>Você já pode entrar com seu e-mail e senha.`;
        successDiv.style.display = 'block';
        form.reset();
        setTimeout(() => navigate(currentRole === 'gestor' ? '/login?role=gestor' : '/login?role=individual'), 1500);
      }
    } catch (err) {
      let msg = err.message || 'Erro ao criar conta.';
      const lower = (msg || '').toLowerCase();

      if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || err.status === 429) {
        msg = 'Limite de envio de e-mails excedido. Por favor, aguarde cerca de 1 hora antes de tentar novamente com este e-mail, ou cadastre-se utilizando outro endereço de e-mail.';
      } else if (lower.includes('already registered') || lower.includes('user already exists')) {
        msg = 'Este e-mail já está cadastrado no sistema. Por favor, acesse a tela de login.';
      } else if (lower.includes('password should be at least')) {
        msg = 'A senha informada deve possuir no mínimo 6 caracteres.';
      } else if (lower.includes('invalid email')) {
        msg = 'Por favor, informe um endereço de e-mail válido.';
      }

      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = currentRole === 'gestor' ? 'Criar Conta de Gestor' : 'Criar Conta Individual';
    }
  });
}

