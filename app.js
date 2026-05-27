/**
 * APP.JS
 * Bootstrap da aplicação
 * Inicializa state, listeners, UI e routing
 */

import { appState } from './state.js';
import { storage } from './storage.js';
import { api } from './api.js';
import * as ui from './ui.js';
import { MOTIVATIONAL_MESSAGES, ROUTES } from './constants.js';
import { calculateStreak } from './utils.js';

/**
 * ═══════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════
 */

/**
 * Inicializa a aplicação
 */
export async function initApp() {
  try {
    console.log('🚀 Iniciando Meu Boletim...');

    // 1. Esconder loading screen
    hideLoadingScreen();

    // 2. Carregar dados do localStorage
    loadDataFromStorage();

    // 3. Setup theme
    setupTheme();

    // 4. Setup event listeners
    setupEventListeners();

    // 5. Render UI inicial
    renderApp();

    // 6. Check onboarding
    checkOnboarding();

    // 7. Setup error handler
    setupErrorHandler();

    // 8. Check API health
    await checkApiHealth();

    // 9. Update streak
    updateStreak();

    console.log('✅ App iniciado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar app:', error);
    ui.showToast('Erro ao inicializar', 3000, 'error');
  }
}

/**
 * ═══════════════════════════════════
 * DATA LOADING
 * ═══════════════════════════════════
 */

/**
 * Carrega dados do localStorage para state
 */
function loadDataFromStorage() {
  try {
    const profile = storage.load('profile', appState.state.profile);
    const subjects = storage.load('subjects', []);
    const provas = storage.load('provas', []);
    const tarefas = storage.load('tarefas', []);
    const chatHistory = storage.load('chatHistory', []);
    const achievements = storage.load('achievements', {});
    const theme = storage.load('theme', 'dark');
    const streak = storage.load('streak', { days: 0, lastUpdate: null });

    // Dispatch para state
    appState.dispatch({
      type: 'SET_STATE',
      payload: {
        profile,
        subjects,
        provas,
        tarefas,
        chatHistory,
        achievements,
        theme,
        streak,
      },
    });

    console.log('✅ Dados carregados do localStorage');
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
    ui.showToast('Erro ao carregar dados salvos', 2000, 'warning');
  }
}

/**
 * ═══════════════════════════════════
 * THEME SETUP
 * ═══════════════════════════════════
 */

/**
 * Setup tema
 */
function setupTheme() {
  const theme = appState.state.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

/**
 * ═══════════════════════════════════
 * EVENT LISTENERS
 * ═══════════════════════════════════
 */

/**
 * Setup de listeners globais
 */
function setupEventListeners() {
  // State changes
  appState.subscribe((state, action) => {
    console.log(`📍 Action: ${action.type}`);

    // Auto-save ao state mudar
    if (action.type !== 'SET_LOADING' && action.type !== 'SET_ERROR') {
      autoSaveState();
    }

    // Re-render quando necessário
    if (shouldRender(action.type)) {
      renderApp();
    }
  });

  // Tab navigation
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab, index) => {
    ui.onClick(tab, () => {
      const routes = Object.values(ROUTES);
      if (routes[index]) {
        navigateTo(routes[index]);
      }
    });
  });

  // Close modals on overlay click
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        ui.closeModal(modal);
      }
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC fecha modals
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-overlay.open');
      openModals.forEach(ui.closeModal);
    }

    // Ctrl+S salva dados
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      autoSaveState();
      ui.showToast('Dados salvos!', 1500, 'success');
    }
  });

  // Save on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      autoSaveState();
      console.log('💾 Auto-saved ao sair da aba');
    }
  });

  // Save before leaving
  window.addEventListener('beforeunload', () => {
    autoSaveState();
  });
}

/**
 * ═══════════════════════════════════
 * NAVIGATION & ROUTING
 * ═══════════════════════════════════
 */

/**
 * Navega para uma página
 */
