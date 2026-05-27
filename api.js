/**
 * API.JS
 * Client para comunicar com backend proxy
 * NUNCA expõe chave de API aqui - ela fica no servidor!
 */

import { LOADING_STATES } from './constants.js';

class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.timeout = 30000; // 30s
    this.retries = 3;
    this.retryDelay = 1000; // 1s
  }

  /**
   * ═══════════════════════════════════
   * FETCH WRAPPER
   * ═══════════════════════════════════
   */

  /**
   * Faz requisição com tratamento de erro
   * @private
   */
  async _fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    let lastError;

    // Retry logic
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle response
        if (!response.ok) {
          const error = await this._parseError(response);
          throw new ApiError(error.message, response.status, error);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastError = error;

        if (error.name === 'AbortError') {
          throw new NetworkError('Timeout na requisição');
        }

        // Retry se não for erro do cliente
        if (attempt < this.retries && !error.isClientError) {
          console.warn(`⚠️ Tentativa ${attempt} falhou, retentando em ${this.retryDelay}ms`);
          await this._sleep(this.retryDelay);
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    throw lastError || new NetworkError('Erro na requisição após tentativas');
  }

  /**
   * Parse erro da resposta
   * @private
   */
  async _parseError(response) {
    try {
      const data = await response.json();
      return {
        message: data.error?.message || data.message || 'Erro na API',
        details: data.error?.details || data.details,
      };
    } catch {
      return {
        message: `Erro ${response.status}: ${response.statusText}`,
      };
    }
  }

  /**
   * Sleep helper
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * ═══════════════════════════════════
   * CHAT API
   * ═══════════════════════════════════
   */

  /**
   * Envia mensagem para Claude via backend
   * @param {Array} messages - Array de mensagens
   * @returns {Promise<Object>} Resposta
   */
  async chat(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new ValidationError('Messages deve ser um array não vazio');
    }

    return this._fetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  /**
   * Envia múltiplas mensagens (streaming-like)
   * @param {string} message - Mensagem
   * @param {Array} history - Histórico anterior
   */
  async chatStream(message, history = []) {
    const messages = [
      ...history,
      { role: 'user', content: message },
    ];

    return this.chat(messages);
  }

  /**
   * ═══════════════════════════════════
   * USER API
   * ═══════════════════════════════════
   */

  /**
   * Get user profile
   */
  async getUserProfile() {
    return this._fetch('/user/profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profile) {
    return this._fetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseUrl}/user/profile-picture`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  }

  /**
   * ═══════════════════════════════════
   * DATA API
   * ═══════════════════════════════════
   */

  /**
   * Export todos os dados
   */
  async exportData() {
    return this._fetch('/data/export', {
      method: 'POST',
    });
  }

  /**
   * Import dados
   */
  async importData(data) {
    return this._fetch('/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Sync dados com servidor
   */
  async syncData(localData) {
    return this._fetch('/data/sync', {
      method: 'POST',
      body: JSON.stringify(localData),
    });
  }

  /**
   * ═══════════════════════════════════
   * AUTH API
   * ═══════════════════════════════════
   */

  /**
   * Check se está autenticado
   */
  async checkAuth() {
    return this._fetch('/auth/check');
  }

  /**
   * Login
   */
  async login(email, password) {
    return this._fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Logout
   */
  async logout() {
    return this._fetch('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * ═══════════════════════════════════
   * HEALTH CHECK
   * ═══════════════════════════════════
   */

  /**
   * Verifica se API está online
   */
  async ping() {
    try {
      const response = await this._fetch('/ping');
      return response.status === 'ok';
    } catch {
      return false;
    }
  }
}

/**
 * ═══════════════════════════════════
 * CUSTOM ERROR CLASSES
 * ═══════════════════════════════════
 */

class ApiError extends Error {
  constructor(message, statusCode, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isClientError = statusCode >= 400 && statusCode < 500;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
    this.isClientError = false;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.isClientError = true;
  }
}

/**
 * Instância global
 */
export const api = new ApiClient();

export { ApiError, NetworkError, ValidationError };
export default api;
