# TempMail Pro - Browser Extension

A production-ready browser extension that provides temporary email functionality with **inline auto-fill buttons** that appear directly inside email input fields.

## ✨ Key Features

🎯 **Inline Auto-Fill Button**: TempMail button appears directly inside email fields (like password managers!)  
📧 **Persistent Email**: Email stays fixed until you manually change it (no auto-refresh)  
📬 **Inbox Viewer**: View all received emails directly in the extension popup  
🔄 **Smart Detection**: Automatically finds email fields on any webpage  
⚡ **Dynamic Support**: Works with React, Vue, Angular, and all modern frameworks  
🔒 **Privacy First**: No tracking, no data collection  
🎨 **Modern UI**: Clean, intuitive interface  
💾 **Context Menu**: Right-click to fill email anywhere  

## 🚀 New! Inline Button Feature

The extension now automatically injects a **TempMail button inside every email input field**:

- 🎯 **One-click fill** - Click the button right inside the email field
- 👁️ **Always visible** - No need to open the extension popup
- 🎨 **Beautiful design** - Matches website aesthetics with hover effects
- ⚡ **Instant feedback** - Button turns green when email is filled
- 🔄 **Dynamic fields** - Automatically detects new fields added by JavaScript

### How It Looks

```
┌─────────────────────────────────────────┐
│ Email: your-temp@mail.com [📧]         │  ← TempMail button appears here
└─────────────────────────────────────────┘
         Click the button to fill! →  [📧]
```  

## Installation

### Chrome / Edge / Brave

1. Download or clone this repository
2. Open your browser and navigate to:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `extension` folder
6. The extension icon should appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Navigate to the `extension` folder and select `manifest.json`
5. The extension will be loaded temporarily

**Note for Firefox**: For permanent installation, you'll need to sign the extension through Mozilla's Add-on Developer Hub.

## Usage

### Getting Started

1. Click the TempMail icon in your browser toolbar
2. A temporary email address will be automatically generated
3. The email stays persistent until you manually change it

### Auto-Fill Email

**Method 1: Inline Button (Recommended!)**
1. Navigate to any website with an email input field
2. Look for the TempMail icon button on the right side inside the email field
3. Click the button to instantly fill that field with your temp email
4. The button turns green to confirm the fill!

**Method 2: Fill All Button**
1. Navigate to any website with email input fields
2. Click the TempMail extension icon
3. Click the "Fill" button (clipboard icon) in the popup
4. All email fields on the current page will be filled automatically

**Method 3: Right-Click Context Menu**
2. Open the TempMail extension
3. Click the clipboard icon (📋) to fill the email automatically

**Method 2: Copy & Paste**
1. Click the copy icon (📄) in the extension
2. Paste the email wherever you need it

**Method 3: Right-Click Context Menu**
1. Right-click on any email input field
2. Select "Fill TempMail email" from the context menu

### Checking Messages

1. Open the TempMail extension
2. Click the "Check Mail" button
3. Messages will appear in the inbox section
4. Click on any message to expand and read the full content

### Getting a New Email

1. Click the refresh icon (🔄) next to your current email
2. A new temporary email address will be generated
3. All messages will be cleared

## Features in Detail

### Smart Email Detection

The extension automatically detects email input fields using multiple methods:
- `<input type="email">` elements
- Common name/id patterns (email, e-mail, user_email, etc.)
- Autocomplete attributes
- Placeholder text patterns
- ARIA labels

### Message Viewer

- **Real-time updates**: Manually check for new messages
- **Rich content**: Displays both plain text and HTML emails
- **Safe rendering**: HTML is sanitized to prevent XSS attacks
- **Expandable messages**: Click to expand/collapse email content
- **Smart timestamps**: Relative time display (e.g., "5m ago", "2h ago")

### Privacy & Security

- **No auto-refresh**: Email stays fixed until you change it
- **Local storage only**: Data stored locally in your browser
- **No analytics**: Zero tracking or data collection
- **Secure API**: Uses HTTPS for all communications
- **Sandboxed content**: HTML emails are sanitized before display

## API Endpoints

The extension communicates with the TempMail backend:

- **POST** `/create_account` - Generate new temporary email
- **GET** `/messages?token={token}` - Fetch received messages

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── content.js            # Content script for page interaction
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Development

### Prerequisites

- Node.js (for icon generation tools, optional)
- Modern browser (Chrome 88+, Firefox 78+, Edge 88+)

### Local Development

1. Make changes to the extension files
2. Go to `chrome://extensions/` (or equivalent)
3. Click the reload icon for the TempMail extension
4. Test your changes

### Building for Production

The extension is production-ready as-is. For distribution:

1. **Chrome Web Store**: Package as .zip and submit
2. **Firefox Add-ons**: Sign and submit through AMO
3. **Edge Add-ons**: Submit through Partner Center

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome  | 88+            | ✅ Fully Supported |
| Edge    | 88+            | ✅ Fully Supported |
| Brave   | 1.20+          | ✅ Fully Supported |
| Firefox | 78+            | ⚠️ Manifest V3 adaptation needed |
| Opera   | 74+            | ✅ Fully Supported |

## Permissions Explained

- **storage**: Save email address and messages locally
- **activeTab**: Access current tab to fill email fields
- **scripting**: Inject content script for auto-fill functionality
- **host_permissions**: Connect to TempMail API

## Troubleshooting

### Extension doesn't fill email
- Make sure you're on a page with email input fields
- Try clicking directly on the input field first
- Some sites may have custom input elements that aren't detected

### Messages not loading
- Check your internet connection
- Verify the backend API is accessible
- Try creating a new email

### Extension icon not showing
- Pin the extension from the extensions menu
- Make sure extension is enabled

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Visit: https://pro-tempmail.onrender.com

## Changelog

### Version 1.0.0 (2025-10-22)
- Initial release
- Auto-fill email functionality
- Message viewer
- Persistent email (no auto-refresh)
- Context menu integration
- Modern, responsive UI

## Credits

Developed with ❤️ for privacy-conscious users

---

**Note**: This extension requires an internet connection to generate emails and fetch messages from the TempMail API.
