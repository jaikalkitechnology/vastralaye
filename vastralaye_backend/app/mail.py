import os
import smtplib
import logging
from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime

# -------------------------------
# Logging Configuration
# -------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()

SENDER_EMAIL = os.getenv("GMAIL_SENDER_EMAIL")
APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

# The mail server, when nothing overrides it. Kept as env vars so a deployment
# can point at its own provider without touching the database — and defaulting
# to Gmail because that is what every existing caller was hard-coded to use.
DEFAULT_SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
DEFAULT_SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
DEFAULT_SMTP_SSL = os.getenv("SMTP_SSL", "true").strip().lower() != "false"
# Without this a dead mail host hangs the request thread indefinitely.
SMTP_TIMEOUT = int(os.getenv("SMTP_TIMEOUT", "20"))
COMPANY_NAME = os.getenv("COMPANY_NAME", "Jokroup")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "support@vastraliya.com")

if not SENDER_EMAIL or not APP_PASSWORD:
    logger.warning("Missing GMAIL_SENDER_EMAIL or GMAIL_APP_PASSWORD in .env file")
else:
    logger.info("Using Gmail account: {}".format(SENDER_EMAIL))

# -------------------------------
# Email Template Base Design
# -------------------------------
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: #1B2557;
            padding: 30px 20px;
            text-align: center;
            color: white;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }}
        .content {{
            padding: 30px;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }}
        .button {{
            display: inline-block;
            padding: 14px 28px;
            background: #1B2557;
            color: white !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }}
        .order-details {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }}
        .detail-row {{
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }}
        .detail-row:last-child {{
            border-bottom: none;
        }}
        .status-badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }}
        .status-pending {{ background: #fff3cd; color: #856404; }}
        .status-confirmed {{ background: #d1ecf1; color: #0c5460; }}
        .status-shipped {{ background: #d4edda; color: #155724; }}
        .status-delivered {{ background: #d1ecf1; color: #0c5460; }}
        .support-info {{
            background: #e7f3ff;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{company_name}</h1>
        </div>
        <div class="content">
            {content}
        </div>
        <div class="footer">
            <p>&copy; {current_year} {company_name}. All rights reserved.</p>
            <p>Need help? Contact our support team at <a href="mailto:{support_email}">{support_email}</a></p>
        </div>
    </div>
</body>
</html>
"""


# -------------------------------
# Generic Email Sender
# -------------------------------
def send_custom_email(
    to_email: str,
    subject: str,
    plain_text: str,
    html_content: str = None,
    sender_email: str = None,
    app_password: str = None,
    sender_name: str = None,
    reply_to: str = None,
    smtp_host: str = None,
    smtp_port: int = None,
    smtp_ssl: bool = None,
    cc: list = None,
):
    """Send via SMTP, with the account and server passed in rather than read from .env.

    The module-level SENDER_EMAIL / APP_PASSWORD are resolved once at import,
    so they can't follow a setting an admin changes at runtime. Anything that
    needs the configured-in-the-dashboard account calls this and supplies it;
    `send_email` below stays as it was and delegates here.

    The server is a parameter because the shop's mailbox is not necessarily
    Gmail — a Hostinger address needs smtp.hostinger.com, and hard-coding
    Gmail meant authentication simply failed for it.

    `smtp_ssl` picks the connection style: True is implicit TLS on connect
    (port 465), False is plain connect then STARTTLS (port 587). Both are
    encrypted; providers differ on which port they publish.

    `reply_to` matters for forwarded mail: an enquiry announced to the shop's
    inbox should reply to the customer, not to the shop's own sender address.

    `cc` is a list of extra recipients. `send_message` derives the envelope
    from the To/Cc headers, so setting the header is all that's needed — but
    it also means one malformed address fails the whole send, which is why
    callers validate the list rather than passing raw input through.
    """
    sender = (sender_email or SENDER_EMAIL or "").strip()
    password = (app_password or APP_PASSWORD or "").strip()
    display = (sender_name or COMPANY_NAME or "").strip()
    host = (smtp_host or DEFAULT_SMTP_HOST).strip()
    port = int(smtp_port or DEFAULT_SMTP_PORT)
    use_ssl = DEFAULT_SMTP_SSL if smtp_ssl is None else bool(smtp_ssl)

    if not sender or not password:
        logger.error("❌ No sender credentials — cannot email %s", to_email)
        return False

    current_year = datetime.now().year

    if not html_content:
        # Create a basic HTML template if none provided
        html_content = EMAIL_TEMPLATE.format(
            subject=subject,
            company_name=display,
            support_email=SUPPORT_EMAIL,
            current_year=current_year,
            content=f"<p>{plain_text.replace(chr(10), '<br>')}</p>"
        )

    msg = EmailMessage()
    msg["From"] = f"{display} <{sender}>" if display else sender
    msg["To"] = to_email
    msg["Subject"] = subject
    cc_list = [a for a in (cc or []) if a]
    if cc_list:
        msg["Cc"] = ", ".join(cc_list)
    if reply_to:
        msg["Reply-To"] = reply_to

    # Set plain text version
    msg.set_content(plain_text)

    # Add HTML version
    msg.add_alternative(html_content, subtype="html")

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=SMTP_TIMEOUT) as smtp:
                smtp.login(sender, password)
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=SMTP_TIMEOUT) as smtp:
                smtp.starttls()
                smtp.login(sender, password)
                smtp.send_message(msg)
        logger.info(
            "✅ Email sent successfully to %s%s | Subject: %s",
            to_email, f" (cc {len(cc_list)})" if cc_list else "", subject,
        )
        return True
    except Exception as e:
        logger.error(f"❌ Email failed to send to {to_email} via {host}:{port}: {e}", exc_info=True)
        return False


def send_email(to_email: str, subject: str, plain_text: str, html_content: str = None):
    """Send an email via Gmail SMTP using the .env account."""
    return send_custom_email(to_email, subject, plain_text, html_content)


# ==========================
# 🎨 Enhanced Email Templates
# ==========================

def send_reset_email(to_email: str, reset_link: str, user_name: str = "User"):
    """Send password reset email with modern design"""
    subject = "Reset Your Password"
    current_year = datetime.now().year

    plain_text = f"""
Hi {user_name},

We received a request to reset your password for your {COMPANY_NAME} account.
Click the link below to create a new password:

{reset_link}

This link will expire in 1 hour for security reasons.

If you didn't request this change, please ignore this email. Your account remains secure.

Best regards,
{COMPANY_NAME} Support Team
"""

    content = f"""
    <h2>Password Reset Request</h2>
    <p>Hi {user_name},</p>
    <p>We received a request to reset your password for your {COMPANY_NAME} account.</p>
    <p>Click the button below to create a new password:</p>

    <div style="text-align: center;">
        <a href="{reset_link}" class="button">Reset Your Password</a>
    </div>

    <p style="color: #6c757d; font-size: 14px; text-align: center;">
        This link will expire in 1 hour for security reasons.
    </p>

    <div class="support-info">
        <strong>Didn't request this?</strong><br>
        If you didn't initiate this password reset, please ignore this email. 
        Your account remains secure.
    </div>
    """

    html_content = EMAIL_TEMPLATE.format(
        subject=subject,
        company_name=COMPANY_NAME,
        support_email=SUPPORT_EMAIL,
        current_year=current_year,
        content=content
    )

    return send_email(to_email, subject, plain_text, html_content)


def send_order_confirmation(to_email: str, order_id: int, total: float, items: list = None,
                            user_name: str = "Customer"):
    """Send order confirmation with order details"""
    subject = f"Order Confirmation - #{order_id:06d}"
    current_year = datetime.now().year

    items_text = ""
    if items:
        items_text = "\n".join([f"  - {item['name']} x{item['quantity']}: ₹{item['price']:.2f}"
                                for item in items])

    plain_text = f"""
Hi {user_name},

Thank you for your order! We're getting everything ready.

Order Details:
Order ID: #{order_id:06d}
Total Amount: ₹{total:.2f}

{items_text}

We'll notify you when your order ships. You can track your order status in your account.

Thank you for choosing {COMPANY_NAME}!
"""

    items_html = ""
    if items:
        items_html = "".join([f"""
            <div class="detail-row">
                <span>{item['name']} x{item['quantity']}</span>
                <span>₹{item['price']:.2f}</span>
            </div>
        """ for item in items])

    content = f"""
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi {user_name},</p>
    <p>Thank you for your order! We're preparing your items for shipment.</p>

    <div class="order-details">
        <div class="detail-row">
            <strong>Order ID</strong>
            <strong>#{order_id:06d}</strong>
        </div>
        {items_html}
        <div class="detail-row" style="border-top: 2px solid #dee2e6; font-weight: bold;">
            <span>Total Amount</span>
            <span>₹{total:.2f}</span>
        </div>
    </div>

    <p>We'll send you a notification when your order ships. You can track your order status anytime in your account.</p>

    <p>Thank you for shopping with {COMPANY_NAME}!</p>
    """

    html_content = EMAIL_TEMPLATE.format(
        subject=subject,
        company_name=COMPANY_NAME,
        support_email=SUPPORT_EMAIL,
        current_year=current_year,
        content=content
    )

    return send_email(to_email, subject, plain_text, html_content)


def send_order_status_update(to_email: str, order_id: int, status: str, tracking_link: str = None,
                             user_name: str = "Customer"):
    """Send order status update with appropriate styling"""
    subject = f"Order Update - #{order_id:06d}"
    current_year = datetime.now().year

    status_class = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'shipped': 'status-shipped',
        'delivered': 'status-delivered'
    }.get(status.lower(), 'status-pending')

    tracking_info = ""
    if tracking_link:
        tracking_info = f"\nTrack your package: {tracking_link}"

    plain_text = f"""
Hi {user_name},

Your order #{order_id:06d} status has been updated.

New Status: {status.upper()}
{tracking_info}

You can view your order details in your account.

Thank you,
{COMPANY_NAME} Team
"""

    tracking_html = ""
    if tracking_link:
        tracking_html = f"""
        <p>
            <strong>Track your package:</strong><br>
            <a href="{tracking_link}" class="button">Track Order</a>
        </p>
        """

    content = f"""
    <h2>Order Status Updated</h2>
    <p>Hi {user_name},</p>
    <p>Your order <strong>#{order_id:06d}</strong> status has been updated.</p>

    <div style="text-align: center; margin: 30px 0;">
        <span class="status-badge {status_class}">{status.upper()}</span>
    </div>

    {tracking_html}

    <p>You can view your order details and track progress in your account.</p>
    """

    html_content = EMAIL_TEMPLATE.format(
        subject=subject,
        company_name=COMPANY_NAME,
        support_email=SUPPORT_EMAIL,
        current_year=current_year,
        content=content
    )

    return send_email(to_email, subject, plain_text, html_content)


def send_support_acknowledgment(to_email: str, ticket_id: int, user_name: str = "Customer"):
    """Send support ticket acknowledgment"""
    subject = f"Support Ticket Received - #{ticket_id:06d}"
    current_year = datetime.now().year

    plain_text = f"""
Hi {user_name},

We've received your support request (Ticket #{ticket_id:06d}).

Our support team will review your inquiry and get back to you within 24 hours.

You can reply to this email to add more information to your ticket.

Thank you for contacting {COMPANY_NAME} Support.
"""

    content = f"""
    <h2>Support Request Received</h2>
    <p>Hi {user_name},</p>

    <div class="order-details">
        <div class="detail-row">
            <strong>Ticket ID</strong>
            <strong>#{ticket_id:06d}</strong>
        </div>
        <div class="detail-row">
            <span>Status</span>
            <span class="status-badge status-pending">Under Review</span>
        </div>
    </div>

    <p>Our support team has received your inquiry and will review it shortly. 
    We typically respond to all tickets within 24 hours.</p>

    <div class="support-info">
        <strong>Need to add information?</strong><br>
        Simply reply to this email to add more details to your ticket.
    </div>

    <p>Thank you for reaching out to {COMPANY_NAME} Support.</p>
    """

    html_content = EMAIL_TEMPLATE.format(
        subject=subject,
        company_name=COMPANY_NAME,
        support_email=SUPPORT_EMAIL,
        current_year=current_year,
        content=content
    )

    return send_email(to_email, subject, plain_text, html_content)


def send_welcome_email(to_email: str, user_name: str = "there"):
    """Send welcome email to new users"""
    subject = f"Welcome to {COMPANY_NAME}!"
    current_year = datetime.now().year

    plain_text = f"""
Welcome to {COMPANY_NAME}, {user_name}!

We're excited to have you on board. Here's what you can do:
- Browse our products
- Track your orders
- Manage your account

Get started by exploring our collection.

If you have any questions, feel free to contact our support team.

Happy shopping!
The {COMPANY_NAME} Team
"""

    content = f"""
    <h2>Welcome to {COMPANY_NAME}! 🎉</h2>
    <p>Hi {user_name},</p>
    <p>We're thrilled to welcome you to {COMPANY_NAME}. Get ready for an amazing shopping experience!</p>

    <p>Start exploring our collection and discover amazing products tailored for you.</p>

    <div style="text-align: center;">
        <a href="#" class="button">Start Shopping</a>
    </div>

    <p>If you have any questions, our support team is here to help!</p>
    """

    html_content = EMAIL_TEMPLATE.format(
        subject=subject,
        company_name=COMPANY_NAME,
        support_email=SUPPORT_EMAIL,
        current_year=current_year,
        content=content
    )

    return send_email(to_email, subject, plain_text, html_content)