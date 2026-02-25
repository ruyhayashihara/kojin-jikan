import { supabase } from './supabaseClient.js';
import { navigate } from './router.js';

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Dashboard', href: '#/dashboard',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
  },
  {
    id: 'registro-horas', label: 'Registro de Horas', href: '#/registro-horas',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  },
  {
    id: 'recibos', label: 'Recibos', href: '#/recibos',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  },
  {
    id: 'despesas', label: 'Despesas', href: '#/despesas',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
  },
  {
    id: 'declaracao', label: 'Declaração', href: '#/declaracao',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
  },
  {
    id: 'historico', label: 'Histórico', href: '#/historico',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
  },
];

const SECONDARY_ITEMS = [
  {
    id: 'configuracoes', label: 'Configurações', href: '#/configuracoes',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
  },
];

const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const ICON_COLLAPSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
const ICON_LOGOUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
const ICON_HAMBURGER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

// Initialize theme
function initTheme() {
  const saved = localStorage.getItem('keiro_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

// Initialize sidebar collapsed state
function isSidebarCollapsed() {
  return localStorage.getItem('keiro_sidebar') === 'collapsed';
}

export function renderSidebar(activePage) {
  const collapsed = isSidebarCollapsed();
  const theme = localStorage.getItem('keiro_theme') || 'light';
  const isDark = theme === 'dark';

  function renderItem(item) {
    const isActive = item.id === activePage;
    return `
      <a href="${item.href}" class="sidebar-item ${isActive ? 'sidebar-item-active' : ''}" title="${item.label}">
        <span class="sidebar-icon">${item.icon}</span>
        <span class="sidebar-label">${item.label}</span>
      </a>`;
  }

  return `
    <!-- Mobile top bar -->
    <div class="mobile-topbar">
      <a href="#/dashboard" class="mobile-brand">
        <span class="mobile-brand-title">マイ個人</span>
      </a>
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Menu">
        ${ICON_HAMBURGER}
      </button>
    </div>

    <!-- Sidebar overlay (mobile) -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>

    <!-- Sidebar -->
    <aside class="sidebar ${collapsed ? 'sidebar-collapsed' : ''}" id="sidebar">
      <div class="sidebar-header">
        <a href="#/dashboard" class="sidebar-brand">
          <span class="sidebar-brand-text">マイ個人</span>
        </a>
        <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Recolher menu">
          ${collapsed ? ICON_EXPAND : ICON_COLLAPSE}
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section">
          ${NAV_ITEMS.map(renderItem).join('')}
        </div>

        <div class="sidebar-divider"></div>

        <div class="sidebar-section">
          ${SECONDARY_ITEMS.map(renderItem).join('')}
          <button class="sidebar-item sidebar-logout" id="sidebar-logout" title="Sair">
            <span class="sidebar-icon">${ICON_LOGOUT}</span>
            <span class="sidebar-label">Sair</span>
          </button>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button class="sidebar-theme-btn" id="sidebar-theme-btn" title="${isDark ? 'Modo claro' : 'Modo escuro'}">
          <span class="sidebar-icon">${isDark ? ICON_SUN : ICON_MOON}</span>
          <span class="sidebar-label">${isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
      </div>
    </aside>`;
}

export function bindSidebarEvents() {
  initTheme();

  // Mobile menu toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('sidebar-mobile-open');
    document.getElementById('sidebar-overlay')?.classList.add('sidebar-overlay-visible');
  });

  // Close sidebar (overlay click)
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('sidebar-mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('sidebar-overlay-visible');
  });

  // Collapse/expand toggle (desktop)
  document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('sidebar-collapsed');
    localStorage.setItem('keiro_sidebar', isCollapsed ? 'collapsed' : 'expanded');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (btn) btn.innerHTML = isCollapsed ? ICON_EXPAND : ICON_COLLAPSE;
  });

  // Theme toggle
  document.getElementById('sidebar-theme-btn')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('keiro_theme', next);
    // Update button
    const btn = document.getElementById('sidebar-theme-btn');
    if (btn) {
      const icon = btn.querySelector('.sidebar-icon');
      const label = btn.querySelector('.sidebar-label');
      if (icon) icon.innerHTML = next === 'dark' ? ICON_SUN : ICON_MOON;
      if (label) label.textContent = next === 'dark' ? 'Modo Claro' : 'Modo Escuro';
      btn.title = next === 'dark' ? 'Modo claro' : 'Modo escuro';
    }
  });

  // Logout
  document.getElementById('sidebar-logout')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    navigate('/login');
  });

  // Close sidebar on nav link click (mobile)
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('sidebar-mobile-open');
      document.getElementById('sidebar-overlay')?.classList.remove('sidebar-overlay-visible');
    });
  });
}
