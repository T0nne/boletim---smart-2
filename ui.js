/**
 * UI.JS
 * DOM helpers, utilitários de UI e componentes
 */

import { sanitizeHtml, escapeHtml } from './utils.js';

/**
 * ═══════════════════════════════════
 * ELEMENT CREATION
 * ═══════════════════════════════════
 */

/**
 * Cria elemento com classes e conteúdo
 * @param {string} tag - tag HTML
 * @param {string|Array} classes - classes CSS
 * @param {string|HTMLElement} content - conteúdo
 * @returns {HTMLElement}
 */
export function createElement(tag, classes = '', content = '') {
  const el = document.createElement(tag);

  if (classes) {
    const classList = Array.isArray(classes) ? classes : classes.split(' ');
    el.classList.add(...classList.filter(Boolean));
  }

  if (content) {
    if (typeof content === 'string') {
      el.textContent = content;
    } else if (content instanceof HTMLElement) {
      el.appendChild(content);
    }
  }

  return el;
}

/**
 * Cria um botão
 * @param {string} text
 * @param {Function} onClick
 * @param {string} variant - primary, secondary, outline, danger
 * @returns {HTMLButtonElement}
 */
export function createButton(text, onClick, variant = 'primary') {
  const btn = createElement('button', ['btn', `btn-${variant}`], text);
  btn.addEventListener('click', onClick);
  return btn;
}

/**
 * Cria um card
 * @param {string} title
 * @param {string|HTMLElement} body
 * @param {string|HTMLElement} footer
 * @returns {HTMLElement}
 */
export function createCard(title, body, footer = '') {
  const card = createElement('div', 'card');

  if (title) {
    const header = createElement('div', 'card-header');
    header.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
    card.appendChild(header);
  }

  if (body) {
    const bodyEl = createElement('div', 'card-body');
    if (typeof body === 'string') {
      bodyEl.textContent = body;
    } else {
      bodyEl.appendChild(body);
    }
    card.appendChild(bodyEl);
  }

  if (footer) {
    const footerEl = createElement('div', 'card-footer');
    if (typeof footer === 'string') {
      footerEl.textContent = footer;
    } else {
      footerEl.appendChild(footer);
    }
    card.appendChild(footerEl);
  }

  return card;
}

/**
 * ═══════════════════════════════════
 * DOM MANIPULATION
 * ═══════════════════════════════════
 */

/**
 * Mostra um elemento
 */
export function showElement(el) {
  if (!el) return;
  el.classList.remove('hidden');
  el.style.display = '';
}

/**
 * Esconde um elemento
 */
export function hideElement(el) {
  if (!el) return;
  el.classList.add('hidden');
  el.style.display = 'none';
}

/**
 * Toggle visibilidade
 */
export function toggleElement(el) {
  if (!el) return;
  if (el.style.display === 'none') {
    showElement(el);
  } else {
    hideElement(el);
  }
}

/**
 * Remove elemento do DOM
 */
export function removeElement(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/**
 * Substitui um elemento por outro
 */
export function replaceElement(oldEl, newEl) {
  if (oldEl && oldEl.parentNode) {
    oldEl.parentNode.replaceChild(newEl, oldEl);
  }
}

/**
 * Limpa conteúdo de elemento
 */
export function clearElement(el) {
  if (el) {
    el.innerHTML = '';
  }
}

/**
 * ═══════════════════════════════════
 * EVENT HANDLING
 * ═══════════════════════════════════
 */

/**
 * Adiciona listener de click
 */
export function onClick(el, handler) {
  if (el) {
    el.addEventListener('click', handler);
  }
}

/**
 * Adiciona listener de change
 */
export function onChange(el, handler) {
  if (el) {
    el.addEventListener('change', handler);
  }
}

/**
 * Adiciona listener de input
 */
export function onInput(el, handler) {
  if (el) {
    el.addEventListener('input', handler);
  }
}

/**
 * Executa handler ao pressionar Enter
 */
export function onEnter(el, handler) {
  if (el) {
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handler(e);
      }
    });
  }
}

/**
 * Event delegation (para elementos dinâmicos)
 */
export function delegateEvent(parent, selector, eventType, handler) {
  if (!parent) return;

  parent.addEventListener(eventType, (e) => {
    const target = e.target.closest(selector);
    if (target) {
      handler.call(target, e);
    }
  });
}

/**
 * ═══════════════════════════════════
 * FORM HELPERS
 * ═══════════════════════════════════
 */

/**
 * Pega valor de input
 */
export function getInputValue(el) {
  if (!el) return '';
  return el.value || el.textContent || '';
}

/**
 * Seta valor de input
 */
export function setInputValue(el, value) {
  if (!el) return;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.value = value;
  } else {
    el.textContent = value;
  }
}

/**
 * Valida e mostra erro em input
 */
export function setInputError(el, errorMessage) {
  if (!el) return;
  el.classList.add('is-invalid');
  const errorEl = el.nextElementSibling;
  if (errorEl && errorEl.classList.contains('form-error')) {
    errorEl.textContent = errorMessage;
  }
}

/**
 * Remove erro de input
 */
export function clearInputError(el) {
  if (!el) return;
  el.classList.remove('is-invalid');
  const errorEl = el.nextElementSibling;
  if (errorEl && errorEl.classList.contains('form-error')) {
    errorEl.textContent = '';
  }
}

