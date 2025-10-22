// Content script for auto-filling email in web pages

console.log('TempMail: Content script loaded');

// State
let currentEmail = null;
let injectedButtons = new WeakMap();

// Initialize
init();

async function init() {
  // Get current email from storage
  const data = await chrome.storage.local.get(['email']);
  if (data.email) {
    currentEmail = data.email;
  }
  
  // Inject buttons into email fields
  injectButtonsIntoEmailFields();
  
  // Watch for dynamically added fields
  observeDOM();
  
  // Listen for email updates
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.email) {
      currentEmail = changes.email.newValue;
    }
  });
}

// Listen for messages from popup (fallback method)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('TempMail: Received message', request);
  
  if (request.action === 'fillEmail') {
    const result = fillEmailInInputs(request.email);
    sendResponse({ success: true, filled: result });
  }
  return true;
});

// Fill email in specific input
function fillEmailInInput(input, email) {
  try {
    // Focus the input first
    input.focus();
    
    // Set value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, email);
    
    // Trigger multiple events to ensure compatibility
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // For React/Vue apps
    const inputEvent = new Event('input', { bubbles: true });
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(inputEvent);
    input.dispatchEvent(changeEvent);
    
    // Add visual feedback
    addFillAnimation(input);
    
    console.log('TempMail: Filled input:', input);
    return true;
  } catch (error) {
    console.error('TempMail: Error filling input:', error);
    return false;
  }
}

// Fill email in all email input fields (for backward compatibility)
function fillEmailInInputs(email) {
  console.log('TempMail: Attempting to fill email:', email);
  const emailInputs = findEmailInputs();
  
  console.log('TempMail: Found', emailInputs.length, 'email input(s)');
  
  if (emailInputs.length === 0) {
    console.log('TempMail: No email inputs found on page');
    return 0;
  }

  let filledCount = 0;
  emailInputs.forEach(input => {
    if (fillEmailInInput(input, email)) {
      filledCount++;
    }
  });

  console.log('TempMail: Successfully filled', filledCount, 'input(s)');
  return filledCount;
}

// Inject TempMail button into email fields
function injectButtonsIntoEmailFields() {
  const emailInputs = findEmailInputs();
  
  emailInputs.forEach(input => {
    // Skip if already has button
    if (injectedButtons.has(input)) {
      return;
    }
    
    // Create button wrapper
    const wrapper = createInlineButton(input);
    if (wrapper) {
      injectedButtons.set(input, wrapper);
    }
  });
  
  console.log('TempMail: Injected buttons into', emailInputs.length, 'field(s)');
}

// Create inline button for an input field
function createInlineButton(input) {
  try {
    // Make sure input has position relative parent
    const inputRect = input.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(input);
    
    // Create button container
    const button = document.createElement('div');
    button.className = 'tempmail-autofill-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8L10.89 13.26C11.5 13.67 12.5 13.67 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    
    // Style the button
    Object.assign(button.style, {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999999',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      color: '#6366f1'
    });
    
    // Hover effect
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#f3f4f6';
      button.style.borderColor = '#6366f1';
      button.style.boxShadow = '0 2px 6px rgba(99, 102, 241, 0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#ffffff';
      button.style.borderColor = '#e5e7eb';
      button.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    });
    
    // Click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (currentEmail) {
        fillEmailInInput(input, currentEmail);
        // Show success animation
        button.style.backgroundColor = '#10b981';
        button.style.borderColor = '#10b981';
        button.style.color = '#ffffff';
        setTimeout(() => {
          button.style.backgroundColor = '#ffffff';
          button.style.borderColor = '#e5e7eb';
          button.style.color = '#6366f1';
        }, 1000);
      } else {
        // Try to get email from storage
        const data = await chrome.storage.local.get(['email']);
        if (data.email) {
          currentEmail = data.email;
          fillEmailInInput(input, currentEmail);
        } else {
          alert('Please open TempMail extension to generate an email first');
        }
      }
    });
    
    // Tooltip
    button.title = 'Fill with TempMail';
    
    // Position the input
    const inputPosition = computedStyle.position;
    if (inputPosition === 'static' || inputPosition === '') {
      input.style.position = 'relative';
    }
    
    // Add padding to input to prevent text overlap
    const currentPaddingRight = parseInt(computedStyle.paddingRight) || 0;
    input.style.paddingRight = Math.max(currentPaddingRight, 40) + 'px';
    
    // Insert button after input
    input.parentElement.insertBefore(button, input.nextSibling);
    
    // Position button relative to input
    positionButton(input, button);
    
    // Reposition on resize/scroll
    const repositionHandler = () => positionButton(input, button);
    window.addEventListener('resize', repositionHandler);
    window.addEventListener('scroll', repositionHandler, true);
    
    return button;
  } catch (error) {
    console.error('TempMail: Error creating button:', error);
    return null;
  }
}

