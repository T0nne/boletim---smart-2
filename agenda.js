/**
 * AGENDA.JS
 * Página de provas, tarefas, faltas e calculadora
 */

import { appState } from './state.js';
import * as ui from './ui.js';
import { daysUntil, formatDaysText, calculateAverage, generateId } from './utils.js';

/**
 * ═══════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════
 */

export function initAgenda() {
  appState.subscribe((state, action) => {
    if (action.type.includes('PROVA') || action.type.includes('TAREFA') || action.type === 'SET_STATE') {
      renderAgenda();
    }
  });

  renderAgenda();
}

/**
 * ═══════════════════════════════════
 * RENDER
 * ═══════════════════════════════════
 */

function renderAgenda() {
  const container = ui.getEl('page-agenda');
  if (!container) return;

  ui.clearElement(container);

  // Provas section
  const provasSection = createProvasSection();
  container.appendChild(provasSection);

  // Tarefas section
  const tarefasSection = createTarefasSection();
  container.appendChild(tarefasSection);

  // Faltas section
  const faltasSection = createFaltasSection();
  container.appendChild(faltasSection);

  // Calculadora section
  const calcSection = createCalculadoraSection();
  container.appendChild(calcSection);
}

/**
 * ═══════════════════════════════════
 * PROVAS SECTION
 * ═══════════════════════════════════
 */

function createProvasSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '📝 Minhas Provas');
  section.appendChild(title);

  const provasOrdenadas = state.provas.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (provasOrdenadas.length === 0) {
    const empty = ui.createElement('div', 'empty-state');
    empty.innerHTML = `
      <div class="empty-state-icon">📋</div>
      <div class="empty-state-title">Nenhuma prova</div>
      <div class="empty-state-desc">Adicione suas provas para acompanhar</div>
    `;
    section.appendChild(empty);
  } else {
    const list = ui.createElement('div', 'stack stack-md');

    provasOrdenadas.forEach((prova, idx) => {
      const date = new Date(prova.date);
      const dias = daysUntil(prova.date);
      const subject = state.subjects.find((s) => s.name === prova.subject);

      const card = ui.createElement('div', 'card');
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '16px';

      const dateBox = ui.createElement('div');
      dateBox.style.fontSize = '28px';
      dateBox.style.fontWeight = '800';
      dateBox.style.color = 'var(--primary)';
      dateBox.style.minWidth = '60px';
      dateBox.style.textAlign = 'center';
      dateBox.textContent = date.getDate();

      const info = ui.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `
        <div style="font-weight: 700; font-size: 14px;">${subject?.emoji} ${prova.subject}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          ${formatDaysText(prova.date)}
        </div>
      `;

      const delBtn = ui.createElement('button', 'btn btn-danger btn-sm');
      delBtn.textContent = '🗑️';
      ui.onClick(delBtn, () => {
        appState.dispatch({
          type: 'DELETE_PROVA',
          payload: prova.id,
        });
        ui.showToast('Prova removida', 1500, 'success');
      });

      card.appendChild(dateBox);
      card.appendChild(info);
      card.appendChild(delBtn);

      list.appendChild(card);
    });

    section.appendChild(list);
  }

  const addBtn = ui.createButton('➕ Nova Prova', openProvaModal, 'primary');
  addBtn.style.width = '100%';
  section.appendChild(addBtn);

  return section;
}

