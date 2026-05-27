/**
 * STATE.JS
 * Centralized State Management
 * Single source of truth para toda aplicação
 * Observer pattern para reatividade
 */

import { deepClone, validateObject } from './utils.js';
import { APP_CONFIG, STORAGE_KEYS } from './constants.js';

/**
 * Schema de validação para dados
 */
const STATE_SCHEMA = {
  profile: {
    name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
    email: { type: 'string' },
    grade: { type: 'string' },
    school: { type: 'string' },
    class: { type: 'string' },
    minGrade: { type: 'number', min: 0, max: 10 },
    profilePic: { type: 'string' },
    bgImage: { type: 'string' },
    nick: { type: 'string' },
    createdAt: { type: 'string' },
  },
  subjects: {
    type: 'array',
    items: {
      id: { type: 'number', required: true },
      name: { type: 'string', required: true, minLength: 1, maxLength: 50 },
      icon: { type: 'string' },
      grades: { type: 'array' },
      faltas: { type: 'number', min: 0 },
      meta: { type: 'number|null' },
    },
  },
};

class AppState {
  constructor() {
    /**
     * State tree completo
     */
    this.state = {
      // User Profile
      profile: {
        name: 'Aluno(a)',
        email: '',
        grade: '',
        school: '',
        class: '',
        minGrade: 6,
        profilePic: '',
        bgImage: '',
        nick: '',
        createdAt: new Date().toISOString(),
      },

      // Academic Data
      subjects: [],
      provas: [],
      tarefas: [],

      // App State
      bimestres: APP_CONFIG.bimestresDefault,
      theme: 'dark',
      streak: {
        days: 0,
        lastUpdate: null,
      },

      // Chat & AI
      chatHistory: [],
      apiKeyConfigured: false,

      // Achievements
      achievements: {},

      // UI State
      currentPage: 'dashboard',
      isLoading: false,
      error: null,
      toast: null,

      // Meta
      schemaVersion: APP_CONFIG.dataSchemaVersion,
      lastSynced: null,
    };

    /**
     * Listeners para mudanças de estado
     */
    this.listeners = new Set();

    /**
     * História de ações para debugging
     */
    this.history = [];
    this.maxHistory = 50;

    /**
     * Middleware (validação, logging, etc)
     */
    this.middleware = [];
  }

  /**
   * ═══════════════════════════════════
   * SUBSCRIBE & OBSERVERS
   * ═══════════════════════════════════
   */

  /**
   * Inscreve listener para mudanças
   * @param {Function} listener - Callback(state, action)
   * @returns {Function} Unsubscribe
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifica todos os listeners
   * @private
   */
  _notifyListeners(action) {
    for (const listener of this.listeners) {
      try {
        listener(this.state, action);
      } catch (error) {
        console.error('Erro no listener:', error);
      }
    }
  }

  /**
   * ═══════════════════════════════════
   * STATE MUTATIONS
   * ═══════════════════════════════════
   */

