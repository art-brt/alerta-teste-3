console.log('Monitor de Tempo - Extensão iniciada');

// Variáveis globais
let originalTitle = document.title;
let lastNotificationTime = {};  // Objeto para armazenar o último tempo de notificação para cada nível
const NOTIFICATION_COOLDOWN = 60000; // 60 segundos de cooldown
const CRITICAL_TIME = 20; // 20 minutos
const CRITICAL_ALERT_INTERVAL = 60000; // 1 minuto para alertas críticos
let criticalAlertTimer = null;

// Função para fazer refresh na página
function refreshPage() {
    console.log('Realizando refresh da página');
    window.location.reload();
}

// Função para refresh periódico
function startAutoRefresh(interval = 300000) { // 5 minutos por padrão
    setInterval(refreshPage, interval);
    console.log(`Auto refresh configurado para cada ${interval/1000} segundos`);
}

// Função para refresh inteligente
function smartRefresh() {
    // Salva o estado atual antes do refresh
    const currentState = {
        ignoredConversations: localStorage.getItem('ignoredConversations'),
        lastNotifications: JSON.stringify(lastNotificationTime),
        timestamp: Date.now()
    };
    localStorage.setItem('preRefreshState', JSON.stringify(currentState));
    
    // Executa o refresh
    refreshPage();
}

// Função para verificar se deve fazer refresh após certas ações
function checkForRefresh() {
    const currentTime = Date.now();
    const lastRefreshTime = parseInt(localStorage.getItem('lastRefreshTime')) || 0;
    const REFRESH_INTERVAL = 300000; // 5 minutos
    
    if (currentTime - lastRefreshTime > REFRESH_INTERVAL) {
        localStorage.setItem('lastRefreshTime', currentTime.toString());
        smartRefresh();
    }
}

// Função para verificar o estado da janela
function checkWindowState() {
    if (document.hidden) {
        console.log('Janela está minimizada ou em segundo plano');
        return false;
    }
    return true;
}

// Função para focar na janela e aba correta
function focusWindow() {
    console.log('Tentando focar e maximizar a janela');
    
    chrome.runtime.sendMessage({ 
        action: 'focusTab', 
        tabId: window.tabId 
    });
    
    window.focus();
    
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Alerta de Tempo!', {
            body: 'Existem conversas precisando de atenção!',
            requireInteraction: true
        });
    }

    if (window.flashInterval) {
        clearInterval(window.flashInterval);
    }
    
    window.flashInterval = setInterval(() => {
        document.title = document.title === originalTitle ? '🚨 ALERTA! 🚨' : originalTitle;
    }, 1000);

    setTimeout(() => {
        if (window.flashInterval) {
            clearInterval(window.flashInterval);
            document.title = originalTitle;
        }
    }, 5000);
}

// Função para verificar se a conversa está sendo atendida
function isConversationAttended(index) {
    const attendedIndicator = document.querySelector(`#page-content > div > div.sc-WViWL.sc-ewbAlf.dpFbqB.bDOQYU > div.sc-gmoidK.jRDomp > div > div:nth-child(${index}) > div.sc-DNJco.dxDXQC > div.sc-fGPuXZ.juENAy > div.sc-fGPuXZ.cmpOFQ > span[title="Em atendimento"]`);
    return !!attendedIndicator;
}

// Função para extrair minutos do texto
function extractMinutes(timeText) {
    const match = timeText.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
}

// Função para verificar conversas críticas
function checkCriticalConversations() {
    const elements = document.querySelectorAll("#page-content > div > div.sc-WViWL.sc-ewbAlf.dpFbqB.bDOQYU > div.sc-gmoidK.jRDomp > div > div > div.sc-DNJco.dxDXQC > div.sc-fGPuXZ.llLkZm > div.sc-fGPuXZ.cmpOFQ > span");
    let hasCriticalConversations = false;

    elements.forEach((element) => {
        const timeText = element.textContent.trim();
        const minutes = extractMinutes(timeText);
        
        if (minutes >= CRITICAL_TIME) {
            hasCriticalConversations = true;
        }
    });

    return hasCriticalConversations;
}

// Função para iniciar alertas críticos
function startCriticalAlerts() {
    if (criticalAlertTimer) {
        clearInterval(criticalAlertTimer);
    }

    criticalAlertTimer = setInterval(() => {
        if (checkCriticalConversations()) {
            // Força o bypass do cooldown para alertas críticos
            lastNotificationTime = {};
            checkTimeSpans();
        } else {
            clearInterval(criticalAlertTimer);
            criticalAlertTimer = null;
        }
    }, CRITICAL_ALERT_INTERVAL);
}