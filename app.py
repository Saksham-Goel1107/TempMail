from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import requests
import random
import time
import hashlib
import uuid
from tenacity import retry, stop_after_attempt, wait_exponential
import asyncio
import aiohttp

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories
app.mount("/styles", StaticFiles(directory="styles"), name="styles")
app.mount("/scripts", StaticFiles(directory="scripts"), name="scripts")

BASE_URL = "https://api.mail.gw"

# Webhook configurations storage (in-memory, only works while program is running)
webhook_configs = {}
# Track sent webhook message IDs to avoid duplicates
sent_webhook_messages = set()

# Webhook functionality
async def send_webhook_notification(webhook_url: str, email_data: dict):
    """Send webhook notification asynchronously"""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {
                "event": "new_email",
                "timestamp": int(time.time()),
                "data": email_data
            }
            async with session.post(webhook_url, json=payload, timeout=10) as response:
                if response.status >= 200 and response.status < 300:
                    print(f"✅ Webhook sent successfully to {webhook_url}")
                else:
                    print(f"⚠️ Webhook failed with status {response.status} for {webhook_url}")
    except Exception as e:
        print(f"❌ Webhook error for {webhook_url}: {str(e)}")

def trigger_webhooks(email: str, new_messages: list):
    """Trigger webhooks for new messages"""
    if not new_messages:
        return

    # Find webhook config for this email
    webhook_url = webhook_configs.get(email)
    if not webhook_url:
        return

    # Send webhook for each new message
    for message in new_messages:
        email_data = {
            "email": email,
            "message": {
                "id": message["id"],
                "from": message["from"],
                "subject": message["subject"],
                "text": message["text"],
                "html": message["html"],
                "date": message["date"],
                "hasAttachments": message["hasAttachments"]
            }
        }
        # Create task for async webhook sending
        asyncio.create_task(send_webhook_notification(webhook_url, email_data))

@app.get("/")
async def read_root():
    return FileResponse("index.html")

@app.get("/test-disposable-email-detector")
async def read_root():
    return FileResponse("test-disposable-email-detector.html")

@app.get("/docs-disposable-email-detector")
async def docs_disposable_email_detector():
    return FileResponse("docs-disposable-email-detector.html")

@app.get("/privacy")
async def privacy():
    return FileResponse("privacy.html")

@app.get("/terms")
async def terms():
    return FileResponse("terms.html")

@app.get("/contact")
async def contact():
    return FileResponse("contact.html")

@app.get("/extensions")
async def extensions():
    return FileResponse("extensions.html")

@app.get("/robots.txt")
async def robots():
    return FileResponse("robots.txt", media_type="text/plain")

@app.get("/sitemap.xml")
async def sitemap():
    return FileResponse("sitemap.xml", media_type="application/xml")

@app.get("/manifest.json")
async def manifest():
    return FileResponse("manifest.json", media_type="application/json")

@app.get("/sw.js")
async def service_worker():
    return FileResponse("sw.js", media_type="application/javascript")

@app.get("/tempmail.png")
async def tempmail_logo():
    return FileResponse("tempmail.png", media_type="image/png")
@app.get("/extension-image.png")
async def tempmail_logo():
    return FileResponse("extension-image.png", media_type="image/png")

@app.get("/favicon.ico")
async def tempmail_favicon_logo():
    return FileResponse("favicon.ico", media_type="image/x-icon")

@app.post("/webhook/configure")
async def configure_webhook(request: Request):
    """Configure webhook URL for an email address"""
    try:
        body = await request.json()
        email = body.get("email")
        webhook_url = body.get("webhook_url")

        if not email:
            raise HTTPException(status_code=400, detail="Email is required")

        if webhook_url:
            # Validate URL format
            if not webhook_url.startswith(('http://', 'https://')):
                raise HTTPException(status_code=400, detail="Webhook URL must start with http:// or https://")

            webhook_configs[email] = webhook_url
            return {"status": "success", "message": f"Webhook configured for {email}"}
        else:
            # Remove webhook if URL is empty
            if email in webhook_configs:
                del webhook_configs[email]
            return {"status": "success", "message": f"Webhook removed for {email}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/webhook/status/{email}")
async def get_webhook_status(email: str):
    """Get webhook configuration status for an email"""
    webhook_url = webhook_configs.get(email)
    return {
        "email": email,
        "webhook_configured": webhook_url is not None,
        "webhook_url": webhook_url
    }

@app.get("/healthz")
def health_check():
    return {"status": "ok"}

