/**
 * CONSTANTS.JS
 * Constantes, configurações e dados estáticos
 * Não muda durante execução
 */

export const APP_CONFIG = {
  name: 'Meu Boletim',
  version: '2.0.0',
  minGrade: 6.0,
  maxGrade: 10.0,
  bimestresDefault: 4,
  maxSubjects: 20,
  maxTasks: 100,
  maxProvas: 50,
  chatMaxHistory: 50,
  toastDuration: 2800,
  storagePrefix: 'boletim_v2_',
  // Versão do schema de dados (para migrations)
  dataSchemaVersion: 2,
};

export const DEFAULT_SUBJECTS = [
  { name: 'Português', icon: '📚' },
  { name: 'Matemática', icon: '🔢' },
  { name: 'Ciências', icon: '🔬' },
  { name: 'História', icon: '🏛️' },
  { name: 'Geografia', icon: '🗺️' },
  { name: 'Inglês', icon: '🌍' },
  { name: 'Educação Física', icon: '⚽' },
  { name: 'Arte', icon: '🎨' },
];

export const ACHIEVEMENT_DEFINITIONS = {
  first_10: {
    id: 'first_10',
    icon: '⭐',
    title: 'Dez Perfeito',
    description: 'Tirou 10.0 em uma prova',
    condition: 'grades.some(g => g === 10)',
  },
  all_approved: {
    id: 'all_approved',
    icon: '🏆',
    title: 'Tudo Aprovado',
    description: 'Todas as matérias com média ≥ 6',
    condition: 'allSubjectsApproved',
  },
  study_streak_7: {
    id: 'study_streak_7',
    icon: '🔥',
    title: 'Dedicado',
    description: '7 dias atualizando o boletim',
    condition: 'streakDays >= 7',
  },
  study_streak_30: {
    id: 'study_streak_30',
    icon: '🌟',
    title: 'Inconstestável',
    description: '30 dias seguidos acompanhando',
    condition: 'streakDays >= 30',
  },
  no_absences: {
    id: 'no_absences',
    icon: '✅',
    title: 'Presente!',
    description: '0 faltas em uma matéria',
    condition: 'faltas === 0',
  },
  chat_explorer: {
    id: 'chat_explorer',
    icon: '🤖',
    title: 'Explorador de IA',
    description: 'Enviou primeira mensagem ao chat',
    condition: 'chatMessages >= 1',
  },
  master_student: {
    id: 'master_student',
    icon: '👨‍🎓',
    title: 'Aluno Master',
    description: 'Média geral ≥ 8.5',
    condition: 'generalAverage >= 8.5',
  },
};

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Dados inválidos',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente',
  API_ERROR: 'Erro na API. Tente novamente mais tarde',
  STORAGE_ERROR: 'Erro ao salvar dados',
  NOT_FOUND: 'Item não encontrado',
  UNAUTHORIZED: 'Acesso não autorizado',
  INVALID_API_KEY: 'Chave de API inválida',
  INVALID_JSON: 'JSON inválido',
};

export const SUCCESS_MESSAGES = {
  SAVED: '✅ Salvo com sucesso!',
  DELETED: '✅ Removido com sucesso!',
  CREATED: '✅ Criado com sucesso!',
  UPDATED: '✅ Atualizado com sucesso!',
  EXPORTED: '✅ Exportado com sucesso!',
  IMPORTED: '✅ Importado com sucesso!',
  API_KEY_SAVED: '✅ Chave salva! Chat ativado 🤖',
};

export const ROUTES = {
  DASHBOARD: 'dashboard',
  SUBJECTS: 'subjects',
  AGENDA: 'agenda',
  CHAT: 'chat',
  CONFIG: 'config',
};

export const THEME_OPTIONS = {
  DARK: 'dark',
  LIGHT: 'light',
};

export const STORAGE_KEYS = {
  SUBJECTS: `${APP_CONFIG.storagePrefix}subjects`,
  PROFILE: `${APP_CONFIG.storagePrefix}profile`,
  ACHIEVEMENTS: `${APP_CONFIG.storagePrefix}achievements`,
  PROVAS: `${APP_CONFIG.storagePrefix}provas`,
  TAREFAS: `${APP_CONFIG.storagePrefix}tarefas`,
  CHAT_HISTORY: `${APP_CONFIG.storagePrefix}chat_history`,
  THEME: `${APP_CONFIG.storagePrefix}theme`,
  STREAK: `${APP_CONFIG.storagePrefix}streak`,
  API_KEY: `${APP_CONFIG.storagePrefix}api_key`,
  LAST_UPDATE: `${APP_CONFIG.storagePrefix}last_update`,
};

/**
 * Status de carregamento
 */
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Mensagens de motivação
 */
export const MOTIVATIONAL_MESSAGES = [
  '✨ Você é capaz de grandes coisas!',
  '💪 Cada dia é uma oportunidade nova!',
  '🚀 Voe alto, você merece!',
  '⭐ Você está no caminho certo!',
  '🎯 Foco total nos seus objetivos!',
  '🔥 Que nada te derrube!',
  '💯 Você é mais forte do que pensa!',
  '🌟 Seu esforço vale a pena!',
  '🎊 Celebre cada pequeno progresso!',
  '💡 Aprenda, cresça, supere-se!',
  '🎓 Educação é o melhor investimento!',
  '📚 O conhecimento é poder!',
];

/**
 * Sugestões de chat (chips de atalho)
 */
export const CHAT_QUICK_QUESTIONS = [
  'Como estou indo em Matemática?',
  'Dúvida: como passar em Português?',
  'Por que estou ruim em Ciências?',
  'Dicas de organização?',
  'Sou capaz?',
];

/**
 * Configuração de gradientes para hero cards
 */
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
  success: 'linear-gradient(135deg, var(--success), #2dd4bf)',
  warning: 'linear-gradient(135deg, var(--warning), #f59e0b)',
  danger: 'linear-gradient(135deg, var(--danger), #fb7185)',
};

/**
 * Emojis por cor de nota
 */
export const GRADE_EMOJIS = {
  excellent: '⭐',
  good: '👍',
  ok: '☝️',
  warning: '⚠️',
  danger: '❌',
};

/**
 * Regex patterns para validação
 */
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  apiKey: /^sk-ant-[a-zA-Z0-9]{20,}$/,
  url: /^https?:\/\/.+/,
  number: /^-?\d+(\.\d+)?$/,
};

export default {
  APP_CONFIG,
  DEFAULT_SUBJECTS,
  ACHIEVEMENT_DEFINITIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROUTES,
  THEME_OPTIONS,
  STORAGE_KEYS,
  LOADING_STATES,
  MOTIVATIONAL_MESSAGES,
  CHAT_QUICK_QUESTIONS,
  GRADIENTS,
  GRADE_EMOJIS,
  VALIDATION_PATTERNS,
};
