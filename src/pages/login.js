import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';

export async function renderLogin(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <span class="logo-icon">鳥</span>
            <h1>マイ個人</h1>
          </div>
          <p class="auth-subtitle">Gestão Fiscal para Autônomos no Japão<br/><span class="jp-text">自営業者のための税務管理</span></p>
        </div>

        <form id="login-form" class="auth-form">
          <h2>Entrar</h2>

          <div id="login-error" class="alert alert-error" style="display:none;"></div>
          <div id="login-success" class="alert alert-success" style="display:none;"></div>

          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" placeholder="seu@email.com" required />
          </div>

          <div class="form-group">
            <label for="login-password">Senha</label>
            <input type="password" id="login-password" placeholder="Sua senha" required minlength="6" />
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="login-btn">
            Entrar
          </button>

          <p class="auth-link">
            Não tem conta? <a href="#/cadastro">Criar conta</a>
          </p>
        </form>
      </div>
    </div>
  `;

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
      successDiv.textContent = 'Login realizado com sucesso!';
      successDiv.style.display = 'block';
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      errorDiv.textContent = err.message || 'Erro ao fazer login.';
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
}
