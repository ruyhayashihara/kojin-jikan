import { supabase } from './supabaseClient.js';
import { isUsuarioAdmin } from './licencas-service.js';

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
    routes[path] = handler;
}

export async function navigate(path) {
    window.location.hash = path;
}

export async function handleRoute() {
    const rawHash = window.location.hash.slice(1) || '/login';
    const app = document.getElementById('app');

    // Cleanup previous page
    if (currentCleanup && typeof currentCleanup === 'function') {
        currentCleanup();
        currentCleanup = null;
    }

    // Handle Supabase OAuth / Email Confirmation / Password Recovery redirects
    // Supabase redirects to #access_token=...&refresh_token=... or #error=...
    if (rawHash.startsWith('access_token=') || window.location.hash.includes('access_token=')) {
        const isRecovery = window.location.hash.includes('type=recovery');
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = isRecovery ? '/redefinir-senha' : '/dashboard';
        return;
    }

    if (window.location.hash.includes('error=') && (window.location.hash.includes('error_code=') || window.location.hash.includes('error_description='))) {
        const errParams = new URLSearchParams(window.location.hash.substring(1));
        const desc = errParams.get('error_description') || 'Link expirado ou inválido.';
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = `/redefinir-senha?error_description=${encodeURIComponent(desc)}`;
        return;
    }

    // Extrai o caminho base ignorando query strings (ex: #/cadastro?role=gestor -> /cadastro)
    const [path] = rawHash.split('?');

    const publicRoutes = ['/login', '/cadastro', '/redefinir-senha'];

    if (!publicRoutes.includes(path)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.hash = '/login';
            return;
        }

        // ROTA ADMINISTRATIVA EXCLUSIVA: /admin-licencas
        if (path === '/admin-licencas' && !isUsuarioAdmin(user)) {
            const isGestor = sessionStorage.getItem('keiro_active_role') === 'gestor';
            window.location.hash = isGestor ? '/gestor-dashboard' : '/dashboard';
            return;
        }
    }

    try {
        const handler = routes[path];
        if (handler) {
            const cleanup = await handler(app);
            if (typeof cleanup === 'function') {
                currentCleanup = cleanup;
            }
        } else {
            app.innerHTML = `
      <div class="page-container">
        <div class="card" style="text-align:center;">
          <h2>404</h2>
          <p>Página não encontrada</p>
          <a href="#/login" class="btn btn-primary">Voltar ao login</a>
        </div>
      </div>
    `;
        }
    } catch (error) {
        console.error("Router error handling path:", path, error);
        app.innerHTML = `
      <div class="page-container">
        <div class="card" style="text-align:center;">
          <h2>Erro Crítico</h2>
          <p>Ocorreu um erro ao carregar a página. Tente novamente.</p>
          <a href="#/login" class="btn btn-primary" style="margin-top:1rem;">Voltar ao login</a>
        </div>
      </div>
    `;
    }
}

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
