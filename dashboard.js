/**
 * DASHBOARD.JS
 * Página inicial com estatísticas, gráficos e insights
 */

import { appState } from './state.js';
import * as ui from './ui.js';
import { calculateAverage, calculateProgress } from './utils.js';

let chart = null;

/**
 * ═══════════════════════════════════
 * INITIALIZATION
 * ═══════════════════════════════════
 */

/**
 * Inicializa dashboard
 */
export function initDashboard() {
  appState.subscribe((state, action) => {
    // Re-render ao carregar ou atualizar subjects
    if (action.type.includes('SUBJECT') || action.type === 'SET_STATE') {
      renderDashboard();
    }
  });

  // Primeira renderização
  renderDashboard();
}

/**
 * ═══════════════════════════════════
 * RENDER
 * ═══════════════════════════════════
 */

/**
 * Renderiza dashboard inteira
 */
function renderDashboard() {
  const state = appState.getState();
  const container = ui.getEl('page-resumo');

  if (!container) return;

  // Limpar
  ui.clearElement(container);

  // Hero card (média geral)
  const heroCard = createHeroCard();
  container.appendChild(heroCard);

  // Stats row
  const statsRow = createStatsRow();
  container.appendChild(statsRow);

  // Chart
  const chartContainer = createChartContainer();
  container.appendChild(chartContainer);

  // Achievements
  const achievementsSection = createAchievementsSection();
  container.appendChild(achievementsSection);

  // Summary
  const summarySection = createSummarySection();
  container.appendChild(summarySection);

  // AI Insights
  const insightsSection = createInsightsSection();
  container.appendChild(insightsSection);
}

/**
 * ═══════════════════════════════════
 * HERO CARD (Média Geral)
 * ═══════════════════════════════════
 */

function createHeroCard() {
  const state = appState.getState();
  const generalAvg = appState.getGeneralAverage();
  const approvedCount = appState.getApprovedSubjectsCount();
  const totalSubjects = state.subjects.length;

  const card = ui.createElement('div', 'avg-hero');

  const label = ui.createElement('div', 'avg-label', 'Média Geral');
  const number = ui.createElement('div', 'avg-number', generalAvg ? generalAvg.toFixed(1) : '—');
  const status = ui.createElement('div', 'avg-status');

  if (generalAvg) {
    if (generalAvg >= state.profile.minGrade) {
      status.textContent = '✅ APROVADO';
      status.style.color = 'var(--success)';
    } else if (generalAvg >= state.profile.minGrade - 1) {
      status.textContent = '⚠️ RECUPERAÇÃO';
      status.style.color = 'var(--warning)';
    } else {
      status.textContent = '❌ REPROVADO';
      status.style.color = 'var(--danger)';
    }
  } else {
    status.textContent = 'Adicione notas';
  }

  const progress = ui.createElement('div', 'avg-progress');
  const progressBar = ui.createElement('div', 'progress');
  const progressFill = ui.createElement('div', 'progress-bar');
  if (generalAvg) {
    progressFill.style.width = `${Math.min((generalAvg / 10) * 100, 100)}%`;
  }
  progressBar.appendChild(progressFill);
  progress.appendChild(progressBar);

  card.appendChild(label);
  card.appendChild(number);
  card.appendChild(status);
  card.appendChild(progress);

  return card;
}

/**
 * ═══════════════════════════════════
 * STATS ROW
 * ═══════════════════════════════════
 */

function createStatsRow() {
  const state = appState.getState();
  const approvedCount = appState.getApprovedSubjectsCount();
  const atRiskCount = appState.getAtRiskSubjectsCount();
  const totalSubjects = state.subjects.length;

  const row = ui.createElement('div', 'stats-row');

  const approved = ui.createElement('div', 'stat-card');
  approved.innerHTML = `
    <div class="stat-label">✅ Aprovadas</div>
    <div class="stat-val">${approvedCount}</div>
    <div class="stat-sub">${totalSubjects > 0 ? Math.round((approvedCount / totalSubjects) * 100) : 0}% de ${totalSubjects}</div>
  `;

  const atRisk = ui.createElement('div', 'stat-card');
  atRisk.innerHTML = `
    <div class="stat-label">⚠️ Em Risco</div>
    <div class="stat-val">${atRiskCount}</div>
    <div class="stat-sub">Precisa atenção</div>
  `;

  row.appendChild(approved);
  row.appendChild(atRisk);

  return row;
}

