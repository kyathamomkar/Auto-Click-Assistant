// Popup script for Auto Click Assistant
console.log('Auto Click Assistant: Popup script loaded');

// UI state management
const PopupState = {
  isScanning: false,
  isAutomationRunning: false,
  buttonPatterns: [],
  selectedPattern: null,
  automationStats: {
    startTime: null,
    clickedCount: 0,
    totalButtons: 0
  }
};

// ===========================================
// UI ELEMENT REFERENCES
// ===========================================

const elements = {
  scanStatus: null,
  buttonSelection: null,
  buttonDropdown: null,
  settingsSection: null,
  intervalInput: null,
  autoScrollCheckbox: null,
  startBtn: null,
  stopBtn: null,
  progressBar: null,
  progressFill: null,
  statusText: null,
  analyticsPanel: null,
  noButtonsMessage: null
};

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize popup when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded, initializing...');
  
  // Get references to UI elements
  initializeElementReferences();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load saved settings
  await loadSettings();
  
  // Start automatic scanning
  await startButtonScan();
  
  // Start polling for progress updates
  startProgressPolling();
  
  console.log('Popup initialization complete');
});

/**
 * Get references to all UI elements
 */
function initializeElementReferences() {
  elements.scanStatus = document.getElementById('scan-status');
  elements.buttonSelection = document.getElementById('button-selection');
  elements.buttonDropdown = document.getElementById('button-dropdown');
  elements.settingsSection = document.getElementById('settings-section');
  elements.intervalInput = document.getElementById('interval-input');
  elements.autoScrollCheckbox = document.getElementById('auto-scroll');
  elements.startBtn = document.getElementById('start-btn');
  elements.stopBtn = document.getElementById('stop-btn');
  elements.progressBar = document.getElementById('progress-bar');
  elements.progressFill = document.getElementById('progress-fill');
  elements.statusText = document.getElementById('status-text');
  elements.analyticsPanel = document.getElementById('analytics-panel');
  elements.noButtonsMessage = document.getElementById('no-buttons');
  
  console.log('UI element references initialized');
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Dropdown selection change
  if (elements.buttonDropdown) {
    elements.buttonDropdown.addEventListener('change', handlePatternSelection);
  }
  
  // Start button click
  if (elements.startBtn) {
    elements.startBtn.addEventListener('click', handleStartAutomation);
  }
  
  // Stop button click
  if (elements.stopBtn) {
    elements.stopBtn.addEventListener('click', handleStopAutomation);
  }
  
  // Settings changes
  if (elements.intervalInput) {
    elements.intervalInput.addEventListener('change', saveSettings);
  }
  
  if (elements.autoScrollCheckbox) {
    elements.autoScrollCheckbox.addEventListener('change', saveSettings);
  }
  
  console.log('Event listeners set up');
}

// ===========================================
// BUTTON SCANNING
// ===========================================

/**
 * Start scanning for buttons on the current page
 */
async function startButtonScan() {
  console.log('Starting button scan...');
  
  PopupState.isScanning = true;
  updateScanStatus('scanning', 'Scanning page for buttons...');
  
  try {
    // Send scan request to content script
    const response = await sendMessageToContentScript({
      action: 'scanButtons'
    });
    
    if (response.success) {
      PopupState.buttonPatterns = response.patterns;
      
      if (response.patterns.length > 0) {
        console.log(`Found ${response.patterns.length} button patterns`);
        
        // Update UI with results
        updateScanStatus('completed', `Found ${getTotalButtonCount(response.patterns)} buttons`);
        populateButtonDropdown(response.patterns);
        showButtonSelection();
        showSettings();
        
      } else {
        console.log('No button patterns found');
        updateScanStatus('completed', 'No repetitive buttons found');
        showNoButtonsMessage();
      }
      
    } else {
      console.error('Button scan failed:', response.error);
      updateScanStatus('error', 'Failed to scan buttons');
      showNoButtonsMessage();
    }
    
  } catch (error) {
    console.error('Error during button scan:', error);
    updateScanStatus('error', 'Error scanning page');
    showNoButtonsMessage();
  }
  
  PopupState.isScanning = false;
}

/**
 * Get total count of all buttons across patterns
 * @param {Array} patterns - Array of button patterns
 * @returns {number} Total button count
 */
function getTotalButtonCount(patterns) {
  return patterns.reduce((total, pattern) => total + pattern.count, 0);
}

