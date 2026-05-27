/**
 * UTILS.JS
 * Funções utilitárias, helpers, validators
 * Sem dependências de DOM
 */

import { VALIDATION_PATTERNS } from './constants.js';

/**
 * ═══════════════════════════════════
 * SANITIZATION & SECURITY
 * ═══════════════════════════════════
 */

/**
 * Sanitiza HTML para prevenir XSS
 * Remove scripts, eventos, tags perigosas
 * @param {string} html - HTML para sanitizar
 * @returns {string} HTML seguro
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} text - Texto para escapar
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * ═══════════════════════════════════
 * VALIDATION
 * ═══════════════════════════════════
 */

/**
 * Valida email
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return VALIDATION_PATTERNS.email.test(email);
}

/**
 * Valida chave de API Claude
 * @param {string} key
 * @returns {boolean}
 */
export function isValidApiKey(key) {
  return VALIDATION_PATTERNS.apiKey.test(key);
}

/**
 * Valida nota (0-10)
 * @param {number} grade
 * @returns {boolean}
 */
export function isValidGrade(grade) {
  const num = parseFloat(grade);
  return !isNaN(num) && num >= 0 && num <= 10;
}

/**
 * Valida objeto contra schema
 * @param {Object} obj - Objeto para validar
 * @param {Object} schema - Schema com regras
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateObject(obj, schema) {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    
    // Required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} é obrigatório`);
      continue;
    }
    
    if (value === undefined || value === null) continue;
    
    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${key} deve ser ${rules.type}`);
    }
    
    // Min/Max
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${key} deve ser ≥ ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${key} deve ser ≤ ${rules.max}`);
      }
    }
    
    // String length
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} deve ter ≥ ${rules.minLength} caracteres`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} deve ter ≤ ${rules.maxLength} caracteres`);
      }
    }
    
    // Array
    if (Array.isArray(value) && rules.items) {
      for (let i = 0; i < value.length; i++) {
        if (!validateByType(value[i], rules.items.type)) {
          errors.push(`${key}[${i}] tipo inválido`);
        }
      }
    }
    
    // Custom validator
    if (rules.custom && !rules.custom(value)) {
      errors.push(rules.customMessage || `${key} inválido`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateByType(value, type) {
  if (type === 'number|null') return typeof value === 'number' || value === null;
  if (type === 'string|null') return typeof value === 'string' || value === null;
  return typeof value === type;
}

/**
 * ═══════════════════════════════════
 * MATH & CALCULATIONS
 * ═══════════════════════════════════
 */

/**
 * Calcula média de valores
 * @param {number[]} values - Valores
 * @returns {number|null} Média ou null se vazio
 */