/**
 * ═══════════════════════════════════
 * CHART (Evolução)
 * ═══════════════════════════════════
 */

function createChartContainer() {
  const state = appState.getState();
  const container = ui.createElement('div', 'chart-container');

  const title = ui.createElement('div', 'chart-title', '📈 Evolução por Bimestre');
  container.appendChild(title);

  const canvas = ui.createElement('canvas');
  canvas.id = 'grafico-evolucao';
  container.appendChild(canvas);

  // Renderizar chart após um pouco (canvas precisa estar no DOM)
  setTimeout(() => {
    renderChart(canvas);
  }, 100);

  return container;
}

function renderChart(canvas) {
  const state = appState.getState();

  if (!canvas || typeof Chart === 'undefined') {
    console.warn('⚠️ Chart.js não carregado');
    return;
  }

  // Destruir chart anterior
  if (chart) {
    chart.destroy();
  }

  const labels = Array.from({ length: state.bimestres }, (_, i) => `${i + 1}º Bim`);

  const datasets = state.subjects.map((sub, idx) => {
    const colors = ['#7c6bff', '#4ade80', '#fbbf24', '#f87171', '#60a5fa', '#ec4899'];
    const color = colors[idx % colors.length];

    return {
      label: sub.name,
      data: sub.grades.slice(0, state.bimestres).map((g) => (g !== null ? parseFloat(g) : null)),
      borderColor: color,
      backgroundColor: color + '15',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: 'var(--bg-secondary)',
      pointBorderColor: color,
    };
  });

  const ctx = canvas.getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: 'var(--text-primary)', font: { family: 'Syne' } },
        },
        tooltip: {
          backgroundColor: 'var(--bg-secondary)',
          titleColor: 'var(--text-primary)',
          bodyColor: 'var(--text-primary)',
          borderColor: 'var(--border-color)',
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: 'var(--text-muted)' },
        },
        x: {
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          ticks: { color: 'var(--text-muted)' },
        },
      },
    },
  });
}

/**
 * ═══════════════════════════════════
 * ACHIEVEMENTS
 * ═══════════════════════════════════
 */

