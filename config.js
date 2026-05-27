/**
 * CONFIG.JS
 * Página de configurações, perfil, tema e export/import de dados
 */

import { appState } from './state.js';
import { storage } from './storage.js';
import * as ui from './ui.js';
import { downloadJSON, readJSON } from './utils.js';

/**
 * ═══════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════
 */

export function initConfig() {
  appState.subscribe((state, action) => {
    if (action.type === 'SET_PROFILE' || action.type === 'SET_THEME' || action.type === 'SET_STATE') {
      renderConfig();
    }
  });

  renderConfig();
}

/**
 * ═══════════════════════════════════
 * RENDER
 * ═══════════════════════════════════
 */

function renderConfig() {
  const container = ui.getEl('page-config');
  if (!container) return;

  ui.clearElement(container);

  // Profile section
  const profileSection = createProfileSection();
  container.appendChild(profileSection);

  // Theme section
  const themeSection = createThemeSection();
  container.appendChild(themeSection);

  // Data section
  const dataSection = createDataSection();
  container.appendChild(dataSection);

  // Stats section
  const statsSection = createStatsSection();
  container.appendChild(statsSection);

  // Danger zone
  const dangerSection = createDangerZone();
  container.appendChild(dangerSection);
}

/**
 * ═══════════════════════════════════
 * PROFILE SECTION
 * ═══════════════════════════════════
 */

function createProfileSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '👤 Perfil');
  section.appendChild(title);

  const card = ui.createElement('div', 'card');

  // Profile picture
  const picGroup = ui.createElement('div', 'form-group');
  const picLabel = ui.createElement('label', 'form-label', 'Foto de Perfil');

  const picContainer = ui.createElement('div');
  picContainer.style.display = 'flex';
  picContainer.style.gap = '12px';
  picContainer.style.alignItems = 'center';
  picContainer.style.marginBottom = '12px';

  const pic = ui.createElement('div');
  pic.style.width = '80px';
  pic.style.height = '80px';
  pic.style.borderRadius = '50%';
  pic.style.background = 'var(--primary)';
  pic.style.display = 'flex';
  pic.style.alignItems = 'center';
  pic.style.justifyContent = 'center';
  pic.style.fontSize = '32px';
  pic.style.fontWeight = 'bold';
  pic.textContent = state.profile.name?.charAt(0)?.toUpperCase() || '👤';

  if (state.profile.profilePic) {
    pic.style.backgroundImage = `url(${state.profile.profilePic})`;
    pic.style.backgroundSize = 'cover';
    pic.style.backgroundPosition = 'center';
    pic.textContent = '';
  }

  const uploadDiv = ui.createElement('div');
  uploadDiv.style.flex = '1';

  const uploadInput = ui.createElement('input');
  uploadInput.type = 'file';
  uploadInput.accept = 'image/*';
  uploadInput.style.display = 'none';
  uploadInput.id = 'pic-upload';

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        appState.dispatch({
          type: 'SET_PROFILE',
          payload: { profilePic: base64 },
        });
        ui.showToast('✅ Foto atualizada', 1500, 'success');
      };
      reader.readAsDataURL(file);
    }
  });

  const uploadBtn = ui.createButton('📷 Escolher Foto', () => {
    document.getElementById('pic-upload').click();
  }, 'secondary');
  uploadBtn.style.width = '100%';

  uploadDiv.appendChild(uploadInput);
  uploadDiv.appendChild(uploadBtn);

  picContainer.appendChild(pic);
  picContainer.appendChild(uploadDiv);

  const bodyEl = ui.createElement('div', 'card-body');
  bodyEl.appendChild(picLabel);
  bodyEl.appendChild(picContainer);

  // Name
  const nameGroup = ui.createElement('div', 'form-group');
  const nameLabel = ui.createElement('label', 'form-label', 'Nome Completo');
  const nameInput = ui.createElement('input', 'form-input');
  nameInput.value = state.profile.name;
  ui.onChange(nameInput, (e) => {
    appState.dispatch({
      type: 'SET_PROFILE',
      payload: { name: e.target.value },
    });
  });
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  bodyEl.appendChild(nameGroup);

  // Nick
  const nickGroup = ui.createElement('div', 'form-group');
  const nickLabel = ui.createElement('label', 'form-label', 'Apelido (mostrado no header)');
  const nickInput = ui.createElement('input', 'form-input');
  nickInput.value = state.profile.nick || '';
  ui.onChange(nickInput, (e) => {
    appState.dispatch({
      type: 'SET_PROFILE',
      payload: { nick: e.target.value },
    });
  });
  nickGroup.appendChild(nickLabel);
  nickGroup.appendChild(nickInput);
  bodyEl.appendChild(nickGroup);

  // Grade
  const gradeGroup = ui.createElement('div', 'form-group');
  const gradeLabel = ui.createElement('label', 'form-label', 'Série');
  const gradeInput = ui.createElement('input', 'form-input');
  gradeInput.value = state.profile.grade || '';
  ui.onChange(gradeInput, (e) => {
    appState.dispatch({
      type: 'SET_PROFILE',
      payload: { grade: e.target.value },
    });
  });
  gradeGroup.appendChild(gradeLabel);
  gradeGroup.appendChild(gradeInput);
  bodyEl.appendChild(gradeGroup);

  // School
  const schoolGroup = ui.createElement('div', 'form-group');
  const schoolLabel = ui.createElement('label', 'form-label', 'Escola');
  const schoolInput = ui.createElement('input', 'form-input');
  schoolInput.value = state.profile.school || '';
  ui.onChange(schoolInput, (e) => {
    appState.dispatch({
      type: 'SET_PROFILE',
      payload: { school: e.target.value },
    });
  });
  schoolGroup.appendChild(schoolLabel);
  schoolGroup.appendChild(schoolInput);
  bodyEl.appendChild(schoolGroup);

  // Min grade
  const minGradeGroup = ui.createElement('div', 'form-group');
  const minGradeLabel = ui.createElement('label', 'form-label', 'Nota Mínima para Passar');
  const minGradeInput = ui.createElement('input', 'form-input');
  minGradeInput.type = 'number';
  minGradeInput.min = '0';
  minGradeInput.max = '10';
  minGradeInput.step = '0.5';
  minGradeInput.value = state.profile.minGrade;
  ui.onChange(minGradeInput, (e) => {
    appState.dispatch({
      type: 'SET_PROFILE',
      payload: { minGrade: parseFloat(e.target.value) },
    });
  });
  minGradeGroup.appendChild(minGradeLabel);
  minGradeGroup.appendChild(minGradeInput);
  bodyEl.appendChild(minGradeGroup);

  card.appendChild(bodyEl);
  section.appendChild(card);

  return section;
}