export function calculateAverage(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  
  const valid = values.filter((v) => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  
  const sum = valid.reduce((a, b) => a + parseFloat(b), 0);
  return sum / valid.length;
}

/**
 * Calcula percentual de progresso
 * @param {number} current - Valor atual
 * @param {number} target - Valor alvo
 * @returns {number} Percentual (0-100)
 */
export function calculateProgress(current, target) {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Calcula quanto falta para passar
 * @param {number} current - Média atual
 * @param {number} minGrade - Nota mínima
 * @param {number} bimestres - Quantidade de bimestres
 * @returns {number} Nota necessária
 */
export function calculateNeededGrade(current, minGrade, bimestres) {
  if (bimestres <= 0) return 0;
  const needed = (minGrade * bimestres - current) / bimestres;
  return Math.max(0, needed);
}

/**
 * Calcula percentual de melhora
 * @param {number} prev - Valor anterior
 * @param {number} current - Valor atual
 * @returns {number} Percentual de melhora/piora
 */
export function calculatePercentageChange(prev, current) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

/**
 * ═══════════════════════════════════
 * DATE & TIME
 * ═══════════════════════════════════
 */

/**
 * Formata data em português
 * @param {Date|string} date
 * @returns {string} Ex: "25 de maio de 2025"
 */
export function formatDate(date) {
  const d = new Date(date);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return d.toLocaleDateString('pt-BR', options);
}

/**
 * Formata hora
 * @param {Date|string} date
 * @returns {string} Ex: "14:30"
 */
export function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calcula dias até data
 * @param {string} dateString - Data ISO
 * @returns {number} Dias (negativo = passado)
 */
export function daysUntil(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diff = date.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula streak de dias
 * @param {Date} lastUpdate - Última atualização
 * @returns {number} Dias do streak
 */
export function calculateStreak(lastUpdate) {
  const today = new Date();
  const last = new Date(lastUpdate);
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));
  
  // Se atualizado hoje ou ontem, mantém streak
  if (diffDays === 0 || diffDays === 1) return 1;
  
  // Se mais de 1 dia, streak quebrado
  return 0;
}

/**
 * Formata texto com dias
 * @param {string} dateString
 * @returns {string} Ex: "em 3 dias", "hoje", "há 2 dias"
 */
export function formatDaysText(dateString) {
  const days = daysUntil(dateString);
  
  if (days === 0) return 'hoje';
  if (days === 1) return 'amanhã';
  if (days === -1) return 'ontem';
  if (days > 0) return `em ${days} dias`;
  return `há ${Math.abs(days)} dias`;
}

/**
 * ═══════════════════════════════════
 * STRING UTILITIES
 * ═══════════════════════════════════
 */

/**
 * Trunca string
 * @param {string} text
 * @param {number} length
 * @returns {string}
 */
export function truncate(text, length = 50) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Capitaliza primeira letra
 * @param {string} text
 * @returns {string}
 */
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Remove acentuação
 * @param {string} text
 * @returns {string}
 */
export function removeAccents(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera slug de texto
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return removeAccents(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

/**
 * ═══════════════════════════════════
 * ARRAY UTILITIES
 * ═══════════════════════════════════
 */

/**
 * Remove duplicatas de array
 * @param {any[]} arr
 * @returns {any[]}
 */
export function unique(arr) {
  return [...new Set(arr)];
}

/**
 * Agrupa array por chave
 * @param {Object[]} arr
 * @param {string} key
 * @returns {Object}
 */
export function groupBy(arr, key) {
  return arr.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
}

/**
 * Ordena array por chave
 * @param {Object[]} arr
 * @param {string} key
 * @param {string} order - 'asc' ou 'desc'
 * @returns {Object[]}
 */
export function sortBy(arr, key, order = 'asc') {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * ═══════════════════════════════════
 * OBJECT UTILITIES
 * ═══════════════════════════════════
 */

/**
 * Deep clone de objeto
 * @param {Object} obj
 * @returns {Object}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge de objetos (shallow)
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
export function merge(target, source) {
  return { ...target, ...source };
}

/**
 * Pega valor aninhado do objeto
 * @param {Object} obj
 * @param {string} path - Ex: "user.profile.name"
 * @param {any} defaultValue
 * @returns {any}
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj) ?? defaultValue;
}

/**
 * ═══════════════════════════════════
 * EXPORT/IMPORT
 * ═══════════════════════════════════
 */

/**
 * Exporta dados como JSON file
 * @param {Object} data
 * @param {string} filename
 */
export function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Lê JSON file
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function readJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        resolve(json);
      } catch (err) {
        reject(new Error('JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

/**
 * ═══════════════════════════════════
 * MISC
 * ═══════════════════════════════════
 */

/**
 * Gera ID único
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Aguarda X milissegundos
 * @param {number} ms
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce de função
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle de função
 * @param {Function} fn
 * @param {number} interval
 * @returns {Function}
 */
export function throttle(fn, interval = 300) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

export default {
  // Security
  sanitizeHtml,
  escapeHtml,
  // Validation
  isValidEmail,
  isValidApiKey,
  isValidGrade,
  validateObject,
  // Math
  calculateAverage,
  calculateProgress,
  calculateNeededGrade,
  calculatePercentageChange,
  // Date
  formatDate,
  formatTime,
  daysUntil,
  calculateStreak,
  formatDaysText,
  // String
  truncate,
  capitalize,
  removeAccents,
  slugify,
  // Array
  unique,
  groupBy,
  sortBy,
  // Object
  deepClone,
  merge,
  getNestedValue,
  // Export/Import
  downloadJSON,
  readJSON,
  // Misc
  generateId,
  sleep,
  debounce,
  throttle,
};