/**
 * ═══════════════════════════════════
 * MODAL & DIALOG
 * ═══════════════════════════════════
 */

/**
 * Abre um modal
 */
export function openModal(modalEl) {
  if (modalEl) {
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Fecha um modal
 */
export function closeModal(modalEl) {
  if (modalEl) {
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }
}

/**
 * Toggle modal
 */
export function toggleModal(modalEl) {
  if (modalEl) {
    modalEl.classList.toggle('open');
  }
}

/**
 * ═══════════════════════════════════
 * TOAST NOTIFICATIONS
 * ═══════════════════════════════════
 */

let toastTimeout;

/**
 * Mostra toast notification
 * @param {string} message - Mensagem
 * @param {number} duration - Duração em ms (default 2800)
 * @param {string} type - success, error, warning, info
 */
export function showToast(message, duration = 2800, type = 'info') {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;

  // Limpar timeout anterior
  clearTimeout(toastTimeout);

  // Mapear tipos para emojis
  const emojis = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const emoji = emojis[type] || '';
  toastEl.textContent = `${emoji} ${message}`.trim();
  toastEl.className = `toast show`;

  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, duration);
}

/**
 * ═══════════════════════════════════
 * LOADING STATES
 * ═══════════════════════════════════
 */

/**
 * Mostra loading em um elemento
 */
export function setLoading(el, isLoading = true) {
  if (!el) return;

  if (isLoading) {
    el.disabled = true;
    el.classList.add('loading');
    const spinner = createElement('span', 'spinner');
    el.appendChild(spinner);
  } else {
    el.disabled = false;
    el.classList.remove('loading');
    const spinner = el.querySelector('.spinner');
    if (spinner) spinner.remove();
  }
}

/**
 * Mostra skeleton loader
 */
export function createSkeleton(width = '100%', height = '20px') {
  const skeleton = createElement('div', 'loading-skeleton');
  skeleton.style.width = width;
  skeleton.style.height = height;
  skeleton.style.borderRadius = 'var(--radius-md)';
  return skeleton;
}

/**
 * ═══════════════════════════════════
 * ANIMATION
 * ═══════════════════════════════════
 */

/**
 * Anima um elemento
 */
export function animateElement(el, animationName, duration = 300) {
  if (!el) return;

  return new Promise((resolve) => {
    el.classList.add(animationName);

    const handleEnd = () => {
      el.classList.remove(animationName);
      el.removeEventListener('animationend', handleEnd);
      resolve();
    };

    el.addEventListener('animationend', handleEnd);

    // Timeout de segurança
    setTimeout(() => {
      el.removeEventListener('animationend', handleEnd);
      el.classList.remove(animationName);
      resolve();
    }, duration + 100);
  });
}

/**
 * Fade in
 */
export async function fadeIn(el, duration = 300) {
  if (!el) return;
  el.style.opacity = '0';
  showElement(el);
  await animateElement(el, 'fade-in', duration);
  el.style.opacity = '1';
}

/**
 * Fade out
 */
export async function fadeOut(el, duration = 300) {
  if (!el) return;
  await animateElement(el, 'fade-out', duration);
  hideElement(el);
}

/**
 * Slide in up
 */
export async function slideInUp(el, duration = 300) {
  if (!el) return;
  showElement(el);
  await animateElement(el, 'slide-in-up', duration);
}

/**
 * ═══════════════════════════════════
 * UTILS
 * ═══════════════════════════════════
 */

/**
 * Pega elemento por ID
 */
export function getEl(id) {
  return document.getElementById(id);
}

/**
 * Pega elemento por seletor
 */
export function query(selector) {
  return document.querySelector(selector);
}

/**
 * Pega múltiplos elementos
 */
export function queryAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

/**
 * Cria elemento a partir de HTML string
 */
export function createFromHTML(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = sanitizeHtml(htmlString);
  return div.firstElementChild;
}

/**
 * Focus em elemento
 */
export function focusElement(el) {
  if (el) {
    el.focus();
  }
}

/**
 * Scroll para elemento
 */
export function scrollToElement(el, behavior = 'smooth') {
  if (el) {
    el.scrollIntoView({ behavior });
  }
}

/**
 * Copia texto para clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado!', 1500, 'success');
    return true;
  } catch (error) {
    console.error('Erro ao copiar:', error);
    showToast('Erro ao copiar', 1500, 'error');
    return false;
  }
}

/**
 * Detecta se está em modo dark
 */
export function isDarkMode() {
  const html = document.documentElement;
  return html.getAttribute('data-theme') === 'dark' || !html.getAttribute('data-theme');
}

/**
 * Muda tema
 */
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default {
  // Creation
  createElement,
  createButton,
  createCard,
  // Manipulation
  showElement,
  hideElement,
  toggleElement,
  removeElement,
  replaceElement,
  clearElement,
  // Events
  onClick,
  onChange,
  onInput,
  onEnter,
  delegateEvent,
  // Forms
  getInputValue,
  setInputValue,
  setInputError,
  clearInputError,
  // Modal
  openModal,
  closeModal,
  toggleModal,
  // Toast
  showToast,
  // Loading
  setLoading,
  createSkeleton,
  // Animation
  animateElement,
  fadeIn,
  fadeOut,
  slideInUp,
  // Utils
  getEl,
  query,
  queryAll,
  createFromHTML,
  focusElement,
  scrollToElement,
  copyToClipboard,
  isDarkMode,
  setTheme,
};
