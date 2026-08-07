import os
import requests
import json

# ---- Load credentials from environment variables ----
MIZORPAY_TOKEN = os.getenv("MIZORPAY_TOKEN", "PASTE_TOKEN_HERE")
MIZORPAY_KEY = os.getenv("MIZORPAY_KEY", "PASTE_KEY_HERE")

BASE_URL = "https://payin.mizorpay.in"
ENDPOINT = "/api/collection-v9-payment"

def create_test_payment():
    url = f"{BASE_URL}{ENDPOINT}"

    headers = {
        "Content-Type": "application/json",
        "Token-Id": MIZORPAY_TOKEN,
        "Secret-Key": MIZORPAY_KEY,
    }

    payload = {
        "amount": 100,
        "currency": "INR",
        "order_id": "TEST_ORDER_001",
        "customer_name": "Test User",
        "customer_email": "test@example.com",
        "customer_phone": "9999999999",
        "redirect_url": "https://yourdomain.com/callback",
        "description": "Test payment"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        print("Status Code:", response.status_code)

        try:
            data = response.json()
            print("Response JSON:")
            print(json.dumps(data, indent=2))
        except ValueError:
            print("⚠️ Response is not JSON. Raw response:")
            print(response.text[:1000])

    except requests.exceptions.RequestException as e:
        print("Request failed:", e)


if __name__ == "__main__":
    create_test_payment()