export function navigateTo(page) {
  // Update state
  appState.dispatch({
    type: 'SET_PAGE',
    payload: page,
  });

  // Update active tab
  const tabs = document.querySelectorAll('.tab');
  const routes = Object.values(ROUTES);
  tabs.forEach((tab, index) => {
    if (routes[index] === page) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Show/hide pages
  const pages = document.querySelectorAll('.page');
  pages.forEach((p) => {
    const pageId = p.id.replace('page-', '');
    if (pageId === page) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  console.log(`📄 Navegou para: ${page}`);
}

/**
 * ═══════════════════════════════════
 * RENDERING
 * ═══════════════════════════════════
 */

/**
 * Renderiza app inteira
 */
function renderApp() {
  // Atualizar header
  updateHeader();

  // Página ativa vai renderizar no próprio componente
  // (ver dashboard.js, subjects.js, etc)
}

/**
 * Atualiza header com dados do state
 */
function updateHeader() {
  const state = appState.getState();

  // Nome
  const nameEl = ui.query('.header-title');
  if (nameEl) {
    nameEl.textContent = state.profile.nick || state.profile.name;
  }

  // Meta
  const metaEl = ui.query('.header-subtitle');
  if (metaEl) {
    const meta = [state.profile.grade, state.profile.class].filter(Boolean).join(' · ');
    metaEl.textContent = meta || '—';
  }

  // Streak
  const streakEl = ui.query('[id^="streak"]');
  if (streakEl) {
    streakEl.textContent = `🔥 Streak: ${state.streak.days} dias`;
  }

  // Motivação
  const motivEl = ui.query('.motivacional');
  if (motivEl) {
    const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    motivEl.textContent = msg;
  }
}

/**
 * ═══════════════════════════════════
 * AUTO SAVE
 * ═══════════════════════════════════
 */

let saveTimeout;

/**
 * Auto-save com debounce
 */
function autoSaveState() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const state = appState.getState();

    // Salvar dados principais
    storage.save('profile', state.profile);
    storage.save('subjects', state.subjects);
    storage.save('provas', state.provas);
    storage.save('tarefas', state.tarefas);
    storage.save('chatHistory', state.chatHistory);
    storage.save('achievements', state.achievements);
    storage.save('theme', state.theme);
    storage.save('streak', state.streak);

    console.log('💾 Auto-saved');
  }, 1000);
}

/**
 * ═══════════════════════════════════
 * STREAK
 * ═══════════════════════════════════
 */

/**
 * Atualiza streak
 */
function updateStreak() {
  const state = appState.getState();
  const today = new Date().toDateString();
  const lastUpdate = state.streak.lastUpdate ? new Date(state.streak.lastUpdate).toDateString() : null;

  if (today !== lastUpdate) {
    const newStreak = calculateStreak(state.streak.lastUpdate || Date.now());
    appState.dispatch({
      type: 'SET_STREAK',
      payload: {
        days: newStreak > 0 ? (state.streak.days || 0) + 1 : 1,
        lastUpdate: new Date().toISOString(),
      },
    });
  }
}

/**
 * ═══════════════════════════════════
 * ONBOARDING
 * ═══════════════════════════════════
 */

/**
 * Verifica se precisa onboarding
 */
function checkOnboarding() {
  const state = appState.getState();

  // Se nome é padrão, mostrar onboarding
  if (state.profile.name === 'Aluno(a)') {
    showOnboarding();
  }
}

/**
 * Mostra flow de onboarding
 */
function showOnboarding() {
  // TODO: Implementar modal de onboarding
  // Por enquanto, apenas log
  console.log('📋 Mostrar onboarding');
}

/**
 * ═══════════════════════════════════
 * API HEALTH
 * ═══════════════════════════════════
 */

/**
 * Verifica se API está online
 */
async function checkApiHealth() {
  try {
    const isOnline = await api.ping();
    if (isOnline) {
      console.log('✅ API online');
    } else {
      console.warn('⚠️ API offline - usando cache local');
    }
  } catch (error) {
    console.warn('⚠️ API offline - usando cache local');
  }
}

/**
 * ═══════════════════════════════════
 * ERROR HANDLING
 * ═══════════════════════════════════
 */

/**
 * Setup error handler global
 */
function setupErrorHandler() {
  window.addEventListener('error', (event) => {
    console.error('💥 Erro global:', event.error);
    ui.showToast('Ocorreu um erro. Tente recarregar.', 3000, 'error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Promise rejection:', event.reason);
    ui.showToast('Erro na operação. Tente novamente.', 3000, 'error');
  });
}

/**
 * ═══════════════════════════════════
 * LOADING SCREEN
 * ═══════════════════════════════════
 */

/**
 * Esconde loading screen
 */
function hideLoadingScreen() {
  const loadingScreen = ui.getEl('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      ui.hideElement(loadingScreen);
    }, 300);
  }
}

/**
 * ═══════════════════════════════════
 * HELPERS
 * ═══════════════════════════════════
 */

/**
 * Verifica se ação deve triggerar re-render
 */
function shouldRender(actionType) {
  const renderActions = [
    'ADD_SUBJECT',
    'UPDATE_SUBJECT',
    'DELETE_SUBJECT',
    'ADD_PROVA',
    'DELETE_PROVA',
    'ADD_TAREFA',
    'UPDATE_TAREFA',
    'DELETE_TAREFA',
    'SET_PROFILE',
    'SET_THEME',
    'UNLOCK_ACHIEVEMENT',
    'SET_PAGE',
  ];

  return renderActions.includes(actionType);
}

/**
 * ═══════════════════════════════════
 * BOOT
 * ═══════════════════════════════════
 */

// Inicia quando DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export default { initApp, navigateTo };
