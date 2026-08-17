import requests
from pathlib import Path

# ================= CONFIG =================
API_URL = "https://api.vastraliya.com/categories/upload-excel"
EXCEL_FILE = Path("category.xlsx")

# ================= VALIDATION =================
if not EXCEL_FILE.exists():
    raise FileNotFoundError(f"Excel file not found: {EXCEL_FILE}")

# ================= FILE PAYLOAD =================
files = {
    "file": (
        EXCEL_FILE.name,
        open(EXCEL_FILE, "rb"),
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
}

# ================= API CALL =================
try:
    response = requests.post(
        API_URL,
        files=files,
        timeout=300
    )

    print("Status Code:", response.status_code)

    try:
        print("Response JSON:")
        print(response.json())
    except Exception:
        print("Raw Response:")
        print(response.text)

finally:
    files["file"][1].close()
