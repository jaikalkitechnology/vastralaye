import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle


# Configuration — the seller identity printed on every tax invoice.
COMPANY_NAME = "Vastraliya Fashion Pvt. Ltd."
GST_NUMBER = "27AAMCV4451F"
CIN_NUMBER = "U47711MR2026PTC478420"
COMPANY_ADDRESS = [
    "Gala No 230, Second Floor, Pride Industrial Estate,",
    "Vasai East, Thane, Maharashtra, PIN - 401208, India",
]
COMPANY_PHONE = "+91 70661 81207"
COMPANY_EMAIL = "support@vastraliya.com"
# No remote logo: the old URL pointed at a host we no longer control, and a
# network fetch inside PDF generation is a failure point. The letterhead's
# company name is the mark; drop a file at static/logo.png to add one back.
LOGO_PATH = "static/logo.png"

# Colors
COLOR_PRIMARY = colors.HexColor("#232F3E")
COLOR_ACCENT = colors.HexColor("#FF9900")
COLOR_LIGHT_GRAY = colors.HexColor("#F3F3F3")
COLOR_BORDER = colors.HexColor("#DDDDDD")


def draw_text_block(c, x, y, title, lines):
    """Helper to draw a title and multiple lines of text"""
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(colors.black)
    c.drawString(x, y, title)
    y -= 5 * mm

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#333333"))
    for line in lines:
        c.drawString(x, y, line)
        y -= 4.5 * mm
    return y