function openProvaModal() {
  const state = appState.getState();
  const overlay = ui.createElement('div', 'modal-overlay open');
  const modal = ui.createElement('div', 'modal');

  const header = ui.createElement('div', 'modal-header');
  header.innerHTML = '<h2>Nova Prova</h2>';
  modal.appendChild(header);

  const body = ui.createElement('div', 'modal-body');

  // Subject select
  const subGroup = ui.createElement('div', 'form-group');
  const subLabel = ui.createElement('label', 'form-label', 'Matéria');
  const subSelect = ui.createElement('select', 'form-select');
  subSelect.innerHTML = '<option value="">Selecione...</option>' +
    state.subjects.map((s) => `<option value="${s.name}">${s.emoji} ${s.name}</option>`).join('');
  subGroup.appendChild(subLabel);
  subGroup.appendChild(subSelect);
  body.appendChild(subGroup);

  // Date input
  const dateGroup = ui.createElement('div', 'form-group');
  const dateLabel = ui.createElement('label', 'form-label', 'Data');
  const dateInput = ui.createElement('input', 'form-input');
  dateInput.type = 'date';
  dateGroup.appendChild(dateLabel);
  dateGroup.appendChild(dateInput);
  body.appendChild(dateGroup);

  modal.appendChild(body);

  const footer = ui.createElement('div', 'modal-footer');
  const saveBtn = ui.createButton('✅ Adicionar', () => {
    const subject = subSelect.value;
    const date = dateInput.value;

    if (!subject || !date) {
      ui.showToast('⚠️ Preencha todos os campos', 1500, 'warning');
      return;
    }

    appState.dispatch({
      type: 'ADD_PROVA',
      payload: {
        id: generateId(),
        subject,
        date,
      },
    });

    ui.showToast('✅ Prova adicionada!', 1500, 'success');
    document.body.removeChild(overlay);
  }, 'primary');

  const cancelBtn = ui.createButton('Cancelar', () => {
    document.body.removeChild(overlay);
  }, 'outline');

  footer.appendChild(saveBtn);
  footer.appendChild(cancelBtn);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  ui.onClick(overlay, (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
  document.body.appendChild(overlay);
}

/**
 * ═══════════════════════════════════
 * TAREFAS SECTION
 * ═══════════════════════════════════
 */

function createTarefasSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '✅ Minhas Tarefas');
  section.appendChild(title);

  if (state.tarefas.length === 0) {
    const empty = ui.createElement('div', 'empty-state');
    empty.innerHTML = `
      <div class="empty-state-icon">✓</div>
      <div class="empty-state-title">Nenhuma tarefa</div>
      <div class="empty-state-desc">Adicione tarefas para organizar seus estudos</div>
    `;
    section.appendChild(empty);
  } else {
    const list = ui.createElement('div', 'stack stack-md');

    state.tarefas.forEach((tarefa) => {
      const card = ui.createElement('div', 'card');
      if (tarefa.done) {
        card.style.opacity = '0.6';
      }

      const content = ui.createElement('div', 'card-body');
      content.style.display = 'flex';
      content.style.gap = '12px';
      content.style.alignItems = 'flex-start';

      const checkbox = ui.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = tarefa.done;
      checkbox.style.marginTop = '4px';
      checkbox.style.width = '20px';
      checkbox.style.height = '20px';
      checkbox.style.cursor = 'pointer';

      ui.onChange(checkbox, () => {
        appState.dispatch({
          type: 'UPDATE_TAREFA',
          payload: { id: tarefa.id, done: !tarefa.done },
        });
      });

      const info = ui.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `
        <div style="font-weight: 700; color: ${tarefa.done ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration: ${tarefa.done ? 'line-through' : 'none'};">
          ${tarefa.desc}
        </div>
        ${tarefa.subject || tarefa.date ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
          ${tarefa.subject ? state.subjects.find((s) => s.name === tarefa.subject)?.emoji + ' ' + tarefa.subject : ''}
          ${tarefa.date ? (tarefa.subject ? ' · ' : '') + new Date(tarefa.date).toLocaleDateString('pt-BR') : ''}
        </div>` : ''}
      `;

      const delBtn = ui.createElement('button', 'btn btn-danger btn-sm');
      delBtn.textContent = '🗑️';
      ui.onClick(delBtn, () => {
        appState.dispatch({
          type: 'DELETE_TAREFA',
          payload: tarefa.id,
        });
        ui.showToast('Tarefa removida', 1500, 'success');
      });

      content.appendChild(checkbox);
      content.appendChild(info);
      content.appendChild(delBtn);

      card.appendChild(content);
      list.appendChild(card);
    });

    section.appendChild(list);
  }

  const addBtn = ui.createButton('➕ Nova Tarefa', openTarefaModal, 'primary');
  addBtn.style.width = '100%';
  section.appendChild(addBtn);

  return section;
}

function openTarefaModal() {
  const state = appState.getState();
  const overlay = ui.createElement('div', 'modal-overlay open');
  const modal = ui.createElement('div', 'modal');

  const header = ui.createElement('div', 'modal-header');
  header.innerHTML = '<h2>Nova Tarefa</h2>';
  modal.appendChild(header);

  const body = ui.createElement('div', 'modal-body');

  // Description
  const descGroup = ui.createElement('div', 'form-group');
  const descLabel = ui.createElement('label', 'form-label', 'Descrição');
  const descInput = ui.createElement('input', 'form-input');
  descInput.placeholder = 'O que fazer?';
  descGroup.appendChild(descLabel);
  descGroup.appendChild(descInput);
  body.appendChild(descGroup);

  // Subject
  const subGroup = ui.createElement('div', 'form-group');
  const subLabel = ui.createElement('label', 'form-label', 'Matéria (opcional)');
  const subSelect = ui.createElement('select', 'form-select');
  subSelect.innerHTML = '<option value="">Nenhuma</option>' +
    state.subjects.map((s) => `<option value="${s.name}">${s.emoji} ${s.name}</option>`).join('');
  subGroup.appendChild(subLabel);
  subGroup.appendChild(subSelect);
  body.appendChild(subGroup);

  // Date
  const dateGroup = ui.createElement('div', 'form-group');
  const dateLabel = ui.createElement('label', 'form-label', 'Data de entrega (opcional)');
  const dateInput = ui.createElement('input', 'form-input');
  dateInput.type = 'date';
  dateGroup.appendChild(dateLabel);
  dateGroup.appendChild(dateInput);
  body.appendChild(dateGroup);

  modal.appendChild(body);

  const footer = ui.createElement('div', 'modal-footer');
  const saveBtn = ui.createButton('✅ Adicionar', () => {
    const desc = descInput.value.trim();
    if (!desc) {
      ui.showToast('⚠️ Digite a tarefa', 1500, 'warning');
      return;
    }

    appState.dispatch({
      type: 'ADD_TAREFA',
      payload: {
        id: generateId(),
        desc,
        subject: subSelect.value || null,
        date: dateInput.value || null,
        done: false,
      },
    });

    ui.showToast('✅ Tarefa adicionada!', 1500, 'success');
    document.body.removeChild(overlay);
  }, 'primary');

  const cancelBtn = ui.createButton('Cancelar', () => {
    document.body.removeChild(overlay);
  }, 'outline');

  footer.appendChild(saveBtn);
  footer.appendChild(cancelBtn);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  ui.onClick(overlay, (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });
  document.body.appendChild(overlay);
}

/**
 * ═══════════════════════════════════
 * FALTAS SECTION
 * ═══════════════════════════════════
 */

function createFaltasSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '❌ Faltas por Matéria');
  section.appendChild(title);

  if (state.subjects.length === 0) {
    const msg = ui.createElement('p');
    msg.textContent = 'Adicione matérias para controlar faltas';
    msg.style.color = 'var(--text-muted)';
    section.appendChild(msg);
    return section;
  }

  const list = ui.createElement('div', 'stack stack-md');

  state.subjects.forEach((sub, idx) => {
    const faltas = state.faltas[idx] || 0;
    const row = ui.createElement('div', 'card');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';

    const label = ui.createElement('div');
    label.textContent = `${sub.emoji} ${sub.name}`;
    label.style.fontWeight = '700';

    const controls = ui.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';

    const minusBtn = ui.createElement('button', 'btn btn-sm btn-secondary');
    minusBtn.textContent = '−';
    ui.onClick(minusBtn, () => {
      if ((state.faltas[idx] || 0) > 0) {
        state.faltas[idx] = (state.faltas[idx] || 0) - 1;
        renderAgenda();
      }
    });

    const count = ui.createElement('div');
    count.textContent = faltas;
    count.style.fontWeight = '800';
    count.style.fontSize = '18px';
    count.style.minWidth = '30px';
    count.style.textAlign = 'center';

    const plusBtn = ui.createElement('button', 'btn btn-sm btn-secondary');
    plusBtn.textContent = '+';
    ui.onClick(plusBtn, () => {
      state.faltas[idx] = (state.faltas[idx] || 0) + 1;
      renderAgenda();
    });

    controls.appendChild(minusBtn);
    controls.appendChild(count);
    controls.appendChild(plusBtn);

    row.appendChild(label);
    row.appendChild(controls);

    list.appendChild(row);
  });

  section.appendChild(list);
  return section;
}

/**
 * ═══════════════════════════════════
 * CALCULADORA SECTION
 * ═══════════════════════════════════
 */

function createCalculadoraSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '🎯 Calculadora de Nota');
  section.appendChild(title);

  if (state.subjects.length === 0) {
    const msg = ui.createElement('p');
    msg.textContent = 'Adicione matérias para usar a calculadora';
    msg.style.color = 'var(--text-muted)';
    section.appendChild(msg);
    return section;
  }

  const list = ui.createElement('div', 'stack stack-md');

  state.subjects.forEach((sub, idx) => {
    const card = ui.createElement('div', 'card');

    const cardBody = ui.createElement('div', 'card-body');
    const title = ui.createElement('h4');
    title.textContent = `${sub.emoji} ${sub.name}`;
    title.style.marginBottom = '12px';
    cardBody.appendChild(title);

    // Inputs
    const inputsGrid = ui.createElement('div', 'grid grid-cols-2');
    inputsGrid.style.gap = '8px';
    inputsGrid.style.marginBottom = '12px';

    for (let i = 0; i < state.bimestres; i++) {
      const group = ui.createElement('div', 'form-group');
      const label = ui.createElement('label', 'form-label', ['B', 'B', 'B', 'B'][i]);
      const input = ui.createElement('input', 'form-input');
      input.type = 'number';
      input.value = sub.grades[i] ?? '';
      input.placeholder = '—';
      input.id = `calc-${idx}-${i}`;
      group.appendChild(label);
      group.appendChild(input);
      inputsGrid.appendChild(group);
    }
    cardBody.appendChild(inputsGrid);

    // Button
    const btn = ui.createElement('button', 'btn btn-primary btn-sm');
    btn.textContent = '🔢 Calcular';
    btn.style.width = '100%';
    ui.onClick(btn, () => {
      const notas = [];
      for (let i = 0; i < state.bimestres; i++) {
        const val = parseFloat(document.getElementById(`calc-${idx}-${i}`).value);
        if (!isNaN(val)) notas.push(val);
      }

      if (notas.length === 0) {
        ui.showToast('⚠️ Digite alguma nota', 1500, 'warning');
        return;
      }

      const atual = notas.reduce((a, b) => a + b, 0) / notas.length;
      const faltando = state.bimestres - notas.length;
      const precisa = faltando > 0 ? (state.profile.minGrade * state.bimestres - notas.reduce((a, b) => a + b, 0)) / faltando : 0;

      let resultText = `Média: ${atual.toFixed(1)}`;
      if (precisa > 0 && precisa <= 10) {
        resultText += ` | Precisa: ${precisa.toFixed(1)}`;
      } else if (precisa > 10) {
        resultText += ' | Já reprova!';
      }

      ui.showToast(resultText, 2500, 'info');
    });
    cardBody.appendChild(btn);

    card.appendChild(cardBody);
    list.appendChild(card);
  });

  section.appendChild(list);
  return section;
}

initAgenda();

export default { initAgenda, renderAgenda };