// Position button relative to input field
function positionButton(input, button) {
  try {
    const inputRect = input.getBoundingClientRect();
    const parentRect = input.offsetParent ? input.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
    
    // Calculate position relative to offset parent
    const top = inputRect.top - parentRect.top + (inputRect.height / 2);
    const right = parentRect.right - inputRect.right + 8;
    
    button.style.top = top + 'px';
    button.style.right = right + 'px';
  } catch (error) {
    // Fallback to simple positioning
    button.style.top = '50%';
    button.style.right = '8px';
  }
}

// Observe DOM for dynamically added fields
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    // Debounce the injection
    clearTimeout(observer.timer);
    observer.timer = setTimeout(() => {
      injectButtonsIntoEmailFields();
    }, 500);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Find all email input fields on the page
function findEmailInputs() {
  const inputs = [];

  // Find by input type="email"
  document.querySelectorAll('input[type="email"]').forEach(input => {
    if (isVisible(input)) {
      inputs.push(input);
    }
  });

  // Find by common name attributes
  const emailNamePatterns = [
    'email', 'e-mail', 'mail', 'user_email', 'user-email', 'user email',
    'useremail', 'emailaddress', 'email_address', 'email-address',
    'login_email', 'account_email', 'contact_email', 'signup_email',
    'signin_email', 'register_email', 'registration_email'
  ];

  document.querySelectorAll('input[type="text"], input:not([type])').forEach(input => {
    const name = (input.name || '').toLowerCase();
    const id = (input.id || '').toLowerCase();
    const placeholder = (input.placeholder || '').toLowerCase();
    const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
    const className = (input.className || '').toLowerCase();

    const matchesPattern = emailNamePatterns.some(pattern => 
      name.includes(pattern) || 
      id.includes(pattern) || 
      placeholder.includes(pattern) ||
      ariaLabel.includes(pattern) ||
      className.includes(pattern)
    );

    if (matchesPattern && isVisible(input) && !inputs.includes(input)) {
      inputs.push(input);
    }
  });

  // Find by autocomplete attribute
  document.querySelectorAll('input[autocomplete*="email"]').forEach(input => {
    if (isVisible(input) && !inputs.includes(input)) {
      inputs.push(input);
    }
  });

  return inputs;
}

// Check if element is visible
function isVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// Add fill animation
function addFillAnimation(input) {
  input.dataset.tempmailFilled = 'true';
  
  // Add filled style
  const originalBorder = input.style.border;
  const originalBackground = input.style.background;
  const originalTransition = input.style.transition;
  
  input.style.transition = 'all 0.3s ease';
  input.style.border = '2px solid #10b981';
  input.style.background = '#f0fdf4';
  
  // Reset after animation
  setTimeout(() => {
    input.style.transition = originalTransition;
    input.style.border = originalBorder;
    input.style.background = originalBackground;
    delete input.dataset.tempmailFilled;
  }, 2000);
}

console.log('TempMail: Content script ready');
