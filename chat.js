/**
 * CHAT.JS
 * Página de chat com Claude IA
 */

import { appState } from './state.js';
import { api } from './api.js';
import * as ui from './ui.js';
import { CHAT_QUICK_QUESTIONS } from './constants.js';

/**
 * ═══════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════
 */

export function initChat() {
  appState.subscribe((state, action) => {
    if (action.type.includes('CHAT') || action.type === 'SET_STATE') {
      renderChat();
    }
  });

  renderChat();
}

/**
 * ═══════════════════════════════════
 * RENDER
 * ═══════════════════════════════════
 */

function renderChat() {
  const container = ui.getEl('page-chat');
  if (!container) return;

  ui.clearElement(container);

  // Check if API key configured
  const state = appState.getState();
  if (!state.apiKeyConfigured) {
    renderApiKeyPrompt(container);
    return;
  }

  // Chat area
  const chatArea = ui.createElement('div');
  chatArea.style.flex = '1';
  chatArea.style.display = 'flex';
  chatArea.style.flexDirection = 'column';
  chatArea.style.gap = '16px';
  chatArea.style.marginBottom = '16px';

  // Messages container
  const messagesContainer = ui.createElement('div');
  messagesContainer.id = 'chat-messages';
  messagesContainer.style.flex = '1';
  messagesContainer.style.overflowY = 'auto';
  messagesContainer.style.display = 'flex';
  messagesContainer.style.flexDirection = 'column';
  messagesContainer.style.gap = '12px';
  messagesContainer.style.padding = '16px';
  messagesContainer.style.background = 'var(--bg-secondary)';
  messagesContainer.style.borderRadius = 'var(--radius-lg)';
  messagesContainer.style.minHeight = '300px';

  if (state.chatHistory.length === 0) {
    const welcome = ui.createElement('div');
    welcome.style.textAlign = 'center';
    welcome.style.padding = '32px 16px';
    welcome.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 12px;">🤖</div>
      <div style="font-weight: 700; margin-bottom: 8px;">Olá! Sou a IA do Meu Boletim</div>
      <div style="color: var(--text-muted); font-size: 14px;">
        Posso ajudar com análise de notas, dicas de estudo e responder dúvidas escolares.
      </div>
    `;
    messagesContainer.appendChild(welcome);

    // Quick questions
    const quickDiv = ui.createElement('div');
    quickDiv.style.display = 'flex';
    quickDiv.style.flexDirection = 'column';
    quickDiv.style.gap = '8px';
    quickDiv.style.marginTop = '16px';

    CHAT_QUICK_QUESTIONS.slice(0, 3).forEach((q) => {
      const chip = ui.createElement('button', 'btn btn-outline btn-sm');
      chip.textContent = q;
      chip.style.width = '100%';
      ui.onClick(chip, () => {
        sendMessage(q);
      });
      quickDiv.appendChild(chip);
    });

    messagesContainer.appendChild(quickDiv);
  } else {
    // Render messages
    state.chatHistory.forEach((msg) => {
      const msgEl = createMessageElement(msg);
      messagesContainer.appendChild(msgEl);
    });
  }

  chatArea.appendChild(messagesContainer);

  // Input area
  const inputArea = ui.createElement('div');
  inputArea.style.display = 'flex';
  inputArea.style.gap = '8px';

  const input = ui.createElement('input', 'form-input');
  input.id = 'chat-input';
  input.placeholder = 'Faça uma pergunta...';
  input.style.flex = '1';
  input.style.marginBottom = '0';

  const sendBtn = ui.createElement('button', 'btn btn-primary btn-sm');
  sendBtn.textContent = '➤';
  sendBtn.id = 'chat-send';
  sendBtn.style.padding = '12px 16px';

  ui.onClick(sendBtn, () => {
    const message = input.value.trim();
    if (message) {
      sendMessage(message);
      input.value = '';
    }
  });

  // Enter para enviar
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const message = input.value.trim();
      if (message) {
        sendMessage(message);
        input.value = '';
      }
    }
  });

  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);

  chatArea.appendChild(inputArea);
  container.appendChild(chatArea);

  // Auto scroll
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

/**
 * ═══════════════════════════════════
 * API KEY PROMPT
 * ═══════════════════════════════════
 */

function renderApiKeyPrompt(container) {
  const section = ui.createElement('div', 'page-section');

  const empty = ui.createElement('div', 'empty-state');
  empty.innerHTML = `
    <div class="empty-state-icon">🔑</div>
    <div class="empty-state-title">Ative o Chat com IA</div>
    <div class="empty-state-desc">Configure sua chave de API Claude para usar o chat</div>
  `;

  const group = ui.createElement('div', 'form-group');
  const label = ui.createElement('label', 'form-label', 'Chave de API Claude');
  const input = ui.createElement('input', 'form-input');
  input.type = 'password';
  input.placeholder = 'sk-ant-...';

  const hint = ui.createElement('div', 'form-help');
  hint.innerHTML = '⚠️ A chave será armazenada localmente. <a href="https://console.anthropic.com" target="_blank" style="color: var(--primary);">Obtenha uma chave aqui</a>';

  const btn = ui.createButton('✅ Ativar Chat', () => {
    const key = input.value.trim();
    if (!key) {
      ui.showToast('⚠️ Digite a chave', 1500, 'warning');
      return;
    }

    // Salvar localmente (não é seguro, mas é client-side)
    localStorage.setItem('claude_api_key', key);

    appState.dispatch({
      type: 'SET_API_KEY_CONFIGURED',
      payload: true,
    });

    ui.showToast('✅ Chat ativado!', 1500, 'success');
    renderChat();
  }, 'primary');

  group.appendChild(label);
  group.appendChild(input);
  group.appendChild(hint);
  group.appendChild(btn);

  section.appendChild(empty);
  section.appendChild(group);
  container.appendChild(section);
}

/**
 * ═══════════════════════════════════
 * MESSAGE
 * ═══════════════════════════════════
 */

function createMessageElement(msg) {
  const container = ui.createElement('div');
  container.style.display = 'flex';
  container.style.gap = '8px';
  container.style.justifyContent = msg.role === 'user' ? 'flex-end' : 'flex-start';

  const bubble = ui.createElement('div');
  bubble.style.maxWidth = '85%';
  bubble.style.padding = '12px 16px';
  bubble.style.borderRadius = 'var(--radius-lg)';
  bubble.style.wordWrap = 'break-word';
  bubble.style.whiteSpace = 'pre-wrap';

  if (msg.role === 'user') {
    bubble.style.background = 'var(--primary)';
    bubble.style.color = '#fff';
  } else {
    bubble.style.background = 'var(--bg-tertiary)';
    bubble.style.color = 'var(--text-primary)';
    bubble.style.borderLeft = '3px solid var(--primary)';
  }

  bubble.textContent = msg.content;

  container.appendChild(bubble);
  return container;
}

/**
 * ═══════════════════════════════════
 * SEND MESSAGE
 * ═══════════════════════════════════
 */

async function sendMessage(message) {
  const state = appState.getState();
  const messagesContainer = ui.getEl('chat-messages');
  if (!messagesContainer) return;

  // Add user message
  appState.dispatch({
    type: 'ADD_CHAT_MESSAGE',
    payload: {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    },
  });

  // Show loading
  const loadingDiv = ui.createElement('div');
  loadingDiv.style.display = 'flex';
  loadingDiv.style.gap = '8px';
  loadingDiv.style.alignItems = 'center';
  loadingDiv.innerHTML = '<span class="loader-dot"></span><span class="loader-dot" style="animation-delay: 0.16s"></span><span class="loader-dot" style="animation-delay: 0.32s"></span>';
  loadingDiv.id = 'chat-loading';
  messagesContainer.appendChild(loadingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Preparar histórico para API
    const chatHistory = state.chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Enviar para API
    const response = await api.chat([
      ...chatHistory,
      { role: 'user', content: message },
    ]);

    // Remove loading
    const loading = ui.getEl('chat-loading');
    if (loading) loading.remove();

    // Add AI response
    const content = response.content[0]?.text || 'Desculpe, não consegui processar a resposta.';

    appState.dispatch({
      type: 'ADD_CHAT_MESSAGE',
      payload: {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
      },
    });

    renderChat();
  } catch (error) {
    console.error('Chat error:', error);

    const loading = ui.getEl('chat-loading');
    if (loading) loading.remove();

    ui.showToast('❌ Erro ao enviar mensagem', 2000, 'error');
  }
}

initChat();

export default { initChat, renderChat };
