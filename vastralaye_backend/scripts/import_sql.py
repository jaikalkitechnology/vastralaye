#!/usr/bin/env python3
"""
Load a mysqldump file into a database — by default `Vastralaye_db`.

    python scripts/import_sql.py backup.sql
    python scripts/import_sql.py backup.sql --database Vastralaye_db --host db.example.com

Connection details come from the command line, then `DATABASE_URL` (the same
variable the app uses), then `DB_*` environment variables. A password given on
the command line is visible in `ps` and your shell history, so prefer
`DB_PASSWORD` or the interactive prompt.

WHY NOT JUST `mysql < backup.sql`: nothing, if you have the client installed and
shell access. This exists for the machines where you don't, and it adds the
things a bare pipe won't do — creating the database with the right charset,
refusing to overwrite data you didn't mean to overwrite, taking a safety copy
first, and telling you what actually landed.

WHY NOT `sql.split(";")`: because it silently corrupts real dumps. This one
contains a product description reading "Semi cut away collar; Cuff style -
Single cuff" — splitting on that semicolon cuts an INSERT in half and the rest
of the row becomes garbage. The scanner below tracks quotes, escapes, comments
and backticks so a delimiter inside a literal is just text.
"""

from __future__ import annotations

import argparse
import getpass
import os
import re
import subprocess
import sys
import textwrap
import time
from datetime import datetime
from typing import Iterator, Optional
from urllib.parse import unquote, urlparse

try:
    import pymysql
except ImportError:  # pragma: no cover - the message is the point
    sys.exit(
        "PyMySQL is required.\n"
        "    pip install pymysql\n"
        "(it's already in requirements.txt — activate the project's venv)"
    )


DEFAULT_DATABASE = "Vastralaye_db"
DEFAULT_CHARSET = "utf8mb4"
DEFAULT_COLLATION = "utf8mb4_unicode_ci"

# Tables the app declares (app/models). Listed here rather than imported so the
# script stays standalone — it must run on a machine where the app's own
# dependencies aren't installed. Used only to tell you afterwards what the
# backend will add on its next start; nothing is created from it.
APP_TABLES = {
    "addresses", "cart_items", "categories", "contact_messages", "coupons",
    "email_settings", "email_verification_tokens", "hero_banners",
    "invoice_items", "invoices", "newsletter_subscribers", "order_items",
    "order_tracking", "orders", "page_banners", "password_reset_tokens",
    "product_review_replies", "product_reviews", "products", "reels",
    "site_settings", "subcategories", "support_messages", "testimonials",
    "user_settings", "users", "wishlist_items",
}


# --------------------------------------------------------------- splitting --

def split_statements(sql: str) -> Iterator[str]:
    """Yield complete SQL statements from a dump.

    A hand-rolled scanner rather than a regex, because the delimiter has to be
    ignored inside:

      'single quoted'   with '' and \\' escapes
      "double quoted"   with "" and \\" escapes
      `back quoted`     identifiers
      -- line comments  and  # line comments
      /* block comments */

    MySQL's version-gated comments (`/*!40101 SET ... */;`) are deliberately
    NOT treated as comments — the server executes them, so they are kept and
    sent as statements like anything else.
    """
    buf: list[str] = []
    i, n = 0, len(sql)
    quote: Optional[str] = None       # "'", '"' or "`" while inside a literal
    in_line_comment = False
    in_block_comment = False

    while i < n:
        ch = sql[i]
        nxt = sql[i + 1] if i + 1 < n else ""

        if in_line_comment:
            buf.append(ch)
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            buf.append(ch)
            if ch == "*" and nxt == "/":
                buf.append(nxt)
                i += 2
                in_block_comment = False
                continue
            i += 1
            continue

        if quote:
            buf.append(ch)
            # Backslash escapes the next character (MySQL's default mode).
            if ch == "\\" and quote in "\"'":
                if i + 1 < n:
                    buf.append(nxt)
                    i += 2
                    continue
            elif ch == quote:
                # A doubled quote is a literal quote, not the end.
                if nxt == quote:
                    buf.append(nxt)
                    i += 2
                    continue
                quote = None
            i += 1
            continue

        # Not inside anything: look for the things that start something.
        if ch in "\"'`":
            quote = ch
            buf.append(ch)
            i += 1
            continue

        if ch == "-" and nxt == "-" and (i + 2 >= n or sql[i + 2] in " \t\r\n"):
            in_line_comment = True
            buf.append(ch)
            i += 1
            continue

        if ch == "#":
            in_line_comment = True
            buf.append(ch)
            i += 1
            continue

        # `/*!40101 ...*/` is executable, a plain `/* ... */` is not — but both
        # are skipped over the same way; only the statement text differs.
        if ch == "/" and nxt == "*":
            in_block_comment = True
            buf.append(ch)
            buf.append(nxt)
            i += 2
            continue

        if ch == ";":
            statement = "".join(buf).strip()
            if statement:
                yield statement
            buf = []
            i += 1
            continue

        buf.append(ch)
        i += 1

    tail = "".join(buf).strip()
    if tail:
        yield tail


