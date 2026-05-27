/**
 * SUBJECTS.JS
 * Página de matérias - adicionar, editar, deletar matérias
 */

import { appState } from './state.js';
import * as ui from './ui.js';
import { calculateAverage, generateId } from './utils.js';
import { DEFAULT_SUBJECTS } from './constants.js';

const EMOJIS = ['📚', '📖', '🔬', '🧪', '🔢', '📐', '🖊️', '✏️', '🎨', '🎭', '🎵', '⚽', '🏀', '🏐', '💻', '📱'];
let selectedEmoji = '📚';

/**
 * ═══════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════
 */

export function initSubjects() {
  appState.subscribe((state, action) => {
    if (action.type.includes('SUBJECT') || action.type === 'SET_STATE' || action.type === 'SET_BIMESTRES') {
      renderSubjects();
    }
  });

  renderSubjects();
}

/**
 * ═══════════════════════════════════
 * RENDER
 * ═══════════════════════════════════
 */

function renderSubjects() {
  const state = appState.getState();
  const container = ui.getEl('page-notas');

  if (!container) return;

  ui.clearElement(container);

  // Bimestres selector
  const bimControl = ui.createElement('div', 'form-group');
  const bimLabel = ui.createElement('label', 'form-label', 'Bimestres');
  const bimSelect = ui.createElement('select', 'form-select');
  bimSelect.innerHTML = `
    <option value="2" ${state.bimestres === 2 ? 'selected' : ''}>2 Semestres</option>
    <option value="3" ${state.bimestres === 3 ? 'selected' : ''}>3 Bimestres</option>
    <option value="4" ${state.bimestres === 4 ? 'selected' : ''}>4 Bimestres</option>
  `;
  ui.onChange(bimSelect, (e) => {
    appState.dispatch({
      type: 'SET_BIMESTRES',
      payload: parseInt(e.target.value),
    });
  });
  bimControl.appendChild(bimLabel);
  bimControl.appendChild(bimSelect);
  container.appendChild(bimControl);

  // Subjects list
  const subjectsList = ui.createElement('div', 'stack stack-md');
  if (state.subjects.length === 0) {
    const empty = ui.createElement('div', 'empty-state');
    empty.innerHTML = `
      <div class="empty-state-icon">📕</div>
      <div class="empty-state-title">Nenhuma matéria</div>
      <div class="empty-state-desc">Adicione suas primeiras matérias abaixo</div>
    `;
    subjectsList.appendChild(empty);
  } else {
    state.subjects.forEach((sub, idx) => {
      const card = createSubjectCard(sub, idx);
      subjectsList.appendChild(card);
    });
  }
  container.appendChild(subjectsList);

  // Add button
  const addBtn = ui.createButton('➕ Adicionar Matéria', openAddModal, 'primary');
  addBtn.style.width = '100%';
  container.appendChild(addBtn);

  // Export PDF
  const exportBtn = ui.createButton('📄 Exportar PDF', () => {
    ui.showToast('PDF export em breve', 2000, 'info');
  }, 'outline');
  exportBtn.style.width = '100%';
  container.appendChild(exportBtn);
}

/**
 * ═══════════════════════════════════
 * SUBJECT CARD
 * ═══════════════════════════════════
 */