/**
 * Update the scan status display
 * @param {string} status - Status type (scanning/completed/error)
 * @param {string} message - Status message
 */
function updateScanStatus(status, message) {
  if (!elements.scanStatus) return;
  
  // Update CSS class
  elements.scanStatus.className = `scan-status ${status}`;
  
  // Update content based on status
  let icon = '🔍';
  if (status === 'completed') icon = '✅';
  if (status === 'error') icon = '❌';
  
  elements.scanStatus.innerHTML = `
    <div><strong>${icon} ${message}</strong></div>
    ${status === 'completed' ? '<div style="font-size: 12px; margin-top: 4px;">5 different types detected</div>' : ''}
  `;
}

/**
 * Populate the button dropdown with found patterns
 * @param {Array} patterns - Array of button patterns
 */
function populateButtonDropdown(patterns) {
  if (!elements.buttonDropdown) return;
  
  // Clear existing options except the first one
  elements.buttonDropdown.innerHTML = '<option value="">Choose pattern...</option>';
  
  // Add patterns to dropdown
  patterns.forEach(pattern => {
    const option = document.createElement('option');
    option.value = pattern.text;
    option.textContent = `${getPatternIcon(pattern.text)} ${pattern.text} (${pattern.count})`;
    elements.buttonDropdown.appendChild(option);
  });
  
  console.log(`Populated dropdown with ${patterns.length} patterns`);
}

/**
 * Get appropriate icon for button pattern
 * @param {string} text - Button text
 * @returns {string} Emoji icon
 */
function getPatternIcon(text) {
  const lower = text.toLowerCase();
  if (lower.includes('clip')) return '🎫';
  if (lower.includes('like')) return '👍';
  if (lower.includes('follow')) return '➕';
  if (lower.includes('save')) return '💾';
  if (lower.includes('subscribe')) return '🔔';
  if (lower.includes('add')) return '➕';
  return '🔘'; // Default icon
}

// ===========================================
// UI STATE MANAGEMENT
// ===========================================

/**
 * Show the button selection section
 */
function showButtonSelection() {
  if (elements.buttonSelection) {
    elements.buttonSelection.style.display = 'block';
  }
}

/**
 * Show the settings section
 */
function showSettings() {
  if (elements.settingsSection) {
    elements.settingsSection.style.display = 'block';
  }
}

/**
 * Show the no buttons message
 */
function showNoButtonsMessage() {
  if (elements.noButtonsMessage) {
    elements.noButtonsMessage.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">🤷‍♂️</div>
      <div><strong>No repetitive buttons found</strong></div>
      <div style="font-size: 12px; margin-top: 4px;">Try refreshing or navigating to different section</div>
    `;
    elements.noButtonsMessage.style.display = 'block';
  }
  
  // Hide other sections
  hideOtherSections();
}

/**
 * Show page not supported message
 */
function showPageNotSupportedMessage() {
  if (elements.noButtonsMessage) {
    elements.noButtonsMessage.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
      <div><strong>Page not supported</strong></div>
      <div style="font-size: 12px; margin-top: 4px;">Try opening a regular website like google.com</div>
    `;
    elements.noButtonsMessage.style.display = 'block';
  }
  
  hideOtherSections();
}

/**
 * Show refresh required message
 */
function showRefreshRequiredMessage() {
  if (elements.noButtonsMessage) {
    elements.noButtonsMessage.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">🔄</div>
      <div><strong>Please refresh the page</strong></div>
      <div style="font-size: 12px; margin-top: 4px;">Then click the extension icon again</div>
    `;
    elements.noButtonsMessage.style.display = 'block';
  }
  
  hideOtherSections();
}

/**
 * Show regular website message
 */
function showRegularWebsiteMessage() {
  if (elements.noButtonsMessage) {
    elements.noButtonsMessage.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 8px;">🌐</div>
      <div><strong>Visit a regular website</strong></div>
      <div style="font-size: 12px; margin-top: 4px;">Extension works on grocery sites, shopping sites, etc.</div>
    `;
    elements.noButtonsMessage.style.display = 'block';
  }
  
  hideOtherSections();
}

/**
 * Hide other sections when showing error messages
 */
function hideOtherSections() {
  if (elements.buttonSelection) {
    elements.buttonSelection.style.display = 'none';
  }
  if (elements.settingsSection) {
    elements.settingsSection.style.display = 'none';
  }
}

// ===========================================
// EVENT HANDLERS
// ===========================================

/**
 * Handle pattern selection from dropdown
 */
