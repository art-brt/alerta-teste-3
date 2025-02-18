// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'focusTab') {
        chrome.tabs.update(sender.tab.id, { active: true });
        chrome.windows.update(sender.tab.windowId, { focused: true });
    }
});