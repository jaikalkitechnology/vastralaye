from fastapi import APIRouter
import os
import requests
import time

router = APIRouter()

OAUTH_URL = "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
CHECKOUT_URL = "https://api.phonepe.com/apis/pg/checkout/v2/pay"

CLIENT_ID = os.getenv("PHONEPE_CLIENT_ID", "SU2602031805256502577174")
CLIENT_SECRET = os.getenv("PHONEPE_CLIENT_SECRET", "ec8e9271-2d62-416d-98fa-6db8ce9b332f")

# Temporary storage (use DB in production)
payment_store = {}


def generate_access_token():
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
        "client_version": 1
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    response = requests.post(OAUTH_URL, data=data, headers=headers)
    return response.json().get("access_token")


@router.get("/generate-payment/{amount}")
def generate_payment(amount: int):

    if amount <= 0:
        return {"error": "Invalid amount"}

    access_token = generate_access_token()

    if not access_token:
        return {"error": "Token generation failed"}

    order_id = "OMO" + str(int(time.time()))

    payload = {
        "merchantOrderId": order_id,
        "amount": amount,
        "expireAfter": 1200,
        "paymentFlow": {
            "type": "PG_CHECKOUT",
            "message": "Payment via PhonePe",
        }
    }

    headers = {
        "Authorization": f"O-Bearer {access_token}",
        "Content-Type": "application/json"
    }

    response = requests.post(CHECKOUT_URL, json=payload, headers=headers)
    result = response.json()

    redirect_url = result.get("redirectUrl")

    if not redirect_url:
        return result

    # Store redirect URL temporarily
    payment_store[order_id] = redirect_url

    # The payment page is served by this API itself (GET /payment/{order_id}).
    api_public = os.getenv("API_PUBLIC_URL", "https://api.vastraliya.com")
    return {
        "paymentUrl": f"{api_public}/payment/{order_id}",
        "order_id": order_id,
        "expire": 1200,
    }


@router.get("/get-token/{order_id}")
def get_token(order_id: str):

    redirect_url = payment_store.get(order_id)

    if not redirect_url:
        return {"error": "Invalid or expired order"}

    return {
        "tokenUrl": redirect_url,
        "order_id": order_id
    }