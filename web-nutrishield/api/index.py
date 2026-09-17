"""Vercel Python Function entrypoint.

The API is intentionally stateless here. Long-running agent work is queued in
Supabase and executed by the VPS worker.
"""
from backend.app.main import create_app

app = create_app(start_worker=False)
