/**
 * STORAGE.JS
 * localStorage wrapper com persistência, versionamento e error handling
 * Salva/carrega dados de forma segura
 */

import { APP_CONFIG } from './constants.js';
import { deepClone } from './utils.js';

class StorageManager {
  constructor() {
    this.prefix = APP_CONFIG.storagePrefix;
    this.version = APP_CONFIG.dataSchemaVersion;
    this.isAvailable = this._checkAvailability();
  }

  /**
   * ═══════════════════════════════════
   * AVAILABILITY CHECK
   * ═══════════════════════════════════
   */

  /**
   * Verifica se localStorage está disponível
   * @private
   * @returns {boolean}
   */
  _checkAvailability() {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('⚠️ localStorage não disponível (private mode ou quota excedida)');
      return false;
    }
  }

  /**
   * ═══════════════════════════════════
   * SAVE & LOAD
   * ═══════════════════════════════════
   */

  /**
   * Salva dados no localStorage
   * @param {string} key - Chave para salvar
   * @param {any} data - Dados para salvar
   * @returns {boolean} Sucesso
   */
  save(key, data) {
    if (!this.isAvailable) {
      console.warn('⚠️ localStorage não disponível');
      return false;
    }

    try {
      const fullKey = this._getFullKey(key);
      const payload = {
        version: this.version,
        timestamp: Date.now(),
        data: deepClone(data),
      };

      localStorage.setItem(fullKey, JSON.stringify(payload));
      console.log(`💾 Salvo: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar ${key}:`, error.message);
      // Se for quota excedida, tenta limpar dados antigos
      if (error.name === 'QuotaExceededError') {
        this._clearOldData();
        return this.save(key, data); // Tenta novamente
      }
      return false;
    }
  }

  /**
   * Carrega dados do localStorage
   * @param {string} key - Chave para carregar
   * @param {any} defaultValue - Valor padrão se não existir
   * @returns {any} Dados carregados
   */
  load(key, defaultValue = null) {
    if (!this.isAvailable) {
      console.warn('⚠️ localStorage não disponível, retornando padrão');
      return defaultValue;
    }

    try {
      const fullKey = this._getFullKey(key);
      const stored = localStorage.getItem(fullKey);

      if (!stored) {
        return defaultValue;
      }

      const payload = JSON.parse(stored);

      // Validar versão
      if (payload.version !== this.version) {
        console.warn(`⚠️ Versão diferente para ${key}, aplicando migration`);
        return this._migrate(payload.data, payload.version);
      }

      return payload.data || defaultValue;
    } catch (error) {
      console.error(`❌ Erro ao carregar ${key}:`, error.message);
      return defaultValue;
    }
  }

  /**
   * ═══════════════════════════════════
   * DELETE & CLEAR
   * ═══════════════════════════════════
   */

  /**
   * Deleta uma chave específica
   * @param {string} key
   * @returns {boolean} Sucesso
   */
  delete(key) {
    if (!this.isAvailable) return false;

    try {
      const fullKey = this._getFullKey(key);
      localStorage.removeItem(fullKey);
      console.log(`🗑️ Deletado: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao deletar ${key}:`, error);
      return false;
    }
  }

  /**
   * Limpa TUDO (exceto user preferences)
   * @returns {boolean} Sucesso
   */
  clear() {
    if (!this.isAvailable) return false;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ Tudo limpo');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar localStorage:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════
   * EXPORT & IMPORT
   * ═══════════════════════════════════
   */

  /**
   * Exporta todos os dados como objeto
   * @returns {Object} Dados para exportar
   */
  exportAll() {
    const exported = {};
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        exported[cleanKey] = this.load(cleanKey);
      }
    });

    return {
      version: this.version,
      exportedAt: new Date().toISOString(),
      data: exported,
    };
  }

  /**
   * Importa dados de um objeto
   * @param {Object} imported - Dados para importar
   * @returns {boolean} Sucesso
   */
  importData(imported) {
    if (!imported || !imported.data) {
      console.error('❌ Formato de importação inválido');
      return false;
    }

    try {
      // Validar versão
      if (imported.version !== this.version) {
        console.warn('⚠️ Versão do backup diferente, pode haver incompatibilidade');
      }

      // Importar cada chave
      Object.entries(imported.data).forEach(([key, value]) => {
        this.save(key, value);
      });

      console.log('✅ Dados importados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar:', error);
      return false;
    }
  }

  /**
   * ═══════════════════════════════════
   * HELPERS
   * ═══════════════════════════════════
   */

  /**
   * Gera a chave completa com prefixo
   * @private
   */
  _getFullKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Remove dados antigos quando quota excedida
   * @private
   */
  _clearOldData() {
    const keys = Object.keys(localStorage);
    const prefixedKeys = keys.filter((k) => k.startsWith(this.prefix));

    // Ordena por timestamp (mais antigos primeiro)
    prefixedKeys.sort((a, b) => {
      try {
        const dataA = JSON.parse(localStorage.getItem(a));
        const dataB = JSON.parse(localStorage.getItem(b));
        return (dataA.timestamp || 0) - (dataB.timestamp || 0);
      } catch {
        return 0;
      }
    });

    // Remove 20% dos itens mais antigos
    const toRemove = Math.ceil(prefixedKeys.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(prefixedKeys[i]);
      console.log(`🗑️ Limpando dados antigos: ${prefixedKeys[i]}`);
    }
  }

  /**
   * Migração de versão
   * @private
   */
  _migrate(data, oldVersion) {
    if (oldVersion === this.version) {
      return data;
    }

    console.log(`🔄 Migrando de v${oldVersion} para v${this.version}`);

    // Adicionar migrations aqui conforme necessário
    // Exemplo:
    // if (oldVersion === 1 && this.version === 2) {
    //   data.newField = 'defaultValue';
    // }

    return data;
  }

  /**
   * ═══════════════════════════════════
   * DEBUG
   * ═══════════════════════════════════
   */

  /**
   * Lista todos os dados salvos
   */
  listAll() {
    const keys = Object.keys(localStorage);
    const data = {};

    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        const cleanKey = key.replace(this.prefix, '');
        try {
          const payload = JSON.parse(localStorage.getItem(key));
          data[cleanKey] = {
            version: payload.version,
            savedAt: new Date(payload.timestamp).toLocaleString('pt-BR'),
            size: `${(JSON.stringify(payload).length / 1024).toFixed(2)}kb`,
          };
        } catch (e) {
          data[cleanKey] = '❌ Erro ao ler';
        }
      }
    });

    console.table(data);
    return data;
  }

  /**
   * Retorna estatísticas de uso
   */
  getStats() {
    let totalSize = 0;
    let itemCount = 0;
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(this.prefix)) {
        itemCount++;
        totalSize += localStorage.getItem(key).length;
      }
    });

    return {
      items: itemCount,
      sizeKb: (totalSize / 1024).toFixed(2),
      quotaEstimated: '5-10MB (depende do navegador)',
    };
  }
}

/**
 * Instância global
 */
export const storage = new StorageManager();

export default storage;