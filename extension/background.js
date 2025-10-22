// Background service worker for TempMail Extension

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('TempMail Extension installed');
    
    // Setup context menu on install
    setupContextMenu();
    
    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'https://pro-tempmail.onrender.com' });
  } else if (details.reason === 'update') {
    console.log('TempMail Extension updated');
    setupContextMenu();
  }
});

// Setup context menu
function setupContextMenu() {
  try {
    if (chrome.contextMenus) {
      // Remove existing menu items first
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: 'fillEmail',
          title: 'Fill TempMail email',
          contexts: ['editable']
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('Context menu setup:', chrome.runtime.lastError.message);
          }
        });
      });
    }
  } catch (error) {
    console.log('Context menu not available:', error);
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createEmail') {
    createEmailAccount().then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'fetchMessages') {
    fetchMessages(request.token).then(sendResponse);
    return true;
  }

  if (request.action === 'getStoredEmail') {
    chrome.storage.local.get(['email', 'token'], sendResponse);
    return true;
  }
});

// Create email account
async function createEmailAccount() {
  try {
    const response = await fetch('https://pro-tempmail.onrender.com/create_account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create email account');
    }

    const data = await response.json();
    
    // Store in chrome.storage
    await chrome.storage.local.set({
      email: data.email,
      token: data.token,
      messages: []
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating email:', error);
    return { success: false, error: error.message };
  }
}

// Fetch messages
async function fetchMessages(token) {
  try {
    const response = await fetch(`https://pro-tempmail.onrender.com/messages?token=${encodeURIComponent(token)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json();
    
    // Store messages
    await chrome.storage.local.set({
      messages: data.messages || []
    });

    return { success: true, messages: data.messages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: error.message };
  }
}

// Badge notification for new messages (optional feature)
async function updateBadge() {
  const data = await chrome.storage.local.get(['messages']);
  const messageCount = (data.messages || []).length;
  
  if (messageCount > 0) {
    chrome.action.setBadgeText({ text: messageCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.messages) {
    updateBadge();
  }
});

// Context menu click handler
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'fillEmail') {
      try {
        const data = await chrome.storage.local.get(['email']);
        
        if (data.email) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'fillEmail',
            email: data.email
          });
        }
      } catch (error) {
        console.log('Could not send message to tab:', error);
      }
    }
  });
}

// Log when service worker is ready
console.log('TempMail Extension: Background service worker ready');
