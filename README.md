# TempMail - Professional Temporary Email Service

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Saksham-Goel1107/TempMail.svg)](https://github.com/Saksham-Goel1107/TempMail/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Saksham-Goel1107/TempMail.svg)](https://github.com/Saksham-Goel1107/TempMail/network)
[![GitHub issues](https://img.shields.io/github/issues/Saksham-Goel1107/TempMail.svg)](https://github.com/Saksham-Goel1107/TempMail/issues)

A modern, secure, and user-friendly temporary email service built with FastAPI and powered by the mail.tm API. Create disposable email addresses instantly with a beautiful web interface and RESTful API.

## 🌐 Live Demo

🚀 **[Try TempMail Live](https://pro-tempmail.onrender.com)** - Experience the full functionality of TempMail hosted on Render.

## ✨ Features

- 🚀 **Instant Email Creation**: Generate unique, professional-looking temporary email addresses
- 🌙 **Dark/Light Theme**: Modern UI with theme switching capability
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔒 **Secure & Private**: No data storage, completely anonymous
- ⚡ **FastAPI Backend**: High-performance async API with automatic retries
- 🎨 **Beautiful UI**: Clean, modern interface with smooth animations
- 📧 **Real-time Messages**: Fetch and display emails instantly
- 🔄 **Auto-refresh**: Automatic message checking with manual refresh option
- 🛡️ **CORS Enabled**: Cross-origin requests supported
- 📋 **Copy to Clipboard**: Easy copying of email addresses and content

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.8+
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: mail.tm API integration
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Font Awesome (via CDN)
- **Libraries**:
  - `fastapi` - Modern web framework
  - `uvicorn` - ASGI server
  - `requests` - HTTP client
  - `tenacity` - Retry mechanism

## 📦 Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Saksham-Goel1107/TempMail.git
   cd TempMail
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   uvicorn app:app --reload
   ```

4. **Open your browser**
   ```
   http://127.0.0.1:8000
   ```

### Docker (Recommended)

TempMail now supports Docker for easy deployment and development:

#### Using Docker Compose (Recommended)
```bash
# Clone the repository
git clone https://github.com/Saksham-Goel1107/TempMail.git
cd TempMail

# Build and run with Docker Compose
docker-compose up --build
```

#### Using Docker directly
```bash
# Build the image
docker build -t tempmail .

# Run the container
docker run -p 8000:8000 tempmail
```

#### Docker Commands
```bash
# Run in background
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up --build --force-recreate
```

The application will be available at `http://localhost:8000`

## 🚀 Usage

### Web Interface

1. Open the application in your browser
2. Click "Create New Email" to generate a temporary email address
3. Use the generated email address wherever you need a temporary email
4. Check for incoming messages using the refresh button
5. Messages will be displayed in a clean, readable format

### API Usage

The application provides a RESTful API for programmatic access:

#### Create Account
```bash
curl -X POST "http://localhost:8000/create_account"
```

**Response:**
```json
{
  "email": "cool_user_abc123@domain.com",
  "token": "your_jwt_token_here"
}
```

#### Get Messages
```bash
curl -X GET "http://localhost:8000/messages?token=YOUR_TOKEN"
```

**Response:**
```json
{
  "messages": [
    {
      "id": "message_id",
      "from": "sender@example.com",
      "subject": "Test Email",
      "text": "Plain text content",
      "html": ["<p>HTML content</p>"],
      "date": "2024-01-01T12:00:00Z",
      "hasAttachments": false
    }
  ]
}
```

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serve the web interface |
| `POST` | `/create_account` | Create a new temporary email account |
| `GET` | `/messages?token={token}` | Fetch messages for an account |

## 🔧 Configuration

The application uses the following configuration:

- **Base URL**: `https://api.mail.tm` (mail.tm API)
- **CORS**: Enabled for all origins
- **Retry Policy**: 3 attempts with exponential backoff
- **Username Generation**: Unique, readable usernames with hash-based uniqueness

## 🎯 Key Components

### Backend (`app.py`)

- FastAPI application with CORS middleware
- Integration with mail.tm API
- Automatic retry mechanism for API calls
- Unique username generation algorithm
- Secure password generation

### Frontend (`index.html`)

- Responsive web interface
- Dark/Light theme support
- Real-time message fetching
- QR code generation for email addresses
- Copy-to-clipboard functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run with auto-reload
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## 🙏 Acknowledgments

- [mail.tm](https://mail.tm/) for providing the temporary email API
- [FastAPI](https://fastapi.tiangolo.com/) for the amazing web framework
- [Tenacity](https://tenacity.readthedocs.io/) for retry mechanisms
- [QRCode.js](https://github.com/davidshimjs/qrcodejs) for QR code generation
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization

## 📞 Support

If you have any questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Made with ❤️ by [Saksham Goel](https://github.com/Saksham-Goel1107)**