async function handlePatternSelection() {
  const selectedValue = elements.buttonDropdown.value;
  console.log('Pattern selected:', selectedValue);
  
  PopupState.selectedPattern = selectedValue;
  
  // Enable/disable start button based on selection
  if (elements.startBtn) {
    elements.startBtn.disabled = !selectedValue;
  }
  
  // Highlight buttons on page if pattern is selected
  if (selectedValue) {
    try {
      await sendMessageToContentScript({
        action: 'highlightButtons',
        pattern: selectedValue
      });
    } catch (error) {
      console.error('Error highlighting buttons:', error);
    }
  }
}

/**
 * Handle start automation button click
 */
async function handleStartAutomation() {
  if (!PopupState.selectedPattern) {
    console.error('No pattern selected');
    return;
  }
  
  console.log('Starting automation...');
  
  // Get settings
  const interval = parseInt(elements.intervalInput.value) || 20;
  const autoScroll = elements.autoScrollCheckbox.checked;
  
  console.log('Automation settings:', { 
    pattern: PopupState.selectedPattern, 
    interval: interval, 
    autoScroll: autoScroll 
  });
  
  // Update UI state
  PopupState.isAutomationRunning = true;
  PopupState.automationStats.startTime = Date.now();
  PopupState.automationStats.clickedCount = 0;
  
  // Update button states
  elements.startBtn.disabled = true;
  elements.stopBtn.disabled = false;
  elements.buttonDropdown.disabled = true;
  elements.autoScrollCheckbox.disabled = true;
  
  // Hide analytics from previous session
  if (elements.analyticsPanel) {
    elements.analyticsPanel.classList.remove('show');
  }
  
  // Show progress bar
  if (elements.progressBar) {
    elements.progressBar.classList.add('show');
  }
  
  updateStatusText('Starting automation...');
  
  try {
    // Send start command to content script
    console.log('Sending start automation message to content script...');
    const response = await sendMessageToContentScript({
      action: 'startAutomation',
      pattern: PopupState.selectedPattern,
      interval: interval,
      autoScroll: autoScroll
    });
    
    console.log('Start automation response:', response);
    
    if (response.success) {
      console.log('Automation started successfully');
      PopupState.automationStats.totalButtons = response.totalButtons;
      updateStatusText(`Clicking buttons... (0 of ${response.totalButtons})`);
      
      // Force immediate progress check
      setTimeout(() => {
        forceProgressCheck();
      }, 500);
      
    } else {
      console.error('Failed to start automation:', response.error);
      handleStopAutomation();
      updateStatusText('Failed to start automation');
    }
    
  } catch (error) {
    console.error('Error starting automation:', error);
    handleStopAutomation();
    updateStatusText('Error starting automation');
  }
}

/**
 * Force an immediate progress check (called by buttons or user actions)
 * This function was missing and causing the ReferenceError
 */
async function forceProgressCheck() {
  console.log('=== POPUP: Force progress check triggered ===');
  
  try {
    // Immediately check for progress updates
    await checkForProgressUpdates();
    console.log('Force progress check completed');
  } catch (error) {
    console.error('Error in force progress check:', error);
  }
}

/**
 * Handle stop automation button click
 */
async function handleStopAutomation() {
  console.log('Stopping automation...');
  
  PopupState.isAutomationRunning = false;
  
  // Update button states
  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  elements.buttonDropdown.disabled = false;
  elements.autoScrollCheckbox.disabled = false;
  
  // Hide progress bar
  if (elements.progressBar) {
    elements.progressBar.classList.remove('show');
  }
  
  updateStatusText('');
  
  try {
    // Send stop command to content script
    await sendMessageToContentScript({
      action: 'stopAutomation'
    });
    
    console.log('Automation stopped successfully');
    
  } catch (error) {
    console.error('Error stopping automation:', error);
  }
}

// ===========================================
// PROGRESS TRACKING
// ===========================================

/**
 * Start polling for progress updates
 */
function startProgressPolling() {
  // Poll for progress updates every 2 seconds
  setInterval(async () => {
    if (PopupState.isAutomationRunning) {
      await checkForProgressUpdates();
    }
  }, 2000);
}

/**
 * Check for progress updates from background script
 */
async function checkForProgressUpdates() {
  try {
    const result = await chrome.storage.local.get(['lastProgressUpdate']);
    
    if (result.lastProgressUpdate) {
      const update = result.lastProgressUpdate;
      
      // Only process new updates (within last 5 seconds)
      if (Date.now() - update.timestamp < 5000) {
        handleProgressUpdate(update);
      }
    }
    
  } catch (error) {
    console.error('Error checking progress updates:', error);
  }
}

