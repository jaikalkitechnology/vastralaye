from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from fastapi import HTTPException

# ===================================================================
#  FIX THE IMPORTS HERE
# ===================================================================
# Use '..' to go up from the 'crud' directory to the 'app' directory,
# then into the 'models' and 'schemas' directories.

# INCORRECT: from models.payment_gateway import PaymentGatewayCredential
# CORRECT:
from ..models.payment_gateway import PaymentGatewayCredential

# INCORRECT: from models.payment_log import PaymentLog
# CORRECT:
# from ..models.payment_log import PaymentLog
from ..models.payment_gateway import PaymentLog

# INCORRECT: from schemas.payment_gateway import GatewayCredentialCreate, GatewayCredentialUpdate
# CORRECT:
from ..schemas.payment_gateway import GatewayCredentialCreate, GatewayCredentialUpdate
# ===================================================================


#
#  The rest of your code is PERFECT and needs NO CHANGES.
#

# ===================================================================
#  PAYMENT GATEWAY CREDENTIALS
# ===================================================================

def get_all_credentials(db: Session) -> List[PaymentGatewayCredential]:
    return db.query(PaymentGatewayCredential).order_by(PaymentGatewayCredential.created_at.desc()).all()

def get_credential_by_id(db: Session, credential_id: int) -> PaymentGatewayCredential:
    cred = db.query(PaymentGatewayCredential).filter(PaymentGatewayCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    return cred

def get_credential_by_name(db: Session, gateway_name: str) -> Optional[PaymentGatewayCredential]:
    return db.query(PaymentGatewayCredential).filter(
        PaymentGatewayCredential.gateway_name == gateway_name.lower(),
        PaymentGatewayCredential.is_active == True
    ).first()

def get_active_credential(db: Session, gateway_name: str = "mizorpay") -> PaymentGatewayCredential:
    """Used by payment router to fetch live credentials"""
    cred = get_credential_by_name(db, gateway_name)
    if not cred:
        raise HTTPException(
            status_code=503,
            detail=f"No active credentials found for gateway: {gateway_name}"
        )
    return cred

def create_credential(db: Session, data: GatewayCredentialCreate, admin_id: int):
    pass

def update_credential(db: Session, credential_id: int, data: GatewayCredentialUpdate, admin_id: int):
    pass

def delete_credential(db: Session, credential_id: int):
    pass

def toggle_credential_status(db: Session, credential_id: int, admin_id: int):
    pass


# ===================================================================
#  PAYMENT TRANSACTION LOGS
# ===================================================================

def create_or_update_payment_log(
    db: Session,
    merchant_ref: str,
    status: str,
    payload: dict = None,
    gateway_response: dict = None
):
    """
    Creates or updates a payment log entry in the database.
    It finds the log by the unique merchant_ref.
    """
    log_entry = db.query(PaymentLog).filter(PaymentLog.merchant_ref == merchant_ref).first()

    if not log_entry and payload:
        log_entry = PaymentLog(
            merchant_ref=merchant_ref,
            status=status,
            amount=payload.get("amount"),
            user_id=payload.get("user_id"),
            request_payload=payload
        )
        db.add(log_entry)
    elif log_entry:
        log_entry.status = status
        if gateway_response is not None:
            log_entry.gateway_response = gateway_response
    else:
        print(f"Warning: Attempted to update non-existent payment log for merchant_ref: {merchant_ref}")
        return None

    try:
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        db.rollback()
        print(f"Error during payment log commit: {e}")
        raise