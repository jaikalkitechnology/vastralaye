"""Additive schema sync for no-migration deployments.

`Base.metadata.create_all` creates missing *tables* but never adds new
*columns* to tables that already exist — so every time a model gains a
field, inserts start failing with "Unknown column" on databases created
before the change. This module closes that gap at startup: for every
mapped table that already exists, any model column missing from the
database is added with `ALTER TABLE … ADD COLUMN`.

Strictly additive and conservative:
- never drops, renames or retypes anything;
- new columns are always added as NULLable (a NOT NULL column can't be
  added to a table that already has rows without a default), which keeps
  existing inserts working;
- failures are logged and skipped, never fatal to startup.

Disable with SCHEMA_AUTOSYNC=false if you manage migrations yourself.
"""

import logging
import os

from sqlalchemy import inspect, text

from app.database import Base, engine

log = logging.getLogger("schema_sync")


def sync_missing_columns() -> None:
    if os.getenv("SCHEMA_AUTOSYNC", "true").lower() == "false":
        return

    try:
        insp = inspect(engine)
        existing_tables = set(insp.get_table_names())
    except Exception as exc:  # DB unreachable — let the app surface that itself
        log.error("schema_sync: could not inspect database: %s", exc)
        return

    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue  # brand-new tables are create_all's job
        try:
            existing_cols = {c["name"] for c in insp.get_columns(table.name)}
        except Exception as exc:
            log.error("schema_sync: could not read columns of %s: %s", table.name, exc)
            continue

        for col in table.columns:
            if col.name in existing_cols:
                continue
            try:
                col_type = col.type.compile(engine.dialect)
            except Exception as exc:
                log.error("schema_sync: cannot compile type for %s.%s: %s", table.name, col.name, exc)
                continue

            ddl = f"ALTER TABLE {table.name} ADD COLUMN {col.name} {col_type} NULL"
            try:
                with engine.begin() as conn:
                    conn.execute(text(ddl))
                log.warning("schema_sync: added missing column %s.%s (%s)", table.name, col.name, col_type)
            except Exception as exc:
                log.error("schema_sync: failed to add %s.%s: %s", table.name, col.name, exc)
