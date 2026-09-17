from pathlib import Path
import os
import psycopg

url = os.environ.get("SUPABASE_DB_URL")
if not url:
    raise SystemExit("SUPABASE_DB_URL is required")
query = Path(__file__).with_name("schema.postgres.sql").read_text()
with psycopg.connect(url, autocommit=False) as conn:
    with conn.cursor() as cur:
        cur.execute(query)
    conn.commit()
print("supabase schema applied")
