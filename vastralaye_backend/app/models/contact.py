from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from ..database import Base


class ContactMessage(Base):
    """A submission from the storefront's Contact Us form.

    Separate from `support_messages`, which belongs to a signed-in user and
    only carries a subject and body. Anyone can send one of these — there is
    no account behind it — so the sender's own details travel with the row.

    The row is the record. Email delivery is a notification on top of it, and
    `emailed` says whether that notification actually went out, so a message
    is never lost to a bounced SMTP login.
    """

    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(160), nullable=False, index=True)
    phone = Column(String(40), nullable=True)
    message = Column(Text, nullable=False)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    emailed = Column(Boolean, default=False, nullable=False)
    # Did the sender get their "thanks, we'll be in touch" acknowledgement?
    # Separate from `emailed`, which is the shop's own notification — the two
    # go to different people and either can fail on its own.
    ack_sent = Column(Boolean, default=False, nullable=False)

    # The most recent reply sent from the dashboard. Only ever written after
    # the email actually left — an unsent reply is not a reply, and showing
    # one would be worse than showing none.
    reply = Column(Text, nullable=True)
    replied_at = Column(DateTime(timezone=True), nullable=True)
    replied_by = Column(Integer, nullable=True)
    # Why the notification failed, kept so the admin page can say more than
    # "not sent". Never shown to the sender.
    email_error = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class EmailSetting(Base):
    """Outgoing-mail configuration, editable from the admin dashboard.

    One row. The account the site sends *from* and the inbox notifications go
    *to*. Falls back to the `.env` values when unset, so an existing
    deployment keeps working until someone opens the page.
    """

    __tablename__ = "email_settings"

    id = Column(Integer, primary_key=True, index=True)
    # The mailbox used for SMTP — Hostinger, Gmail, anything that speaks SMTP.
    sender_email = Column(String(160), nullable=True)
    # The mailbox password (Gmail calls it an "app password"). A secret; masked
    # everywhere it is returned.
    app_password = Column(String(255), nullable=True)
    # SMTP server. NULL means "use the default", resolved in code rather than
    # by the column, so rows added by schema_sync (which lands columns as NULL)
    # behave the same as rows created fresh.
    smtp_host = Column(String(160), nullable=True)
    smtp_port = Column(Integer, nullable=True)
    # True = implicit TLS on connect (port 465). False = STARTTLS (port 587).
    smtp_ssl = Column(Boolean, nullable=True)
    # Display name on outgoing mail.
    sender_name = Column(String(120), nullable=True)
    # Public address of the storefront. Emailed links (verify, reset) are built
    # from this. Configuration on purpose — deriving it from the request would
    # let anyone who can set an Origin header aim a reset link at their own site.
    site_url = Column(String(255), nullable=True)
    # Where contact-form submissions are announced.
    notify_email = Column(String(160), nullable=True)
    # Extra addresses copied on that announcement, comma-separated. Applies to
    # the shop's own notification only — never to anything a customer receives,
    # which would hand them the team's internal addresses.
    notify_cc = Column(String(500), nullable=True)
    # Off means "store submissions but don't try to send" — useful while
    # credentials are still being sorted out, and it stops every submit
    # waiting on an SMTP timeout.
    notify_enabled = Column(Boolean, default=True, nullable=False)
    # Send the customer a "thanks, we'll be in touch" confirmation. Nullable so
    # a row added by schema_sync (which lands columns as NULL) can be read as
    # "not decided" and fall back to the default rather than to off.
    ack_enabled = Column(Boolean, nullable=True)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)
