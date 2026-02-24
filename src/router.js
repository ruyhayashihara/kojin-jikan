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

    const publicRoutes = ['/login', '/cadastro'];

    if (!publicRoutes.includes(hash)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.hash = '/login';
            return;
        }
    }

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
}

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
