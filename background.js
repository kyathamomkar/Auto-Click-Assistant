// Background service worker for Auto Click Assistant
console.log('Auto Click Assistant: Background script loaded');

// Initialize extension storage
chrome.runtime.onInstalled.addListener(() => {
  console.log('Auto Click Assistant: Extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    clickInterval: 20,
    autoScroll: true,
    isAutomationRunning: false
  });
});

// Handle messages between popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.action) {
    case 'scanButtons':
      forwardToActiveTab(message, sendResponse);
      return true; // Keep channel open for async response
      
    case 'startAutomation':
      forwardToActiveTab(message, sendResponse);
      return true;
      
    case 'stopAutomation':
      forwardToActiveTab(message, sendResponse);
      return true;
      
    case 'highlightButtons':
      forwardToActiveTab(message, sendResponse);
      return true;
      
    case 'progressUpdate':
      // Forward progress updates from content script to popup
      forwardToPopup(message, sendResponse);
      return true;
    case 'automationComplete':
		console.log('Automation completed:');
		// Handle completion logic here
		sendResponse({ success: true });
		break;
    default:
      console.log('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Forward messages to the active tab's content script
async function forwardToActiveTab(message, sendResponse) {
  try {
    // Get the active tab
    const [activeTab] = await chrome.tabs.query({ 
      active: true, 
      currentWindow: true 
    });
    
    if (!activeTab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }
    
    if (!activeTab.id) {
      sendResponse({ success: false, error: 'Active tab has no ID' });
      return;
    }
    
    // Check if the page is a restricted page where content scripts can't run
    if (isRestrictedPage(activeTab.url)) {
      sendResponse({ 
        success: false, 
        error: 'Cannot run on this page. Try a regular website (like google.com).' 
      });
      return;
    }
    
    console.log('Forwarding message to tab:', activeTab.id, activeTab.url);
    
    try {
      // First, try to send the message to see if content script is loaded
      const response = await chrome.tabs.sendMessage(activeTab.id, message);
      sendResponse(response);
      
    } catch (connectionError) {
      console.log('Content script not found, attempting to inject...');
      
      // Try to inject the content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });
        
        console.log('Content script injected successfully');
        
        // Wait a moment for the script to initialize
        setTimeout(async () => {
          try {
            const response = await chrome.tabs.sendMessage(activeTab.id, message);
            sendResponse(response);
          } catch (retryError) {
            console.error('Still failed after injection:', retryError);
            sendResponse({ 
              success: false, 
              error: 'Content script injection failed. Try refreshing the page.' 
            });
          }
        }, 1000);
        
      } catch (injectionError) {
        console.error('Failed to inject content script:', injectionError);
        sendResponse({ 
          success: false, 
          error: 'Cannot access this page. Try a regular website or refresh the page.' 
        });
      }
    }
    
  } catch (error) {
    console.error('Error in forwardToActiveTab:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Check if the current page is restricted (where content scripts can't run)
function isRestrictedPage(url) {
  if (!url) return true;
  
  const restrictedPatterns = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'edge://',
    'about:',
    'file://'
  ];
  
  return restrictedPatterns.some(pattern => url.startsWith(pattern));
}

// Forward messages to popup (if open)
function forwardToPopup(message, sendResponse) {
  console.log('=== BACKGROUND: Forwarding to popup ===');
  console.log('Message being stored:', message);
  
  // Note: In manifest v3, we can't directly message popup
  // Popup will poll for updates or we'll use storage
  const updateData = {
    ...message,
    timestamp: Date.now()
  };
  
  chrome.storage.local.set({
    lastProgressUpdate: updateData
  }, () => {
    console.log('Progress update stored in chrome.storage.local:', updateData);
    sendResponse({ success: true });
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});

// Clean up when tab is closed or navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    // Page is navigating - stop any running automation
    chrome.tabs.sendMessage(tabId, { action: 'stopAutomation' })
      .catch(() => {
        // Content script might not be ready yet, ignore error
      });
  }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined') {
  module.exports = {
    forwardToActiveTab,
    forwardToPopup
  };
}