def generate_invoice_pdf(order_id, customer_name, address, phone, total_amount, items, order_date, coupon_discount=0):
    os.makedirs("invoices", exist_ok=True)
    file_path = f"invoices/invoice_{order_id}.pdf"

    c = canvas.Canvas(file_path, pagesize=A4)
    width, height = A4
    margin = 15 * mm

    # ================= HEADER (White Background) =================
    header_top = height - 10 * mm
    header_bottom = height - 35 * mm

    # Logo (Left Side)
    try:
        logo = ImageReader(LOGO_PATH)
        c.drawImage(
            logo,
            margin,
            header_bottom + 2 * mm,
            height=20 * mm,
            width=55 * mm,
            preserveAspectRatio=True,
            mask='auto'
        )
    except Exception:
        c.setFillColor(COLOR_PRIMARY)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(margin, header_top - 15 * mm, COMPANY_NAME)

    # TAX INVOICE + Invoice Number (Right Side)
    c.setFillColor(COLOR_PRIMARY)
    c.setFont("Helvetica-Bold", 22)
    c.drawRightString(width - margin, header_top - 5 * mm, "TAX INVOICE")

    c.setFillColor(colors.HexColor("#555555"))
    c.setFont("Helvetica", 10)
    c.drawRightString(width - margin, header_top - 12 * mm, f"Invoice #: INV-{order_id}")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#777777"))
    c.drawRightString(width - margin, header_top - 17 * mm, f"Date: {order_date}")

    # Divider Line below header
    c.setStrokeColor(COLOR_PRIMARY)
    c.setLineWidth(1.5)
    c.line(margin, header_bottom - 2 * mm, width - margin, header_bottom - 2 * mm)

    # Thin accent line
    c.setStrokeColor(COLOR_ACCENT)
    c.setLineWidth(0.8)
    c.line(margin, header_bottom - 4 * mm, width - margin, header_bottom - 4 * mm)

    # ================= ADDRESS DETAILS =================
    y_start = header_bottom - 15 * mm

    # Seller Details (Left)
    seller_lines = COMPANY_ADDRESS + [
        f"Phone: {COMPANY_PHONE}",
        f"GSTIN: {GST_NUMBER}",
        f"CIN: {CIN_NUMBER}",
        f"Email: {COMPANY_EMAIL}",
    ]

    draw_text_block(c, margin, y_start, f"Sold By: {COMPANY_NAME}", seller_lines)

    # Buyer Details (Right)
    addr_lines = address.split(',') if ',' in address else [address]
    if len(addr_lines) > 3:
        addr_lines = [", ".join(addr_lines[:2]), ", ".join(addr_lines[2:])]

    buyer_lines = [customer_name] + [line.strip() for line in addr_lines] + [f"Phone: {phone}"]
    draw_text_block(c, width / 2 + 10 * mm, y_start, "Billing Address:", buyer_lines)

    # Order Meta Data Box
    meta_y = y_start - 35 * mm
    c.setFillColor(COLOR_LIGHT_GRAY)
    c.rect(margin, meta_y, width - (2 * margin), 10 * mm, fill=1, stroke=0)

    c.setStrokeColor(COLOR_BORDER)
    c.rect(margin, meta_y, width - (2 * margin), 10 * mm, fill=0, stroke=1)

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin + 5 * mm, meta_y + 3 * mm, "Order ID:")
    c.setFont("Helvetica", 9)
    c.drawString(margin + 25 * mm, meta_y + 3 * mm, str(order_id))

    c.setFont("Helvetica-Bold", 9)
    c.drawString(width / 2, meta_y + 3 * mm, "Order Date:")
    c.setFont("Helvetica", 9)
    c.drawString(width / 2 + 22 * mm, meta_y + 3 * mm, str(order_date))

    # ================= ITEMS TABLE =================
    table_data = [
        ["#", "Product / Description", "HSN", "Qty", "Rate (Rs.)", "Taxable", "GST (18%)", "Total (Rs.)"]
    ]

    total_mrp = 0

    for i, item in enumerate(items, 1):
        name = item.get("name", "Unknown Item")
        if len(name) > 30:
            name = name[:27] + "..."

        hsn = item.get("hsn_code", "N/A")
        qty = item.get("quantity", 1)

        # ✅ IMPORTANT: use selling price (not MRP)
        price = float(item.get("price", 0))

        line_total = qty * price
        total_mrp += line_total

        # ✅ CALCULATE TAXABLE & GST
        taxable = line_total / 1.18
        gst = line_total - taxable

        taxable = round(taxable, 2)
        gst = round(gst, 2)

        table_data.append([
            str(i),
            name,
            str(hsn),
            str(qty),
            f"{price:.2f}",
            f"{taxable:.2f}",  # ✅ FIXED
            f"{gst:.2f}",  # ✅ FIXED
            f"{line_total:.2f}"
        ])
    final_total = total_amount  # already after coupon

    base_amount = final_total / 1.18
    gst_amount = final_total - base_amount

    base_amount = round(base_amount, 2)
    gst_amount = round(gst_amount, 2)
    final_total = round(final_total, 2)
    # Column Widths
    col_widths = [
        10 * mm,
        60 * mm,
        20 * mm,
        12 * mm,
        20 * mm,
        20 * mm,
        20 * mm,
        23 * mm
    ]

    table = Table(table_data, colWidths=col_widths)

    # Table Styling
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('ALIGN', (-1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT_GRAY]),
    ])
    table.setStyle(style)

    # Draw Table
    table_w, table_h = table.wrapOn(c, width, height)
    table_y_position = meta_y - 10 * mm - table_h
    table.drawOn(c, margin, table_y_position)

    # ================= SUMMARY SECTION =================
    summary_y = table_y_position - 12 * mm

    # Left side: Terms text
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.black)
    c.drawString(margin, summary_y, "Terms & Conditions:")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawString(margin, summary_y - 5 * mm, "1. Goods once sold will not be taken back.")
    c.drawString(margin, summary_y - 9 * mm, "2. Subject to Mizoram Jurisdiction.")
    c.drawString(margin, summary_y - 13 * mm, "3. This is a computer generated invoice.")

    summary_data = [
        ["Subtotal (MRP):", f"Rs. {total_mrp:.2f}"],
        ["Coupon Discount:", f"- Rs. {coupon_discount:.2f}"],
        ["Base Amount:", f"Rs. {base_amount:.2f}"],
        ["GST (18%):", f"Rs. {gst_amount:.2f}"],
        ["Shipping:", "Free"],
        ["Grand Total:", f"Rs. {final_total:.2f}"]
    ]

    summary_table = Table(summary_data, colWidths=[40 * mm, 30 * mm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, -1), (-1, -1), COLOR_PRIMARY),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, COLOR_PRIMARY),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))

    st_w, st_h = summary_table.wrapOn(c, width, height)
    summary_table.drawOn(c, width - margin - st_w, summary_y - st_h + 2 * mm)

    # ================= FOOTER =================
    # Footer divider
    c.setStrokeColor(COLOR_PRIMARY)
    c.setLineWidth(1)
    c.line(margin, 20 * mm, width - margin, 20 * mm)

    c.setStrokeColor(COLOR_ACCENT)
    c.setLineWidth(0.5)
    c.line(margin, 19 * mm, width - margin, 19 * mm)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(COLOR_PRIMARY)
    c.drawCentredString(width / 2, 14 * mm, f"Thank you for shopping with {COMPANY_NAME}!")

    c.setFont("Helvetica", 7)
    c.setFillColor(colors.gray)
    c.drawCentredString(width / 2, 10 * mm, "This is a computer generated invoice and does not require a physical signature.")

    c.save()
    # print(f"Invoice generated: {file_path}")
    return file_path


# ================= EXAMPLE USAGE =================
if __name__ == "__main__":
    items_data = [
        {
            "name": "Men's Cotton T-Shirt",
            "qty": 2,
            "price": 499.00,
            "hsn_code": "6109"
        },
        {
            "name": "Wireless Bluetooth Earbuds",
            "qty": 1,
            "price": 1299.00,
            "hsn_code": "8517"
        },
        {
            "name": "USB-C Charging Cable",
            "qty": 1,
            "price": 299.00,
            "hsn_code": "8544"
        }
    ]

    generate_invoice_pdf(
        order_id="ORD-987654",
        customer_name="John Doe",
        address="Flat 4B, Green Valley Apts, Aizawl, Mizoram - 796001",
        phone="+91 98765 43210",
        total_amount=2596.00,
        items=items_data,
        order_date="2023-10-27"
    )