# Leading comments and blank space, but NOT `/*!…*/` — that one is executable.
# Each alternative must consume at least one character so the `+` can't spin.
_LEADING_NOISE = re.compile(
    r"^\s*(?:--[^\n]*(?:\n|$)|\#[^\n]*(?:\n|$)|/\*(?!!)[\s\S]*?\*/|\s)+"
)


def strip_leading_comments(statement: str) -> str:
    """The statement with its comment header removed.

    mysqldump captions every table, so the statement text really starts like
    this — the keyword is on line 5:

        --
        -- Table structure for table `addresses`
        --

        DROP TABLE IF EXISTS `addresses`

    Anything asking *what a statement is* has to look past that first. Match
    the raw text and every DROP in a mysqldump reads as unrecognised.
    """
    return _LEADING_NOISE.sub("", statement)


def is_executable(statement: str) -> bool:
    """False for statements that are only comments or whitespace."""
    return bool(strip_leading_comments(statement).strip())


def statements_matching(statements: list, pattern: str) -> list:
    """Statements whose opening keyword matches, ignoring the comment header."""
    rx = re.compile(pattern, re.I)
    return [s for s in statements if rx.match(strip_leading_comments(s))]


# ------------------------------------------------------------ connection --

def connection_defaults() -> dict:
    """Fall back to DATABASE_URL, then DB_* — the app's own settings first."""
    out = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "3306")),
        "user": os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD"),
        "database": None,
    }
    url = os.getenv("DATABASE_URL", "")
    if url.startswith("mysql"):
        parsed = urlparse(url)
        if parsed.hostname:
            out["host"] = parsed.hostname
        if parsed.port:
            out["port"] = parsed.port
        if parsed.username:
            out["user"] = unquote(parsed.username)
        if parsed.password:
            out["password"] = unquote(parsed.password)
        if parsed.path and len(parsed.path) > 1:
            out["database"] = parsed.path.lstrip("/")
    return out


def connect(host: str, port: int, user: str, password: str, database: Optional[str] = None):
    return pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        charset=DEFAULT_CHARSET,
        autocommit=True,
        # The dump has one 226KB line; the default 16MB packet is ample, but be
        # explicit so a server configured smaller fails loudly here instead of
        # halfway through an INSERT.
        max_allowed_packet=64 * 1024 * 1024,
        connect_timeout=15,
    )


# ---------------------------------------------------------------- helpers --

def quote_ident(name: str) -> str:
    """Backtick-quote an identifier, rejecting anything that can't be one."""
    if not re.fullmatch(r"[A-Za-z0-9_$]+", name or ""):
        raise SystemExit(f"Refusing to use {name!r} as a database name.")
    return f"`{name}`"


# ------------------------------------------------------------ collations --

# `COLLATE=x` (table option) and `COLLATE x` (column) — both shapes mysqldump
# emits. Capturing the keyword lets the same pattern do the rewrite.
_COLLATE_RE = re.compile(r"(COLLATE\s*=?\s*)([A-Za-z0-9_]+)", re.I)


def dump_collations(sql: str) -> set:
    """Every collation the dump asks for."""
    return {m.group(2).lower() for m in _COLLATE_RE.finditer(sql)}