function createAchievementsSection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '🏆 Conquistas');
  section.appendChild(title);

  const grid = ui.createElement('div', 'grid grid-cols-3');

  const achievements = [
    { id: 'first_10', icon: '⭐', name: 'Dez Perfeito', desc: 'Tirou 10' },
    { id: 'all_approved', icon: '🏆', name: 'Tudo Aproved', desc: 'Todas ≥ 6' },
    { id: 'study_streak_7', icon: '🔥', name: 'Dedicado', desc: '7 dias' },
    { id: 'study_streak_30', icon: '🌟', name: 'Inconstestável', desc: '30 dias' },
    { id: 'chat_explorer', icon: '🤖', name: 'Explorador', desc: '1ª msg' },
    { id: 'master_student', icon: '👨‍🎓', name: 'Master', desc: 'Média ≥ 8.5' },
  ];

  achievements.forEach((ach) => {
    const isUnlocked = state.achievements[ach.id];
    const card = ui.createElement('div', ['achievement', isUnlocked ? 'unlocked' : 'locked']);

    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div class="achievement-name">${ach.name}</div>
      <div class="achievement-desc">${isUnlocked ? '✓' : '🔒'}</div>
    `;

    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}

/**
 * ═══════════════════════════════════
 * SUMMARY BY SUBJECT
 * ═══════════════════════════════════
 */

function createSummarySection() {
  const state = appState.getState();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '📚 Resumo por Matéria');
  section.appendChild(title);

  if (state.subjects.length === 0) {
    const empty = ui.createElement('div', 'empty-state');
    empty.innerHTML = `
      <div class="empty-state-icon">📕</div>
      <div class="empty-state-title">Nenhuma matéria</div>
      <div class="empty-state-desc">Adicione suas matérias na página de Notas</div>
    `;
    section.appendChild(empty);
    return section;
  }

  const container = ui.createElement('div', 'stack stack-md');

  state.subjects.forEach((sub) => {
    const avg = calculateAverage(sub.grades);
    const pct = avg !== null ? Math.min((avg / 10) * 100, 100) : 0;

    let color = 'var(--text-muted)';
    if (avg !== null) {
      if (avg >= state.profile.minGrade) color = 'var(--success)';
      else if (avg >= state.profile.minGrade - 1) color = 'var(--warning)';
      else color = 'var(--danger)';
    }

    const bar = ui.createElement('div', 'grade-bar-row');
    bar.innerHTML = `
      <div class="grade-bar-label">${sub.emoji} ${sub.name}</div>
      <div class="grade-bar-bg">
        <div class="grade-bar-fill" style="width: ${pct}%; background: ${color}"></div>
      </div>
      <div class="grade-bar-val" style="color: ${color}">${avg !== null ? avg.toFixed(1) : '—'}</div>
    `;

    container.appendChild(bar);
  });

  section.appendChild(container);
  return section;
}

/**
 * ═══════════════════════════════════
 * AI INSIGHTS
 * ═══════════════════════════════════
 */

function createInsightsSection() {
  const state = appState.getState();
  const generalAvg = appState.getGeneralAverage();

  const section = ui.createElement('div', 'page-section');
  const title = ui.createElement('h3', 'page-section-title', '💡 Insights da IA');
  section.appendChild(title);

  const insights = [];

  // Insight 1: Desempenho geral
  if (generalAvg) {
    if (generalAvg >= 9) {
      insights.push({
        emoji: '🌟',
        title: 'Excelente desempenho!',
        text: 'Você está indo muito bem. Continue assim!',
      });
    } else if (generalAvg >= 8) {
      insights.push({
        emoji: '👏',
        title: 'Bom desempenho',
        text: 'Você está acima da média. Parabéns!',
      });
    } else if (generalAvg >= state.profile.minGrade) {
      insights.push({
        emoji: '📈',
        title: 'Você passa',
        text: 'Está aprovado, mas pode melhorar mais.',
      });
    } else {
      insights.push({
        emoji: '⚠️',
        title: 'Atenção necessária',
        text: 'Foque nas matérias com notas baixas.',
      });
    }
  }

  // Insight 2: Streak
  if (state.streak.days >= 7) {
    insights.push({
      emoji: '🔥',
      title: 'Dedicação em alta',
      text: `${state.streak.days} dias de streak! Continue atualizando.`,
    });
  }

  // Insight 3: Próximas provas
  const nextProvas = state.provas
    .filter((p) => new Date(p.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 2);

  if (nextProvas.length > 0) {
    insights.push({
      emoji: '📝',
      title: 'Provas em breve',
      text: `Você tem ${nextProvas.length} prova${nextProvas.length > 1 ? 's' : ''} agendada${nextProvas.length > 1 ? 's' : ''}.`,
    });
  }

  // Renderizar insights
  if (insights.length === 0) {
    insights.push({
      emoji: '💫',
      title: 'Continue acompanhando',
      text: 'Adicione notas e provas para ver insights personalizados.',
    });
  }

  const container = ui.createElement('div', 'stack stack-md');

  insights.forEach((insight) => {
    const card = ui.createElement('div', 'ai-suggestion');
    card.innerHTML = `
      <div class="ai-icon">${insight.emoji}</div>
      <div>
        <div class="ai-title">${insight.title}</div>
        <div class="ai-text">${insight.text}</div>
      </div>
    `;
    container.appendChild(card);
  });

  section.appendChild(container);
  return section;
}

// Inicializar
initDashboard();

export default { initDashboard, renderDashboard };
