import { supabase } from './supabaseClient.js';
import { navigate } from './router.js';
import { exportarMesPDF } from './pdf-export.js';
import { openModalAtivacao } from './modal-ativacao.js';

const GESTOR_NAV_ITEMS = [
  {
    id: 'gestor-dashboard', label: 'Painel Gestor', href: '#/gestor-dashboard',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
  },
  {
    id: 'gestor-trabalhadores', label: 'Trabalhadores (IDs)', href: '#/gestor-trabalhadores',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
  },
  {
    id: 'registro-horas', label: 'Apontamento de Horas', href: '#/registro-horas',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
  },
  {
    id: 'exportar-pdf', label: 'Exportar Folhas (PDF)', href: '#exportar-pdf',
    isAction: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
  }
];

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
  {
    id: 'exportar-pdf', label: 'Exportar Mês (PDF)', href: '#exportar-pdf',
    isAction: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
  },
];

const SECONDARY_ITEMS = [
  {
    id: 'ativar-chave', label: 'Ativar Chave / Licença', href: '#ativar-chave',
    isAction: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9l-1.5-1.5L5 9l-3 3 7 7 3-3-1.5-1.5L12 13l1.5 1.5L15 13l1.5 1.5L18 13l3.5-3.5a5 5 0 0 0-7-7z"/><circle cx="15.5" cy="8.5" r="1.5"/></svg>'
  },
  {
    id: 'admin-licencas', label: 'Gestão de Licenças (Admin)', href: '#/admin-licencas',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  },
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
  const isGestor = sessionStorage.getItem('keiro_active_role') === 'gestor';
  const navList = isGestor ? GESTOR_NAV_ITEMS : NAV_ITEMS;

  function renderItem(item) {
    if (item.isAction) {
      return `
        <button type="button" class="sidebar-item sidebar-action-btn" id="sidebar-action-${item.id}" title="${item.label}">
          <span class="sidebar-icon">${item.icon}</span>
          <span class="sidebar-label">${item.label}</span>
        </button>`;
    }
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
      <a href="${isGestor ? '#/gestor-dashboard' : '#/dashboard'}" class="mobile-brand">
        <img src="/logo.png" alt="Logo" class="logo-icon-sm" />
        <span class="mobile-brand-title">マイ個人</span>
        ${isGestor ? '<span class="badge-role-gestor" style="margin-left: 6px;">管理者</span>' : ''}
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
        <a href="${isGestor ? '#/gestor-dashboard' : '#/dashboard'}" class="sidebar-brand">
          <img src="/logo.png" alt="Logo" class="sidebar-brand-icon" />
          <span class="sidebar-brand-text">マイ個人</span>
          ${isGestor ? '<span class="badge-role-gestor" style="margin-left: 6px;">管理者</span>' : ''}
        </a>
        <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Recolher menu">
          ${collapsed ? ICON_EXPAND : ICON_COLLAPSE}
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section">
          ${navList.map(renderItem).join('')}
        </div>

        <div class="sidebar-divider"></div>

        <div class="sidebar-section">
          <button type="button" class="sidebar-item" id="btn-toggle-role" style="font-size: 0.78rem; opacity: 0.85;" title="${isGestor ? 'Mudar para Visão Individual' : 'Mudar para Visão de Gestor'}">
            <span class="sidebar-icon">${isGestor ? '👤' : '🏢'}</span>
            <span class="sidebar-label">${isGestor ? 'Ver Modo Individual' : 'Painel do Gestor'}</span>
          </button>
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
    </aside>

    <!-- Modal Global de Exportação de Mês em PDF -->
    <div id="modal-export-mes-global" class="modal-overlay" style="display: none;">
      <div class="modal card" style="max-width: 480px; width: 92%; padding: 1.5rem;">
        <div class="modal-header" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-text);">Exportar Mês em PDF</h2>
            <p style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px;">Selecione o período para gerar a Folha de Ponto (勤務実績表)</p>
          </div>
          <button type="button" id="modal-export-close-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted); line-height: 1;">&times;</button>
        </div>

        <div class="modal-body" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group" style="gap: 0.25rem;">
              <label for="export-sel-year" style="font-size: 0.8rem; font-weight: 600; color: var(--color-text);">Ano (年)</label>
              <select id="export-sel-year" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 0.88rem;"></select>
            </div>
            <div class="form-group" style="gap: 0.25rem;">
              <label for="export-sel-month" style="font-size: 0.8rem; font-weight: 600; color: var(--color-text);">Mês (月)</label>
              <select id="export-sel-month" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 0.88rem;"></select>
            </div>
          </div>

          <!-- Card de Prévia do Mês -->
          <div id="export-preview-card" style="background: rgba(0,0,0,0.03); border: 1px solid var(--color-border); border-radius: 8px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text); display: flex; justify-content: space-between;">
              <span id="export-preview-title">—</span>
              <span id="export-preview-status" style="font-size: 0.75rem; color: #10b981;">Carregando...</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.82rem;">
              <div><span style="color: var(--color-text-muted);">Horas Trabalhadas:</span> <strong id="export-preview-horas">0h</strong></div>
              <div><span style="color: var(--color-text-muted);">Horas Extras (>8h):</span> <strong id="export-preview-extras" style="color: #d97706;">0h</strong></div>
              <div><span style="color: var(--color-text-muted);">Adic. Noturno (22h-5h):</span> <strong id="export-preview-noturno" style="color: #7c3aed;">0h</strong></div>
              <div><span style="color: var(--color-text-muted);">Líquido Estimado:</span> <strong id="export-preview-liquido" style="color: #059669;">¥0</strong></div>
            </div>
          </div>

          <div style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4;">
            ⚖️ <em>O PDF gerado traz o relatório com cálculo automático dos adicionais de 25% (horas extras e noturnas), tabela diária completa e espaço para assinatura.</em>
          </div>
        </div>

        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
          <button type="button" id="modal-export-btn-goto" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.45rem 0.75rem;" title="Abrir este mês na tela de Registro de Horas">
            Abrir Timesheet
          </button>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" id="modal-export-btn-cancel" class="btn btn-outline" style="font-size: 0.8rem; padding: 0.45rem 0.75rem;">
              Cancelar
            </button>
            <button type="button" id="modal-export-btn-confirm" class="btn btn-primary" style="font-size: 0.8rem; padding: 0.45rem 0.85rem; display: inline-flex; align-items: center; gap: 0.35rem;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Exportar PDF
            </button>
          </div>
        </div>
      </div>
    </div>`;
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

  // Role toggle (Individual <-> Gestor)
  document.getElementById('btn-toggle-role')?.addEventListener('click', (e) => {
    e.preventDefault();
    const isGestor = sessionStorage.getItem('keiro_active_role') === 'gestor';
    const nextRole = isGestor ? 'individual' : 'gestor';
    sessionStorage.setItem('keiro_active_role', nextRole);
    navigate(nextRole === 'gestor' ? '/gestor-dashboard' : '/dashboard');
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

  // Modal de Ativação de Chave / Licença
  document.getElementById('sidebar-action-ativar-chave')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('sidebar')?.classList.remove('sidebar-mobile-open');
    document.getElementById('sidebar-overlay')?.classList.remove('sidebar-overlay-visible');
    openModalAtivacao({
      onSucesso: () => {
        window.location.reload();
      }
    });
  });

  // Modal Global de Exportação de Mês em PDF
  const btnExportPdf = document.getElementById('sidebar-action-exportar-pdf');
  const modalExport = document.getElementById('modal-export-mes-global');
  const selExpYear = document.getElementById('export-sel-year');
  const selExpMonth = document.getElementById('export-sel-month');
  const btnExpConfirm = document.getElementById('modal-export-btn-confirm');
  const btnExpGoto = document.getElementById('modal-export-btn-goto');
  const btnExpCancel = document.getElementById('modal-export-btn-cancel');
  const btnExpClose = document.getElementById('modal-export-close-btn');

  if (btnExportPdf && modalExport) {
    const MESES_NOME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth() + 1;

    // Popula opções de ano
    if (selExpYear && selExpYear.children.length === 0) {
      for (let y = currYear - 3; y <= currYear + 1; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = `${y}年 (${y})`;
        if (y === currYear) opt.selected = true;
        selExpYear.appendChild(opt);
      }
    }

    // Popula opções de mês
    if (selExpMonth && selExpMonth.children.length === 0) {
      MESES_NOME.forEach((name, i) => {
        const m = i + 1;
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `${m}月 — ${name}`;
        if (m === currMonth) opt.selected = true;
        selExpMonth.appendChild(opt);
      });
    }

    async function updateExportPreview() {
      const y = parseInt(selExpYear?.value) || currYear;
      const m = parseInt(selExpMonth?.value) || currMonth;
      const titleEl = document.getElementById('export-preview-title');
      const statusEl = document.getElementById('export-preview-status');
      const hEl = document.getElementById('export-preview-horas');
      const exEl = document.getElementById('export-preview-extras');
      const notEl = document.getElementById('export-preview-noturno');
      const liqEl = document.getElementById('export-preview-liquido');

      if (titleEl) titleEl.textContent = `${MESES_NOME[m - 1]} ${y}`;
      if (statusEl) { statusEl.textContent = 'Buscando dados...'; statusEl.style.color = '#64748b'; }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Busca resumo mensal
        const { data: res } = await supabase
          .from('resumo_mensal')
          .select('*')
          .eq('usuario_id', user.id)
          .eq('ano', y)
          .eq('mes', m)
          .maybeSingle();

        if (res && (parseFloat(res.total_horas) > 0 || parseFloat(res.subtotal_bruto) > 0)) {
          if (statusEl) { statusEl.textContent = 'Dados consolidados'; statusEl.style.color = '#10b981'; }
          if (hEl) hEl.textContent = `${parseFloat(Number(res.total_horas).toFixed(2))}h`;
          if (exEl) exEl.textContent = `${parseFloat(Number(res.total_horas_extras || 0).toFixed(2))}h`;
          if (notEl) notEl.textContent = `${parseFloat(Number(res.total_horas_noturnas || 0).toFixed(2))}h`;
          if (liqEl) liqEl.textContent = `¥${Math.round(res.total_liquido || 0).toLocaleString('ja-JP')}`;
        } else {
          // Se não houver resumo consolidado, consulta registros diários do mês
          const { data: regs } = await supabase
            .from('registro_diario')
            .select('total_horas, horas_extras, adicional_noturno, valor_diario')
            .eq('usuario_id', user.id)
            .eq('ano', y)
            .eq('mes', m);

          if (regs && regs.length > 0) {
            const sumHoras = regs.reduce((s, r) => s + (parseFloat(r.total_horas) || 0), 0);
            const sumExtras = regs.reduce((s, r) => s + (parseFloat(r.horas_extras) || 0), 0);
            const sumNoturno = regs.reduce((s, r) => s + (parseFloat(r.adicional_noturno) || 0), 0);
            if (statusEl) { statusEl.textContent = `${regs.length} dias registrados`; statusEl.style.color = '#10b981'; }
            if (hEl) hEl.textContent = `${parseFloat(sumHoras.toFixed(2))}h`;
            if (exEl) exEl.textContent = `${parseFloat(sumExtras.toFixed(2))}h`;
            if (notEl) notEl.textContent = `${parseFloat(sumNoturno.toFixed(2))}h`;
            if (liqEl) liqEl.textContent = 'Calculado no PDF';
          } else {
            if (statusEl) { statusEl.textContent = 'Sem registros no mês'; statusEl.style.color = '#94a3b8'; }
            if (hEl) hEl.textContent = '0h';
            if (exEl) exEl.textContent = '0h';
            if (notEl) notEl.textContent = '0h';
            if (liqEl) liqEl.textContent = '¥0';
          }
        }
      } catch (e) {
        if (statusEl) { statusEl.textContent = 'Erro ao consultar'; statusEl.style.color = '#ef4444'; }
      }
    }

    btnExportPdf.addEventListener('click', (e) => {
      e.preventDefault();
      // Fecha sidebar no mobile
      document.getElementById('sidebar')?.classList.remove('sidebar-mobile-open');
      document.getElementById('sidebar-overlay')?.classList.remove('sidebar-overlay-visible');
      modalExport.style.display = 'flex';
      updateExportPreview();
    });

    selExpYear?.addEventListener('change', updateExportPreview);
    selExpMonth?.addEventListener('change', updateExportPreview);

    btnExpClose?.addEventListener('click', () => { modalExport.style.display = 'none'; });
    btnExpCancel?.addEventListener('click', () => { modalExport.style.display = 'none'; });
    modalExport.addEventListener('click', (e) => {
      if (e.target === modalExport) modalExport.style.display = 'none';
    });

    btnExpGoto?.addEventListener('click', () => {
      const y = selExpYear?.value || String(currYear);
      const m = selExpMonth?.value || String(currMonth);
      sessionStorage.setItem('keiro_nav_year', y);
      sessionStorage.setItem('keiro_nav_month', m);
      modalExport.style.display = 'none';
      navigate('/registro-horas');
    });

    btnExpConfirm?.addEventListener('click', async () => {
      const y = parseInt(selExpYear?.value) || currYear;
      const m = parseInt(selExpMonth?.value) || currMonth;
      btnExpConfirm.disabled = true;
      btnExpConfirm.textContent = 'Gerando PDF...';

      let printWin = null;
      try {
        printWin = window.open('about:blank', '_blank');
        if (printWin) {
          printWin.document.write('<!DOCTYPE html><html><head><title>Gerando PDF...</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;"><div style="text-align:center;"><div style="font-size:24px;margin-bottom:12px;">⏳</div><div style="font-size:16px;font-weight:600;margin-bottom:6px;">Gerando Folha de Ponto / 勤務実績表...</div><div style="font-size:13px;color:#94a3b8;">Aguarde um instante enquanto compilamos os dados.</div></div></body></html>');
          printWin.document.close();
        }
      } catch (e) { }

      try {
        await exportarMesPDF({ ano: y, mes: m, targetWindow: printWin });
        modalExport.style.display = 'none';
      } catch (err) {
        if (printWin && !printWin.closed) printWin.close();
        console.error('Erro ao exportar PDF:', err);
        alert('Erro ao exportar PDF: ' + (err.message || err));
      } finally {
        btnExpConfirm.disabled = false;
        btnExpConfirm.innerHTML = `
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Exportar PDF
        `;
      }
    });
  }
}