def server_collations(conn) -> set:
    with conn.cursor() as cur:
        cur.execute("SELECT collation_name FROM information_schema.collations")
        return {r[0].lower() for r in cur.fetchall()}


def apply_collation_map(statement: str, mapping: dict) -> str:
    """Rewrite collation names in a CREATE — and only in a CREATE.

    Restricted to DDL so a collation name that happens to appear inside a row
    of text can never be rewritten. `INSERT` statements are left untouched.
    """
    if not mapping or not re.match(r"CREATE\s", strip_leading_comments(statement), re.I):
        return statement

    def swap(m):
        return m.group(1) + mapping.get(m.group(2).lower(), m.group(2))

    return _COLLATE_RE.sub(swap, statement)


def parse_collation_map(pairs: list) -> dict:
    """`--map-collation old=new` → {old: new}."""
    mapping = {}
    for pair in pairs or []:
        if "=" not in pair:
            raise SystemExit(f"--map-collation wants OLD=NEW, got {pair!r}")
        old, new = pair.split("=", 1)
        if not re.fullmatch(r"[A-Za-z0-9_]+", new.strip()):
            raise SystemExit(f"Not a collation name: {new!r}")
        mapping[old.strip().lower()] = new.strip()
    return mapping


def existing_tables(conn, database: str) -> list:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
            (database,),
        )
        return sorted(r[0] for r in cur.fetchall())


def dump_existing(host, port, user, password, database, out_path) -> bool:
    """Safety copy before overwriting. Needs mysqldump; skipped if absent."""
    cmd = [
        "mysqldump", f"--host={host}", f"--port={port}", f"--user={user}",
        "--single-transaction", "--routines", "--triggers", database,
    ]
    env = dict(os.environ, MYSQL_PWD=password or "")   # not in the process list
    try:
        with open(out_path, "wb") as fh:
            subprocess.run(cmd, stdout=fh, stderr=subprocess.PIPE, env=env, check=True)
    except FileNotFoundError:
        print("  ! mysqldump not installed — no safety copy taken")
        return False
    except subprocess.CalledProcessError as exc:
        print(f"  ! mysqldump failed: {exc.stderr.decode(errors='replace').strip()[:200]}")
        return False
    size = os.path.getsize(out_path)
    print(f"  ✓ safety copy: {out_path} ({size / 1024:.0f} KB)")
    return True


def human(seconds: float) -> str:
    return f"{seconds:.1f}s" if seconds < 60 else f"{seconds / 60:.1f}m"