/**
 * ═══════════════════════════════════
 * THEME SECTION
 * ═══════════════════════════════════
 */

function createThemeSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '🎨 Aparência');
  section.appendChild(title);

  const card = ui.createElement('div', 'card');
  const body = ui.createElement('div', 'card-body');

  const label = ui.createElement('label', 'form-label', 'Tema');
  body.appendChild(label);

  const grid = ui.createElement('div', 'grid grid-cols-2');
  grid.style.gap = '12px';

  // Dark theme
  const darkBtn = ui.createElement('button', [
    'btn',
    state.theme === 'dark' ? 'btn-primary' : 'btn-secondary',
  ]);
  darkBtn.innerHTML = '🌙 Escuro';
  ui.onClick(darkBtn, () => {
    appState.dispatch({
      type: 'SET_THEME',
      payload: 'dark',
    });
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    renderConfig();
  });
  grid.appendChild(darkBtn);

  // Light theme
  const lightBtn = ui.createElement('button', [
    'btn',
    state.theme === 'light' ? 'btn-primary' : 'btn-secondary',
  ]);
  lightBtn.innerHTML = '☀️ Claro';
  ui.onClick(lightBtn, () => {
    appState.dispatch({
      type: 'SET_THEME',
      payload: 'light',
    });
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
    renderConfig();
  });
  grid.appendChild(lightBtn);

  body.appendChild(grid);
  card.appendChild(body);
  section.appendChild(card);

  return section;
}

/**
 * ═══════════════════════════════════
 * DATA SECTION (EXPORT/IMPORT)
 * ═══════════════════════════════════
 */

function createDataSection() {
  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '💾 Dados');
  section.appendChild(title);

  const card = ui.createElement('div', 'card');
  const body = ui.createElement('div', 'card-body');

  const desc = ui.createElement('p');
  desc.style.fontSize = 'var(--text-sm)';
  desc.style.color = 'var(--text-muted)';
  desc.style.marginBottom = '16px';
  desc.textContent = 'Faça backup de seus dados ou importe um backup anterior.';
  body.appendChild(desc);

  // Export button
  const exportBtn = ui.createElement('button', 'btn btn-primary');
  exportBtn.innerHTML = '📥 Exportar Dados';
  exportBtn.style.width = '100%';
  exportBtn.style.marginBottom = '8px';

  ui.onClick(exportBtn, () => {
    const exported = storage.exportAll();
    downloadJSON(exported, `boletim-backup-${new Date().toISOString().split('T')[0]}.json`);
    ui.showToast('✅ Dados exportados', 1500, 'success');
  });

  body.appendChild(exportBtn);

  // Import button
  const importBtn = ui.createElement('button', 'btn btn-secondary');
  importBtn.innerHTML = '📤 Importar Dados';
  importBtn.style.width = '100%';

  const importInput = ui.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.style.display = 'none';
  importInput.id = 'import-input';

  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const data = await readJSON(file);
        if (storage.importData(data)) {
          ui.showToast('✅ Dados importados! Recarrege a página', 2000, 'success');
          setTimeout(() => window.location.reload(), 2500);
        } else {
          ui.showToast('❌ Erro ao importar', 1500, 'error');
        }
      } catch (error) {
        ui.showToast('❌ Arquivo inválido', 1500, 'error');
      }
    }
  });

  ui.onClick(importBtn, () => {
    document.getElementById('import-input').click();
  });

  body.appendChild(importInput);
  body.appendChild(importBtn);

  card.appendChild(body);
  section.appendChild(card);

  return section;
}

