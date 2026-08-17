import json

import requests

# =====================================================
# ⚙️ CONFIG
# =====================================================
BASE_URL = "https://api.vastraliya.com"   # change if deployed
WEBHOOK_SECRET = "your_webhook_secret"

CREATE_ORDER_URL = f"{BASE_URL}/api/v1/orders/create"
WEBHOOK_URL = f"{BASE_URL}/api/v1/webhook"

HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": WEBHOOK_SECRET,
}


# =====================================================
# 🔧 Create Order First
# =====================================================
def create_order():
    payload = {
        "customer_name": "Vikas",
        "phone_number": "9999999999",
        "shipping_address": "Borivali West",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400092",
        "total_amount": 1000
    }

    r = requests.post(CREATE_ORDER_URL, json=payload)

    print("\n🛒 CREATE ORDER")
    print("Status:", r.status_code)

    try:
        data = r.json()
        print("Response:", json.dumps(data, indent=4))
    except:
        print("Raw Response:", r.text)
        return None

    return data.get("merchant_ref")


# =====================================================
# 🔔 Webhook Test
# =====================================================
def test_webhook(merchant_ref, status="success"):
    payload = {
        "payin": {
            "mizor_pay_txn_id": "CMZP2XXXXXXXX27h",
            "merchant_ref": merchant_ref,
            "txn_status": status,
            "converted_amount": 1000,
            "rrn_no": 955000444
        }
    }

    r = requests.post(WEBHOOK_URL, json=payload, headers=HEADERS)

    print(f"\n🔔 WEBHOOK ({status.upper()})")
    print("Status:", r.status_code)
    print("Response:", r.json())


# =====================================================
# ▶️ RUN DEMO FLOW
# =====================================================
if __name__ == "__main__":

    print("\n🚀 DEMO: Create Order → Webhook\n")

    # Step 1: Create Order
    merchant_ref = create_order()

    if not merchant_ref:
        print("❌ Failed to create order")
        exit()

    print("✅ merchant_ref:", merchant_ref)

    # Step 2: Success Webhook
    test_webhook(merchant_ref, "success")

    # Step 3: Duplicate Webhook
    test_webhook(merchant_ref, "success")

    # Step 4: Failed Webhook
    test_webhook(merchant_ref, "failed")

    print("\n✅ Demo completed\n")