# README - Extensão Chrome: TESTE L.I.A – Lembrete de Interações Automatizado

## Descrição
Esta extensão Chrome monitora o tempo que um cliente enviou uma mensagem e emite alertas quando o tempo limite para resposta estiver próximo. Além disso, realiza atualizações automáticas da página e alerta sobre conversas críticas.

## Estrutura do Projeto
- **manifest.json**: Define as permissões e os arquivos principais da extensão.
- **content.js**: Script de monitoramento e lógica de alertas.
- **background.js**: Lida com eventos em segundo plano.
- **style.css**: Estilização de elementos visuais (opcional).

## Permissões
- `activeTab`, `tabs`: Interagir com as abas abertas.
- `system.display`, `windows`: Gerenciar estado de janelas e notificações.

## Principais Funcionalidades
### 1. **Auto Refresh**
- Realiza um refresh automático a cada 5 minutos (300000 ms) via `startAutoRefresh()`.
- Executa um refresh inteligente que preserva o estado de conversas ignoradas e notificações.

### 2. **Monitoramento de Conversas**
- Verifica se há conversas com mais de 20 minutos de espera (`checkCriticalConversations()`).
- Inicia alertas periódicos críticos (`startCriticalAlerts()`), piscando o título da aba e enviando notificações.

### 3. **Alertas Visuais e Sonoros**
- Alerta com `Notification` e piscando o título da aba (`focusWindow()`).
- Cooldown de 60 segundos para alertas comuns.

### 4. **Detecção de Conversas em Atendimento**
- Verifica se a conversa possui o selo "Em atendimento" (`isConversationAttended()`).

## Instalação
1. Faça o download dos arquivos (`manifest.json`, `content.js`, `background.js`, `style.css`).
2. No Chrome, acesse `chrome://extensions/`.
3. Ative o modo desenvolvedor.
4. Clique em **Carregar sem compactação** e selecione a pasta com os arquivos.

## Observações
- O seletor CSS utilizado para identificar as conversas é adaptado ao layout do Gestta.
- Recomenda-se solicitar permissão para notificações ao instalar.

---
Desenvolvido para o projeto **L.I.A – Lembrete de Interações Automatizado**.