function createSubjectCard(subject, index) {
  const state = appState.getState();
  const avg = calculateAverage(subject.grades);

  let statusColor = 'var(--text-muted)';
  if (avg !== null) {
    if (avg >= state.profile.minGrade) statusColor = 'var(--success)';
    else if (avg >= state.profile.minGrade - 1) statusColor = 'var(--warning)';
    else statusColor = 'var(--danger)';
  }

  const card = ui.createElement('div', 'card');

  // Header
  const header = ui.createElement('div', 'card-header');
  header.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
      <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
        <span style="font-size: 24px;">${subject.emoji}</span>
        <div>
          <div style="font-weight: 700; color: var(--text-primary);">${subject.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">
            ${subject.faltas || 0} faltas · Meta: ${subject.meta || '—'}
          </div>
        </div>
      </div>
      <div style="font-weight: 800; font-size: 18px; color: ${statusColor};">
        ${avg !== null ? avg.toFixed(1) : '—'}
      </div>
    </div>
  `;
  card.appendChild(header);

  // Body
  const body = ui.createElement('div', 'card-body');

  // Grades grid
  const gradesGrid = ui.createElement('div', 'grid grid-cols-4');
  const bimLabels = ['1º Bim', '2º Bim', '3º Bim', '4º Bim'].slice(0, state.bimestres);

  bimLabels.forEach((label, bimIdx) => {
    const item = ui.createElement('div', 'form-group');
    const lbl = ui.createElement('label', 'form-label', label);
    const input = ui.createElement('input', 'form-input');
    input.type = 'number';
    input.min = '0';
    input.max = '10';
    input.step = '0.1';
    input.value = subject.grades[bimIdx] ?? '';
    input.placeholder = '—';

    ui.onChange(input, (e) => {
      const newGrades = [...subject.grades];
      newGrades[bimIdx] = e.target.value ? parseFloat(e.target.value) : null;

      appState.dispatch({
        type: 'UPDATE_SUBJECT',
        payload: {
          id: subject.id,
          grades: newGrades,
        },
      });
    });

    item.appendChild(lbl);
    item.appendChild(input);
    gradesGrid.appendChild(item);
  });
  body.appendChild(gradesGrid);

  // Meta
  const metaGroup = ui.createElement('div', 'form-group');
  const metaLabel = ui.createElement('label', 'form-label', 'Meta de nota');
  const metaInput = ui.createElement('input', 'form-input');
  metaInput.type = 'number';
  metaInput.min = '0';
  metaInput.max = '10';
  metaInput.step = '0.1';
  metaInput.value = subject.meta ?? '';
  metaInput.placeholder = '8.0';

  ui.onChange(metaInput, (e) => {
    appState.dispatch({
      type: 'UPDATE_SUBJECT',
      payload: {
        id: subject.id,
        meta: e.target.value ? parseFloat(e.target.value) : null,
      },
    });
  });

  metaGroup.appendChild(metaLabel);
  metaGroup.appendChild(metaInput);
  body.appendChild(metaGroup);

  card.appendChild(body);

  // Footer
  const footer = ui.createElement('div', 'card-footer');
  footer.style.display = 'flex';
  footer.style.gap = '8px';

  const editBtn = ui.createButton('✏️ Editar', () => {
    ui.showToast('Edição em desenvolvimento', 1500, 'info');
  }, 'secondary');
  editBtn.style.flex = '1';

  const delBtn = ui.createButton('🗑️ Deletar', () => {
    if (confirm(`Deletar ${subject.name}?`)) {
      appState.dispatch({
        type: 'DELETE_SUBJECT',
        payload: subject.id,
      });
      ui.showToast('Matéria deletada', 1500, 'success');
    }
  }, 'danger');
  delBtn.style.flex = '1';

  footer.appendChild(editBtn);
  footer.appendChild(delBtn);
  card.appendChild(footer);

  return card;
}

/**
 * ═══════════════════════════════════
 * ADD MODAL
 * ═══════════════════════════════════
 */

function openAddModal() {
  selectedEmoji = '📚';

  // Criar modal
  const overlay = ui.createElement('div', 'modal-overlay open');
  const modal = ui.createElement('div', 'modal');

  // Header
  const header = ui.createElement('div', 'modal-header');
  header.innerHTML = '<h2>Adicionar Matéria</h2>';
  modal.appendChild(header);

  // Body
  const body = ui.createElement('div', 'modal-body');

  // Name input
  const nameGroup = ui.createElement('div', 'form-group');
  const nameLabel = ui.createElement('label', 'form-label', 'Nome da matéria');
  const nameInput = ui.createElement('input', 'form-input');
  nameInput.placeholder = 'ex: Matemática';
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  body.appendChild(nameGroup);

  // Emoji picker
  const emojiLabel = ui.createElement('label', 'form-label', 'Escolha um emoji');
  body.appendChild(emojiLabel);

  const emojiPicker = ui.createElement('div', 'grid grid-cols-4');
  EMOJIS.forEach((emoji) => {
    const btn = ui.createElement('button', ['btn', 'btn-secondary']);
    btn.textContent = emoji;
    btn.style.padding = '10px';
    if (emoji === selectedEmoji) {
      btn.classList.add('btn-primary');
    }

    ui.onClick(btn, () => {
      selectedEmoji = emoji;
      // Update visuals
      const allBtns = emojiPicker.querySelectorAll('button');
      allBtns.forEach((b) => {
        if (b.textContent === emoji) {
          b.className = 'btn btn-primary';
          b.style.padding = '10px';
        } else {
          b.className = 'btn btn-secondary';
          b.style.padding = '10px';
        }
      });
    });

    emojiPicker.appendChild(btn);
  });
  body.appendChild(emojiPicker);

  modal.appendChild(body);

  // Footer
  const footer = ui.createElement('div', 'modal-footer');

  const saveBtn = ui.createButton('✅ Adicionar', () => {
    const name = nameInput.value.trim();
    if (!name) {
      ui.showToast('⚠️ Digite o nome', 1500, 'warning');
      return;
    }

    const state = appState.getState();

    const newSubject = {
      id: generateId(),
      name,
      emoji: selectedEmoji,
      grades: Array(state.bimestres).fill(null),
      faltas: 0,
      meta: null,
    };

    appState.dispatch({
      type: 'ADD_SUBJECT',
      payload: newSubject,
    });

    ui.showToast('✅ Matéria adicionada!', 1500, 'success');
    document.body.removeChild(overlay);
  }, 'primary');

  const cancelBtn = ui.createButton('Cancelar', () => {
    document.body.removeChild(overlay);
  }, 'outline');

  footer.appendChild(saveBtn);
  footer.appendChild(cancelBtn);
  modal.appendChild(footer);

  overlay.appendChild(modal);

  // Close on overlay click
  ui.onClick(overlay, (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  document.body.appendChild(overlay);
}

initSubjects();

export default { initSubjects, renderSubjects };