/**
 * ═══════════════════════════════════
 * STATS SECTION
 * ═══════════════════════════════════
 */

function createStatsSection() {
  const state = appState.getState();
  const stats = storage.getStats();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '📊 Informações');
  section.appendChild(title);

  const card = ui.createElement('div', 'card');
  const body = ui.createElement('div', 'card-body');

  const grid = ui.createElement('div', 'grid grid-cols-2');
  grid.style.gap = '16px';

  // Matérias
  const subItem = ui.createElement('div');
  subItem.innerHTML = `
    <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${state.subjects.length}</div>
    <div style="font-size: 12px; color: var(--text-muted);">Matérias</div>
  `;
  grid.appendChild(subItem);

  // Provas
  const provasItem = ui.createElement('div');
  provasItem.innerHTML = `
    <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${state.provas.length}</div>
    <div style="font-size: 12px; color: var(--text-muted);">Provas</div>
  `;
  grid.appendChild(provasItem);

  // Tarefas
  const tarefasItem = ui.createElement('div');
  tarefasItem.innerHTML = `
    <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${state.tarefas.filter((t) => !t.done).length}</div>
    <div style="font-size: 12px; color: var(--text-muted);">Tarefas</div>
  `;
  grid.appendChild(tarefasItem);

  // Conquistas
  const achItem = ui.createElement('div');
  achItem.innerHTML = `
    <div style="font-size: 24px; font-weight: 800; color: var(--primary);">${Object.keys(state.achievements).length}</div>
    <div style="font-size: 12px; color: var(--text-muted);">Conquistas</div>
  `;
  grid.appendChild(achItem);

  body.appendChild(grid);

  // Storage info
  const storageDiv = ui.createElement('div');
  storageDiv.style.marginTop = '16px';
  storageDiv.style.paddingTop = '16px';
  storageDiv.style.borderTop = '1px solid var(--border-color)';
  storageDiv.innerHTML = `
    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">
      💾 Espaço usado: ${stats.sizeKb} KB
    </div>
    <div style="font-size: 12px; color: var(--text-muted);">
      📦 Items: ${stats.items}
    </div>
  `;
  body.appendChild(storageDiv);

  card.appendChild(body);
  section.appendChild(card);

  return section;
}

/**
 * ═══════════════════════════════════
 * DANGER ZONE
 * ═══════════════════════════════════
 */

function createDangerZone() {
  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title');
  title.textContent = '⚠️ Zona de Risco';
  title.style.color = 'var(--danger)';
  section.appendChild(title);

  const card = ui.createElement('div', 'card');
  card.style.borderColor = 'var(--danger)';

  const body = ui.createElement('div', 'card-body');

  const warning = ui.createElement('p');
  warning.style.color = 'var(--danger)';
  warning.style.fontSize = 'var(--text-sm)';
  warning.style.marginBottom = '16px';
  warning.textContent = 'Essas ações não podem ser desfeitas. Seja cuidadoso!';
  body.appendChild(warning);

  // Clear all
  const clearBtn = ui.createButton('🗑️ Limpar Tudo', () => {
    if (confirm('Tem certeza? Isso vai deletar TODOS os dados locais!')) {
      if (confirm('Realmente tem certeza? Essa ação não pode ser desfeita!')) {
        storage.clear();
        appState.dispatch({
          type: 'RESET_STATE',
        });
        ui.showToast('✅ Dados limpos. Recarregando...', 2000, 'success');
        setTimeout(() => window.location.reload(), 2500);
      }
    }
  }, 'danger');
  clearBtn.style.width = '100%';

  body.appendChild(clearBtn);
  card.appendChild(body);
  section.appendChild(card);

  return section;
}

initConfig();

export default { initConfig, renderConfig };