# ------------------------------------------------------------------- main --

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Import a mysqldump file into a MySQL database.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python scripts/import_sql.py backup.sql\n"
            "  python scripts/import_sql.py backup.sql --database Vastralaye_db\n"
            "  DB_PASSWORD=secret python scripts/import_sql.py backup.sql --host 1.2.3.4 --yes\n"
            "  python scripts/import_sql.py backup.sql --dry-run\n"
        ),
    )
    ap.add_argument("file", help="path to the .sql dump")
    d = connection_defaults()
    ap.add_argument("--database", "-d", default=d["database"] or DEFAULT_DATABASE,
                    help=f"target database (default: {d['database'] or DEFAULT_DATABASE})")
    ap.add_argument("--host", default=d["host"], help=f"(default: {d['host']})")
    ap.add_argument("--port", type=int, default=d["port"], help=f"(default: {d['port']})")
    ap.add_argument("--user", "-u", default=d["user"], help=f"(default: {d['user']})")
    ap.add_argument("--password", "-p", default=None,
                    help="prefer DB_PASSWORD; a password here is visible in `ps`")
    ap.add_argument("--yes", "-y", action="store_true",
                    help="don't ask before overwriting an existing database")
    ap.add_argument("--dry-run", action="store_true",
                    help="parse and report, connect to nothing, change nothing")
    ap.add_argument("--no-create-db", action="store_true",
                    help="fail if the database doesn't already exist")
    ap.add_argument("--backup-first", metavar="PATH", nargs="?", const="auto",
                    help="mysqldump the target before importing")
    ap.add_argument("--map-collation", metavar="OLD=NEW", action="append",
                    help="rewrite a collation the server lacks, e.g. "
                         "utf8mb4_0900_ai_ci=utf8mb4_unicode_ci (repeatable)")
    args = ap.parse_args()

    # ---------------------------------------------------------------- read --
    if not os.path.isfile(args.file):
        return print(f"No such file: {args.file}") or 2
    with open(args.file, "r", encoding="utf-8", errors="replace") as fh:
        sql = fh.read()

    size_kb = len(sql.encode("utf-8")) / 1024
    statements = [s for s in split_statements(sql) if is_executable(s)]
    creates = statements_matching(statements, r"CREATE\s+TABLE")
    inserts = statements_matching(statements, r"INSERT\s+(?:IGNORE\s+)?INTO")
    drops = statements_matching(statements, r"DROP\s+TABLE")
    tables = sorted({
        m.group(1) for s in creates
        for m in [re.search(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_$]+)`?", s, re.I)]
        if m
    })

    print(f"\n  file        {args.file}  ({size_kb:.0f} KB)")
    print(f"  statements  {len(statements)}  "
          f"({len(creates)} CREATE TABLE, {len(inserts)} INSERT, {len(drops)} DROP TABLE)")
    print(f"  tables      {', '.join(tables) if tables else '(none)'}")
    print(f"  collations  {', '.join(sorted(dump_collations(sql))) or '(server default)'}")
    print(f"  target      {args.user}@{args.host}:{args.port} → {args.database}")

    mapping = parse_collation_map(args.map_collation)

    if args.dry_run:
        print("\n  --dry-run: nothing was connected to and nothing was changed.\n")
        return 0
    if not statements:
        print("\n  Nothing to run — the file has no SQL statements.\n")
        return 2

    password = args.password if args.password is not None else os.getenv("DB_PASSWORD")
    if password is None:
        password = getpass.getpass(f"  password for {args.user}@{args.host}: ")

    # ------------------------------------------------------------- connect --
    try:
        server = connect(args.host, args.port, args.user, password)
    except pymysql.err.OperationalError as exc:
        code = exc.args[0] if exc.args else 0
        hint = {
            1045: "check the username and password",
            2003: "is MySQL running, and is the port open from here?",
            1049: "the database does not exist",
        }.get(code, "")
        print(f"\n  Could not connect: {exc.args[-1]}")
        if hint:
            print(f"  → {hint}")
        return 1

    # ------------------------------------------------------------ preflight --
    # Before anything is written. A dump from MySQL 8 can carry
    # utf8mb4_0900_ai_ci, which MySQL 5.7 and MariaDB don't have; without this
    # check the run dies on the first such CREATE TABLE and leaves the database
    # half-loaded. Cheaper to find out now.
    with server.cursor() as cur:
        cur.execute("SELECT VERSION()")
        server_version = cur.fetchone()[0]
    supported = server_collations(server)
    wanted = {mapping.get(c, c).lower() for c in dump_collations(sql)}
    unsupported = sorted(wanted - supported)

    print(f"  server      MySQL {server_version}")
    if mapping:
        for old, new in mapping.items():
            print(f"  mapping     {old} → {new}")

    if unsupported:
        print(f"\n  This server does not support: {', '.join(unsupported)}")
        print("  The dump asks for them, so the import would fail partway and\n"
              "  leave the database half-loaded. Nothing has been changed.\n")
        for name in unsupported:
            suggestion = ("utf8mb4_unicode_ci" if name.startswith("utf8mb4")
                          else "utf8_general_ci")
            if suggestion in supported:
                print(f"  Either upgrade the server, or re-run with:\n"
                      f"      --map-collation {name}={suggestion}")
                break
        else:
            print("  Upgrade the server, or import onto one that has them.")
        print("\n  A mapped collation changes sorting and comparison rules for\n"
              "  text, not the text itself. utf8mb4_unicode_ci is the collation\n"
              "  the other 21 tables in this schema already use.\n")
        server.close()
        return 1

    db_quoted = quote_ident(args.database)
    with server.cursor() as cur:
        cur.execute("SELECT SCHEMA_NAME FROM information_schema.schemata "
                    "WHERE SCHEMA_NAME = %s", (args.database,))
        db_exists = cur.fetchone() is not None

    if not db_exists:
        if args.no_create_db:
            print(f"\n  Database {args.database} does not exist (and --no-create-db was given).")
            return 1
        with server.cursor() as cur:
            cur.execute(f"CREATE DATABASE {db_quoted} "
                        f"CHARACTER SET {DEFAULT_CHARSET} COLLATE {DEFAULT_COLLATION}")
        print(f"\n  ✓ created database {args.database} "
              f"({DEFAULT_CHARSET}/{DEFAULT_COLLATION})")
    else:
        present = existing_tables(server, args.database)
        if present:
            print(f"\n  ! {args.database} already has {len(present)} table(s): "
                  f"{', '.join(present[:6])}{'…' if len(present) > 6 else ''}")
            print(f"  ! this dump starts with {len(drops)} DROP TABLE — that data will be replaced")
            if not args.yes:
                # Typing the database name, not just "y" — the point is to make
                # overwriting the wrong server take a deliberate act.
                typed = input(f"  type the database name to continue ({args.database}): ").strip()
                if typed != args.database:
                    print("  Aborted; nothing was changed.")
                    return 1

    if args.backup_first and db_exists:
        path = args.backup_first
        if path == "auto":
            path = f"{args.database}-before-import-{datetime.now():%Y%m%d-%H%M%S}.sql"
        dump_existing(args.host, args.port, args.user, password, args.database, path)

    server.close()

    # -------------------------------------------------------------- import --
    conn = connect(args.host, args.port, args.user, password, args.database)
    print(f"\n  importing {len(statements)} statements…")
    started = time.time()
    done = 0
    try:
        with conn.cursor() as cur:
            for index, statement in enumerate(statements, 1):
                statement = apply_collation_map(statement, mapping)
                try:
                    cur.execute(statement)
                except Exception as exc:  # noqa: BLE001 - report and stop
                    head = " ".join(statement.split())[:140]
                    print(f"\n  ✗ statement {index} failed: {exc}")
                    print(f"    {head}…")
                    print(f"\n  Stopped after {done} successful statement(s). "
                          f"{args.database} is part-imported — fix the cause and re-run.")
                    return 1
                done += 1
                if index % 25 == 0 or index == len(statements):
                    print(f"    {index}/{len(statements)}", end="\r", flush=True)
    finally:
        conn.close()

    elapsed = time.time() - started
    print(f"    {done}/{len(statements)} statements in {human(elapsed)}          ")

    # -------------------------------------------------------------- verify --
    conn = connect(args.host, args.port, args.user, password, args.database)
    print(f"\n  {args.database} now contains:")
    total = 0
    landed = existing_tables(conn, args.database)
    with conn.cursor() as cur:
        for table in landed:
            cur.execute(f"SELECT COUNT(*) FROM {quote_ident(table)}")
            count = cur.fetchone()[0]
            total += count
            print(f"    {table:<32} {count:>8,} row(s)")
    conn.close()
    print(f"    {'':<32} {total:>8,} rows total")

    missing = sorted(APP_TABLES - set(landed))

    port_part = "" if args.port == 3306 else f":{args.port}"
    print(
        "\n  Done. Next:\n"
        "    1. Point the app at it — in vastralaye_backend/.env:\n"
        f"       DATABASE_URL=mysql+pymysql://{args.user}:<password>@{args.host}{port_part}/{args.database}"
    )
    if missing:
        shown = ", ".join(missing[:4])
        if len(missing) > 4:
            shown += f" and {len(missing) - 4} more"
        body = (
            f"Restart the backend. This dump predates {len(missing)} table(s) the app "
            f"expects ({shown}), so startup creates them and adds any missing columns "
            "— see app/schema_sync.py. Existing rows are left alone; new columns "
            "arrive as NULL."
        )
        print(textwrap.fill(body, width=74,
                            initial_indent="    2. ", subsequent_indent="       "))
    else:
        print(
            "    2. Restart the backend. Every table the app expects is already\n"
            "       here, so startup only fills in columns this dump predates, if\n"
            "       any — see app/schema_sync.py. Existing rows are left alone."
        )
    print()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n  Interrupted.")
        sys.exit(130)
