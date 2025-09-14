// Content script for Auto Click Assistant
console.log('Auto Click Assistant: Content script loaded');

// Global state management
const AutoClickState = {
  isScanning: false,
  isAutomationRunning: false,
  currentButtonList: [],
  clickedButtons: new Set(),
  selectedPattern: null,
  totalClicked: 0,
  startTime: null,
  automationInterval: null,
  originalButtonCount: 0, // Store original count for progress display
  newButtonsFound: 0      // Track newly discovered buttons
};

// ===========================================
// BUTTON DETECTION & ANALYSIS FUNCTIONS
// ===========================================

/**
 * Get all button elements currently on the page
 * @returns {Array} Array of button elements
 */
function getAllButtonsOnPage() {
  console.log('Scanning for buttons on page...');
  
  // Focus on <button> tags as per user requirement
  const buttons = document.querySelectorAll('button');
  
  // Filter out hidden, disabled, or non-clickable buttons
  const visibleButtons = Array.from(buttons).filter(button => {
    const style = window.getComputedStyle(button);
    return (
      button.offsetParent !== null && // Not hidden
      !button.disabled && // Not disabled
      style.visibility !== 'hidden' && // Not visibility hidden
      style.display !== 'none' && // Not display none
      button.innerText.trim() !== '' // Has text content
    );
  });
  
  console.log(`Found ${visibleButtons.length} clickable buttons with text`);
  return visibleButtons;
}

/**
 * Group buttons by their exact innerText
 * @param {Array} buttons - Array of button elements
 * @returns {Object} Object with pattern counts and elements
 */
function groupButtonsByText(buttons) {
  console.log('Grouping buttons by text patterns...');
  
  const patterns = {};
  
  buttons.forEach(button => {
    const text = button.innerText.trim();
    
    if (!patterns[text]) {
      patterns[text] = {
        count: 0,
        elements: []
      };
    }
    
    patterns[text].count++;
    patterns[text].elements.push(button);
  });
  
  console.log('Button patterns found:', Object.keys(patterns).length);
  return patterns;
}

/**
 * Generate button patterns for popup display
 * @returns {Array} Array of pattern objects for dropdown
 */
function generateButtonPatterns() {
  console.log('Generating button patterns for popup...');
  
  const buttons = getAllButtonsOnPage();
  const grouped = groupButtonsByText(buttons);
  
  // Convert to array format for popup dropdown
  const patterns = Object.entries(grouped).map(([text, data]) => ({
    text: text,
    count: data.count,
    elements: data.elements
  }));
  
  // Sort by count (highest first) then by text
  patterns.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.text.localeCompare(b.text);
  });
  
  console.log(`Generated ${patterns.length} button patterns`);
  return patterns;
}

// ===========================================
// VISUAL FEEDBACK FUNCTIONS  
// ===========================================

/**
 * Add highlight styling to a button
 * @param {Element} button - Button element to highlight
 * @param {string} color - Color for highlight (yellow/green)
 */
function addHighlightToButton(button, color = 'yellow') {
  const highlightColor = color === 'green' ? '#28a745' : '#ffc107';
  
  button.style.border = `3px solid ${highlightColor}`;
  button.style.boxShadow = `0 0 0 2px ${highlightColor}40`;
  button.style.transition = 'all 0.3s ease';
  
  // Add a data attribute to track highlighted buttons
  button.setAttribute('data-auto-click-highlight', color);
}

/**
 * Remove highlight from a button
 * @param {Element} button - Button element to remove highlight from
 */
function removeHighlightFromButton(button) {
  button.style.border = '';
  button.style.boxShadow = '';
  button.removeAttribute('data-auto-click-highlight');
}

/**
 * Remove all highlights from page
 */
function removeAllHighlights() {
  const highlightedButtons = document.querySelectorAll('[data-auto-click-highlight]');
  highlightedButtons.forEach(button => {
    removeHighlightFromButton(button);
    // Also clean up counting and new button attributes
    button.removeAttribute('data-auto-click-counted');
    button.removeAttribute('data-auto-click-new');
  });
  console.log(`Removed highlights from ${highlightedButtons.length} buttons`);
}

/**
 * Highlight all buttons matching the selected pattern
 * @param {string} selectedText - Text pattern to highlight
 */