@app.get("/domains")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def get_available_domains():
    try:
        domains_data = get_domains()
        domains = [member["domain"] for member in domains_data["hydra:member"]]
        return {"domains": domains}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return HTMLResponse(
        content="""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | TempMail</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { text-align: center; max-width: 500px; padding: 2rem; }
        h1 { font-size: 6rem; margin-bottom: 1rem; opacity: 0.8; }
        h2 { font-size: 2rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; margin-bottom: 2rem; opacity: 0.9; }
        .btn { display: inline-block; padding: 12px 24px; background: rgba(255,255,255,0.2); color: white; text-decoration: none; border-radius: 8px; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s ease; }
        .btn:hover { background: rgba(255,255,255,0.3); transform: translateY(-2px); }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" class="btn">← Back to TempMail</a>
    </div>
</body>
</html>
        """,
        status_code=404
    )

# ... rest of the code ...

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_domains():
    page = 1
    domains = []
    
    while True:
        response = requests.get(f"{BASE_URL}/domains?page={page}")
        response.raise_for_status()
        data = response.json()
        domains.extend(member["domain"] for member in data["hydra:member"])
        
        # if no next page, stop
        view = data.get("hydra:view", {})
        if "hydra:next" not in view:
            break
        page += 1
    
    return {"hydra:member": [{"domain": domain} for domain in domains]}

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def create_account(email, password):
    response = requests.post(f"{BASE_URL}/accounts", json={"address": email, "password": password})
    response.raise_for_status()
    return response

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_token(email, password):
    response = requests.post(f"{BASE_URL}/token", json={"address": email, "password": password})
    response.raise_for_status()
    return response.json()["token"]

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_messages(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/messages", headers=headers)
    response.raise_for_status()
    return response.json()['hydra:member']

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def get_full_message(token, msg_id):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/messages/{msg_id}", headers=headers)
    response.raise_for_status()
    return response.json()

import hashlib
import uuid

def generate_unique_username():
    """Generate a unique, good-looking username that can scale to millions of users"""
    # Use UUID for uniqueness + timestamp for additional entropy
    unique_id = str(uuid.uuid4())
    timestamp = str(int(time.time() * 1000000))  # Microsecond precision
    
    # Create a hash for a shorter, cleaner username
    combined = unique_id + timestamp
    hash_obj = hashlib.sha256(combined.encode())
    hash_hex = hash_obj.hexdigest()[:16]  # Use first 16 characters
    
    # Word lists for good-looking usernames
    adjectives = ['cool', 'smart', 'swift', 'bright', 'clear', 'prime', 'elite', 'bold', 
                  'pure', 'safe', 'true', 'vast', 'wise', 'zen', 'pro', 'ace', 'alpha',
                  'beta', 'delta', 'echo', 'nova', 'sigma', 'omega', 'cyber', 'digital',
                  'secure', 'private', 'stealth', 'ghost', 'shadow', 'silent', 'quick',
                  'agile', 'awesome', 'blazing', 'clever', 'dynamic', 'epic', 'fierce',
                  'genius', 'heroic', 'infinite', 'legendary', 'mighty', 'noble', 'radiant',
                  'savage', 'stellar', 'supreme', 'thunder', 'ultimate', 'vibrant', 'wild',
                  'zealous', 'brave', 'calm', 'daring', 'eager', 'fancy', 'glorious', 'happy',
                  'ideal', 'jolly', 'keen', 'lucky', 'magic', 'neat', 'optimistic', 'proud',
                  'quiet', 'rare', 'sharp', 'tough', 'unique', 'vivid', 'witty', 'xtra',
                  'youthful', 'zany', 'adventurous', 'bold', 'charming', 'dazzling', 'elegant',
                  'fabulous', 'graceful', 'harmonious', 'innovative', 'joyful', 'kind', 'lively',
                  'majestic', 'natural', 'original', 'peaceful', 'quirky', 'resilient', 'sincere',
                  'talented', 'united', 'valiant', 'wise', 'xenon', 'yielding', 'zesty']
    
    nouns = ['user', 'mail', 'inbox', 'box', 'post', 'msg', 'send', 'recv', 'net',
             'web', 'link', 'node', 'hub', 'core', 'base', 'zone', 'spot', 'site',
             'temp', 'anon', 'secure', 'vault', 'shield', 'guard', 'lock', 'key',
             'account', 'address', 'archive', 'beacon', 'byte', 'channel', 'cipher', 'cloud',
             'code', 'data', 'domain', 'echo', 'flux', 'forge', 'gate', 'grid', 'haven',
             'icon', 'jet', 'kernel', 'lab', 'matrix', 'nexus', 'orbit', 'pixel', 'portal',
             'pulse', 'quest', 'realm', 'router', 'script', 'stream', 'terminal', 'vault',
             'wave', 'xenon', 'yard', 'zone', 'agent', 'blade', 'cache', 'drift', 'edge',
             'frame', 'globe', 'hive', 'isle', 'jewel', 'kite', 'leaf', 'moon', 'nest',
             'oasis', 'peak', 'quill', 'ridge', 'spark', 'trail', 'unit', 'veil', 'whirl',
             'yarn', 'zenith', 'apex', 'bloom', 'crest', 'dawn', 'flare', 'glow', 'horizon',
             'iris', 'jolt', 'knot', 'lark', 'maze', 'nova', 'opal', 'plume', 'quasar',
             'rift', 'sage', 'tide', 'umbra', 'vortex', 'whisper', 'yoke', 'zephyr']
    
    # Choose random word combination
    adj = random.choice(adjectives)
    noun = random.choice(nouns)
    
    # Create different username styles randomly
    style = random.randint(1, 5)
    
    if style == 1:
        # Format: adjective_noun_hash
        username = f"{adj}_{noun}_{hash_hex[:8]}"
    elif style == 2:
        # Format: adjective.noun.numbers
        username = f"{adj}.{noun}.{hash_hex[:6]}"
    elif style == 3:
        # Format: adjectivenoun-hash
        username = f"{adj}{noun}-{hash_hex[:8]}"
    elif style == 4:
        # Format: hash.username
        username = f"{hash_hex[:8]}.{adj}{noun}"
    else:
        # Format: adj-hash-noun
        username = f"{adj}-{hash_hex[:6]}-{noun}"
    
    return username.lower()

@app.post("/create_account")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def create_new_account(request: Request):
    try:
        try:
            body = await request.json()
        except:
            body = {}
        selected_domain = body.get("domain")
        custom_username = body.get("username", "").strip()
        
        if not selected_domain:
            # If no domain selected, get all domains and pick first one as default
            domains_data = get_domains()
            selected_domain = domains_data["hydra:member"][0]['domain']
        
        max_attempts = 10  # Maximum attempts to find unique email
        attempt = 0
        
        while attempt < max_attempts:
            attempt += 1
            
            # Generate username
            if custom_username:
                # For custom username, only try once - if it fails, it's because it already exists
                if attempt > 1:
                    raise HTTPException(status_code=400, detail="Username already taken. Please choose a different username.")
                username = custom_username
            else:
                # Generate unique, good-looking username
                username = generate_unique_username()
            
            email = f'{username}@{selected_domain}'
            
            # Generate secure password with high entropy
            password_uuid = str(uuid.uuid4())
            password_timestamp = str(int(time.time() * 1000000))
            password = hashlib.sha256(f"{password_uuid}{password_timestamp}".encode()).hexdigest()[:32]
            
            try:
                account_resp = create_account(email, password)
                if account_resp.status_code == 201:
                    # Success! Account created
                    break
                elif account_resp.status_code == 400:
                    # Bad request - likely email already exists
                    if custom_username:
                        raise HTTPException(status_code=400, detail="Username already taken. Please choose a different username.")
                    else:
                        # For auto-generated, try again with new username
                        continue
                else:
                    raise HTTPException(status_code=500, detail=f"Failed to create account: {account_resp.status_code}")
            except Exception as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    if custom_username:
                        raise HTTPException(status_code=400, detail="Username already taken. Please choose a different username.")
                    else:
                        # Try again with new username
                        continue
                else:
                    raise e
        
        if attempt >= max_attempts:
            raise HTTPException(status_code=500, detail="Failed to generate unique email after multiple attempts")
        
        token = get_token(email, password)
        
        return {"email": email, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/messages")
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def fetch_messages(token: str, email: str = None):
    try:
        messages = get_messages(token)
        full_messages = []
        new_messages = []

        for msg in messages:
            full_msg = get_full_message(token, msg['id'])
            message_data = {
                "id": full_msg["id"],
                "from": full_msg["from"]["address"],
                "subject": full_msg["subject"],
                "text": full_msg.get("text", ""),
                "html": full_msg.get("html", []),
                "date": full_msg["createdAt"],
                "hasAttachments": len(full_msg.get("attachments", [])) > 0
            }
            full_messages.append(message_data)

            # Check if this is a new message for webhook
            if email and message_data["id"] not in sent_webhook_messages:
                new_messages.append(message_data)
                sent_webhook_messages.add(message_data["id"])

        # Trigger webhooks for new messages
        if new_messages:
            trigger_webhooks(email, new_messages)

        return {"messages": full_messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))