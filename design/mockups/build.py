#!/usr/bin/env python3
"""Assemble the Vastralaye design mockup pages into standalone HTML files.

Wraps each body in pages/ with the shared <head>, header and footer partials,
writing the result to dist/. Run:  python3 build.py
"""
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"
DIST.mkdir(exist_ok=True)

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Vastralaye</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
"""

SLIM_HEADER = """<div class="announce">Free shipping on orders above ₹999 · <b>FESTIVE10</b> — extra 10% off prepaid orders</div>
<header class="header-slim"><div class="container header-inner">
<a class="logo" href="#">Vastra<span>laye</span><small>Handcrafted India</small></a>
</div></header>
"""

SLIM_FOOTER = """<footer class="footer"><div class="container footer-bottom" style="border-top:none">
<span>© 2026 Vastralaye · All rights reserved</span>
<div class="pay-chips"><span>UPI</span><span>VISA</span><span>RUPAY</span><span>COD</span></div>
</div></footer>
"""

# page file -> (title, chrome, active-nav token)
PAGES = {
    "home": ("Home", "full", "NAV_HOME"),
    "products": ("Sarees", "full", "NAV_CAT"),
    "product-detail": ("Sindoor Banarasi Silk Saree", "full", "NAV_CAT"),
    "cart": ("Shopping Bag", "full", ""),
    "wishlist": ("Wishlist", "full", ""),
    "checkout": ("Checkout", "slim", ""),
    "order-confirmation": ("Order Confirmed", "slim", ""),
    "login": ("Sign In", "slim", ""),
    "register": ("Create Account", "slim", ""),
    "account-orders": ("My Orders", "full", ""),
}

header = (ROOT / "partials" / "header.html").read_text()
footer = (ROOT / "partials" / "footer.html").read_text()

for name, (title, chrome, active) in PAGES.items():
    body = (ROOT / "pages" / f"{name}.html").read_text()
    hdr = header
    for token in ("NAV_HOME", "NAV_NEW", "NAV_BEST", "NAV_CAT", "NAV_ABOUT"):
        hdr = hdr.replace("{{%s}}" % token, "active" if token == active else "")
    parts = [HEAD.format(title=title)]
    parts.append(hdr if chrome == "full" else SLIM_HEADER)
    parts.append(body)
    parts.append(footer if chrome == "full" else SLIM_FOOTER)
    parts.append("</body>\n</html>\n")
    out = DIST / f"{name}.html"
    out.write_text("\n".join(parts))
    print(f"built {out.relative_to(ROOT)}")
