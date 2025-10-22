// Configuration
const API_BASE_URL = 'https://pro-tempmail.onrender.com';

// State management
let currentEmail = null;
let currentToken = null;
let messages = [];

// DOM Elements
const loading = document.getElementById('loading');
const emailDisplay = document.getElementById('emailDisplay');
const emailAddress = document.getElementById('emailAddress');
const copyBtn = document.getElementById('copyBtn');
const fillBtn = document.getElementById('fillBtn');
const refreshBtn = document.getElementById('refreshBtn');
const checkMailBtn = document.getElementById('checkMailBtn');
const messagesContainer = document.getElementById('messagesContainer');
const messagesList = document.getElementById('messagesList');
const noMessages = document.getElementById('noMessages');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Load saved email and token from storage
  const data = await chrome.storage.local.get(['email', 'token', 'messages']);
  
  if (data.email && data.token) {
    currentEmail = data.email;
    currentToken = data.token;
    messages = data.messages || [];
    
    showEmail();
    displayMessages();
  } else {
    // Create new email
    await createNewEmail();
  }

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  copyBtn.addEventListener('click', copyEmail);
  fillBtn.addEventListener('click', fillEmailInPage);
  refreshBtn.addEventListener('click', createNewEmail);
  checkMailBtn.addEventListener('click', fetchMessages);
}

// Create new email account
async function createNewEmail() {
  try {
    setLoading(true);
    refreshBtn.classList.add('loading');

    const response = await fetch(`${API_BASE_URL}/create_account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to create email');
    }

    const data = await response.json();
    currentEmail = data.email;
    currentToken = data.token;
    messages = [];

    // Save to storage
    await chrome.storage.local.set({
      email: currentEmail,
      token: currentToken,
      messages: []
    });

    showEmail();
    displayMessages();
    showToast('New email created!', 'success');
  } catch (error) {
    console.error('Error creating email:', error);
    showToast('Failed to create email. Please try again.', 'error');
  } finally {
    setLoading(false);
    refreshBtn.classList.remove('loading');
  }
}

// Fetch messages from server
async function fetchMessages() {
  if (!currentToken) {
    showToast('No email account active', 'warning');
    return;
  }

  try {
    checkMailBtn.classList.add('loading');

    const response = await fetch(`${API_BASE_URL}/messages?token=${encodeURIComponent(currentToken)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json();
    messages = data.messages || [];

    // Save messages to storage
    await chrome.storage.local.set({ messages });

    displayMessages();
    
    if (messages.length > 0) {
      showToast(`${messages.length} message(s) received`, 'success');
    } else {
      showToast('No new messages', 'info');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    showToast('Failed to fetch messages', 'error');
  } finally {
    checkMailBtn.classList.remove('loading');
  }
}

// Display email address
function showEmail() {
  loading.style.display = 'none';
  emailDisplay.style.display = 'block';
  emailAddress.value = currentEmail;
}

function setLoading(isLoading) {
  if (isLoading) {
    loading.style.display = 'block';
    emailDisplay.style.display = 'none';
  } else {
    loading.style.display = 'none';
    emailDisplay.style.display = 'block';
  }
}

// Display messages in the list
function displayMessages() {
  if (!messages || messages.length === 0) {
    noMessages.style.display = 'flex';
    messagesList.style.display = 'none';
    messagesList.innerHTML = '';
    return;
  }

  noMessages.style.display = 'none';
  messagesList.style.display = 'block';

  // Sort messages by date (newest first)
  const sortedMessages = [...messages].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  messagesList.innerHTML = sortedMessages.map((msg, index) => {
    const date = new Date(msg.date);
    const formattedDate = formatDate(date);
    const preview = getTextPreview(msg.text || msg.html);

    return `
      <div class="message-item" data-index="${index}">
        <div class="message-header">
          <div class="message-from" title="${escapeHtml(msg.from)}">${escapeHtml(msg.from)}</div>
          <div class="message-date">${formattedDate}</div>
        </div>
        <div class="message-subject">${escapeHtml(msg.subject || '(No subject)')}</div>
        <div class="message-preview">${escapeHtml(preview)}</div>
        <div class="message-content">
          <div class="message-body">${formatMessageBody(msg)}</div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to message items
  document.querySelectorAll('.message-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('expanded');
    });
  });
}

// Format message body
function formatMessageBody(msg) {
  if (msg.html && Array.isArray(msg.html) && msg.html.length > 0) {
    // Use HTML content if available
    return sanitizeHtml(msg.html[0] || '');
  } else if (msg.text) {
    // Use plain text
    return escapeHtml(msg.text);
  }
  return '<em>No content</em>';
}

// Get text preview from message
function getTextPreview(content) {
  if (!content) return 'No preview available';
  
  let text = '';
  if (Array.isArray(content)) {
    text = content[0] || '';
  } else {
    text = content;
  }

  // Strip HTML tags
  text = text.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  // Limit length
  return text.substring(0, 100);
}

// Format date
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Copy email to clipboard
async function copyEmail() {
  try {
    await navigator.clipboard.writeText(currentEmail);
    showToast('Email copied to clipboard!', 'success');
    
    // Visual feedback
    copyBtn.classList.add('loading');
    setTimeout(() => {
      copyBtn.classList.remove('loading');
    }, 500);
  } catch (error) {
    console.error('Error copying email:', error);
    showToast('Failed to copy email', 'error');
  }
}

// Fill email in current page
async function fillEmailInPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Check if we can access the tab
    if (!tab || !tab.id) {
      showToast('Cannot access current tab', 'error');
      return;
    }

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      showToast('Cannot fill email on browser pages', 'warning');
      return;
    }

    fillBtn.classList.add('loading');

    try {
      // Try to send message first (content script might already be loaded)
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fillEmail',
        email: currentEmail
      });

      if (response && response.filled > 0) {
        showToast(`Email filled in ${response.filled} field(s)!`, 'success');
      } else {
        showToast('No email fields found on this page', 'warning');
      }
    } catch (error) {
      // Content script not loaded, try to inject it
      console.log('Injecting content script...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 300));

        // Try sending message again
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'fillEmail',
          email: currentEmail
        });

        if (response && response.filled > 0) {
          showToast(`Email filled in ${response.filled} field(s)!`, 'success');
        } else {
          showToast('No email fields found on this page', 'warning');
        }
      } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        showToast('Cannot access this page. Try a regular website.', 'error');
      }
    }
  } catch (error) {
    console.error('Error filling email:', error);
    showToast('Failed to fill email', 'error');
  } finally {
    setTimeout(() => {
      fillBtn.classList.remove('loading');
    }, 500);
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Utility functions
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeHtml(html) {
  if (!html) return '';
  
  // Basic HTML sanitization (remove scripts and dangerous tags)
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Remove script tags
  const scripts = div.querySelectorAll('script');
  scripts.forEach(script => script.remove());
  
  // Remove event handlers
  const elements = div.querySelectorAll('*');
  elements.forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  
  return div.innerHTML;
}
