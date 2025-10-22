// Background script for Firefox (Manifest V2 compatible)

// Installation handler
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('TempMail Extension installed');
  } else if (details.reason === 'update') {
    console.log('TempMail Extension updated');
  }
});

// Handle messages from content scripts or popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'createEmail') {
    createEmailAccount().then(sendResponse);
    return true;
  }
  
  if (request.action === 'fetchMessages') {
    fetchMessages(request.token).then(sendResponse);
    return true;
  }

  if (request.action === 'getStoredEmail') {
    browser.storage.local.get(['email', 'token']).then(sendResponse);
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
    
    await browser.storage.local.set({
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
    
    await browser.storage.local.set({
      messages: data.messages || []
    });

    return { success: true, messages: data.messages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { success: false, error: error.message };
  }
}

// Badge notification for new messages
async function updateBadge() {
  const data = await browser.storage.local.get(['messages']);
  const messageCount = (data.messages || []).length;
  
  if (messageCount > 0) {
    browser.browserAction.setBadgeText({ text: messageCount.toString() });
    browser.browserAction.setBadgeBackgroundColor({ color: '#6366f1' });
  } else {
    browser.browserAction.setBadgeText({ text: '' });
  }
}

// Listen for storage changes
browser.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.messages) {
    updateBadge();
  }
});

// Context menu
browser.contextMenus.create({
  id: 'fillEmail',
  title: 'Fill TempMail email',
  contexts: ['editable']
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'fillEmail') {
    const data = await browser.storage.local.get(['email']);
    
    if (data.email) {
      browser.tabs.sendMessage(tab.id, {
        action: 'fillEmail',
        email: data.email
      });
    }
  }
});
