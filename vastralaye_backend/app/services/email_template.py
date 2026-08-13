"""
The house style for Vastralaye's transactional email.

Email is not the web. Every rule the storefront relies on — flexbox, custom
properties, a stylesheet, web fonts — is unavailable or unreliable across
Outlook, Gmail's proxy and Apple Mail, so this is deliberately old-fashioned:
nested tables for layout, every style inline, no external asset of any kind.
The palette and proportions are the site's; the plumbing is 2003's.

Compose with the block helpers and hand the result to `render_email`. All of
them escape their input, because the text flowing through here is written by
customers and by admins typing into a textarea — never trusted markup.
"""

from typing import Iterable, List, Optional

# The storefront palette (design.md §1), repeated as literals because email
# has no custom properties.
IVORY = "#FAF6F0"
ESPRESSO = "#2B1B12"
MAROON = "#7A1F2B"
GOLD = "#C99A45"
GOLD_DEEP = "#8A6414"
SAND = "#EFE7DB"
MUTED = "#8A7A6D"
WHITE = "#FFFFFF"

# Georgia is the closest thing to the site's Fraunces that is actually
# installed on the machines reading this; the stack degrades to any serif.
SERIF = "Georgia,'Times New Roman',serif"
SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

CONTENT_WIDTH = 600


def esc(value: Optional[str]) -> str:
    """Escape for HTML. Everything user-supplied passes through this."""
    return (
        (value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _nl2br(value: str) -> str:
    """Newlines are meaningful in a typed message; `white-space` is not reliable."""
    return esc(value).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br>")


# ------------------------------------------------------------------ blocks --

def paragraph(text: str, *, muted: bool = False, size: int = 15) -> str:
    colour = MUTED if muted else ESPRESSO
    return (
        f'<p style="margin:0 0 16px;font-family:{SANS};font-size:{size}px;'
        f'line-height:1.65;color:{colour}">{_nl2br(text)}</p>'
    )


def heading(text: str) -> str:
    return (
        f'<h1 style="margin:0 0 18px;font-family:{SERIF};font-size:22px;'
        f'font-weight:500;line-height:1.3;color:{ESPRESSO}">{esc(text)}</h1>'
    )


def ornament() -> str:
    """The site's gold rule + diamond, as a table because borders travel better."""
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" '
        'style="margin:28px 0"><tr>'
        f'<td style="width:44px;border-top:1px solid {GOLD};font-size:0;line-height:0">&nbsp;</td>'
        f'<td style="padding:0 10px;font-size:14px;line-height:1;color:{GOLD}">&#9670;</td>'
        f'<td style="width:44px;border-top:1px solid {GOLD};font-size:0;line-height:0">&nbsp;</td>'
        "</tr></table>"
    )


def signoff(name: str) -> str:
    return (
        f'<p style="margin:0;font-family:{SERIF};font-size:16px;color:{MAROON}">'
        f"&mdash; {esc(name)}</p>"
    )


def quote(label: str, text: str, meta: Optional[str] = None) -> str:
    """A quoted earlier message: gold rule on the left, quieter type."""
    meta_html = (
        f'<div style="margin:0 0 8px;font-family:{SANS};font-size:11px;'
        f'letter-spacing:.08em;text-transform:uppercase;color:{MUTED}">{esc(meta)}</div>'
        if meta
        else ""
    )
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" '
        f'style="margin:8px 0 0;background:{IVORY};border-left:3px solid {GOLD}"><tr>'
        '<td style="padding:16px 18px">'
        f'<div style="margin:0 0 6px;font-family:{SANS};font-size:11px;font-weight:700;'
        f'letter-spacing:.14em;text-transform:uppercase;color:{GOLD_DEEP}">{esc(label)}</div>'
        f"{meta_html}"
        f'<div style="font-family:{SANS};font-size:14px;line-height:1.6;color:{MUTED}">'
        f"{_nl2br(text)}</div>"
        "</td></tr></table>"
    )


def details(rows: Iterable[tuple]) -> str:
    """Label/value pairs — the shape an internal notification wants."""
    cells = "".join(
        '<tr>'
        f'<td style="padding:5px 16px 5px 0;font-family:{SANS};font-size:11px;font-weight:700;'
        f'letter-spacing:.12em;text-transform:uppercase;color:{MUTED};white-space:nowrap;'
        f'vertical-align:top">{esc(str(label))}</td>'
        f'<td style="padding:5px 0;font-family:{SANS};font-size:14px;color:{ESPRESSO}">'
        f"{value}</td></tr>"
        for label, value in rows
    )
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 0 20px">{cells}</table>'
    )


def mailto(address: str) -> str:
    """A value for `details` — clickable, and escaped both as text and as href."""
    safe = esc(address)
    return f'<a href="mailto:{safe}" style="color:{MAROON};text-decoration:underline">{safe}</a>'


# ------------------------------------------------------------------- shell --

def render_email(
    *,
    preheader: str,
    blocks: List[str],
    footer_lines: Optional[List[str]] = None,
    brand: str = "Vastralaye",
    tagline: str = "Handcrafted India",
) -> str:
    """Wrap composed blocks in the branded shell.

    `preheader` is the grey line an inbox shows next to the subject. Left out,
    clients scrape the first thing they find — usually "Hi <name>," which tells
    the reader nothing about whether the mail is worth opening.
    """
    footer_html = "".join(
        f'<p style="margin:0 0 6px;font-family:{SANS};font-size:12px;'
        f'line-height:1.6;color:{MUTED}">{line}</p>'
        for line in (footer_lines or [])
    )

    return f"""<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<!-- Tell clients we've painted our own colours; without it some auto-invert
     the whole thing and the maroon header turns an unrelated pastel. -->
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>{esc(brand)}</title>
</head>
<body style="margin:0;padding:0;background:{SAND};-webkit-text-size-adjust:100%">

<!-- Preheader: shown in the inbox list, never on the page. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;
            mso-hide:all;font-size:1px;line-height:1px;color:{SAND}">{esc(preheader)}
&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
       style="background:{SAND}">
  <tr>
    <td align="center" style="padding:28px 12px">

      <table role="presentation" cellpadding="0" cellspacing="0" border="0"
             width="{CONTENT_WIDTH}" style="width:100%;max-width:{CONTENT_WIDTH}px">

        <!-- Masthead -->
        <tr>
          <td align="center"
              style="background:{MAROON};padding:26px 24px;border-bottom:3px solid {GOLD}">
            <div style="font-family:{SERIF};font-size:27px;font-weight:600;
                        letter-spacing:.01em;color:{IVORY};line-height:1">
              Vastra<span style="color:{GOLD}">laye</span>
            </div>
            <div style="margin-top:8px;font-family:{SANS};font-size:9px;font-weight:600;
                        letter-spacing:.42em;text-transform:uppercase;color:{GOLD}">
              {esc(tagline)}
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:{WHITE};padding:32px 30px 28px">
            {''.join(blocks)}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center"
              style="background:{IVORY};padding:20px 26px;border-top:1px solid {SAND}">
            {footer_html}
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>"""
