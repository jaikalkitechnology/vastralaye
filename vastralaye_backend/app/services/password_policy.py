"""
The one password rule for the whole site.

It used to live inside `app/routers/user.py`, which meant anything else that set
a password — the admin dashboard, a future import script — either imported a
router to get at it or, more likely, quietly invented its own weaker rule. A
password accepted in one place and rejected in another is the sort of thing
nobody notices until a customer can't log in.

Kept free of FastAPI and SQLAlchemy imports so it can be tested on its own.
"""

import re

MIN_PASSWORD_LEN = 8


class PasswordPolicyError(ValueError):
    """Raised with a message that is safe to show the person typing."""


def validate_password(password: str) -> None:
    """Raise PasswordPolicyError if `password` isn't good enough to store."""
    if not password or not isinstance(password, str):
        raise PasswordPolicyError("Password is required.")
    if len(password) < MIN_PASSWORD_LEN:
        raise PasswordPolicyError(
            f"Password must be at least {MIN_PASSWORD_LEN} characters."
        )
    if not re.search(r"[A-Za-z]", password) or not re.search(r"[0-9]", password):
        raise PasswordPolicyError("Password must include both letters and numbers.")
