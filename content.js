// Constantes
const CONFIG = {
    NOTIFICATION_COOLDOWN: 60000,
    FLASH_DURATION: 5000,
    FLASH_INTERVAL: 1000,
    URGENCY_LEVELS: {
      yellow: {
        threshold: '10 minutos',
        class: 'yellow',
        icon: '⚠️',
        message: 'Atenção! Tempo chegando ao limite'
      },
      orange: {
        threshold: '12 minutos',
        class: 'orange',
        icon: '⚠️',
        message: 'Alerta! Tempo próximo do limite'
      },
      red: {
        threshold: '15 minutos',
        class: 'red',
        icon: '🚨',
        message: 'URGENTE! Tempo limite atingido'
      },
      purple: {
        threshold: 10, // número de conversas
        class: 'purple',
        icon: '📊',
        message: 'Alto volume de conversas'
      }
    },
    SELECTORS: {
      timeSpans:
        '#page-content > div > div.sc-WViWL.sc-ewbAlf.dpFbqB.bDOQYU > div.sc-gmoidK.jRDomp > div > div > div.sc-DNJco.dxDXQC > div.sc-fGPuXZ.llLkZm > div.sc-fGPuXZ.cmpOFQ > span',
      conversationName: (index) =>
        `#page-content > div > div.sc-WViWL.sc-ewbAlf.dpFbqB.bDOQYU > div.sc-gmoidK.jRDomp > div > div:nth-child(${index}) > div.sc-DNJco.dxDXQC > div.sc-fGPuXZ.juENAy > div.c-PJLV.c-PJLV-icWDQBH-css > span`,
      conversationCount:
        '#page-content > div > div.sc-WViWL.sc-ewbAlf.dpFbqB.bDOQYU > div.sc-kiCMIK.bPNIEE > div > div > div > div:nth-child(1) > div > div.c-dHEioN.c-dHEioN-cCObMy-active-true.c-dHEioN-icchlGd-css > div > div.sc-cUboSx.oWBYF'
    }
  };
  
  // Estado global
  const state = {
    originalTitle: document.title,
    lastNotificationTime: new Map(),
    flashInterval: null
  };
  
  // Utilitários
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  const safeQuerySelector = (selector) => {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.error(`Erro ao selecionar elemento: ${selector}`, error);
      return null;
    }
  };
  
  // Funções principais
  const checkWindowState = () => !document.hidden;
  
  const focusWindow = () => {
    window.focus();
  
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime
        .sendMessage({
          action: 'focusTab',
          tabId: window.tabId
        })
        .catch(console.error);
    }
  
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerta de Tempo!', {
        body: 'Existem conversas precisando de atenção!',
        requireInteraction: true
      });
    }
  
    if (state.flashInterval) clearInterval(state.flashInterval);
  
    state.flashInterval = setInterval(() => {
      document.title =
        document.title === state.originalTitle ? '🚨 ALERTA! 🚨' : state.originalTitle;
    }, CONFIG.FLASH_INTERVAL);
  
    setTimeout(() => {
      if (state.flashInterval) {
        clearInterval(state.flashInterval);
        document.title = state.originalTitle;
      }
    }, CONFIG.FLASH_DURATION);
  };
  
  const getConversationName = (index) => {
    const element = safeQuerySelector(CONFIG.SELECTORS.conversationName(index));
    return element?.getAttribute('title') || 'Conversa';
  };
  
  const checkConversationCount = debounce(() => {
    const countElement = safeQuerySelector(CONFIG.SELECTORS.conversationCount);
    if (!countElement) return;
  
    const count = parseInt(countElement.textContent.trim());
    if (isNaN(count)) return;
  
    if (count >= CONFIG.URGENCY_LEVELS.purple.threshold) {
      showAlertModal([{ name: `Total de ${count} conversas em andamento` }], 'purple');
    }
  }, 500);
  
  const closeModal = () => {
    document.querySelector('.modal-backdrop')?.remove();
    document.querySelector('.alert-modal')?.remove();
    document.title = state.originalTitle;
  
    if (state.flashInterval) {
      clearInterval(state.flashInterval);
    }
  };
  
  const showAlertModal = (conversationsData, urgencyLevel) => {
    // Evita criar mais de um modal simultaneamente
    if (document.querySelector('.alert-modal')) return;
  
    const currentTime = Date.now();
    const lastTime = state.lastNotificationTime.get(urgencyLevel) || 0;
  
    if (currentTime - lastTime < CONFIG.NOTIFICATION_COOLDOWN) return;
  
    state.lastNotificationTime.set(urgencyLevel, currentTime);
  
    if (!checkWindowState()) focusWindow();
  
    const config = CONFIG.URGENCY_LEVELS[urgencyLevel];
  
    // Criação do backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.onclick = closeModal;
  
    // Criação do modal
    const modal = document.createElement('div');
    modal.className = `alert-modal ${config.class}`;
  
    modal.innerHTML = `
      <button class="close-button" aria-label="Fechar modal">✖</button>
      <h2>${config.icon} ${config.message} ${config.icon}</h2>
      <ul class="conversation-list">
        ${conversationsData
          .filter((conv) => conv.name && conv.name.trim())
          .map((conv) => `<li>${conv.name.trim()}</li>`)
          .join('')}
      </ul>
    `;
  
    // Evento para fechar o modal
    modal.querySelector('.close-button').addEventListener('click', closeModal);
  
    // Adiciona o modal e o backdrop na página
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
  };
  
  const checkTimeSpans = debounce(() => {
    const elements = document.querySelectorAll(CONFIG.SELECTORS.timeSpans);
    const alerts = new Map([
      ['yellow', []],
      ['orange', []],
      ['red', []]
    ]);
  
    elements.forEach((element, index) => {
      const timeText = element.textContent.trim();
      const convData = {
        name: getConversationName(index + 1),
        index: index + 1
      };
  
      Object.entries(CONFIG.URGENCY_LEVELS).forEach(([level, config]) => {
        if (timeText === config.threshold) {
          alerts.get(level).push(convData);
        }
      });
    });
  
    // Exibe o alerta de maior urgência
    if (alerts.get('red').length) {
      showAlertModal(alerts.get('red'), 'red');
    } else if (alerts.get('orange').length) {
      showAlertModal(alerts.get('orange'), 'orange');
    } else if (alerts.get('yellow').length) {
      showAlertModal(alerts.get('yellow'), 'yellow');
    }
  }, 500);
  
  const init = () => {
    const observer = new MutationObserver(() => {
      checkTimeSpans();
      checkConversationCount();
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkTimeSpans();
        checkConversationCount();
      }
    });
  
    if ('Notification' in window) {
      Notification.requestPermission().catch(console.error);
    }
  
    checkTimeSpans();
    checkConversationCount();
  };
  
  init();
  