function highlightButtonsByPattern(selectedText) {
  console.log(`Highlighting buttons with pattern: "${selectedText}"`);
  
  // Remove existing highlights first
  removeAllHighlights();
  
  if (!selectedText) return;
  
  // Find all buttons with matching text
  const allButtons = getAllButtonsOnPage();
  const matchingButtons = allButtons.filter(button => 
    button.innerText.trim() === selectedText
  );
  
  // Highlight matching buttons
  matchingButtons.forEach(button => addHighlightToButton(button, 'yellow'));
  
  console.log(`Highlighted ${matchingButtons.length} buttons with pattern "${selectedText}"`);
  return matchingButtons;
}

// ===========================================
// AUTOMATION FUNCTIONS
// ===========================================

/**
 * Generate random delay between clicks (20-25 seconds in milliseconds)
 * @param {number} baseInterval - Base interval in seconds
 * @returns {number} Random delay in milliseconds
 */
function generateRandomDelay(baseInterval = 20) {
  // Ensure baseInterval is a number and at least 5 seconds
  const safeInterval = Math.max(5, Number(baseInterval) || 20);
  
  const minDelay = safeInterval * 1000; // Convert to milliseconds
  const maxDelay = (safeInterval + 5) * 1000; // Add 5 seconds variance
  const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  
  console.log(`generateRandomDelay: base=${safeInterval}s, range=${minDelay}-${maxDelay}ms, generated=${randomDelay}ms (${randomDelay / 1000}s)`);
  return 500;
}

/**
 * Scroll to a specific button element
 * @param {Element} button - Button to scroll to
 */
function scrollToButton(button) {
  console.log('Scrolling to button:', button.innerText.trim());
  
  button.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  });
}

/**
 * Click a button and update its visual state
 * @param {Element} button - Button to click
 */
