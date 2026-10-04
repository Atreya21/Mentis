import os
import sys
import json
import base64
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SCOPES = "https://www.googleapis.com/auth/gmail.send"
REDIRECT_URI = "http://localhost:8080"

auth_code = None

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        if "code" in params:
            auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"""
            <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0b1120; color: #e2e8f0;">
                <h1 style="color: #22c55e;">Authorization Successful!</h1>
                <p>You can close this tab and return to your terminal.</p>
            </body>
            </html>
            """)
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Failed to obtain code")

    def log_message(self, format, *args):
        return  # Silence server logs

def get_oauth_tokens(client_id: str, client_secret: str):
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": SCOPES,
            "access_type": "offline",
            "prompt": "consent"
        })
    )

    print("\n" + "=" * 70)
    print("STEP 1: AUTHORIZE GMAIL API")
    print("=" * 70)
    print("Opening Google OAuth sign-in page in your browser...")
    print(f"\nIf it doesn't open automatically, visit this URL:\n\n{auth_url}\n")

    import webbrowser
    webbrowser.open(auth_url)

    server = HTTPServer(("localhost", 8080), OAuthCallbackHandler)
    print("Waiting for you to sign in with your Google account in the browser...")
    while not auth_code:
        server.handle_request()

    print("\nAuthorization code received! Exchanging for Refresh Token...")
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": auth_code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    resp = requests.post(token_url, data=data)
    token_data = resp.json()

    if "refresh_token" not in token_data:
        print("\n❌ Error getting refresh token:", token_data)
        sys.exit(1)

    refresh_token = token_data["refresh_token"]
    access_token = token_data.get("access_token")

    print("\n✅ Successfully generated Gmail Refresh Token!")
    return refresh_token, access_token

def test_send_email(access_token: str, recipient: str):
    print(f"\nSending a test email to {recipient} via Gmail REST API (Port 443 HTTPS)...")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Mentis Foundation - Gmail REST API Verified!"
    msg["From"] = "Mentis Mathematics Foundation <mentis.mathematics@gmail.com>"
    msg["To"] = recipient

    html = """
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; padding: 30px; border-radius: 12px; color: #e2e8f0;">
        <h2 style="color: #22c55e;">Gmail REST API is Working! 🎉</h2>
        <p>This email was dispatched via Google's official <strong>Gmail REST API (Port 443 HTTPS)</strong>.</p>
        <p>It completely bypasses all cloud firewall port restrictions (ports 25, 465, and 587) and requires zero third-party services.</p>
    </div>
    """
    msg.attach(MIMEText("Gmail REST API is working!", "plain"))
    msg.attach(MIMEText(html, "html"))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")
    resp = requests.post(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json={"raw": raw}
    )

    if resp.status_code in [200, 201]:
        print("✅ Test email delivered successfully!")
    else:
        print("⚠️ Test send response:", resp.status_code, resp.text)

if __name__ == "__main__":
    print("=" * 70)
    print("MENTIS MATHEMATICS - GMAIL REST API SETUP WIZARD")
    print("=" * 70)

    # Check if credentials JSON provided as argument
    client_id = os.environ.get("GMAIL_CLIENT_ID")
    client_secret = os.environ.get("GMAIL_CLIENT_SECRET")

    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1]) as f:
            creds = json.load(f)
            web_or_installed = creds.get("installed") or creds.get("web") or {}
            client_id = web_or_installed.get("client_id")
            client_secret = web_or_installed.get("client_secret")

    if not client_id or not client_secret:
        print("\nPlease enter your OAuth Credentials from Google Cloud Console:")
        print("(Project -> APIs & Services -> Credentials -> OAuth 2.0 Client IDs)")
        client_id = input("\nEnter Client ID: ").strip()
        client_secret = input("Enter Client Secret: ").strip()

    refresh_token, access_token = get_oauth_tokens(client_id, client_secret)

    test_recipient = "atreyaghoshal.68@gmail.com"
    test_send_email(access_token, test_recipient)

    print("\n" + "=" * 70)
    print("RENDER ENVIRONMENT VARIABLES TO COPY & PASTE:")
    print("=" * 70)
    print(f"GMAIL_CLIENT_ID={client_id}")
    print(f"GMAIL_CLIENT_SECRET={client_secret}")
    print(f"GMAIL_REFRESH_TOKEN={refresh_token}")
    print("=" * 70)
    print("\nSave these 3 variables in Render -> mentis-backend -> Environment.")
    print("Your backend will now automatically send all emails via Google's official API!\n")
