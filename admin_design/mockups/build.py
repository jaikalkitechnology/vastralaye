#!/usr/bin/env python3
"""Assemble the Vastralaye admin mockup pages into standalone HTML files.

Wraps each body in pages/ with the shared head, sidebar and topbar,
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
<title>{title} — Vastralaye Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
<div class="shell">
"""

ICONS = {
    "dash":  '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/></svg>',
    "chart": '<svg class="i" viewBox="0 0 24 24"><path d="M4 19V5M4 19h16"/><path d="M8 15l4-5 3 3 5-7"/></svg>',
    "tag":   '<svg class="i" viewBox="0 0 24 24"><path d="M20 12l-8 8-8.5-8.5V4h7.5L20 12z"/><circle cx="7.8" cy="7.8" r="1.4"/></svg>',
    "folder":'<svg class="i" viewBox="0 0 24 24"><path d="M3 6a1.5 1.5 0 0 1 1.5-1.5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V6z"/></svg>',
    "ticket":'<svg class="i" viewBox="0 0 24 24"><path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3v3z"/><path d="M13 6v3M13 12v3M13 18v0"/></svg>',
    "box":   '<svg class="i" viewBox="0 0 24 24"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"/><path d="M3 7l9 5 9-5M12 12v10"/></svg>',
    "star":  '<svg class="i" viewBox="0 0 24 24"><path d="M12 3l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7L12 3z"/></svg>',
    "users": '<svg class="i" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c0-3.6 3-5.5 6.5-5.5s6.5 1.9 6.5 5.5"/><path d="M16 5.6a3.5 3.5 0 0 1 0 5.8M18.5 14.7c2 .8 3 2.5 3 5.3"/></svg>',
    "mail":  '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    "gear":  '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
    "ext":   '<svg class="i" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M20 14v5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1.5-1.5H10"/></svg>',
    "out":   '<svg class="i" viewBox="0 0 24 24"><path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M15 16l4-4-4-4M19 12H9"/></svg>',
    "search":'<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>',
    "bell":  '<svg class="i" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>',
    "plus":  '<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    "up":    '<svg class="i" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
}

NAV = [
    ("sec", "Overview"),
    ("dashboard", "dash", "Dashboard", ""),
    ("analytics", "chart", "Analytics", ""),
    ("sec", "Catalog"),
    ("products", "tag", "Products", "312"),
    ("categories", "folder", "Categories", "18"),
    ("coupons", "ticket", "Coupons", ""),
    ("sec", "Sales"),
    ("orders", "box", "Orders", "23"),
    ("reviews", "star", "Reviews", "9"),
    ("sec", "Customers"),
    ("users", "users", "Users", ""),
    ("support", "mail", "Support", "4"),
]

def sidebar(active: str) -> str:
    out = ['<aside class="sidebar">',
           '<div class="sb-logo"><div class="logo">Vastra<span>laye</span><small>Handcrafted India</small></div>'
           '<span class="panel-tag">Admin Panel</span></div>',
           '<nav class="sb-nav">']
    for item in NAV:
        if item[0] == "sec":
            out.append(f'<div class="sb-sec">{item[1]}</div>')
        else:
            key, icon, label, cnt = item
            on = " on" if key == active else ""
            cnt_html = f'<span class="cnt">{cnt}</span>' if cnt else ""
            out.append(f'<a class="sb-item{on}" href="#">{ICONS[icon]}{label}{cnt_html}</a>')
    out.append('</nav>')
    out.append('<div class="sb-foot">'
               f'<a class="sb-item" href="#">{ICONS["ext"]}View store</a>'
               f'<a class="sb-item" href="#">{ICONS["gear"]}Settings</a>'
               f'<a class="sb-item" href="#">{ICONS["out"]}Logout</a>'
               '<div class="sb-admin"><span class="av">AV</span><div><b>Admin User</b><small>admin@vastralaye.in</small></div></div>'
               '</div></aside>')
    return "\n".join(out)

def topbar(title: str, context: str, action: str) -> str:
    action_html = f'<a class="abtn" href="#">{ICONS["plus"]}{action}</a>' if action else ""
    return (f'<header class="topbar"><div class="tb-title"><h1>{title}</h1><small>{context}</small></div>'
            f'<div class="tb-search">{ICONS["search"]}Search orders, products, customers…<kbd>⌘K</kbd></div>'
            f'{action_html}'
            f'<span class="tb-bell">{ICONS["bell"]}<i></i></span>'
            '<div class="tb-user"><span class="av">AV</span><div><b>Admin User</b><small>Super admin</small></div></div>'
            '</header>')

# page -> (title, topbar context, topbar action label or "")
PAGES = {
    "dashboard":  ("Dashboard", "Friday, 8 Aug 2026 · here's how the store is doing", ""),
    "orders":     ("Orders", "1,284 orders · 23 need attention", "Export CSV"),
    "products":   ("Products", "312 products across 18 categories", "Add Product"),
    "analytics":  ("Analytics", "Store performance · last 12 months", ""),
    "coupons":    ("Coupons", "6 active campaigns", "Create Coupon"),
    "users":      ("Users", "8,214 registered customers", ""),
    "reviews":    ("Reviews", "1,046 reviews · 9 awaiting reply", ""),
    "categories": ("Categories", "18 categories · 42 subcategories", "Add Category"),
}

for name, (title, context, action) in PAGES.items():
    body = (ROOT / "pages" / f"{name}.html").read_text()
    html = "\n".join([
        HEAD.format(title=title),
        sidebar(name),
        '<div class="main">',
        topbar(title, context, action),
        '<div class="canvas">',
        body,
        '</div></div></div>',
        "</body>\n</html>",
    ])
    (DIST / f"{name}.html").write_text(html)
    print(f"built dist/{name}.html")