async function clickButton(button) {
  const startTime = Date.now();
  console.log(`=== CLICKING BUTTON: "${button.innerText.trim()}" ===`);
  
  try {
    // Scroll to button first
    console.log('Scrolling to button...');
    scrollToButton(button);
    
    // Wait for scroll to complete
    console.log('Waiting 1 second for scroll to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click the button
    console.log('Executing click...');
    button.click();
    
    // Mark as clicked and update highlight
    AutoClickState.clickedButtons.add(button);
    addHighlightToButton(button, 'green');
    
    // Update statistics - ONLY increment if not already counted
    if (!button.hasAttribute('data-auto-click-counted')) {
      AutoClickState.totalClicked++;
      button.setAttribute('data-auto-click-counted', 'true');
      console.log(`Button click counted. Total clicked: ${AutoClickState.totalClicked}`);
    } else {
      console.log('Button already counted, skipping increment');
    }
    
    // Send progress update to popup
    sendProgressUpdate();
    
    const endTime = Date.now();
    console.log(`Button click completed in ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error('Error clicking button:', error);
  }
}

/**
 * Find next unclicked button in the current list
 * @returns {Element|null} Next button to click or null if none found
 */
function findNextUnclickedButton() {
  for (const button of AutoClickState.currentButtonList) {
    if (!AutoClickState.clickedButtons.has(button)) {
      return button;
    }
  }
  return null;
}

/**
 * Scan for new buttons that might have appeared (infinite scroll)
 * @returns {Array} Array of new buttons found
 */
function scanForNewButtons() {
  console.log('Scanning for new buttons...');
  
  if (!AutoClickState.selectedPattern) return [];
  
  const allCurrentButtons = getAllButtonsOnPage();
  const matchingButtons = allCurrentButtons.filter(button => 
    button.innerText.trim() === AutoClickState.selectedPattern
  );
  
  // Find buttons that weren't in our original list
  const newButtons = matchingButtons.filter(button => 
    !AutoClickState.currentButtonList.includes(button)
  );
  
  if (newButtons.length > 0) {
    console.log(`Found ${newButtons.length} new buttons`);
    
    // Track the count of newly discovered buttons
    AutoClickState.newButtonsFound += newButtons.length;
    console.log(`Total new buttons discovered so far: ${AutoClickState.newButtonsFound}`);
    
    // Mark new buttons to distinguish from original count
    newButtons.forEach(button => {
      button.setAttribute('data-auto-click-new', 'true');
      addHighlightToButton(button, 'yellow');
    });
    
    // Add new buttons to our list
    AutoClickState.currentButtonList.push(...newButtons);
    
    console.log(`Total buttons now: ${AutoClickState.originalButtonCount} original + ${AutoClickState.newButtonsFound} new = ${AutoClickState.currentButtonList.length}`);
    
    // IMPORTANT: Send progress update to popup with new total!
    sendProgressUpdate();
    console.log(`Progress updated with new total: ${AutoClickState.currentButtonList.length}`);
  }
  
  return newButtons;
}

/**
 * Main automation loop - click next button and schedule next iteration
 */
async function processNextButton() {
  if (!AutoClickState.isAutomationRunning) {
    console.log('Automation stopped');
    return;
  }
  
  console.log('=== Processing next button ===');
  
  // Find next button to click
  let nextButton = findNextUnclickedButton();
  
  // If no unclicked buttons, scan for new ones
  if (!nextButton) {
    console.log('No more unclicked buttons, scanning for new ones...');
    const newButtons = scanForNewButtons();
    
    if (newButtons.length > 0) {
      nextButton = newButtons[0]; // Click first new button found
    } else {
      // Wait 10 seconds as precaution, then final scan
      console.log('No new buttons found, waiting 10 seconds for final scan...');
      setTimeout(() => {
        const finalScan = scanForNewButtons();
        if (finalScan.length > 0) {
          console.log('Final scan found new buttons, continuing automation');
          processNextButton();
        } else {
          console.log('No more buttons found, ending automation');
          stopAutomation(true); // true = completed successfully
        }
      }, 1000);
      return;
    }
  }
  
  if (nextButton) {
    console.log('Found next button to click:', nextButton.innerText.trim());
    
    // Click the button (this is now async and includes proper delays)
    await clickButton(nextButton);
    
    // Get the current interval setting
    const intervalSeconds = await getStoredInterval();
    console.log('Retrieved interval from storage:', intervalSeconds, 'seconds');
    
    const delay = generateRandomDelay(intervalSeconds);
    console.log(`Scheduling next click in ${delay / 1000} seconds...`);
    
    // Schedule next button click after proper delay
    AutoClickState.automationInterval = setTimeout(() => {
      console.log('Interval timeout completed, processing next button...');
      processNextButton();
    }, delay);
  }
}

/**
 * Start the clicking automation
 * @param {string} pattern - Text pattern to click
 * @param {number} interval - Click interval in seconds
 */
async function startClickingAutomation(pattern, interval) {
  console.log(`Starting automation for pattern: "${pattern}" with ${interval}s interval`);
  
  if (AutoClickState.isAutomationRunning) {
    console.log('Automation already running');
    return { success: false, error: 'Automation already running' };
  }
  
  // Store interval FIRST before doing anything else
  console.log('Storing interval in storage:', interval);
  await new Promise((resolve) => {
    chrome.storage.local.set({ clickInterval: interval }, () => {
      console.log('Interval stored successfully');
      resolve();
    });
  });
  
  // Verify it was stored correctly
  const storedInterval = await getStoredInterval();
  console.log('Verified stored interval:', storedInterval);
  
  // Reset state completely
  AutoClickState.isAutomationRunning = true;
  AutoClickState.selectedPattern = pattern;
  AutoClickState.totalClicked = 0; // Reset counter
  AutoClickState.startTime = Date.now();
  AutoClickState.clickedButtons.clear();
  AutoClickState.newButtonsFound = 0; // Reset new buttons counter
  
  // Remove any previous counting attributes
  document.querySelectorAll('[data-auto-click-counted]').forEach(button => {
    button.removeAttribute('data-auto-click-counted');
  });
  
  // Get buttons matching pattern
  const matchingButtons = highlightButtonsByPattern(pattern);
  AutoClickState.currentButtonList = [...matchingButtons];
  
  // Store the ORIGINAL button count for consistent progress display
  AutoClickState.originalButtonCount = matchingButtons.length;
  console.log(`Original button count stored: ${AutoClickState.originalButtonCount}`);
  
  if (matchingButtons.length === 0) {
    stopAutomation();
    return { success: false, error: 'No buttons found with selected pattern' };
  }
  
  console.log(`Found ${matchingButtons.length} buttons to click`);
  
  // Start the automation process
  console.log('Starting automation process...');
  processNextButton();
  
  return { 
    success: true, 
    totalButtons: matchingButtons.length,
    pattern: pattern
  };
}

/**
 * Stop the automation process
 * @param {boolean} completed - Whether automation completed successfully
 */
function stopAutomation(completed = false) {
  console.log(`Stopping automation. Completed: ${completed}`);
  
  AutoClickState.isAutomationRunning = false;
  
  // Clear any pending timeouts
  if (AutoClickState.automationInterval) {
    clearTimeout(AutoClickState.automationInterval);
    AutoClickState.automationInterval = null;
  }
  
  // Calculate final statistics
  const endTime = Date.now();
  const totalTime = AutoClickState.startTime ? 
    Math.round((endTime - AutoClickState.startTime) / 1000) : 0;
  
  const finalStats = {
    totalClicked: AutoClickState.totalClicked,
    totalTime: totalTime,
    completed: completed,
    pattern: AutoClickState.selectedPattern,
    originalButtons: AutoClickState.originalButtonCount,
    newButtonsFound: AutoClickState.newButtonsFound
  };
  
  console.log('Final automation statistics:', finalStats);
  
  // Send completion message to popup
  sendCompletionUpdate(finalStats);
  
  // Clean up attributes
  document.querySelectorAll('[data-auto-click-counted]').forEach(button => {
    button.removeAttribute('data-auto-click-counted');
  });
  
  document.querySelectorAll('[data-auto-click-new]').forEach(button => {
    button.removeAttribute('data-auto-click-new');
  });
  
  // Reset state
  AutoClickState.selectedPattern = null;
  AutoClickState.currentButtonList = [];
  AutoClickState.clickedButtons.clear();
  AutoClickState.startTime = null;
  AutoClickState.totalClicked = 0;
  AutoClickState.originalButtonCount = 0;
  AutoClickState.newButtonsFound = 0;
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get stored click interval from storage
 * @returns {Promise<number>} Click interval in seconds
 */
async function getStoredInterval() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['clickInterval'], (result) => {
      const interval = result.clickInterval || 20;
      console.log('getStoredInterval: retrieved from storage =', result, 'using interval =', interval);
      resolve(interval);
    });
  });
}

/**
 * Send progress update to popup via background script
 */
function sendProgressUpdate() {
  // Use current total button count (includes newly found buttons)
  const totalButtons = AutoClickState.currentButtonList.length;
  
  const progressData = {
    action: 'progressUpdate',
    clickedCount: AutoClickState.totalClicked,
    totalButtons: totalButtons, // Dynamic total that updates as new buttons are found
    isRunning: AutoClickState.isAutomationRunning,
    pattern: AutoClickState.selectedPattern,
    originalCount: AutoClickState.originalButtonCount, // For analytics only
    newButtonsFound: AutoClickState.newButtonsFound   // For analytics only
  };
  
  console.log('=== SENDING PROGRESS UPDATE ===');
  console.log('Progress data being sent:', progressData);
  console.log('Current button list length:', AutoClickState.currentButtonList.length);
  console.log('Original count:', AutoClickState.originalButtonCount);
  console.log('New buttons found:', AutoClickState.newButtonsFound);
  
  chrome.runtime.sendMessage(progressData)
    .then(() => {
      console.log('Progress update sent successfully');
    })
    .catch((error) => {
      console.error('Error sending progress update:', error);
    });
}

/**
 * Send completion update to popup
 * @param {Object} stats - Final automation statistics
 */
function sendCompletionUpdate(stats) {
  const completionData = {
    action: 'automationComplete',
    stats: stats
  };
  
  chrome.runtime.sendMessage(completionData);
}

// ===========================================
// MESSAGE HANDLING
// ===========================================

/**
 * Handle messages from popup via background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  switch (message.action) {
    case 'scanButtons':
      try {
        const patterns = generateButtonPatterns();
        sendResponse({ success: true, patterns: patterns });
      } catch (error) {
        console.error('Error scanning buttons:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'highlightButtons':
      try {
        const matchingButtons = highlightButtonsByPattern(message.pattern);
        sendResponse({ 
          success: true, 
          highlightedCount: matchingButtons.length 
        });
      } catch (error) {
        console.error('Error highlighting buttons:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    case 'startAutomation':
      // Handle async startClickingAutomation
      (async () => {
        try {
          console.log('Received start automation command:', message);
          const result = await startClickingAutomation(message.pattern, message.interval);
          sendResponse(result);
        } catch (error) {
          console.error('Error starting automation:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true; // Keep message channel open for async response
      
    case 'stopAutomation':
      try {
        stopAutomation();
        removeAllHighlights();
        sendResponse({ success: true });
      } catch (error) {
        console.error('Error stopping automation:', error);
        sendResponse({ success: false, error: error.message });
      }
      break;
      
    default:
      console.log('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize content script when page loads
 */
function initializeContentScript() {
  console.log('Auto Click Assistant: Content script initialized');
  
  // Clean up any existing highlights on page load
  removeAllHighlights();
  
  // Listen for page navigation to clean up state
  window.addEventListener('beforeunload', () => {
    if (AutoClickState.isAutomationRunning) {
      stopAutomation();
    }
    removeAllHighlights();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentScript);
} else {
  initializeContentScript();
}

console.log('Auto Click Assistant: Content script setup complete');