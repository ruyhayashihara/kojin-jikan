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

    const rawHref = window.location.href;

    // 1. Checa erros de autenticação retornados pelo Supabase (ex: link expirado / token inválido)
    if (rawHref.includes('error=') && (rawHref.includes('error_code=') || rawHref.includes('error_description='))) {
        const errMatch = rawHref.match(/error_description=([^&#]+)/) || rawHref.match(/error=([^&#]+)/);
        const desc = errMatch ? decodeURIComponent(errMatch[1].replace(/\+/g, ' ')) : 'Link de recuperação expirado ou inválido.';
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = `/redefinir-senha?error_description=${encodeURIComponent(desc)}`;
        return;
    }

    // 2. Checa se a URL contém tokens de autenticação (access_token e refresh_token)
    const tokenMatch = rawHref.match(/access_token=([^&#]+)/);
    const refreshMatch = rawHref.match(/refresh_token=([^&#]+)/);
    const typeMatch = rawHref.match(/type=([^&#]+)/);

    if (tokenMatch && refreshMatch) {
        const accessToken = tokenMatch[1];
        const refreshToken = refreshMatch[1];
        const isRecovery = (typeMatch && typeMatch[1] === 'recovery') || rawHref.includes('type=recovery');

        try {
            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            if (error) throw error;

            // Limpa os tokens da URL após autenticar a sessão
            window.history.replaceState(null, '', window.location.pathname);
            window.location.hash = isRecovery ? '/redefinir-senha' : '/dashboard';
            return;
        } catch (err) {
            console.error('Erro ao estabelecer sessão via tokens:', err);
            window.history.replaceState(null, '', window.location.pathname);
            window.location.hash = `/redefinir-senha?error_description=${encodeURIComponent(err.message || 'Falha ao autenticar token de recuperação.')}`;
            return;
        }
    }

    // 3. Suporte a PKCE (code na query string)
    const codeMatch = window.location.search.match(/code=([^&#]+)/);
    if (codeMatch) {
        const code = codeMatch[1];
        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
                const isRecovery = rawHref.includes('type=recovery');
                window.history.replaceState(null, '', window.location.pathname);
                window.location.hash = isRecovery ? '/redefinir-senha' : '/dashboard';
                return;
            }
        } catch (err) {
            console.warn('Erro ao trocar code por sessão:', err);
        }
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
