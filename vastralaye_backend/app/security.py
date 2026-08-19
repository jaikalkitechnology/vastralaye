import os
from datetime import datetime, timedelta
from fastapi import HTTPException, status
import bcrypt
from jose import JWTError, jwt  # ✅ FIXED: Use jose.jwt

# Password hashing — bcrypt called directly. passlib (unmaintained since
# 2020) probes bcrypt internals that newer bcrypt removed, printing an
# AttributeError traceback on every startup and hard-failing under bcrypt 5.
# Every stored hash is $2b$12$, which checkpw reads natively, so nothing
# about the database changes.

# bcrypt reads only the first 72 bytes of a password. passlib truncated
# silently, so keep truncating — a long password hashed under the old code
# must still verify — and bcrypt 5.x raises instead of truncating.
_BCRYPT_MAX_BYTES = 72


def _secret_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_secret_bytes(password), bcrypt.gensalt(rounds=12)).decode("ascii")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(_secret_bytes(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        # A malformed stored hash means "wrong password", not a 500.
        return False


class _PasswordContext:
    """Stand-in for the old passlib CryptContext — only .hash/.verify were used."""

    @staticmethod
    def hash(password: str) -> str:
        return get_password_hash(password)

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        return verify_password(plain_password, hashed_password)


pwd_context = _PasswordContext()


# JWT Configuration for password reset
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
RESET_TOKEN_EXPIRE_MINUTES = 60  # 1 hour


def create_reset_token(email: str) -> str:
    """Create a JWT token specifically for password reset"""
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "password_reset"  # Differentiate from access tokens
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_reset_token(token: str) -> str:
    """Verify and return email from reset token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Check if token is a password reset token
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type"
            )

        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token"
            )
        return email
    except JWTError as e:
        if "exp" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )