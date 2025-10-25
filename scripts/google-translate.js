// Google Translate Widget Component
// This script adds the Google Translate widget to the page

// Create the widget container div
const widgetDiv = document.createElement('div');
widgetDiv.id = 'google_translate_element';
widgetDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    background: rgba(10, 10, 15, 0.95);
    padding: 8px 12px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 14px;
    max-width: 200px;
`;

// Append to body
document.body.appendChild(widgetDiv);

// Google Translate initialization function
window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE
    }, 'google_translate_element');
};

// Load Google Translate script
const script = document.createElement('script');
script.type = 'text/javascript';
script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
document.head.appendChild(script);