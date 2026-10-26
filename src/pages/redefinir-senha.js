import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';

export async function renderRedefinirSenha(app) {
  // Verifica se há parâmetros de erro na URL retornados pelo Supabase (ex: link expirado)
  const fullHash = window.location.hash;
  const urlParams = new URLSearchParams(window.location.search || fullHash.split('?')[1] || '');
  const errorDescription = urlParams.get('error_description') || '';

  // Verifica se o usuário possui uma sessão ativa (estabelecida pelo token de recuperação)
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && !fullHash.includes('access_token')) {
    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-container">
          <div class="auth-header">
            <div class="auth-logo">
              <img src="/logo.png" alt="Logo" class="logo-icon" />
              <h1>マイ個人</h1>
            </div>
            <p class="auth-subtitle">Recuperação de Acesso<br/><span class="jp-text">パスワード再設定</span></p>
          </div>

          <div class="card" style="text-align: center; padding: 2rem 1.5rem; background: #1e293b; border: 1px solid #334155; border-radius: 12px;">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚠️</div>
            <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #f8fafc;">Link Expirado ou Inválido</h2>
            <p style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 1.5rem; line-height: 1.5;">
              ${errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : 'O link de recuperação que você acessou expirou ou já foi utilizado.'}
            </p>
            <a href="#/login" class="btn btn-primary btn-full" style="text-decoration: none;">
              Voltar ao Login e Solicitar Novo Link
            </a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <img src="/logo.png" alt="Logo" class="logo-icon" />
            <h1>マイ個人</h1>
          </div>
          <p class="auth-subtitle">Criar Nova Senha<br/><span class="jp-text">新しいパスワードの設定</span></p>
        </div>

        <form id="redefinir-form" class="auth-form card" style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.75rem;">
          <h2 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: #f8fafc;">Defina sua nova senha</h2>
          <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 1.25rem; line-height: 1.4;">
            Digite uma nova senha segura com no mínimo 6 caracteres.
          </p>

          <div id="redefinir-error" class="alert alert-error" style="display: none; margin-bottom: 1rem; font-size: 0.85rem;"></div>
          <div id="redefinir-success" class="alert alert-success" style="display: none; margin-bottom: 1rem; font-size: 0.85rem;"></div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label for="nova-senha" style="font-size: 0.85rem; color: #cbd5e1;">Nova Senha</label>
            <input type="password" id="nova-senha" placeholder="Mínimo 6 caracteres" required minlength="6" autocomplete="new-password" style="width: 100%;" />
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label for="confirmar-nova-senha" style="font-size: 0.85rem; color: #cbd5e1;">Confirmar Nova Senha</label>
            <input type="password" id="confirmar-nova-senha" placeholder="Repita a nova senha" required minlength="6" autocomplete="new-password" style="width: 100%;" />
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="btn-salvar-nova-senha" style="font-size: 0.95rem; padding: 0.75rem;">
            Salvar Nova Senha
          </button>

          <p class="auth-link" style="margin-top: 1.25rem; text-align: center; font-size: 0.85rem;">
            <a href="#/login">Cancelar e ir para o Login</a>
          </p>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('redefinir-form');
  const errorDiv = document.getElementById('redefinir-error');
  const successDiv = document.getElementById('redefinir-success');
  const btn = document.getElementById('btn-salvar-nova-senha');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const novaSenha = document.getElementById('nova-senha')?.value || '';
    const confirmarSenha = document.getElementById('confirmar-nova-senha')?.value || '';

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    if (novaSenha.length < 6) {
      errorDiv.textContent = 'A senha deve conter no mínimo 6 caracteres.';
      errorDiv.style.display = 'block';
      return;
    }

    if (novaSenha !== confirmarSenha) {
      errorDiv.textContent = 'As senhas digitadas não coincidem.';
      errorDiv.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Salvando nova senha...';

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (error) throw error;

      successDiv.innerHTML = '<strong>Senha atualizada com sucesso!</strong><br/>Redirecionando para o sistema...';
      successDiv.style.display = 'block';

      // Desconecta a sessão de recuperação para exigir login limpo com a nova senha
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 1800);

    } catch (err) {
      errorDiv.textContent = err.message || 'Erro ao redefinir a senha. O link pode ter expirado.';
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Salvar Nova Senha';
    }
  });
}