  /**
   * Dispatch de ação (Redux-style)
   * @param {Object} action
   */
  dispatch(action) {
    // Execute middleware
    for (const mw of this.middleware) {
      if (mw.before) {
        mw.before(action, this.state);
      }
    }

    const previousState = deepClone(this.state);

    try {
      switch (action.type) {
        // Profile
        case 'SET_PROFILE':
          this.state.profile = { ...this.state.profile, ...action.payload };
          break;

        // Subjects
        case 'ADD_SUBJECT':
          this.state.subjects.push(action.payload);
          break;

        case 'UPDATE_SUBJECT':
          const idx = this.state.subjects.findIndex((s) => s.id === action.payload.id);
          if (idx >= 0) {
            this.state.subjects[idx] = { ...this.state.subjects[idx], ...action.payload };
          }
          break;

        case 'DELETE_SUBJECT':
          this.state.subjects = this.state.subjects.filter((s) => s.id !== action.payload);
          break;

        case 'SET_SUBJECTS':
          this.state.subjects = action.payload;
          break;

        // Provas
        case 'ADD_PROVA':
          this.state.provas.push(action.payload);
          break;

        case 'DELETE_PROVA':
          this.state.provas = this.state.provas.filter((p) => p.id !== action.payload);
          break;

        case 'SET_PROVAS':
          this.state.provas = action.payload;
          break;

        // Tarefas
        case 'ADD_TAREFA':
          this.state.tarefas.push(action.payload);
          break;

        case 'UPDATE_TAREFA':
          const tidx = this.state.tarefas.findIndex((t) => t.id === action.payload.id);
          if (tidx >= 0) {
            this.state.tarefas[tidx] = { ...this.state.tarefas[tidx], ...action.payload };
          }
          break;

        case 'DELETE_TAREFA':
          this.state.tarefas = this.state.tarefas.filter((t) => t.id !== action.payload);
          break;

        case 'SET_TAREFAS':
          this.state.tarefas = action.payload;
          break;

        // Chat
        case 'ADD_CHAT_MESSAGE':
          this.state.chatHistory.push(action.payload);
          if (this.state.chatHistory.length > APP_CONFIG.chatMaxHistory) {
            this.state.chatHistory.shift();
          }
          break;

        case 'SET_CHAT_HISTORY':
          this.state.chatHistory = action.payload;
          break;

        case 'SET_API_KEY_CONFIGURED':
          this.state.apiKeyConfigured = action.payload;
          break;

        // Achievements
        case 'UNLOCK_ACHIEVEMENT':
          this.state.achievements[action.payload] = true;
          break;

        case 'SET_ACHIEVEMENTS':
          this.state.achievements = action.payload;
          break;

        // App State
        case 'SET_PAGE':
          this.state.currentPage = action.payload;
          break;

        case 'SET_THEME':
          this.state.theme = action.payload;
          break;

        case 'SET_BIMESTRES':
          this.state.bimestres = action.payload;
          break;

        case 'SET_LOADING':
          this.state.isLoading = action.payload;
          break;

        case 'SET_ERROR':
          this.state.error = action.payload;
          break;

        case 'SET_STREAK':
          this.state.streak = action.payload;
          break;

        // Bulk
        case 'SET_STATE':
          this.state = { ...this.state, ...action.payload };
          break;

        case 'RESET_STATE':
          this.state = { ...this._getInitialState() };
          break;

        default:
          console.warn(`Ação desconhecida: ${action.type}`);
      }

      // Record history
      this._recordHistory(action, previousState);

      // Execute middleware after
      for (const mw of this.middleware) {
        if (mw.after) {
          mw.after(action, this.state);
        }
      }

      // Notify listeners
      this._notifyListeners(action);
    } catch (error) {
      console.error('Erro ao fazer dispatch:', error);
      this.state = previousState;
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════
   * STATE GETTERS
   * ═══════════════════════════════════
   */

  /**
   * Retorna estado atual completo
   */
  getState() {
    return deepClone(this.state);
  }

  /**
   * Retorna valor de propriedade específica
   * @param {string} path - Ex: "profile.name"
   */
  getStateValue(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  /**
   * ═══════════════════════════════════
   * CALCULATIONS & DERIVED STATE
   * ═══════════════════════════════════
   */

  /**
   * Calcula média geral
   */
  getGeneralAverage() {
    if (this.state.subjects.length === 0) return null;

    const averages = this.state.subjects
      .map((s) => {
        const valid = s.grades?.filter((g) => g !== null && g !== undefined) || [];
        if (valid.length === 0) return null;
        return valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length;
      })
      .filter((a) => a !== null);

    if (averages.length === 0) return null;
    return averages.reduce((a, b) => a + b, 0) / averages.length;
  }

  /**
   * Conta matérias aprovadas
   */
  getApprovedSubjectsCount() {
    const minGrade = this.state.profile.minGrade;
    return this.state.subjects.filter((s) => {
      const valid = s.grades?.filter((g) => g !== null && g !== undefined) || [];
      if (valid.length === 0) return false;
      const avg = valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length;
      return avg >= minGrade;
    }).length;
  }

  /**
   * Conta matérias em risco
   */
  getAtRiskSubjectsCount() {
    const minGrade = this.state.profile.minGrade;
    return this.state.subjects.filter((s) => {
      const valid = s.grades?.filter((g) => g !== null && g !== undefined) || [];
      if (valid.length === 0) return false;
      const avg = valid.reduce((a, b) => a + parseFloat(b), 0) / valid.length;
      return avg < minGrade;
    }).length;
  }

  /**
   * ═══════════════════════════════════
   * VALIDATION & SCHEMA
   * ═══════════════════════════════════
   */

  /**
   * Valida profile antes de salvar
   */
  validateProfile() {
    return validateObject(this.state.profile, STATE_SCHEMA.profile);
  }

  /**
   * ═══════════════════════════════════
   * MIDDLEWARE
   * ═══════════════════════════════════
   */

  /**
   * Registra middleware
   */
  use(middleware) {
    this.middleware.push(middleware);
    return this;
  }

  /**
   * ═══════════════════════════════════
   * HISTORY & DEBUGGING
   * ═══════════════════════════════════
   */

  /**
   * @private
   */
  _recordHistory(action, previousState) {
    this.history.push({
      action,
      timestamp: Date.now(),
      previousState,
      newState: deepClone(this.state),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Retorna histórico de ações
   */
  getHistory() {
    return this.history;
  }

  /**
   * @private
   */
  _getInitialState() {
    return {
      profile: {
        name: 'Aluno(a)',
        email: '',
        grade: '',
        school: '',
        class: '',
        minGrade: 6,
        profilePic: '',
        bgImage: '',
        nick: '',
        createdAt: new Date().toISOString(),
      },
      subjects: [],
      provas: [],
      tarefas: [],
      bimestres: APP_CONFIG.bimestresDefault,
      theme: 'dark',
      streak: { days: 0, lastUpdate: null },
      chatHistory: [],
      apiKeyConfigured: false,
      achievements: {},
      currentPage: 'dashboard',
      isLoading: false,
      error: null,
      toast: null,
      schemaVersion: APP_CONFIG.dataSchemaVersion,
      lastSynced: null,
    };
  }
}

/**
 * Instância global (singleton)
 */
export const appState = new AppState();

export default appState;
