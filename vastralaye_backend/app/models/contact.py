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
    # The Gmail account used for SMTP.
    sender_email = Column(String(160), nullable=True)
    # Gmail app password — a secret; masked everywhere it is returned.
    app_password = Column(String(255), nullable=True)
    # Display name on outgoing mail.
    sender_name = Column(String(120), nullable=True)
    # Where contact-form submissions are announced.
    notify_email = Column(String(160), nullable=True)
    # Off means "store submissions but don't try to send" — useful while
    # credentials are still being sorted out, and it stops every submit
    # waiting on an SMTP timeout.
    notify_enabled = Column(Boolean, default=True, nullable=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(Integer, nullable=True)
