import os
import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)

smtp_user = os.environ.get("SMTP_USER") or os.environ.get("GMAIL_USER") or "mentis.mathematics@gmail.com"
smtp_password = os.environ.get("SMTP_PASSWORD") or os.environ.get("GMAIL_APP_PASSWORD")
smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
smtp_port = int(os.environ.get("SMTP_PORT", "587"))

recipient = sys.argv[1] if len(sys.argv) > 1 else smtp_user

print(f"--- Mentis SMTP Configuration Test ---")
print(f"SMTP Host: {smtp_host}:{smtp_port}")
print(f"SMTP User: {smtp_user}")
print(f"Recipient: {recipient}")
print(f"Password Provided: {'Yes (Length: ' + str(len(smtp_password)) + ')' if smtp_password else 'No'}")

if not smtp_password:
    print("\n❌ Error: SMTP_PASSWORD is not set.")
    print("Usage:")
    print("  SMTP_PASSWORD='your-16-char-app-password' python3 test_smtp.py recipient@example.com")
    sys.exit(1)

# Clean whitespace in app password
clean_password = smtp_password.replace(" ", "")

msg = MIMEMultipart("alternative")
msg["Subject"] = "Mentis Mathematics - SMTP Test"
msg["From"] = f"Mentis Mathematics Foundation <{smtp_user}>"
msg["To"] = recipient

msg.attach(MIMEText("This is a test email from Mentis Mathematics Foundation.", "plain"))
msg.attach(MIMEText("<h2 style='color:#f97316'>Mentis Mathematics Foundation</h2><p>Your Gmail SMTP integration is working successfully!</p>", "html"))

try:
    print("\nConnecting to mail server...")
    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        print("Authenticating...")
        server.login(smtp_user, clean_password)
        print("Sending message...")
        server.send_message(msg)
    print(f"\n✅ SUCCESS! Email sent successfully to {recipient}.")
    print("Check your inbox (and spam folder) to verify.")
except Exception as e:
    print(f"\n❌ FAILED: {str(e)}")
    sys.exit(1)
