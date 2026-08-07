from fastapi_mail import ConnectionConfig
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME="noreply@mizorpay.in",
    MAIL_PASSWORD="Nwelcome$2026",
    MAIL_FROM="noreply@mizorpay.in",
    MAIL_PORT=465,
    MAIL_SERVER="smtpout.secureserver.net",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True
)