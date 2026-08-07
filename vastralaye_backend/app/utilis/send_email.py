from fastapi_mail import FastMail, MessageSchema
from app.utilis.email_config import conf
from app.utilis.invoice_pdf import generate_invoice_pdf

BASE_URL = "https://api.mizorpaymart.com"
ORDER_DETAILS_URL = "https://mizorpaymart.com/orders/"
PRODUCT_URL = "https://mizorpaymart.com/product/"


async def send_order_email(
    customer_email,
    order_id,
    amount,
    items,
    customer_name,
    address_line1,
    city,
    postal_code,
    country,
    order_date,
    phone,


):
    # Generate invoice PDF

    total_mrp = 0

    for item in items:
        price = float(item.get("price", 0))
        qty = item.get("quantity", 1)
        total_mrp += price * qty

    coupon_discount = round(total_mrp - amount, 2)

    # ✅ ADD THIS
    invoice_path = generate_invoice_pdf(
        order_id,
        customer_name,
        address_line1,
        phone,
        amount,
        items,
        order_date,
        coupon_discount=coupon_discount
    )

    # GST
    base_amount = round(amount / 1.18, 2)
    gst = round(amount - base_amount, 2)
    # Links
    first_product_id = items[0].get("product_id", "") if items else ""
    product_page_link = f"{PRODUCT_URL}{first_product_id}"
    order_details_link = f"{ORDER_DETAILS_URL}{order_id}"

    # ================= PRODUCT TABLE =================
    # Build table rows (with optional HSN column)
    products_html = """
    <tr style="background-color:#f6f6f6; font-weight:bold; border-bottom:1px solid #ddd;">
        <td style="padding:10px;">Product</td>
        <td style="padding:10px;">HSN</td>
        <td style="padding:10px;">Qty</td>
        <td align="right" style="padding:10px;">Rate</td>
    </tr>
    """
    for item in items:
        print(item)
    product = item.get("product", {})
    price = item.get("price", 0)
    for item in items:
        price = item.get("price", 0)
        qty = item.get("quantity", item.get("qty", 1))

        image_url = BASE_URL + item["image"] if item.get("image") else ""
        product_id = item.get("product_id", "")
        product_link = f"{PRODUCT_URL}{product_id}"
        hsn = item.get("hsn_code", "N/A")

        products_html += f"""
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:12px 10px;">
                <table cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding-right:10px;">
                            <a href="{product_link}">
                                <img src="{image_url}" width="50" style="border-radius:4px;" alt="{item.get('name','')}">
                            </a>
                        </td>
                        <td>
                            <a href="{product_link}" style="text-decoration:none; color:#007185; font-weight:500;">
                                {item.get('name','')}
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="padding:12px 10px; color:#565959;">{hsn}</td>
            <td style="padding:12px 10px; color:#565959;">{item.get('quantity', item.get('qty', 1))}</td>
            <td align="right" style="padding:12px 10px; font-weight:600;">
    ₹{price:.2f}
</td>
        </tr>
        """
    discount_value = coupon_discount
    # ================= ORDER SUMMARY =================
    order_summary = f"""
    <table width="100%" cellpadding="4" style="font-size:14px;">
        <tr>
            <td>Subtotal (MRP)</td>
            <td align="right">₹{total_mrp:.2f}</td>
        </tr>
        <tr>
            <td>Discount</td>
<td align="right" style="color:#B12704;">-₹{discount_value:.2f}</td>        </tr>
        <tr>
            <td>Base Amount</td>
            <td align="right">₹{base_amount:.2f}</td>
        </tr>
        <tr>
            <td>GST (18%)</td>
            <td align="right">₹{gst:.2f}</td>
        </tr>
        <tr>
            <td style="border-top:2px solid #e7e7e7;"><strong>Total</strong></td>
            <td align="right" style="border-top:2px solid #e7e7e7;">
                <strong>₹{amount:.2f}</strong>
            </td>
        </tr>
    </table>
    """

    # ================= EMAIL HTML =================
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            /* Inline styles are primary, but a few client-safe resets */
            body {{ margin:0; padding:0; background-color:#f0f2f2; font-family: Arial, sans-serif; }}
            table {{ border-collapse: collapse; }}
        </style>
    </head>
    <body style="margin:0; padding:20px; background-color:#f0f2f2;">

    <!-- Main container -->
    <table align="center" width="100%" style="max-width:600px; background:#ffffff; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
        <tr>
            <td style="padding:24px;">

                <!-- Header with logo -->
                <table width="100%">
                    <tr>
                        <td style="border-bottom:1px solid #e7e7e7; padding-bottom:20px;">
                            <img src="https://mizorpaymart.com/logo.png" width="140" alt="MizorPayMart" style="display:block;">
                        </td>
                    </tr>
                </table>

                <!-- Thank you & order confirmation -->
                <table width="100%" style="margin-top:20px;">
                    <tr>
                        <td>
                            <h1 style="font-size:24px; font-weight:400; margin:0; color:#111;">Thank you, {customer_name}!</h1>
                            <p style="font-size:16px; color:#565959; margin:8px 0 0;">Your order has been placed successfully.</p>
                        </td>
                    </tr>
                </table>

                <!-- Order ID & date card -->
                <table width="100%" style="background:#f6f6f6; border-radius:6px; margin:20px 0; padding:16px;">
                    <tr>
                        <td style="font-size:14px; color:#565959;">Order #:</td>
                        <td align="right" style="font-size:14px; color:#565959;">{order_date}</td>
                    </tr>
                    <tr>
                        <td style="font-size:16px; font-weight:bold; color:#111;">{order_id}</td>
                        <td align="right"></td>
                    </tr>
                </table>

                <!-- Product list table -->
                <table width="100%" style="border-collapse:collapse; font-size:14px;">
                    {products_html}
                </table>

                <!-- Summary & Address side by side -->
                <table width="100%" style="margin-top:25px;">
                    <tr>
                        <td width="50%" valign="top" style="padding-right:20px;">
                            <h3 style="font-size:16px; margin:0 0 10px; color:#111;">Order Summary</h3>
                            {order_summary}
                        </td>
                        <td width="50%" valign="top">
                            <h3 style="font-size:16px; margin:0 0 10px; color:#111;">Shipping Address</h3>
                            <p style="margin:0; line-height:1.5; color:#565959; font-size:14px;">
                                {customer_name}<br>
                                {address_line1}<br>
                                {city}, {postal_code}<br>
                                {country}<br>
                                Phone: {phone}
                            </p>
                            <h3 style="font-size:16px; margin:20px 0 10px; color:#111;">Payment Method</h3>
                            <p style="margin:0; color:#565959; font-size:14px;">Cash on Delivery</p>
                        </td>
                    </tr>
                </table>

                <!-- Action Buttons -->
                <table width="100%" style="margin:30px 0 20px;">
                    <tr>
                        <td align="center">
                            <a href="{product_page_link}" style="background:#f0f2f2; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:bold; color:#111; display:inline-block; margin:0 5px 10px;">View Product</a>
                        </td>
                    </tr>
                </table>

                <!-- Invoice attachment notice -->
                <table width="100%" style="margin:10px 0; padding:12px; background:#f9f9f9; border-radius:6px;">
                    <tr>
                        <td align="center" style="font-size:14px; color:#333;">
                            📎 Your <strong>GST Invoice</strong> is attached with this email. Please keep it for your records.
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table width="100%" style="border-top:1px solid #e7e7e7; padding-top:20px;">
                    <tr>
                        <td align="center" style="font-size:12px; color:#868e96;">
                            © 2026 MizorPayMart. All rights reserved.<br>
                            <a href="#" style="color:#007185; text-decoration:none;">Privacy Policy</a> | <a href="#" style="color:#007185; text-decoration:none;">Terms of Use</a>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

    </body>
    </html>
    """

    # ================= EMAIL MESSAGE =================
    message = MessageSchema(
        subject=f"Your MizorPayMart Order #{order_id} is Confirmed",
        recipients=[customer_email],
        body=html,
        subtype="html",
        attachments=[invoice_path]
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        # print("Email sent successfully")
    except Exception as e:
        # print("EMAIL ERROR:", e)
        if items:
            print(items[0])