/**
 * Handle progress update from content script
 * @param {Object} update - Progress update data
 */
function handleProgressUpdate(update) {
  if (update.action === 'progressUpdate') {
    PopupState.automationStats.clickedCount = update.clickedCount;
    PopupState.automationStats.totalButtons = update.totalButtons;
    
    // Update progress bar
    const progress = (update.clickedCount / update.totalButtons) * 100;
    if (elements.progressFill) {
      elements.progressFill.style.width = `${progress}%`;
    }
    
    // Update status text
    updateStatusText(`${update.clickedCount} of ${update.totalButtons} clicked...`);
    
  } else if (update.action === 'automationComplete') {
    // Automation completed
    handleAutomationComplete(update.stats);
  }
}

/**
 * Handle automation completion
 * @param {Object} stats - Final automation statistics
 */
function handleAutomationComplete(stats) {
  console.log('Automation completed:', stats);
  
  // Update UI state
  PopupState.isAutomationRunning = false;
  
  // Reset button states
  handleStopAutomation();
  
  // Hide status text
  if (elements.statusText) {
    elements.statusText.style.display = 'none';
  }
  
  // Show analytics
  showAnalytics(stats);
}

/**
 * Show analytics panel with results
 * @param {Object} stats - Automation statistics
 */
function showAnalytics(stats) {
  if (!elements.analyticsPanel) return;
  
  // Calculate derived statistics
  const minutes = Math.floor(stats.totalTime / 60);
  const seconds = stats.totalTime % 60;
  const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  
  const avgTime = stats.totalClicked > 0 ? 
    (stats.totalTime / stats.totalClicked).toFixed(1) : 0;
  
  // Update analytics display
  document.getElementById('buttons-clicked').textContent = stats.totalClicked;
  document.getElementById('total-time').textContent = timeString;
  document.getElementById('avg-time').textContent = `${avgTime}s`;
  
  // Show new buttons found (if any)
  const newButtonsFound = stats.newButtonsFound || 0;
  document.getElementById('new-discovered').textContent = newButtonsFound;
  
  // Update the label to be more descriptive
  const newFoundLabel = document.querySelector('#new-discovered').nextElementSibling;
  if (newFoundLabel) {
    newFoundLabel.textContent = newButtonsFound > 0 ? 'New Found' : 'Extra Found';
  }
  
  // Show the analytics panel
  elements.analyticsPanel.classList.add('show');
  
  console.log('Analytics displayed:', {
    clicked: stats.totalClicked,
    time: timeString,
    avgPerClick: `${avgTime}s`,
    newFound: newButtonsFound,
    originalButtons: stats.originalButtons || 'unknown'
  });
}

/**
 * Update status text
 * @param {string} text - Status text to display
 */
function updateStatusText(text) {
  if (elements.statusText) {
    elements.statusText.textContent = text;
    elements.statusText.style.display = text ? 'block' : 'none';
  }
}

// ===========================================
// SETTINGS MANAGEMENT
// ===========================================

/**
 * Load saved settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['clickInterval', 'autoScroll']);
    
    if (elements.intervalInput && result.clickInterval) {
      elements.intervalInput.value = result.clickInterval;
    }
    
    if (elements.autoScrollCheckbox && typeof result.autoScroll === 'boolean') {
      elements.autoScrollCheckbox.checked = result.autoScroll;
    }
    
    console.log('Settings loaded:', result);
    
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Save current settings to storage
 */
async function saveSettings() {
  try {
    const settings = {
      clickInterval: parseInt(elements.intervalInput.value) || 20,
      autoScroll: elements.autoScrollCheckbox.checked
    };
    
    await chrome.storage.local.set(settings);
    console.log('Settings saved:', settings);
    
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// ===========================================
// COMMUNICATION HELPERS
// ===========================================

/**
 * Send message to content script via background script
 * @param {Object} message - Message to send
 * @returns {Promise} Promise resolving to response
 */
function sendMessageToContentScript(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response || {});
      }
    });
  });
}

// ===========================================
// ERROR HANDLING
// ===========================================

/**
 * Handle global errors
 */
window.addEventListener('error', (event) => {
  console.error('Popup error:', event.error);
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('Auto Click Assistant: Popup script setup complete');