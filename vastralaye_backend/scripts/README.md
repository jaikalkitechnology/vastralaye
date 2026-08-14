# scripts

## `import_sql.py` — load a `.sql` dump into a database

Imports a mysqldump file. The database defaults to **`Vastralaye_db`** and is
created (`utf8mb4` / `utf8mb4_unicode_ci`) if it isn't there.

```bash
# simplest — reads DATABASE_URL from the environment, prompts for anything missing
python scripts/import_sql.py backup.sql

# a remote server, with a safety copy of what's currently there
DB_PASSWORD=secret python scripts/import_sql.py backup.sql \
    --host db.example.com --user vastra --backup-first

# see what's in the file without connecting to anything
python scripts/import_sql.py backup.sql --dry-run
```

Requires `pymysql`, which is already in `requirements.txt` — activate the
project's virtualenv first.

### Where the connection comes from

Command line first, then `DATABASE_URL` (the same variable the app reads, so a
configured machine needs no arguments), then `DB_HOST` / `DB_PORT` / `DB_USER` /
`DB_PASSWORD`. With none of them set it prompts for the password.

Prefer `DB_PASSWORD` or the prompt over `--password`: an argument is visible in
`ps` and in your shell history.

### Options

| Option | |
|---|---|
| `--database`, `-d` | target database (default `Vastralaye_db`) |
| `--host`, `--port`, `--user`, `--password` | connection |
| `--dry-run` | parse and report; connect to nothing, change nothing |
| `--yes`, `-y` | skip the overwrite confirmation (for scripts) |
| `--backup-first [PATH]` | `mysqldump` the target before importing |
| `--no-create-db` | fail instead of creating a missing database |

Exit codes: `0` imported, `1` refused or failed, `2` bad file.

### If the database already has tables

It lists them, says how many `DROP TABLE` statements the dump is about to run,
and asks you to type the database name — not `y`. The guard is there for the
case where the `--host` is wrong, and typing the name of the database you meant
is the thing a wrong host can't survive.

### After importing

Point the app at it and restart:

```
DATABASE_URL=mysql+pymysql://user:password@host/Vastralaye_db
```

An older dump won't have the tables newer features need. On startup the backend
creates them and adds any missing columns (`app/schema_sync.py`); existing rows
are left alone and new columns arrive as `NULL`.

### Don't commit dumps

A dump of this database carries real customer records and password hashes. Keep
the `.sql` file outside the repository.
