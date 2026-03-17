import { supabase } from '../supabaseClient.js';
import { navigate } from '../router.js';

export async function renderCadastro(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <div class="auth-logo">
            <img src="/logo.png" alt="Logo" class="logo-icon" />
            <h1>マイ個人</h1>
          </div>
          <p class="auth-subtitle">Gestão Fiscal para Autônomos no Japão<br/><span class="jp-text">自営業者のための税務管理</span></p>
        </div>

        <form id="cadastro-form" class="auth-form">
          <h2>Criar Conta</h2>

          <div id="cadastro-error" class="alert alert-error" style="display:none;"></div>
          <div id="cadastro-success" class="alert alert-success" style="display:none;"></div>

          <div class="form-group">
            <label for="cadastro-email">Email</label>
            <input type="email" id="cadastro-email" placeholder="seu@email.com" required />
          </div>

          <div class="form-group">
            <label for="cadastro-password">Senha</label>
            <input type="password" id="cadastro-password" placeholder="Mínimo 6 caracteres" required minlength="6" />
          </div>

          <div class="form-group">
            <label for="cadastro-confirm">Confirmar Senha</label>
            <input type="password" id="cadastro-confirm" placeholder="Repita a senha" required minlength="6" />
          </div>

          <button type="submit" class="btn btn-primary btn-full" id="cadastro-btn">
            Criar Conta
          </button>

          <p class="auth-link">
            Já tem conta? <a href="#/login">Entrar</a>
          </p>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('cadastro-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      successDiv.innerHTML = 'Conta criada com sucesso! Verifique seu email para confirmar.<br/>Redirecionando para o login...';
      successDiv.style.display = 'block';
      form.reset();
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      errorDiv.textContent = err.message || 'Erro ao criar conta.';
      errorDiv.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Criar Conta';
    }
  });
}
