import { supabase } from './supabaseClient.js';

const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
    routes[path] = handler;
}

export async function navigate(path) {
    window.location.hash = path;
}

export async function handleRoute() {
    const hash = window.location.hash.slice(1) || '/login';
    const app = document.getElementById('app');

    // Cleanup previous page
    if (currentCleanup && typeof currentCleanup === 'function') {
        currentCleanup();
        currentCleanup = null;
    }

    // Handle Supabase OAuth / Email Confirmation redirects
    // Supabase redirects to #access_token=...&refresh_token=...
    if (hash.startsWith('access_token=')) {
        // Supabase client automatically parses the hash and sets the session.
        // We just need to wait a moment and then clean up the URL to show the dashboard.
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = '/dashboard';
        return;
    }

    const publicRoutes = ['/login', '/cadastro'];

    if (!publicRoutes.includes(hash)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.hash = '/login';
            return;
        }
    }

    try {
        const handler = routes[hash];
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
        console.error("Router error handling hash:", hash, error);
        app.innerHTML = `
      <div class="page-container">
        <div class="card" style="text-align:center;">
          <h2>Erro Crítico</h2>
          <p>Erro ao carregar a página.</p>
          <pre style="text-align:left; color:red; margin-top:1rem; font-size:0.8rem;">${error.message}</pre>
        </div>
      </div>
    `;
    }
}

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
